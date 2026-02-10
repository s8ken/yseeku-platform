/**
 * @sonate/core - Core Trust Protocol Implementation
 *
 * Implements the SONATE Trust Framework as specified at:
 * https://gammatria.com/schemas/trust-receipt
 *
 * This package provides the foundational trust infrastructure
 * for all SONATE platform modules.
 */

// === TRUST LAYER ===
export { TrustProtocol } from './trust/trust-protocol';
export { TrustReceipt } from './receipts/trust-receipt';

// === PRINCIPLES LAYER ===
export { SonateScorer } from './principles/sonate-scorer';
export { 
  PrincipleEvaluator, 
  createDefaultContext,
  type EvaluationContext,
  type PrincipleEvaluationResult 
} from './principles/principle-evaluator';

// === CONFIGURATION LAYER ===
export {
  DEFAULT_EU_CONFIG,
  STREAMLINED_CONFIG,
  STRICT_CONFIG,
  US_CONFIG,
  getConsentConfig,
  validateConsentConfig,
  mergeWithDefaults,
  type ConsentConfiguration,
  type ConsentModel,
  type ConsentScopes,
  type EscalationChannel,
  type EscalationChannelConfig,
  type DataRequestConfig,
  type DataRequestMode,
  type WithdrawalBehavior,
} from './config/consent-config';

// === ERROR LAYER ===
export * from './utils/errors';

// === UTILITIES LAYER ===
export { hashChain, genesisHash } from './utils/hash-chain';
export { signPayload, verifySignature, generateKeyPair } from './utils/signatures';
export * from './utils/crypto-advanced';
export * from './utils/robust-fetch';
export * from './utils/canonicalize';

// === LOGGING INFRASTRUCTURE ===
export {
  logger,
  log,
  createLogger,
  securityLogger,
  performanceLogger,
  apiLogger,
  LogLevel,
} from './utils/logger';

// Monitoring infrastructure (Phase 4)
export * from './monitoring/metrics';
export * from './monitoring/performance';
export * from './monitoring/health';

// Constants - The 6 Trust Principles from Master Context
export const TRUST_PRINCIPLES = {
  CONSENT_ARCHITECTURE: {
    weight: 0.25,
    critical: true,
    description: 'Users must explicitly consent to AI interactions and understand implications',
  },
  INSPECTION_MANDATE: {
    weight: 0.2,
    critical: false,
    description: 'All AI decisions must be inspectable and auditable',
  },
  CONTINUOUS_VALIDATION: {
    weight: 0.2,
    critical: false,
    description: 'AI behavior must be continuously validated against constitutional principles',
  },
  ETHICAL_OVERRIDE: {
    weight: 0.15,
    critical: true,
    description: 'Humans must have ability to override AI decisions on ethical grounds',
  },
  RIGHT_TO_DISCONNECT: {
    weight: 0.1,
    critical: false,
    description: 'Users can disconnect from AI systems at any time without penalty',
  },
  MORAL_RECOGNITION: {
    weight: 0.1,
    critical: false,
    description: 'AI must recognize and respect human moral agency',
  },
} as const;

// Types
export type TrustPrincipleKey = keyof typeof TRUST_PRINCIPLES;

export type PrincipleScores = Record<TrustPrincipleKey, number>;

export interface TrustScore {
  overall: number;
  principles: PrincipleScores;
  violations: TrustPrincipleKey[];
  timestamp: number;
}

export interface CIQMetrics {
  clarity: number; // 0-1: Communication effectiveness
  integrity: number; // 0-1: Reasoning transparency
  quality: number; // 0-1: Overall value
}

// === COHERENCE LAYER (RESONANCE) ===
export * from './coherence/resonance-metric';
export * from './utils/linguistic-vector-steering';
export * from './utils/tenant-context';
export * from './validation/schemas';
export * from './errors/math-errors';

// Calculator V2 is in @sonate/detect (has detect dependencies)
// Import from @sonate/detect instead: import { explainableSonateResonance } from '@sonate/detect';

// Security infrastructure
export { SecurityAuditor, runSecurityAudit } from './security/security-audit';
export * from './security/mfa-system';
export { SecureAuthService } from './security/auth-service';

// Algorithmic constants
export * from './constants/algorithmic';
