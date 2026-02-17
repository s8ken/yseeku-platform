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
      prompt: 'What is 2+2?',
      response: '4',
      scores: { accuracy: 1.0, clarity: 0.95 },
    });

    assert.ok(receipt.receiptHash, 'Should have receiptHash');
    assert.ok(receipt.promptHash, 'Should have promptHash');
    assert.ok(receipt.responseHash, 'Should have responseHash');
    assert.strictEqual(receipt.isSigned, false, 'Should not be signed yet');

    await receipt.sign(privateKey);

    assert.strictEqual(receipt.isSigned, true, 'Should be signed');
    assert.ok(receipt.signature.length > 0, 'Should have signature');

    const valid = await receipt.verify(publicKey);
    assert.strictEqual(valid, true, 'Signature should be valid');
  });

  test('TrustReceipt hashes content deterministically', async () => {
    const { privateKey } = await generateKeyPair();

    const receipt1 = new TrustReceipt({
      sessionId: 'test',
      prompt: { messages: [{ role: 'user', content: 'Hello' }] },
      response: 'Hi there!',
      scores: {},
    });

    const receipt2 = new TrustReceipt({
      sessionId: 'test',
      prompt: { messages: [{ role: 'user', content: 'Hello' }] },
      response: 'Hi there!',
      scores: {},
    });

    // Same content should produce same hashes (ignoring timestamp)
    assert.strictEqual(receipt1.promptHash, receipt2.promptHash, 'Same prompt should hash same');
    assert.strictEqual(receipt1.responseHash, receipt2.responseHash, 'Same response should hash same');
  });

  test('TrustReceipt chain verification works', async () => {
    const { privateKey, publicKey } = await generateKeyPair();

    const receipt1 = new TrustReceipt({
      sessionId: 'chain-test',
      prompt: 'First question',
      response: 'First answer',
      scores: { quality: 0.9 },
    });
    await receipt1.sign(privateKey);

    const receipt2 = new TrustReceipt({
      sessionId: 'chain-test',
      prompt: 'Second question',
      response: 'Second answer',
      scores: { quality: 0.85 },
      prevReceiptHash: receipt1.receiptHash,
    });
    await receipt2.sign(privateKey);

    assert.strictEqual(receipt2.verifyChain(receipt1), true, 'Chain should be valid');
    assert.strictEqual(receipt2.prevReceiptHash, receipt1.receiptHash, 'prevReceiptHash should match');
  });

  test('TrustReceipts.wrap creates signed receipt with content hashes', async () => {
    const { privateKey } = await TrustReceipts.generateKeyPair();

    const receipts = new TrustReceipts({ privateKey });

    // Mock AI call
    const mockMessages = [{ role: 'user', content: 'Hello!' }];
    const mockAiCall = async () => ({
      choices: [{ message: { content: 'Hi there!' } }],
    });

    const { response, receipt } = await receipts.wrap(mockAiCall, {
      sessionId: 'wrap-test',
      input: mockMessages,
      agentId: 'gpt-4',
      scores: { clarity: 0.95 },
    });

    assert.deepStrictEqual(response, { choices: [{ message: { content: 'Hi there!' } }] });
    assert.ok(receipt.receiptHash);
    assert.ok(receipt.promptHash);
    assert.ok(receipt.responseHash);
    assert.ok(receipt.signature);
    assert.strictEqual(receipt.sessionId, 'wrap-test');
    assert.strictEqual(receipt.agentId, 'gpt-4');
    assert.deepStrictEqual(receipt.scores, { clarity: 0.95 });

    const valid = await receipts.verifyReceipt(receipt);
    assert.strictEqual(valid, true, 'Receipt should be valid');
  });

  test('TrustReceipts.wrap auto-extracts OpenAI response content', async () => {
    const receipts = new TrustReceipts();

    const mockResponse = {
      choices: [{ message: { content: 'Hello from OpenAI!' } }],
    };

    const { receipt } = await receipts.wrap(async () => mockResponse, {
      sessionId: 'openai-test',
      input: 'test prompt',
    });

    // The responseHash should be of the extracted text, not the full object
    // We can verify by creating a receipt with just the text
    const directReceipt = new TrustReceipt({
      sessionId: 'direct',
      prompt: 'test',
      response: 'Hello from OpenAI!',
      scores: {},
    });

    assert.strictEqual(receipt.responseHash, directReceipt.responseHash);
  });

  test('TrustReceipts.wrap auto-extracts Anthropic response content', async () => {
    const receipts = new TrustReceipts();

    const mockResponse = {
      content: [{ type: 'text', text: 'Hello from Claude!' }],
    };

    const { receipt } = await receipts.wrap(async () => mockResponse, {
      sessionId: 'anthropic-test',
      input: 'test prompt',
    });

    const directReceipt = new TrustReceipt({
      sessionId: 'direct',
      prompt: 'test',
      response: 'Hello from Claude!',
      scores: {},
    });

    assert.strictEqual(receipt.responseHash, directReceipt.responseHash);
  });

  test('TrustReceipts.verifyChain validates chain integrity', async () => {
    const { privateKey } = await TrustReceipts.generateKeyPair();

    const receipts = new TrustReceipts({ privateKey });

    const { receipt: r1 } = await receipts.wrap(async () => ({ text: 'r1' }), {
      sessionId: 's1',
      input: 'q1',
    });
    const { receipt: r2 } = await receipts.wrap(async () => ({ text: 'r2' }), {
      sessionId: 's1',
      input: 'q2',
      previousReceipt: r1,
    });
    const { receipt: r3 } = await receipts.wrap(async () => ({ text: 'r3' }), {
      sessionId: 's1',
      input: 'q3',
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
      prompt: { text: 'Hello' },
      response: { text: 'Hi' },
      scores: { quality: 0.82 },
      agentId: 'test-agent',
      metadata: { custom: 'data' },
    });
    await original.sign(privateKey);

    const json = original.toJSON();
    const restored = TrustReceipt.fromJSON(json);

    assert.strictEqual(restored.sessionId, original.sessionId);
    assert.strictEqual(restored.receiptHash, original.receiptHash);
    assert.strictEqual(restored.promptHash, original.promptHash);
    assert.strictEqual(restored.responseHash, original.responseHash);
    assert.strictEqual(restored.signature, original.signature);
    assert.strictEqual(restored.agentId, original.agentId);

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
      prompt: 'test',
      response: 'test',
      scores: {},
    });
    await receipt.sign(key1);

    // Verify with wrong key
    const valid = await receipt.verify(key2);
    assert.strictEqual(valid, false, 'Wrong key should fail verification');
  });

  test('Receipt timestamp is ISO 8601 format', async () => {
    const receipt = new TrustReceipt({
      sessionId: 'timestamp-test',
      prompt: 'test',
      response: 'test',
      scores: {},
    });

    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    assert.match(receipt.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  test('createReceipt creates manual receipts', async () => {
    const receipts = new TrustReceipts();

    const receipt = await receipts.createReceipt({
      sessionId: 'manual-test',
      prompt: 'Streaming prompt',
      response: 'Accumulated streaming response',
      agentId: 'claude-3',
      scores: { completeness: 0.9 },
    });

    assert.ok(receipt.receiptHash);
    assert.ok(receipt.promptHash);
    assert.ok(receipt.responseHash);
    assert.ok(receipt.signature);
    assert.strictEqual(receipt.agentId, 'claude-3');
  });
});

console.log('Running Trust Receipts SDK tests...');
