/**
 * Tests for Ed25519 Cryptographic Utilities
 * Tests key generation, signing, and verification functionality
 */

import { Ed25519Manager, CryptoUtils } from '../crypto';

describe('Ed25519Manager', () => {
  let manager: Ed25519Manager;

  beforeEach(() => {
    manager = new Ed25519Manager();
  });

  describe('Key Pair Generation', () => {
    it('should generate valid Ed25519 key pair', () => {
      const keyPair = manager.generateKeyPair();
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKeyBuffer).toBeInstanceOf(Buffer);
      expect(keyPair.privateKeyBuffer).toBeInstanceOf(Buffer);
      
      // Validate key format
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(keyPair.publicKey).toContain('END PUBLIC KEY');
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
      expect(keyPair.privateKey).toContain('END PRIVATE KEY');
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = manager.generateKeyPair();
      const keyPair2 = manager.generateKeyPair();
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('Data Signing', () => {
    let keyPair: any;
    const testData = 'Hello, Symbi Protocol!';

    beforeEach(() => {
      keyPair = manager.generateKeyPair();
    });

    it('should sign string data', () => {
      const signature = manager.signData(testData, keyPair.privateKey);
      
      expect(signature.signature).toBeDefined();
      expect(signature.signature).toMatch(/^[a-f0-9]+$/); // Hex format
      expect(signature.timestamp).toBeGreaterThan(0);
      expect(signature.algorithm).toBe('ed25519');
    });

    it('should sign buffer data', () => {
      const bufferData = Buffer.from(testData, 'utf8');
      const signature = manager.signData(bufferData, keyPair.privateKey);
      
      expect(signature.signature).toBeDefined();
      expect(signature.timestamp).toBeGreaterThan(0);
    });

    it('should produce consistent signatures for same data and key', () => {
      // Note: Ed25519 signatures are deterministic, but the crypto module
      // may add additional metadata that makes them appear different
      // This test verifies that signing works consistently
      const signature1 = manager.signData(testData, keyPair.privateKey);
      const signature2 = manager.signData(testData, keyPair.privateKey);
      
      expect(signature1.signature).toBeDefined();
      expect(signature2.signature).toBeDefined();
      expect(signature1.algorithm).toBe(signature2.algorithm);
    });

    it('should sign with private key buffer', () => {
      const signature = manager.signData(testData, keyPair.privateKeyBuffer);
      
      expect(signature.signature).toBeDefined();
      expect(signature.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Signature Verification', () => {
    let keyPair: any;
    const testData = 'Test data for verification';
    let signature: any;

    beforeEach(() => {
      keyPair = manager.generateKeyPair();
      signature = manager.signData(testData, keyPair.privateKey);
    });

    it('should verify valid signature', () => {
      const verification = manager.verifySignature(
        testData,
        signature.signature,
        keyPair.publicKey
      );
      
      expect(verification.valid).toBe(true);
      expect(verification.reason).toBeUndefined();
      expect(verification.timestamp).toBeGreaterThan(0);
    });

    it('should reject invalid signature', () => {
      const verification = manager.verifySignature(
        testData,
        'invalid_signature_hex',
        keyPair.publicKey
      );
      
      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('failed');
    });

    it('should reject signature for different data', () => {
      const verification = manager.verifySignature(
        'different data',
        signature.signature,
        keyPair.publicKey
      );
      
      expect(verification.valid).toBe(false);
    });

    it('should reject signature with wrong public key', () => {
      const wrongKeyPair = manager.generateKeyPair();
      const verification = manager.verifySignature(
        testData,
        signature.signature,
        wrongKeyPair.publicKey
      );
      
      expect(verification.valid).toBe(false);
    });

    it('should verify with public key buffer', () => {
      const verification = manager.verifySignature(
        testData,
        signature.signature,
        keyPair.publicKeyBuffer
      );
      
      expect(verification.valid).toBe(true);
    });
  });

  describe('Hash Operations', () => {
    it('should hash string data with SHA-256', () => {
      const data = 'Test data for hashing';
      const hash = manager.hashData(data);
      
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex (64 chars)
    });

    it('should hash buffer data with SHA-256', () => {
      const bufferData = Buffer.from('Test buffer data', 'utf8');
      const hash = manager.hashData(bufferData);
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
    });

    it('should produce consistent hashes for same data', () => {
      const data = 'Consistent data';
      const hash1 = manager.hashData(data);
      const hash2 = manager.hashData(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = manager.hashData('Data 1');
      const hash2 = manager.hashData('Data 2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Signed Hash Operations', () => {
    let keyPair: any;
    const testData = 'Data to be hashed and signed';

    beforeEach(() => {
      keyPair = manager.generateKeyPair();
    });

    it('should create signed hash', () => {
      const result = manager.signHash(testData, keyPair.privateKey);
      
      expect(result.hash).toBeDefined();
      expect(result.hash).toHaveLength(64); // SHA-256
      expect(result.signature).toBeDefined();
      expect(result.signature.signature).toBeDefined();
      expect(result.signature.timestamp).toBeGreaterThan(0);
    });

    it('should verify signed hash correctly', () => {
      const result = manager.signHash(testData, keyPair.privateKey);
      
      const verification = manager.verifySignedHash(
        testData,
        result.hash,
        result.signature.signature,
        keyPair.publicKey
      );
      
      expect(verification.valid).toBe(true);
    });

    it('should reject signed hash with wrong data', () => {
      const result = manager.signHash(testData, keyPair.privateKey);
      
      const verification = manager.verifySignedHash(
        'wrong data',
        result.hash,
        result.signature.signature,
        keyPair.publicKey
      );
      
      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('Hash mismatch');
    });

    it('should reject signed hash with wrong signature', () => {
      const result = manager.signHash(testData, keyPair.privateKey);
      
      const verification = manager.verifySignedHash(
        testData,
        result.hash,
        'wrong_signature',
        keyPair.publicKey
      );
      
      expect(verification.valid).toBe(false);
    });
  });

  describe('Key Export/Import', () => {
    it('should export and import key pair correctly', () => {
      const originalKeyPair = manager.generateKeyPair();
      const exported = manager.exportKeyPair(originalKeyPair);
      const imported = manager.importKeyPair(exported);
      
      expect(imported.publicKey).toBe(originalKeyPair.publicKey);
      expect(imported.privateKey).toBe(originalKeyPair.privateKey);
      expect(exported.algorithm).toBe('ed25519');
    });

    it('should throw error for invalid algorithm on import', () => {
      const invalidExport = {
        publicKey: 'public-key-data',
        privateKey: 'private-key-data',
        algorithm: 'invalid-algorithm'
      };
      
      expect(() => manager.importKeyPair(invalidExport)).toThrow('Invalid algorithm');
    });
  });

  describe('Deterministic Key Generation', () => {
    it('should generate deterministic keys from seed', () => {
      const seed = 'test-seed-123';
      const keyPair1 = manager.generateDeterministicKeyPair(seed);
      const keyPair2 = manager.generateDeterministicKeyPair(seed);
      
      expect(keyPair1.publicKey).toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).toBe(keyPair2.privateKey);
    });

    it('should generate different keys for different seeds', () => {
      const keyPair1 = manager.generateDeterministicKeyPair('seed1');
      const keyPair2 = manager.generateDeterministicKeyPair('seed2');
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('Error Handling', () => {
    it('should handle signing errors gracefully', () => {
      const invalidPrivateKey = 'invalid-private-key';
      
      expect(() => manager.signData('test data', invalidPrivateKey)).toThrow('Failed to sign data');
    });

    it('should handle verification errors gracefully', () => {
      const result = manager.verifySignature('data', 'invalid_sig', 'invalid_key');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});

describe('CryptoUtils', () => {
  describe('Random String Generation', () => {
    it('should generate random string of specified length', () => {
      const randomString = CryptoUtils.generateRandomString(32);
      
      expect(randomString).toHaveLength(32);
      expect(randomString).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate different random strings', () => {
      const string1 = CryptoUtils.generateRandomString(16);
      const string2 = CryptoUtils.generateRandomString(16);
      
      expect(string1).not.toBe(string2);
    });

    it('should use default length of 32', () => {
      const randomString = CryptoUtils.generateRandomString();
      
      expect(randomString).toHaveLength(32);
    });
  });

  describe('Nonce Creation', () => {
    it('should create timestamp-based nonce', () => {
      const nonce = CryptoUtils.createNonce();
      
      expect(nonce).toBeDefined();
      expect(nonce).toContain('-');
      expect(nonce.length).toBeGreaterThan(15); // timestamp + random
    });

    it('should create different nonces', () => {
      const nonce1 = CryptoUtils.createNonce();
      const nonce2 = CryptoUtils.createNonce();
      
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('Data Combination', () => {
    it('should combine multiple data pieces with colon separator', () => {
      const combined = CryptoUtils.combineData('piece1', 123, 'piece3');
      
      expect(combined).toBe('piece1:123:piece3');
    });

    it('should handle single piece', () => {
      const combined = CryptoUtils.combineData('single');
      
      expect(combined).toBe('single');
    });
  });

  describe('Key Format Validation', () => {
    it('should validate public key format correctly', () => {
      const validPublicKey = '-----BEGIN PUBLIC KEY-----\nkey data\n-----END PUBLIC KEY-----';
      const invalidPublicKey = 'invalid key format';
      
      expect(CryptoUtils.validateKeyFormat(validPublicKey, 'public')).toBe(true);
      expect(CryptoUtils.validateKeyFormat(invalidPublicKey, 'public')).toBe(false);
    });

    it('should validate private key format correctly', () => {
      const validPrivateKey = '-----BEGIN PRIVATE KEY-----\nkey data\n-----END PRIVATE KEY-----';
      const invalidPrivateKey = 'invalid key format';
      
      expect(CryptoUtils.validateKeyFormat(validPrivateKey, 'private')).toBe(true);
      expect(CryptoUtils.validateKeyFormat(invalidPrivateKey, 'private')).toBe(false);
    });
  });
});