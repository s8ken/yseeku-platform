/**
 * Comprehensive Error Taxonomy for Enterprise Error Handling
 * 
 * Provides granular error types for better debugging, monitoring, and user feedback
 */

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  CRYPTOGRAPHIC = 'CRYPTOGRAPHIC',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  SYSTEM = 'SYSTEM',
  COMPLIANCE = 'COMPLIANCE',
  AUDIT = 'AUDIT',
  PERFORMANCE = 'PERFORMANCE'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
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
export class PlatformError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: ErrorContext = {},
    retryable: boolean = false,
    userMessage?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = {
      timestamp: Date.now(),
      ...context
    };
    this.retryable = retryable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    
    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultUserMessage(): string {
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

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      stack: process.env.NODE_ENV === 'production' ? undefined : this.stack
    };
  }
}

// Authentication Errors

export class AuthenticationError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'AUTH_001',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      context,
      false,
      'Authentication failed. Please check your credentials.'
    );
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(context: ErrorContext = {}) {
    super('Invalid credentials provided', context);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(context: ErrorContext = {}) {
    super('Authentication token has expired', {
      ...context,
      retryable: true
    });
    this.retryable = true;
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(context: ErrorContext = {}) {
    super('Invalid authentication token', context);
  }
}

export class MFATokenRequiredError extends AuthenticationError {
  constructor(context: ErrorContext = {}) {
    super('Multi-factor authentication token required', context);
  }
}

// Authorization Errors

export class AuthorizationError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'AUTHZ_001',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      context,
      false,
      'You do not have permission to perform this action.'
    );
  }
}

export class PermissionDeniedError extends AuthorizationError {
  constructor(permission: string, context: ErrorContext = {}) {
    super(`Permission denied: ${permission}`, context);
  }
}

export class RoleRequiredError extends AuthorizationError {
  constructor(requiredRole: string, context: ErrorContext = {}) {
    super(`Required role not found: ${requiredRole}`, context);
  }
}

export class TenantAccessDeniedError extends AuthorizationError {
  constructor(tenantId: string, context: ErrorContext = {}) {
    super(`Access denied to tenant: ${tenantId}`, context);
  }
}

// Validation Errors

export class ValidationError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'VAL_001',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      context,
      false,
      'Invalid input provided. Please check your data.'
    );
  }
}

export class InvalidInputError extends ValidationError {
  constructor(field: string, value: any, context: ErrorContext = {}) {
    super(`Invalid value for field ${field}: ${JSON.stringify(value)}`, {
      ...context,
      metadata: { ...context.metadata, field, value }
    });
  }
}

export class MissingRequiredFieldError extends ValidationError {
  constructor(field: string, context: ErrorContext = {}) {
    super(`Missing required field: ${field}`, {
      ...context,
      metadata: { ...context.metadata, field }
    });
  }
}

export class FormatValidationError extends ValidationError {
  constructor(field: string, expectedFormat: string, context: ErrorContext = {}) {
    super(`Invalid format for field ${field}. Expected: ${expectedFormat}`, {
      ...context,
      metadata: { ...context.metadata, field, expectedFormat }
    });
  }
}

export class RangeValidationError extends ValidationError {
  constructor(field: string, value: number, min: number, max: number, context: ErrorContext = {}) {
    super(`Value ${value} for field ${field} is outside valid range [${min}, ${max}]`, {
      ...context,
      metadata: { ...context.metadata, field, value, min, max }
    });
  }
}

// Cryptographic Errors

export class CryptographicError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'CRYPTO_001',
      ErrorCategory.CRYPTOGRAPHIC,
      ErrorSeverity.CRITICAL,
      context,
      false,
      'A cryptographic error occurred. Please contact support.'
    );
  }
}

export class SignatureVerificationError extends CryptographicError {
  constructor(context: ErrorContext = {}) {
    super('Signature verification failed', context);
  }
}

