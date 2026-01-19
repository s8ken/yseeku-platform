/**
 * Error Utilities
 * 
 * Type-safe utilities for error handling to eliminate `any` type usage.
 */

/**
 * Normalized error structure
 */
export interface NormalizedError {
  message: string;
  code?: string;
  name: string;
  stack?: string;
  status?: number;
  details?: unknown;
}

/**
 * Type guard to check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value is an object with message property
 */
export function isErrorLike(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (isErrorLike(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Safely extract error stack from unknown error type
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}

/**
 * Normalize any error to a consistent structure
 */
export function normalizeError(error: unknown): NormalizedError {
  if (isError(error)) {
    const normalized: NormalizedError = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
    
    // Extract additional properties if present
    const errorWithExtras = error as Error & { 
      code?: string; 
      status?: number;
      statusCode?: number;
      details?: unknown;
    };
    
    if (errorWithExtras.code) normalized.code = errorWithExtras.code;
    if (errorWithExtras.status) normalized.status = errorWithExtras.status;
    if (errorWithExtras.statusCode) normalized.status = errorWithExtras.statusCode;
    if (errorWithExtras.details) normalized.details = errorWithExtras.details;
    
    return normalized;
  }
  
  if (isErrorLike(error)) {
    return {
      message: error.message,
      name: 'Error',
      details: error,
    };
  }
  
  return {
    message: getErrorMessage(error),
    name: 'UnknownError',
    details: error,
  };
}

/**
 * Create a typed error handler for try-catch blocks
 * 
 * Usage:
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const { message, code } = handleError(error);
 *   logger.error('Operation failed', { message, code });
 * }
 * ```
 */
export function handleError(error: unknown): NormalizedError {
  return normalizeError(error);
}

/**
 * Wrap an async function to handle errors consistently
 */
export function withErrorHandling<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  errorHandler: (error: NormalizedError) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(normalizeError(error));
      throw error;
    }
  }) as T;
}

export default {
  isError,
  isErrorLike,
  getErrorMessage,
  getErrorStack,
  normalizeError,
  handleError,
  withErrorHandling,
};
