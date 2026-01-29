"use strict";
/**
 * Error Utilities
 *
 * Type-safe utilities for error handling to eliminate `any` type usage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = isError;
exports.isErrorLike = isErrorLike;
exports.getErrorMessage = getErrorMessage;
exports.getErrorStack = getErrorStack;
exports.normalizeError = normalizeError;
exports.handleError = handleError;
exports.withErrorHandling = withErrorHandling;
/**
 * Type guard to check if value is an Error
 */
function isError(value) {
    return value instanceof Error;
}
/**
 * Type guard to check if value is an object with message property
 */
function isErrorLike(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'message' in value &&
        typeof value.message === 'string');
}
/**
 * Safely extract error message from unknown error type
 */
function getErrorMessage(error) {
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
function getErrorStack(error) {
    if (isError(error)) {
        return error.stack;
    }
    return undefined;
}
/**
 * Normalize any error to a consistent structure
 */
function normalizeError(error) {
    if (isError(error)) {
        const normalized = {
            message: error.message,
            name: error.name,
            stack: error.stack,
        };
        // Extract additional properties if present
        const errorWithExtras = error;
        if (errorWithExtras.code)
            normalized.code = errorWithExtras.code;
        if (errorWithExtras.status)
            normalized.status = errorWithExtras.status;
        if (errorWithExtras.statusCode)
            normalized.status = errorWithExtras.statusCode;
        if (errorWithExtras.details)
            normalized.details = errorWithExtras.details;
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
function handleError(error) {
    return normalizeError(error);
}
/**
 * Wrap an async function to handle errors consistently
 */
function withErrorHandling(fn, errorHandler) {
    return (async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            errorHandler(normalizeError(error));
            throw error;
        }
    });
}
exports.default = {
    isError,
    isErrorLike,
    getErrorMessage,
    getErrorStack,
    normalizeError,
    handleError,
    withErrorHandling,
};
