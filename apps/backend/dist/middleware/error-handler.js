"use strict";
/**
 * Global Error Handler Middleware
 *
 * Centralized error handling for all Express routes.
 * Provides consistent error responses and proper logging.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
exports.globalErrorHandler = globalErrorHandler;
const logger_1 = __importDefault(require("../utils/logger"));
const core_1 = require("@sonate/core");
const error_utils_1 = require("../utils/error-utils");
/**
 * Determine HTTP status code from error
 */
function getStatusCode(error) {
    // Explicit status
    if (error.status)
        return error.status;
    if (error.statusCode)
        return error.statusCode;
    // PlatformError severity mapping
    if (error instanceof core_1.PlatformError) {
        switch (error.category) {
            case core_1.ErrorCategory.AUTHENTICATION:
                return 401;
            case core_1.ErrorCategory.AUTHORIZATION:
                return 403;
            case core_1.ErrorCategory.VALIDATION:
                return 400;
            case core_1.ErrorCategory.DATABASE:
                return 503;
            case core_1.ErrorCategory.EXTERNAL_SERVICE:
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
function getErrorCode(error) {
    if (error instanceof core_1.PlatformError) {
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
function getUserMessage(error, statusCode) {
    // In production, don't expose internal error details for 5xx errors
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        return 'An internal error occurred. Please try again later.';
    }
    if (error instanceof core_1.PlatformError) {
        return error.userMessage;
    }
    return (0, error_utils_1.getErrorMessage)(error) || 'An error occurred';
}
/**
 * Async handler wrapper to catch promise rejections
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Not found handler - for 404 routes
 */
function notFoundHandler(req, res) {
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
function globalErrorHandler(error, req, res, _next) {
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
        logger_1.default.error('Server error', { ...logContext, message: (0, error_utils_1.getErrorMessage)(error) });
    }
    else if (statusCode >= 400) {
        logger_1.default.warn('Client error', { ...logContext, message: (0, error_utils_1.getErrorMessage)(error) });
    }
    // Build response
    const response = {
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
exports.default = globalErrorHandler;
