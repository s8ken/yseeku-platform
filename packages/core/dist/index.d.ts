/**
 * @sonate/core - Core Trust Protocol Implementation
 *
 * Implements the SONATE Trust Framework as specified at:
 * https://gammatria.com/schemas/trust-receipt
 *
 * This package provides the foundational trust infrastructure
 * for all SONATE platform modules.
 */
export { TrustProtocol } from './trust/trust-protocol';
export { TrustReceipt, initCrypto, isCryptoReady } from './receipts/trust-receipt';
export { SonateScorer } from './principles/sonate-scorer';
export { PrincipleEvaluator, createDefaultContext, type EvaluationContext, type PrincipleEvaluationResult } from './principles/principle-evaluator';
export { DEFAULT_EU_CONFIG, STREAMLINED_CONFIG, STRICT_CONFIG, US_CONFIG, getConsentConfig, validateConsentConfig, mergeWithDefaults, type ConsentConfiguration, type ConsentModel, type ConsentScopes, type EscalationChannel, type EscalationChannelConfig, type DataRequestConfig, type DataRequestMode, type WithdrawalBehavior, } from './config/consent-config';
export * from './utils/errors';
export { hashChain, genesisHash } from './utils/hash-chain';
export { signPayload, verifySignature, generateKeyPair } from './utils/signatures';
export * from './utils/crypto-advanced';
export * from './utils/robust-fetch';
export * from './utils/canonicalize';
export { logger, log, createLogger, securityLogger, performanceLogger, apiLogger, LogLevel, } from './utils/logger';
export * from './monitoring/metrics';
export * from './monitoring/performance';
export * from './monitoring/health';
export declare const TRUST_PRINCIPLES: {
    readonly CONSENT_ARCHITECTURE: {
        readonly weight: 0.25;
        readonly critical: true;
        readonly description: "Users must explicitly consent to AI interactions and understand implications";
    };
    readonly INSPECTION_MANDATE: {
        readonly weight: 0.2;
        readonly critical: false;
        readonly description: "All AI decisions must be inspectable and auditable";
    };
    readonly CONTINUOUS_VALIDATION: {
        readonly weight: 0.2;
        readonly critical: false;
        readonly description: "AI behavior must be continuously validated against constitutional principles";
    };
    readonly ETHICAL_OVERRIDE: {
        readonly weight: 0.15;
        readonly critical: true;
        readonly description: "Humans must have ability to override AI decisions on ethical grounds";
    };
    readonly RIGHT_TO_DISCONNECT: {
        readonly weight: 0.1;
        readonly critical: false;
        readonly description: "Users can disconnect from AI systems at any time without penalty";
    };
    readonly MORAL_RECOGNITION: {
        readonly weight: 0.1;
        readonly critical: false;
        readonly description: "AI must recognize and respect human moral agency";
    };
};
export type TrustPrincipleKey = keyof typeof TRUST_PRINCIPLES;
export type PrincipleScores = Record<TrustPrincipleKey, number>;
export interface TrustScore {
    overall: number;
    principles: PrincipleScores;
    violations: TrustPrincipleKey[];
    timestamp: number;
}
export interface CIQMetrics {
    clarity: number;
    integrity: number;
    quality: number;
}
export * from './coherence/resonance-metric';
export * from './utils/linguistic-vector-steering';
export * from './utils/tenant-context';
export * from './validation/schemas';
export * from './errors/math-errors';
export { SecurityAuditor, runSecurityAudit } from './security/security-audit';
export * from './security/mfa-system';
export { SecureAuthService } from './security/auth-service';
export * from './constants/algorithmic';
