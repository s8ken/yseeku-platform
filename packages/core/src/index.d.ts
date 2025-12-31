export { TrustProtocol } from './trust-protocol';
export { TrustReceipt } from './trust-receipt';
export { SymbiScorer } from './symbi-scorer';
export { hashChain, genesisHash } from './utils/hash-chain';
export { signPayload, verifySignature, generateKeyPair } from './utils/signatures';
export * from './utils/crypto-advanced';
export * from './canonicalize';
export * from './resonance-metric';
export * from './linguistic-vector-steering';
export * from './trust-protocol-enhanced';
export * from './tenant-context';

export { SecureAuthService } from './security/auth-service';
export { MFAService } from './security/mfa-system';
export { EnhancedSecurityError } from './security/error-taxonomy';

export const TRUST_PRINCIPLES: {
  readonly CONSENT_ARCHITECTURE: { readonly weight: number; readonly critical: boolean; readonly description: string };
  readonly INSPECTION_MANDATE: { readonly weight: number; readonly critical: boolean; readonly description: string };
  readonly CONTINUOUS_VALIDATION: { readonly weight: number; readonly critical: boolean; readonly description: string };
  readonly ETHICAL_OVERRIDE: { readonly weight: number; readonly critical: boolean; readonly description: string };
  readonly RIGHT_TO_DISCONNECT: { readonly weight: number; readonly critical: boolean; readonly description: string };
  readonly MORAL_RECOGNITION: { readonly weight: number; readonly critical: boolean; readonly description: string };
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
