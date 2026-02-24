# SONATE Trust Receipt Specification v2.2

**Version**: 2.2  
**Date**: 2026-02-22  
**Status**: Released  
**Authors**: SONATE Contributors  
**Previous Version**: [TRUST_RECEIPT_SPECIFICATION_v1.md](./TRUST_RECEIPT_SPECIFICATION_v1.md)

## Executive Summary

SONATE Trust Receipts v2.2 extends the v1.0 specification with **industry-specific principle weights, cryptographically protected weight metadata, and enhanced trust scoring**. This specification defines the format, generation, verification, and trust evaluation semantics for trust receipts used in the SONATE platform.

**What's New in v2.2**:
- ✅ Individual principle scores (0-10) included in telemetry
- ✅ Industry-specific principle weights (healthcare, finance, government, etc.)
- ✅ Weight audit trail (weight_source, weight_policy_id) for compliance
- ✅ Overall trust score (0-100) using weighted principle calculation
- ✅ Trust status (PASS|PARTIAL|FAIL) determination based on critical rules
- ✅ All weight metadata cryptographically signed by Ed25519
- ✅ Backward compatible with v1.0 implementations

## 1. Introduction

### 1.1 Purpose

Trust receipts address the core problem of AI governance: establishing verifiable chains of custody over AI-generated content. They enable:

- **Cryptographic Proof**: Ed25519 signatures prove receipt authenticity and weight metadata integrity
- **Content Integrity**: SHA-256 hashes verify content hasn't been modified
- **Temporal Ordering**: Hash chains establish the sequence of AI interactions
- **Principle-Based Trust Scoring**: SONATE principles evaluate governance posture with industry-specific weights
- **Transparency**: Weight source and policy ID enable audit trails
- **Zero-Backend Verification**: Receipts verify locally without server dependency

### 1.2 Design Principles

1. **Determinism**: Identical inputs produce identical receipts (RFC 8785 canonicalization)
2. **Privacy by Default**: Content hashes only, plaintext optional and explicit
3. **Cryptographic Minimalism**: Ed25519 + SHA-256, no additional primitives
4. **Chain Integrity**: Hash chaining prevents receipt tampering at scale
5. **Constitutional Governance**: SONATE principles assess ethical compliance with industry context
6. **Weight Transparency**: All weight decisions documented and cryptographically protected

### 1.3 Terminology

- **Receipt**: A signed, timestamped record of an AI interaction with principle scores and weighted trust assessment
- **Trust Leakage**: Plaintext content stored in receipts without consent
- **Hash Chain**: Sequential binding of receipts via `prev_receipt_hash`
- **Canonical JSON**: RFC 8785 deterministic JSON serialization
- **SONATE Principles**: 6-point constitutional framework (CONSENT, INSPECTION, VALIDATION, ETHICAL_OVERRIDE, RIGHT_TO_DISCONNECT, MORAL_RECOGNITION)
- **Industry Weights**: Context-specific importance of each principle (e.g., healthcare prioritizes CONSENT at 35%)
- **Overall Trust Score**: Weighted sum of principle scores using industry weights (0-100)

## 2. Receipt Data Structure v2.2

### 2.1 Receipt JSON Schema

