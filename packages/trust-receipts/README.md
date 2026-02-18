# @sonate/trust-receipts

[![npm version](https://img.shields.io/npm/v/@sonate/trust-receipts.svg)](https://www.npmjs.com/package/@sonate/trust-receipts)
[![tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/s8ken/yseeku-platform)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**SSL/TLS for AI — cryptographically sign and verify every interaction.**

## The Problem

AI systems generate outputs that need to be auditable. Who said what? When? Was the response tampered with? Current logging is trust-based and easily manipulated.

## The Solution

Trust Receipts work like SSL certificates for AI interactions:

- **Authentication**: Ed25519 signatures prove who generated the receipt
- **Integrity**: SHA-256 hashes of prompt and response detect tampering
- **Non-repudiation**: Hash chains create immutable audit trails

## Install

```bash
npm install @sonate/trust-receipts
```

## Quick Start

```typescript
import { TrustReceipts } from '@sonate/trust-receipts';
import OpenAI from 'openai';

const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
});

const openai = new OpenAI();
const messages = [{ role: 'user', content: 'Explain quantum computing.' }];

const { response, receipt } = await receipts.wrap(
  () => openai.chat.completions.create({ model: 'gpt-4', messages }),
  { sessionId: 'user-123', input: messages }
);

console.log(response.choices[0].message.content);
console.log('Receipt:', receipt.receiptHash);
```

## What Gets Hashed?

Before signing, the SDK canonicalizes and hashes this payload using [RFC 8785 JSON Canonicalization](https://datatracker.ietf.org/doc/html/rfc8785):

```json
{
  "version": "1.0",
  "timestamp": "2026-02-18T01:29:00.000Z",
  "sessionId": "user-123",
  "agentId": "gpt-4",
  "promptHash": "sha256:a1b2c3...",
  "responseHash": "sha256:d4e5f6...",
  "scores": { "clarity": 0.92, "accuracy": 0.88 },
  "prevReceiptHash": "sha256:789abc...",
  "metadata": {}
}
```

The `promptHash` and `responseHash` are SHA-256 hashes of the canonicalized prompt/response content. The entire payload is then hashed to produce `receiptHash`, which is signed with Ed25519.

## Receipt Structure

```typescript
interface SignedReceipt {
  version: string;           // Schema version ("1.0")
  timestamp: string;         // ISO 8601 UTC timestamp
  sessionId: string;         // Your session identifier
  agentId: string | null;    // AI model/agent identifier
  promptHash: string;        // SHA-256 of canonicalized input
  responseHash: string;      // SHA-256 of AI response content
  scores: Record<string, number>;  // User-defined attestation scores (0-1)
  prevReceiptHash: string | null;  // Hash chain to previous receipt
  receiptHash: string;       // SHA-256 of this receipt's payload
  signature: string;         // Ed25519 signature (hex)
  metadata: object;          // Custom metadata
}
```

## Key Generation

```typescript
// Generate a new key pair
const { privateKey, publicKey } = await TrustReceipts.generateKeyPair();

console.log('Private Key:', privateKey); // Store securely!
console.log('Public Key:', publicKey);   // Share for verification
```

## Hash Chaining

Link receipts for an immutable audit trail:

```typescript
const { receipt: r1 } = await receipts.wrap(call1, { sessionId: 's1', input: q1 });
const { receipt: r2 } = await receipts.wrap(call2, {
  sessionId: 's1',
  input: q2,
  previousReceipt: r1  // Chain to previous
});

// r2.prevReceiptHash === r1.receiptHash
```

## Verification

```typescript
// Verify single receipt
const valid = await receipts.verifyReceipt(receipt, publicKey);

// Verify entire chain
const result = await receipts.verifyChain([r1, r2, r3], publicKey);
console.log(result.valid);   // true if all signatures and chains valid
console.log(result.errors);  // Array of any errors found
```

## Bitcoin Anchoring (OpenTimestamps)

For stronger timestamp guarantees, anchor receipt hashes to Bitcoin:

```typescript
import { TrustReceipts, anchor, upgradeAnchor } from '@sonate/trust-receipts';

const { receipt } = await receipts.wrap(aiCall, { sessionId: 's1', input });

// Submit to OpenTimestamps calendar servers
const proof = await anchor(receipt.receiptHash);
console.log('Anchored to calendars:', proof.calendars);
console.log('Status:', proof.status); // 'pending' initially

// Store the proof with your receipt
await saveToDatabase({ receipt, anchorProof: proof });

// Later (after ~1-2 hours), upgrade to get Bitcoin confirmation
const upgraded = await upgradeAnchor(proof);
if (upgraded.status === 'confirmed') {
  console.log('Confirmed in Bitcoin block:', upgraded.bitcoinBlock);
}
```

**How it works:**
1. Your `receiptHash` is submitted to OpenTimestamps calendar servers
2. Calendars aggregate hashes into a Merkle tree
3. The Merkle root is committed to Bitcoin (~hourly)
4. Your proof can be independently verified against the blockchain

**Chain anchoring:** Since receipts are hash-chained, anchoring the final receipt transitively anchors the entire conversation:

```typescript
import { anchorChain } from '@sonate/trust-receipts';

// Anchor entire conversation with one proof
const chainProof = await anchorChain([r1.receiptHash, r2.receiptHash, r3.receiptHash]);
```

## Scores & Attestation

Scores are **user-defined attestation values** — the SDK does not compute them. You define your own rubric and the SDK cryptographically signs whatever scores you provide.

Each score is a float between 0 and 1 keyed by a name you choose:

```typescript
const { receipt } = await receipts.wrap(aiCall, {
  sessionId: 'session-1',
  input: messages,
  scores: {
    clarity: 0.95,      // Your clarity rubric
    accuracy: 0.88,     // Your accuracy rubric
    safety: 0.99,       // Your safety rubric
    compliance: 0.92,   // Your compliance rubric
  },
});
```

Common score patterns:
- **Quality**: `{ clarity, coherence, relevance }` — language quality metrics
- **Safety**: `{ safety, toxicity, bias }` — content safety metrics
- **Compliance**: `{ pii_check, policy_adherence, audit_score }` — regulatory metrics

For computed scores, provide a `calculateScores` function:

```typescript
const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
  calculateScores: (prompt, response) => ({
    wordCount: Math.min(String(response).length / 1000, 1),
    hasCodeBlock: String(response).includes('```') ? 1 : 0,
  }),
});
```

## Streaming Support

For streaming responses, create receipts manually after accumulating the response:

```typescript
let fullResponse = '';
const stream = anthropic.messages.stream({ ... });

