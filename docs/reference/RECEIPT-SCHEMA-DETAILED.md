# SONATE Receipt Schema Reference (v2.0.0)

## Overview

A **SONATE Trust Receipt** is a cryptographically signed, immutable record of every AI interaction. Each receipt includes:

- **Complete interaction data** (prompt, response, model, parameters)
- **Trust metrics** (resonance score, coherence, truth debt, volatility)
- **Policy enforcement state** (constraints applied, violations, consent)
- **Cryptographic proof** (Ed25519 signature, SHA-256 hash chain)
- **Audit trail** (immutable chain linking all receipts)

This enables full traceability and accountability for every AI decision.

---

## Core Fields

### `id` (string: hex)
Unique receipt identifier derived from content hash.

```json
"id": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
```

**Format:** SHA-256 hash (64 lowercase hex characters)  
**Generation:** `SHA256(canonical_json)`  
**Immutability:** Cannot be forged or modified

---

### `version` (string: enum)
Receipt schema version for backward compatibility.

```json
"version": "2.0.0"
```

**Valid Values:** `"2.0.0"` (current)  
**Purpose:** Allows format evolution while maintaining compatibility

---

### `timestamp` (string: ISO 8601)
Exact moment the interaction occurred.

```json
"timestamp": "2026-02-09T19:40:45.123Z"
```

**Format:** ISO 8601 with milliseconds  
**Timezone:** Always UTC (Z suffix)  
**Precision:** 1 millisecond

---

### `session_id` (string)
Groups related interactions (e.g., conversation thread).

```json
"session_id": "session_abc123_user456"
```

**Format:** Free-form string  
**Purpose:** Correlate interactions within a session  
**Example Values:** conversation ID, chat thread ID, request batch ID

---

### `agent_did` (string: DID)
Decentralized Identifier of the AI agent.

```json
"agent_did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
```

**Format:** `did:sonate:[40-character alphanumeric]`  
**Purpose:** Portable agent identity  
**Resolves to:** Agent's current public key for signature verification  
**Lifecycle:** Can rotate keys without changing DID

---

### `human_did` (string: DID)
Decentralized Identifier of the human user.

```json
"human_did": "did:sonate:X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8"
```

**Format:** `did:sonate:[40-character alphanumeric]`  
**Purpose:** Portable user identity (privacy-preserving)  
**Note:** Can be pseudonymous or corporate identifier

---

### `policy_version` (string)
Which governance policy governed this interaction.

```json
"policy_version": "policy_v1.2.0"
```

**Format:** Policy identifier with version  
**Purpose:** Audit trail of which rules were enforced  
**Example Values:** `policy_v1.0.0`, `sonate_q1_2026`, `constitutional_mode_v2`

---

### `mode` (string: enum)
Governance mode for this interaction.

```json
"mode": "constitutional"
```

**Valid Values:**
- `"constitutional"` - Principle-based governance (SONATE principles enforced)
- `"directive"` - Instruction-based governance (specific rules enforced)

**Meaning:**
- Constitutional: "Follow these principles"
- Directive: "Follow these specific instructions"

---

## Interaction Data

### `interaction` (object)
The actual AI interaction captured.

```json
"interaction": {
  "prompt": "What is the capital of France?",
  "response": "Paris is the capital and most populous city of France.",
  "model": "claude-3-opus",
  "provider": "anthropic",
  "temperature": 0.7,
  "max_tokens": 2048,
  "reasoning": {
    "thought_process": "The user asked a geography question...",
    "confidence": 0.99,
    "retrieved_context": [
      "Paris is the capital and most populous city of France."
    ]
  }
}
```

**Required Fields:**
- `prompt` (string) - User input
- `response` (string) - AI output
- `model` (string) - Model name (e.g., "gpt-4-turbo", "claude-3-opus")

**Optional Fields:**
- `provider` (string) - Provider: openai, anthropic, aws-bedrock, local
- `temperature` (number) - Model temperature (0-2)
- `max_tokens` (integer) - Token limit
- `reasoning` (object) - Captured reasoning chain
  - `thought_process` (string) - How the model reasoned
  - `confidence` (number) - Confidence level (0-1)
  - `retrieved_context` (array) - Retrieved knowledge base entries

