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
    context: ErrorContext = { timestamp: Date.now() },
    retryable: boolean = false,
    userMessage?: string
  ) {
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
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Invalid credentials provided', context);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Authentication token has expired', {
      ...context,
      timestamp: Date.now()
    });
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Invalid authentication token', context);
  }
}

export class MFATokenRequiredError extends AuthenticationError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Multi-factor authentication token required', context);
  }
}

// Authorization Errors

export class AuthorizationError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(permission: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Permission denied: ${permission}`, context);
  }
}

export class RoleRequiredError extends AuthorizationError {
  constructor(requiredRole: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Required role not found: ${requiredRole}`, context);
  }
}

export class TenantAccessDeniedError extends AuthorizationError {
  constructor(tenantId: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Access denied to tenant: ${tenantId}`, context);
  }
}

// Validation Errors

export class ValidationError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(field: string, value: any, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Invalid value for field ${field}: ${JSON.stringify(value)}`, {
      ...context,
      metadata: { ...context.metadata, field, value }
    });
  }
}

export class MissingRequiredFieldError extends ValidationError {
  constructor(field: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Missing required field: ${field}`, {
      ...context,
      metadata: { ...context.metadata, field }
    });
  }
}

export class FormatValidationError extends ValidationError {
  constructor(field: string, expectedFormat: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Invalid format for field ${field}. Expected: ${expectedFormat}`, {
      ...context,
      metadata: { ...context.metadata, field, expectedFormat }
    });
  }
}

export class RangeValidationError extends ValidationError {
  constructor(field: string, value: number, min: number, max: number, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Value ${value} for field ${field} is outside valid range [${min}, ${max}]`, {
      ...context,
      metadata: { ...context.metadata, field, value, min, max }
    });
  }
}

// Cryptographic Errors

export class CryptographicError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Signature verification failed', context);
  }
}

export class KeyNotFoundError extends CryptographicError {
  constructor(keyId: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Key not found: ${keyId}`, {
      ...context,
      metadata: { ...context.metadata, keyId }
    });
  }
}

export class KeyRotationError extends CryptographicError {
  constructor(keyId: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Failed to rotate key: ${keyId}`, {
      ...context,
      metadata: { ...context.metadata, keyId },
      timestamp: Date.now()
    });
  }
}

export class HSMUnavailableError extends CryptographicError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Hardware Security Module is unavailable', {
      ...context,
      timestamp: Date.now()
    });
  }
}

export class HashChainIntegrityError extends CryptographicError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Hash chain integrity verification failed', context);
  }
}

// Database Errors

export class DatabaseError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(
      message,
      'DB_001',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      context,
      true,
      'A database error occurred. Please try again later.'
    );
  }
}

export class ConnectionError extends DatabaseError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Database connection failed', context);
  }
}

export class QueryError extends DatabaseError {
  constructor(query: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Database query failed: ${query}`, {
      ...context,
      metadata: { ...context.metadata, query }
    });
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(recordType: string, id: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`${recordType} not found: ${id}`, context);
  }
}

export class DuplicateRecordError extends DatabaseError {
  constructor(recordType: string, field: string, value: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Duplicate ${recordType}: ${field}=${value}`, {
      ...context,
      metadata: { ...context.metadata, recordType, field, value },
      timestamp: Date.now()
    });
  }
}

// Network Errors

export class NetworkError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(
      message,
      'NET_001',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      true,
      'A network error occurred. Please check your connection.'
    );
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation: string, timeout: number, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Operation ${operation} timed out after ${timeout}ms`, {
      ...context,
      metadata: { ...context.metadata, operation, timeout }
    });
  }
}

export class ServiceUnavailableError extends NetworkError {
  constructor(service: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Service ${service} is unavailable`, context);
  }
}

// Business Logic Errors

export class BusinessLogicError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Failed to calculate trust score', context);
  }
}

export class EmergenceDetectionError extends BusinessLogicError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Failed to detect emergence patterns', context);
  }
}

export class InvariantViolationError extends BusinessLogicError {
  constructor(invariant: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Invariant violation: ${invariant}`, context);
  }
}

// External Service Errors

export class ExternalServiceError extends PlatformError {
  constructor(message: string, service: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  }
}

// Compliance Errors

export class ComplianceError extends PlatformError {
  constructor(message: string, framework: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('GDPR compliance violation detected', 'GDPR', context);
  }
}

export class SOC2ViolationError extends ComplianceError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('SOC 2 compliance violation detected', 'SOC2', context);
  }
}

export class AuditLogError extends ComplianceError {
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('Failed to write audit log', 'AUDIT', context);
  }
}

// Performance Errors

export class PerformanceError extends PlatformError {
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(limit: number, window: string, context: ErrorContext = { timestamp: Date.now() }) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, {
      ...context,
      metadata: { ...context.metadata, limit, window }
    });
  }
}

export class SlowOperationError extends PerformanceError {
  constructor(operation: string, duration: number, threshold: number, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(message: string, context: ErrorContext = { timestamp: Date.now() }) {
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
  constructor(context: ErrorContext = { timestamp: Date.now() }) {
    super('System out of memory', context);
  }
}

export class DiskSpaceError extends SystemError {
  constructor(available: number, required: number, context: ErrorContext = { timestamp: Date.now() }) {
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
        { timestamp: Date.now() }
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