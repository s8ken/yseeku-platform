"use strict";
/**
 * YSEEKU Security Module - Enhanced Security Components
 *
 * This module consolidates all security components ported from sonate-protocol
 * and enhanced for enterprise-grade security in YSEEKU platform.
 *
 * Components:
 * - Enhanced Cryptography (Ed25519, Hash Chains)
 * - Tamper-evident Audit Trails
 * - Structured Error Taxonomy
 * - Enterprise Security Patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = exports.SECURITY_CONSTANTS = exports.SecurityErrorHandler = exports.BusinessLogicSecurityError = exports.SystemSecurityError = exports.NetworkSecurityError = exports.ValidationError = exports.DataIntegrityError = exports.CryptographicError = exports.SecurityError = exports.AuthorizationError = exports.AuthenticationError = exports.EnhancedSecurityError = exports.HashChain = void 0;
const hash_chain_1 = require("./hash-chain");
var hash_chain_2 = require("./hash-chain");
Object.defineProperty(exports, "HashChain", { enumerable: true, get: function () { return hash_chain_2.HashChain; } });
const error_taxonomy_1 = require("./error-taxonomy");
var error_taxonomy_2 = require("./error-taxonomy");
Object.defineProperty(exports, "EnhancedSecurityError", { enumerable: true, get: function () { return error_taxonomy_2.EnhancedSecurityError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return error_taxonomy_2.AuthenticationError; } });
Object.defineProperty(exports, "AuthorizationError", { enumerable: true, get: function () { return error_taxonomy_2.AuthorizationError; } });
Object.defineProperty(exports, "SecurityError", { enumerable: true, get: function () { return error_taxonomy_2.SecurityError; } });
Object.defineProperty(exports, "CryptographicError", { enumerable: true, get: function () { return error_taxonomy_2.CryptographicError; } });
Object.defineProperty(exports, "DataIntegrityError", { enumerable: true, get: function () { return error_taxonomy_2.DataIntegrityError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return error_taxonomy_2.ValidationError; } });
Object.defineProperty(exports, "NetworkSecurityError", { enumerable: true, get: function () { return error_taxonomy_2.NetworkSecurityError; } });
Object.defineProperty(exports, "SystemSecurityError", { enumerable: true, get: function () { return error_taxonomy_2.SystemSecurityError; } });
Object.defineProperty(exports, "BusinessLogicSecurityError", { enumerable: true, get: function () { return error_taxonomy_2.BusinessLogicSecurityError; } });
Object.defineProperty(exports, "SecurityErrorHandler", { enumerable: true, get: function () { return error_taxonomy_2.SecurityErrorHandler; } });
// Security Constants
exports.SECURITY_CONSTANTS = {
    // Cryptographic constants
    DEFAULT_HASH_ALGORITHM: 'sha256',
    DEFAULT_SIGNATURE_ALGORITHM: 'ed25519',
    DEFAULT_KEY_SIZE: 32,
    // Audit constants
    DEFAULT_AUDIT_RETENTION_DAYS: 90,
    DEFAULT_MAX_CHAIN_LENGTH: 10000,
    // Error severity levels
    SEVERITY_CRITICAL: 'critical',
    SEVERITY_HIGH: 'high',
    SEVERITY_MEDIUM: 'medium',
    SEVERITY_LOW: 'low',
    // Error categories
    CATEGORY_AUTHENTICATION: 'authentication',
    CATEGORY_AUTHORIZATION: 'authorization',
    CATEGORY_CRYPTOGRAPHIC: 'cryptographic',
    CATEGORY_DATA_INTEGRITY: 'data_integrity',
    CATEGORY_VALIDATION: 'validation',
    CATEGORY_NETWORK: 'network',
    CATEGORY_SYSTEM: 'system',
    CATEGORY_BUSINESS_LOGIC: 'business_logic',
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
};
// Security Utilities
class SecurityUtils {
    /**
     * Generate secure random identifier
     */
    static generateSecureId(prefix = 'yseeku') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}-${timestamp}-${random}`;
    }
    /**
     * Validate security identifier format
     */
    static validateSecurityId(id, prefix = 'yseeku') {
        const pattern = new RegExp(`^${prefix}-[a-z0-9]+-[a-z0-9]{9}$`);
        return pattern.test(id);
    }
    /**
     * Calculate security risk score
     */
    static calculateRiskScore(factors) {
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
        const severityWeight = severityWeights[factors.severity] || 0.1;
        const categoryWeight = categoryWeights[factors.category] || 0.1;
        // Risk score calculation (0-100)
        const riskScore = Math.min(100, severityWeight * 40 +
            categoryWeight * 30 +
            Math.min(factors.frequency / 10, 1) * 10 +
            factors.impact * 10 +
            factors.exploitability * 10);
        return Math.round(riskScore);
    }
    /**
     * Format security timestamp
     */
    static formatSecurityTimestamp(timestamp = Date.now()) {
        return new Date(timestamp).toISOString();
    }
    /**
     * Parse security timestamp
     */
    static parseSecurityTimestamp(timestamp) {
        return new Date(timestamp).getTime();
    }
    /**
     * Validate security configuration
     */
    static validateSecurityConfig(config) {
        const errors = [];
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
        if (config.signatureAlgorithm &&
            !validSignatureAlgorithms.includes(config.signatureAlgorithm)) {
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
exports.SecurityUtils = SecurityUtils;
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
    HashChain: hash_chain_1.HashChain,
    // Error classes
    EnhancedSecurityError: error_taxonomy_1.EnhancedSecurityError,
    AuthenticationError: error_taxonomy_1.AuthenticationError,
    AuthorizationError: error_taxonomy_1.AuthorizationError,
    CryptographicError: error_taxonomy_1.CryptographicError,
    DataIntegrityError: error_taxonomy_1.DataIntegrityError,
    ValidationError: error_taxonomy_1.ValidationError,
    NetworkSecurityError: error_taxonomy_1.NetworkSecurityError,
    SystemSecurityError: error_taxonomy_1.SystemSecurityError,
    BusinessLogicSecurityError: error_taxonomy_1.BusinessLogicSecurityError,
    // Utilities
    SecurityUtils,
    SecurityErrorHandler: error_taxonomy_1.SecurityErrorHandler,
    // Constants
    SECURITY_CONSTANTS: exports.SECURITY_CONSTANTS,
};
exports.default = SecurityModule;
