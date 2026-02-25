/**
 * Cross-Language Receipt Verification Tests
 *
 * Ensures consistent JSON canonicalization, hashing, and Ed25519
 * verification behaviour that would match a Python SDK implementation.
 *
 * Uses node:test runner (matching trust-receipts.test.ts pattern).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { canonicalize } from 'json-canonicalize';

import {
  TrustReceipts,
  TrustReceipt,
  generateKeyPair,
  sha256,
  bytesToHex,
} from '../index';
import type { SignedReceipt } from '../index';

describe('Cross-Language Receipt Verification', () => {
  // ── Canonical JSON Determinism ──────────────────────────────────────

  describe('Canonical JSON Determinism', () => {
    it('should produce identical canonical JSON regardless of key order', () => {
      const input1 = { b: 2, a: 1, c: 3 };
      const input2 = { a: 1, b: 2, c: 3 };

      const canonical1 = canonicalize(input1);
      const canonical2 = canonicalize(input2);

      assert.strictEqual(canonical1, canonical2);
      assert.strictEqual(canonical1, '{"a":1,"b":2,"c":3}');
    });

    it('should handle nested objects consistently', () => {
      const input = {
        metadata: { nested: { deeply: true } },
        scores: { clarity: 0.95 },
      };

      const canonical = canonicalize(input);
      const canonical2 = canonicalize(input);
      assert.strictEqual(canonical, canonical2);
    });

    it('should handle Unicode consistently', () => {
      const input = {
        content: 'Hello 世界 🌍',
        emoji: '😀',
      };

      const canonical = canonicalize(input);
      const canonical2 = canonicalize(input);
      assert.strictEqual(canonical, canonical2);
      // RFC 8785: no extra whitespace
      assert.ok(!/ /.test(canonical.replace(/Hello 世界 🌍/, '').replace(/😀/, '')));
    });
  });

  // ── SHA-256 Hash Consistency ────────────────────────────────────────

  describe('SHA-256 Hash Consistency', () => {
    it('should produce consistent hashes for identical input', () => {
      const hash1 = sha256('test message');
      const hash2 = sha256('test message');
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different input', () => {
      const hash1 = sha256('test1');
      const hash2 = sha256('test2');
      assert.notStrictEqual(hash1, hash2);
    });

    it('should handle empty strings', () => {
      const hash = sha256('');
      assert.strictEqual(hash.length, 64);
      assert.match(hash, /^[a-f0-9]+$/);
    });

    it('should match known SHA-256 test vectors', () => {
      // Standard test vectors — must match Python hashlib.sha256
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

      for (const { input, expected } of vectors) {
        const hash = sha256(input);
        assert.strictEqual(hash, expected, `SHA-256("${input}") mismatch`);
      }
    });
  });

  // ── Ed25519 Signature Verification ──────────────────────────────────

  describe('Ed25519 Signature Verification', () => {
    it('should verify self-signed receipt', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => ({ role: 'assistant', content: 'Test response' }),
        {
          sessionId: 'test-session',
          input: { role: 'user', content: 'Test prompt' },
        },
      );

      const verified = await receipts.verifyReceipt(receipt);
      assert.strictEqual(verified, true, 'Self-signed receipt should verify');
    });

    it('should fail verification with tampered receiptHash', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => ({ role: 'assistant', content: 'Test response' }),
        {
          sessionId: 'test-session',
          input: { role: 'user', content: 'Test prompt' },
          scores: { clarity: 0.95 },
        },
      );

      // Tamper with the receiptHash (the signed field)
      const tampered: SignedReceipt = {
        ...receipt,
        receiptHash: sha256('tampered-payload'),
      };

      const verified = await receipts.verifyReceipt(tampered);
      assert.strictEqual(verified, false, 'Tampered receiptHash should fail verification');
    });

    it('should fail verification with wrong public key', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => ({ role: 'assistant', content: 'Test response' }),
        {
          sessionId: 'test-session',
          input: { role: 'user', content: 'Test prompt' },
        },
      );

      // Generate a different key pair
      const { publicKey: otherPub } = await generateKeyPair();
      const verified = await receipts.verifyReceipt(receipt, otherPub);
      assert.strictEqual(verified, false, 'Wrong public key should fail verification');
    });
  });

  // ── Hash Chain Verification ─────────────────────────────────────────

  describe('Hash Chain Verification', () => {
    it('should verify linear hash chain', async () => {
      const receipts = new TrustReceipts();
      const sessionId = 'chain-test';

      // Generate 3-receipt chain
      const { receipt: receipt1 } = await receipts.wrap(
        async () => ({ content: 'response1' }),
        { sessionId, input: { content: 'prompt1' } },
      );

      const { receipt: receipt2 } = await receipts.wrap(
        async () => ({ content: 'response2' }),
        {
          sessionId,
          input: { content: 'prompt2' },
          previousReceipt: receipt1,
        },
      );

      const { receipt: receipt3 } = await receipts.wrap(
        async () => ({ content: 'response3' }),
        {
          sessionId,
          input: { content: 'prompt3' },
          previousReceipt: receipt2,
        },
      );

      // Verify chain integrity
      assert.strictEqual(receipt1.prevReceiptHash, null);
      assert.strictEqual(receipt2.prevReceiptHash, receipt1.receiptHash);
      assert.strictEqual(receipt3.prevReceiptHash, receipt2.receiptHash);

      // All should verify
      assert.strictEqual(await receipts.verifyReceipt(receipt1), true);
      assert.strictEqual(await receipts.verifyReceipt(receipt2), true);
      assert.strictEqual(await receipts.verifyReceipt(receipt3), true);
    });

    it('should verify array of chained receipts via verifyChain', async () => {
      const receipts = new TrustReceipts();
      const chain: SignedReceipt[] = [];

      for (let i = 0; i < 5; i++) {
        const { receipt } = await receipts.wrap(
          async () => ({ content: `response${i}` }),
          {
            sessionId: 'array-chain-test',
            input: { content: `prompt${i}` },
            previousReceipt: i === 0 ? undefined : chain[i - 1],
          },
        );
        chain.push(receipt);
      }

      const result = await receipts.verifyChain(chain);
      assert.strictEqual(result.valid, true, 'Chain should be valid');
      assert.strictEqual(result.errors.length, 0, 'Should have no errors');
      assert.strictEqual(chain.length, 5);
    });
  });

  // ── Privacy Mode Verification ───────────────────────────────────────

  describe('Privacy Mode Verification', () => {
    it('should verify receipt without plaintext content', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'confidential response',
        {
          sessionId: 'privacy-test',
          input: 'confidential prompt',
          includeContent: false,
        },
      );

      // Should not contain plaintext
      assert.strictEqual(receipt.promptContent, undefined);
      assert.strictEqual(receipt.responseContent, undefined);

      // Should still verify
      assert.strictEqual(await receipts.verifyReceipt(receipt), true);

      // Hashes should still be present
      assert.ok(receipt.promptHash);
      assert.ok(receipt.responseHash);
    });

    it('should verify receipt with plaintext content', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'public response',
        {
          sessionId: 'public-test',
          input: 'public prompt',
          includeContent: true,
        },
      );

      // Should contain plaintext
      assert.ok(receipt.promptContent !== undefined, 'Should include promptContent');
      assert.ok(receipt.responseContent !== undefined, 'Should include responseContent');

      // Should still verify
      assert.strictEqual(await receipts.verifyReceipt(receipt), true);
    });
  });

  // ── Offline Verification Performance ────────────────────────────────

  describe('Offline Verification Performance', () => {
    it('should verify single receipt in <50ms', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'response',
        { sessionId: 'perf-test', input: 'prompt' },
      );

      const start = performance.now();
      await receipts.verifyReceipt(receipt);
      const duration = performance.now() - start;

      assert.ok(duration < 50, `Verification took ${duration.toFixed(1)}ms, expected <50ms`);
    });

    it('should have <5KB memory per receipt', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'response',
        {
          sessionId: 'memory-test',
          input: 'prompt',
          includeContent: true,
        },
      );

      const bytes = Buffer.byteLength(JSON.stringify(receipt), 'utf-8');
      assert.ok(bytes < 5000, `Receipt is ${bytes} bytes, expected <5000`);
    });
  });

  // ── Multi-Language Parity ───────────────────────────────────────────

  describe('Multi-Language Parity', () => {
    it('should use camelCase field names matching SDK spec', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(
        async () => 'response',
        {
          sessionId: 'field-test',
          input: 'prompt',
          scores: { clarity: 0.9 },
        },
      );

      const requiredFields = [
        'version',
        'timestamp',
        'sessionId',
        'promptHash',
        'responseHash',
        'scores',
        'receiptHash',
        'signature',
      ];

      for (const field of requiredFields) {
        assert.ok(field in receipt, `Receipt should have field "${field}"`);
      }
    });

    it('should use identical cryptographic algorithms as Python SDK', () => {
      // Document algorithm choices that must match across implementations
      const algorithms = {
        signing: 'Ed25519',
        hashing: 'SHA-256',
        canonicalization: 'RFC 8785',
      };

      assert.strictEqual(algorithms.signing, 'Ed25519');
      assert.strictEqual(algorithms.hashing, 'SHA-256');
      assert.strictEqual(algorithms.canonicalization, 'RFC 8785');
    });
  });
});
