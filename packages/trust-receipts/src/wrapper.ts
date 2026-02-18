/**
 * TrustReceipts Wrapper - SSL for AI
 *
 * Wrap any AI API call to automatically generate cryptographic audit trails.
 * Works with OpenAI, Anthropic, or any async function.
 */

import { TrustReceipt, TrustReceiptData, SignedReceipt, Scores } from './trust-receipt';
import { generateKeyPair, hexToBytes, bytesToHex, getPublicKey } from './crypto';

/**
 * Configuration for TrustReceipts
 */
export interface TrustReceiptsConfig {
  /** Ed25519 private key (hex string or Uint8Array) */
  privateKey?: string | Uint8Array;
  /** Ed25519 public key (hex string or Uint8Array) - derived from private if not provided */
  publicKey?: string | Uint8Array;
  /** Default agent/model identifier */
  defaultAgentId?: string;
  /** Custom scores calculator */
  calculateScores?: (prompt: unknown, response: unknown) => Scores;
}

/**
 * Options for wrapping an AI call
 */
export interface WrapOptions<TInput = unknown> {
  /** Session identifier for this interaction */
  sessionId: string;
  /** The prompt/input being sent to the AI */
  input: TInput;
  /** Agent/model identifier (overrides default) */
  agentId?: string;
  /** Previous receipt for hash chaining */
  previousReceipt?: SignedReceipt;
  /** Custom metadata to include */
  metadata?: Record<string, unknown>;
  /** Attestation scores (if not using calculator) */
  scores?: Scores;
  /** Custom response extractor for hashing */
  extractResponse?: (response: unknown) => unknown;
  /** Include full prompt/response content in receipt (default: false, hashes only) */
  includeContent?: boolean;
}

/**
 * Options for creating a receipt manually
 */
export interface CreateReceiptOptions {
  /** Session identifier */
  sessionId: string;
  /** The prompt/input */
  prompt: unknown;
  /** The response/output */
  response: unknown;
  /** Agent/model identifier */
  agentId?: string;
  /** Previous receipt for hash chaining */
  previousReceipt?: SignedReceipt;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Attestation scores */
  scores?: Scores;
  /** Include full prompt/response content in receipt (default: false, hashes only) */
  includeContent?: boolean;
}

/**
 * Result from a wrapped AI call
 */
export interface WrappedResponse<T> {
  /** The original response from the AI call */
  response: T;
  /** The signed trust receipt */
  receipt: SignedReceipt;
}

/**
 * Extract text content from common AI response formats
 */
function extractResponseContent(response: unknown): unknown {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const r = response as Record<string, unknown>;

  // OpenAI format: { choices: [{ message: { content: "..." } }] }
  if (Array.isArray(r.choices) && r.choices[0]?.message?.content) {
    return r.choices[0].message.content;
  }

  // Anthropic format: { content: [{ text: "..." }] }
  if (Array.isArray(r.content) && r.content[0]?.text) {
    return r.content[0].text;
  }

  // Fallback: return as-is
  return response;
}

/**
 * TrustReceipts - Main SDK class
 *
 * @example
 * ```typescript
 * import { TrustReceipts } from '@sonate/trust-receipts';
 * import OpenAI from 'openai';
 *
 * const receipts = new TrustReceipts({
 *   privateKey: process.env.SONATE_PRIVATE_KEY,
 * });
 *
 * const openai = new OpenAI();
 * const messages = [{ role: 'user', content: 'Hello!' }];
 *
 * const { response, receipt } = await receipts.wrap(
 *   () => openai.chat.completions.create({ model: 'gpt-4', messages }),
 *   { sessionId: 'user-123', input: messages }
 * );
 *
 * console.log(response.choices[0].message.content);
 * console.log('Receipt hash:', receipt.receiptHash);
 * ```
 */
export class TrustReceipts {
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;
  private defaultAgentId?: string;
  private calculateScores?: (prompt: unknown, response: unknown) => Scores;
  private initialized: Promise<void>;

  constructor(config: TrustReceiptsConfig = {}) {
    this.defaultAgentId = config.defaultAgentId;
    this.calculateScores = config.calculateScores;

    // Initialize keys (may be async)
    this.privateKey = new Uint8Array(32);
    this.publicKey = new Uint8Array(32);

    this.initialized = this.initializeKeys(config);
  }

  /**
   * Initialize cryptographic keys
   */
  private async initializeKeys(config: TrustReceiptsConfig): Promise<void> {
    if (config.privateKey) {
      // Use provided private key
      this.privateKey =
        typeof config.privateKey === 'string'
          ? hexToBytes(config.privateKey)
          : config.privateKey;

      // Derive or use provided public key
      if (config.publicKey) {
        this.publicKey =
          typeof config.publicKey === 'string'
            ? hexToBytes(config.publicKey)
            : config.publicKey;
      } else {
        this.publicKey = await getPublicKey(this.privateKey);
      }
    } else {
      // Generate new key pair
      const keyPair = await generateKeyPair();
      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;
    }
  }

