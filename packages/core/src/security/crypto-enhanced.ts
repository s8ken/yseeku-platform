/**
 * Enhanced Cryptographic Utilities for YSEEKU
 * Combines sonate-protocol Ed25519 components with YSEEKU trust receipt system
 * Provides enterprise-grade cryptographic operations with integrity verification
 */

import { createHash, generateKeyPairSync } from 'crypto';

import * as ed25519 from '@noble/ed25519';

import { TrustReceipt, TrustReceiptData } from '../trust-receipt';

export interface EnhancedKeyPair {
  publicKey: string;
  privateKey: string;
  publicKeyBuffer: Buffer;
  privateKeyBuffer: Buffer;
  publicKeyUint8Array: Uint8Array;
  privateKeyUint8Array: Uint8Array;
}

export interface EnhancedSignatureResult {
  signature: string;
  timestamp: number;
  algorithm: string;
  hash: string;
}

export interface EnhancedVerificationResult {
  valid: boolean;
  reason?: string;
  timestamp: number;
  hash?: string;
}

export interface SignedReceipt extends TrustReceipt {
  integrityHash: string;
  chainSignature: string;
}

export class EnhancedCryptoManager {
  private algorithm: string = 'ed25519';
  private hashAlgorithm: string = 'sha256';

  /**
   * Generate a new Ed25519 key pair with enhanced encoding
   */
  generateEnhancedKeyPair(): EnhancedKeyPair {
    try {
      // Generate using Node.js crypto for compatibility
      const keyPair = generateKeyPairSync('ed25519', {
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      // Convert to Uint8Array for @noble/ed25519 compatibility
      const publicKeyBuffer = Buffer.from(keyPair.publicKey);
      const privateKeyBuffer = Buffer.from(keyPair.privateKey);

      // For @noble/ed25519, we need 32-byte keys
      const privateKeyUint8Array = new Uint8Array(32);
      const publicKeyUint8Array = new Uint8Array(32);

      // Extract key material (simplified - in production, use proper key parsing)
      if (privateKeyBuffer.length >= 32) {
        privateKeyUint8Array.set(privateKeyBuffer.slice(-32));
      }
      if (publicKeyBuffer.length >= 32) {
        publicKeyUint8Array.set(publicKeyBuffer.slice(-32));
      }

      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyBuffer,
        privateKeyBuffer,
        publicKeyUint8Array,
        privateKeyUint8Array,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate enhanced Ed25519 key pair: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Create enhanced trust receipt with cryptographic integrity
   */
  async createSignedReceipt(
    receiptData: TrustReceiptData,
    privateKey: Uint8Array,
    previousReceipt?: SignedReceipt
  ): Promise<SignedReceipt> {
    // Create standard trust receipt
    const receipt = new TrustReceipt(receiptData);

    // Sign with the standard method
    await receipt.sign(privateKey);

    // Calculate integrity hash for the entire receipt
    const integrityHash = this.calculateIntegrityHash(receipt);

    // Create chain signature if previous receipt exists
    let chainSignature = '';
    if (previousReceipt) {
      chainSignature = await this.createChainSignature(integrityHash, previousReceipt, privateKey);
    }

    return {
      ...receipt,
      integrityHash,
      chainSignature,
    };
  }

  /**
   * Verify enhanced receipt with integrity and chain validation
   */
  async verifySignedReceipt(
    receipt: SignedReceipt,
    publicKey: Uint8Array,
    previousReceipt?: SignedReceipt
  ): Promise<EnhancedVerificationResult> {
    try {
      // Verify standard receipt signature
      const receiptValid = await receipt.verify(publicKey);
      if (!receiptValid) {
        return {
          valid: false,
          reason: 'Receipt signature verification failed',
          timestamp: Date.now(),
        };
      }

      // Verify integrity hash
      const calculatedIntegrityHash = this.calculateIntegrityHash(receipt);
      if (calculatedIntegrityHash !== receipt.integrityHash) {
        return {
          valid: false,
          reason: 'Integrity hash mismatch',
          timestamp: Date.now(),
        };
      }

      // Verify chain signature if previous receipt exists
      if (previousReceipt && receipt.chainSignature) {
        const chainValid = await this.verifyChainSignature(
          receipt.integrityHash,
          receipt.chainSignature,
          previousReceipt,
          publicKey
        );

        if (!chainValid) {
          return {
            valid: false,
            reason: 'Chain signature verification failed',
            timestamp: Date.now(),
          };
        }
      }

      return {
        valid: true,
        timestamp: Date.now(),
        hash: calculatedIntegrityHash,
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Calculate integrity hash for receipt
   */
  private calculateIntegrityHash(receipt: TrustReceipt): string {
    const receiptData = receipt.toJSON();
    const combinedData = JSON.stringify({
      ...receiptData,
      timestamp: receipt.timestamp, // Ensure timestamp is included
    });

    return createHash(this.hashAlgorithm).update(combinedData).digest('hex');
  }

  /**
   * Create chain signature linking to previous receipt
   */
  private async createChainSignature(
    currentHash: string,
    previousReceipt: SignedReceipt,
    privateKey: Uint8Array
  ): Promise<string> {
    const chainData = JSON.stringify({
      currentHash,
      previousHash: previousReceipt.integrityHash,
      previousTimestamp: previousReceipt.timestamp,
    });

    const chainHash = createHash(this.hashAlgorithm).update(chainData).digest('hex');
    const signature = await ed25519.sign(Buffer.from(chainHash, 'hex'), privateKey);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verify chain signature
   */
  private async verifyChainSignature(
    currentHash: string,
    chainSignature: string,
    previousReceipt: SignedReceipt,
    publicKey: Uint8Array
  ): Promise<boolean> {
    try {
      const chainData = JSON.stringify({
        currentHash,
        previousHash: previousReceipt.integrityHash,
        previousTimestamp: previousReceipt.timestamp,
      });

      const chainHash = createHash(this.hashAlgorithm).update(chainData).digest('hex');
      const signature = Buffer.from(chainSignature, 'hex');

      return await ed25519.verify(signature, Buffer.from(chainHash, 'hex'), publicKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate deterministic key pair for testing
   */
  generateDeterministicKeyPair(seed: string): EnhancedKeyPair {
    const hash = createHash(this.hashAlgorithm).update(seed).digest('hex');

    // Create 32-byte keys for Ed25519
    const privateKeyUint8Array = new Uint8Array(32);
    const publicKeyUint8Array = new Uint8Array(32);

    // Fill with deterministic values from hash
    for (let i = 0; i < 32; i++) {
      privateKeyUint8Array[i] = parseInt(hash.substr(i * 2, 2), 16);
      publicKeyUint8Array[i] = parseInt(hash.substr((i + 32) * 2, 2), 16);
    }

    // Create PEM representations (simplified)
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(privateKeyUint8Array).toString(
      'base64'
    )}\n-----END PRIVATE KEY-----`;
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(publicKeyUint8Array).toString(
      'base64'
    )}\n-----END PUBLIC KEY-----`;

    return {
      publicKey,
      privateKey,
      publicKeyBuffer: Buffer.from(publicKey),
      privateKeyBuffer: Buffer.from(privateKey),
      publicKeyUint8Array,
      privateKeyUint8Array,
    };
  }

  /**
   * Create secure hash of data
   */
  hashData(data: string | Buffer): string {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    return createHash(this.hashAlgorithm).update(dataBuffer).digest('hex');
  }

  /**
   * Combine multiple data pieces for signing
   */
  combineData(...pieces: (string | number)[]): string {
    return pieces.map((p) => String(p)).join(':');
  }
}

/**
 * Enhanced crypto utilities
 */
export const EnhancedCryptoUtils = {
  /**
   * Generate cryptographically secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const result = new Array(length);
    const randomBytes = new Uint8Array(length);

    // Use crypto.getRandomValues for secure random generation
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      // Fallback for Node.js
      const crypto = require('crypto');
      crypto.randomFillSync(randomBytes);
    }

    for (let i = 0; i < length; i++) {
      result[i] = chars[randomBytes[i] % chars.length];
    }

    return result.join('');
  },

  /**
   * Create timestamp-based nonce with enhanced security
   */
  createSecureNonce(): string {
    const timestamp = Date.now();
    const randomPart = this.generateSecureRandom(16);
    return `${timestamp}-${randomPart}`;
  },

  /**
   * Validate key format
   */
  validateKeyFormat(key: string, type: 'public' | 'private'): boolean {
    try {
      if (type === 'public') {
        return key.includes('BEGIN PUBLIC KEY') && key.includes('END PUBLIC KEY');
      } 
        return key.includes('BEGIN PRIVATE KEY') && key.includes('END PRIVATE KEY');
      
    } catch {
      return false;
    }
  },

  /**
   * Convert between key formats
   */
  convertKeyFormat(key: string, targetFormat: 'pem' | 'uint8array'): Uint8Array | string {
    if (targetFormat === 'uint8array') {
      // Extract key material from PEM
      const keyContent = key
        .replace(/-----BEGIN (PUBLIC|PRIVATE) KEY-----/, '')
        .replace(/-----END (PUBLIC|PRIVATE) KEY-----/, '')
        .replace(/\s/g, '');
      return new Uint8Array(Buffer.from(keyContent, 'base64'));
    } 
      // Convert Uint8Array to PEM (simplified)
      const keyContent = Buffer.from(key).toString('base64');
      const isPrivate = keyContent.length > 100; // Simple heuristic
      if (isPrivate) {
        return `-----BEGIN PRIVATE KEY-----\n${keyContent}\n-----END PRIVATE KEY-----`;
      } 
        return `-----BEGIN PUBLIC KEY-----\n${keyContent}\n-----END PUBLIC KEY-----`;
      
    
  },
};
