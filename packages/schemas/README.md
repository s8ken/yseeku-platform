# @yseeku/schemas

Shared schema definitions for SONATE Trust Receipts — JSON Schema validation + TypeScript types.

## Install

```bash
npm install @yseeku/schemas
```

## Usage

### Validate a receipt

```typescript
import { receiptValidator } from '@yseeku/schemas';

const result = receiptValidator.validateJSON(receipt);
if (result.valid) {
  console.log('Receipt is valid');
} else {
  console.error('Validation errors:', result.errors);
}
```

### TypeScript types

```typescript
import type {
  TrustReceipt,
  AIInteraction,
  DigitalSignature,
  HashChain,
  CreateReceiptInput,
  VerificationResult,
} from '@yseeku/schemas';
```

## What's Included

- **JSON Schema** (`receipt.schema.json`) — V2 Trust Receipt schema with AJV validation
- **TypeScript interfaces** — `TrustReceipt`, `AIInteraction`, `Telemetry`, `PolicyState`, etc.
- **Validator** — Runtime validation using AJV with detailed error reporting

## Receipt Structure (V2)

A Trust Receipt contains:

| Field | Description |
|-------|-------------|
| `id` | SHA-256 hash of canonical content |
| `version` | Schema version (`"2.0.0"`) |
| `timestamp` | ISO 8601 timestamp |
| `agent_did` | DID of the AI agent |
| `human_did` | DID of the human user |
| `interaction` | Prompt/response data (raw or hashed) |
| `chain` | Hash chain for immutability |
| `signature` | Ed25519 cryptographic signature |

### Privacy-by-Default

The `interaction` object supports both raw content and content hashing:

```typescript
// Hashes only (privacy-preserving, default)
interaction: {
  prompt_hash: "a1b2c3...",
  response_hash: "d4e5f6...",
  model: "gpt-4"
}

// Raw content (opt-in)
interaction: {
  prompt: "What is quantum computing?",
  response: "Quantum computing uses...",
  prompt_hash: "a1b2c3...",
  response_hash: "d4e5f6...",
  model: "gpt-4"
}
```

## Related Packages

- [`@yseeku/trust-receipts`](https://www.npmjs.com/package/@yseeku/trust-receipts) — Generate signed receipts
- [`@yseeku/verify-sdk`](https://www.npmjs.com/package/@yseeku/verify-sdk) — Verify receipts (browser + Node.js)
- [`@yseeku/core`](https://www.npmjs.com/package/@yseeku/core) — Core trust protocol

## License

MIT
