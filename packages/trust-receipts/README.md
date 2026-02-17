# @sonate/trust-receipts

**Trust Receipts SDK — SSL for AI**

Cryptographically signed audit trails for AI interactions. Like SSL certificates for web connections, Trust Receipts provide verifiable proof that AI interactions occurred as claimed.

## Why Trust Receipts?

When you make an HTTPS request, SSL/TLS ensures:
- **Authentication**: You're talking to the right server
- **Integrity**: The data wasn't tampered with
- **Non-repudiation**: The exchange can be verified later

Trust Receipts provide the same guarantees for AI interactions:
- **Authentication**: Signed by a known key pair
- **Integrity**: Hash-chained and tamper-evident
- **Non-repudiation**: Receipts can be verified independently

## Installation

```bash
npm install @sonate/trust-receipts
```

## Quick Start

```typescript
import { TrustReceipts } from '@sonate/trust-receipts';
import OpenAI from 'openai';

// Initialize with your signing key
const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
});

const openai = new OpenAI();

// Wrap any AI call
const { response, receipt } = await receipts.wrap(
  () => openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
  { sessionId: 'user-123' }
);

// Use the response normally
console.log(response.choices[0].message.content);

// The receipt is a signed audit record
console.log(receipt.selfHash);    // SHA-256 hash
console.log(receipt.signature);   // Ed25519 signature
console.log(receipt.timestamp);   // Unix ms
```

## Key Generation

Generate a new Ed25519 key pair:

```typescript
import { TrustReceipts } from '@sonate/trust-receipts';

const { privateKey, publicKey } = await TrustReceipts.generateKeyPair();

console.log('Private Key:', privateKey); // Store securely!
console.log('Public Key:', publicKey);   // Share for verification
```

Or via CLI:
```bash
npx @sonate/trust-receipts keygen
```

## Hash Chaining

Link receipts together for an immutable audit trail:

```typescript
const { receipt: receipt1 } = await receipts.wrap(
  () => ai.call1(),
  { sessionId: 'session-1' }
);

const { receipt: receipt2 } = await receipts.wrap(
  () => ai.call2(),
  {
    sessionId: 'session-1',
    previousReceipt: receipt1,  // Chain to previous
  }
);

// receipt2.previousHash === receipt1.selfHash
```

## Verification

Verify receipt signatures and chains:

```typescript
// Verify single receipt
const valid = await receipts.verifyReceipt(receipt, publicKey);

// Verify entire chain
const result = await receipts.verifyChain([receipt1, receipt2, receipt3]);
console.log(result.valid);   // true if all signatures and chains valid
console.log(result.errors);  // Array of any errors found
```

## Quality Metrics

Track quality metrics for each interaction:

```typescript
const { receipt } = await receipts.wrap(
  () => ai.call(),
  {
    sessionId: 'session-1',
    metrics: {
      clarity: 0.95,    // How clear was the interaction
      integrity: 0.98,  // How well were guidelines followed
      quality: 0.92,    // Overall quality score
    },
  }
);
```

Or use a custom calculator:

```typescript
const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
  calculateMetrics: (response) => ({
    clarity: analyzeClarity(response),
    integrity: checkIntegrity(response),
    quality: scoreQuality(response),
  }),
});
```

## Anthropic Example

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { TrustReceipts } from '@sonate/trust-receipts';

const anthropic = new Anthropic();
const receipts = new TrustReceipts({
  privateKey: process.env.SONATE_PRIVATE_KEY,
});

const { response, receipt } = await receipts.wrap(
  () => anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Explain trust receipts.' }],
  }),
  { sessionId: 'claude-session', mode: 'constitutional' }
);
```

## Streaming Support

For streaming responses, create receipts manually after the stream completes:

```typescript
// Stream the response
let fullResponse = '';
const stream = anthropic.messages.stream({ ... });

for await (const event of stream) {
  // Collect response...
  fullResponse += event.text;
}

// Create receipt after streaming
const receipt = await receipts.createReceipt({
  sessionId: 'stream-session',
  previousReceipt: lastReceipt,
  metrics: { clarity: 0.9, integrity: 0.95, quality: 0.88 },
  metadata: { streamedResponse: true },
});
```

## Receipt Structure

```typescript
interface SignedReceipt {
  version: string;           // Schema version ("1.0.0")
  sessionId: string;         // Your session identifier
  timestamp: number;         // Unix milliseconds
  mode: string;              // "standard" | "constitutional"
  metrics: QualityMetrics;   // { clarity, integrity, quality }
  previousHash: string|null; // Hash of previous receipt (chain)
  selfHash: string;          // SHA-256 of this receipt
  signature: string;         // Ed25519 signature (hex)
  metadata: object;          // Custom metadata
}
```

## Cryptographic Details

- **Signing Algorithm**: Ed25519 (RFC 8032)
- **Hashing**: SHA-256
- **Canonicalization**: JSON Canonicalization Scheme (RFC 8785)
- **Key Size**: 32 bytes (256 bits)
- **Signature Size**: 64 bytes

## Use Cases

- **Compliance**: Audit trails for regulated industries
- **Debugging**: Trace issues through conversation history
- **Analytics**: Quality metrics over time
- **Security**: Detect tampering or injection
- **Accountability**: Prove what was said and when

## License

MIT
