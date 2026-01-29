/**
 * Enhanced Error Taxonomy for YSEEKU
 * Based on sonate-protocol protocol errors with enterprise security extensions
 * Provides structured error handling with security context and audit integration
 */
export interface ErrorContext {
    component: string;
    operation: string;
    userId?: string;
    tenantId?: string;
    requestId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'authentication' | 'authorization' | 'validation' | 'cryptographic' | 'data_integrity' | 'network' | 'system' | 'business_logic';
}
export interface ErrorDetails {
    code: string;
    message: string;
    context: ErrorContext;
    originalError?: Error;
    metadata?: Record<string, any>;
    remediation?: string;
    documentationUrl?: string;
}
export interface SecurityErrorReport {
    error: EnhancedSecurityError;
    auditRequired: boolean;
    alertLevel: 'info' | 'warning' | 'critical';
    recommendedActions: string[];
}
/**
 * Base class for all YSEEKU security errors
 */
export declare class EnhancedSecurityError extends Error {
    readonly code: string;
    readonly context: ErrorContext;
    readonly originalError?: Error;
    readonly metadata?: Record<string, any>;
    readonly remediation?: string;
    readonly documentationUrl?: string;
    readonly errorId: string;
    constructor(details: ErrorDetails);
    /**
     * Generate unique error identifier
     */
    private generateErrorId;
    /**
     * Convert error to JSON for logging/serialization
     */
    toJSON(): Record<string, any>;
    /**
     * Get security report for this error
     */
    getSecurityReport(): SecurityErrorReport;
    /**
     * Determine if this error requires audit logging
     */
    protected isAuditRequired(): boolean;
    /**
     * Determine alert level for this error
     */
    protected determineAlertLevel(): 'info' | 'warning' | 'critical';
    /**
     * Get recommended actions for this error
     */
    protected getRecommendedActions(): string[];
}
/**
 * Authentication-related errors
 */
export declare class AuthenticationError extends EnhancedSecurityError {
    constructor(message: string, contextOrCode: Omit<ErrorContext, 'category' | 'timestamp'> | string, optionsOrMetadata?: {
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    } | Record<string, any>);
}
/**
 * Authorization/permission errors
 */
export declare class AuthorizationError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        requiredPermissions?: string[];
        userPermissions?: string[];
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
export declare class SecurityError extends EnhancedSecurityError {
    constructor(message: string, codeOrContext: string | Omit<ErrorContext, 'category' | 'timestamp'>, optionsOrMetadata?: {
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    } | Record<string, any>);
}
/**
 * Cryptographic operation errors
 */
export declare class CryptographicError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        operation?: string;
        algorithm?: string;
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
/**
 * Data integrity validation errors
 */
export declare class DataIntegrityError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        expectedHash?: string;
        actualHash?: string;
        dataType?: string;
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
/**
 * Input validation errors
 */
export declare class ValidationError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        field?: string;
        value?: any;
        constraints?: string[];
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
/**
 * Network/communication errors
 */
export declare class NetworkSecurityError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        endpoint?: string;
        statusCode?: number;
        timeout?: boolean;
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
/**
 * System-level security errors
 */
export declare class SystemSecurityError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        systemComponent?: string;
        errorType?: string;
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
/**
 * Business logic security errors
 */
export declare class BusinessLogicSecurityError extends EnhancedSecurityError {
    constructor(message: string, context: Omit<ErrorContext, 'category' | 'timestamp'>, options?: {
        ruleName?: string;
        ruleId?: string;
        originalError?: Error;
        metadata?: Record<string, any>;
        remediation?: string;
    });
}
/**
 * Error handler utility class
 */
export declare class SecurityErrorHandler {
    /**
     * Handle error and generate security report
     */
    static handleError(error: Error, context: Partial<ErrorContext>): SecurityErrorReport;
    /**
     * Log error to console with structured format
     */
    static logError(report: SecurityErrorReport): void;
    /**
     * Generate error summary for reporting
     */
    static generateErrorSummary(errors: EnhancedSecurityError[]): {
        totalErrors: number;
        bySeverity: Record<string, number>;
        byCategory: Record<string, number>;
        requiresAudit: number;
        criticalErrors: number;
    };
}