```json
{
  "version": "2.2",
  "id": "rcpt_550e8400e29b41d4a716446655440000",
  "timestamp": "2026-02-22T14:30:00.000Z",
  "session_id": "sess_abc123def456",
  "agent_id": "claude-3-haiku-20240307",
  "prompt_hash": "sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "response_hash": "sha256:q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
  
  "telemetry": {
    "ciq_metrics": {
      "clarity": 0.92,
      "integrity": 0.88,
      "quality": 0.91
    },
    "sonate_principles": {
      "CONSENT_ARCHITECTURE": 9,
      "INSPECTION_MANDATE": 8,
      "CONTINUOUS_VALIDATION": 8,
      "ETHICAL_OVERRIDE": 9,
      "RIGHT_TO_DISCONNECT": 7,
      "MORAL_RECOGNITION": 8
    },
    "overall_trust_score": 82,
    "trust_status": "PASS",
    "principle_weights": {
      "CONSENT_ARCHITECTURE": 0.35,
      "INSPECTION_MANDATE": 0.15,
      "CONTINUOUS_VALIDATION": 0.15,
      "ETHICAL_OVERRIDE": 0.20,
      "RIGHT_TO_DISCONNECT": 0.10,
      "MORAL_RECOGNITION": 0.05
    },
    "weight_source": "healthcare",
    "weight_policy_id": "policy-healthcare-v2.1",
    "resonance_score": 0.87,
    "coherence_score": 0.91,
    "truth_debt": 0.12
  },

  "prev_receipt_hash": "sha256:g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6",
  "receipt_hash": "sha256:v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6",
  "signature": "sig_ed25519:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5",
  "public_key": "pub_ed25519:k1l2m3n4o5p6q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
  
  "metadata": {
    "model": "claude-3-haiku-20240307",
    "region": "us-east-1",
    "inference_time_ms": 245,
    "batch_size": 1
  },
  
  "prompt_content": "What is the capital of France?",
  "response_content": "The capital of France is Paris.",
  "include_content": false
}
```

### 2.2 Field Definitions

| Field | Type | Required | v2.2 Change | Description |
|-------|------|----------|-------------|-------------|
| `version` | string | Yes | Updated to "2.2" | Specification version |
| `id` | UUID | Yes | NEW | Unique receipt identifier |
| `timestamp` | ISO 8601 | Yes | - | RFC 3339 timestamp |
| `session_id` | UUID | Yes | - | Unique session identifier |
| `agent_id` | string | No | - | AI model/agent identifier |
| `prompt_hash` | string | Yes | - | SHA-256 hash of input prompt |
| `response_hash` | string | Yes | - | SHA-256 hash of AI response |
| `telemetry` | object | Yes | RESTRUCTURED | All scoring metrics (see 2.3) |
| `prev_receipt_hash` | string | No | - | Previous receipt hash for chain |
| `receipt_hash` | string | Yes | - | SHA-256 hash of receipt body |
| `signature` | string | Yes | - | Ed25519 signature (covers telemetry!) |
| `public_key` | string | Yes | - | Ed25519 public key |
| `metadata` | object | No | - | Implementation-specific metadata |
| `prompt_content` | string | No | - | Optional plaintext input |
| `response_content` | string | No | - | Optional plaintext output |
| `include_content` | boolean | No | - | Whether plaintext is included |

### 2.3 Telemetry Object (NEW in v2.2)

The `telemetry` object now encapsulates all scoring and weight metadata:

```typescript
telemetry: {
  // CIQ Metrics (Clarity, Integrity, Quality) - unchanged from v1
  ciq_metrics: {
    clarity: number,      // 0.0-1.0
    integrity: number,    // 0.0-1.0
    quality: number       // 0.0-1.0
  },

  // SONATE Principle Scores (NEW) - individual 0-10 scores
  sonate_principles: {
    CONSENT_ARCHITECTURE: number,         // 0-10
    INSPECTION_MANDATE: number,           // 0-10
    CONTINUOUS_VALIDATION: number,        // 0-10
    ETHICAL_OVERRIDE: number,             // 0-10
    RIGHT_TO_DISCONNECT: number,          // 0-10
    MORAL_RECOGNITION: number             // 0-10
  },

  // Overall Trust Calculation (NEW)
  overall_trust_score: number,           // 0-100, weighted by principle_weights
  trust_status: 'PASS' | 'PARTIAL' | 'FAIL',  // Determined by critical rules

  // Weight Metadata (NEW) - for audit trail and transparency
  principle_weights: {
    CONSENT_ARCHITECTURE: number,        // Decimal (0.0-1.0), sums to 1.0
    INSPECTION_MANDATE: number,
    CONTINUOUS_VALIDATION: number,
    ETHICAL_OVERRIDE: number,
    RIGHT_TO_DISCONNECT: number,
    MORAL_RECOGNITION: number
  },
  weight_source: string,                 // Industry policy: "healthcare" | "finance" | "government" | "technology" | "education" | "legal" | "standard"
  weight_policy_id: string,              // Policy reference: "policy-healthcare-v2.1"

  // Additional metrics (backward compatible)
  resonance_score: number,    // 0.0-1.0
  coherence_score: number,    // 0.0-1.0
  truth_debt: number          // 0.0-1.0
}
```

