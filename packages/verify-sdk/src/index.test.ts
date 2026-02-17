/**
 * Comprehensive tests for @sonate/verify-sdk
 *
 * Uses real Ed25519 keys via @noble/ed25519 - no mocks.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as ed from '@noble/ed25519';
import { createHash } from 'crypto';
import { verify, quickVerify, verifyBatch, canonicalize, type TrustReceipt } from './index';

// Configure sha512 for @noble/ed25519 in Node.js
beforeAll(async () => {
  const nodeCrypto = await import('crypto');
  if (ed.etc) {
    ed.etc.sha512Sync = (...m: Uint8Array[]) =>
      new Uint8Array(nodeCrypto.createHash('sha512').update(m[0]).digest());
  }
});

// ---- Helpers ----

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Build a properly signed V2 receipt using the exact same pipeline
 * as receipt-generator.ts (with fixed canonicalization).
 */
async function buildSignedReceipt(
  privateKey: Uint8Array,
  overrides: Partial<TrustReceipt> = {},
  previousHash = 'GENESIS'
): Promise<TrustReceipt> {
  const base: any = {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    session_id: `test-${Date.now()}`,
    agent_did: 'did:web:yseeku.com:agents:test',
    human_did: 'did:web:yseeku.com:users:test',
    policy_version: '1.0.0',
    mode: 'constitutional',
    interaction: {
      prompt: 'What is trust?',
      response: 'Trust is the foundation of reliable AI systems.',
      model: 'test-model',
    },
    telemetry: {
      resonance_score: 0.9,
      ciq_metrics: { clarity: 0.8, integrity: 0.85, quality: 0.9 },
    },
    chain: {
      previous_hash: previousHash,
      chain_hash: '', // computed below
      chain_length: 1,
    },
    ...overrides,
  };

  // Ensure chain uses provided previousHash
  if (!overrides.chain) {
    base.chain.previous_hash = previousHash;
  }

  // 1. Compute receipt ID (hash of base with chain_hash='')
  const contentForId = canonicalize(base);
  base.id = sha256(contentForId);

  // 2. Compute chain hash: canonicalize(receipt without sig, with chain_hash='') + previous_hash
  const receiptForChain = { ...base };
  receiptForChain.chain = { ...base.chain, chain_hash: '' };
  const contentForChain = canonicalize(receiptForChain);
  const chainContent = contentForChain + base.chain.previous_hash;
  base.chain.chain_hash = sha256(chainContent);

  // 3. Sign: canonicalize(receipt without signature, WITH chain_hash)
  const canonicalForSign = canonicalize(base);
  const messageBytes = new TextEncoder().encode(canonicalForSign);
  const sig = await ed.signAsync(messageBytes, privateKey);

  base.signature = {
    algorithm: 'Ed25519',
    value: bytesToHex(sig),
    key_version: 'v1',
    timestamp_signed: new Date().toISOString(),
  };

  return base as TrustReceipt;
}

// ---- Test Suites ----

let privateKey: Uint8Array;
let publicKey: Uint8Array;
let publicKeyHex: string;

beforeAll(async () => {
  privateKey = ed.utils.randomPrivateKey();
  publicKey = await ed.getPublicKeyAsync(privateKey);
  publicKeyHex = bytesToHex(publicKey);
});

describe('Structure Checks', () => {
  it('valid V2 receipt passes structure check', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.structure.passed).toBe(true);
  });

  it('receipt missing id and signature fails structure check', async () => {
    const receipt = { version: '2.0.0' } as any;
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.structure.passed).toBe(false);
    expect(result.valid).toBe(false);
  });

  it('empty object fails structure check', async () => {
    const result = await verify({} as any, publicKeyHex);
    expect(result.checks.structure.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Signature Checks', () => {
  it('valid signature passes', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.signature.passed).toBe(true);
  });

  it('tampered content fails signature check', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    receipt.interaction.response = 'TAMPERED RESPONSE';
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.signature.passed).toBe(false);
  });

  it('wrong public key fails signature check', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    const wrongKey = ed.utils.randomPrivateKey();
    const wrongPubKey = await ed.getPublicKeyAsync(wrongKey);
    const result = await verify(receipt, bytesToHex(wrongPubKey));
    expect(result.checks.signature.passed).toBe(false);
  });

  it('missing signature fails', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    (receipt as any).signature = undefined;
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.signature.passed).toBe(false);
  });
});

describe('Chain Checks', () => {
  it('GENESIS chain passes', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.chain.passed).toBe(true);
  });

  it('valid chained receipt passes', async () => {
    const receipt1 = await buildSignedReceipt(privateKey);
    const receipt2 = await buildSignedReceipt(privateKey, {}, receipt1.chain.chain_hash);
    const result = await verify(receipt2, publicKeyHex);
    expect(result.checks.chain.passed).toBe(true);
  });

  it('tampered chain hash fails', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    receipt.chain.chain_hash = 'a'.repeat(64); // bogus hash
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.chain.passed).toBe(false);
  });
});

describe('Timestamp Checks', () => {
  it('recent timestamp passes', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.timestamp.passed).toBe(true);
  });

  it('far-future timestamp fails', async () => {
    const futureDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const receipt = await buildSignedReceipt(privateKey, { timestamp: futureDate } as any);
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.timestamp.passed).toBe(false);
  });

  it('very old timestamp fails', async () => {
    const oldDate = new Date('2020-01-01T00:00:00Z').toISOString();
    const receipt = await buildSignedReceipt(privateKey, { timestamp: oldDate } as any);
    const result = await verify(receipt, publicKeyHex);
    expect(result.checks.timestamp.passed).toBe(false);
  });
});

describe('quickVerify and verifyBatch', () => {
  it('quickVerify returns boolean', async () => {
    const receipt = await buildSignedReceipt(privateKey);
    const result = await quickVerify(receipt, publicKeyHex);
    expect(typeof result).toBe('boolean');
    expect(result).toBe(true);
  });

  it('verifyBatch counts valid and invalid', async () => {
    const good = await buildSignedReceipt(privateKey);
    const bad = await buildSignedReceipt(privateKey);
    bad.interaction.response = 'TAMPERED';

    const batch = await verifyBatch([good, bad], publicKeyHex);
    expect(batch.total).toBe(2);
    expect(batch.valid).toBe(1);
    expect(batch.invalid).toBe(1);
  });
});
