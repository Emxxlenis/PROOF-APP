/**
 * Centralized API Error Handler
 *
 * Provides consistent error handling, logging, and response formatting
 * for all API routes. Handles multiple error types including ApiError,
 * Supabase errors, AI service errors, and generic exceptions.
 *
 * @remarks
 * - Production: Returns sanitized error messages to clients
 * - Development: Includes full error details for debugging
 *
 * @module lib/api-error-handler
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Custom error class for API routes with HTTP status codes.
 *
 * @remarks
 * Provides structured error information including:
 * - HTTP status code for proper response status
 * - Machine-readable error code for client handling
 * - Optional details object for debugging
 *
 * @example
 * ```ts
 * throw new ApiError(404, 'Startup not found', 'NOT_FOUND', { id: startupId });
 * ```
 */
export class ApiError extends Error {
  /**
   * Creates a new API error.
   *
   * @param statusCode - HTTP status code (400-599)
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (e.g., 'NOT_FOUND')
   * @param details - Additional error context (excluded in production responses)
   */
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles errors from API routes and returns consistent JSON responses.
 *
 * Error handling priority:
 * 1. ApiError - Returns structured response with provided status/code
 * 2. Supabase errors - Maps PostgreSQL codes to HTTP status
 * 3. AI service errors - Returns 503 with user-friendly message
 * 4. External API errors - Passes through status code
 * 5. Generic errors - Returns 500 with sanitized message
 *
 * @param error - Caught error (ApiError, Error, Supabase error, or unknown)
 * @param context - Route context for logging (e.g., 'POST /api/vitacoach')
 * @returns NextResponse with consistent error format
 *
 * @remarks
 * Response format:
 * ```json
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "code": "ERROR_CODE",
 *   "details": {} // Development only
 * }
 * ```
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   try {
 *     // Route logic
 *   } catch (error) {
 *     return handleApiError(error, 'POST /api/example');
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log all errors with context for debugging
  if (error instanceof ApiError) {
    logger.error(`API Error in ${context || 'unknown'}`, error, {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    });
  } else if (error instanceof Error) {
    logger.error(`API Error in ${context || 'unknown'}`, error);
  } else {
    logger.error(`API Error in ${context || 'unknown'}`, new Error(String(error)));
  }

  // Handle known ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase/PostgreSQL errors (have code and message properties)
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const supabaseError = error as { code: string; message: string; details?: string; hint?: string };

    // Map common PostgreSQL error codes to HTTP status codes
    let statusCode = 400;
    if (supabaseError.code === 'PGRST116') statusCode = 404; // Row not found
    if (supabaseError.code === '23505') statusCode = 409;    // Unique constraint violation
    if (supabaseError.code === '23503') statusCode = 400;    // Foreign key violation

    return NextResponse.json(
      {
        success: false,
        error: supabaseError.message || 'Database error',
        code: supabaseError.code,
        ...(process.env.NODE_ENV === 'development' && supabaseError.details ? { details: supabaseError.details } : {}),
      },
      { status: statusCode }
    );
  }

  // Handle AI service errors (Gemini, OpenAI)
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    const errorMessage = errorObj.message || errorObj.error?.message || '';

    // Detect AI-related errors by message content
    const isAIError =
      errorMessage.includes('GoogleGenerativeAI') ||
      errorMessage.includes('Gemini') ||
      errorMessage.includes('OpenAI') ||
      errorMessage.includes('generativelanguage.googleapis.com') ||
      errorMessage.includes('models/') ||
      errorMessage.includes('generateContent') ||
      (errorObj.status === 404 && errorMessage.includes('not found'));

