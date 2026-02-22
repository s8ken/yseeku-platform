# SYMBI Scoring Remediation Plan - FULL FIX (6-7 hours)

**Issues**: 
1. We document principle scores in receipts, but don't store them
2. We document customizable weights per industry/org, but use hardcoded defaults 
3. Receipts lack audit trail showing which weights were used for calculation

**Impact**: Receipt verification impossible; customization feature non-functional; specification misaligned  
**Priority**: CRITICAL (blocks production deployment)  
**Effort**: 6-7 hours (full audit-ready implementation)  

---

## Problem Statement

### What We Say ✍️
- [TRUST_RECEIPT_SPECIFICATION_v1.md](docs/TRUST_RECEIPT_SPECIFICATION_v1.md): "SYMBI principles integration (6 constitutional principles)"
- [SPRINT_COMPLETION_SUMMARY.md](SPRINT_COMPLETION_SUMMARY.md): "Receipt captures principle scores"
- Frontend tests expect: `consent_score`, `inspection_score`, etc. in receipt

### What We Actually Do 🔧
```typescript
// Current receipt storage - NO principle scores!
const receiptInput: CreateReceiptInput = {
  telemetry: {
    resonance_score: trustScore.overall / 100,     // ← CIQ only
    ciq_metrics: { clarity, integrity, quality },  // ← CIQ only
    truth_debt: 0.1
  }
  // principles NOT included!
};

// Stored in DB
await TrustReceiptModel.updateOne({
  ciq_metrics: { ... },           // ← Stored
  sonateDimensions: { ... },      // ← Some data
  // No principle_scores field!
});
```

### The Gaps
- **Gap 1 - Missing Principle Scores**: Specification says receipts include all 6 SYMBI principles; code stores only CIQ metrics
- **Gap 2 - Hardcoded Weights**: Specification says scoring is customizable per org/industry; code uses hardcoded weights (25%, 20%, 20%, 15%, 10%, 10%)
- **Gap 3 - No Weight Transparency**: Verifiers can't validate receipts because they don't know which weights were applied

**Examples of undocumented assumptions**:
```
Healthcare (documented in policy engine):
  CONSENT: 0.35 (not 0.25)
  ETHICAL_OVERRIDE: 0.20 (not 0.15)
  
Finance (documented in policy engine):
  INSPECTION: 0.30 (not 0.20)
  CONTINUOUS_VALIDATION: 0.25 (not 0.20)

But LLMTrustEvaluator always uses standard weights regardless of tenant/industry!
```

### Result
Without weight metadata in receipts, even with principle scores, auditors can't independently verify:
- Was the weighted calculation correct?
- Which policy was applied?
- Is this receipt comparable to other orgs' receipts?

---

## Solution Architecture

### Phase 1: Backend - Principles + Weight Customization (50 min)

The solution integrates three key changes:

```
1. LLMTrustEvaluator loads tenant policy from PolicyEngine
2. Calculates weighted score using tenant-specific weights
3. Passes principles + weights + weight source to ReceiptGenerator
4. Receipt includes full auditability trail
```

#### Phase 1A: LLMTrustEvaluator - Load Tenant Policy (30 min)

**File**: `apps/backend/src/services/llm-trust-evaluator.service.ts`

