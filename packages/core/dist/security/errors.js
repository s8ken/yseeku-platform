"use strict";
/**
 * Security Error Classes
 *
 * Custom error types for security-related operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedSecurityError = exports.SystemSecurityError = exports.AuthenticationError = exports.SecurityError = void 0;
class SecurityError extends Error {
    constructor(message, code, context, metadata) {
        super(message);
        this.code = code;
        this.context = context;
        this.metadata = metadata;
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
class AuthenticationError extends SecurityError {
    constructor(message) {
        super(message, 'AUTH_ERROR');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class SystemSecurityError extends SecurityError {
    constructor(message, context, metadata) {
        super(message, 'SYSTEM_ERROR', context, metadata);
        this.name = 'SystemSecurityError';
    }
}
exports.SystemSecurityError = SystemSecurityError;
class EnhancedSecurityError extends SecurityError {
    constructor(message) {
        super(message, 'ENHANCED_ERROR');
        this.name = 'EnhancedSecurityError';
    }
}
exports.EnhancedSecurityError = EnhancedSecurityError;