for await (const event of stream) {
  fullResponse += event.text;
}

const receipt = await receipts.createReceipt({
  sessionId: 'stream-session',
  prompt: messages,
  response: fullResponse,
  previousReceipt: lastReceipt,
  scores: { completeness: 0.95 },
});
```

## Privacy

By default, only SHA-256 hashes of prompt and response are included in receipts. The original content is never stored unless you explicitly opt in.

**Hash-only (default):** Proves integrity without exposing sensitive data. Third parties can verify that content hasn't been tampered with by comparing hashes, but cannot reconstruct the original content.

**Full content (opt-in):** Set `includeContent: true` for use cases like internal audit logs where you need the complete interaction record:

```typescript
// Default: hashes only (privacy-preserving)
const { receipt } = await receipts.wrap(aiCall, {
  sessionId: 's1',
  input: messages,
});
// receipt.promptHash = "a1b2c3..."
// receipt.promptContent = undefined

// Opt-in: include full content
const { receipt: fullReceipt } = await receipts.wrap(aiCall, {
  sessionId: 's1',
  input: messages,
  includeContent: true,
});
// fullReceipt.promptHash = "a1b2c3..."
// fullReceipt.promptContent = [{ role: "user", content: "..." }]
// fullReceipt.responseContent = "The AI response text..."
```

## Anthropic Example

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { TrustReceipts } from '@sonate/trust-receipts';

const anthropic = new Anthropic();
const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
  defaultAgentId: 'claude-3-sonnet',
});

const messages = [{ role: 'user', content: 'Explain trust receipts.' }];

const { response, receipt } = await receipts.wrap(
  () => anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages,
  }),
  { sessionId: 'claude-session', input: messages }
);
```

## Cryptographic Details

| Component | Specification |
|-----------|--------------|
| Signing | Ed25519 (RFC 8032) |
| Hashing | SHA-256 |
| Canonicalization | JSON Canonicalization Scheme (RFC 8785) |
| Key Size | 32 bytes (256 bits) |
| Signature Size | 64 bytes (512 bits) |
| Timestamp | ISO 8601 UTC |
| Anchoring | OpenTimestamps (Bitcoin) |

## Public Key Discovery

For production deployments, publish your public key at a well-known location:

```
https://yourdomain.com/.well-known/sonate-keys.json
```

Example format:

```json
{
  "keys": [{
    "id": "default",
    "publicKey": "abc123def456...",
    "algorithm": "Ed25519",
    "created": "2026-02-18T00:00:00Z"
  }]
}
```

This allows third parties to verify your receipts without out-of-band key exchange.

## Timestamp Guarantees

Receipts include three layers of temporal proof:

| Layer | Guarantee | Trust Model |
|-------|-----------|-------------|
| `timestamp` | ISO 8601 UTC timestamp | Self-reported (system clock) |
| Hash chain | Ordering proof — receipt N+1 references receipt N | Cryptographic (SHA-256) |
| `anchor()` | Bitcoin-backed proof of existence | Decentralized (OpenTimestamps) |

**Self-reported timestamps** are sufficient for most audit trails. Hash chaining ensures ordering cannot be forged even if individual timestamps are approximate.

**For stronger non-repudiation**, use `anchor()` to submit receipt hashes to OpenTimestamps calendar servers, which commit them to Bitcoin (~hourly). This provides blockchain-backed proof that a receipt existed at a specific time:

```typescript
import { anchor } from '@sonate/trust-receipts';

const proof = await anchor(receipt.receiptHash);
// proof.status = 'pending' → 'confirmed' after Bitcoin block
```

## Known Limitations & Roadmap

### Large Payloads

**Current:** Full prompt/response content is hashed. SHA-256 is fast (~5ms for 1MB), but very large payloads may add latency.

**Mitigation:** Use `extractResponse` option to hash only relevant fields, or store content externally with `receiptHash` as reference.

```typescript
const { receipt } = await receipts.wrap(fn, {
  sessionId: 's1',
  input: messages,
  extractResponse: (r) => r.choices[0].message.content, // Hash only the text
});
```

### Key Management

**Current:** Keys are provided by the caller. No built-in key rotation or HSM support.

**Roadmap:** Key rotation helpers, HSM/KMS integration guides.

## Use Cases

- **Compliance**: Audit trails for regulated industries (healthcare, finance)
- **Debugging**: Trace issues through conversation history
- **Analytics**: Track quality metrics over time
- **Security**: Detect prompt injection or response tampering
- **Accountability**: Prove what was said and when

## Related Packages

- **`@sonate/verify-sdk`** — For verifying SONATE platform receipts (server-side verification of receipts generated by the SONATE backend)
- **`@sonate/trust-receipts`** (this package) — For generating receipts in your own applications

## License

MIT