```typescript
// Add PolicyEngine dependency
constructor(
  private policyEngine: PolicyEngineService,  // NEW
  private keysService: KeysService,
  private logger: Logger,
  private tenantId?: string                   // NEW
) {}

// Get weights for this tenant/industry
private async getWeightsForEvaluation(): Promise<{
  weights: Record<TrustPrincipleKey, number>;
  policyId: string;
  source: 'standard' | 'healthcare' | 'finance' | 'government' | 'custom';
}> {
  const defaultWeights = {
    CONSENT_ARCHITECTURE: 0.25,
    INSPECTION_MANDATE: 0.20,
    CONTINUOUS_VALIDATION: 0.20,
    ETHICAL_OVERRIDE: 0.15,
    RIGHT_TO_DISCONNECT: 0.10,
    MORAL_RECOGNITION: 0.10,
  };

  // If tenant has policy, load from PolicyEngine
  if (this.tenantId) {
    try {
      const policy = await this.policyEngine.getPolicyForTenant(this.tenantId);
      if (policy?.customWeights) {
        return {
          weights: { ...defaultWeights, ...policy.customWeights },
          policyId: policy.id,
          source: policy.industry as any,
        };
      }
    } catch (error) {
      this.logger.warn(`Could not load policy for tenant ${this.tenantId}, using default`, error);
    }
  }

  return {
    weights: defaultWeights,
    policyId: 'base-standard',
    source: 'standard',
  };
}

// Update calculateTrustScore to use passed weights
private calculateTrustScore(
  principles: PrincipleScores,
  violations: ViolationList,
  weights: Record<TrustPrincipleKey, number>  // NEW: passed weights
): TrustEvaluationResult {
  // Critical violations override everything
  if (principles.CONSENT_ARCHITECTURE === 0 || principles.ETHICAL_OVERRIDE === 0) {
    return {
      overall_score: 0,
      trust_status: 'FAIL',
      critical_violation: true
    };
  }

  // Calculate weighted average using passed weights
  const weightedScore = 
    principles.CONSENT_ARCHITECTURE * weights.CONSENT_ARCHITECTURE +
    principles.INSPECTION_MANDATE * weights.INSPECTION_MANDATE +
    principles.CONTINUOUS_VALIDATION * weights.CONTINUOUS_VALIDATION +
    principles.ETHICAL_OVERRIDE * weights.ETHICAL_OVERRIDE +
    principles.RIGHT_TO_DISCONNECT * weights.RIGHT_TO_DISCONNECT +
    principles.MORAL_RECOGNITION * weights.MORAL_RECOGNITION;

  const overall = Math.round(weightedScore * 10);

  return {
    overall_score: overall,
    trust_status: overall >= 70 ? 'PASS' : overall >= 50 ? 'PARTIAL' : 'FAIL'
  };
}

// Update evaluate() to load and use tenant weights
async evaluate(
  aiMessage: string,
  context: ConversationContext
): Promise<TrustEvaluationResult> {
  // Build prompt and call Claude
  const claidesResponse = await this.callLLM(aiMessage, context);
  
  // NEW: Load tenant weights
  const { weights, policyId, source } = await this.getWeightsForEvaluation();
  
  const principles = this.parseLLMResponse(claidesResponse);
  const violations = this.detectViolations(principles, context);
  
  // Calculate with tenant weights (not hardcoded)
  const result = this.calculateTrustScore(principles, violations, weights);
  
  // Return with weight metadata
  return {
    ...result,
    weight_source: source,
    weight_policy_id: policyId,
    weights_applied: weights
  };
}
```

#### Phase 1B: Update conversation.routes (20 min)

**File**: `apps/backend/src/routes/conversation.routes.ts` (lines 730-750)

```typescript
// Pass tenant context to evaluator
const tenantId = req.userTenant || 'default';
const evaluator = new LLMTrustEvaluator({ tenantId });

// Call evaluate - now returns weight metadata
const aiTrustEval = await evaluator.evaluate(
  aiMessage.content,
  { conversation: conversation.toJSON(), userMessage: userMsg.content }
);

// Result includes weights:
// {
//   overall_score: 80,
//   trust_status: 'PASS',
//   weight_source: 'healthcare',
//   weight_policy_id: 'industry-healthcare',
//   weights_applied: { CONSENT_ARCHITECTURE: 0.35, ... }
// }
```

### Phase 2: ReceiptGeneratorService - Store Principles + Weights (30 min)

**File**: `packages/core/src/receipts/receipt-generator.service.ts`

