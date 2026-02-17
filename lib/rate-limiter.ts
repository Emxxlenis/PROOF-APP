/**
 * In-Memory Rate Limiter for API Protection
 *
 * Implements sliding window rate limiting to prevent API quota exhaustion.
 * Designed primarily for Gemini API Free Tier limits but configurable
 * for any rate-limited service.
 *
 * Default limits (Gemini Free Tier):
 * - 15 requests per minute
 * - 1,500 requests per day
 *
 * @remarks
 * - Uses in-memory storage (resets on server restart)
 * - Automatic cleanup prevents memory leaks
 * - Not suitable for distributed/multi-instance deployments
 *
 * @module lib/rate-limiter
 */

/**
 * Internal storage structure for rate limit tracking.
 * @internal
 */
interface RateLimitEntry {
  /** Timestamps of requests within the last minute */
  minute: number[];
  /** Timestamps of requests within the last 24 hours */
  day: number[];
}

/**
 * Result of a rate limit check.
 */
interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds until rate limit resets (if blocked) */
  retryAfter?: number;
  /** Number of remaining requests allowed */
  remaining: number;
  /** Which limit was hit ('minute' or 'day') */
  limit: string;
}

/**
 * Configuration options for the rate limiter.
 */
interface RateLimitConfig {
  /** Maximum requests allowed per minute */
  minuteLimit: number;
  /** Maximum requests allowed per day (24 hours) */
  dayLimit: number;
}

/**
 * In-memory rate limiter using sliding window algorithm.
 *
 * @remarks
 * Algorithm: Sliding window counter
 * - Maintains arrays of request timestamps per identifier
 * - Filters expired timestamps on each check (O(n) per check)
 * - Automatic cleanup every 5 minutes to prevent memory growth
 *
 * Thread Safety:
 * - Safe for single Node.js instance (event loop serialization)
 * - NOT safe for multi-instance/cluster deployments
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ minuteLimit: 10, dayLimit: 100 });
 *
 * const result = limiter.check('user:123');
 * if (!result.allowed) {
 *   throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
 * }
 * ```
 */
