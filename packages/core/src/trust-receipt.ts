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
import * as ed25519 from '@noble/ed25519';
import { CIQMetrics } from './index';

export interface TrustReceiptData {
  version: string;
  session_id: string;
  timestamp: number;
  mode: 'constitutional' | 'directive';
  ciq_metrics: CIQMetrics;
  previous_hash?: string; // For hash chaining
  session_nonce?: string;
}

export class TrustReceipt {
  version: string;
  session_id: string;
  timestamp: number;
  mode: 'constitutional' | 'directive';
  ciq_metrics: CIQMetrics;
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
    const payload = JSON.stringify({
      version: this.version,
      session_id: this.session_id,
      timestamp: this.timestamp,
      mode: this.mode,
      ciq_metrics: this.ciq_metrics,
      previous_hash: this.previous_hash || null,
    });
    
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Sign the receipt with Ed25519 private key
   * 
   * Algorithm: https://gammatria.com/schemas/trust-receipt#signature
   */
  async sign(privateKey: Uint8Array): Promise<void> {
    const messageHash = Buffer.from(this.self_hash, 'hex');
    const signature = await ed25519.sign(messageHash, privateKey);
    this.signature = Buffer.from(signature).toString('hex');
  }

  /**
   * Verify signature with Ed25519 public key
   */
  async verify(publicKey: Uint8Array): Promise<boolean> {
    if (!this.signature) {
      return false;
    }

    try {
      const messageHash = Buffer.from(this.self_hash, 'hex');
      const signature = Buffer.from(this.signature, 'hex');
      return await ed25519.verify(signature, messageHash, publicKey);
    } catch (error) {
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
    const signature = await ed25519.sign(msg, privateKey);
    this.signature = Buffer.from(signature).toString('hex');
  }

  /**
   * Verify signature with session binding
   */
  async verifyBound(publicKey: Uint8Array): Promise<boolean> {
    if (!this.signature) return false;
    const payload = JSON.stringify({
      self_hash: this.self_hash,
      session_id: this.session_id,
      session_nonce: this.session_nonce || '',
    });
    const msg = createHash('sha256').update(payload).digest();
    const signature = Buffer.from(this.signature, 'hex');
    try {
      return await ed25519.verify(signature, msg, publicKey);
    } catch {
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
      previous_hash: this.previous_hash,
      self_hash: this.self_hash,
      signature: this.signature,
      session_nonce: this.session_nonce,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data: any): TrustReceipt {
    const receipt = new TrustReceipt({
      version: data.version,
      session_id: data.session_id,
      timestamp: data.timestamp,
      mode: data.mode,
      ciq_metrics: data.ciq_metrics,
      previous_hash: data.previous_hash,
      session_nonce: data.session_nonce,
    });
    
    receipt.signature = data.signature || '';
    return receipt;
  }
}
