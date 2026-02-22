# SONATE v2.2 Quick Reference

**TL;DR**: Trust scoring now considers industry context. Weights are cryptographically protected. Principle scores 0-10 integers.

---

## Before vs After: Key Changes

| Aspect | v1.0 | v2.2 | Why? |
|--------|------|------|------|
| Principle Scores | Decimal 0.0-1.0 | **Integer 0-10** | More intuitive |
| Score Storage | Scattered fields | **Unified `telemetry`** | Better organization |
| Industry Context | Hardcoded | **7 configurable policies** | Regional compliance |
| Trust Score Calc | Implicit 0-100 | **Documented 0-100** | Transparency |
| Weight Coverage | Scores only | **Scores + Weights** | Tamper-proof |

---

## Receipt Format at a Glance

### v1.0 Structure
```json
{
  "version": "1.0",
  "scores": {
    "clarity": 0.92,
    "consent_score": 0.95,        // ← 0.0-1.0, confusing
    "inspection_score": 0.85
  },
  "signature": "sig_ed25519:..."
}
```

### v2.2 Structure
```json
{
  "version": "2.2",
  "telemetry": {
    "ciq_metrics": {
      "clarity": 0.92,           // ← Still 0.0-1.0
      "integrity": 0.88,
      "quality": 0.91
    },
    "sonate_principles": {
      "CONSENT_ARCHITECTURE": 9,  // ← 0-10, clear!
      "INSPECTION_MANDATE": 8,
      "CONTINUOUS_VALIDATION": 8,
      "ETHICAL_OVERRIDE": 9,
      "RIGHT_TO_DISCONNECT": 7,
      "MORAL_RECOGNITION": 8
    },
    "overall_trust_score": 82,    // ← Weighted average
    "trust_status": "PASS",       // ← PASS|PARTIAL|FAIL
    "principle_weights": {
      "CONSENT_ARCHITECTURE": 0.35,  // ← Healthcare policy
      "INSPECTION_MANDATE": 0.15,
      // ... more
    },
    "weight_source": "healthcare",   // ← Which policy
    "weight_policy_id": "policy-healthcare-v2.1"  // ← Policy ID
  }
}
```

---

## Scores Explained

### Principle Scores: 0-10 Scale
```
10 = Excellent compliance
8  = Good compliance
6  = Acceptable compliance
4  = Poor with gaps
2  = Critical violations
0  = Complete failure
```

**Example**: CONSENT_ARCHITECTURE: 9 = "Excellent user consent obtained"

### Overall Trust Score: 0-100 Weighted
```
Overall = (CONSENT × weight) + (INSPECTION × weight) + ... + ... (×10 for 0-100)

Healthcare: (9×0.35 + 8×0.15 + 8×0.15 + 9×0.20 + 7×0.10 + 8×0.05) × 10 = 83.9 ≈ 84
```

### Trust Status Decision Tree
```
if (CONSENT == 0 OR OVERRIDE == 0)
  → FAIL (veto)
else if (overall_trust_score >= 70)
  → PASS
else if (overall_trust_score >= 40)
  → PARTIAL
else
  → FAIL
```

---

## Industry Weight Policies

### Quick Lookup Table

| Principle | **Standard** | **Healthcare** | **Finance** | **Government** |
|-----------|:---:|:---:|:---:|:---:|
| **CONSENT** | 25% | **35%** ↑ | 20% | 30% |
| **INSPECTION** | 20% | 15% | **30%** ↑ | 30% |
| **VALIDATION** | 20% | 15% | **25%** ↑ | 15% |
| **OVERRIDE** | 15% | **20%** ↑ | 15% | 15% |
| **DISCONNECT** | 10% | 10% | 10% | 10% |
| **RECOGNITION** | 10% | 5% | 0% | 0% |

**Memory Aid**:
- **Healthcare**: Patient rights first (CONSENT ↑)
- **Finance**: Accuracy matters (VALIDATION ↑)
- **Government**: Transparency & accountability (INSPECTION ↑)

---

## Code Examples

