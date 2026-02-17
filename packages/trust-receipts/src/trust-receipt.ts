/**
 * TrustReceipt - Cryptographically signed AI interaction records
 *
 * Each receipt is:
 * - Hash-chained to previous receipts (immutable audit trail)
 * - Digitally signed with Ed25519
 * - Timestamped (Unix milliseconds)
 */

import { canonicalize } from 'json-canonicalize';

import { sha256, sign, verify, bytesToHex, hexToBytes } from './crypto';

/**
 * Quality metrics for the AI interaction
 */
export interface QualityMetrics {
  /** Clarity score (0-1): How clear and unambiguous was the interaction */
  clarity: number;
  /** Integrity score (0-1): How well did the AI follow guidelines */
  integrity: number;
  /** Quality score (0-1): Overall response quality */
  quality: number;
}

/**
 * Data required to create a TrustReceipt
 */
export interface TrustReceiptData {
  /** Unique session identifier */
  sessionId: string;
  /** Interaction mode */
  mode: 'standard' | 'constitutional';
  /** Quality metrics for the interaction */
  metrics: QualityMetrics;
  /** Optional hash of previous receipt for chaining */
  previousHash?: string;
  /** Optional custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A signed TrustReceipt ready for storage or transmission
 */
export interface SignedReceipt {
  /** Schema version */
  version: string;
  /** Session identifier */
  sessionId: string;
  /** Unix timestamp (ms) */
  timestamp: number;
  /** Interaction mode */
  mode: 'standard' | 'constitutional';
  /** Quality metrics */
  metrics: QualityMetrics;
  /** Hash of previous receipt (if chained) */
  previousHash: string | null;
  /** SHA-256 hash of this receipt's data */
  selfHash: string;
  /** Ed25519 signature (hex) */
  signature: string;
  /** Custom metadata */
  metadata: Record<string, unknown>;
}

/**
 * TrustReceipt class for creating and verifying signed receipts
 */
export class TrustReceipt {
  readonly version = '1.0.0';
  readonly sessionId: string;
  readonly timestamp: number;
  readonly mode: 'standard' | 'constitutional';
  readonly metrics: QualityMetrics;
  readonly previousHash: string | null;
  readonly metadata: Record<string, unknown>;
  readonly selfHash: string;

  private _signature: string = '';

  constructor(data: TrustReceiptData) {
    this.sessionId = data.sessionId;
    this.timestamp = Date.now();
    this.mode = data.mode;
    this.metrics = { ...data.metrics };
    this.previousHash = data.previousHash ?? null;
    this.metadata = data.metadata ?? {};
    this.selfHash = this.computeHash();
  }

  /**
   * Compute SHA-256 hash of the receipt payload
   * Uses JSON Canonicalization Scheme (RFC 8785) for determinism
   */
  private computeHash(): string {
    const payload = {
      version: this.version,
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      mode: this.mode,
      metrics: this.metrics,
      previousHash: this.previousHash,
      metadata: this.metadata,
    };

    const canonical = canonicalize(payload);
    return sha256(canonical);
  }

  /**
   * Sign the receipt with an Ed25519 private key
   *
   * @param privateKey - 32-byte Ed25519 private key
   */
  async sign(privateKey: Uint8Array): Promise<void> {
    const message = hexToBytes(this.selfHash);
    const signature = await sign(message, privateKey);
    this._signature = bytesToHex(signature);
  }

  /**
   * Verify the receipt's signature
   *
   * @param publicKey - 32-byte Ed25519 public key
   * @returns true if signature is valid
   */
  async verify(publicKey: Uint8Array): Promise<boolean> {
    if (!this._signature) {
      return false;
    }

    try {
      const message = hexToBytes(this.selfHash);
      const signature = hexToBytes(this._signature);
      return await verify(signature, message, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Check if this receipt chains correctly from a previous receipt
   *
   * @param previous - The previous receipt in the chain
   * @returns true if chain is valid
   */
  verifyChain(previous: TrustReceipt | SignedReceipt): boolean {
    // Both types have selfHash, so we can access it directly
    const prevHash = (previous as SignedReceipt).selfHash;
    return this.previousHash === prevHash;
  }

  /**
   * Get the signature (hex string)
   */
  get signature(): string {
    return this._signature;
  }

  /**
   * Check if receipt is signed
   */
  get isSigned(): boolean {
    return this._signature.length > 0;
  }

  /**
   * Export as JSON object
   */
  toJSON(): SignedReceipt {
    return {
      version: this.version,
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      mode: this.mode,
      metrics: this.metrics,
      previousHash: this.previousHash,
      selfHash: this.selfHash,
      signature: this._signature,
      metadata: this.metadata,
    };
  }

  /**
   * Create a TrustReceipt from JSON data
   *
   * @param data - Previously serialized receipt
   */
  static fromJSON(data: SignedReceipt): TrustReceipt {
    const receipt = new TrustReceipt({
      sessionId: data.sessionId,
      mode: data.mode,
      metrics: data.metrics,
      previousHash: data.previousHash ?? undefined,
      metadata: data.metadata,
    });

    // Restore original values
    (receipt as any).timestamp = data.timestamp;
    (receipt as any).selfHash = data.selfHash;
    receipt._signature = data.signature;

    return receipt;
  }
}