### 2.4 Principle Scoring (0-10 Scale)

Each principle receives an individual 0-10 score:

```
Score Range    Interpretation
───────────────────────────────
9-10          Excellent - Full compliance
7-8           Good - Substantially meets principle
5-6           Acceptable - Meets minimum requirements
3-4           Poor - Significant gaps
1-2           Critical - Severe violations
0             Failed - Principle not met
```

### 2.5 Overall Trust Calculation

The overall trust score is calculated as a weighted average of principle scores:

```typescript
// Principle scores are 0-10, weights sum to 1.0
function calculateOverallScore(principles, weights) {
  let score = 0;
  for (const [principle, weight] of Object.entries(weights)) {
    score += principles[principle] * weight * 10;  // Convert 0-10 to 0-100
  }
  return Math.round(score);  // Returns 0-100
}

// Critical Rule: CONSENT or OVERRIDE can veto
function trustStatus(overallScore, principles) {
  if (principles.CONSENT_ARCHITECTURE === 0 || 
      principles.ETHICAL_OVERRIDE === 0) {
    return 'FAIL';  // Overall score becomes 0
  }
  if (overallScore >= 70) return 'PASS';
  if (overallScore >= 40) return 'PARTIAL';
  return 'FAIL';
}
```

### 2.6 Industry-Specific Weights

Principle weights vary by context:

| Principle | Standard | Healthcare | Finance | Government | Technology | Education | Legal |
|-----------|----------|-----------|---------|------------|------------|-----------|-------|
| **CONSENT** | 25% | **35%** | 20% | 30% | 28% | 32% | 25% |
| **INSPECTION** | 20% | 15% | **30%** | 30% | 18% | 20% | **35%** |
| **VALIDATION** | 20% | 15% | **25%** | 15% | 22% | 15% | 20% |
| **OVERRIDE** | 15% | 20% | 15% | 15% | 17% | 20% | 15% |
| **DISCONNECT** | 10% | 10% | 10% | 10% | 10% | 10% | 5% |
| **RECOGNITION** | 10% | 5% | 0% | 0% | 5% | 3% | 0% |

**Rationale**:
- **Healthcare**: CONSENT prioritized (patient autonomy), OVERRIDE (medical safety)
- **Finance**: INSPECTION & VALIDATION (transparency, accuracy in transactions)
- **Government**: CONSENT & INSPECTION (public accountability)
- **Legal**: INSPECTION & VALIDATION highest (evidence requirements)

## 3. Cryptographic Operations (v2.2)

### 3.1 Signing (Updated for v2.2)

The signature now covers **all telemetry data including principle scores and weights**:

