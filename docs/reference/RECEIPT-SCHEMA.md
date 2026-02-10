# SONATE Trust Receipt Schema (v2.0.0)

## Overview

A **SONATE Trust Receipt** is a cryptographically signed, immutable record of an AI interaction. Every receipt is:

- **Signed** with Ed25519 (digital proof of authenticity)
- **Hash-chained** (immutable audit trail)
- **Timestamped** (exact moment of interaction)
- **Policy-aware** (what constraints were applied)
- **Metricated** (trust, coherence, safety scores)

Think of it as a **flight recorder for AI decisions** - complete, tamper-proof evidence of what happened and why.

---

## Schema Structure

### Core Fields

#### `id` (SHA-256)
Unique receipt identifier, derived from the receipt content itself.

```json
"id": "abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234"
```

**Why SHA-256?** Deterministic - same receipt always produces the same ID. Impossible to forge.

---

#### `version` (string)
Schema version. Currently `"2.0.0"`. Allows for backward-compatible upgrades.

```json
"version": "2.0.0"
```

---

#### `timestamp` (ISO 8601)
Exact moment the interaction occurred.

```json
"timestamp": "2026-02-09T18:30:45.123Z"
```

---

#### `session_id` (string)
Groups related interactions together (e.g., a conversation).

```json
"session_id": "conversation_abc123"
```

---

#### `agent_did` (DID)
Decentralized Identifier of the AI agent. Format: `did:sonate:<40-char-hash>`

```json
"agent_did": "did:sonate:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
```

**Why DID?** Portable identity - agent's public key can be resolved independently via DID resolver.

---

#### `human_did` (DID)
Decentralized Identifier of the human user.

```json
"human_did": "did:sonate:x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0"
```

---

#### `policy_version` (string)
Which policy governed this interaction.

```json
"policy_version": "policy_v1.2.0"
```

---

#### `mode` (enum)
Governance mode:
- `constitutional` - Principle-based (SONATE principles enforced)
- `directive` - Instruction-based (specific rules enforced)

```json
"mode": "constitutional"
```

---

### Interaction Data

#### `interaction` (object)
The actual AI interaction.

```json
"interaction": {
  "prompt": "What is the capital of France?",
  "response": "Paris is the capital of France.",
  "model": "gpt-4-turbo",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 2000,
  "reasoning": {
    "thought_process": "The user asked a geography question...",
    "confidence": 0.99,
    "retrieved_context": [
      "Paris is the capital and most populous city of France.",
      "It is located in north-central France..."
    ]
  }
}
```

**Fields:**
- `prompt` - User input
- `response` - AI output
- `model` - Model name (e.g., "gpt-4-turbo", "claude-3-sonnet")
- `provider` - Provider (openai, anthropic, aws-bedrock, local)
- `temperature` - Model temperature (0-2)
- `max_tokens` - Token limit
- `reasoning` - Optional: captured reasoning/context

---

### Telemetry (Trust Metrics)

#### `telemetry` (object)
Trust and coherence metrics captured at interaction time.

```json
"telemetry": {
  "resonance_score": 0.94,
  "resonance_quality": "STRONG",
  "bedau_index": 0.73,
  "coherence_score": 0.82,
  "truth_debt": 0.15,
  "volatility": 0.22,
  "ciq_metrics": {
    "clarity": 0.91,
    "integrity": 0.88,
    "quality": 0.93
  }
}
```

**Metrics:**
- `resonance_score` (0-1) - Overall trust score
- `resonance_quality` - Rating: STRONG, ADVANCED, BREAKTHROUGH
- `bedau_index` (0-1) - Weak emergence detection
- `coherence_score` (0-1) - LBC (Longitudinal Behavioral Coherence)
- `truth_debt` (0-1) - Unverifiable claims (higher = less verifiable)
- `volatility` (0-1) - Behavioral variability
- `ciq_metrics` - Clarity, Integrity, Quality (each 0-1)

---

### Policy State

#### `policy_state` (object)
What constraints were applied to this interaction.

```json
"policy_state": {
  "constraints_applied": [
    "consent_verified",
    "truth_debt_check",
    "safety_filter"
  ],
  "violations": [
    {
      "rule": "truth_debt_exceeded",
      "severity": "warning",
      "action": "annotate"
    }
  ],
  "consent_verified": true,
  "override_available": true
}
```

**Fields:**
- `constraints_applied` - Policies that ran
- `violations` - Rules that were triggered
- `consent_verified` - Was explicit consent obtained?
- `override_available` - Could user override?

---

### Hash Chain (Immutability)

#### `chain` (object)
Proves this receipt is part of an immutable chain.

```json
"chain": {
  "previous_hash": "GENESIS",
  "chain_hash": "abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234",
  "chain_length": 1
}
```

**Fields:**
- `previous_hash` - Hash of previous receipt (or "GENESIS" for first)
- `chain_hash` - SHA-256(canonical_json + previous_hash)
- `chain_length` - Number of receipts in chain

**Why?** Linking receipts together creates an immutable audit trail. Changing any past receipt breaks the chain.

---

### Cryptographic Signature

#### `signature` (object)
Proof that this receipt was issued by the agent.

