"use strict";
/**
 * Comprehensive Error Taxonomy for Enterprise Error Handling
 *
 * Provides granular error types for better debugging, monitoring, and user feedback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.DiskSpaceError = exports.OutOfMemoryError = exports.SystemError = exports.SlowOperationError = exports.RateLimitExceededError = exports.PerformanceError = exports.AuditLogError = exports.SOC2ViolationError = exports.GDPRViolationError = exports.ComplianceError = exports.ExternalServiceError = exports.InvariantViolationError = exports.EmergenceDetectionError = exports.TrustScoreCalculationError = exports.BusinessLogicError = exports.ServiceUnavailableError = exports.TimeoutError = exports.NetworkError = exports.DuplicateRecordError = exports.RecordNotFoundError = exports.QueryError = exports.ConnectionError = exports.DatabaseError = exports.HashChainIntegrityError = exports.HSMUnavailableError = exports.KeyRotationError = exports.KeyNotFoundError = exports.SignatureVerificationError = exports.CryptographicError = exports.RangeValidationError = exports.FormatValidationError = exports.MissingRequiredFieldError = exports.InvalidInputError = exports.ValidationError = exports.TenantAccessDeniedError = exports.RoleRequiredError = exports.PermissionDeniedError = exports.AuthorizationError = exports.MFATokenRequiredError = exports.InvalidTokenError = exports.TokenExpiredError = exports.InvalidCredentialsError = exports.AuthenticationError = exports.PlatformError = exports.ErrorSeverity = exports.ErrorCategory = void 0;
exports.createErrorHandler = createErrorHandler;
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorCategory["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["CRYPTOGRAPHIC"] = "CRYPTOGRAPHIC";
    ErrorCategory["DATABASE"] = "DATABASE";
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["BUSINESS_LOGIC"] = "BUSINESS_LOGIC";
    ErrorCategory["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    ErrorCategory["SYSTEM"] = "SYSTEM";
    ErrorCategory["COMPLIANCE"] = "COMPLIANCE";
    ErrorCategory["AUDIT"] = "AUDIT";
    ErrorCategory["PERFORMANCE"] = "PERFORMANCE";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Base Error class for all platform errors
 */