```typescript
const receiptBody = {
  version: "2.2",
  id: receipt.id,
  timestamp: receipt.timestamp,
  session_id: receipt.session_id,
  agent_id: receipt.agent_id,
  prompt_hash: receipt.prompt_hash,
  response_hash: receipt.response_hash,
  telemetry: {
    ciq_metrics: receipt.telemetry.ciq_metrics,
    sonate_principles: receipt.telemetry.sonate_principles,      // ← SIGNED
    overall_trust_score: receipt.telemetry.overall_trust_score,  // ← SIGNED
    trust_status: receipt.telemetry.trust_status,                // ← SIGNED
    principle_weights: receipt.telemetry.principle_weights,      // ← SIGNED
    weight_source: receipt.telemetry.weight_source,              // ← SIGNED
    weight_policy_id: receipt.telemetry.weight_policy_id,        // ← SIGNED
    resonance_score: receipt.telemetry.resonance_score,
    coherence_score: receipt.telemetry.coherence_score,
    truth_debt: receipt.telemetry.truth_debt
  },
  prev_receipt_hash: receipt.prev_receipt_hash,
  metadata: receipt.metadata,
  prompt_content: receipt.prompt_content,
  response_content: receipt.response_content,
  include_content: receipt.include_content
};

const canonical = canonicalizeJSON(receiptBody);  // RFC 8785
const receiptHash = sha256(canonical);
const signature = ed25519.sign(canonical, privateKey);
```

**Key Guarantee**: Any modification to principle scores, weights, or trust status breaks the signature. This ensures weight metadata cannot be tampered with and provides an immutable audit trail.

### 3.2 Verification (v2.2)

Verification includes checking that weight metadata is authentic:

```typescript
function verifyReceipt(receipt, publicKey) {
  const errors = [];

  // 1. Reconstruct body
  const body = { ...receipt };
  delete body.signature;
  delete body.receipt_hash;
  delete body.public_key;

  // 2. Verify receipt hash
  const canonical = canonicalizeJSON(body);
  const computedHash = sha256(canonical);
  if (computedHash !== receipt.receipt_hash) {
    errors.push('Receipt hash mismatch');
  }

  // 3. Verify signature (covers principle scores & weights!)
  try {
    const valid = ed25519.verify(canonical, receipt.signature, publicKey);
    if (!valid) {
      errors.push('Signature verification failed');
    }
  } catch (e) {
    errors.push(`Signature error: ${e.message}`);
  }

  // 4. Verify weight policy is valid
  if (!receipt.telemetry.weight_source) {
    errors.push('Weight source missing');
  }
  if (!VALID_WEIGHT_POLICIES.includes(receipt.telemetry.weight_source)) {
    errors.push(`Unknown weight policy: ${receipt.telemetry.weight_source}`);
  }

  // 5. Verify principle scores are in valid range (0-10)
  for (const [principle, score] of Object.entries(receipt.telemetry.sonate_principles)) {
    if (typeof score !== 'number' || score < 0 || score > 10) {
      errors.push(`Invalid score for ${principle}: ${score}`);
    }
  }

  // 6. Verify overall score calculation
  const expectedScore = calculateOverallScore(
    receipt.telemetry.sonate_principles,
    receipt.telemetry.principle_weights
  );
  if (expectedScore !== receipt.telemetry.overall_trust_score) {
    errors.push(`Overall score mismatch: expected ${expectedScore}, got ${receipt.telemetry.overall_trust_score}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    verifiedWeights: receipt.telemetry.weight_source  // ✅ Weights are cryptographically verified
  };
}
```

### 3.3 Hash Chaining (Unchanged)

Same as v1.0: each receipt references the previous receipt's hash.

## 4. Privacy Mode (Unchanged from v1)

### 4.1 Default (Hash-Only)

By default, `include_content: false` prevents plaintext storage.

### 4.2 Explicit Opt-In (With Plaintext)

Only when `include_content: true` are plaintext fields included.

## 5. Migration Guide: v1.0 → v2.2

### 5.1 For Receipt Generators

**Before (v1.0)**:
```typescript
const receipt = {
  version: "1.0",
  scores: {
    clarity: 0.92,
    integrity: 0.88,
    quality: 0.91,
    consent_score: 0.95,    // These were in 0.0-1.0 range
    inspection_score: 0.85
  }
};
```

**After (v2.2)**:
```typescript
const receipt = {
  version: "2.2",
  telemetry: {
    ciq_metrics: {
      clarity: 0.92,
      integrity: 0.88,
      quality: 0.91
    },
    sonate_principles: {
      CONSENT_ARCHITECTURE: 9,       // Now 0-10 scale
      INSPECTION_MANDATE: 8,
      CONTINUOUS_VALIDATION: 8,
      ETHICAL_OVERRIDE: 9,
      RIGHT_TO_DISCONNECT: 7,
      MORAL_RECOGNITION: 8
    },
    overall_trust_score: 82,         // Weighted 0-100
    trust_status: "PASS",            // Determined by rules
    principle_weights: {
      CONSENT_ARCHITECTURE: 0.25,    // Industry weights
      INSPECTION_MANDATE: 0.20,
      // ... etc
    },
    weight_source: "standard",       // Which policy
    weight_policy_id: "policy-standard-v2.2"
  }
};
```

### 5.2 For Receipt Verifiers

**Before (v1.0)**:
```typescript
const valid = verifyReceipt(receipt);
// Checked signature over score fields (0.0-1.0)
```

**After (v2.2)**:
```typescript
const result = verifyReceipt(receipt, publicKey);
// Now checks:
// - Signature covers principle scores AND weights
// - Principle scores are valid (0-10)
// - Weights are valid and documented
// - Overall score matches calculation
// - Trust status is correct
if (result.valid && result.verifiedWeights) {
  console.log(`Receipt verified with ${receipt.telemetry.weight_source} policy`);
}
```

### 5.3 For Frontend Applications

**Before (v1.0)**:
```tsx
const principleScores = receipt.scores;  // Decimal 0.0-1.0, confusing
```

**After (v2.2)**:
```tsx
const principles = receipt.telemetry.sonate_principles;  // 0-10 integer
const weights = receipt.telemetry.principle_weights;      // 0-1 decimal
const overallScore = receipt.telemetry.overall_trust_score; // 0-100

