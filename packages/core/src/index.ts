/**
 * @sonate/core - Core Trust Protocol Implementation
 * 
 * Implements the SYMBI Trust Framework as specified at:
 * https://gammatria.com/schemas/trust-receipt
 * 
 * This package provides the foundational trust infrastructure
 * for all SONATE platform modules.
 */

// Core exports
export { TrustProtocol } from './trust-protocol';
export { TrustReceipt } from './trust-receipt';
export { SymbiScorer } from './symbi-scorer';

// Utility exports
export { hashChain, genesisHash } from './utils/hash-chain';
export { signPayload, verifySignature, generateKeyPair } from './utils/signatures';
export * from './utils/crypto-advanced';

export * from './canonicalize';

// Logging infrastructure
export { logger, log, createLogger, securityLogger, performanceLogger, apiLogger, LogLevel } from './logger';

// Constants - The 6 Trust Principles from Master Context
export const TRUST_PRINCIPLES = {
  CONSENT_ARCHITECTURE: { 
    weight: 0.25, 
    critical: true,
    description: 'Users must explicitly consent to AI interactions and understand implications'
  },
  INSPECTION_MANDATE: { 
    weight: 0.20, 
    critical: false,
    description: 'All AI decisions must be inspectable and auditable'
  },
  CONTINUOUS_VALIDATION: { 
    weight: 0.20, 
    critical: false,
    description: 'AI behavior must be continuously validated against constitutional principles'
  },
  ETHICAL_OVERRIDE: { 
    weight: 0.15, 
    critical: true,
    description: 'Humans must have ability to override AI decisions on ethical grounds'
  },
  RIGHT_TO_DISCONNECT: { 
    weight: 0.10, 
    critical: false,
    description: 'Users can disconnect from AI systems at any time without penalty'
  },
  MORAL_RECOGNITION: { 
    weight: 0.10, 
    critical: false,
    description: 'AI must recognize and respect human moral agency'
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
  clarity: number;    // 0-1: Communication effectiveness
  integrity: number;  // 0-1: Reasoning transparency
  quality: number;    // 0-1: Overall value
}