```json
"signature": {
  "algorithm": "Ed25519",
  "value": "MEQCIDGrvmTEr7c00rpf5Z+O50Ad5Z8Xxfqfjf9Z8O50Ad5Z8Xxfqfjf9Z8O50Ad5==",
  "key_version": "key_v1",
  "timestamp_signed": "2026-02-09T18:30:45.200Z"
}
```

**Fields:**
- `algorithm` - Always "Ed25519" (public-key cryptography)
- `value` - Base64-encoded signature
- `key_version` - Which agent key was used
- `timestamp_signed` - When signed (useful for key rotation audits)

**How verification works:**
1. Compute SHA-256 of canonical receipt
2. Use agent's public key (from DID) to verify signature
3. If verified: receipt is authentic, signed by agent, and hasn't been modified

---

## Example Receipt

```json
{
  "id": "abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234",
  "version": "2.0.0",
  "timestamp": "2026-02-09T18:30:45.123Z",
  "session_id": "chat_12345",
  "agent_did": "did:sonate:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "human_did": "did:sonate:x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
  "policy_version": "policy_v1.2.0",
  "mode": "constitutional",
  "interaction": {
    "prompt": "What is the capital of France?",
    "response": "Paris is the capital of France.",
    "model": "gpt-4-turbo",
    "provider": "openai",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "telemetry": {
    "resonance_score": 0.94,
    "resonance_quality": "STRONG",
    "bedau_index": 0.73,
    "coherence_score": 0.82,
    "truth_debt": 0.15,
    "volatility": 0.22,
    "ciq_metrics": {
      "clarity": 0.91,
      "integrity": 0.88,
      "quality": 0.93
    }
  },
  "policy_state": {
    "constraints_applied": ["consent_verified", "truth_debt_check"],
    "consent_verified": true,
    "override_available": true
  },
  "chain": {
    "previous_hash": "GENESIS",
    "chain_hash": "abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234",
    "chain_length": 1
  },
  "signature": {
    "algorithm": "Ed25519",
    "value": "MEQCIDGrvmTEr7c00rpf5Z+O50Ad5Z8Xxfqfjf9Z8O50Ad5Z8Xxfqfjf9Z8O50Ad5==",
    "key_version": "key_v1",
    "timestamp_signed": "2026-02-09T18:30:45.200Z"
  }
}
```

---

## Verification Process

### Full Verification (4 checks)

1. **Schema Validation** - Receipt matches JSON Schema
2. **ID Verification** - Receipt ID matches SHA-256(content)
3. **Chain Integrity** - Chain hash is correct
4. **Signature Verification** - Ed25519 signature is valid

### Command Line

```bash
# Basic verification (schema + ID + chain)
sonate-verify receipt.json

# Full verification (includes signature)
sonate-verify receipt.json --public-key agent.pub

# With previous hash check
sonate-verify receipt.json --public-key agent.pub --previous-hash abc123...

# Detailed output
sonate-verify receipt.json --detailed
```

### Programmatic

```typescript
import { receiptValidator } from '@sonate/schemas';

const result = await receiptValidator.verifyReceipt(
  receipt,
  publicKey,
  previousChainHash
);

if (result.valid) {
  console.log('Receipt is authentic and unmodified');
} else {
  console.error('Verification failed:', result.errors);
}
```

---

## Export Formats

Receipts can be exported for integration with SIEM systems:

### JSON (Standard)
```bash
sonate-export receipts.json --format json
```

### JSONL (Line-delimited)
```bash
sonate-export receipts.json --format jsonl
```

### CSV (Spreadsheets)
```bash
sonate-export receipts.json --format csv
```

### Splunk
```bash
sonate-export receipts.json --format splunk
```

### Datadog
```bash
sonate-export receipts.json --format datadog
```

### Elastic
```bash
sonate-export receipts.json --format elastic
```

---

## Best Practices

### Generating Receipts

1. ✅ Generate immediately after AI interaction
2. ✅ Capture all telemetry available
3. ✅ Include policy state (what constraints ran)
4. ✅ Sign with agent's private key
5. ✅ Store in immutable log

### Verifying Receipts

1. ✅ Verify offline (no backend needed)
2. ✅ Check against previous receipt (chain continuity)
3. ✅ Verify signature with agent's public key
4. ✅ Alert on any verification failures
5. ✅ Maintain audit log of verification

### Compliance

**EU AI Act:** Receipts satisfy article on "documentation and record-keeping"
**SOC2:** Receipts provide evidence for "Change Management" and "System Monitoring"
**ISO 27001:** Receipts support "Information Security Event Management"

---

## Migration & Versioning

Receipts use semantic versioning:
- `2.0.0` - Current version
- `1.9.x` - Previous versions (deprecated, but still verifiable)
- Future versions will support backward compatibility

To check version:
```bash
grep '"version"' receipt.json
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Invalid schema | Receipt missing required fields | Check against JSON Schema |
| ID mismatch | Receipt was modified | Reject - receipt is tampered |
| Chain hash invalid | Hash calculation error | Recalculate - or receipt modified |
| Signature failed | Wrong public key or tampering | Use correct agent public key |
| Previous hash mismatch | Chain broken | Check chain continuity |

---

## References

- [SONATE Trust Framework](../ARCHITECTURE.md)
- [DID Lifecycle](./DID-LIFECYCLE.md)
- [API Reference](../API.md)
- [CLI Tools](../CLI-GUIDE.md)