---

## Trust Telemetry

### `telemetry` (object, optional)
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

| Field | Range | Meaning |
|-------|-------|---------|
| `resonance_score` | 0-1 | Overall trust/alignment with principles (higher is better) |
| `resonance_quality` | Enum | Rating: BREAKTHROUGH (>0.9), ADVANCED (0.8-0.9), STRONG (0.7-0.8) |
| `bedau_index` | 0-1 | Weak emergence detection (higher = more emergent behavior) |
| `coherence_score` | 0-1 | LBC - Longitudinal Behavioral Coherence (consistency over time) |
| `truth_debt` | 0-1 | Unverifiable claims ratio (higher = less verifiable content) |
| `volatility` | 0-1 | Behavioral variability (higher = less stable) |
| `clarity` (CIQ) | 0-1 | Message clarity score |
| `integrity` (CIQ) | 0-1 | Content integrity score |
| `quality` (CIQ) | 0-1 | Overall quality score |

---

## Policy State

### `policy_state` (object, optional)
What constraints were applied to this interaction.

```json
"policy_state": {
  "constraints_applied": [
    "consent_verified",
    "truth_debt_check",
    "safety_filter",
    "rate_limit"
  ],
  "violations": [
    {
      "rule": "truth_debt_exceeded",
      "severity": "warning",
      "threshold": 0.2,
      "actual": 0.25,
      "action": "annotate"
    }
  ],
  "consent_verified": true,
  "override_available": true,
  "override_used": false
}
```

**Fields:**
- `constraints_applied` (array) - Which policies ran
- `violations` (array) - Rules that were triggered
  - `rule` (string) - Rule identifier
  - `severity` (string) - "info", "warning", "error"
  - `threshold` (number) - Policy threshold
  - `actual` (number) - Actual value
  - `action` (string) - Action taken: "annotate", "block", "escalate"
- `consent_verified` (boolean) - Was explicit user consent obtained?
- `override_available` (boolean) - Could user override?
- `override_used` (boolean) - Was override actually used?

---

## Hash Chain (Immutability)

### `chain` (object)
Proves this receipt is part of an immutable audit trail.

```json
"chain": {
  "previous_hash": "GENESIS",
  "chain_hash": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
  "chain_length": 1
}
```

**Fields:**
- `previous_hash` (string) - Hash of previous receipt or "GENESIS" for first
- `chain_hash` (string) - SHA256(canonical_content + previous_hash)
- `chain_length` (integer) - Count of receipts in chain

**How It Works:**
1. First receipt: `previous_hash = "GENESIS"`
2. Subsequent receipts: `previous_hash = previous_receipt.chain_hash`
3. Changing any past receipt breaks the chain (detectable)
4. Proof of immutability: chain is tamper-evident

---

## Cryptographic Signature

### `signature` (object)
Ed25519 proof that receipt was issued by the agent.

```json
"signature": {
  "algorithm": "Ed25519",
  "key_version": "1",
  "value": "MEQCIDGrvmTEr7c00rpf5Z+O50Ad5Z8Xxfqfjf9Z8O50Ad5Z8Xxfqfjf9Z8O50Ad5==",
  "timestamp_signed": "2026-02-09T19:40:45.150Z"
}
```

**Fields:**
- `algorithm` (string) - Always "Ed25519"
- `key_version` (string) - Which agent key was used (for key rotation)
- `value` (string) - Base64-encoded signature
- `timestamp_signed` (string) - When signed (ISO 8601)

**Verification Process:**
1. Get agent's public key from DID resolver
2. Compute SHA256(canonical_receipt)
3. Verify: Ed25519_verify(public_key, signature, hash)
4. If verified: Receipt is authentic and unchanged

---

## Complete Example Receipt

