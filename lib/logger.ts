/**
 * Structured Logging System
 *
 * Provides environment-aware logging with structured output for production
 * and human-readable output for development.
 *
 * @remarks
 * - debug: Only visible in development
 * - info: Visible in all environments
 * - warn: Visible in all environments
 * - error: Always visible, includes stack trace in development
 *
 * Production logs are JSON-formatted for log aggregation services.
 *
 * @module lib/logger
 */

/** Available log severity levels */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Additional context to include with log entries.
 */
interface LogContext {
  /** User ID for request correlation */
  userId?: string;
  /** Request ID for distributed tracing */
  requestId?: string;
  /** Additional key-value pairs */
  [key: string]: any;
}

/**
 * Structured logger class with environment-aware output formatting.
 *
 * @remarks
 * - Development: Human-readable console output with colors
 * - Production: JSON-formatted output for log aggregation
 *
 * @example
 * ```ts
 * logger.info("User logged in", { userId: "123" });
 * logger.error("Database connection failed", error, { service: "postgres" });
 * ```
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Logs debug messages (development only).
   *
   * @param message - Log message
   * @param context - Additional context data
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Logs informational messages.
   *
   * @param message - Log message
   * @param context - Additional context data
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    } else {
      console.log(JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }));
    }
  }

  /**
   * Logs warning messages.
   *
   * @param message - Log message
   * @param context - Additional context data
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    } else {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }));
    }
  }

  /**
   * Logs error messages with optional error object.
   *
   * @param message - Log message
   * @param error - Error object (optional)
   * @param context - Additional context data
   *
   * @remarks
   * Stack traces are only included in development to prevent log bloat.
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        }
      : error;

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, {
        error: errorDetails,
        ...context,
      });
    } else {
      console.error(JSON.stringify({
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        error: errorDetails,
        ...context,
      }));
    }
  }

  /**
   * Logs HTTP request with automatic level selection based on status code.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Request path
   * @param statusCode - Response status code
   * @param context - Additional context data
   *
   * @remarks
   * - 5xx: Logged as error
   * - 4xx: Logged as warn
   * - Others: Logged as info
   */
  request(
    method: string,
    path: string,
    statusCode?: number,
    context?: LogContext
  ): void {
    const logMessage = `${method} ${path}${statusCode ? ` ${statusCode}` : ''}`;

    if (statusCode && statusCode >= 500) {
      this.error(logMessage, undefined, context);
    } else if (statusCode && statusCode >= 400) {
      this.warn(logMessage, context);
    } else {
      this.info(logMessage, context);
    }
  }

  /**
   * Logs database operations (debug level).
   *
   * @param operation - Database operation (SELECT, INSERT, etc.)
   * @param table - Table name
   * @param context - Additional context data
   */
  db(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table}`, context);
  }

  /**
   * Logs authentication events.
   *
   * @param event - Auth event type (login, logout, etc.)
   * @param userId - User ID (optional)
   * @param context - Additional context data
   */
  auth(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, { userId, ...context });
  }
}

/** Singleton logger instance for application-wide use */
export const logger = new Logger();

/** Logger class export for testing and custom instances */
export { Logger };
