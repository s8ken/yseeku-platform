/**
 * TrustReceipt - Cryptographically signed AI interaction records
 *
 * Each receipt captures:
 * - The prompt/input sent to the AI (hashed)
 * - The response/output received (hashed)
 * - User-defined attestation scores
 * - Hash chain to previous receipt
 * - Ed25519 digital signature
 *
 * Uses JSON Canonicalization Scheme (RFC 8785) for deterministic hashing.
 */

import { canonicalize } from 'json-canonicalize';

import { sha256, sign, verify, bytesToHex, hexToBytes } from './crypto';

/**
 * Attestation scores for the AI interaction.
 * All scores are user-defined floats between 0 and 1.
 * Common scores: clarity, integrity, quality, safety, accuracy.
 */
export interface Scores {
  [key: string]: number;
}

/**
 * Data required to create a TrustReceipt
 */
export interface TrustReceiptData {
  /** Unique session identifier */
  sessionId: string;
  /** The prompt/input sent to the AI (will be hashed) */
  prompt: unknown;
  /** The response/output from the AI (will be hashed) */
  response: unknown;
  /** Attestation scores (user-defined, 0-1 range) */
  scores: Scores;
  /** Optional agent/model identifier */
  agentId?: string;
  /** Optional hash of previous receipt for chaining */
  prevReceiptHash?: string;
  /** Optional custom metadata */
  metadata?: Record<string, unknown>;
  /** Include full prompt/response content in receipt (default: false, hashes only) */
  includeContent?: boolean;
}

/**
 * A signed TrustReceipt ready for storage or transmission
 */
export interface SignedReceipt {
  /** Schema version */
  version: string;
  /** ISO 8601 timestamp (UTC) */
  timestamp: string;
  /** Session identifier */
  sessionId: string;
  /** Agent/model identifier */
  agentId: string | null;
  /** SHA-256 hash of the prompt/input */
  promptHash: string;
  /** SHA-256 hash of the response/output */
  responseHash: string;
  /** Attestation scores */
  scores: Scores;
  /** Hash of previous receipt (if chained) */
  prevReceiptHash: string | null;
  /** SHA-256 hash of this receipt's canonical payload */
  receiptHash: string;
  /** Ed25519 signature (hex) */
  signature: string;
  /** Custom metadata */
  metadata: Record<string, unknown>;
  /** Full prompt content (only present if includeContent: true) */
  promptContent?: unknown;
  /** Full response content (only present if includeContent: true) */
  responseContent?: unknown;
}

/**
 * TrustReceipt class for creating and verifying signed receipts
 */
export class TrustReceipt {
  readonly version = '1.0';
  readonly timestamp: string;
  readonly sessionId: string;
  readonly agentId: string | null;
  readonly promptHash: string;
  readonly responseHash: string;
  readonly scores: Scores;
  readonly prevReceiptHash: string | null;
  readonly metadata: Record<string, unknown>;
  readonly receiptHash: string;
  readonly promptContent?: unknown;
  readonly responseContent?: unknown;

  private _signature: string = '';

  constructor(data: TrustReceiptData) {
    this.timestamp = new Date().toISOString();
    this.sessionId = data.sessionId;
    this.agentId = data.agentId ?? null;
    this.promptHash = this.hashContent(data.prompt);
    this.responseHash = this.hashContent(data.response);
    this.scores = { ...data.scores };
    this.prevReceiptHash = data.prevReceiptHash ?? null;
    this.metadata = data.metadata ?? {};

    if (data.includeContent) {
      this.promptContent = data.prompt;
      this.responseContent = data.response;
    }

    this.receiptHash = this.computeReceiptHash();
  }

  /**
   * Hash any content using SHA-256 with JSON canonicalization
   */
  private hashContent(content: unknown): string {
    if (content === undefined || content === null) {
      return sha256('');
    }
    const canonical = canonicalize(content);
    return sha256(canonical);
  }

  /**
   * Compute SHA-256 hash of the full receipt payload
   * Uses JSON Canonicalization Scheme (RFC 8785) for determinism
   */
  private computeReceiptHash(): string {
    const payload = {
      version: this.version,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
      agentId: this.agentId,
      promptHash: this.promptHash,
      responseHash: this.responseHash,
      scores: this.scores,
      prevReceiptHash: this.prevReceiptHash,
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
    const message = hexToBytes(this.receiptHash);
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
      const message = hexToBytes(this.receiptHash);
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
    const prevHash = (previous as SignedReceipt).receiptHash;
    return this.prevReceiptHash === prevHash;
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
    const json: SignedReceipt = {
      version: this.version,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
      agentId: this.agentId,
      promptHash: this.promptHash,
      responseHash: this.responseHash,
      scores: this.scores,
      prevReceiptHash: this.prevReceiptHash,
      receiptHash: this.receiptHash,
      signature: this._signature,
      metadata: this.metadata,
    };

    if (this.promptContent !== undefined) {
      json.promptContent = this.promptContent;
    }
    if (this.responseContent !== undefined) {
      json.responseContent = this.responseContent;
    }

    return json;
  }

  /**
   * Create a TrustReceipt from JSON data
   *
   * @param data - Previously serialized receipt
   */
  static fromJSON(data: SignedReceipt): TrustReceipt {
    // Create with dummy data, then override
    const receipt = Object.create(TrustReceipt.prototype) as TrustReceipt;

    // Assign readonly properties
    (receipt as any).version = data.version;
    (receipt as any).timestamp = data.timestamp;
    (receipt as any).sessionId = data.sessionId;
    (receipt as any).agentId = data.agentId;
    (receipt as any).promptHash = data.promptHash;
    (receipt as any).responseHash = data.responseHash;
    (receipt as any).scores = data.scores;
    (receipt as any).prevReceiptHash = data.prevReceiptHash;
    (receipt as any).metadata = data.metadata;
    (receipt as any).receiptHash = data.receiptHash;
    if (data.promptContent !== undefined) {
      (receipt as any).promptContent = data.promptContent;
    }
    if (data.responseContent !== undefined) {
      (receipt as any).responseContent = data.responseContent;
    }
    receipt._signature = data.signature;

    return receipt;
  }
}

// Re-export old types for backwards compatibility during transition
/** @deprecated Use Scores instead */
export type QualityMetrics = Scores;