// Display weight source and policy
console.log(`Using ${receipt.telemetry.weight_source} policy`);
console.log(`Policy ID: ${receipt.telemetry.weight_policy_id}`);
```

### 5.4 Database Schema Upgrade

Add indexes for audit trail queries:

```typescript
// MongoDB Phase 3 migration
db.receipts.createIndex({ "telemetry.weight_source": 1 });
db.receipts.createIndex({ "telemetry.weight_policy_id": 1 });
db.receipts.createIndex({ 
  "telemetry.weight_source": 1, 
  "telemetry.trust_status": 1 
});
```

## 6. Implementation Requirements

### 6.1 Generating Receipts (v2.2)

Three phases for full implementation:

**Phase 1**: Load industry weights
```typescript
const weights = getWeightsForEvaluation(context.industryType);
// Returns: { weights: {...}, source: "healthcare", policyId: "policy-healthcare-v2.1" }
```

**Phase 2**: Evaluate principles and include in telemetry
```typescript
const evaluation = await llmTrustEvaluator.evaluate(messages, context);
// Returns: { principles: {...}, ciqMetrics: {...}, weights, source, policyId }

receipt.telemetry = {
  ciq_metrics: evaluation.ciqMetrics,
  sonate_principles: evaluation.principles,     // ← Phase 1B
  overall_trust_score: evaluation.overallScore, // ← Phase 1A
  trust_status: evaluation.status,              // ← Phase 1B
  principle_weights: weights,                   // ← Phase 1A
  weight_source: source,                        // ← Phase 1B
  weight_policy_id: policyId                    // ← Phase 1B
};
```

**Phase 3**: Create signature covering telemetry
```typescript
// receiptGeneratorService includes telemetry in canonical JSON
const signature = ed25519.sign(canonical, privateKey);
// Signature now covers principle scores and weights
```

### 6.2 Updating Applications

TypeScript interfaces now include weight metadata:

```typescript
interface TrustEvaluation {
  trustScore: { overall: number; principles: Record<string, number> };
  overall_trust_score?: number;  // v2.2
  principle_weights?: Record<string, number>;  // v2.2
  weight_source?: string;  // v2.2
  weight_policy_id?: string;  // v2.2
}
```

### 6.3 Verifying Receipts

All SDKs must implement comprehensive verification:

```typescript
import { verifyReceipt } from '@sonate/core';

