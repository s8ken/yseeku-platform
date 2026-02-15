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

import { createHash } from 'crypto';

import { canonicalizeJSON } from '../utils/crypto-advanced';

import type { CIQMetrics } from '../index';

let ed25519Promise: Promise<any> | null = null;

async function loadEd25519(): Promise<any> {
  if (!ed25519Promise) {
    ed25519Promise = Promise.all([
      new Function('return import("@noble/ed25519")')() as Promise<any>,
      new Function('return import("@noble/hashes/sha2.js")')() as Promise<any>,
    ]).then(([ed25519Mod, hashMod]) => {
      const ed25519 = ed25519Mod.default || ed25519Mod;
      const { sha512 } = hashMod;
      if (ed25519.hashes) {
        ed25519.hashes.sha512 = sha512;
      } else if (ed25519.etc) {
        ed25519.etc.sha512Sync = (...m: Uint8Array[]) => sha512(m[0]);
      }
      return ed25519;
    });
  }

  return ed25519Promise;
}

let isInitialized = false;

/**
 * Pre-load the Ed25519 crypto library for better performance.
 * Call this during application startup to avoid cold-start delays.
 * 
 * @example
 * import { initCrypto } from '@sonate/core';
 * await initCrypto(); // Call once at app startup
 */
export async function initCrypto(): Promise<void> {
  if (isInitialized) return;
  await loadEd25519();
  isInitialized = true;
  // Note: Using minimal logging here to avoid circular dependency on logger
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[TrustReceipt] Crypto library pre-loaded');
  }
}

/**
 * Check if crypto is initialized
 */
export function isCryptoReady(): boolean {
  return isInitialized;
}


export interface SonateTrustReceipt {
  id: string; // SHA-256 Hash of the interaction
  timestamp: string; // ISO Date

  // The "Soul" of the receipt
  telemetry: {
    resonance_score: number; // e.g. 0.994
    resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
    /** @deprecated v2.0.1 - RealityIndex calculator was removed (always 0) */
    reality_index: number; // e.g. 9.9 (DEPRECATED: always 0 in v2.0.1+)
    bedau_index?: number; // e.g. 0.73 (weak emergence: 0-1)
    emergence_type?: 'LINEAR' | 'WEAK_EMERGENCE'; // Classification
    kolmogorov_complexity?: number; // Approximation of irreducibility
    semantic_entropy?: number; // Cognitive diversity measure
  };

  // The "Proof"
  scaffold_proof: {
    detected_vectors: string[]; // ['sovereign', 'integrity', 'third mind']
    ethics_verified: boolean; // true
  };

  // The "Seal"
  signature: string; // Ed25519 signature from the Agent's Private Key
}

export interface TrustReceiptData {
  version: string;
  session_id: string;
  timestamp: number;
  mode: 'constitutional' | 'directive';
  ciq_metrics: CIQMetrics;
  sonate_trust_receipt?: SonateTrustReceipt; // Optional SonateTrustReceipt data
  previous_hash?: string; // For hash chaining
  session_nonce?: string;
}

export class TrustReceipt {
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

  constructor(data: TrustReceiptData) {
    this.version = data.version;
    this.session_id = data.session_id;
    this.timestamp = data.timestamp;
    this.mode = data.mode;
    this.ciq_metrics = data.ciq_metrics;
    this.sonate_trust_receipt = data.sonate_trust_receipt;
    this.previous_hash = data.previous_hash;
    this.session_nonce = data.session_nonce;

    // Calculate hash as per GAMMATRIA spec
    this.self_hash = this.calculateHash();
    this.signature = ''; // Set later with sign()
  }