```json
{
  "id": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
  "version": "2.0.0",
  "timestamp": "2026-02-09T19:40:45.123Z",
  "session_id": "conv_user123_agent456",
  "agent_did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "human_did": "did:sonate:X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8",
  "policy_version": "policy_v1.2.0",
  "mode": "constitutional",
  "interaction": {
    "prompt": "Summarize the EU AI Act in 100 words",
    "response": "The EU AI Act is a regulatory framework for artificial intelligence...",
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
    "violations": [],
    "consent_verified": true,
    "override_available": true,
    "override_used": false
  },
  "chain": {
    "previous_hash": "GENESIS",
    "chain_hash": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    "chain_length": 1
  },
  "signature": {
    "algorithm": "Ed25519",
    "key_version": "1",
    "value": "MEQCIDGrvmTEr7c00rpf5Z+O50Ad5Z8Xxfqfjf9Z8O50Ad5Z8Xxfqfjf9Z8O50Ad5==",
    "timestamp_signed": "2026-02-09T19:40:45.200Z"
  }
}
```

---

## Verification Checklist

When you receive a receipt, verify:

### 1. Schema Validation
```bash
sonate-verify receipt.json
```
Checks: Required fields present, types correct, formats valid

### 2. Receipt ID
Verify: `id == SHA256(canonical_content)`

### 3. Signature
Verify: Ed25519 signature valid with agent's public key

### 4. Chain Integrity
Verify: `chain_hash == SHA256(content + previous_hash)`

### 5. Chain Continuity
Verify: `previous_hash == expected_hash_from_chain`

---

## API Integration

### Generating Receipts

```bash
POST /api/v1/receipts/generate

Request:
{
  "timestamp": "2026-02-09T19:40:45.123Z",
  "session_id": "session_123",
  "agent_did": "did:sonate:...",
  "human_did": "did:sonate:...",
  "policy_version": "policy_v1.0.0",
  "mode": "constitutional",
  "interaction": {
    "prompt": "...",
    "response": "...",
    "model": "claude-3-opus"
  },
  "telemetry": { ... },
  "policy_state": { ... }
}

Response:
{
  "success": true,
  "receipt": { ... },
  "signature": { ... }
}
```

### Verifying Receipts

```bash
POST /api/v1/receipts/verify

Request:
{
  "receipt": { ... },
  "public_key": "base64_encoded_ed25519_key"
}

Response:
{
  "valid": true,
  "checks": {
    "schema_valid": true,
    "id_valid": true,
    "signature_valid": true,
    "chain_valid": true
  },
  "errors": []
}
```

---

## Best Practices

### Generation
- ✅ Generate immediately after interaction
- ✅ Capture all available telemetry
- ✅ Include policy state (what constraints ran)
- ✅ Sign with agent's current private key
- ✅ Store in immutable log

### Storage
- ✅ Store in audit log (MongoDB, Supabase, etc.)
- ✅ Index by agent_did and session_id for fast lookup
- ✅ Maintain backup receipts
- ✅ Never modify historical receipts

### Verification
- ✅ Verify offline when possible (no network)
- ✅ Check against previous receipt (chain continuity)
- ✅ Verify signature with fresh public key lookup
- ✅ Alert on verification failures
- ✅ Maintain verification audit log

### Compliance
- ✅ EU AI Act: Satisfies "documentation and record-keeping" requirement
- ✅ SOC2: Provides evidence for "Change Management" and "System Monitoring"
- ✅ ISO 27001: Supports "Information Security Event Management"
- ✅ GDPR: Can be structured for pseudonymous user DIDs

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Schema validation fails | Missing/wrong field type | Check against this reference |
| ID mismatch | Receipt modified after signing | Reject receipt—data corrupted |
| Chain hash invalid | Hash calculation error | Recalculate or contact support |
| Signature failed | Wrong public key or tampering | Use correct agent key |
| Previous hash wrong | Chain broken or reordered | Check sequential ordering |

---

## References

- [API Reference](./API.md) - HTTP endpoints
- [DID Lifecycle](./DID-LIFECYCLE.md) - Identity management
- [CLI Tools](./CLI-TOOLS.md) - Command-line utilities
- [Architecture](./ARCHITECTURE.md) - System design
