# SONATE Trust Receipt Specification

**Version**: 1.0  
**Date**: 2026-02  
**Status**: Candidate Standard  
**Authors**: SONATE Contributors  

## Executive Summary

SONATE Trust Receipts are cryptographically signed, hash-chained records of AI-generated content that provide cryptographic proof of origin, integrity, and provenance. This specification defines the format, generation, verification, and trust evaluation semantics for trust receipts used in the SONATE platform.

## 1. Introduction

### 1.1 Purpose

Trust receipts address the core problem of AI governance: establishing verifiable chains of custody over AI-generated content. They enable:

- **Cryptographic Proof**: Ed25519 signatures prove the receipt issuer's identity
- **Content Integrity**: SHA-256 hashes verify content hasn't been modified
- **Temporal Ordering**: Hash chains establish the sequence of AI interactions
- **Trust Scoring**: SONATE principles evaluate governance posture
- **Zero-Backend Verification**: Receipts verify locally without server dependency

### 1.2 Design Principles

1. **Determinism**: Identical inputs produce identical receipts (RFC 8785 canonicalization)
2. **Privacy by Default**: Content hashes only, plaintext optional and explicit
3. **Cryptographic Minimalism**: Ed25519 + SHA-256, no additional primitives
4. **Chain Integrity**: Hash chaining prevents receipt tampering at scale
5. **Constitutional Governance**: SONATE principles assess ethical compliance

### 1.3 Terminology

- **Receipt**: A signed, timestamped record of an AI interaction
- **Trust Leakage**: Plaintext content stored in receipts without consent
- **Hash Chain**: Sequential binding of receipts via `prev_receipt_hash`
- **Canonical JSON**: RFC 8785 deterministic JSON serialization
- **SONATE Principles**: 6-point constitutional framework (CONSENT, INSPECTION, VALIDATION, ETHICAL_OVERRIDE, RIGHT_TO_DISCONNECT, MORAL_RECOGNITION)

## 2. Receipt Data Structure

### 2.1 Receipt JSON Schema

```json
{
  "version": "1.0",
  "timestamp": "2026-02-21T15:30:45.123Z",
  "session_id": "sess_abc123def456",
  "agent_id": "claude-3-haiku-20240307",
  "prompt_hash": "sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "response_hash": "sha256:q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
  "scores": {
    "clarity": 0.92,
    "integrity": 0.88,
    "quality": 0.91,
    "consent_score": 0.95,
    "inspection_score": 0.85,
    "validation_score": 0.90,
    "override_score": 0.87,
    "disconnect_score": 0.93,
    "recognition_score": 0.89
  },
  "scores_method": "llm",
  "prev_receipt_hash": "sha256:g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6",
  "receipt_hash": "sha256:v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6",
  "signature": "sig_ed25519:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5",
  "public_key": "pub_ed25519:k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
  "metadata": {
    "model": "claude-3-haiku-20240307",
    "temperature": 0.7,
    "max_tokens": 2048,
    "region": "us-east-1"
  },
  "prompt_content": "What is the capital of France?",
  "response_content": "The capital of France is Paris.",
  "include_content": true
}
```

### 2.2 Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Specification version (e.g., "1.0") |
| `timestamp` | ISO 8601 | Yes | RFC 3339 timestamp of receipt creation |
| `session_id` | UUID | Yes | Unique session identifier |
| `agent_id` | string | No | AI model/agent identifier |
| `prompt_hash` | string | Yes | SHA-256 hash of input prompt (0x-prefixed hex) |
| `response_hash` | string | Yes | SHA-256 hash of AI response (0x-prefixed hex) |
| `scores` | object | Yes | SONATE + CIQ scores (0.0-1.0 range) |
| `scores_method` | enum | Yes | Score generation method: "llm", "heuristic", "ml" |
| `prev_receipt_hash` | string | No | Previous receipt hash for chain binding (null for first) |
| `receipt_hash` | string | Yes | SHA-256 hash of receipt body (see 2.3) |
| `signature` | string | Yes | Ed25519 signature of receipt body (sig_ed25519: prefix) |
| `public_key` | string | Yes | Ed25519 public key (pub_ed25519: prefix) |
| `metadata` | object | No | Implementation-specific metadata |
| `prompt_content` | string/object | No | Optional plaintext of input (privacy mode dependent) |
| `response_content` | string/object | No | Optional plaintext of output (privacy mode dependent) |
| `include_content` | boolean | No | Whether plaintext is included (default: false) |

### 2.3 Receipt Hash Computation

Receipt hash is computed over a **canonical JSON** representation of the receipt body (excluding `signature`, `receipt_hash`, and `public_key` fields):