const result = verifyReceipt(receipt, publicKey);
if (result.valid && result.verifiedWeights) {
  console.log('✅ Receipt verified with weight metadata');
  console.log(`   Policy: ${receipt.telemetry.weight_source}`);
  console.log(`   Overall Score: ${receipt.telemetry.overall_trust_score}`);
}
```

## 7. Example Workflows

### 7.1 Healthcare Workflow

Patient uploads AI-generated medical summary:

```json
{
  "version": "2.2",
  "telemetry": {
    "sonate_principles": {
      "CONSENT_ARCHITECTURE": 10,  // Explicit patient consent obtained
      "INSPECTION_MANDATE": 7,     // Medical records reviewable
      "CONTINUOUS_VALIDATION": 8,  // Fact-checked against HIS
      "ETHICAL_OVERRIDE": 10,      // Physician can override
      "RIGHT_TO_DISCONNECT": 9,    // Patient can delete interaction
      "MORAL_RECOGNITION": 6       // Model limitations disclosed
    },
    "overall_trust_score": 88,     // High healthcare trust
    "trust_status": "PASS",
    "weight_source": "healthcare",
    "weight_policy_id": "policy-healthcare-v2.1",
    "principle_weights": {
      "CONSENT_ARCHITECTURE": 0.35,  // ← Patient consent prioritized
      "INSPECTION_MANDATE": 0.15,
      "CONTINUOUS_VALIDATION": 0.15,
      "ETHICAL_OVERRIDE": 0.20,
      "RIGHT_TO_DISCONNECT": 0.10,
      "MORAL_RECOGNITION": 0.05
    }
  }
}
```

### 7.2 Finance Workflow

Loan analysis for regulatory submission:

```json
{
  "version": "2.2",
  "telemetry": {
    "sonate_principles": {
      "CONSENT_ARCHITECTURE": 7,    // Borrower consent obtained
      "INSPECTION_MANDATE": 10,     // All analysis transparent
      "CONTINUOUS_VALIDATION": 9,   // Credit data verified
      "ETHICAL_OVERRIDE": 7,        // Loan officer can override
      "RIGHT_TO_DISCONNECT": 6,     // Interaction logged
      "MORAL_RECOGNITION": 5        // Model used disclosed
    },
    "overall_trust_score": 81,      // Compliant for submission
    "trust_status": "PASS",
    "weight_source": "finance",
    "weight_policy_id": "policy-finance-v2.0",
    "principle_weights": {
      "CONSENT_ARCHITECTURE": 0.20,
      "INSPECTION_MANDATE": 0.30,   // ← Transparency required
      "CONTINUOUS_VALIDATION": 0.25, // ← Accuracy required
      "ETHICAL_OVERRIDE": 0.15,
      "RIGHT_TO_DISCONNECT": 0.10,
      "MORAL_RECOGNITION": 0.0
    }
  }
}
```

## 8. Conformance & Testing

### 8.1 Implementation Checklist

- [ ] Receipt version is "2.2"
- [ ] Telemetry object contains all required fields
- [ ] Principle scores are 0-10 integers
- [ ] Overall score is 0-100 integer from weighted calculation
- [ ] Trust status is one of { PASS, PARTIAL, FAIL }
- [ ] Weights sum to 1.0 (with <0.01 tolerance for floating point)
- [ ] Weight source is one of { standard, healthcare, finance, government, technology, education, legal }
- [ ] Weight policy ID is non-empty string
- [ ] Signature covers telemetry fields
- [ ] Receipt hash matches canonical JSON
- [ ] All weights are cryptographically verified

### 8.2 Test Vectors

```javascript
// Test: Healthcare weight calculation
const principles = {
  CONSENT_ARCHITECTURE: 8,
  INSPECTION_MANDATE: 7,
  CONTINUOUS_VALIDATION: 8,
  ETHICAL_OVERRIDE: 9,
  RIGHT_TO_DISCONNECT: 7,
  MORAL_RECOGNITION: 6
};

