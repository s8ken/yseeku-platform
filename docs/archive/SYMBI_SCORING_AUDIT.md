# SYMBI Constitutional Scoring Audit
**Status**: 🔴 CRITICAL - Inconsistencies Detected  
**Date**: February 22, 2026  
**Scope**: Front-end vs Back-end principle scoring consistency

---

## Executive Summary

The trust receipt system displays 6 SYMBI Constitutional Principles on the front-end, but the backend has **multiple competing implementations** with different principle sets. This creates three critical risks:

1. **Principle Mismatch**: Frontend renders 6 principles; Policy engine evaluates 4 different principles
2. **Score Mapping**: No clear mapping between policy-engine scores and receipt display scores
3. **Determinism**: Different implementations may produce different results for same input
4. **Front-End Verification**: Users see principle scores but no way to verify their calculation

---

## Current Architecture Map

```
TRUST RECEIPT GENERATION
├── Frontend Display (6 Principles)
│   ├── CONSENT_ARCHITECTURE (weight: 0.25, critical)
│   ├── INSPECTION_MANDATE (weight: 0.20)
│   ├── CONTINUOUS_VALIDATION (weight: 0.20)
│   ├── ETHICAL_OVERRIDE (weight: 0.15, critical)
│   ├── RIGHT_TO_DISCONNECT (weight: 0.10)
│   └── MORAL_RECOGNITION (weight: 0.10)
│
├── Backend Scoring (Multiple Systems)
│   ├── System 1: PrincipleEvaluator (packages/core/src/principles/)
│   │   └── Evaluates: Same 6 principles via actual system state
│   │
│   ├── System 2: SymbiEvaluator (packages/policy-engine/evaluators/)
│   │   └── Evaluates: 4 DIFFERENT principles
│   │       ├── Sincerity (truthfulness)
│   │       ├── Meticulousness (precision/quality)
│   │       ├── Benevolence (acting in user's interest)
│   │       └── Integrity (consistency over time)
│   │
│   └── System 3: SonateScorer (packages/core/src/principles/)
│       └── Scores: Same 6 principles using TrustProtocol
│
└── Receipt Schema
    └── scores object contains ALL scores merged:
        ├── CIQ Metrics: clarity, integrity, quality
        └── Principle Scores: consent_score, inspection_score, 
                              validation_score, override_score,
                              disconnect_score, recognition_score
```

---

## 🔴 Critical Issues Identified

### Issue 1: Dual Principle Systems

**Frontend** (TrustReceiptCard.tsx):
```typescript
PRINCIPLE_INFO = {
  CONSENT_ARCHITECTURE: { name: 'Consent Architecture', weight: 0.25, critical: true },
  INSPECTION_MANDATE: { name: 'Inspection Mandate', weight: 0.20 },
  CONTINUOUS_VALIDATION: { name: 'Continuous Validation', weight: 0.20 },
  ETHICAL_OVERRIDE: { name: 'Ethical Override', weight: 0.15, critical: true },
  RIGHT_TO_DISCONNECT: { name: 'Right to Disconnect', weight: 0.10 },
  MORAL_RECOGNITION: { name: 'Moral Recognition', weight: 0.10 }
}
```

**Backend Policy Engine** (packages/policy-engine/evaluators/symbi-evaluator.ts):
```typescript
SymbiPrinciple = {
  SINCERITY: "Being truthful and avoiding deception",
  METICULOUSNESS: "Being careful, precise, and thorough",
  BENEVOLENCE: "Acting in the user's best interest",
  INTEGRITY: "Being consistent and trustworthy over time"
}
```

**Risk**: These are completely different principle taxonomies. A receipt generated with policy-engine constraints won't correlate with frontend display.

---

### Issue 2: Score Calculation Inconsistency