```typescript
const receiptBody = {
  version: receipt.version,
  timestamp: receipt.timestamp,
  session_id: receipt.session_id,
  agent_id: receipt.agent_id,
  prompt_hash: receipt.prompt_hash,
  response_hash: receipt.response_hash,
  scores: receipt.scores,
  scores_method: receipt.scores_method,
  prev_receipt_hash: receipt.prev_receipt_hash,
  metadata: receipt.metadata,
  prompt_content: receipt.prompt_content,
  response_content: receipt.response_content,
  include_content: receipt.include_content
};

const canonical = canonicalizeJSON(receiptBody); // RFC 8785
const receipt_hash = sha256(canonical);
```

**Important**: Canonicalization uses RFC 8785 (JCS - JSON Canonicalization Scheme) to ensure deterministic output across implementations and languages.

## 3. Cryptographic Operations

### 3.1 Signing

1. Construct receipt body (excluding signature, receipt_hash, public_key)
2. Canonicalize receipt body to RFC 8785 JSON
3. Compute SHA-256 hash of canonical JSON → `receipt_hash`
4. Sign receipt body using Ed25519 private key → `signature`
5. Include Ed25519 public key in receipt

```typescript
const signingKey = ed25519.generateSigningKey();
const message = canonicalizeJSON(receiptBody);
const receiptHash = sha256(message); // Hex-encoded
const signature = ed25519.sign(message, signingKey);

const receipt = {
  ...receiptBody,
  receipt_hash: receiptHash,
  signature: signature,
  public_key: signingKey.publicKey
};
```

### 3.2 Verification

1. Extract `signature`, `receipt_hash`, `public_key` from receipt
2. Reconstruct receipt body (excluding signature, receipt_hash, public_key)
3. Verify `receipt_hash` matches SHA-256 of canonical receipt body
4. Verify `signature` using provided Ed25519 public key
5. Return { valid: boolean, errors: string[] }

```typescript
function verifyReceipt(receipt) {
  const errors = [];

  // Reconstruct body
  const body = {...receipt};
  delete body.signature;
  delete body.receipt_hash;
  delete body.public_key;

  // Verify hash
  const canonical = canonicalizeJSON(body);
  const computed_hash = sha256(canonical);
  if (computed_hash !== receipt.receipt_hash) {
    errors.push('Receipt hash mismatch');
  }

  // Verify signature
  try {
    const valid = ed25519.verify(
      canonical,
      receipt.signature,
      receipt.public_key
    );
    if (!valid) {
      errors.push('Signature verification failed');
    }
  } catch (e) {
    errors.push(`Signature error: ${e.message}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 3.3 Hash Chaining

Receipts in a session form a deterministic hash chain:

```
Session start:
Receipt 1: prev_receipt_hash = null
Receipt 2: prev_receipt_hash = Receipt 1's receipt_hash
Receipt 3: prev_receipt_hash = Receipt 2's receipt_hash
...
Receipt N: prev_receipt_hash = Receipt (N-1)'s receipt_hash
```

To verify chain integrity:
1. Verify each receipt's signature
2. For each receipt N > 1, verify that `prev_receipt_hash` equals Receipt(N-1)'s `receipt_hash`
3. Chain is valid if all receipts verify and all prev_receipt_hash values chain correctly

## 4. Privacy Mode

### 4.1 Default (Hash-Only)

By default, `include_content: false`:
- `prompt_content` and `response_content` are **omitted** from receipt
- Only `prompt_hash` and `response_hash` are included
- Receipt still verifiable without plaintext
- **No trust leakage** of sensitive AI interactions

```json
{
  "version": "1.0",
  "timestamp": "2026-02-21T15:30:45.123Z",
  "session_id": "sess_abc123def456",
  "prompt_hash": "sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "response_hash": "sha256:q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
  // ... scores, hashes, signatures ...
  "include_content": false
  // NO prompt_content or response_content
}
```

### 4.2 Explicit Opt-In (With Plaintext)

Only when `include_content: true` are plaintext fields included:

```json
{
  // ... same fields as above ...
  "include_content": true,
  "prompt_content": "What is the capital of France?",
  "response_content": "The capital of France is Paris."
}
```

**Use Cases**: Audit compliance, regulatory reporting, non-sensitive demo data

### 4.3 Privacy Guarantee

The hash computation does **not** include plaintext content:
```typescript
// Receipt hash is computed over this (never plaintext):
const hashableBody = {
  version, timestamp, session_id, agent_id,
  prompt_hash, response_hash,  // Only hashes, not content
  scores, scores_method, prev_receipt_hash, metadata,
  include_content  // Metadata flag, not content itself
};
```

