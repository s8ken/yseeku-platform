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
import { HashChain } from './hash-chain';
export { HashChain, type HashChainLink, type HashChainConfig, type ChainVerificationResult, } from './hash-chain';
import { EnhancedSecurityError, AuthenticationError, AuthorizationError, CryptographicError, DataIntegrityError, ValidationError, NetworkSecurityError, SystemSecurityError, BusinessLogicSecurityError, SecurityErrorHandler } from './error-taxonomy';
export { EnhancedSecurityError, AuthenticationError, AuthorizationError, SecurityError, CryptographicError, DataIntegrityError, ValidationError, NetworkSecurityError, SystemSecurityError, BusinessLogicSecurityError, SecurityErrorHandler, type ErrorContext, type ErrorDetails, type SecurityErrorReport, } from './error-taxonomy';
export declare const SECURITY_CONSTANTS: {
    readonly DEFAULT_HASH_ALGORITHM: "sha256";
    readonly DEFAULT_SIGNATURE_ALGORITHM: "ed25519";
    readonly DEFAULT_KEY_SIZE: 32;
    readonly DEFAULT_AUDIT_RETENTION_DAYS: 90;
    readonly DEFAULT_MAX_CHAIN_LENGTH: 10000;
    readonly SEVERITY_CRITICAL: "critical";
    readonly SEVERITY_HIGH: "high";
    readonly SEVERITY_MEDIUM: "medium";
    readonly SEVERITY_LOW: "low";
    readonly CATEGORY_AUTHENTICATION: "authentication";
    readonly CATEGORY_AUTHORIZATION: "authorization";
    readonly CATEGORY_CRYPTOGRAPHIC: "cryptographic";
    readonly CATEGORY_DATA_INTEGRITY: "data_integrity";
    readonly CATEGORY_VALIDATION: "validation";
    readonly CATEGORY_NETWORK: "network";
    readonly CATEGORY_SYSTEM: "system";
    readonly CATEGORY_BUSINESS_LOGIC: "business_logic";
    readonly SECURITY_HEADERS: {
        readonly CSP: "Content-Security-Policy";
        readonly HSTS: "Strict-Transport-Security";
        readonly X_FRAME_OPTIONS: "X-Frame-Options";
        readonly X_CONTENT_TYPE_OPTIONS: "X-Content-Type-Options";
        readonly REFERRER_POLICY: "Referrer-Policy";
        readonly X_XSS_PROTECTION: "X-XSS-Protection";
    };
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX_REQUESTS: 100;
    readonly JWT_EXPIRATION_TIME: "1h";
    readonly JWT_REFRESH_EXPIRATION_TIME: "7d";
    readonly JWT_ISSUER: "yseeku-platform";
};
export declare class SecurityUtils {
    /**
     * Generate secure random identifier
     */
    static generateSecureId(prefix?: string): string;
    /**
     * Validate security identifier format
     */
    static validateSecurityId(id: string, prefix?: string): boolean;
    /**
     * Calculate security risk score
     */
    static calculateRiskScore(factors: {
        severity: string;
        category: string;
        frequency: number;
        impact: number;
        exploitability: number;
    }): number;
    /**
     * Format security timestamp
     */
    static formatSecurityTimestamp(timestamp?: number): string;
    /**
     * Parse security timestamp
     */
    static parseSecurityTimestamp(timestamp: string): number;
    /**
     * Validate security configuration
     */
    static validateSecurityConfig(config: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
}
declare const SecurityModule: {
    HashChain: typeof HashChain;
    EnhancedSecurityError: typeof EnhancedSecurityError;
    AuthenticationError: typeof AuthenticationError;
    AuthorizationError: typeof AuthorizationError;
    CryptographicError: typeof CryptographicError;
    DataIntegrityError: typeof DataIntegrityError;
    ValidationError: typeof ValidationError;
    NetworkSecurityError: typeof NetworkSecurityError;
    SystemSecurityError: typeof SystemSecurityError;
    BusinessLogicSecurityError: typeof BusinessLogicSecurityError;
    SecurityUtils: typeof SecurityUtils;
    SecurityErrorHandler: typeof SecurityErrorHandler;
    SECURITY_CONSTANTS: {
        readonly DEFAULT_HASH_ALGORITHM: "sha256";
        readonly DEFAULT_SIGNATURE_ALGORITHM: "ed25519";
        readonly DEFAULT_KEY_SIZE: 32;
        readonly DEFAULT_AUDIT_RETENTION_DAYS: 90;
        readonly DEFAULT_MAX_CHAIN_LENGTH: 10000;
        readonly SEVERITY_CRITICAL: "critical";
        readonly SEVERITY_HIGH: "high";
        readonly SEVERITY_MEDIUM: "medium";
        readonly SEVERITY_LOW: "low";
        readonly CATEGORY_AUTHENTICATION: "authentication";
        readonly CATEGORY_AUTHORIZATION: "authorization";
        readonly CATEGORY_CRYPTOGRAPHIC: "cryptographic";
        readonly CATEGORY_DATA_INTEGRITY: "data_integrity";
        readonly CATEGORY_VALIDATION: "validation";
        readonly CATEGORY_NETWORK: "network";
        readonly CATEGORY_SYSTEM: "system";
        readonly CATEGORY_BUSINESS_LOGIC: "business_logic";
        readonly SECURITY_HEADERS: {
            readonly CSP: "Content-Security-Policy";
            readonly HSTS: "Strict-Transport-Security";
            readonly X_FRAME_OPTIONS: "X-Frame-Options";
            readonly X_CONTENT_TYPE_OPTIONS: "X-Content-Type-Options";
            readonly REFERRER_POLICY: "Referrer-Policy";
            readonly X_XSS_PROTECTION: "X-XSS-Protection";
        };
        readonly RATE_LIMIT_WINDOW_MS: number;
        readonly RATE_LIMIT_MAX_REQUESTS: 100;
        readonly JWT_EXPIRATION_TIME: "1h";
        readonly JWT_REFRESH_EXPIRATION_TIME: "7d";
        readonly JWT_ISSUER: "yseeku-platform";
    };
};
export default SecurityModule;
