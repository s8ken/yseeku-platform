/**
 * YSEEKU Security Module - Enhanced Security Components
 *
 * This module consolidates all security components ported from symbi-symphony
 * and enhanced for enterprise-grade security in YSEEKU platform.
 *
 * Components:
 * - Enhanced Cryptography (Ed25519, Hash Chains)
 * - Tamper-evident Audit Trails
 * - Structured Error Taxonomy
 * - Enterprise Security Patterns
 */

import {
  HashChain,
  type HashChainLink,
  type HashChainConfig,
  type ChainVerificationResult,
} from './hash-chain';

export {
  HashChain,
  type HashChainLink,
  type HashChainConfig,
  type ChainVerificationResult,
} from './hash-chain';

import {
  EnhancedSecurityError,
  AuthenticationError,
  AuthorizationError,
  SecurityError,
  CryptographicError,
  DataIntegrityError,
  ValidationError,
  NetworkSecurityError,
  SystemSecurityError,
  BusinessLogicSecurityError,
  SecurityErrorHandler,
  type ErrorContext,
  type ErrorDetails,
  type SecurityErrorReport,
} from './error-taxonomy';

export {
  EnhancedSecurityError,
  AuthenticationError,
  AuthorizationError,
  SecurityError,
  CryptographicError,
  DataIntegrityError,
  ValidationError,
  NetworkSecurityError,
  SystemSecurityError,
  BusinessLogicSecurityError,
  SecurityErrorHandler,
  type ErrorContext,
  type ErrorDetails,
  type SecurityErrorReport,
} from './error-taxonomy';

// Security Constants
export const SECURITY_CONSTANTS = {
  // Cryptographic constants
  DEFAULT_HASH_ALGORITHM: 'sha256',
  DEFAULT_SIGNATURE_ALGORITHM: 'ed25519',
  DEFAULT_KEY_SIZE: 32,

  // Audit constants
  DEFAULT_AUDIT_RETENTION_DAYS: 90,
  DEFAULT_MAX_CHAIN_LENGTH: 10000,

  // Error severity levels
  SEVERITY_CRITICAL: 'critical' as const,
  SEVERITY_HIGH: 'high' as const,
  SEVERITY_MEDIUM: 'medium' as const,
  SEVERITY_LOW: 'low' as const,

  // Error categories
  CATEGORY_AUTHENTICATION: 'authentication' as const,
  CATEGORY_AUTHORIZATION: 'authorization' as const,
  CATEGORY_CRYPTOGRAPHIC: 'cryptographic' as const,
  CATEGORY_DATA_INTEGRITY: 'data_integrity' as const,
  CATEGORY_VALIDATION: 'validation' as const,
  CATEGORY_NETWORK: 'network' as const,
  CATEGORY_SYSTEM: 'system' as const,
  CATEGORY_BUSINESS_LOGIC: 'business_logic' as const,

  // Security headers
  SECURITY_HEADERS: {
    CSP: 'Content-Security-Policy',
    HSTS: 'Strict-Transport-Security',
    X_FRAME_OPTIONS: 'X-Frame-Options',
    X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
    REFERRER_POLICY: 'Referrer-Policy',
    X_XSS_PROTECTION: 'X-XSS-Protection',
  },

  // Rate limiting defaults
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  // JWT constants
  JWT_EXPIRATION_TIME: '1h',
  JWT_REFRESH_EXPIRATION_TIME: '7d',
  JWT_ISSUER: 'yseeku-platform',
} as const;

// Security Utilities
export class SecurityUtils {
  /**
   * Generate secure random identifier
   */
  static generateSecureId(prefix: string = 'yseeku'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Validate security identifier format
   */
  static validateSecurityId(id: string, prefix: string = 'yseeku'): boolean {
    const pattern = new RegExp(`^${prefix}-[a-z0-9]+-[a-z0-9]{9}$`);
    return pattern.test(id);
  }

  /**
   * Calculate security risk score
   */
  static calculateRiskScore(factors: {
    severity: string;
    category: string;
    frequency: number;
    impact: number;
    exploitability: number;
  }): number {
    const severityWeights = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.2,
    };

    const categoryWeights = {
      authentication: 1.0,
      authorization: 0.9,
      cryptographic: 0.8,
      data_integrity: 0.7,
      validation: 0.6,
      network: 0.5,
      system: 0.4,
      business_logic: 0.3,
    };

    const severityWeight = severityWeights[factors.severity as keyof typeof severityWeights] || 0.1;
    const categoryWeight = categoryWeights[factors.category as keyof typeof categoryWeights] || 0.1;

    // Risk score calculation (0-100)
    const riskScore = Math.min(
      100,
      severityWeight * 40 +
        categoryWeight * 30 +
        Math.min(factors.frequency / 10, 1) * 10 +
        factors.impact * 10 +
        factors.exploitability * 10
    );

    return Math.round(riskScore);
  }

  /**
   * Format security timestamp
   */
  static formatSecurityTimestamp(timestamp: number = Date.now()): string {
    return new Date(timestamp).toISOString();
  }

  /**
   * Parse security timestamp
   */
  static parseSecurityTimestamp(timestamp: string): number {
    return new Date(timestamp).getTime();
  }

  /**
   * Validate security configuration
   */
  static validateSecurityConfig(config: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.hashAlgorithm) {
      errors.push('Hash algorithm is required');
    }

    if (!config.signatureAlgorithm) {
      errors.push('Signature algorithm is required');
    }

    // Validate algorithm choices
    const validHashAlgorithms = ['sha256', 'sha384', 'sha512'];
    if (config.hashAlgorithm && !validHashAlgorithms.includes(config.hashAlgorithm)) {
      errors.push(`Invalid hash algorithm: ${config.hashAlgorithm}`);
    }

    const validSignatureAlgorithms = ['ed25519', 'rsa', 'ecdsa'];
    if (
      config.signatureAlgorithm &&
      !validSignatureAlgorithms.includes(config.signatureAlgorithm)
    ) {
      errors.push(`Invalid signature algorithm: ${config.signatureAlgorithm}`);
    }

    // Validate key sizes
    if (config.keySize && (config.keySize < 2048 || config.keySize > 8192)) {
      errors.push('Key size must be between 2048 and 8192 bits');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/*
// Security Manager - Main entry point for security operations
export class SecurityManager {
  private cryptoManager: any;
  private auditSystem: any;
  private initialized: boolean = false;

  constructor() {
    // These are disabled for now as they depend on excluded enhanced files
    this.cryptoManager = null;
    this.auditSystem = null;
  }

  async initialize(keyPair?: any): Promise<void> {
    this.initialized = true;
  }

  getCryptoManager(): any {
    return this.cryptoManager;
  }

  getAuditSystem(): any {
    return this.auditSystem;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
*/

// Default export
const SecurityModule = {
  // Managers
  // SecurityManager,

  // Core classes
  HashChain,

  // Error classes
  EnhancedSecurityError,
  AuthenticationError,
  AuthorizationError,
  CryptographicError,
  DataIntegrityError,
  ValidationError,
  NetworkSecurityError,
  SystemSecurityError,
  BusinessLogicSecurityError,

  // Utilities
  SecurityUtils,
  SecurityErrorHandler,

  // Constants
  SECURITY_CONSTANTS,
};

export default SecurityModule;
