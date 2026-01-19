/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling for all Express routes.
 * Provides consistent error responses and proper logging.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { PlatformError, ErrorCategory, ErrorSeverity } from '@sonate/core';
import { getErrorMessage } from '../utils/error-utils';

/**
 * Typed error with optional status code
 */
interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Standard error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    requestId?: string;
    details?: unknown;
  };
}

/**
 * Determine HTTP status code from error
 */
function getStatusCode(error: HttpError): number {
  // Explicit status
  if (error.status) return error.status;
  if (error.statusCode) return error.statusCode;
  
  // PlatformError severity mapping
  if (error instanceof PlatformError) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return 401;
      case ErrorCategory.AUTHORIZATION:
        return 403;
      case ErrorCategory.VALIDATION:
        return 400;
      case ErrorCategory.DATABASE:
        return 503;
      case ErrorCategory.EXTERNAL_SERVICE:
        return 502;
      default:
        return 500;
    }
  }
  
  // Error name mapping
  switch (error.name) {
    case 'ValidationError':
    case 'CastError':
      return 400;
    case 'UnauthorizedError':
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'RateLimitError':
      return 429;
    default:
      return 500;
  }
}

/**
 * Get error code string
 */
function getErrorCode(error: HttpError): string {
  if (error instanceof PlatformError) {
    return error.code;
  }
  
  if (error.code) {
    return error.code;
  }
  
  // Convert error name to code format
  return error.name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .replace(/ERROR$/, '');
}

/**
 * Get user-safe error message
 */
function getUserMessage(error: HttpError, statusCode: number): string {
  // In production, don't expose internal error details for 5xx errors
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    return 'An internal error occurred. Please try again later.';
  }
  
  if (error instanceof PlatformError) {
    return error.userMessage;
  }
  
  return getErrorMessage(error) || 'An error occurred';
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler - for 404 routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      requestId: req.requestId,
    },
  });
}

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export function globalErrorHandler(
  error: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);
  const userMessage = getUserMessage(error, statusCode);
  
  // Log the error with full context
  const logContext = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    errorName: error.name,
    userId: req.userId,
    tenant: req.tenant,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    stack: error.stack,
  };
  
  if (statusCode >= 500) {
    logger.error('Server error', { ...logContext, message: getErrorMessage(error) });
  } else if (statusCode >= 400) {
    logger.warn('Client error', { ...logContext, message: getErrorMessage(error) });
  }
  
  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      message: userMessage,
      code: errorCode,
      requestId: req.requestId,
    },
  };
  
  // Include details in non-production for debugging
  if (process.env.NODE_ENV !== 'production' && error.details) {
    response.error.details = error.details;
  }
  
  // Send response
  res.status(statusCode).json(response);
}

export default globalErrorHandler;