#### PrincipleEvaluator (packages/core/src/principles/principle-evaluator.ts)
Scores based on **actual system state**:
- `evaluateConsent()`: Checks `hasExplicitConsent` boolean (0 or score)
- `evaluateInspection()`: Tallies receipt generation + verifiability + audit logs (max 10 points)
- `evaluateValidation()`: Counts validation checks performed (0-10)
- `evaluateOverride()`: Has override button? (0 or high score)
- `evaluateDisconnect()`: Can user exit freely? (0-10 based on exit penalties)
- `evaluateMoralRecognition()`: Respects user agency (compound checks)

**Weights**: Hardcoded in PRINCIPLE_WEIGHTS or ENV var
```
CONSENT_ARCHITECTURE: 0.25
INSPECTION_MANDATE: 0.20
CONTINUOUS_VALIDATION: 0.20
ETHICAL_OVERRIDE: 0.15
RIGHT_TO_DISCONNECT: 0.10
MORAL_RECOGNITION: 0.10
```

#### SymbiEvaluator (packages/policy-engine/evaluators/symbi-evaluator.ts)
Scores based on **telemetry fields and content analysis**:
- `evaluateSincerity()`: Uses `receipt.telemetry?.truth_debt` + citation checks
- `evaluateMeticulousness()`: Uses CIQ metrics + response completeness + response length
- `evaluateBenevolence()`: Pattern matches for harm (medical, legal, financial keywords)
- `evaluateIntegrity()`: Coherence score + volatility + history comparison (simplified)

**No standardized weighting** - each returns score in range 0-1

#### SonateScorer (packages/core/src/principles/sonate-scorer.ts)
Similar to PrincipleEvaluator but routes through TrustProtocol wrapper

**Risk**: Three different calculation methods, three different result ranges (0-10 vs 0-1), three different base metrics.

---

### Issue 3: Score Mapping Gap

The receipt schema expects scores in object at receipt.scores:
```typescript
scores: {
  clarity: 0.95,           // ← CIQ metric
  integrity: 0.88,         // ← CIQ metric  
  quality: 0.91,           // ← CIQ metric
  consent_score: 0.95,     // ← Principle score
  inspection_score: 0.85,  // ← Principle score
  validation_score: 0.90,  // ← Principle score
  override_score: 0.87,    // ← Principle score
  disconnect_score: 0.93,  // ← Principle score
  recognition_score: 0.89, // ← Principle score
}
```

**Question**: Where do these scores come from when receipt is generated?
- **Option A**: Backend calculates via PolicyEvaluatorService (4 principles, 0-1 scale)
- **Option B**: Backend calculates via PrincipleEvaluator (6 principles, 0-10 scale then normalized?)
- **Option C**: Frontend calculates via LLM scoring (scores_method: 'llm')
- **Option D**: Combination of above?

**Risk**: No single source of truth. Scores might be calculated differently on different code paths.

---

### Issue 4: Frontend Can't Verify Backend Scores

The Receipt Verification Playground (apps/web/src/components/receipt-verification/ReceiptVerificationPlayground.tsx):
- ✅ Verifies receipt hash
- ✅ Verifies Ed25519 signature
- ✅ Verifies hash chain
- ✅ Verifies privacy mode
- ❌ **CANNOT verify principle score calculation**

Why? Because principle scoring requires:
1. Original EvaluationContext (system state at evaluation time)
2. Policy constraints that were applied
3. Telemetry data that might not be in receipt

**Risk**: Users see principle scores but can't independently verify they're correct.

---

## 🟡 Test Coverage Gaps

### What's Tested
- ✅ PrincipleEvaluator tests (principal-evaluator.test.ts) - 296 lines
  - Tests all 6 principles with various context states
  - Tests critical violation rules
  - Tests weighting calculation
  
- ✅ SymbiEvaluator tested in policy-engine (implied via PolicyEvaluatorService)
- ✅ Frontend rendering tested (TrustReceiptUI.test.tsx) - 493 lines
  - Tests principle score display
  - Tests color coding (green/yellow/red)
  - Tests snapshot consistency

