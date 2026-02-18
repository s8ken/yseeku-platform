/**
 * Receipt Generator Service
 * 
 * Responsible for creating cryptographically signed Trust Receipts
 * 
 * Features:
 * - Generate receipt IDs (SHA-256 hashing)
 * - Sign receipts (Ed25519)
 * - Hash-chain receipts (immutable audit trail)
 * - Validate before returning
 */

import { createHash, randomBytes } from 'crypto';
import {
  TrustReceipt,
  CreateReceiptInput,
  receiptValidator,
  type Telemetry,
  type PolicyState,
  type AIInteraction,
} from '@sonate/schemas';

/**
 * Import crypto utilities from @sonate/core
 * These handle Ed25519 signing and advanced cryptography
 */
import { signPayload, generateKeyPair } from '@sonate/core';
import logger from '../../utils/logger';

interface ReceiptGeneratorConfig {
  agentKeyVersion: string;
  enableTelemetry: boolean;
  enablePolicyState: boolean;
  /** When false (default), raw prompt/response are replaced with SHA-256 hashes */
  includeContent: boolean;
}

/**
 * ReceiptGeneratorService
 * 
 * Creates cryptographically signed, hash-chained trust receipts
 */
export class ReceiptGeneratorService {
  private config: ReceiptGeneratorConfig;
  private previousHash: string = 'GENESIS';
  private chainLength: number = 0;

  constructor(config: Partial<ReceiptGeneratorConfig> = {}) {
    this.config = {
      agentKeyVersion: config.agentKeyVersion || 'key_v1',
      enableTelemetry: config.enableTelemetry !== false,
      enablePolicyState: config.enablePolicyState !== false,
      includeContent: config.includeContent === true, // default: false (hashes only)
    };
  }

  /**
   * Recursively canonicalize an object for deterministic JSON output.
   * Sorts keys at every level, filters undefined values.
   * Must match the canonicalize() in public-demo.routes.ts and verify-sdk.
   */
  private canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalize(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys
      .filter(key => obj[key] !== undefined)
      .map(key => JSON.stringify(key) + ':' + this.canonicalize(obj[key]));
    return '{' + pairs.join(',') + '}';
  }

  /**
   * Generate a unique receipt ID from canonical content
   *
   * Uses SHA-256 hash of canonicalized JSON for deterministic, collision-resistant IDs
   */
  private generateReceiptId(content: Record<string, any>): string {
    const canonical = this.canonicalize(content);
    const hash = createHash('sha256').update(canonical).digest('hex');
    return hash;
  }

  /**
   * Generate SHA-256 hash for chain integrity
   */
  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Canonicalize content for consistent hashing (strips signature)
   */
  private canonicalizeContent(receipt: Partial<TrustReceipt>): string {
    const { signature, ...withoutSignature } = receipt;
    return this.canonicalize(withoutSignature);
  }