```typescript
// Extend CreateReceiptInput to include principles + weights
export interface CreateReceiptInput {
  session_id: string;
  agent_did: string;
  human_did: string;
  policy_version?: string;
  interaction: { prompt: string; response: string; model: string };
  
  // NEW: Principles and weights
  principles?: PrincipleScores;
  overall_trust_score?: number;
  trust_status?: 'PASS' | 'PARTIAL' | 'FAIL';
  principle_weights?: Record<TrustPrincipleKey, number>;
  weight_source?: string;
  weight_policy_id?: string;
  
  telemetry: {
    resonance_score: number;
    ciq_metrics: { clarity: number; integrity: number; quality: number };
  };
}

// Update createReceipt() to include principles + weights
async createReceipt(input: CreateReceiptInput, privateKey: Buffer): Promise<TrustReceiptV2> {
  const receiptContent: any = {
    version: input.policy_version || '2.0.0',
    timestamp: new Date().toISOString(),
    session_id: input.session_id,
    agent_did: input.agent_did,
    human_did: input.human_did,
    telemetry: {
      ...input.telemetry,
      
      // NEW: Include principles and weights in telemetry
      ...(input.principles ? {
        sonate_principles: input.principles,
        overall_trust_score: input.overall_trust_score || 0,
        trust_status: input.trust_status || 'PARTIAL',
        principle_weights: input.principle_weights || {},
        weight_source: input.weight_source || 'standard',
        weight_policy_id: input.weight_policy_id || 'base-standard',
      } : {})
    },
  };

  // Sign receipt (includes weight data now)
  const canonical = canonicalize(receiptContent);
  const signature = await keysService.sign(canonical);

  return { ...receiptContent, signature };
}
```

### Phase 3: Database Schema & Storage (30 min)

**File**: `apps/backend/src/models/trust-receipt.model.ts`

```typescript
const trustReceiptSchema = new mongoose.Schema({
  self_hash: String,
  receipt_id: String,
  session_id: String,
  timestamp: Date,
  
  // Existing CIQ metrics (0-1)
  ciq_metrics: {
    clarity: Number,
    integrity: Number,
    quality: Number
  },
  
  // NEW: Principle scores (0-10)
  sonate_principles: {
    CONSENT_ARCHITECTURE: Number,
    INSPECTION_MANDATE: Number,
    CONTINUOUS_VALIDATION: Number,
    ETHICAL_OVERRIDE: Number,
    RIGHT_TO_DISCONNECT: Number,
    MORAL_RECOGNITION: Number
  },
  
  // NEW: Score context
  overall_trust_score: Number,      // 0-100
  trust_status: String,             // PASS|PARTIAL|FAIL
  
  // NEW: Weight metadata (audit trail)
  principle_weights: {
    CONSENT_ARCHITECTURE: Number,
    INSPECTION_MANDATE: Number,
    CONTINUOUS_VALIDATION: Number,
    ETHICAL_OVERRIDE: Number,
    RIGHT_TO_DISCONNECT: Number,
    MORAL_RECOGNITION: Number
  },
  weight_source: String,            // 'standard'|'healthcare'|'finance'|etc
  weight_policy_id: String,         // Reference to policy
  
  // ... existing signature, chain, etc
});
```

**Update persistence in conversation.routes** (lines 774-801):

```typescript
await TrustReceiptModel.updateOne(
  { self_hash: aiTrustEval.receiptHash },
  {
    $set: {
      self_hash: aiTrustEval.receiptHash,
      receipt_id: v2Receipt.id,
      session_id: conversation._id.toString(),
      
      // Existing CIQ metrics
      ciq_metrics: v2Receipt.telemetry?.ciq_metrics,
      
      // NEW: Principle scores from receipt
      sonate_principles: v2Receipt.telemetry?.sonate_principles,
      overall_trust_score: v2Receipt.telemetry?.overall_trust_score,
      trust_status: v2Receipt.telemetry?.trust_status,
      
      // NEW: Weight metadata
      principle_weights: v2Receipt.telemetry?.principle_weights,
      weight_source: v2Receipt.telemetry?.weight_source,
      weight_policy_id: v2Receipt.telemetry?.weight_policy_id,
    }
  },
  { upsert: true }
);
```

