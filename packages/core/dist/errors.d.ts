/**
 * Comprehensive Error Taxonomy for Enterprise Error Handling
 *
 * Provides granular error types for better debugging, monitoring, and user feedback
 */
export declare enum ErrorCategory {
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    VALIDATION = "VALIDATION",
    CRYPTOGRAPHIC = "CRYPTOGRAPHIC",
    DATABASE = "DATABASE",
    NETWORK = "NETWORK",
    BUSINESS_LOGIC = "BUSINESS_LOGIC",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    SYSTEM = "SYSTEM",
    COMPLIANCE = "COMPLIANCE",
    AUDIT = "AUDIT",
    PERFORMANCE = "PERFORMANCE"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface ErrorContext {
    timestamp: number;
    requestId?: string;
    userId?: string;
    tenantId?: string;
    sessionId?: string;
    operation?: string;
    component?: string;
    metadata?: Record<string, any>;
}
/**
 * Base Error class for all platform errors
 */
export declare class PlatformError extends Error {
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly code: string;
    readonly context: ErrorContext;
    readonly retryable: boolean;
    readonly userMessage: string;
    constructor(message: string, code: string, category: ErrorCategory, severity: ErrorSeverity, context?: ErrorContext, retryable?: boolean, userMessage?: string);
    private getDefaultUserMessage;
    toJSON(): Record<string, any>;
}
export declare class AuthenticationError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class InvalidCredentialsError extends AuthenticationError {
    constructor(context?: ErrorContext);
}
export declare class TokenExpiredError extends AuthenticationError {
    constructor(context?: ErrorContext);
}
export declare class InvalidTokenError extends AuthenticationError {
    constructor(context?: ErrorContext);
}
export declare class MFATokenRequiredError extends AuthenticationError {
    constructor(context?: ErrorContext);
}
export declare class AuthorizationError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class PermissionDeniedError extends AuthorizationError {
    constructor(permission: string, context?: ErrorContext);
}
export declare class RoleRequiredError extends AuthorizationError {
    constructor(requiredRole: string, context?: ErrorContext);
}
export declare class TenantAccessDeniedError extends AuthorizationError {
    constructor(tenantId: string, context?: ErrorContext);
}
export declare class ValidationError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class InvalidInputError extends ValidationError {
    constructor(field: string, value: any, context?: ErrorContext);
}
export declare class MissingRequiredFieldError extends ValidationError {
    constructor(field: string, context?: ErrorContext);
}
export declare class FormatValidationError extends ValidationError {
    constructor(field: string, expectedFormat: string, context?: ErrorContext);
}
export declare class RangeValidationError extends ValidationError {
    constructor(field: string, value: number, min: number, max: number, context?: ErrorContext);
}
export declare class CryptographicError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class SignatureVerificationError extends CryptographicError {
    constructor(context?: ErrorContext);
}
export declare class KeyNotFoundError extends CryptographicError {
    constructor(keyId: string, context?: ErrorContext);
}
export declare class KeyRotationError extends CryptographicError {
    constructor(keyId: string, context?: ErrorContext);
}
export declare class HSMUnavailableError extends CryptographicError {
    constructor(context?: ErrorContext);
}
export declare class HashChainIntegrityError extends CryptographicError {
    constructor(context?: ErrorContext);
}
export declare class DatabaseError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class ConnectionError extends DatabaseError {
    constructor(context?: ErrorContext);
}
export declare class QueryError extends DatabaseError {
    constructor(query: string, context?: ErrorContext);
}
export declare class RecordNotFoundError extends DatabaseError {
    constructor(recordType: string, id: string, context?: ErrorContext);
}
export declare class DuplicateRecordError extends DatabaseError {
    constructor(recordType: string, field: string, value: string, context?: ErrorContext);
}
export declare class NetworkError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class TimeoutError extends NetworkError {
    constructor(operation: string, timeout: number, context?: ErrorContext);
}
export declare class ServiceUnavailableError extends NetworkError {
    constructor(service: string, context?: ErrorContext);
}
export declare class BusinessLogicError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class TrustScoreCalculationError extends BusinessLogicError {
    constructor(context?: ErrorContext);
}
export declare class EmergenceDetectionError extends BusinessLogicError {
    constructor(context?: ErrorContext);
}
export declare class InvariantViolationError extends BusinessLogicError {
    constructor(invariant: string, context?: ErrorContext);
}
export declare class ExternalServiceError extends PlatformError {
    constructor(message: string, service: string, context?: ErrorContext);
}
export declare class ComplianceError extends PlatformError {
    constructor(message: string, framework: string, context?: ErrorContext);
}
export declare class GDPRViolationError extends ComplianceError {
    constructor(context?: ErrorContext);
}
export declare class SOC2ViolationError extends ComplianceError {
    constructor(context?: ErrorContext);
}
export declare class AuditLogError extends ComplianceError {
    constructor(context?: ErrorContext);
}
export declare class PerformanceError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class RateLimitExceededError extends PerformanceError {
    constructor(limit: number, window: string, context?: ErrorContext);
}
export declare class SlowOperationError extends PerformanceError {
    constructor(operation: string, duration: number, threshold: number, context?: ErrorContext);
}
export declare class SystemError extends PlatformError {
    constructor(message: string, context?: ErrorContext);
}
export declare class OutOfMemoryError extends SystemError {
    constructor(context?: ErrorContext);
}
export declare class DiskSpaceError extends SystemError {
    constructor(available: number, required: number, context?: ErrorContext);
}
export declare class ErrorFactory {
    static fromCode(code: string, message?: string, context?: ErrorContext): PlatformError;
}
export interface ErrorHandlerOptions {
    logErrors?: boolean;
    sendStackTrace?: boolean;
    notifyOnError?: (error: PlatformError) => void;
}
export declare function createErrorHandler(options?: ErrorHandlerOptions): (error: Error, req: any, res: any, next: any) => void;