  /**
   * Sign receipt with agent's private key
   * 
   * In production, this would:
   * - Retrieve private key from secure key store (HSM, AWS KMS, etc.)
   * - Use the appropriate key version
   * - Sign the canonical receipt content
   */
  private async signReceipt(
    content: string,
    agentPrivateKey: string | Buffer
  ): Promise<{ signature: string; timestamp: string }> {
    try {
      const timestamp = new Date().toISOString();
      
      // Convert key to proper format — if string, assume hex-encoded
      let keyBuffer: Buffer;
      if (typeof agentPrivateKey === 'string') {
        // Try hex first, fall back to base64, then UTF-8
        if (/^[a-f0-9]{64}$/i.test(agentPrivateKey)) {
          keyBuffer = Buffer.from(agentPrivateKey, 'hex');
        } else if (/^[A-Za-z0-9+/=]+$/.test(agentPrivateKey) && agentPrivateKey.length >= 40) {
          keyBuffer = Buffer.from(agentPrivateKey, 'base64');
        } else {
          keyBuffer = Buffer.from(agentPrivateKey, 'utf-8');
        }
      } else {
        keyBuffer = agentPrivateKey;
      }

      // Sign the canonical content
      const signature = await signPayload(content, keyBuffer);
      
      return {
        signature,
        timestamp,
      };
    } catch (err) {
      logger.error('Failed to sign receipt', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('Receipt signing failed');
    }
  }

  /**
   * Create a new trust receipt
   * 
   * @param input Receipt creation input
   * @param agentPrivateKey Agent's private key for signing
   * @returns Signed, hash-chained trust receipt
   */
  async createReceipt(
    input: CreateReceiptInput,
    agentPrivateKey: string | Buffer
  ): Promise<TrustReceipt> {
    try {
      const now = new Date();
      const timestamp = now.toISOString();

      // Build interaction: hash content by default, include raw text only when opted in
      let interaction: AIInteraction;
      if (this.config.includeContent) {
        // Include raw content AND hashes
        interaction = {
          ...input.interaction,
          prompt_hash: createHash('sha256').update(input.interaction.prompt || '').digest('hex'),
          response_hash: createHash('sha256').update(input.interaction.response || '').digest('hex'),
        };
      } else {
        // Privacy-by-default: hashes only, no raw content
        const { prompt, response, ...rest } = input.interaction;
        interaction = {
          ...rest,
          prompt_hash: createHash('sha256').update(prompt || '').digest('hex'),
          response_hash: createHash('sha256').update(response || '').digest('hex'),
        };
      }

      // Build receipt without signature or IDs (to compute them)
      const receiptBase: Partial<TrustReceipt> = {
        version: '2.0.0',
        timestamp,
        session_id: input.session_id,
        agent_did: input.agent_did,
        human_did: input.human_did,
        policy_version: input.policy_version,
        mode: input.mode,
        interaction,
        telemetry: this.config.enableTelemetry ? input.telemetry : undefined,
        policy_state: this.config.enablePolicyState ? input.policy_state : undefined,
        chain: {
          previous_hash: input.previous_hash || this.previousHash,
          chain_hash: '', // Will be computed
          chain_length: this.chainLength + 1,
        },
        metadata: input.metadata,
      };

      // Generate receipt ID from base content (with chain_hash='')
      const id = this.generateReceiptId(receiptBase);

      // Add ID to receipt
      const receiptWithId: Partial<TrustReceipt> = {
        ...receiptBase,
        id,
      };

      // Compute chain hash BEFORE signing (hash of canonical content + previous hash)
      // Uses content without signature, with chain_hash=''
      const canonicalForChain = this.canonicalizeContent(receiptWithId as TrustReceipt);
      const chainContent = canonicalForChain + receiptBase.chain!.previous_hash;
      const chainHash = this.generateHash(chainContent);

      // Update chain hash in receipt, then sign the complete content
      const receiptForSigning: Partial<TrustReceipt> = {
        ...receiptWithId,
        chain: {
          ...receiptBase.chain!,
          chain_hash: chainHash,
        },
      };

      // Canonicalize content for signing (without signature, WITH chain_hash)
      const canonical = this.canonicalizeContent(receiptForSigning as TrustReceipt);

      // Sign the receipt
      const { signature: signatureValue, timestamp: signedAt } = await this.signReceipt(
        canonical,
        agentPrivateKey
      );

      // Build final receipt
      const finalReceipt: TrustReceipt = {
        id,
        version: '2.0.0',
        timestamp,
        session_id: input.session_id,
        agent_did: input.agent_did,
        human_did: input.human_did,
        policy_version: input.policy_version,
        mode: input.mode,
        interaction,
        telemetry: this.config.enableTelemetry ? input.telemetry : undefined,
        policy_state: this.config.enablePolicyState ? input.policy_state : undefined,
        chain: {
          previous_hash: receiptBase.chain!.previous_hash,
          chain_hash: chainHash,
          chain_length: this.chainLength + 1,
        },
        signature: {
          algorithm: 'Ed25519',
          value: signatureValue,
          key_version: this.config.agentKeyVersion,
          timestamp_signed: signedAt,
        },
        metadata: input.metadata,
      };

      // Validate receipt before returning
      const validation = receiptValidator.validateJSON(finalReceipt);
      if (!validation.valid) {
        logger.error('Generated receipt failed validation', {
          errors: validation.errors,
          warnings: validation.warnings,
        });
        throw new Error('Generated receipt failed validation');
      }

      // Update chain state for next receipt
      this.previousHash = chainHash;
      this.chainLength += 1;

      logger.info('Receipt created successfully', {
        id: finalReceipt.id,
        chain_length: this.chainLength,
        session_id: input.session_id,
      });

      return finalReceipt;
    } catch (err) {
      logger.error('Failed to create receipt', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Create batch of receipts (e.g., for testing)
   */
  async createReceiptBatch(
    inputs: CreateReceiptInput[],
    agentPrivateKey: string | Buffer
  ): Promise<TrustReceipt[]> {
    const receipts: TrustReceipt[] = [];

    for (const input of inputs) {
      const receipt = await this.createReceipt(input, agentPrivateKey);
      receipts.push(receipt);
    }

    return receipts;
  }

  /**
   * Get current chain state (for inspection)
   */
  getChainState() {
    return {
      previousHash: this.previousHash,
      chainLength: this.chainLength,
      isGenesis: this.previousHash === 'GENESIS',
    };
  }

  /**
   * Reset chain state (useful for testing or new sessions)
   */
  resetChainState() {
    this.previousHash = 'GENESIS';
    this.chainLength = 0;
  }
}

/**
 * Export singleton instance for convenience
 */
let singletonInstance: ReceiptGeneratorService | null = null;

export function getReceiptGenerator(config?: Partial<ReceiptGeneratorConfig>): ReceiptGeneratorService {
  if (!singletonInstance) {
    singletonInstance = new ReceiptGeneratorService(config);
  }
  return singletonInstance;
}

export default ReceiptGeneratorService;
