/**
 * Security Error Classes
 *
 * Custom error types for security-related operations
 */

export class SecurityError extends Error {
  constructor(message: string, public code?: string, public context?: any, public metadata?: any) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class SystemSecurityError extends SecurityError {
  constructor(message: string, context?: any, metadata?: any) {
    super(message, 'SYSTEM_ERROR', context, metadata);
    this.name = 'SystemSecurityError';
  }
}

export class EnhancedSecurityError extends SecurityError {
  constructor(message: string) {
    super(message, 'ENHANCED_ERROR');
    this.name = 'EnhancedSecurityError';
  }
}