### What's NOT Tested
- ❌ **Cross-system consistency**: PrincipleEvaluator vs SymbiEvaluator vs SonateScorer produce same results?
- ❌ **Score normalization**: When 0-10 scores are converted to 0-1 for receipt, is it deterministic?
- ❌ **Policy-to-receipt flow**: Does PolicyEvaluator output correctly map to receipt.scores fields?
- ❌ **Frontend verification**: Can frontend independently recalculate principle scores?
- ❌ **LLM scoring**: What does `scores_method: 'llm'` actually do? How does it integrate with principle evaluation?
- ❌ **Determinism across platforms**: Python SDK vs JS SDK produce identical scores for same context?

---

## 📋 Specific Test Cases Missing

### T1: Identical Context → Identical Scores
```typescript
const context = { /* standard test context */ };
const evaluator1 = new PrincipleEvaluator();
const evaluator2 = new PrincipleEvaluator();

const result1 = evaluator1.evaluate(context);
const result2 = evaluator2.evaluate(context);

// Should be identical every time (determinism test)
expect(result1.scores).toEqual(result2.scores);
expect(result1.overallScore).toEqual(result2.overallScore);
```

### T2: PrincipleEvaluator → Receipt Scores Mapping
```typescript
// Simulate receipt generation
const principleResult = evaluator.evaluate(context);
const receipt = generateReceipt(principleResult); // How?

// Verify principle scores in receipt
expect(receipt.scores.consent_score).toBe(principleResult.scores.CONSENT_ARCHITECTURE / 10);
// (Assuming normalization from 0-10 to 0-1)
```

### T3: SymbiEvaluator → Receipt Scores Mapping
```typescript
// Does policy engine output integrate with receipt?
const policyResult = await policyEvaluator.evaluate(receipt, policy);
const symbiScore = policyResult[SymbiPrinciple.SINCERITY];

// If receipt.scores has "sincerity_score", does it match?
// Currently no mapping between SymbiPrinciple and receipt.scores fields
```

### T4: Frontend Principle Score Validation
```typescript
// Mock receipt with specific principle scores
const receipt = {
  scores: {
    consent_score: 0.95,
    inspection_score: 0.85,
    // ...
  }
};

// Frontend should show these, but can it verify them?
const isVerifiable = frontend.canVerifyPrincipleScores(receipt);
expect(isVerifiable).toBe(true); // Currently false?
```

### T5: Python ↔ JavaScript Parity
```typescript
// Same context evaluated in both languages
const jsResult = new PrincipleEvaluator().evaluate(context);
const pyResult = pythonEvaluator.evaluate(context); // Python SDK

expect(jsResult.scores).toEqual(toJavaScript(pyResult.scores));
```

---

## 🎯 Recommended Actions

### Phase 1: Audit & Documentation (NOW - 4 hours)

**1.1 Map Current Architecture**
- [ ] Document which code path generates receipt scores in production
- [ ] Trace from receipt generation → backend scoring → frontend display
- [ ] Identify if PrincipleEvaluator or SymbiEvaluator is authoritative

**1.2 Create Determinism Tests**
- [ ] Same context produces same scores every time (test T1)
- [ ] Score calculation is reproducible across sessions
- [ ] Randomness removed if present

**1.3 Document Principle Taxonomy**
- [ ] Create canonical defin ition of 6 constitutional principles
- [ ] Clarify relationship to 4 SYMBI principles in policy-engine
- [ ] Choose: Keep both or consolidate?

**1.4 Specification Update**
- [ ] Update TRUST_RECEIPT_SPECIFICATION_v1.md with principle scoring details
- [ ] Document which backend system is authoritative
- [ ] Document score ranges (0-1? 0-10? Algorithm?)

### Phase 2: Score Mapping & Explainability (Next day - 6 hours)

**2.1 Create Score Mapping Layer**
- [ ] Create `PrincipleScoreMapper` that converts theory → receipt.scores
- [ ] Normalize scores consistently (all 0-1 range)
- [ ] Document mapping in comments

