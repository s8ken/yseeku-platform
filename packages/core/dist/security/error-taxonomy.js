"use strict";
/**
 * Enhanced Error Taxonomy for YSEEKU
 * Based on sonate-protocol protocol errors with enterprise security extensions
 * Provides structured error handling with security context and audit integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityErrorHandler = exports.BusinessLogicSecurityError = exports.SystemSecurityError = exports.NetworkSecurityError = exports.ValidationError = exports.DataIntegrityError = exports.CryptographicError = exports.SecurityError = exports.AuthorizationError = exports.AuthenticationError = exports.EnhancedSecurityError = void 0;
/**
 * Base class for all YSEEKU security errors
 */
class EnhancedSecurityError extends Error {
    constructor(details) {
        super(details.message);
        this.name = this.constructor.name;
        this.code = details.code;
        this.context = details.context;
        this.originalError = details.originalError;
        this.metadata = details.metadata;
        this.remediation = details.remediation;
        this.documentationUrl = details.documentationUrl;
        this.errorId = this.generateErrorId();
        // Maintain proper prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
    }
    /**
     * Generate unique error identifier
     */
    generateErrorId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6);
        const component = this.context.component
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substr(0, 4);
        return `${component}-${timestamp}-${random}`;
    }
    /**
     * Convert error to JSON for logging/serialization
     */
    toJSON() {
        return {
            errorId: this.errorId,
            name: this.name,
            code: this.code,
            message: this.message,
            context: this.context,
            metadata: this.metadata,
            remediation: this.remediation,
            documentationUrl: this.documentationUrl,
            stack: this.stack,
            originalError: this.originalError?.message,
        };
    }
    /**
     * Get security report for this error
     */
    getSecurityReport() {
        return {
            error: this,
            auditRequired: this.isAuditRequired(),
            alertLevel: this.determineAlertLevel(),
            recommendedActions: this.getRecommendedActions(),
        };
    }
    /**
     * Determine if this error requires audit logging
     */
    isAuditRequired() {
        return ['authentication', 'authorization', 'cryptographic', 'data_integrity'].includes(this.context.category);
    }
    /**
     * Determine alert level for this error
     */
    determineAlertLevel() {
        if (this.context.severity === 'critical') {
            return 'critical';
        }
        if (this.context.severity === 'high') {
            return 'warning';
        }
        return 'info';
    }
    /**
     * Get recommended actions for this error
     */
    getRecommendedActions() {
        const actions = [];
        if (this.isAuditRequired()) {
            actions.push('Log this error to security audit trail');
        }
        if (this.context.severity === 'critical') {
            actions.push('Immediately review security controls');
            actions.push('Consider temporary access restrictions');
        }
        if (this.remediation) {
            actions.push(this.remediation);
        }
        return actions;
    }
}
exports.EnhancedSecurityError = EnhancedSecurityError;
/**
 * Authentication-related errors
 */
class AuthenticationError extends EnhancedSecurityError {
    constructor(message, contextOrCode, optionsOrMetadata) {
        if (typeof contextOrCode === 'string') {
            const metadata = optionsOrMetadata || {};
            const component = 'auth-middleware';
            const operation = metadata.method || 'authenticate';
            const severity = 'high';
            super({
                code: contextOrCode,
                message,
                context: {
                    component,
                    operation,
                    severity,
                    userId: metadata.userId,
                    tenantId: metadata.tenant,
                    requestId: metadata.requestId,
                    sessionId: metadata.sessionId,
                    ipAddress: metadata.ipAddress,
                    userAgent: metadata.userAgent,
                    category: 'authentication',
                    timestamp: Date.now(),
                },
                originalError: metadata.originalError instanceof Error ? metadata.originalError : undefined,
                metadata,
                remediation: 'Verify authentication credentials and try again',
                documentationUrl: '/docs/security/authentication',
            });
            return;
        }
        const context = contextOrCode;
        const options = optionsOrMetadata;
        super({
            code: 'AUTH_ERROR',
            message,
            context: {
                ...context,
                category: 'authentication',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata: options?.metadata,
            remediation: options?.remediation || 'Verify authentication credentials and try again',
            documentationUrl: '/docs/security/authentication',
        });
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization/permission errors
 */
class AuthorizationError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            requiredPermissions: options?.requiredPermissions,
            userPermissions: options?.userPermissions,
        };
        super({
            code: 'AUTHZ_ERROR',
            message,
            context: {
                ...context,
                category: 'authorization',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Contact administrator for appropriate permissions',
            documentationUrl: '/docs/security/authorization',
        });
    }
}
exports.AuthorizationError = AuthorizationError;
class SecurityError extends EnhancedSecurityError {
    constructor(message, codeOrContext, optionsOrMetadata) {
        if (typeof codeOrContext === 'string') {
            const metadata = optionsOrMetadata || {};
            const component = metadata.component || 'security';
            const operation = metadata.method || 'authorization_check';
            const severity = 'medium';
            super({
                code: codeOrContext,
                message,
                context: {
                    component,
                    operation,
                    severity,
                    userId: metadata.userId,
                    tenantId: metadata.tenant || metadata.userTenant,
                    requestId: metadata.requestId,
                    sessionId: metadata.sessionId,
                    ipAddress: metadata.ipAddress,
                    userAgent: metadata.userAgent,
                    category: 'authorization',
                    timestamp: Date.now(),
                },
                originalError: metadata.originalError instanceof Error ? metadata.originalError : undefined,
                metadata,
                remediation: 'Contact administrator for appropriate permissions',
                documentationUrl: '/docs/security/authorization',
            });
            return;
        }
        const context = codeOrContext;
        const options = optionsOrMetadata;
        super({
            code: 'SECURITY_ERROR',
            message,
            context: {
                ...context,
                category: 'authorization',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata: options?.metadata,
            remediation: options?.remediation || 'Contact administrator for appropriate permissions',
            documentationUrl: '/docs/security/authorization',
        });
    }
}
exports.SecurityError = SecurityError;
/**
 * Cryptographic operation errors
 */
class CryptographicError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            operation: options?.operation,
            algorithm: options?.algorithm,
        };
        super({
            code: 'CRYPTO_ERROR',
            message,
            context: {
                ...context,
                category: 'cryptographic',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Verify cryptographic configuration and key validity',
            documentationUrl: '/docs/security/cryptography',
        });
    }
}
exports.CryptographicError = CryptographicError;
/**
 * Data integrity validation errors
 */