export class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new rate limiter instance.
   *
   * @param config - Rate limit configuration (defaults to Gemini Free Tier limits)
   */
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      minuteLimit: config.minuteLimit ?? 15,
      dayLimit: config.dayLimit ?? 1500,
    };

    this.startCleanup();
  }

  /**
   * Checks if a request is allowed and records it if so.
   *
   * @param identifier - Unique identifier (user ID, IP address, or composite key)
   * @param _type - Rate limit type (reserved for future multi-type support)
   * @returns Rate limit check result with remaining quota
   *
   * @remarks
   * Time complexity: O(n) where n = number of timestamps in sliding window
   * This is acceptable since n is bounded by minuteLimit and dayLimit.
   */
  check(identifier: string, _type: 'gemini' = 'gemini'): RateLimitResult {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    let entry = this.storage.get(identifier);
    if (!entry) {
      entry = { minute: [], day: [] };
      this.storage.set(identifier, entry);
    }

    // Prune expired timestamps (sliding window)
    entry.minute = entry.minute.filter(timestamp => timestamp > minuteAgo);
    entry.day = entry.day.filter(timestamp => timestamp > dayAgo);

    // Check minute limit first (more likely to be hit)
    if (entry.minute.length >= this.config.minuteLimit) {
      const oldestInMinute = Math.min(...entry.minute);
      const retryAfter = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
        limit: 'minute',
      };
    }

    // Check daily limit
    if (entry.day.length >= this.config.dayLimit) {
      const oldestInDay = Math.min(...entry.day);
      const retryAfter = Math.ceil((oldestInDay + 24 * 60 * 60 * 1000 - now) / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfter),
        remaining: 0,
        limit: 'day',
      };
    }

    // Record the request
    entry.minute.push(now);
    entry.day.push(now);

    const remaining = Math.min(
      this.config.minuteLimit - entry.minute.length,
      this.config.dayLimit - entry.day.length
    );

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      limit: entry.minute.length >= this.config.minuteLimit ? 'minute' : 'day',
    };
  }

  /**
   * Removes stale entries to prevent memory leaks.
   *
   * @remarks
   * Called automatically every 5 minutes.
   * Removes entries with no recent requests.
   *
   * @internal
   */
  private cleanup(): void {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    for (const [identifier, entry] of this.storage.entries()) {
      entry.minute = entry.minute.filter(timestamp => timestamp > now - 60 * 1000);
      entry.day = entry.day.filter(timestamp => timestamp > dayAgo);

      // Remove entry if no recent activity
      if (entry.minute.length === 0 && entry.day.length === 0) {
        this.storage.delete(identifier);
      }
    }
  }

  /**
   * Starts automatic cleanup interval.
   * @internal
   */
  private startCleanup(): void {
    // Cleanup interval: 5 minutes (300,000ms)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Stops the automatic cleanup process.
   * Call this in tests to prevent hanging timers.
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Gets remaining quota without recording a request.
   * Useful for displaying quota info to users.
   *
   * @param identifier - Unique identifier to check
   * @returns Remaining quota and current usage counts
   */
  getRemaining(identifier: string): {
    remaining: number;
    minuteCount: number;
    dayCount: number;
  } {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const entry = this.storage.get(identifier);
    if (!entry) {
      return {
        remaining: Math.min(this.config.minuteLimit, this.config.dayLimit),
        minuteCount: 0,
        dayCount: 0,
      };
    }

    entry.minute = entry.minute.filter(timestamp => timestamp > minuteAgo);
    entry.day = entry.day.filter(timestamp => timestamp > dayAgo);

    const minuteCount = entry.minute.length;
    const dayCount = entry.day.length;

    const remaining = Math.min(
      this.config.minuteLimit - minuteCount,
      this.config.dayLimit - dayCount
    );

    return {
      remaining: Math.max(0, remaining),
      minuteCount,
      dayCount,
    };
  }

  /**
   * Gets detailed statistics for an identifier.
   * Useful for debugging and monitoring.
   *
   * @param identifier - Unique identifier to check
   * @returns Usage statistics or null if identifier not found
   */
  getStats(identifier: string): {
    minuteCount: number;
    dayCount: number;
    minuteLimit: number;
    dayLimit: number;
  } | null {
    const entry = this.storage.get(identifier);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    return {
      minuteCount: entry.minute.filter(t => t > minuteAgo).length,
      dayCount: entry.day.filter(t => t > dayAgo).length,
      minuteLimit: this.config.minuteLimit,
      dayLimit: this.config.dayLimit,
    };
  }

  /**
   * Resets rate limit for a specific identifier.
   * Primarily for testing purposes.
   *
   * @param identifier - Identifier to reset
   */
  reset(identifier: string): void {
    this.storage.delete(identifier);
  }

  /**
   * Resets all rate limit data.
   * Primarily for testing purposes.
   */
  resetAll(): void {
    this.storage.clear();
  }
}

/**
 * Singleton rate limiter instance configured from environment variables.
 *
 * Environment variables:
 * - GEMINI_RATE_LIMIT_PER_MINUTE (default: 15)
 * - GEMINI_RATE_LIMIT_PER_DAY (default: 1500)
 */
export const rateLimiter = new RateLimiter({
  minuteLimit: parseInt(process.env.GEMINI_RATE_LIMIT_PER_MINUTE || '15', 10),
  dayLimit: parseInt(process.env.GEMINI_RATE_LIMIT_PER_DAY || '1500', 10),
});

/**
 * Creates a rate limit identifier from user ID or IP address.
 * Prioritizes user ID for authenticated requests.
 *
 * @param userId - Authenticated user ID (if available)
 * @param ipAddress - Client IP address (fallback)
 * @returns Prefixed identifier string
 *
 * @remarks
 * Identifier format:
 * - Authenticated: "user:{userId}"
 * - Anonymous: "ip:{ipAddress}"
 * - Fallback: "anonymous" (not recommended for production)
 *
 * @example
 * ```ts
 * const identifier = getRateLimitIdentifier(user?.id, clientIP);
 * const result = rateLimiter.check(identifier);
 * ```
 */
export function getRateLimitIdentifier(
  userId: string | null | undefined,
  ipAddress: string | null | undefined
): string {
  if (userId) {
    return `user:${userId}`;
  }

  if (ipAddress) {
    return `ip:${ipAddress}`;
  }

  // Fallback for development only
  return 'anonymous';
}

/**
 * Extracts client IP address from request headers.
 *
 * @param request - Incoming HTTP request
 * @returns Client IP address or null if unavailable
 *
 * @remarks
 * Checks headers in order:
 * 1. x-forwarded-for (first IP in comma-separated list)
 * 2. x-real-ip
 *
 * In local development, IP may not be available.
 *
 * @example
 * ```ts
 * const clientIP = getClientIP(request);
 * const identifier = getRateLimitIdentifier(user?.id, clientIP);
 * ```
 */
export function getClientIP(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs; use the first (client)
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}