  /**
   * Wrap an async AI call with trust receipt generation
   *
   * @param fn - Async function that calls the AI API
   * @param options - Configuration for this specific call
   * @returns The AI response and a signed trust receipt
   *
   * @example
   * ```typescript
   * const messages = [{ role: 'user', content: 'Hello!' }];
   *
   * const { response, receipt } = await receipts.wrap(
   *   () => anthropic.messages.create({
   *     model: 'claude-3-sonnet-20240229',
   *     max_tokens: 1024,
   *     messages,
   *   }),
   *   {
   *     sessionId: 'session-abc',
   *     input: messages,
   *     agentId: 'claude-3-sonnet',
   *   }
   * );
   * ```
   */
  async wrap<T>(fn: () => Promise<T>, options: WrapOptions): Promise<WrappedResponse<T>> {
    // Ensure keys are ready
    await this.initialized;

    // Execute the AI call
    const response = await fn();

    // Extract response content for hashing
    const responseContent = options.extractResponse
      ? options.extractResponse(response)
      : extractResponseContent(response);

    // Calculate scores
    const scores =
      options.scores ?? this.calculateScores?.(options.input, responseContent) ?? {};

    // Create receipt
    const receiptData: TrustReceiptData = {
      sessionId: options.sessionId,
      prompt: options.input,
      response: responseContent,
      scores,
      agentId: options.agentId ?? this.defaultAgentId,
      prevReceiptHash: options.previousReceipt?.receiptHash,
      metadata: options.metadata,
      includeContent: options.includeContent,
    };

    const receipt = new TrustReceipt(receiptData);
    await receipt.sign(this.privateKey);

    return {
      response,
      receipt: receipt.toJSON(),
    };
  }

  /**
   * Create a receipt manually (without wrapping a call)
   *
   * Useful for streaming responses or custom scenarios.
   *
   * @param options - Receipt options
   * @returns Signed trust receipt
   */
  async createReceipt(options: CreateReceiptOptions): Promise<SignedReceipt> {
    await this.initialized;

    const scores = options.scores ?? {};

    const receiptData: TrustReceiptData = {
      sessionId: options.sessionId,
      prompt: options.prompt,
      response: options.response,
      scores,
      agentId: options.agentId ?? this.defaultAgentId,
      prevReceiptHash: options.previousReceipt?.receiptHash,
      metadata: options.metadata,
      includeContent: options.includeContent,
    };

    const receipt = new TrustReceipt(receiptData);
    await receipt.sign(this.privateKey);

    return receipt.toJSON();
  }

  /**
   * Verify a receipt's signature
   *
   * @param receipt - Receipt to verify
   * @param publicKey - Optional public key (uses instance key if not provided)
   * @returns true if signature is valid
   */
  async verifyReceipt(receipt: SignedReceipt, publicKey?: string | Uint8Array): Promise<boolean> {
    await this.initialized;

    const trustReceipt = TrustReceipt.fromJSON(receipt);
    const key = publicKey
      ? typeof publicKey === 'string'
        ? hexToBytes(publicKey)
        : publicKey
      : this.publicKey;

    return trustReceipt.verify(key);
  }

  /**
   * Verify a chain of receipts
   *
   * @param receipts - Array of receipts in chronological order
   * @param publicKey - Optional public key for signature verification
   * @returns Object with validity status and any errors
   */
  async verifyChain(
    receipts: SignedReceipt[],
    publicKey?: string | Uint8Array
  ): Promise<{ valid: boolean; errors: string[] }> {
    await this.initialized;

    const errors: string[] = [];

    if (receipts.length === 0) {
      return { valid: true, errors: [] };
    }

    // Verify each receipt
    for (let i = 0; i < receipts.length; i++) {
      const current = receipts[i];

      // Verify signature
      const sigValid = await this.verifyReceipt(current, publicKey);
      if (!sigValid) {
        errors.push(`Receipt ${i}: Invalid signature`);
      }

      // Verify chain (skip first receipt)
      if (i > 0) {
        const previous = receipts[i - 1];
        if (current.prevReceiptHash !== previous.receiptHash) {
          errors.push(`Receipt ${i}: Chain broken (prevReceiptHash mismatch)`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the public key (hex string)
   */
  async getPublicKey(): Promise<string> {
    await this.initialized;
    return bytesToHex(this.publicKey);
  }

  /**
   * Generate a new key pair
   *
   * @returns Object with privateKey and publicKey as hex strings
   */
  static async generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
    const { privateKey, publicKey } = await generateKeyPair();
    return {
      privateKey: bytesToHex(privateKey),
      publicKey: bytesToHex(publicKey),
    };
  }
}

// Re-export for convenience
export { Scores, SignedReceipt, TrustReceipt, TrustReceiptData } from './trust-receipt';