### Phase 4: Frontend Display (45 min)

**File**: `apps/web/src/components/trust-receipt/TrustReceiptCard.tsx`

```typescript
interface TrustReceipt {
  scores: {
    clarity: number;
    integrity: number;
    quality: number;
    consent_score?: number;      // 0-10
    inspection_score?: number;
    validation_score?: number;
    override_score?: number;
    disconnect_score?: number;
    recognition_score?: number;
  };
  overall_score?: number;        // 0-100
  trust_status?: string;
  weight_source?: string;        // Which policy
  weight_policy_id?: string;
  principle_weights?: Record<string, number>;
}

function TrustReceiptCard({ receipt }: { receipt: TrustReceipt }) {
  const principles = {
    CONSENT: receipt.scores.consent_score || 0,
    INSPECTION: receipt.scores.inspection_score || 0,
    VALIDATION: receipt.scores.validation_score || 0,
    OVERRIDE: receipt.scores.override_score || 0,
    DISCONNECT: receipt.scores.disconnect_score || 0,
    RECOGNITION: receipt.scores.recognition_score || 0,
  };

  return (
    <div className="trust-receipt-card">
      {/* Overall score */}
      <h2>{receipt.overall_score}/100</h2>
      <span className="status">{receipt.trust_status}</span>

      {/* NEW: Weight source badge */}
      {receipt.weight_source && (
        <div className="weight-source-badge">
          <span>Policy: {receipt.weight_source}</span>
          {receipt.weight_policy_id && (
            <span className="policy-id">{receipt.weight_policy_id.substring(0, 16)}...</span>
          )}
        </div>
      )}

      {/* Principles */}
      <div className="principles-grid">
        {Object.entries(principles).map(([name, score]) => (
          <PrincipleScore 
            key={name}
            name={name} 
            score={score}
            weight={receipt.principle_weights?.[name]}
            color={getColor(score)}  // Green if ≥8, yellow if 6-8, red if <6
          />
        ))}
      </div>

      {/* Verification */}
      {receipt.principle_weights && (
        <div className="verification">
          <details>
            <summary>Verify Calculation</summary>
            <CalculationVerifier 
              principles={principles}
              weights={receipt.principle_weights}
              expected={receipt.overall_score}
            />
          </details>
        </div>
      )}
    </div>
  );
}

function CalculationVerifier({ principles, weights, expected }) {
  const calculated = Math.round(
    Object.entries(principles).reduce((sum, [key, score]) => {
      const weight = weights[key] || 0;
      return sum + (score * weight);
    }, 0) * 10
  );
  
  const verified = calculated === expected;
  return (
    <div className={verified ? 'verified' : 'failed'}>
      {verified ? '✅' : '⚠️'} Calculated: {calculated}/100, Expected: {expected}/100
    </div>
  );
}
```

### Phase 5: Documentation (45 min)

**Update**: `docs/TRUST_RECEIPT_SPECIFICATION_v1.md`

