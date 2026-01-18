/**
 * Enhanced Error Taxonomy for YSEEKU
 * Based on symbi-symphony protocol errors with enterprise security extensions
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
  category:
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'cryptographic'
    | 'data_integrity'
    | 'network'
    | 'system'
    | 'business_logic';
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
export class EnhancedSecurityError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly originalError?: Error;
  public readonly metadata?: Record<string, any>;
  public readonly remediation?: string;
  public readonly documentationUrl?: string;
  public readonly errorId: string;

  constructor(details: ErrorDetails) {
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
  private generateErrorId(): string {
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
  toJSON(): Record<string, any> {
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
  getSecurityReport(): SecurityErrorReport {
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
  protected isAuditRequired(): boolean {
    return ['authentication', 'authorization', 'cryptographic', 'data_integrity'].includes(
      this.context.category
    );
  }

  /**
   * Determine alert level for this error
   */
  protected determineAlertLevel(): 'info' | 'warning' | 'critical' {
    if (this.context.severity === 'critical') {return 'critical';}
    if (this.context.severity === 'high') {return 'warning';}
    return 'info';
  }

  /**
   * Get recommended actions for this error
   */
  protected getRecommendedActions(): string[] {
    const actions: string[] = [];

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

/**
 * Authentication-related errors
 */
export class AuthenticationError extends EnhancedSecurityError {
  constructor(
    message: string,
    contextOrCode: Omit<ErrorContext, 'category' | 'timestamp'> | string,
    optionsOrMetadata?:
      | {
          originalError?: Error;
          metadata?: Record<string, any>;
          remediation?: string;
        }
      | Record<string, any>
  ) {
    if (typeof contextOrCode === 'string') {
      const metadata = (optionsOrMetadata as Record<string, any>) || {};
      const component = 'auth-middleware';
      const operation = metadata.method || 'authenticate';
      const severity: ErrorContext['severity'] = 'high';
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
    const options = optionsOrMetadata as
      | {
          originalError?: Error;
          metadata?: Record<string, any>;
          remediation?: string;
        }
      | undefined;

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

/**
 * Authorization/permission errors
 */
export class AuthorizationError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      requiredPermissions?: string[];
      userPermissions?: string[];
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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

export class SecurityError extends EnhancedSecurityError {
  constructor(
    message: string,
    codeOrContext: string | Omit<ErrorContext, 'category' | 'timestamp'>,
    optionsOrMetadata?:
      | {
          originalError?: Error;
          metadata?: Record<string, any>;
          remediation?: string;
        }
      | Record<string, any>
  ) {
    if (typeof codeOrContext === 'string') {
      const metadata = (optionsOrMetadata as Record<string, any>) || {};
      const component = metadata.component || 'security';
      const operation = metadata.method || 'authorization_check';
      const severity: ErrorContext['severity'] = 'medium';
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
    const options = optionsOrMetadata as
      | {
          originalError?: Error;
          metadata?: Record<string, any>;
          remediation?: string;
        }
      | undefined;

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

/**
 * Cryptographic operation errors
 */
export class CryptographicError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      operation?: string;
      algorithm?: string;
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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

/**
 * Data integrity validation errors
 */
export class DataIntegrityError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      expectedHash?: string;
      actualHash?: string;
      dataType?: string;
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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
      remediation:
        options?.remediation || 'Data may be corrupted - verify data source and integrity',
      documentationUrl: '/docs/security/data-integrity',
    });
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      field?: string;
      value?: any;
      constraints?: string[];
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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

/**
 * Network/communication errors
 */
export class NetworkSecurityError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      endpoint?: string;
      statusCode?: number;
      timeout?: boolean;
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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

/**
 * System-level security errors
 */
export class SystemSecurityError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      systemComponent?: string;
      errorType?: string;
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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

/**
 * Business logic security errors
 */
export class BusinessLogicSecurityError extends EnhancedSecurityError {
  constructor(
    message: string,
    context: Omit<ErrorContext, 'category' | 'timestamp'>,
    options?: {
      ruleName?: string;
      ruleId?: string;
      originalError?: Error;
      metadata?: Record<string, any>;
      remediation?: string;
    }
  ) {
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

/**
 * Error handler utility class
 */
export class SecurityErrorHandler {
  /**
   * Handle error and generate security report
   */
  static handleError(error: Error, context: Partial<ErrorContext>): SecurityErrorReport {
    if (error instanceof EnhancedSecurityError) {
      return error.getSecurityReport();
    }

    // Convert generic error to system security error
    const systemError = new SystemSecurityError(
      error.message,
      {
        component: context.component || 'unknown',
        operation: context.operation || 'unknown',
        severity: context.severity || 'medium',
      },
      {
        originalError: error,
        metadata: { errorType: error.constructor.name },
      }
    );

    return systemError.getSecurityReport();
  }

  /**
   * Log error to console with structured format
   */
  static logError(report: SecurityErrorReport): void {
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
    } else if (error.context.severity === 'high') {
      console.error('[SECURITY ERROR]', JSON.stringify(logEntry, null, 2));
    } else {
      console.warn('[SECURITY WARNING]', JSON.stringify(logEntry, null, 2));
    }
  }

  /**
   * Generate error summary for reporting
   */
  static generateErrorSummary(errors: EnhancedSecurityError[]): {
    totalErrors: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    requiresAudit: number;
    criticalErrors: number;
  } {
    const summary = {
      totalErrors: errors.length,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
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