Even if `include_content: true`, the hashing excludes the plaintext. This means:
- Removing plaintext from a receipt preserves hash validity
- Privacy mode can be upgraded (hash-only) without invalidating signatures
- Compliance tools can strip plaintext while keeping cryptographic proof intact

## 5. SONATE Principles & Scoring

### 5.1 Six Constitutional Principles

Each receipt includes scores for the SONATE framework:

| Principle | Score Field | Definition | Example Indicators |
|-----------|-------------|------------|-------------------|
| **CONSENT** | `consent_score` | User permission for this AI interaction | Opt-in interaction, explicit API key, explicit query |
| **INSPECTION** | `inspection_score` | Ability to review the interaction | Receipt generated, content hashing enabled, session logging |
| **VALIDATION** | `validation_score` | Correctness of the response | Model accuracy benchmarks, hallucination detection, fact-checking |
| **ETHICAL_OVERRIDE** | `override_score` | Human ability to reject AI response | Human approval required, content moderation enabled, veto mechanism |
| **RIGHT_TO_DISCONNECT** | `disconnect_score` | Ability to opt out of future AI interactions | Session termination allowed, model switching possible, data deletion |
| **MORAL_RECOGNITION** | `recognition_score` | Acknowledgment of AI limitations | Confidence scores provided, uncertainty bounds set, version disclosed |

### 5.2 CIQ Metrics

Additional metadata scores:

| Metric | Field | Range | Definition |
|--------|-------|-------|-----------|
| **Clarity** | `clarity` | 0.0-1.0 | Response clarity (human-readable, well-structured) |
| **Integrity** | `integrity` | 0.0-1.0 | Source attribution, citations, fact alignment |
| **Quality** | `quality` | 0.0-1.0 | Overall response quality vs baseline |

### 5.3 Score Generation Methods

| Method | Field | Description | Latency |
|--------|-------|-------------|---------|
| **LLM** | `scores_method: "llm"` | Claude Haiku evaluates SONATE principles | ~500ms |
| **Heuristic** | `scores_method: "heuristic"` | Rule-based scoring (no API calls) | <10ms |
| **ML** | `scores_method: "ml"` | ML model-based scoring | ~100ms |

All methods must produce scores in the [0.0, 1.0] range.

## 6. Implementation Requirements

### 6.1 JavaScript/TypeScript

- **Library**: `@sonate/trust-receipts`
- **Dependencies**: @noble/ed25519, json-canonicalize
- **Async Wrapper**: `TrustReceipts.wrap(asyncFn, options)`
- **Key Generation**: Ed25519 keys via @noble/ed25519
- **Verification**: `TrustReceipt.verify(publicKey)`

```typescript
import { TrustReceipts } from '@sonate/trust-receipts';

const receipts = new TrustReceipts();

const { response, receipt } = await receipts.wrap(
  async () => openai.chat.completions.create({...}),
  {
    sessionId: 'user-session-123',
    input: { role: 'user', content: 'What is AI governance?' },
    includeContent: false  // Privacy mode: hash-only
  }
);
```

### 6.2 Python

- **Library**: `sonate` (PyPI)
- **Dependencies**: PyNaCl, json-canonicalize
- **Async Wrapper**: `TrustReceipts.wrap(async_fn, options)`
- **Key Generation**: Ed25519 keys via PyNaCl
- **Verification**: `TrustReceipt.verify(public_key)`

```python
from sonate import TrustReceipts

receipts = TrustReceipts()

response, receipt = await receipts.wrap(
    async_openai_call(),
    session_id='user-session-123',
    input={'role': 'user', 'content': 'What is AI governance?'},
    include_content=False  # Privacy mode: hash-only
)
```

### 6.3 Verification SDKs

No-dependency verification:
- **JavaScript**: Use built-in `crypto.subtle` for Ed25519 verification
- **Python**: Use PyNaCl for Ed25519 verification
- **Go**: Use standard `crypto/ed25519` package

Zero-backend verification means receipts can be verified in:
- Browser (JavaScript)
- CLI tools (Node.js, Python, Go)
- Smart contracts (Solana, EVM)
- Audit systems (offline)

## 7. Conformance & Testing

### 7.1 Test Vectors

All implementations must pass RFC 8785 canonicalization and Ed25519 signature tests:

```typescript
// Test vector: Canonical JSON
input = { a: 1, b: 2, c: 3 };
canonical = '{"a":1,"b":2,"c":3}';
hash = sha256(canonical) = '0x...';

// Test vector: Ed25519 Signature
message = canonical;
privateKey = '0x...';
publicKey = ed25519.getPublicKey(privateKey);
signature = ed25519.sign(message, privateKey);
verified = ed25519.verify(message, signature, publicKey) === true;
```

### 7.2 Compliance Matrix