const weights = {
  CONSENT_ARCHITECTURE: 0.35,
  INSPECTION_MANDATE: 0.15,
  CONTINUOUS_VALIDATION: 0.15,
  ETHICAL_OVERRIDE: 0.20,
  RIGHT_TO_DISCONNECT: 0.10,
  MORAL_RECOGNITION: 0.05
};

const expected = Math.round(
  (8 * 0.35 + 7 * 0.15 + 8 * 0.15 + 9 * 0.20 + 7 * 0.10 + 6 * 0.05) * 10
);
// Expected: 78 (healthcare policy weights emphasize CONSENT)
```

## 9. Backward Compatibility

### 9.1 Reading v1.0 Receipts

Applications may encounter v1.0 receipts in production. Update code to handle both:

```typescript
function parseReceipt(receipt) {
  if (receipt.version === "1.0") {
    return parseV1(receipt);  // Old format
  } else if (receipt.version === "2.2") {
    return parseV2_2(receipt);  // New format with weights
  }
}
```

### 9.2 Writing v2.2 Receipts

New code should always generate v2.2:

```typescript
const receipt = {
  version: "2.2",  // ← Always use latest
  telemetry: {...},
  // ... rest of fields
};
```

## 10. References

- **TRUST_RECEIPT_SPECIFICATION_v1.md**: Original specification
- **PHASE_3_MIGRATION_GUIDE.md**: Database migration procedures
- **apps/backend/src/services/llm-trust-evaluator.service.ts**: Reference implementation
- **packages/schemas/src/receipt.types.ts**: TypeScript type definitions
- RFC 8785: JSON Canonicalization Scheme
- RFC 8037: CFRG Elliptic Curve Signatures (Ed25519)
- NIST SP 800-32: Guideline on Federal Information Security

## Appendix A: v2.2 Summary of Changes

| Feature | v1.0 | v2.2 | Impact |
|---------|------|------|--------|
| Principle Scores | Decimal 0.0-1.0 in separate fields | Integer 0-10 in `sonate_principles` object | ✅ More intuitive, better migration path |
| Industry Weights | Hardcoded, not visible | Configurable, in receipt as `principle_weights` | ✅ Full transparency and auditability |
| Weight Metadata | None | `weight_source`, `weight_policy_id` | ✅ Regulatory compliance, audit trail |
| Overall Score | Implicit | Explicit 0-100 in `overall_trust_score` | ✅ Clear trust posture |
| Trust Status | Implicit | Explicit (PASS\|PARTIAL\|FAIL) | ✅ Deterministic, policy-based |
| Cryptographic Coverage | Scores only | **Scores + weights in signature** | ✅ Weight integrity guaranteed |
| Database Indexes | None on weights | Indexed on `weight_source`, `weight_policy_id` | ✅ Efficient queries for compliance |

## Appendix B: Glossary

- **Principle**: One of six SONATE constitutional values evaluated in each receipt
- **Score**: 0-10 numeric assessment of principle compliance
- **Weight**: Relative importance of a principle (0.0-1.0, sums to 1.0)
- **Industry Policy**: Named weight distribution for a context (healthcare, finance, etc.)
- **Trust Status**: High-level judgment (PASS/PARTIAL/FAIL) based on principles + critical rules
- **Audit Trail**: Documentation of which weights were applied (`weight_source`, `weight_policy_id`)
- **Canonical JSON**: Deterministic JSON using RFC 8785 for consistent hashing and signatures

---

**Document Status**: RELEASED - This specification is production-ready. Version 2.2 implementations should follow this specification for full interoperability and audit compliance.

**License**: CC0 1.0 Universal (Public Domain)

**Last Updated**: 2026-02-22
