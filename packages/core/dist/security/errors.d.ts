/**
 * Security Error Classes
 *
 * Custom error types for security-related operations
 */
export declare class SecurityError extends Error {
    code?: string | undefined;
    context?: any | undefined;
    metadata?: any | undefined;
    constructor(message: string, code?: string | undefined, context?: any | undefined, metadata?: any | undefined);
}
export declare class AuthenticationError extends SecurityError {
    constructor(message: string);
}
export declare class SystemSecurityError extends SecurityError {
    constructor(message: string, context?: any, metadata?: any);
}
export declare class EnhancedSecurityError extends SecurityError {
    constructor(message: string);
}
