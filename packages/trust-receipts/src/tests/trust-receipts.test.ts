/**
 * Trust Receipts SDK Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { TrustReceipts, TrustReceipt, generateKeyPair, bytesToHex, hexToBytes } from '../index';

describe('TrustReceipts SDK', () => {
  test('generateKeyPair creates valid keys', async () => {
    const { privateKey, publicKey } = await generateKeyPair();

    assert.strictEqual(privateKey.length, 32, 'Private key should be 32 bytes');
    assert.strictEqual(publicKey.length, 32, 'Public key should be 32 bytes');
  });

  test('TrustReceipts.generateKeyPair returns hex strings', async () => {
    const { privateKey, publicKey } = await TrustReceipts.generateKeyPair();

    assert.strictEqual(privateKey.length, 64, 'Private key hex should be 64 chars');
    assert.strictEqual(publicKey.length, 64, 'Public key hex should be 64 chars');
    assert.match(privateKey, /^[0-9a-f]+$/, 'Should be valid hex');
    assert.match(publicKey, /^[0-9a-f]+$/, 'Should be valid hex');
  });

  test('TrustReceipt can be created and signed', async () => {
    const { privateKey, publicKey } = await generateKeyPair();

    const receipt = new TrustReceipt({
      sessionId: 'test-session',
      mode: 'standard',
      metrics: { clarity: 0.9, integrity: 0.95, quality: 0.85 },
    });

    assert.ok(receipt.selfHash, 'Should have selfHash');
    assert.strictEqual(receipt.isSigned, false, 'Should not be signed yet');

    await receipt.sign(privateKey);

    assert.strictEqual(receipt.isSigned, true, 'Should be signed');
    assert.ok(receipt.signature.length > 0, 'Should have signature');

    const valid = await receipt.verify(publicKey);
    assert.strictEqual(valid, true, 'Signature should be valid');
  });

  test('TrustReceipt chain verification works', async () => {
    const { privateKey, publicKey } = await generateKeyPair();

    const receipt1 = new TrustReceipt({
      sessionId: 'chain-test',
      mode: 'standard',
      metrics: { clarity: 0.8, integrity: 0.9, quality: 0.85 },
    });
    await receipt1.sign(privateKey);

    const receipt2 = new TrustReceipt({
      sessionId: 'chain-test',
      mode: 'standard',
      metrics: { clarity: 0.85, integrity: 0.92, quality: 0.88 },
      previousHash: receipt1.selfHash,
    });
    await receipt2.sign(privateKey);

    assert.strictEqual(receipt2.verifyChain(receipt1), true, 'Chain should be valid');
    assert.strictEqual(receipt2.previousHash, receipt1.selfHash, 'previousHash should match');
  });

  test('TrustReceipts.wrap creates signed receipt', async () => {
    const { privateKey, publicKey } = await TrustReceipts.generateKeyPair();

    const receipts = new TrustReceipts({ privateKey });

    // Mock AI call
    const mockAiCall = async () => ({ content: 'Hello, world!' });

    const { response, receipt } = await receipts.wrap(mockAiCall, {
      sessionId: 'wrap-test',
      metrics: { clarity: 0.9, integrity: 0.95, quality: 0.9 },
    });

    assert.deepStrictEqual(response, { content: 'Hello, world!' });
    assert.ok(receipt.selfHash);
    assert.ok(receipt.signature);
    assert.strictEqual(receipt.sessionId, 'wrap-test');

    const valid = await receipts.verifyReceipt(receipt);
    assert.strictEqual(valid, true, 'Receipt should be valid');
  });

  test('TrustReceipts.verifyChain validates chain integrity', async () => {
    const { privateKey } = await TrustReceipts.generateKeyPair();

    const receipts = new TrustReceipts({ privateKey });

    const mockCall = async () => ({ ok: true });

    const { receipt: r1 } = await receipts.wrap(mockCall, { sessionId: 's1' });
    const { receipt: r2 } = await receipts.wrap(mockCall, {
      sessionId: 's1',
      previousReceipt: r1,
    });
    const { receipt: r3 } = await receipts.wrap(mockCall, {
      sessionId: 's1',
      previousReceipt: r2,
    });

    const result = await receipts.verifyChain([r1, r2, r3]);
    assert.strictEqual(result.valid, true, 'Chain should be valid');
    assert.strictEqual(result.errors.length, 0, 'Should have no errors');
  });

  test('TrustReceipt.toJSON and fromJSON roundtrip', async () => {
    const { privateKey, publicKey } = await generateKeyPair();

    const original = new TrustReceipt({
      sessionId: 'roundtrip-test',
      mode: 'constitutional',
      metrics: { clarity: 0.75, integrity: 0.88, quality: 0.82 },
      metadata: { custom: 'data' },
    });
    await original.sign(privateKey);

    const json = original.toJSON();
    const restored = TrustReceipt.fromJSON(json);

    assert.strictEqual(restored.sessionId, original.sessionId);
    assert.strictEqual(restored.selfHash, original.selfHash);
    assert.strictEqual(restored.signature, original.signature);
    assert.strictEqual(restored.mode, original.mode);

    const valid = await restored.verify(publicKey);
    assert.strictEqual(valid, true, 'Restored receipt should verify');
  });

  test('bytesToHex and hexToBytes roundtrip', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255]);
    const hex = bytesToHex(original);
    const restored = hexToBytes(hex);

    assert.deepStrictEqual(restored, original);
  });

  test('Invalid signature fails verification', async () => {
    const { privateKey: key1 } = await generateKeyPair();
    const { publicKey: key2 } = await generateKeyPair();

    const receipt = new TrustReceipt({
      sessionId: 'invalid-sig-test',
      mode: 'standard',
      metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 },
    });
    await receipt.sign(key1);

    // Verify with wrong key
    const valid = await receipt.verify(key2);
    assert.strictEqual(valid, false, 'Wrong key should fail verification');
  });
});

console.log('Running Trust Receipts SDK tests...');