Add sections:
```markdown
## Receipt Schema - Version 2.1

### telemetry Object (Complete)

```json
{
  "telemetry": {
    "ciq_metrics": {
      "clarity": 0.8,
      "integrity": 0.8,
      "quality": 0.85
    },
    
    "sonate_principles": {
      "CONSENT_ARCHITECTURE": 8,      // 0-10
      "INSPECTION_MANDATE": 7,
      "CONTINUOUS_VALIDATION": 8,
      "ETHICAL_OVERRIDE": 9,
      "RIGHT_TO_DISCONNECT": 8,
      "MORAL_RECOGNITION": 8
    },
    
    "principle_weights": {
      "CONSENT_ARCHITECTURE": 0.25,
      "INSPECTION_MANDATE": 0.20,
      "CONTINUOUS_VALIDATION": 0.20,
      "ETHICAL_OVERRIDE": 0.15,
      "RIGHT_TO_DISCONNECT": 0.10,
      "MORAL_RECOGNITION": 0.10
    },
    
    "overall_trust_score": 80,
    "trust_status": "PASS",
    "weight_source": "standard",
    "weight_policy_id": "base-standard",
    
    "resonance_score": 0.80,
    "coherence_score": 0.80,
    "truth_debt": 0.1
  }
}
```

### Weighted Calculation Formula

```
overall = round(
  (CONSENT * 0.25) +
  (INSPECTION * 0.20) +
  (VALIDATION * 0.20) +
  (OVERRIDE * 0.15) +
  (DISCONNECT * 0.10) +
  (RECOGNITION * 0.10)
) * 10

Example: (8*0.25 + 7*0.20 + 8*0.20 + 9*0.15 + 8*0.10 + 8*0.10) * 10 = 80
```

### Industry Weight Examples

| Source | CONSENT | INSPECTION | VALIDATION | OVERRIDE | DISCONNECT | RECOGNITION |
|--------|---------|------------|-----------|----------|------------|-------------|
| standard | 25% | 20% | 20% | 15% | 10% | 10% |
| healthcare | 35% | 20% | 15% | 20% | 5% | 5% |
| finance | 20% | 30% | 25% | 10% | 5% | 5% |
| government | 30% | 25% | 20% | 15% | 5% | 5% |
```

**Create**: `docs/WEIGHT_CUSTOMIZATION_GUIDE.md`

```markdown
# Weight Customization Guide

Different industries prioritize different principles. Receipts include `weight_source` to indicate which policy was applied.

To set custom weights for your organization:
1. Contact support with desired distribution
2. Weights validated & stored in PolicyEngine
3. All subsequent receipts include weight metadata for verification
```

### Phase 6: Testing (90 min)

**Unit Tests**: `packages/trust-receipts/src/tests/tenant-weights.test.ts`

```typescript
describe('Tenant Weight Calculation', () => {
  it('should calculate with standard weights', () => {
    const principles = {
      CONSENT_ARCHITECTURE: 8,
      INSPECTION_MANDATE: 7,
      CONTINUOUS_VALIDATION: 8,
      ETHICAL_OVERRIDE: 9,
      RIGHT_TO_DISCONNECT: 8,
      MORAL_RECOGNITION: 8
    };
    
    const weights = {
      CONSENT_ARCHITECTURE: 0.25,
      INSPECTION_MANDATE: 0.20,
      CONTINUOUS_VALIDATION: 0.20,
      ETHICAL_OVERRIDE: 0.15,
      RIGHT_TO_DISCONNECT: 0.10,
      MORAL_RECOGNITION: 0.10
    };
    
    const score = calculateWeightedScore(principles, weights);
    expect(score).toBe(80);
  });

  it('should calculate with healthcare weights', () => {
    // Same principles, different weights → different result
    const healthcareWeights = { CONSENT: 0.35, OVERRIDE: 0.20, ... };
    const score = calculateWeightedScore(principles, healthcareWeights);
    expect(score).toBe(79);  // Different!
  });

  it('should critical violation override weights', () => {
    const principles = { CONSENT_ARCHITECTURE: 0, ...others: 10 };
    const result = generateReceiptWithWeights({ principles, weights });
    expect(result.overall_trust_score).toBe(0);
    expect(result.trust_status).toBe('FAIL');
  });
});
```

**Integration Tests**: `apps/backend/src/__tests__/conversation-weights.test.ts`