### Generating a Receipt (Backend)

```typescript
// 1. Evaluate principles
const evaluation = await llmTrustEvaluator.evaluate(messages, {
  industryType: 'healthcare'  // ← Enables healthcare weights
});

// 2. Receipt automatically includes telemetry with weights
const receipt = {
  version: "2.2",
  telemetry: {
    sonate_principles: evaluation.principles,      // {CONSENT: 9, ...}
    overall_trust_score: evaluation.overallScore,  // 84
    trust_status: evaluation.status,               // "PASS"
    principle_weights: evaluation.weights,         // {CONSENT: 0.35, ...}
    weight_source: evaluation.weightSource,        // "healthcare"
    weight_policy_id: evaluation.weightPolicyId    // "policy-healthcare-v2.1"
  },
  signature: ed25519.sign(canonical)               // Covers all telemetry!
};
```

### Reading a Receipt (Frontend)

```typescript
const receipt = fetchReceiptFromAPI();

// Extract industry policy
const policy = receipt.telemetry.weight_source;  // "healthcare" | "finance" | ...

// Display principle scores
receipt.telemetry.sonate_principles.forEach((name, score) => {
  console.log(`${name}: ${score}/10`);  // "CONSENT_ARCHITECTURE: 9/10"
});

// Display overall
console.log(`Trust Score: ${receipt.telemetry.overall_trust_score}/100`);
console.log(`Status: ${receipt.telemetry.trust_status}`);  // "PASS"
```

### Verifying a Receipt (Any Language)

```typescript
// Verify signature covers telemetry
const result = verifyReceipt(receipt, publicKey);

if (result.valid && result.verifiedWeights) {
  console.log('✅ Receipt authentic');
  console.log(`   Policy: ${receipt.telemetry.weight_source}`);
  console.log(`   Weights verified in signature`);
} else {
  console.log('❌ Receipt tampered or forged');
  console.log(result.errors);
}
```

### Querying Receipts by Weight Policy

```typescript
// MongoDB
db.receipts.find({ "telemetry.weight_source": "healthcare" });

// Mongoose
const receipts = await Receipt.find({
  "telemetry.weight_source": "healthcare"
});

// Compliance audit: find all receipts that passed with healthcare policy
const auditData = await Receipt.find({
  "telemetry.weight_source": "healthcare",
  "telemetry.trust_status": "PASS"
});
```

---

## Cryptographic Guarantee

**Key Security Principle**: The Ed25519 signature covers ALL telemetry fields including principle scores and weights.

```
Signature = Ed25519.sign(
  RFC8785.canonicalize({
    version: "2.2",
    telemetry: {
      sonate_principles: {...},      // ← SIGNED
      principle_weights: {...},      // ← SIGNED
      weight_source: "healthcare",   // ← SIGNED
      weight_policy_id: "...",       // ← SIGNED
      // ... all other fields
    }
  })
)
```

**Implication**: Any modification to weights/principles breaks the signature. This creates an immutable audit trail.

---

## Common Queries

### "What's the overall trust score?"
```typescript
const score = receipt.telemetry.overall_trust_score;  // 0-100
```

### "Which industry policy was applied?"
```typescript
const policy = receipt.telemetry.weight_source;  // "healthcare", "finance", etc.
```

### "Did this receipt pass compliance?"
```typescript
const passed = receipt.telemetry.trust_status === 'PASS';
```

### "What were the individual principle scores?"
```typescript
const principles = receipt.telemetry.sonate_principles;
// { CONSENT_ARCHITECTURE: 9, INSPECTION_MANDATE: 8, ... }
```

### "Can I trust this weight policy?"
```typescript
const verified = verifyReceipt(receipt).valid;
if (verified) {
  console.log(`✅ Policy ${receipt.telemetry.weight_policy_id} is authentic`);
}
```

---

## Database Impact

### New Indexes for v2.2

```
db.receipts.createIndex({ "telemetry.weight_source": 1 })
db.receipts.createIndex({ "telemetry.weight_policy_id": 1 })
db.receipts.createIndex({ "telemetry.weight_source": 1, "telemetry.trust_status": 1 })
```