export class KeyNotFoundError extends CryptographicError {
  constructor(keyId: string, context: ErrorContext = {}) {
    super(`Key not found: ${keyId}`, {
      ...context,
      metadata: { ...context.metadata, keyId }
    });
  }
}

export class KeyRotationError extends CryptographicError {
  constructor(keyId: string, context: ErrorContext = {}) {
    super(`Failed to rotate key: ${keyId}`, {
      ...context,
      metadata: { ...context.metadata, keyId },
      retryable: true
    });
    this.retryable = true;
  }
}

export class HSMUnavailableError extends CryptographicError {
  constructor(context: ErrorContext = {}) {
    super('Hardware Security Module is unavailable', {
      ...context,
      retryable: true
    });
    this.retryable = true;
  }
}

export class HashChainIntegrityError extends CryptographicError {
  constructor(context: ErrorContext = {}) {
    super('Hash chain integrity verification failed', context);
  }
}

// Database Errors

export class DatabaseError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'DB_001',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      context,
      true,
      'A database error occurred. Please try again later.'
    );
    this.retryable = true;
  }
}

export class ConnectionError extends DatabaseError {
  constructor(context: ErrorContext = {}) {
    super('Database connection failed', context);
  }
}

export class QueryError extends DatabaseError {
  constructor(query: string, context: ErrorContext = {}) {
    super(`Database query failed: ${query}`, {
      ...context,
      metadata: { ...context.metadata, query }
    });
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(recordType: string, id: string, context: ErrorContext = {}) {
    super(`${recordType} not found: ${id}`, {
      ...context,
      retryable: false
    });
    this.retryable = false;
  }
}

export class DuplicateRecordError extends DatabaseError {
  constructor(recordType: string, field: string, value: string, context: ErrorContext = {}) {
    super(`Duplicate ${recordType}: ${field}=${value}`, {
      ...context,
      retryable: false,
      metadata: { ...context.metadata, recordType, field, value }
    });
    this.retryable = false;
  }
}

// Network Errors

export class NetworkError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'NET_001',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'A network error occurred. Please check your connection.'
    );
    this.retryable = true;
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation: string, timeout: number, context: ErrorContext = {}) {
    super(`Operation ${operation} timed out after ${timeout}ms`, {
      ...context,
      metadata: { ...context.metadata, operation, timeout }
    });
  }
}

export class ServiceUnavailableError extends NetworkError {
  constructor(service: string, context: ErrorContext = {}) {
    super(`Service ${service} is unavailable`, context);
  }
}

// Business Logic Errors

export class BusinessLogicError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'BIZ_001',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      context,
      false,
      'An error occurred while processing your request.'
    );
  }
}

export class TrustScoreCalculationError extends BusinessLogicError {
  constructor(context: ErrorContext = {}) {
    super('Failed to calculate trust score', context);
  }
}

export class EmergenceDetectionError extends BusinessLogicError {
  constructor(context: ErrorContext = {}) {
    super('Failed to detect emergence patterns', context);
  }
}

export class InvariantViolationError extends BusinessLogicError {
  constructor(invariant: string, context: ErrorContext = {}) {
    super(`Invariant violation: ${invariant}`, {
      ...context,
      severity: ErrorSeverity.HIGH
    });
    this.severity = ErrorSeverity.HIGH;
  }
}

// External Service Errors

export class ExternalServiceError extends PlatformError {
  constructor(message: string, service: string, context: ErrorContext = {}) {
    super(
      message,
      'EXT_001',
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.MEDIUM,
      {
        ...context,
        metadata: { ...context.metadata, service }
      },
      true,
      `Error communicating with external service: ${service}`
    );
    this.retryable = true;
  }
}

// Compliance Errors

export class ComplianceError extends PlatformError {
  constructor(message: string, framework: string, context: ErrorContext = {}) {
    super(
      message,
      'COMP_001',
      ErrorCategory.COMPLIANCE,
      ErrorSeverity.HIGH,
      {
        ...context,
        metadata: { ...context.metadata, framework }
      },
      false,
      `Compliance error: ${framework}`
    );
  }
}