```typescript
describe('Custom Weights E2E', () => {
  it('should use healthcare weights for healthcare tenant', async () => {
    const response = await request(app)
      .post(`/api/conversations/${id}/messages`)
      .set('X-Tenant-ID', 'healthcare-org')
      .send({ content: 'Test' });

    const receipt = response.body.data.trustEvaluation.receipt;
    expect(receipt.telemetry.weight_source).toBe('healthcare');
    expect(receipt.telemetry.principle_weights.CONSENT_ARCHITECTURE).toBe(0.35);
  });

  it('should persist weights in database', async () => {
    const response = await request(app).post(...);
    const storedReceipt = await TrustReceiptModel.findOne({
      self_hash: response.body.data.trustEvaluation.receiptHash
    });
    
    expect(storedReceipt.weight_source).toBe('healthcare');
    expect(storedReceipt.principle_weights).toBeDefined();
  });

  it('should verify calculation matches stored weights', async () => {
    const response = await request(app).post(...);
    const receipt = response.body.data.trustEvaluation.receipt;
    
    const manual = (
      receipt.telemetry.sonate_principles.CONSENT * 0.35 +
      receipt.telemetry.sonate_principles.INSPECTION * 0.20 + ...
    ) * 10;
    
    expect(manual).toBe(receipt.telemetry.overall_trust_score);
  });
});
```

**Verification Tests**: Check signature integrity over weights

```typescript
it('should signature cover weight data', () => {
  const receipt = generateReceipt({ principles, weights });
  const verified = verifySignature(receipt);
  expect(verified).toBe(true);
  
  // Tampering with weights fails signature
  receipt.telemetry.principle_weights.CONSENT = 0.50;
  expect(verifySignature(receipt)).toBe(false);
});
```

---

## Implementation Checklist

- [ ] **Phase 1A (30 min)**: Load tenant weights from PolicyEngine
  - [ ] Add PolicyEngine dependency
  - [ ] Implement getWeightsForEvaluation()
  - [ ] Update calculateTrustScore() signature

- [ ] **Phase 1B (20 min)**: Use in evaluate()
  - [ ] Load weights before calculating
  - [ ] Pass weights to receipt generator
  - [ ] Return weight metadata

- [ ] **Phase 2 (30 min)**: Store in receipts
  - [ ] Extend CreateReceiptInput interface
  - [ ] Update receipt structure with principles + weights
  - [ ] Include in canonical JSON

- [ ] **Phase 3 (30 min)**: Database schema
  - [ ] Add sonate_principles, principle_weights to schema
  - [ ] Update persistence logic
  - [ ] Verify storage format

- [ ] **Phase 4 (45 min)**: Frontend display
  - [ ] Update TrustReceiptCard component
  - [ ] Show weight source badge
  - [ ] Add calculation verifier widget

- [ ] **Phase 5 (45 min)**: Documentation
  - [ ] Update specification with new schema
  - [ ] Create customization guide
  - [ ] Document weighted formula

- [ ] **Phase 6 (90 min)**: Testing
  - [ ] Unit tests for weighted calculation
  - [ ] Integration tests for tenant weights
  - [ ] Verification tests for signatures
  - [ ] Run full test suite

---

## Success Criteria

✅ Principle scores (0-10) included in all receipts  
✅ Weight metadata included for audit trail  
✅ Tenant-specific weights loaded from PolicyEngine  
✅ Frontend displays weights with source  
✅ Auditors can verify calculations independently  
✅ All tests passing  
✅ Signature covers weight data  
✅ Database schema updated  
✅ Documentation aligned  

---

## Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1A | PolicyEngine integration | 30 min |
| 1B | Use tenant weights | 20 min |
| 2 | ReceiptGenerator updates | 30 min |
| 3 | Database schema | 30 min |
| 4 | Frontend | 45 min |
| 5 | Documentation | 45 min |
| 6 | Testing | 90 min |
| **Total** | | **6-7 hours** |

---

## Risk Mitigation

- **Schema Migration**: Add optional fields first (backward compatible)
- **Fallback**: If PolicyEngine fails, use standard weights
- **Verification**: Signature ensures integrity of weight data
- **Gradual Rollout**: 10% canary → full deployment
