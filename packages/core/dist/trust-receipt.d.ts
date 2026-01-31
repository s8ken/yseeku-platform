/**
 * TrustReceipt - Cryptographically signed interaction records
 *
 * Implements: https://gammatria.com/schemas/trust-receipt
 *
 * Every AI interaction generates a Trust Receipt that is:
 * - Hash-chained (immutable audit trail)
 * - Digitally signed (Ed25519)
 * - Timestamped (Unix ms)
 * - CIQ scored (Clarity, Integrity, Quality)
 */
import { CIQMetrics } from './index';
export interface SonateTrustReceipt {
    id: string;
    timestamp: string;
    telemetry: {
        resonance_score: number;
        resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
        /** @deprecated v2.0.1 - RealityIndex calculator was removed (always 0) */
        reality_index: number;
        bedau_index?: number;
        emergence_type?: 'LINEAR' | 'WEAK_EMERGENCE';
        kolmogorov_complexity?: number;
        semantic_entropy?: number;
    };
    scaffold_proof: {
        detected_vectors: string[];
        ethics_verified: boolean;
    };
    signature: string;
}
export interface TrustReceiptData {
    version: string;
    session_id: string;
    timestamp: number;
    mode: 'constitutional' | 'directive';
    ciq_metrics: CIQMetrics;
    sonate_trust_receipt?: SonateTrustReceipt;
    previous_hash?: string;
    session_nonce?: string;
}
export declare class TrustReceipt {
    version: string;
    session_id: string;
    timestamp: number;
    mode: 'constitutional' | 'directive';
    ciq_metrics: CIQMetrics;
    sonate_trust_receipt?: SonateTrustReceipt;
    previous_hash?: string;
    self_hash: string;
    signature: string;
    session_nonce?: string;
    constructor(data: TrustReceiptData);
    /**
     * Calculate SHA-256 hash of payload
     *
     * Algorithm: https://gammatria.com/schemas/trust-receipt#hash-calculation
     * Hash includes: version + session_id + timestamp + mode + ciq_metrics + previous_hash
     */
    private calculateHash;
    /**
     * Sign the receipt with Ed25519 private key
     *
     * Algorithm: https://gammatria.com/schemas/trust-receipt#signature
     */
    sign(privateKey: Uint8Array): Promise<void>;
    /**
     * Verify signature with Ed25519 public key
     */
    verify(publicKey: Uint8Array): Promise<boolean>;
    /**
     * Sign with session binding (self_hash + session_id + session_nonce)
     */
    signBound(privateKey: Uint8Array): Promise<void>;
    /**
     * Verify signature with session binding
     */
    verifyBound(publicKey: Uint8Array): Promise<boolean>;
    /**
     * Verify hash chain integrity
     * Checks if this receipt correctly chains from previous
     */
    verifyChain(previousReceipt: TrustReceipt): boolean;
    /**
     * Export as JSON (for storage/transmission)
     */
    toJSON(): Record<string, any>;
    /**
     * Create from JSON
     */
    static fromJSON(data: any): TrustReceipt;
}
