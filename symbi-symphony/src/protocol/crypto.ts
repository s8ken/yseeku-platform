/**
 * Ed25519 Cryptographic Utilities for Symbi Trust Protocol
 * Provides digital signatures and key pair generation
 */

import { createHash, generateKeyPairSync, createSign, createVerify, KeyPairKeyObjectResult } from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  publicKeyBuffer: Buffer;
  privateKeyBuffer: Buffer;
}

export interface SignatureResult {
  signature: string;
  timestamp: number;
  algorithm: string;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  timestamp: number;
}

export class Ed25519Manager {
  private algorithm: string = 'ed25519';

  /**
   * Generate a new Ed25519 key pair
   */
  generateKeyPair(): KeyPair {
    try {
      const keyPair = generateKeyPairSync('ed25519', {
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyBuffer: Buffer.from(keyPair.publicKey),
        privateKeyBuffer: Buffer.from(keyPair.privateKey)
      };
    } catch (error) {
      throw new Error(`Failed to generate Ed25519 key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign data with private key
   */
  signData(data: string | Buffer, privateKey: string | Buffer): SignatureResult {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      
      // For Ed25519, we need to use the key directly, not createSign
      const crypto = require('crypto');
      const signature = crypto.sign(null, dataBuffer, privateKey);

      return {
        signature: signature.toString('hex'),
        timestamp: Date.now(),
        algorithm: this.algorithm
      };
    } catch (error) {
      throw new Error(`Failed to sign data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify signature with public key
   */
  verifySignature(
    data: string | Buffer,
    signature: string,
    publicKey: string | Buffer
  ): VerificationResult {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'hex');

      // For Ed25519, we need to use the key directly, not createVerify
      const crypto = require('crypto');
      const valid = crypto.verify(null, dataBuffer, publicKey, signatureBuffer);

      return {
        valid,
        reason: valid ? undefined as any : 'Signature verification failed',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Create a hash of data using SHA-256
   */
  hashData(data: string | Buffer): string {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    return createHash('sha256').update(dataBuffer).digest('hex');
  }

  /**
   * Create a signed hash of data
   */
  signHash(data: string | Buffer, privateKey: string | Buffer): {
    hash: string;
    signature: SignatureResult;
  } {
    const hash = this.hashData(data);
    const signature = this.signData(hash, privateKey);
    
    return {
      hash,
      signature
    };
  }

  /**
   * Verify a signed hash
   */
  verifySignedHash(
    data: string | Buffer,
    hash: string,
    signature: string,
    publicKey: string | Buffer
  ): VerificationResult {
    // First verify the hash matches the data
    const calculatedHash = this.hashData(data);
    if (calculatedHash !== hash) {
      return {
        valid: false,
        reason: 'Hash mismatch',
        timestamp: Date.now()
      };
    }

    // Then verify the signature
    return this.verifySignature(hash, signature, publicKey);
  }

  /**
   * Export key pair to JSON-serializable format
   */
  exportKeyPair(keyPair: KeyPair): {
    publicKey: string;
    privateKey: string;
    algorithm: string;
  } {
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: this.algorithm
    };
  }

  /**
   * Import key pair from JSON-serializable format
   */
  importKeyPair(exported: {
    publicKey: string;
    privateKey: string;
    algorithm: string;
  }): KeyPair {
    if (exported.algorithm !== this.algorithm) {
      throw new Error(`Invalid algorithm: expected ${this.algorithm}, got ${exported.algorithm}`);
    }

    return {
      publicKey: exported.publicKey,
      privateKey: exported.privateKey,
      publicKeyBuffer: Buffer.from(exported.publicKey),
      privateKeyBuffer: Buffer.from(exported.privateKey)
    };
  }

  /**
   * Create a deterministic key pair from a seed (useful for testing)
   */
  generateDeterministicKeyPair(seed: string): KeyPair {
    // This is a simplified deterministic generation for testing
    // In production, use proper key derivation functions
    const hash = createHash('sha256').update(seed).digest('hex');
    
    // Create deterministic keys based on seed (simplified for testing)
    const deterministicPrivateKey = `-----BEGIN PRIVATE KEY-----\n${hash.substring(0, 32)}\n-----END PRIVATE KEY-----`;
    const deterministicPublicKey = `-----BEGIN PUBLIC KEY-----\n${hash.substring(32, 64)}\n-----END PUBLIC KEY-----`;

    return {
      publicKey: deterministicPublicKey,
      privateKey: deterministicPrivateKey,
      publicKeyBuffer: Buffer.from(deterministicPublicKey),
      privateKeyBuffer: Buffer.from(deterministicPrivateKey)
    };
  }
}

/**
 * Utility functions for common operations
 */
export const CryptoUtils = {
  /**
   * Generate a secure random string
   */
  generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Create a timestamp-based nonce
   */
  createNonce(): string {
    return `${Date.now()}-${this.generateRandomString(16)}`;
  },

  /**
   * Combine multiple data pieces for signing
   */
  combineData(...pieces: (string | number)[]): string {
    return pieces.map(p => String(p)).join(':');
  },

  /**
   * Validate Ed25519 key format
   */
  validateKeyFormat(key: string, type: 'public' | 'private'): boolean {
    try {
      if (type === 'public') {
        return key.includes('BEGIN PUBLIC KEY') && key.includes('END PUBLIC KEY');
      } else {
        return key.includes('BEGIN PRIVATE KEY') && key.includes('END PRIVATE KEY');
      }
    } catch {
      return false;
    }
  }
};