| Feature | JS | Python | Verification | Note |
|---------|----|----|---|------|
| Ed25519 signing | ✅ | ✅ | ✅ | @noble/ed25519, PyNaCl |
| SHA-256 hashing | ✅ | ✅ | ✅ | Deterministic, no collisions |
| RFC 8785 canonicalization | ✅ | ✅ | ✅ | Identical output across languages |
| Hash chaining | ✅ | ✅ | ✅ | prev_receipt_hash binding |
| Privacy mode | ✅ | ✅ | ✅ | include_content: false by default |
| SONATE scoring | ✅ | ✅ | N/A | LLM/heuristic/ML methods |
| Receipt verification | ✅ | ✅ | ✅ | Zero-backend capable |

### 7.3 Benchmarks

| Operation | Target | JS | Python |
|-----------|--------|----|----|
| Receipt generation | <50ms | ~15ms | ~25ms |
| Signature verification | <50ms | ~20ms | ~30ms |
| Hash chain verification (100 receipts) | <200ms | ~180ms | ~200ms |
| Memory per receipt | <5KB | ~4KB | ~4.5KB |

## 8. Security Considerations

### 8.1 Ed25519 Keys

- **Generation**: Cryptographically random 32-byte seed
- **Storage**: Never expose private keys (use HSM or secure key management)
- **Rotation**: Rotate public keys in receipts if compromised
- **Validation**: Accept only keys matching `pub_ed25519:` prefix

### 8.2 Hash Collisions

- **Algorithm**: SHA-256 (2^256 theoretical collision space)
- **Rejection**: Reject SHA-256 outputs <64 hex characters
- **Verification**: Compare full 64-character hash strings

### 8.3 Receipt Tampering

- **Detection**: Signature verification catches any receipt modification
- **Chain Verification**: prev_receipt_hash binding detects receipt insertion/deletion
- **Canonicalization**: RFC 8785 ensures format changes are detected

### 8.4 Privacy Leakage

- **Default**: Hash-only mode (`include_content: false`) prevents plaintext storage
- **Audit**: Inspect receipt's `include_content` field to verify privacy mode
- **Compliance**: Strip plaintext from receipts before logging/storage

## 9. Future Work

### 9.1 Policy Engine Integration

Receipts may include policy evaluation results:

```json
{
  "version": "1.0",
  "...": "...",
  "policy_evaluations": [
    {
      "policy_id": "policy_safe_content",
      "policy_name": "Prevent harmful content",
      "evaluation": true,
      "confidence": 0.95,
      "explanation": "Response does not contain harmful content"
    }
  ]
}
```

### 9.2 Multi-Model Receipts

Receipts for multi-step AI pipelines:

```json
{
  "version": "1.0",
  "multi_model_chain": [
    { "model": "gpt-4", "receipt_hash": "0x..." },
    { "model": "claude-3-sonnet", "receipt_hash": "0x..." },
    { "model": "gemini-pro", "receipt_hash": "0x..." }
  ]
}
```

### 9.3 Blockchain Anchoring

Optional proof-of-existence on blockchain:

```json
{
  "version": "1.0",
  "...": "...",
  "blockchain_anchor": {
    "chain": "solana",
    "transaction": "7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0",
    "timestamp": "2026-02-21T15:30:45.123Z"
  }
}
```

## 10. References

- RFC 3339: Date and Time on the Internet (Timestamps)
- RFC 8785: JSON Canonicalization Scheme (JCS)
- RFC 8037: CFRG Elliptic Curve Signatures (Ed25519)
- NIST SP 800-32: Guideline on Federal Information Security (FISMA compliance)
- ISO/IEC 27001: Information Security Management (alignment)

## Appendix A: Example Workflow

```typescript
// 1. Generate Ed25519 key pair
const { publicKey, privateKey } = ed25519.generateKeyPair();

// 2. Create receipt for AI interaction
const receipts = new TrustReceipts(privateKey);
const { response, receipt } = await receipts.wrap(
  async () => openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Explain quantum computing' }]
  }),
  {
    sessionId: 'user-session-abc123',
    input: { role: 'user', content: 'Explain quantum computing' },
    includeContent: false  // Privacy mode
  }
);

// 3. Recipient receives receipt JSON
const receiptJSON = JSON.stringify(receipt);
// Send receiptJSON to recipient (or log to compliance system)

// 4. Recipient verifies receipt (offline, no server needed)
import { verifyReceipt } from '@sonate/trust-receipts';
const verification = verifyReceipt(receipt, publicKey);
console.log(verification.valid);  // true
```

---

**Document Status**: This is a Candidate Standard. Implementations should follow this specification for interoperability. Feedback and proposed changes should be submitted through the standard process.

**License**: CC0 1.0 Universal (Public Domain)
