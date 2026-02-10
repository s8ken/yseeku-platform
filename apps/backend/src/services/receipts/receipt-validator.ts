/**
 * Receipt Validator Service
 * 
 * Responsible for validating and verifying trust receipts
 * 
 * Features:
 * - Schema validation (JSON Schema)
 * - Signature verification (Ed25519)
 * - Chain integrity verification
 * - Cryptographic hash validation
 */

import { createHash, publicKeyObject } from 'crypto';
import { TrustReceipt, receiptValidator, VerificationResult } from '@sonate/schemas';
import { verifySignature } from '@sonate/core';
import logger from '../../utils/logger';

/**
 * Receipt Verification Result (extended)
 */
export interface DetailedVerificationResult extends VerificationResult {
  receipt?: TrustReceipt;
  publicKey?: string; // Public key used for verification (if available)
}

/**
 * ReceiptValidatorService
 * 
 * Validates receipts and verifies signatures
 */
export class ReceiptValidatorService {
  /**
   * Verify receipt schema is valid
   */
  validateSchema(receipt: unknown): VerificationResult {
    try {
      return receiptValidator.validateJSON(receipt);
    } catch (err) {
      logger.error('Schema validation error', { error: err instanceof Error ? err.message : String(err) });
      return {
        valid: false,
        checks: {
          schema_valid: false,
          signature_valid: false,
          chain_valid: false,
          chain_hash_valid: false,
        },
        errors: ['Schema validation failed'],
        warnings: [],
      };
    }
  }

  /**
   * Verify receipt signature (cryptographic proof)
   * 
   * In production, this would:
   * - Retrieve agent's public key from DID resolver
   * - Verify the Ed25519 signature against canonical content
   * - Check signature timestamp
   */
  async verifySignature(
    receipt: TrustReceipt,
    publicKey: string | Buffer
  ): Promise<boolean> {
    try {
      // Reconstruct the canonical content that was signed
      const { signature: sig, ...receiptWithoutSignature } = receipt;
      const canonical = JSON.stringify(receiptWithoutSignature, Object.keys(receiptWithoutSignature).sort());

      // Verify the signature
      const isValid = await verifySignature(canonical, sig.value, publicKey);

      if (!isValid) {
        logger.warn('Signature verification failed', { receipt_id: receipt.id });
        return false;
      }

      logger.debug('Signature verified successfully', { receipt_id: receipt.id });
      return true;
    } catch (err) {
      logger.error('Signature verification error', {
        receipt_id: receipt.id,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  /**
   * Verify chain integrity (hash chain validation)
   */
  verifyChainIntegrity(receipt: TrustReceipt, previousChainHash?: string): boolean {
    try {
      // Check if previous hash matches
      if (previousChainHash && receipt.chain.previous_hash !== previousChainHash) {
        logger.warn('Chain previous hash mismatch', { receipt_id: receipt.id });
        return false;
      }

      // Verify chain hash was computed correctly
      const { signature: sig, id, ...receiptWithoutSignature } = receipt;
      const canonical = JSON.stringify(receiptWithoutSignature, Object.keys(receiptWithoutSignature).sort());
      const chainContent = canonical + receipt.chain.previous_hash;
      const expectedChainHash = createHash('sha256').update(chainContent).digest('hex');

      if (receipt.chain.chain_hash !== expectedChainHash) {
        logger.warn('Chain hash mismatch', { receipt_id: receipt.id });
        return false;
      }

      logger.debug('Chain integrity verified', { receipt_id: receipt.id });
      return true;
    } catch (err) {
      logger.error('Chain integrity verification error', {
        receipt_id: receipt.id,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  /**
   * Verify receipt ID (SHA-256 hash of content)
   */
  verifyReceiptId(receipt: TrustReceipt): boolean {
    try {
      const { signature: sig, id, ...receiptWithoutId } = receipt;
      const canonical = JSON.stringify(receiptWithoutId, Object.keys(receiptWithoutId).sort());
      const expectedId = createHash('sha256').update(canonical).digest('hex');

      if (receipt.id !== expectedId) {
        logger.warn('Receipt ID mismatch', { receipt_id: receipt.id });
        return false;
      }

      logger.debug('Receipt ID verified', { receipt_id: receipt.id });
      return true;
    } catch (err) {
      logger.error('Receipt ID verification error', {
        receipt_id: receipt.id,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  /**
   * Full receipt verification (comprehensive)
   * 
   * Performs all checks:
   * 1. Schema validation
   * 2. Receipt ID verification
   * 3. Signature verification (requires public key)
   * 4. Chain integrity verification
   */
  async verifyReceipt(
    receipt: unknown,
    publicKey?: string | Buffer,
    previousChainHash?: string
  ): Promise<DetailedVerificationResult> {
    const result: DetailedVerificationResult = {
      valid: true,
      checks: {
        schema_valid: false,
        signature_valid: false,
        chain_valid: false,
        chain_hash_valid: false,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Validate schema
      const schemaResult = this.validateSchema(receipt);
      result.checks.schema_valid = schemaResult.checks.schema_valid;
      result.errors.push(...schemaResult.errors);
      result.warnings.push(...schemaResult.warnings);

      if (!result.checks.schema_valid) {
        result.valid = false;
        return result;
      }

      const typedReceipt = receipt as TrustReceipt;
      result.receipt = typedReceipt;

      // Step 2: Verify receipt ID
      const idValid = this.verifyReceiptId(typedReceipt);
      if (!idValid) {
        result.errors.push('Receipt ID verification failed');
        result.valid = false;
      }

      // Step 3: Verify signature (if public key provided)
      if (publicKey) {
        result.publicKey = typeof publicKey === 'string' ? publicKey : publicKey.toString();
        const signatureValid = await this.verifySignature(typedReceipt, publicKey);
        result.checks.signature_valid = signatureValid;
        if (!signatureValid) {
          result.errors.push('Signature verification failed');
          result.valid = false;
        }
      } else {
        result.warnings.push('Public key not provided - signature verification skipped');
      }

      // Step 4: Verify chain integrity
      const chainValid = this.verifyChainIntegrity(typedReceipt, previousChainHash);
      result.checks.chain_valid = chainValid;
      result.checks.chain_hash_valid = chainValid;
      if (!chainValid) {
        result.errors.push('Chain integrity verification failed');
        result.valid = false;
      }

      if (result.valid) {
        logger.info('Receipt verified successfully', { receipt_id: typedReceipt.id });
      }

      return result;
    } catch (err) {
      result.valid = false;
      result.errors.push(`Verification error: ${err instanceof Error ? err.message : String(err)}`);
      logger.error('Receipt verification error', { error: err instanceof Error ? err.message : String(err) });
      return result;
    }
  }
}

/**
 * Singleton instance
 */
let singletonInstance: ReceiptValidatorService | null = null;

export function getReceiptValidator(): ReceiptValidatorService {
  if (!singletonInstance) {
    singletonInstance = new ReceiptValidatorService();
  }
  return singletonInstance;
}

export default ReceiptValidatorService;
