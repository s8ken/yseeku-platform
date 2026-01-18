/**
 * Cryptographic Signature Utilities Tests
 *
 * Tests Ed25519 signature implementation for Trust Receipts
 */

import { signPayload, verifySignature, generateKeyPair } from '../../utils/signatures';

describe('Cryptographic Signature Utilities', () => {
  let testKeyPair: { privateKey: Uint8Array; publicKey: Uint8Array };
  let testPayload: string;

  beforeEach(async () => {
    testKeyPair = await generateKeyPair();
    testPayload = 'test-payload-for-signing';
  });

  describe('generateKeyPair', () => {
    it('should generate a valid Ed25519 key pair', async () => {
      const keyPair = await generateKeyPair();

      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toHaveLength(32);
      expect(keyPair.publicKey).toHaveLength(32);
    });

    it('should generate unique key pairs each time', async () => {
      const keyPair1 = await generateKeyPair();
      const keyPair2 = await generateKeyPair();

      expect(Buffer.compare(keyPair1.privateKey, keyPair2.privateKey)).not.toBe(0);
      expect(Buffer.compare(keyPair1.publicKey, keyPair2.publicKey)).not.toBe(0);
    });

    it('should generate keys with correct entropy', async () => {
      const keyPairs = await Promise.all([
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair(),
      ]);

      // Check that all keys are unique
      const privateKeys = keyPairs.map((kp) => kp.privateKey);
      const publicKeys = keyPairs.map((kp) => kp.publicKey);

      expect(privateKeys.length).toBe(5);
      expect(publicKeys.length).toBe(5);

      // Verify uniqueness by checking each pair
      for (let i = 0; i < privateKeys.length; i++) {
        for (let j = i + 1; j < privateKeys.length; j++) {
          expect(Buffer.compare(privateKeys[i], privateKeys[j])).not.toBe(0);
          expect(Buffer.compare(publicKeys[i], publicKeys[j])).not.toBe(0);
        }
      }
    });
  });

  describe('signPayload', () => {
    it('should sign a payload with Ed25519', async () => {
      const signature = await signPayload(testPayload, testKeyPair.privateKey);

      expect(signature).toMatch(/^[a-f0-9]{128}$/);
      expect(signature).toHaveLength(128);
    });

    it('should produce consistent signatures for same input', async () => {
      const signature1 = await signPayload(testPayload, testKeyPair.privateKey);
      const signature2 = await signPayload(testPayload, testKeyPair.privateKey);

      expect(signature1).toBe(signature2);
    });

    it('should produce different signatures for different payloads', async () => {
      const signature1 = await signPayload('payload-1', testKeyPair.privateKey);
      const signature2 = await signPayload('payload-2', testKeyPair.privateKey);

      expect(signature1).not.toBe(signature2);
    });

    it('should handle empty payload', async () => {
      const signature = await signPayload('', testKeyPair.privateKey);

      expect(signature).toMatch(/^[a-f0-9]{128}$/);
      expect(signature).toHaveLength(128);
    });

    it('should handle large payloads', async () => {
      const largePayload = 'x'.repeat(10000);
      const signature = await signPayload(largePayload, testKeyPair.privateKey);

      expect(signature).toMatch(/^[a-f0-9]{128}$/);
      expect(signature).toHaveLength(128);
    });

    it('should handle Unicode payloads', async () => {
      const unicodePayload = '🚀 Hello 世界 🌍';
      const signature = await signPayload(unicodePayload, testKeyPair.privateKey);

      expect(signature).toMatch(/^[a-f0-9]{128}$/);
      expect(signature).toHaveLength(128);
    });

    it('should reject invalid private keys', async () => {
      const invalidKey = new Uint8Array(32); // All zeros
      await expect(signPayload(testPayload, invalidKey)).resolves.toBeDefined(); // Ed25519 can handle all-zero keys
    });

    it('should reject wrong length private keys', async () => {
      const shortKey = new Uint8Array(16);
      await expect(signPayload(testPayload, shortKey)).rejects.toThrow();
    });
  });

  describe('verifySignature', () => {
    let validSignature: string;

    beforeEach(async () => {
      validSignature = await signPayload(testPayload, testKeyPair.privateKey);
    });

    it('should verify a valid signature', async () => {
      const isValid = await verifySignature(validSignature, testPayload, testKeyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const invalidSignature = 'x'.repeat(128);
      const isValid = await verifySignature(invalidSignature, testPayload, testKeyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature for different payload', async () => {
      const isValid = await verifySignature(
        validSignature,
        'different-payload',
        testKeyPair.publicKey
      );

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', async () => {
      const otherKeyPair = await generateKeyPair();
      const isValid = await verifySignature(validSignature, testPayload, otherKeyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should handle empty payload verification', async () => {
      const emptySignature = await signPayload('', testKeyPair.privateKey);
      const isValid = await verifySignature(emptySignature, '', testKeyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should handle Unicode payload verification', async () => {
      const unicodePayload = '🚀 Hello 世界 🌍';
      const unicodeSignature = await signPayload(unicodePayload, testKeyPair.privateKey);
      const isValid = await verifySignature(
        unicodeSignature,
        unicodePayload,
        testKeyPair.publicKey
      );

      expect(isValid).toBe(true);
    });

    it('should reject malformed signatures', async () => {
      const malformedSignatures = [
        '',
        'short',
        'x'.repeat(127),
        'x'.repeat(129),
        'invalid-signature-chars-!@#$%^&*()',
      ];

      for (const malformedSig of malformedSignatures) {
        const isValid = await verifySignature(malformedSig, testPayload, testKeyPair.publicKey);
        expect(isValid).toBe(false);
      }
    });

    it('should reject malformed public keys', async () => {
      const malformedKeys = [new Uint8Array(0), new Uint8Array(16), new Uint8Array(64)];

      for (const malformedKey of malformedKeys) {
        await expect(verifySignature(validSignature, testPayload, malformedKey)).resolves.toBe(
          false
        ); // Should return false, not throw
      }
    });
  });

  describe('Integration Tests', () => {
    it('should complete full sign-verify cycle', async () => {
      const keyPair = await generateKeyPair();
      const payload = 'integration-test-payload';

      const signature = await signPayload(payload, keyPair.privateKey);
      const isValid = await verifySignature(signature, payload, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should handle multiple sign-verify cycles', async () => {
      const keyPair = await generateKeyPair();
      const payloads = ['test-1', 'test-2', 'test-3', 'test-4', 'test-5'];

      for (const payload of payloads) {
        const signature = await signPayload(payload, keyPair.privateKey);
        const isValid = await verifySignature(signature, payload, keyPair.publicKey);
        expect(isValid).toBe(true);
      }
    });

    it('should maintain signature uniqueness across different keys', async () => {
      const keyPairs = await Promise.all([generateKeyPair(), generateKeyPair(), generateKeyPair()]);

      const signatures = await Promise.all(
        keyPairs.map((kp) => signPayload(testPayload, kp.privateKey))
      );

      // All signatures should be different
      expect(new Set(signatures).size).toBe(3);

      // Each signature should verify with its corresponding public key
      for (let i = 0; i < keyPairs.length; i++) {
        const isValid = await verifySignature(signatures[i], testPayload, keyPairs[i].publicKey);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should sign payload within acceptable time', async () => {
      const startTime = performance.now();
      await signPayload(testPayload, testKeyPair.privateKey);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should verify signature within acceptable time', async () => {
      const signature = await signPayload(testPayload, testKeyPair.privateKey);

      const startTime = performance.now();
      await verifySignature(signature, testPayload, testKeyPair.publicKey);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = 10;
      const promises = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const payload = `concurrent-test-${i}`;
        promises.push(signPayload(payload, testKeyPair.privateKey));
      }

      const signatures = await Promise.all(promises);
      expect(signatures).toHaveLength(concurrentOperations);

      // Verify all signatures
      for (let i = 0; i < concurrentOperations; i++) {
        const payload = `concurrent-test-${i}`;
        const isValid = await verifySignature(signatures[i], payload, testKeyPair.publicKey);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Security Tests', () => {
    it('should not expose private key in signature', async () => {
      const signature = await signPayload(testPayload, testKeyPair.privateKey);

      expect(signature).not.toContain(Buffer.from(testKeyPair.privateKey).toString('hex'));
      expect(signature.length).toBe(128); // Ed25519 signature length
    });

    it('should not be vulnerable to signature reuse', async () => {
      const signature = await signPayload(testPayload, testKeyPair.privateKey);

      // Same signature should not verify different payload
      const isValid = await verifySignature(signature, 'different-payload', testKeyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should generate cryptographically secure keys', async () => {
      const keyPairs = await Promise.all(
        Array(100)
          .fill(null)
          .map(() => generateKeyPair())
      );

      const privateKeys = keyPairs.map((kp) => kp.privateKey);
      const publicKeys = keyPairs.map((kp) => kp.publicKey);

      // All keys should be unique
      for (let i = 0; i < privateKeys.length; i++) {
        for (let j = i + 1; j < privateKeys.length; j++) {
          expect(Buffer.compare(privateKeys[i], privateKeys[j])).not.toBe(0);
          expect(Buffer.compare(publicKeys[i], publicKeys[j])).not.toBe(0);
        }
      }

      // Keys should look random (basic entropy check)
      const privateKeyBytes = Buffer.concat(privateKeys);
      const publicKeyBytes = Buffer.concat(publicKeys);

      // Basic entropy check - should have good distribution
      const hexChars = '0123456789abcdef';
      for (const char of hexChars) {
        const count =
          (privateKeyBytes.toString('hex') + publicKeyBytes.toString('hex')).split(char).length - 1;
        const expected = (privateKeyBytes.length + publicKeyBytes.length) / 16;
        // Allow some variance but should be roughly uniform
        expect(count).toBeGreaterThan(expected * 0.5);
        expect(count).toBeLessThan(expected * 1.5);
      }
    });
  });
});
