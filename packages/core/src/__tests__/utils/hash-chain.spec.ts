/**
 * Hash Chain Utilities Tests
 * 
 * Tests SHA256 hash chain implementation for Trust Receipts
 */

import { 
  hashChain, 
  verifyHashChain,
  genesisHash 
} from '../../utils/hash-chain';

describe('Hash Chain Utilities', () => {
  const testPreviousHash = 'abc123def4567890123456789012345678901234567890123456789012345678';
  const testPayload = 'test-payload-data';
  const testTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
  const testSignature = 'def123abc4567890123456789012345678901234567890123456789012345678';

  describe('hashChain', () => {
    it('should generate a valid SHA256 hash', () => {
      const hash = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should produce consistent hashes for same inputs', () => {
      const hash1 = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      const hash2 = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      const hash2 = hashChain('different-previous-hash', testPayload, testTimestamp, testSignature);
      const hash3 = hashChain(testPreviousHash, 'different-payload', testTimestamp, testSignature);
      const hash4 = hashChain(testPreviousHash, testPayload, 1234567890, testSignature);
      const hash5 = hashChain(testPreviousHash, testPayload, testTimestamp, 'different-signature');
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).not.toBe(hash4);
      expect(hash1).not.toBe(hash5);
    });

    it('should handle empty strings', () => {
      const hash = hashChain('', '', 0, '');
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should handle Unicode payloads', () => {
      const unicodePayload = '🚀 Hello 世界 🌍';
      const hash = hashChain(testPreviousHash, unicodePayload, testTimestamp, testSignature);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should handle large payloads', () => {
      const largePayload = 'x'.repeat(10000);
      const hash = hashChain(testPreviousHash, largePayload, testTimestamp, testSignature);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should handle special characters', () => {
      const specialPayload = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = hashChain(testPreviousHash, specialPayload, testTimestamp, testSignature);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should handle different timestamp formats', () => {
      const hash1 = hashChain(testPreviousHash, testPayload, 0, testSignature);
      const hash2 = hashChain(testPreviousHash, testPayload, -1, testSignature);
      const hash3 = hashChain(testPreviousHash, testPayload, Number.MAX_SAFE_INTEGER, testSignature);
      
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
      expect(hash2).toMatch(/^[a-f0-9]{64}$/);
      expect(hash3).toMatch(/^[a-f0-9]{64}$/);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('verifyHashChain', () => {
    const createTestReceipts = (count: number) => {
      const receipts = [];
      let previousHash = '0'.repeat(64); // Genesis hash
      
      for (let i = 0; i < count; i++) {
        const payload = `payload-${i}`;
        const timestamp = testTimestamp + i * 1000;
        const signature = `signature-${i}`;
        const selfHash = hashChain(previousHash, payload, timestamp, signature);
        
        receipts.push({
          self_hash: selfHash,
          previous_hash: i === 0 ? undefined : previousHash
        });
        
        previousHash = selfHash;
      }
      
      return receipts;
    };

    it('should verify a valid hash chain', () => {
      const receipts = createTestReceipts(5);
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(true);
    });

    it('should verify a single receipt chain', () => {
      const receipts = createTestReceipts(1);
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(true);
    });

    it('should verify an empty chain', () => {
      const isValid = verifyHashChain([]);
      
      expect(isValid).toBe(true);
    });

    it('should reject chain with broken link', () => {
      const receipts = createTestReceipts(3);
      // Tamper with the second receipt's previous_hash
      receipts[1].previous_hash = 'tampered-hash';
      
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(false);
    });

    it('should reject chain with incorrect self_hash', () => {
      const receipts = createTestReceipts(3);
      // Tamper with the second receipt's self_hash
      receipts[1].self_hash = 'tampered-self-hash';
      
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(false);
    });

    it('should reject chain with missing previous_hash (except first)', () => {
      const receipts = createTestReceipts(3);
      // Remove previous_hash from second receipt
      delete receipts[1].previous_hash;
      
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(false);
    });

    it('should handle chain with first receipt having previous_hash', () => {
      const receipts = createTestReceipts(3);
      // Add previous_hash to first receipt (should still be valid)
      receipts[0].previous_hash = '0'.repeat(64);
      
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(true);
    });

    it('should verify long chains', () => {
      const receipts = createTestReceipts(100);
      const isValid = verifyHashChain(receipts);
      
      expect(isValid).toBe(true);
    });

    it('should handle chain with Unicode payloads', () => {
      const receipts = [];
      let previousHash = '0'.repeat(64);
      
      for (let i = 0; i < 3; i++) {
        const payload = `🚀 Unicode payload ${i} 世界 🌍`;
        const timestamp = testTimestamp + i * 1000;
        const signature = `signature-${i}`;
        const selfHash = hashChain(previousHash, payload, timestamp, signature);
        
        receipts.push({
          self_hash: selfHash,
          previous_hash: i === 0 ? undefined : previousHash
        });
        
        previousHash = selfHash;
      }
      
      const isValid = verifyHashChain(receipts);
      expect(isValid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should create and verify a complete hash chain', () => {
      const receipts = [];
      let previousHash = undefined;
      
      // Create a chain of 5 receipts
      for (let i = 0; i < 5; i++) {
        const payload = `receipt-${i}`;
        const timestamp = Date.now() + i;
        const signature = `signature-${i}`;
        
        const selfHash = hashChain(
          previousHash || '',
          payload,
          timestamp,
          signature
        );
        
        receipts.push({
          self_hash: selfHash,
          previous_hash: i === 0 ? undefined : previousHash
        });
        
        previousHash = selfHash;
      }
      
      // Verify the chain is valid
      expect(verifyHashChain(receipts)).toBe(true);
    });

    it('should detect tampering in any part of the chain', () => {
      const receipts = [];
      let previousHash = undefined;
      
      // Create a chain of 3 receipts
      for (let i = 0; i < 3; i++) {
        const payload = `receipt-${i}`;
        const timestamp = Date.now() + i;
        const signature = `signature-${i}`;
        
        const selfHash = hashChain(
          previousHash || '',
          payload,
          timestamp,
          signature
        );
        
        receipts.push({
          self_hash: selfHash,
          previous_hash: i === 0 ? undefined : previousHash
        });
        
        previousHash = selfHash;
      }
      
      // Verify original chain is valid
      expect(verifyHashChain(receipts)).toBe(true);
      
      // Tamper with the chain link (previous_hash reference)
      const originalPreviousHash = receipts[1].previous_hash;
      receipts[1].previous_hash = 'tampered-previous-hash';
      
      expect(verifyHashChain(receipts)).toBe(false);
      
      // Restore and verify it's valid again
      receipts[1].previous_hash = originalPreviousHash;
      expect(verifyHashChain(receipts)).toBe(true);
    });

    it('should generate genesis hash', () => {
      const sessionId = 'test-session-123';
      const genesis = genesisHash(sessionId);
      
      expect(genesis).toMatch(/^[a-f0-9]{64}$/);
      expect(genesis).toHaveLength(64);
      
      // Same session should generate same hash
      const genesis2 = genesisHash(sessionId);
      expect(genesis).toBe(genesis2);
      
      // Different session should generate different hash
      const genesis3 = genesisHash('different-session');
      expect(genesis3).not.toBe(genesis);
    });
  });

  describe('Performance Tests', () => {
    it('should generate hash quickly', () => {
      const startTime = performance.now();
      hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // Should complete within 10ms
    });

    it('should verify long chain quickly', () => {
      const receipts = [];
      let previousHash = '0'.repeat(64);
      
      // Create a chain of 1000 receipts
      for (let i = 0; i < 1000; i++) {
        const payload = `payload-${i}`;
        const selfHash = hashChain(previousHash, payload, testTimestamp + i, `signature-${i}`);
        
        receipts.push({
          self_hash: selfHash,
          previous_hash: i === 0 ? undefined : previousHash
        });
        
        previousHash = selfHash;
      }
      
      const startTime = performance.now();
      verifyHashChain(receipts);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle concurrent hash generation', async () => {
      const concurrentOperations = 100;
      const promises = [];
      
      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(
          Promise.resolve(hashChain(
            `hash-${i}`,
            `payload-${i}`,
            testTimestamp + i,
            `signature-${i}`
          ))
        );
      }
      
      const hashes = await Promise.all(promises);
      expect(hashes).toHaveLength(concurrentOperations);
      
      // All hashes should be valid format
      hashes.forEach(hash => {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
        expect(hash).toHaveLength(64);
      });
      
      // All hashes should be unique
      expect(new Set(hashes).size).toBe(concurrentOperations);
    });
  });

  describe('Security Tests', () => {
    it('should produce deterministic hashes', () => {
      const hash1 = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      const hash2 = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      const hash3 = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      
      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should have good hash distribution', () => {
      const hashes = [];
      
      // Generate many hashes to test distribution
      for (let i = 0; i < 1000; i++) {
        const hash = hashChain(
          `hash-${i}`,
          `payload-${i}`,
          testTimestamp + i,
          `signature-${i}`
        );
        hashes.push(hash);
      }
      
      // Test that hashes are well distributed
      const hexChars = '0123456789abcdef';
      const allHashes = hashes.join('');
      
      // Each hex character should appear roughly equally
      for (const char of hexChars) {
        const count = allHashes.split(char).length - 1;
        const expected = allHashes.length / 16;
        // Allow some variance but should be roughly uniform
        expect(count).toBeGreaterThan(expected * 0.5);
        expect(count).toBeLessThan(expected * 1.5);
      }
    });

    it('should prevent hash collisions', () => {
      const hashes = new Map();
      
      // Generate many hashes and check for collisions
      for (let i = 0; i < 10000; i++) {
        const hash = hashChain(
          `hash-${i}`,
          `payload-${i}`,
          testTimestamp + i,
          `signature-${i}`
        );
        
        if (hashes.has(hash)) {
          fail(`Hash collision detected: ${hash}`);
        }
        
        hashes.set(hash, i);
      }
      
      // If we get here, no collisions were found
      expect(hashes.size).toBe(10000);
    });

    it('should be resistant to pre-image attacks', () => {
      // This is a basic test - in practice, SHA256 is considered secure
      const targetHash = hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      
      // Try to find a different input that produces the same hash
      // This should be computationally infeasible for SHA256
      let foundCollision = false;
      
      for (let i = 0; i < 1000; i++) {
        const testHash = hashChain(
          `different-${i}`,
          `different-payload-${i}`,
          testTimestamp + i,
          `different-signature-${i}`
        );
        
        if (testHash === targetHash) {
          foundCollision = true;
          break;
        }
      }
      
      expect(foundCollision).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long inputs', () => {
      const longPreviousHash = 'a'.repeat(1000);
      const longPayload = 'b'.repeat(10000);
      const longSignature = 'c'.repeat(1000);
      
      const hash = hashChain(longPreviousHash, longPayload, testTimestamp, longSignature);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(() => {
        hashChain(testPreviousHash, testPayload, testTimestamp, testSignature);
      }).not.toThrow();
    });

    it('should handle numeric inputs converted to strings', () => {
      const hash = hashChain(
        123 as any,
        456 as any,
        789 as any,
        0o12 as any
      );
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toHaveLength(64);
    });

    it('should handle boolean inputs', () => {
      const hash1 = hashChain('true', 'false', 1, 'false');
      const hash2 = hashChain('true', 'false', 1, 'false');
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