    if (isAIError) {
      // User-friendly message in production, technical details in development
      const friendlyMessage = process.env.NODE_ENV === 'production'
        ? 'El servicio de IA no está disponible en este momento. Por favor, intenta de nuevo en unos minutos.'
        : `AI Error: ${errorMessage}`;

      return NextResponse.json(
        {
          success: false,
          error: friendlyMessage,
          code: 'AI_SERVICE_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    // Handle other external API errors with status property
    if ('status' in errorObj) {
      const statusCode = errorObj.status || 500;
      const message = errorObj.error?.message || errorMessage || 'External API error';

      return NextResponse.json(
        {
          success: false,
          error: message,
          code: 'EXTERNAL_API_ERROR',
        },
        { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
      );
    }
  }

  // Generic error fallback (sanitize in production)
  const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
    ? error.message
    : 'Internal server error';

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Validates that request body contains all required fields.
 *
 * Uses TypeScript assertion to narrow type after validation.
 *
 * @typeParam T - Expected body type with required fields
 * @param body - Request body to validate
 * @param requiredFields - Array of field names that must be present
 * @throws {ApiError} 400 if body is missing or any required field is absent
 *
 * @example
 * ```ts
 * interface CreateStartupBody {
 *   name: string;
 *   description: string;
 * }
 *
 * validateRequestBody<CreateStartupBody>(body, ['name', 'description']);
 * // body is now typed as CreateStartupBody
 * ```
 */
export function validateRequestBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[]
): asserts body is T {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body is required', 'MISSING_BODY');
  }

  for (const field of requiredFields) {
    const fieldName = String(field);
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      throw new ApiError(
        400,
        `Missing required field: ${fieldName}`,
        'MISSING_FIELD',
        { field: fieldName }
      );
    }
  }
}

/**
 * Validates that a string value meets minimum length requirement.
 *
 * @param value - String value to validate
 * @param minLength - Minimum required length (after trimming)
 * @param fieldName - Field name for error messages
 * @throws {ApiError} 400 if value is not a string or too short
 *
 * @example
 * ```ts
 * validateStringLength(body.description, 10, 'description');
 * ```
 */
export function validateStringLength(
  value: string | undefined | null,
  minLength: number,
  fieldName: string = 'field'
): asserts value is string {
  if (!value || typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`, 'INVALID_TYPE', { field: fieldName });
  }
  if (value.trim().length < minLength) {
    throw new ApiError(
      400,
      `${fieldName} must be at least ${minLength} characters`,
      'INVALID_LENGTH',
      { field: fieldName, minLength, actualLength: value.length }
    );
  }
}

/**
 * Validates that a value is a valid UUID v4 format.
 *
 * @param value - String value to validate
 * @param fieldName - Field name for error messages
 * @throws {ApiError} 400 if value is not a valid UUID
 *
 * @remarks
 * Validates standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * @example
 * ```ts
 * validateUUID(params.id, 'startupId');
 * ```
 */
export function validateUUID(value: string | undefined | null, fieldName: string = 'id'): asserts value is string {
  if (!value || typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`, 'INVALID_TYPE', { field: fieldName });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ApiError(400, `${fieldName} must be a valid UUID`, 'INVALID_UUID', { field: fieldName });
  }
}

/**
 * Factory functions for common API errors.
 *
 * @remarks
 * Provides consistent error creation with standard HTTP status codes
 * and error codes. Prefer these over creating ApiError directly.
 *
 * @example
 * ```ts
 * if (!user) {
 *   throw ApiErrors.unauthorized('Session expired');
 * }
 *
 * if (!startup) {
 *   throw ApiErrors.notFound('Startup');
 * }
 * ```
 */
export const ApiErrors = {
  /** 400 Bad Request - Invalid input or request format */
  badRequest: (message: string = 'Bad request') =>
    new ApiError(400, message, 'BAD_REQUEST'),

  /** 401 Unauthorized - Missing or invalid authentication */
  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, message, 'UNAUTHORIZED'),

  /** 403 Forbidden - Authenticated but lacks permission */
  forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, message, 'FORBIDDEN'),

  /** 404 Not Found - Requested resource doesn't exist */
  notFound: (resource: string = 'Resource') =>
    new ApiError(404, `${resource} not found`, 'NOT_FOUND'),

  /** 409 Conflict - Resource state conflict (e.g., duplicate) */
  conflict: (message: string = 'Conflict') =>
    new ApiError(409, message, 'CONFLICT'),

  /** 429 Too Many Requests - Rate limit exceeded */
  rateLimitExceeded: (retryAfter?: number) =>
    new ApiError(429, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', { retryAfter }),

  /** 400 Validation Failed - Request data validation error */
  validationFailed: (message: string, details?: Record<string, any>) =>
    new ApiError(400, message, 'VALIDATION_FAILED', details),

  /** 500 Internal Error - Unexpected server error */
  internalError: (message: string = 'Internal server error') =>
    new ApiError(500, message, 'INTERNAL_ERROR'),

  /** 503 AI Service Unavailable - AI service temporarily unavailable */
  aiServiceUnavailable: () =>
    new ApiError(503, 'El servicio de IA no está disponible en este momento. Por favor, intenta de nuevo en unos minutos.', 'AI_SERVICE_UNAVAILABLE'),
};