**2.2 Add Explanation Capability**
- [ ] Frontend Verification Playground: Can explain WHY a principle scored X
- [ ] Show which system state inputs caused the score
- [ ] Example: "Consent Architecture = 9 because (1) explicit consent given, (2) receipt generated and verifiable, (3) timestamp recorded"

**2.3 Python SDK Parity**
- [ ] Create PrincipleEvaluator Python implementation
- [ ] Cross-language test suite (T5)
- [ ] Verify identical results

### Phase 3: Test Hardening (This week - 8 hours)

**3.1 Add Cross-System Tests**
All tests from T1-T5:
- [ ] Determinism tests
- [ ] Score mapping tests
- [ ] Frontend verification tests
- [ ] Python ↔ JavaScript tests

**3.2 Production Validation**
- [ ] Sample 100 real receipts from demo app
- [ ] Recalculate principle scores offline
- [ ] Compare with stored scores (should be identical)
- [ ] Document any discrepancies

**3.3 Dashboard & Playground**
- [ ] Update Receipt Verification Playground to show principle scoring logic
- [ ] Add "Score Breakdown" view on TrustReceiptCard
- [ ] Show which factors contributed to each principle score

---

## 📊 Scoring System Comparison

| Aspect | PrincipleEvaluator | SymbiEvaluator | SonateScorer |
|--------|-------------------|----------------|------------|
| **Location** | packages/core/src/principles/ | packages/policy-engine/evaluators/ | packages/core/src/principles/ |
| **Principles** | 6 (Constitutional) | 4 (SYMBI) | 6 (Constitutional) |
| **Score Range** | 0-10 | 0-1 | 0-10 |
| **Base Metrics** | System state booleans | Telemetry + content analysis | System state booleans |
| **Weights** | Hardcoded + ENV override | Per-constraint | Via TrustProtocol |
| **Deterministic** | ✅ Yes | ⚠️ Depends on NLP | ✅ Yes |
| **Explainable** | ✅ Yes | ⚠️ Partial | ✅ Yes |
| **Used in Receipts** | ❓ Unknown | ❓ Unknown | ❓ Indirect |
| **Frontend Verified** | ❌ No | ❌ No | ❌ No |
| **Test Coverage** | ✅ Good | ⚠️ Partial | ✅ Good |

---

## 🔍 Questions for Validation

1. **Which system generates receipt.scores?**
   - When a conversation is logged, which backend calculates the principle scores stored in the receipt?

2. **How does LLM scoring integrate?**
   - What does `scores_method: 'llm'` mean? Is it replacing PrincipleEvaluator or supplementing it?

3. **Are policy constraints considered?**
   - Does SymbiEvaluator's policy constraints affect receipt generation, or is it applied later?

4. **Score normalization:**
   - If PrincipleEvaluator returns 0-10 scores, are they divided by 10 for receipt storage (0-1)?

5. **Multiple receipts consistency:**
   - If same conversation is logged twice, do principle scores match exactly?

6. **Python SDK:**
   - Does Python SDK calculate scores the same way as JavaScript?

---

## 📝 Deliverables Needed

1. **Architecture Diagram**: Showing data flow from system state → scoring → receipt storage → frontend display
2. **Scoring Algorithm Specification**: Exact formulas for each principle calculation
3. **Integration Tests**: Cross-system consistency validation
4. **Frontend Explanation UI**: Show score breakdown on receipt viewing
5. **Python SDK**: Full parity with JavaScript
6. **Verification Playground Update**: Can independently verify principle scores

---

## Timeline Estimate

| Phase | Task | Effort | Blocker |
|-------|------|--------|---------|
| 1 | Audit & Documentation | 4 hrs | No |
| 2 | Score Mapping & Explainability | 6 hrs | No |
| 3 | Test Hardening | 8 hrs | No |
| 4 | Python SDK | 6 hrs | Phase 2 complete |
| **Total** | **Full Hardening** | **24 hrs** | **~3-4 days** |

---

**Status**: Ready for sprint planning  
**Priority**: 🔴 Critical (impacts trust & verification)  
**Owner**: Engineering Team  
**Review Date**: Within 7 days of completion