export class GDPRViolationError extends ComplianceError {
  constructor(context: ErrorContext = {}) {
    super('GDPR compliance violation detected', 'GDPR', context);
  }
}

export class SOC2ViolationError extends ComplianceError {
  constructor(context: ErrorContext = {}) {
    super('SOC 2 compliance violation detected', 'SOC2', context);
  }
}

export class AuditLogError extends ComplianceError {
  constructor(context: ErrorContext = {}) {
    super('Failed to write audit log', 'AUDIT', {
      ...context,
      severity: ErrorSeverity.CRITICAL
    });
    this.severity = ErrorSeverity.CRITICAL;
  }
}

// Performance Errors

export class PerformanceError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'PERF_001',
      ErrorCategory.PERFORMANCE,
      ErrorSeverity.LOW,
      context,
      true,
      'Performance issue detected. The operation may take longer than usual.'
    );
  }
}

export class RateLimitExceededError extends PerformanceError {
  constructor(limit: number, window: string, context: ErrorContext = {}) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, {
      ...context,
      metadata: { ...context.metadata, limit, window },
      retryable: true
    });
  }
}

export class SlowOperationError extends PerformanceError {
  constructor(operation: string, duration: number, threshold: number, context: ErrorContext = {}) {
    super(
      `Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      {
        ...context,
        metadata: { ...context.metadata, operation, duration, threshold }
      }
    );
  }
}

// System Errors

export class SystemError extends PlatformError {
  constructor(message: string, context: ErrorContext = {}) {
    super(
      message,
      'SYS_001',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      context,
      false,
      'A system error occurred. Please contact support.'
    );
  }
}

export class OutOfMemoryError extends SystemError {
  constructor(context: ErrorContext = {}) {
    super('System out of memory', context);
  }
}

export class DiskSpaceError extends SystemError {
  constructor(available: number, required: number, context: ErrorContext = {}) {
    super(
      `Insufficient disk space: ${available} bytes available, ${required} bytes required`,
      {
        ...context,
        metadata: { ...context.metadata, available, required }
      }
    );
  }
}

// Error Factory for creating errors from error codes

export class ErrorFactory {
  static fromCode(code: string, message?: string, context?: ErrorContext): PlatformError {
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
        return new PlatformError(
          message || 'Unknown error',
          code,
          ErrorCategory.SYSTEM,
          ErrorSeverity.MEDIUM,
          context
        );
    }
  }
}

// Error Handler Middleware (for Express/Fastify)

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  sendStackTrace?: boolean;
  notifyOnError?: (error: PlatformError) => void;
}

export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  return (error: Error, req: any, res: any, next: any) => {
    const platformError = error instanceof PlatformError ? error : 
      new PlatformError(
        error.message,
        'SYS_001',
        ErrorCategory.SYSTEM,
        ErrorSeverity.MEDIUM,
        { originalError: error.name }
      );

    // Log error
    if (options.logErrors) {
      console.error('[ERROR]', JSON.stringify(platformError.toJSON()));
    }

    // Notify external services
    if (options.notifyOnError) {
      options.notifyOnError(platformError);
    }

    // Send response
    const statusCode = platformError.severity === ErrorSeverity.CRITICAL ? 500 :
                      platformError.severity === ErrorSeverity.HIGH ? 500 :
                      platformError.severity === ErrorSeverity.MEDIUM ? 400 : 200;

    res.status(statusCode).json({
      success: false,
      error: {
        code: platformError.code,
        message: platformError.userMessage,
        category: platformError.category,
        severity: platformError.severity,
        retryable: platformError.retryable,
        requestId: platformError.context.requestId,
        ...(options.sendStackTrace && process.env.NODE_ENV !== 'production' ? {
          stack: platformError.stack,
          details: platformError.context
        } : {})
      }
    });
  };
}