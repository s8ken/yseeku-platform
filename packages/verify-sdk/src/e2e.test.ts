/**
 * End-to-End Crypto Test
 *
 * Exercises the full generate → sign → verify pipeline using the exact same
 * logic as receipt-generator.ts, then verifies through the SDK's verify().
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as ed from '@noble/ed25519';
import { createHash } from 'crypto';
import { verify, canonicalize, type TrustReceipt } from './index';

// Configure sha512
beforeAll(async () => {
  const nodeCrypto = await import('crypto');
  if (ed.etc) {
    ed.etc.sha512Sync = (...m: Uint8Array[]) =>
      new Uint8Array(nodeCrypto.createHash('sha512').update(m[0]).digest());
  }
});

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Mirrors the exact receipt-generator.ts createReceipt() pipeline
 */
async function generateReceipt(
  privateKey: Uint8Array,
  previousHash: string,
  chainLength: number,
  interaction: { prompt: string; response: string; model: string }
): Promise<TrustReceipt> {
  // Step 1: Build base receipt (no id, no signature, chain_hash='')
  const receiptBase: any = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    session_id: `e2e-session-${Date.now()}`,
    agent_did: 'did:web:yseeku.com:agents:e2e-agent',
    human_did: 'did:web:yseeku.com:users:e2e-user',
    policy_version: '1.0.0',
    mode: 'constitutional',
    interaction,
    telemetry: {
      resonance_score: 0.92,
      coherence_score: 0.88,
      ciq_metrics: { clarity: 0.85, integrity: 0.9, quality: 0.87 },
    },
    chain: {
      previous_hash: previousHash,
      chain_hash: '',
      chain_length: chainLength + 1,
    },
  };

  // Step 2: Generate receipt ID = SHA-256(canonicalize(base)) with chain_hash=''
  const id = sha256(canonicalize(receiptBase));

  // Step 3: Add ID
  const receiptWithId: any = { ...receiptBase, id };

  // Step 4: Compute chain hash BEFORE signing (with chain_hash='')
  const receiptForChain = { ...receiptWithId, chain: { ...receiptWithId.chain, chain_hash: '' } };
  const contentForChain = canonicalize(receiptForChain);
  const chainContent = contentForChain + previousHash;
  const chainHash = sha256(chainContent);

  // Step 5: Set chain_hash, then canonicalize for signing
  const receiptForSigning: any = {
    ...receiptWithId,
    chain: { ...receiptWithId.chain, chain_hash: chainHash },
  };
  const canonical = canonicalize(receiptForSigning);

  // Step 6: Sign (over content WITH chain_hash, without signature)
  const messageBytes = new TextEncoder().encode(canonical);
  const sig = await ed.signAsync(messageBytes, privateKey);

  // Step 7: Build final receipt
  return {
    ...receiptForSigning,
    signature: {
      algorithm: 'Ed25519',
      value: bytesToHex(sig),
      key_version: 'v1',
      timestamp_signed: new Date().toISOString(),
    },
  } as TrustReceipt;
}

describe('E2E: Generate → Verify Pipeline', () => {
  let privateKey: Uint8Array;
  let publicKeyHex: string;

  beforeAll(async () => {
    privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    publicKeyHex = bytesToHex(publicKey);
  });

  it('generates a receipt that passes all 4 verification checks', async () => {
    const receipt = await generateReceipt(privateKey, 'GENESIS', 0, {
      prompt: 'Explain quantum computing',
      response: 'Quantum computing uses qubits to perform parallel computations.',
      model: 'test-model',
    });

    const result = await verify(receipt, publicKeyHex);

    expect(result.checks.structure.passed).toBe(true);
    expect(result.checks.signature.passed).toBe(true);
    expect(result.checks.chain.passed).toBe(true);
    expect(result.checks.timestamp.passed).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.trustScore).toBeGreaterThan(0);
  });

  it('detects tampering after signing', async () => {
    const receipt = await generateReceipt(privateKey, 'GENESIS', 0, {
      prompt: 'What is AI safety?',
      response: 'AI safety is the discipline of ensuring AI systems behave as intended.',
      model: 'test-model',
    });

    // Tamper with the response after signing
    receipt.interaction.response = 'INJECTED MALICIOUS CONTENT';

    const result = await verify(receipt, publicKeyHex);

    expect(result.checks.signature.passed).toBe(false);
    expect(result.valid).toBe(false);
  });

  it('verifies a chain of 3 receipts with correct chain integrity', async () => {
    const receipt1 = await generateReceipt(privateKey, 'GENESIS', 0, {
      prompt: 'Hello', response: 'Hi there!', model: 'test',
    });
    const result1 = await verify(receipt1, publicKeyHex);
    expect(result1.valid).toBe(true);

    const receipt2 = await generateReceipt(
      privateKey, receipt1.chain.chain_hash, 1,
      { prompt: 'How are you?', response: 'I am doing well.', model: 'test' }
    );
    const result2 = await verify(receipt2, publicKeyHex);
    expect(result2.valid).toBe(true);

    const receipt3 = await generateReceipt(
      privateKey, receipt2.chain.chain_hash, 2,
      { prompt: 'Goodbye', response: 'Take care!', model: 'test' }
    );
    const result3 = await verify(receipt3, publicKeyHex);
    expect(result3.valid).toBe(true);

    // Verify chain linkage
    expect(receipt2.chain.previous_hash).toBe(receipt1.chain.chain_hash);
    expect(receipt3.chain.previous_hash).toBe(receipt2.chain.chain_hash);
  });
});