class PlatformError extends Error {
    constructor(message, code, category, severity, context = { timestamp: Date.now() }, retryable = false, userMessage) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.context = context;
        this.retryable = retryable;
        this.userMessage = userMessage || this.getDefaultUserMessage();
        Error.captureStackTrace(this, this.constructor);
    }
    getDefaultUserMessage() {
        switch (this.severity) {
            case ErrorSeverity.LOW:
                return 'An minor issue occurred. Please try again.';
            case ErrorSeverity.MEDIUM:
                return 'An issue occurred. Please contact support if it persists.';
            case ErrorSeverity.HIGH:
                return 'A serious issue occurred. Please contact support immediately.';
            case ErrorSeverity.CRITICAL:
                return 'A critical error occurred. The system may be unavailable.';
            default:
                return 'An error occurred.';
        }
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            category: this.category,
            severity: this.severity,
            context: this.context,
            retryable: this.retryable,
            userMessage: this.userMessage,
            stack: process.env.NODE_ENV === 'production' ? undefined : this.stack,
        };
    }
}
exports.PlatformError = PlatformError;
// Authentication Errors
class AuthenticationError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'AUTH_001', ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, context, false, 'Authentication failed. Please check your credentials.');
    }
}
exports.AuthenticationError = AuthenticationError;
class InvalidCredentialsError extends AuthenticationError {
    constructor(context = { timestamp: Date.now() }) {
        super('Invalid credentials provided', context);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class TokenExpiredError extends AuthenticationError {
    constructor(context = { timestamp: Date.now() }) {
        super('Authentication token has expired', {
            ...context,
            timestamp: Date.now(),
        });
    }
}
exports.TokenExpiredError = TokenExpiredError;
class InvalidTokenError extends AuthenticationError {
    constructor(context = { timestamp: Date.now() }) {
        super('Invalid authentication token', context);
    }
}
exports.InvalidTokenError = InvalidTokenError;
class MFATokenRequiredError extends AuthenticationError {
    constructor(context = { timestamp: Date.now() }) {
        super('Multi-factor authentication token required', context);
    }
}
exports.MFATokenRequiredError = MFATokenRequiredError;
// Authorization Errors
class AuthorizationError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'AUTHZ_001', ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH, context, false, 'You do not have permission to perform this action.');
    }
}
exports.AuthorizationError = AuthorizationError;
class PermissionDeniedError extends AuthorizationError {
    constructor(permission, context = { timestamp: Date.now() }) {
        super(`Permission denied: ${permission}`, context);
    }
}
exports.PermissionDeniedError = PermissionDeniedError;
class RoleRequiredError extends AuthorizationError {
    constructor(requiredRole, context = { timestamp: Date.now() }) {
        super(`Required role not found: ${requiredRole}`, context);
    }
}
exports.RoleRequiredError = RoleRequiredError;
class TenantAccessDeniedError extends AuthorizationError {
    constructor(tenantId, context = { timestamp: Date.now() }) {
        super(`Access denied to tenant: ${tenantId}`, context);
    }
}
exports.TenantAccessDeniedError = TenantAccessDeniedError;
// Validation Errors
class ValidationError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'VAL_001', ErrorCategory.VALIDATION, ErrorSeverity.LOW, context, false, 'Invalid input provided. Please check your data.');
    }
}
exports.ValidationError = ValidationError;
class InvalidInputError extends ValidationError {
    constructor(field, value, context = { timestamp: Date.now() }) {
        super(`Invalid value for field ${field}: ${JSON.stringify(value)}`, {
            ...context,
            metadata: { ...context.metadata, field, value },
        });
    }
}
exports.InvalidInputError = InvalidInputError;
class MissingRequiredFieldError extends ValidationError {
    constructor(field, context = { timestamp: Date.now() }) {
        super(`Missing required field: ${field}`, {
            ...context,
            metadata: { ...context.metadata, field },
        });
    }
}
exports.MissingRequiredFieldError = MissingRequiredFieldError;
class FormatValidationError extends ValidationError {
    constructor(field, expectedFormat, context = { timestamp: Date.now() }) {
        super(`Invalid format for field ${field}. Expected: ${expectedFormat}`, {
            ...context,
            metadata: { ...context.metadata, field, expectedFormat },
        });
    }
}
exports.FormatValidationError = FormatValidationError;
class RangeValidationError extends ValidationError {
    constructor(field, value, min, max, context = { timestamp: Date.now() }) {
        super(`Value ${value} for field ${field} is outside valid range [${min}, ${max}]`, {
            ...context,
            metadata: { ...context.metadata, field, value, min, max },
        });
    }
}
exports.RangeValidationError = RangeValidationError;
// Cryptographic Errors
class CryptographicError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'CRYPTO_001', ErrorCategory.CRYPTOGRAPHIC, ErrorSeverity.CRITICAL, context, false, 'A cryptographic error occurred. Please contact support.');
    }
}
exports.CryptographicError = CryptographicError;
class SignatureVerificationError extends CryptographicError {
    constructor(context = { timestamp: Date.now() }) {
        super('Signature verification failed', context);
    }
}
exports.SignatureVerificationError = SignatureVerificationError;
class KeyNotFoundError extends CryptographicError {
    constructor(keyId, context = { timestamp: Date.now() }) {
        super(`Key not found: ${keyId}`, {
            ...context,
            metadata: { ...context.metadata, keyId },
        });
    }
}
exports.KeyNotFoundError = KeyNotFoundError;
class KeyRotationError extends CryptographicError {
    constructor(keyId, context = { timestamp: Date.now() }) {
        super(`Failed to rotate key: ${keyId}`, {
            ...context,
            metadata: { ...context.metadata, keyId },
            timestamp: Date.now(),
        });
    }
}
exports.KeyRotationError = KeyRotationError;
class HSMUnavailableError extends CryptographicError {
    constructor(context = { timestamp: Date.now() }) {
        super('Hardware Security Module is unavailable', {
            ...context,
            timestamp: Date.now(),
        });
    }
}
exports.HSMUnavailableError = HSMUnavailableError;
class HashChainIntegrityError extends CryptographicError {
    constructor(context = { timestamp: Date.now() }) {
        super('Hash chain integrity verification failed', context);
    }
}
exports.HashChainIntegrityError = HashChainIntegrityError;
// Database Errors
class DatabaseError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'DB_001', ErrorCategory.DATABASE, ErrorSeverity.HIGH, context, true, 'A database error occurred. Please try again later.');
    }
}
exports.DatabaseError = DatabaseError;
class ConnectionError extends DatabaseError {
    constructor(context = { timestamp: Date.now() }) {
        super('Database connection failed', context);
    }
}
exports.ConnectionError = ConnectionError;
class QueryError extends DatabaseError {
    constructor(query, context = { timestamp: Date.now() }) {
        super(`Database query failed: ${query}`, {
            ...context,
            metadata: { ...context.metadata, query },
        });
    }
}
exports.QueryError = QueryError;
class RecordNotFoundError extends DatabaseError {
    constructor(recordType, id, context = { timestamp: Date.now() }) {
        super(`${recordType} not found: ${id}`, context);
    }
}
exports.RecordNotFoundError = RecordNotFoundError;
class DuplicateRecordError extends DatabaseError {
    constructor(recordType, field, value, context = { timestamp: Date.now() }) {
        super(`Duplicate ${recordType}: ${field}=${value}`, {
            ...context,
            metadata: { ...context.metadata, recordType, field, value },
            timestamp: Date.now(),
        });
    }
}
exports.DuplicateRecordError = DuplicateRecordError;
// Network Errors
class NetworkError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'NET_001', ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, context, true, 'A network error occurred. Please check your connection.');
    }
}
exports.NetworkError = NetworkError;
class TimeoutError extends NetworkError {
    constructor(operation, timeout, context = { timestamp: Date.now() }) {
        super(`Operation ${operation} timed out after ${timeout}ms`, {
            ...context,
            metadata: { ...context.metadata, operation, timeout },
        });
    }
}
exports.TimeoutError = TimeoutError;
class ServiceUnavailableError extends NetworkError {
    constructor(service, context = { timestamp: Date.now() }) {
        super(`Service ${service} is unavailable`, context);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
// Business Logic Errors
class BusinessLogicError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'BIZ_001', ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, context, false, 'An error occurred while processing your request.');
    }
}
exports.BusinessLogicError = BusinessLogicError;
class TrustScoreCalculationError extends BusinessLogicError {
    constructor(context = { timestamp: Date.now() }) {
        super('Failed to calculate trust score', context);
    }
}
exports.TrustScoreCalculationError = TrustScoreCalculationError;
class EmergenceDetectionError extends BusinessLogicError {
    constructor(context = { timestamp: Date.now() }) {
        super('Failed to detect emergence patterns', context);
    }
}
exports.EmergenceDetectionError = EmergenceDetectionError;
class InvariantViolationError extends BusinessLogicError {
    constructor(invariant, context = { timestamp: Date.now() }) {
        super(`Invariant violation: ${invariant}`, context);
    }
}
exports.InvariantViolationError = InvariantViolationError;
// External Service Errors
class ExternalServiceError extends PlatformError {
    constructor(message, service, context = { timestamp: Date.now() }) {
        super(message, 'EXT_001', ErrorCategory.EXTERNAL_SERVICE, ErrorSeverity.MEDIUM, {
            ...context,
            metadata: { ...context.metadata, service },
        }, true, `Error communicating with external service: ${service}`);
    }
}
exports.ExternalServiceError = ExternalServiceError;
// Compliance Errors
class ComplianceError extends PlatformError {
    constructor(message, framework, context = { timestamp: Date.now() }) {
        super(message, 'COMP_001', ErrorCategory.COMPLIANCE, ErrorSeverity.HIGH, {
            ...context,
            metadata: { ...context.metadata, framework },
        }, false, `Compliance error: ${framework}`);
    }
}
exports.ComplianceError = ComplianceError;
class GDPRViolationError extends ComplianceError {
    constructor(context = { timestamp: Date.now() }) {
        super('GDPR compliance violation detected', 'GDPR', context);
    }
}
exports.GDPRViolationError = GDPRViolationError;
class SOC2ViolationError extends ComplianceError {
    constructor(context = { timestamp: Date.now() }) {
        super('SOC 2 compliance violation detected', 'SOC2', context);
    }
}
exports.SOC2ViolationError = SOC2ViolationError;
class AuditLogError extends ComplianceError {
    constructor(context = { timestamp: Date.now() }) {
        super('Failed to write audit log', 'AUDIT', context);
    }
}
exports.AuditLogError = AuditLogError;
// Performance Errors
class PerformanceError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'PERF_001', ErrorCategory.PERFORMANCE, ErrorSeverity.LOW, context, true, 'Performance issue detected. The operation may take longer than usual.');
    }
}
exports.PerformanceError = PerformanceError;
class RateLimitExceededError extends PerformanceError {
    constructor(limit, window, context = { timestamp: Date.now() }) {
        super(`Rate limit exceeded: ${limit} requests per ${window}`, {
            ...context,
            metadata: { ...context.metadata, limit, window },
        });
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
class SlowOperationError extends PerformanceError {
    constructor(operation, duration, threshold, context = { timestamp: Date.now() }) {
        super(`Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
            ...context,
            metadata: { ...context.metadata, operation, duration, threshold },
        });
    }
}
exports.SlowOperationError = SlowOperationError;
// System Errors
class SystemError extends PlatformError {
    constructor(message, context = { timestamp: Date.now() }) {
        super(message, 'SYS_001', ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL, context, false, 'A system error occurred. Please contact support.');
    }
}
exports.SystemError = SystemError;
class OutOfMemoryError extends SystemError {
    constructor(context = { timestamp: Date.now() }) {
        super('System out of memory', context);
    }
}
exports.OutOfMemoryError = OutOfMemoryError;
class DiskSpaceError extends SystemError {
    constructor(available, required, context = { timestamp: Date.now() }) {
        super(`Insufficient disk space: ${available} bytes available, ${required} bytes required`, {
            ...context,
            metadata: { ...context.metadata, available, required },
        });
    }
}
exports.DiskSpaceError = DiskSpaceError;
// Error Factory for creating errors from error codes
class ErrorFactory {
    static fromCode(code, message, context) {
        const parts = code.split('_');
        const category = parts[0];
        switch (category) {
            case 'AUTH':
                return new AuthenticationError(message || 'Authentication error', context);
            case 'AUTHZ':
                return new AuthorizationError(message || 'Authorization error', context);
            case 'VAL':
                return new ValidationError(message || 'Validation error', context);
            case 'CRYPTO':
                return new CryptographicError(message || 'Cryptographic error', context);
            case 'DB':
                return new DatabaseError(message || 'Database error', context);
            case 'NET':
                return new NetworkError(message || 'Network error', context);
            case 'BIZ':
                return new BusinessLogicError(message || 'Business logic error', context);
            case 'EXT':
                return new ExternalServiceError(message || 'External service error', 'unknown', context);
            case 'COMP':
                return new ComplianceError(message || 'Compliance error', 'unknown', context);
            case 'PERF':
                return new PerformanceError(message || 'Performance error', context);
            case 'SYS':
                return new SystemError(message || 'System error', context);
            default:
                return new PlatformError(message || 'Unknown error', code, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM, context);
        }
    }
}
exports.ErrorFactory = ErrorFactory;
function createErrorHandler(options = {}) {
    return (error, req, res, next) => {
        const platformError = error instanceof PlatformError
            ? error
            : new PlatformError(error.message, 'SYS_001', ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM, {
                timestamp: Date.now(),
            });
        // Log error
        if (options.logErrors) {
            console.error('[ERROR]', JSON.stringify(platformError.toJSON()));
        }
        // Notify external services
        if (options.notifyOnError) {
            options.notifyOnError(platformError);
        }
        // Send response
        const statusCode = platformError.severity === ErrorSeverity.CRITICAL
            ? 500
            : platformError.severity === ErrorSeverity.HIGH
                ? 500
                : platformError.severity === ErrorSeverity.MEDIUM
                    ? 400
                    : 200;
        res.status(statusCode).json({
            success: false,
            error: {
                code: platformError.code,
                message: platformError.userMessage,
                category: platformError.category,
                severity: platformError.severity,
                retryable: platformError.retryable,
                requestId: platformError.context.requestId,
                ...(options.sendStackTrace && process.env.NODE_ENV !== 'production'
                    ? {
                        stack: platformError.stack,
                        details: platformError.context,
                    }
                    : {}),
            },
        });
    };
}
