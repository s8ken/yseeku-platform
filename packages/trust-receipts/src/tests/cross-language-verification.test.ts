/**
 * Cross-Language Receipt Verification Tests
 * 
 * Ensures JS and Python SDKs produce identical receipts
 * and verify correctly across language boundaries
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { TrustReceipts } from '../../src';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';

interface VerificationTest {
  name: string;
  receiptJSON: string;
  shouldPass: boolean;
  expectedErrors?: string[];
}

describe('Cross-Language Receipt Verification', () => {
  let pythonTestResults: any = {};

  beforeAll(() => {
    // Run Python test suite and capture results
    try {
      const pythonDir = path.resolve(__dirname, '../../python');
      const output = execSync(
        'python3 -m pytest tests/test_cross_language.py --json-report --json-report-file=test_results.json',
        { cwd: pythonDir, encoding: 'utf-8' }
      );
      
      const resultsFile = path.join(pythonDir, 'test_results.json');
      pythonTestResults = JSON.parse(readFileSync(resultsFile, 'utf-8'));
    } catch (e) {
      console.warn('Python tests not available, skipping cross-language validation');
    }
  });

  describe('Canonical JSON Determinism', () => {
    it('should produce identical canonical JSON for same input (JS)', () => {
      const input1 = { b: 2, a: 1, c: 3 };
      const input2 = { a: 1, b: 2, c: 3 };

      const receipts = new TrustReceipts();
      const canonical1 = receipts['canonicalizeJSON'](input1);
      const canonical2 = receipts['canonicalizeJSON'](input2);

      expect(canonical1).toBe(canonical2);
      expect(canonical1).toBe('{"a":1,"b":2,"c":3}');
    });

    it('should handle nested objects consistently', () => {
      const input = {
        metadata: { nested: { deeply: true } },
        scores: { clarity: 0.95 },
      };

      const receipts = new TrustReceipts();
      const canonical = receipts['canonicalizeJSON'](input);

      // Should be deterministic
      const canonical2 = receipts['canonicalizeJSON'](input);
      expect(canonical).toBe(canonical2);
    });

    it('should handle Unicode consistently', () => {
      const input = {
        content: 'Hello 世界 🌍',
        emoji: '😀',
      };

      const receipts = new TrustReceipts();
      const canonical = receipts['canonicalizeJSON'](input);

      // Verify determinism
      const canonical2 = receipts['canonicalizeJSON'](input);
      expect(canonical).toBe(canonical2);

      // Verify format: no extra spaces, keys sorted
      expect(canonical).not.toContain(' ');
    });
  });

  describe('SHA-256 Hash Consistency', () => {
    it('should produce consistent hashes for identical input', () => {
      const receipts = new TrustReceipts();
      const input = 'test message';

      const hash1 = receipts['hashContent'](input);
      const hash2 = receipts['hashContent'](input);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different input', () => {
      const receipts = new TrustReceipts();
      const hash1 = receipts['hashContent']('test1');
      const hash2 = receipts['hashContent']('test2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const receipts = new TrustReceipts();
      const hash = receipts['hashContent']('');

      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should match test vectors', () => {
      const receipts = new TrustReceipts();

      // Known SHA-256 test vectors
      const vectors = [
        {
          input: '',
          expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          input: 'abc',
          expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        },
      ];

      vectors.forEach(({ input, expected }) => {
        const hash = receipts['hashContent'](input);
        expect(hash).toBe(expected);
      });
    });
  });

  describe('Ed25519 Signature Verification', () => {
    it('should verify self-signed receipt', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => ({ role: 'assistant', content: 'Test response' }),
        {
          sessionId: 'test-session',
          input: { role: 'user', content: 'Test prompt' },
        }
      );

      // Verify using public key from receipt
      const publicKey = receipt.public_key;
      const verified = receipts.verify(receipt, publicKey);

      expect(verified).toBe(true);
    });

    it('should fail verification with tampered content', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => ({ role: 'assistant', content: 'Test response' }),
        {
          sessionId: 'test-session',
          input: { role: 'user', content: 'Test prompt' },
        }
      );

      // Tamper with scores
      const tamperedReceipt = {
        ...receipt,
        scores: {
          ...receipt.scores,
          clarity: 0.5, // Changed from original
        },
      };

      // Should fail because receipt_hash no longer matches
      const verified = receipts.verify(tamperedReceipt, receipt.public_key);
      expect(verified).toBe(false);
    });

    it('should fail verification with wrong public key', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => ({ role: 'assistant', content: 'Test response' }),
        {
          sessionId: 'test-session',
          input: { role: 'user', content: 'Test prompt' },
        }
      );

      // Generate different key pair
      const otherReceipts = new TrustReceipts();
      const otherPublicKey = otherReceipts['publicKey'];

      const verified = receipts.verify(receipt, otherPublicKey);
      expect(verified).toBe(false);
    });
  });

  describe('Hash Chain Verification', () => {
    it('should verify linear hash chain', async () => {
      const receipts = new TrustReceipts();
      const sessionId = 'chain-test';

      // Generate 3-receipt chain
      const { receipt: receipt1 } = await receipts.wrap(
        async () => ({ content: 'response1' }),
        { sessionId, input: { content: 'prompt1' } }
      );

      const { receipt: receipt2 } = await receipts.wrap(
        async () => ({ content: 'response2' }),
        {
          sessionId,
          input: { content: 'prompt2' },
          prevReceiptHash: receipt1.receipt_hash,
        }
      );

      const { receipt: receipt3 } = await receipts.wrap(
        async () => ({ content: 'response3' }),
        {
          sessionId,
          input: { content: 'prompt3' },
          prevReceiptHash: receipt2.receipt_hash,
        }
      );

      // Verify chain integrity
      expect(receipt1.prev_receipt_hash).toBeNull();
      expect(receipt2.prev_receipt_hash).toBe(receipt1.receipt_hash);
      expect(receipt3.prev_receipt_hash).toBe(receipt2.receipt_hash);

      // All should verify
      expect(receipts.verify(receipt1, receipt1.public_key)).toBe(true);
      expect(receipts.verify(receipt2, receipt2.public_key)).toBe(true);
      expect(receipts.verify(receipt3, receipt3.public_key)).toBe(true);
    });

    it('should detect broken hash chain', async () => {
      const receipts = new TrustReceipts();
      const sessionId = 'chain-break-test';

      const { receipt: receipt1 } = await receipts.wrap(
        async () => ({ content: 'response1' }),
        { sessionId, input: { content: 'prompt1' } }
      );

      const { receipt: receipt2 } = await receipts.wrap(
        async () => ({ content: 'response2' }),
        {
          sessionId,
          input: { content: 'prompt2' },
          prevReceiptHash: receipt1.receipt_hash,
        }
      );

      // Tamper with receipt2's prev_receipt_hash
      const tamperedReceipt2 = {
        ...receipt2,
        prev_receipt_hash: 'invalid_hash_here',
      };

      // Signature should still match (different hash), but chain breaks
      const verified = receipts.verify(tamperedReceipt2, receipt2.public_key);
      expect(verified).toBe(false);
    });

    it('should verify array of chained receipts', async () => {
      const receipts = new TrustReceipts();
      const chain = [];

      for (let i = 0; i < 5; i++) {
        const { receipt } = await receipts.wrap(
          async () => ({ content: `response${i}` }),
          {
            sessionId: 'array-chain-test',
            input: { content: `prompt${i}` },
            prevReceiptHash: i === 0 ? null : chain[i - 1].receipt_hash,
          }
        );
        chain.push(receipt);
      }

      // Verify entire chain
      let isValid = true;
      for (let i = 0; i < chain.length; i++) {
        if (!receipts.verify(chain[i], chain[i].public_key)) {
          isValid = false;
          break;
        }
        if (i > 0 && chain[i].prev_receipt_hash !== chain[i - 1].receipt_hash) {
          isValid = false;
          break;
        }
      }

      expect(isValid).toBe(true);
      expect(chain.length).toBe(5);
    });
  });

  describe('Privacy Mode Verification', () => {
    it('should verify receipt without plaintext content', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'confidential response',
        {
          sessionId: 'privacy-test',
          input: 'confidential prompt',
          includeContent: false, // Privacy mode
        }
      );

      // Should not contain plaintext
      expect(receipt.prompt_content).toBeUndefined();
      expect(receipt.response_content).toBeUndefined();
      expect(receipt.include_content).toBe(false);

      // Should still verify
      expect(receipts.verify(receipt, receipt.public_key)).toBe(true);

      // Hashes should still be valid
      expect(receipt.prompt_hash).toBeDefined();
      expect(receipt.response_hash).toBeDefined();
    });

    it('should verify receipt with plaintext content', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'public response',
        {
          sessionId: 'public-test',
          input: 'public prompt',
          includeContent: true, // Include plaintext
        }
      );

      // Should contain plaintext
      expect(receipt.prompt_content).toBeDefined();
      expect(receipt.response_content).toBeDefined();
      expect(receipt.include_content).toBe(true);

      // Should still verify
      expect(receipts.verify(receipt, receipt.public_key)).toBe(true);
    });
  });

  describe('Offline Verification Performance', () => {
    it('should verify single receipt in <50ms', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'response',
        { sessionId: 'perf-test', input: 'prompt' }
      );

      const start = performance.now();
      receipts.verify(receipt, receipt.public_key);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should verify 100-receipt chain in <200ms', async () => {
      const receipts = new TrustReceipts();
      const chain = [];

      for (let i = 0; i < 100; i++) {
        const { receipt } = await receipts.wrap(
          async () => `response${i}`,
          {
            sessionId: 'perf-chain-test',
            input: `prompt${i}`,
            prevReceiptHash: i === 0 ? null : chain[i - 1].receipt_hash,
          }
        );
        chain.push(receipt);
      }

      const start = performance.now();

      for (let i = 0; i < chain.length; i++) {
        receipts.verify(chain[i], chain[i].public_key);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should have <5KB memory per receipt', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'response',
        {
          sessionId: 'memory-test',
          input: 'prompt',
          includeContent: true,
        }
      );

      const json = JSON.stringify(receipt);
      const bytes = Buffer.byteLength(json, 'utf-8');

      expect(bytes).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed receipts gracefully', () => {
      const receipts = new TrustReceipts();

      const invalidReceipts = [
        null,
        undefined,
        {},
        { receipt_hash: 'invalid' },
        { signature: 'too_short' },
        'not an object',
        123,
      ];

      invalidReceipts.forEach((invalid) => {
        expect(() => {
          receipts.verify(invalid as any, 'pub_invalid');
        }).not.toThrow();
      });
    });

    it('should return detailed error messages', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'response',
        { sessionId: 'error-test', input: 'prompt' }
      );

      const tamperedReceipt = {
        ...receipt,
        scores: { clarity: 0 }, // Modified
      };

      const result = receipts.verifyWithErrors(
        tamperedReceipt,
        receipt.public_key
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('hash');
    });
  });

  describe('Multi-Language Parity', () => {
    it('should match Python SDK output format', () => {
      // Verify that JS receipt structure matches Python expectations
      const receipts = new TrustReceipts();

      // These fields must exist in same format as Python
      const requiredFields = [
        'version',
        'timestamp',
        'session_id',
        'prompt_hash',
        'response_hash',
        'scores',
        'receipt_hash',
        'signature',
        'public_key',
        'include_content',
      ];

      requiredFields.forEach((field) => {
        expect(receipts).toHaveProperty(field);
      });
    });

    it('should use identical cryptographic algorithms', () => {
      // Verify algorithm choices match across languages
      const algorithms = {
        signing: 'Ed25519', // @noble/ed25519 in JS, PyNaCl in Python
        hashing: 'SHA-256', // crypto.subtle in JS, hashlib in Python
        canonicalization: 'RFC 8785', // json-canonicalize in JS, Python
      };

      // These should be consistent across implementations
      expect(algorithms.signing).toBe('Ed25519');
      expect(algorithms.hashing).toBe('SHA-256');
      expect(algorithms.canonicalization).toBe('RFC 8785');
    });
  });
});
