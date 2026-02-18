# @sonate/verify-sdk

Client-side SDK for verifying SONATE Trust Receipts. Works in Node.js and browsers — zero backend calls required.

## Install

```bash
npm install @sonate/verify-sdk
```

## Quick Start

```typescript
import { verify, fetchPublicKey } from '@sonate/verify-sdk';

// Fetch the SONATE public key (or provide your own)
const publicKey = await fetchPublicKey();

// Verify a receipt
const result = await verify(receipt, publicKey);

if (result.valid) {
  console.log('All checks passed');
  console.log('Trust score:', result.trustScore);
} else {
  console.error('Verification failed:', result.errors);
}
```

## API

### `verify(receipt, publicKey)`

Full verification with detailed check results.

```typescript
const result = await verify(receipt, publicKey);

// result.valid — overall pass/fail
// result.checks.structure — required fields present
// result.checks.signature — Ed25519 signature valid
// result.checks.chain — hash chain intact
// result.checks.timestamp — timestamp reasonable
// result.trustScore — extracted from telemetry (0-100)
// result.errors — array of error messages
```

### `quickVerify(receipt, publicKey)`

Boolean-only verification for simple pass/fail checks.

```typescript
const isValid = await quickVerify(receipt, publicKey);
```

### `verifyBatch(receipts, publicKey)`

Verify multiple receipts at once.

```typescript
const { total, valid, invalid, results } = await verifyBatch(receipts, publicKey);
```

### `fetchPublicKey(url?)`

Fetch a SONATE public key from a backend endpoint.

```typescript
// Default: fetches from SONATE platform
const key = await fetchPublicKey();

// Custom endpoint
const key = await fetchPublicKey('https://your-server.com/api/public-key');
```

### `canonicalize(obj)`

Deterministic JSON serialization (RFC 8785). Useful for building custom verification flows.

```typescript
import { canonicalize } from '@sonate/verify-sdk';

const canonical = canonicalize({ b: 2, a: 1 });
// '{"a":1,"b":2}'
```

## Verification Checks

| Check | What it verifies |
|-------|-----------------|
| **Structure** | Receipt has `id`, `timestamp`, and `signature` fields |
| **Signature** | Ed25519 signature over canonical receipt content |
| **Chain** | `chain_hash` matches `SHA-256(canonical_content + previous_hash)` |
| **Timestamp** | Not in the future, not older than 1 year |

## Browser Support

The SDK uses Web Crypto API in browsers and falls back to Node.js `crypto` module. Ed25519 operations use `@noble/ed25519` for cross-platform compatibility.

```html
<script type="module">
  import { verify, fetchPublicKey } from '@sonate/verify-sdk';

  const publicKey = await fetchPublicKey();
  const result = await verify(receiptFromAPI, publicKey);
  console.log('Valid:', result.valid);
</script>
```

## Receipt Format

The SDK verifies V2 Trust Receipts:

```typescript
interface TrustReceipt {
  id: string;              // SHA-256 of canonical content
  version: '2.0.0';
  timestamp: string;       // ISO 8601
  session_id: string;
  agent_did: string;       // did:web:...
  human_did: string;
  mode: 'constitutional' | 'directive';
  interaction: {
    prompt?: string;        // Raw content (when included)
    response?: string;
    prompt_hash?: string;   // SHA-256 hash (privacy-preserving)
    response_hash?: string;
    model: string;
  };
  chain: {
    previous_hash: string;
    chain_hash: string;
  };
  signature: {
    algorithm: 'Ed25519';
    value: string;          // Hex-encoded
    key_version: string;
  };
}
```

## Related Packages

- [`@sonate/trust-receipts`](https://www.npmjs.com/package/@sonate/trust-receipts) — Generate signed receipts in your own applications
- [`@sonate/schemas`](https://www.npmjs.com/package/@sonate/schemas) — JSON Schema + TypeScript types

## License

MIT