class DataIntegrityError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            expectedHash: options?.expectedHash,
            actualHash: options?.actualHash,
            dataType: options?.dataType,
        };
        super({
            code: 'INTEGRITY_ERROR',
            message,
            context: {
                ...context,
                category: 'data_integrity',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Data may be corrupted - verify data source and integrity',
            documentationUrl: '/docs/security/data-integrity',
        });
    }
}
exports.DataIntegrityError = DataIntegrityError;
/**
 * Input validation errors
 */
class ValidationError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            field: options?.field,
            value: options?.value,
            constraints: options?.constraints,
        };
        super({
            code: 'VALIDATION_ERROR',
            message,
            context: {
                ...context,
                category: 'validation',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Correct input data according to validation constraints',
            documentationUrl: '/docs/api/validation',
        });
    }
}
exports.ValidationError = ValidationError;
/**
 * Network/communication errors
 */
class NetworkSecurityError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            endpoint: options?.endpoint,
            statusCode: options?.statusCode,
            timeout: options?.timeout,
        };
        super({
            code: 'NETWORK_ERROR',
            message,
            context: {
                ...context,
                category: 'network',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Check network connectivity and service availability',
            documentationUrl: '/docs/security/network',
        });
    }
}
exports.NetworkSecurityError = NetworkSecurityError;
/**
 * System-level security errors
 */
class SystemSecurityError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            systemComponent: options?.systemComponent,
            errorType: options?.errorType,
        };
        super({
            code: 'SYSTEM_ERROR',
            message,
            context: {
                ...context,
                category: 'system',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Review system configuration and security settings',
            documentationUrl: '/docs/security/system',
        });
    }
}
exports.SystemSecurityError = SystemSecurityError;
/**
 * Business logic security errors
 */
class BusinessLogicSecurityError extends EnhancedSecurityError {
    constructor(message, context, options) {
        const metadata = {
            ...options?.metadata,
            ruleName: options?.ruleName,
            ruleId: options?.ruleId,
        };
        super({
            code: 'BUSINESS_LOGIC_ERROR',
            message,
            context: {
                ...context,
                category: 'business_logic',
                timestamp: Date.now(),
            },
            originalError: options?.originalError,
            metadata,
            remediation: options?.remediation || 'Review business logic constraints and data validity',
            documentationUrl: '/docs/security/business-logic',
        });
    }
}
exports.BusinessLogicSecurityError = BusinessLogicSecurityError;
/**
 * Error handler utility class
 */
class SecurityErrorHandler {
    /**
     * Handle error and generate security report
     */
    static handleError(error, context) {
        if (error instanceof EnhancedSecurityError) {
            return error.getSecurityReport();
        }
        // Convert generic error to system security error
        const systemError = new SystemSecurityError(error.message, {
            component: context.component || 'unknown',
            operation: context.operation || 'unknown',
            severity: context.severity || 'medium',
        }, {
            originalError: error,
            metadata: { errorType: error.constructor.name },
        });
        return systemError.getSecurityReport();
    }
    /**
     * Log error to console with structured format
     */
    static logError(report) {
        const { error, auditRequired, alertLevel, recommendedActions } = report;
        const logEntry = {
            timestamp: new Date().toISOString(),
            errorId: error.errorId,
            code: error.code,
            message: error.message,
            severity: error.context.severity,
            category: error.context.category,
            alertLevel,
            auditRequired,
            recommendedActions,
            context: error.context,
        };
        // Log based on severity
        if (error.context.severity === 'critical') {
            console.error('[CRITICAL SECURITY ERROR]', JSON.stringify(logEntry, null, 2));
        }
        else if (error.context.severity === 'high') {
            console.error('[SECURITY ERROR]', JSON.stringify(logEntry, null, 2));
        }
        else {
            console.warn('[SECURITY WARNING]', JSON.stringify(logEntry, null, 2));
        }
    }
    /**
     * Generate error summary for reporting
     */
    static generateErrorSummary(errors) {
        const summary = {
            totalErrors: errors.length,
            bySeverity: {},
            byCategory: {},
            requiresAudit: 0,
            criticalErrors: 0,
        };
        errors.forEach((error) => {
            // Count by severity
            summary.bySeverity[error.context.severity] =
                (summary.bySeverity[error.context.severity] || 0) + 1;
            // Count by category
            summary.byCategory[error.context.category] =
                (summary.byCategory[error.context.category] || 0) + 1;
            // Count audit requirements
            if (error.getSecurityReport().auditRequired) {
                summary.requiresAudit++;
            }
            // Count critical errors
            if (error.context.severity === 'critical') {
                summary.criticalErrors++;
            }
        });
        return summary;
    }
}
exports.SecurityErrorHandler = SecurityErrorHandler;