  /**
   * Calculate SHA-256 hash of payload
   *
   * Algorithm: https://gammatria.com/schemas/trust-receipt#hash-calculation
   * Hash includes: version + session_id + timestamp + mode + ciq_metrics + previous_hash
   */
  private calculateHash(): string {
    const canonical = canonicalizeJSON(
      {
        version: this.version,
        session_id: this.session_id,
        timestamp: this.timestamp,
        mode: this.mode,
        ciq_metrics: this.ciq_metrics,
        sonate_trust_receipt: this.sonate_trust_receipt || null,
        previous_hash: this.previous_hash || null,
      },
      { method: 'JCS' }
    );

    return createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  /**
   * Sign the receipt with Ed25519 private key
   *
   * Algorithm: https://gammatria.com/schemas/trust-receipt#signature
   */
  async sign(privateKey: Uint8Array): Promise<void> {
    const messageHash = Buffer.from(this.self_hash, 'hex');
    const ed25519 = await loadEd25519();
    const signature = await ed25519.sign(messageHash, privateKey);
    this.signature = Buffer.from(signature).toString('hex');
  }

  /**
   * Verify signature with Ed25519 public key
   */
  async verify(publicKey: Uint8Array): Promise<boolean> {
    if (!this.signature) {
      console.warn('[TrustReceipt] Verification failed: No signature present');
      return false;
    }

    try {
      const messageHash = Buffer.from(this.self_hash, 'hex');
      const signature = Buffer.from(this.signature, 'hex');
      const ed25519 = await loadEd25519();
      return await ed25519.verify(signature, messageHash, publicKey);
    } catch (error) {
      console.error('[TrustReceipt] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Sign with session binding (self_hash + session_id + session_nonce)
   */
  async signBound(privateKey: Uint8Array): Promise<void> {
    const payload = JSON.stringify({
      self_hash: this.self_hash,
      session_id: this.session_id,
      session_nonce: this.session_nonce || '',
    });
    const msg = createHash('sha256').update(payload).digest();
    const ed25519 = await loadEd25519();
    const signature = await ed25519.sign(msg, privateKey);
    this.signature = Buffer.from(signature).toString('hex');
  }

  /**
   * Verify signature with session binding
   */
  async verifyBound(publicKey: Uint8Array): Promise<boolean> {
    if (!this.signature) {
      console.warn('[TrustReceipt] Bound verification failed: No signature present');
      return false;
    }
    const payload = JSON.stringify({
      self_hash: this.self_hash,
      session_id: this.session_id,
      session_nonce: this.session_nonce || '',
    });
    const msg = createHash('sha256').update(payload).digest();
    const signature = Buffer.from(this.signature, 'hex');
    try {
      const ed25519 = await loadEd25519();
      return await ed25519.verify(signature, msg, publicKey);
    } catch (error) {
      console.error('[TrustReceipt] Bound signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify hash chain integrity
   * Checks if this receipt correctly chains from previous
   */
  verifyChain(previousReceipt: TrustReceipt): boolean {
    return this.previous_hash === previousReceipt.self_hash;
  }

  /**
   * Export as JSON (for storage/transmission)
   */
  toJSON(): Record<string, any> {
    return {
      version: this.version,
      session_id: this.session_id,
      timestamp: this.timestamp,
      mode: this.mode,
      ciq_metrics: this.ciq_metrics,
      sonate_trust_receipt: this.sonate_trust_receipt,
      previous_hash: this.previous_hash,
      self_hash: this.self_hash,
      signature: this.signature,
      session_nonce: this.session_nonce,
    };
  }

  /**
   * Deserialize from JSON
   * 
   * CRITICAL: Preserves the original self_hash from the serialized data to maintain
   * hash-chain integrity. This allows receipts to be restored from storage/transmission
   * without recalculation, which would break chain verification.
   * 
   * Behavior:
   * - If data.self_hash is present: uses it (preserves chain)
   * - If data.self_hash is missing: recalculates (fallback for new receipts)
   * 
   * Future: Optional skipHashCalculation flag can be added if constructor needs
   * to support raw instantiation without auto-hash-calculation.
   * 
   * @param data Serialized receipt JSON
   * @returns TrustReceipt instance with preserved or calculated self_hash
   */
  static fromJSON(data: any): TrustReceipt {
    const receipt = new TrustReceipt({
      version: data.version,
      session_id: data.session_id,
      timestamp: data.timestamp,
      mode: data.mode,
      ciq_metrics: data.ciq_metrics,
      sonate_trust_receipt: data.sonate_trust_receipt,
      previous_hash: data.previous_hash,
      session_nonce: data.session_nonce,
    });

    // CRITICAL: Preserve the original hash if present to maintain chain integrity
    if (data.self_hash) {
      receipt.self_hash = data.self_hash;
    }
    // Else: self_hash was already calculated by constructor

    receipt.signature = data.signature || '';
    return receipt;
  }
}