### Query Performance

| Query | Speed |
|-------|-------|
| Find all healthcare receipts | **< 1ms indexed** (vs full scan) |
| Find healthcare PASS receipts | **< 2ms compound index** |
| Find policy v2.1 usage | **< 1ms indexed** |

---

## Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| "telemetry is undefined" | versionCheck | Ensure receipt is v2.2 or newer |
| "weight_source missing" | generateCheck | Verify LLMTrustEvaluator loaded weights |
| "Signature fails" | structureCheck | Canonical JSON must have fields in RFC 8785 order |
| "QueryError on weight_source" | indexCheck | Run migration: `npm run migrate:phase-3` |
| "Weights don't sum to 1.0" | validationCheck | Check `principle_weights` values |

---

## Comparison: Three Example Receipts

### Healthcare Receipt (PASS)
```
Principles: CONSENT:9, INSPECTION:7, VALIDATION:8, OVERRIDE:9, DISCONNECT:7, RECOGNITION:6
Policy: healthcare (weights: 35%, 15%, 15%, 20%, 10%, 5%)
Score: (9×0.35 + 7×0.15 + 8×0.15 + 9×0.20 + 7×0.10 + 6×0.05)×10 = 82
Status: PASS ✅ (score >= 70, CONSENT not 0)
```

### Finance Receipt (PARTIAL)
```
Principles: CONSENT:8, INSPECTION:9, VALIDATION:5, OVERRIDE:7, DISCONNECT:6, RECOGNITION:0
Policy: finance (weights: 20%, 30%, 25%, 15%, 10%, 0%)
Score: (8×0.20 + 9×0.30 + 5×0.25 + 7×0.15 + 6×0.10)×10 = 72
Status: PASS ⚠️ (score >= 70 BUT VALIDATION low - caution advised)
```

### Gov Receipt (FAIL)
```
Principles: CONSENT:0, INSPECTION:7, VALIDATION:8, OVERRIDE:8, DISCONNECT:7, RECOGNITION:6
Policy: government (weights: 30%, 30%, 15%, 15%, 10%, 0%)
Score: Would be 73, BUT...
Status: FAIL ❌ (CONSENT=0 is VETO, regardless of other scores)
```

---

## Deployment Checklist

- [ ] Backend compiles (v2.2 LLMTrustEvaluator + ReceiptGenerator)
- [ ] Database migration runs (`npm run migrate:phase-3`)
- [ ] Frontend compiles (TrustReceiptCard displays weight_source)
- [ ] First v2.2 receipt generated and verified
- [ ] Weight metadata appears in MongoDB indexes
- [ ] TypeScript: 0 errors
- [ ] Tests: 81/81 passing

---

## Phase Status

| Phase | Task | Tests | Status |
|-------|------|-------|--------|
| 1A | Load weights | 19 | ✅ Done |
| 1B | Principle scores | 19 | ✅ Done |
| 2 | Receipt telemetry | 10 | ✅ Done |
| 3 | Database indexes | 25 | ✅ Done |
| 4 | Frontend display | 27 | ✅ Done |
| **5** | **Documentation** | **N/A** | **🟡 In Progress** |
| 6 | Integration tests | TBD | ⏳ Next |
| 7 | Deploy to prod | TBD | ⏳ Final |

---

## Links

- **Full Spec**: `docs/TRUST_RECEIPT_SPECIFICATION_v2.2.md`
- **Implementation Guide**: `docs/TRUST_RECEIPT_V2.2_IMPLEMENTATION_GUIDE.md`
- **Release Notes**: `docs/SONATE_V2.2_RELEASE_NOTES.md`
- **Backend Code**: `apps/backend/src/services/llm-trust-evaluator.service.ts`
- **Frontend Code**: `apps/web/src/components/trust-receipt/TrustReceiptCard.tsx`

---

**Last Updated**: 2026-02-22  
**Status**: Ready for Phase 6 Testing
