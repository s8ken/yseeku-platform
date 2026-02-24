# SYMBI Scoring Remediation Plan - FULL FIX

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

## Overall Architecture

```
Current State (BROKEN):
  Claude (scores principles 0-10)
    → LLMTrustEvaluator (hardcoded weights, no customization)
    → Receipt (NO principles, NO weights, only CIQ metrics)
    → Frontend (shows partial data)
    → Auditor (can't verify)

Target State (PRODUCTION-READY):
  Claude (scores principles 0-10)
    → LLMTrustEvaluator (loads tenant weights from PolicyEngine)
    → Calculate overall (using tenant-specific weights)
    → Receipt (includes principles + weights + weight_source for full audit trail)
    → Database (stores everything for verification)
    → Frontend (displays principles with weight context)
    → Auditor (can independently verify calculation)
```

---

## Solution Architecture

### Option A: Full Audit-Ready Architecture (Recommended) ✅

**Change**: Extend receipt with principles, weights, and weight source

```typescript
// New receipt structure with full audit trail
const receiptInput: CreateReceiptInput = {
  interaction: { prompt, response, model },
  telemetry: {
    // Existing CIQ metrics (0-1)
    ciq_metrics: {
      clarity: 0.8,
      integrity: 0.8,
      quality: 0.85
    },
    
    // NEW: Principle scores (0-10)
    sonate_principles: {
      CONSENT_ARCHITECTURE: 8,        // 0-10
      INSPECTION_MANDATE: 7,          // 0-10
      CONTINUOUS_VALIDATION: 8,       // 0-10
      ETHICAL_OVERRIDE: 9,            // 0-10
      RIGHT_TO_DISCONNECT: 8,         // 0-10
      MORAL_RECOGNITION: 8            // 0-10
    },
    
    // NEW: Weights used for this receipt (audit trail)
    principle_weights: {
      CONSENT_ARCHITECTURE: 0.25,
      INSPECTION_MANDATE: 0.20,
      CONTINUOUS_VALIDATION: 0.20,
      ETHICAL_OVERRIDE: 0.15,
      RIGHT_TO_DISCONNECT: 0.10,
      MORAL_RECOGNITION: 0.10
    },
    
    // NEW: Weight source for reference
    weight_source: 'standard',         // 'standard'|'healthcare'|'finance'|'custom'
    weight_policy_id: 'base-standard', // Reference to policy engine policy
    
    // NEW: Overall score context
    overall_trust_score: 80,           // 0-100 (calculated with above weights)
    trust_status: 'PASS',              // PASS|PARTIAL|FAIL
    
    // Existing
    resonance_score: 0.80,
    coherence_score: 0.80,
    truth_debt: 0.1
  },
  chain: { ... },
  signature: { ... }
};
```

**Files to modify**:
1. `packages/core/src/receipts/receipt-generator.service.ts` - Accept principles + weights
2. `apps/backend/src/services/llm-trust-evaluator.service.ts` - Load tenant policy, pass weights
3. `apps/backend/src/models/trust-receipt.model.ts` - Extended schema with weights
4. `apps/backend/src/routes/conversation.routes.ts` - Pass tenant context to evaluator
5. `apps/web/src/components/trust-receipt/TrustReceiptCard.tsx` - Display weights
6. `docs/TRUST_RECEIPT_SPECIFICATION_v1.md` - Document new schema + calculations

**Verification benefit**: Auditors can verify:
- Each principle was scored 0-10
- Weights were applied correctly
- Weighted calculation matches documented policy
- Custom weights as needed per tenant
- Critical violations enforced
- Overall score derivation

---

### Option B: Phased Approach (Alternative)

Phase 1 (2 hours): Add principles only, use standard weights
Phase 2 (2 hours): Add custom weight support

**Recommendation**: Use **Option A** (full fix) — doing it twice wastes time, Phase 1 creates tech debt.

---

## Implementation Tasks

### Phase 1A: LLMTrustEvaluator - Load Tenant Policy (30 minutes)

### Phase 1A: LLMTrustEvaluator - Load Tenant Policy (30 minutes)

**T1A.1: Add PolicyEngine dependency**

File: `apps/backend/src/services/llm-trust-evaluator.service.ts`

```typescript
import { IndustryPoliciesManager } from '@sonate/policy-engine';

export class LLMTrustEvaluator {
  private defaultProvider: string = 'anthropic';
  private defaultModel: string = 'claude-3-haiku-20240307';
  private receiptGenerator = new ReceiptGeneratorService();
  private policyManager = new IndustryPoliciesManager();  // NEW
  private tenantId?: string;                             // NEW
  private industryType?: string;                         // NEW

  constructor(options?: { 
    provider?: string; 
    model?: string;
    tenantId?: string;                                   // NEW
    industryType?: string;                               // NEW
  }) {
    if (options?.provider) this.defaultProvider = options.provider;
    if (options?.model) this.defaultModel = options.model;
    if (options?.tenantId) this.tenantId = options.tenantId;       // NEW
    if (options?.industryType) this.industryType = options.industryType; // NEW
  }
}
```

**T1A.2: Add method to get policy weights**

```typescript
/**
 * Get weights for this tenant/industry
 */
private async getWeightsForEvaluation(): Promise<{
  weights: Record<TrustPrincipleKey, number>;
  policyId: string;
  source: 'standard' | 'healthcare' | 'finance' | 'government' | 'custom';
}> {
  // Default to standard weights
  const defaultWeights = {
    CONSENT_ARCHITECTURE: 0.25,
    INSPECTION_MANDATE: 0.20,
    CONTINUOUS_VALIDATION: 0.20,
    ETHICAL_OVERRIDE: 0.15,
    RIGHT_TO_DISCONNECT: 0.10,
    MORAL_RECOGNITION: 0.10,
  };

  // If tenant has industry policy, load from policyManager
  if (this.industryType) {
    try {
      const policy = this.policyManager.getIndustryPolicy(this.industryType);
      if (policy && policy.customWeights) {
        return {
          weights: {
            CONSENT_ARCHITECTURE: policy.customWeights.CONSENT_ARCHITECTURE ?? defaultWeights.CONSENT_ARCHITECTURE,
            INSPECTION_MANDATE: policy.customWeights.INSPECTION_MANDATE ?? defaultWeights.INSPECTION_MANDATE,
            CONTINUOUS_VALIDATION: policy.customWeights.CONTINUOUS_VALIDATION ?? defaultWeights.CONTINUOUS_VALIDATION,
            ETHICAL_OVERRIDE: policy.customWeights.ETHICAL_OVERRIDE ?? defaultWeights.ETHICAL_OVERRIDE,
            RIGHT_TO_DISCONNECT: policy.customWeights.RIGHT_TO_DISCONNECT ?? defaultWeights.RIGHT_TO_DISCONNECT,
            MORAL_RECOGNITION: policy.customWeights.MORAL_RECOGNITION ?? defaultWeights.MORAL_RECOGNITION,
          },
          policyId: policy.id,
          source: policy.industry as any,  // healthcare|finance|etc
        };
      }
    } catch (error) {
      logger.warn('Failed to load industry policy, using defaults', { error: getErrorMessage(error), industryType: this.industryType });
    }
  }

  // Fallback to standard
  return {
    weights: defaultWeights,
    policyId: 'base-standard',
    source: 'standard',
  };
}
```

**T1A.3: Update calculateTrustScore signature**

```typescript
/**
 * Calculate weighted trust score using specified weights
 */
private calculateTrustScore(
  principles: PrincipleScores, 
  violations: string[],
  weights?: Record<TrustPrincipleKey, number>  // NEW: optional custom weights
): TrustScore {
  // Use provided weights or defaults
  const applicableWeights = weights || {
    CONSENT_ARCHITECTURE: 0.25,
    INSPECTION_MANDATE: 0.20,
    CONTINUOUS_VALIDATION: 0.20,
    ETHICAL_OVERRIDE: 0.15,
    RIGHT_TO_DISCONNECT: 0.10,
    MORAL_RECOGNITION: 0.10,
  };

  // Check for critical violations
  if (principles.CONSENT_ARCHITECTURE === 0 || principles.ETHICAL_OVERRIDE === 0) {
    const criticalViolations: TrustPrincipleKey[] = [];
    if (principles.CONSENT_ARCHITECTURE === 0) criticalViolations.push('CONSENT_ARCHITECTURE');
    if (principles.ETHICAL_OVERRIDE === 0) criticalViolations.push('ETHICAL_OVERRIDE');
    
    return {
      overall: 0,
      principles,
      violations: [...criticalViolations, ...mappedViolations.filter(v => !criticalViolations.includes(v))],
      timestamp: Date.now(),
      weights: applicableWeights,    // NEW: include weights in result
      weightSource: 'not-applicable', // NEW: why critical failure
    };
  }

  // Calculate weighted average with provided weights
  let weightedSum = 0;
  for (const [principle, weight] of Object.entries(applicableWeights)) {
    weightedSum += (principles[principle as keyof PrincipleScores] || 0) * weight;
  }

  const overall = Math.round(weightedSum * 10);

  return {
    overall,
    principles,
    violations: mappedViolations,
    timestamp: Date.now(),
    weights: applicableWeights,    // NEW: return weights used
    weightSource: 'standard',      // NEW: will be set by caller
  };
}
```

### Phase 1B: Modify evaluate() to use tenant weights (20 minutes)

**T1B.1: Update evaluate() method**

File: `apps/backend/src/services/llm-trust-evaluator.service.ts` (around line 160)

```typescript
async evaluate(
  aiResponse: IMessage,
  context: LLMEvaluationContext
): Promise<LLMTrustEvaluation> {
  const startTime = Date.now();
  
  try {
    // Build the evaluation prompt
    const evaluationPrompt = this.buildEvaluationPrompt(aiResponse, context);
    
    // Call LLM for evaluation
    const messages: ChatMessage[] = [
      { role: 'system', content: TRUST_EVALUATOR_SYSTEM_PROMPT },
      { role: 'user', content: evaluationPrompt }
    ];

    const llmResponse = await llmService.generate({
      provider: this.defaultProvider,
      model: this.defaultModel,
      messages,
      temperature: 0.1,
      maxTokens: 1000,
    });

    // Parse the LLM response
    const evaluation = this.parseLLMResponse(llmResponse.content);
    
    // NEW: Get tenant-specific weights
    const { weights, policyId, source } = await this.getWeightsForEvaluation();
    
    // Calculate overall trust score using tenant weights
    const trustScore = this.calculateTrustScore(evaluation.principles, evaluation.violations, weights);
    const status = this.getStatus(trustScore.overall);

    // Generate V2 trust receipt
    const platformDID = didService.getPlatformDID();
    const agentDID = context.agentId ? didService.getAgentDID(context.agentId) : `${platformDID}:agents:unknown`;

    const ciqMetrics = {
      clarity: evaluation.detection.reality_index / 10,
      integrity: evaluation.detection.ethical_alignment / 5,
      quality: evaluation.detection.canvas_parity / 100,
    };

    // NEW: Include principles, weights, and weight source in receipt
    const receiptInput: CreateReceiptInput = {
      session_id: context.sessionId || context.conversationId,
      agent_did: agentDID,
      human_did: `${platformDID}:users:${context.userId || 'unknown'}`,
      policy_version: '2.0.0',  // NEW: Bump version to include weights
      mode: 'constitutional',
      interaction: {
        prompt: (context.userPrompt || '').substring(0, 1000),
        response: aiResponse.content.substring(0, 2000),
        model: this.defaultModel,
      },
      
      // NEW: Pass principles and weights to receipt
      principles: evaluation.principles,
      overall_trust_score: trustScore.overall,
      trust_status: status,
      principle_weights: weights,
      weight_source: source,
      weight_policy_id: policyId,
      
      telemetry: {
        resonance_score: trustScore.overall / 100,
        coherence_score: ciqMetrics.integrity,
        truth_debt: 0.1,
        ciq_metrics: ciqMetrics,
      },
    };

    let receipt: TrustReceiptV2;
    try {
      const privateKey = await keysService.getPrivateKey();
      receipt = await this.receiptGenerator.createReceipt(receiptInput, Buffer.from(privateKey));
    } catch (error) {
      logger.warn('Failed to create V2 LLM trust receipt, using unsigned stub', { error: getErrorMessage(error) });
      receipt = { /* unsigned stub */ };
    }

    logger.info('LLM Trust Evaluation completed', {
      conversationId: context.conversationId,
      trustScore: trustScore.overall,
      status,
      weightSource: source,
      evaluationTimeMs: Date.now() - startTime,
    });

    return {
      trustScore,
      status,
      detection: { /* ... */ },
      ciq_metrics: ciqMetrics,
      reasoning: evaluation.reasoning,
      receipt,
      receiptHash: receipt.id,
      weightSource: source,  // NEW: expose for transparency
      weightPolicyId: policyId,  // NEW: expose for transparency
      // ... rest of return
    };
  } catch (error) {
    logger.error('LLM Trust Evaluation failed, falling back to heuristic', { 
      error: getErrorMessage(error),
      conversationId: context.conversationId 
    });
    return this.fallbackHeuristicEvaluation(aiResponse, context);
  }
}
```

### Phase 2: ReceiptGeneratorService - Accept Principles + Weights (30 minutes)

**T2.1: Update TrustReceiptCard Component**

File: `apps/web/src/components/trust-receipt/TrustReceiptCard.tsx`

```typescript
// Component expects receipt with principles
interface TrustReceipt {
  version: string;
  scores: {
    // Existing CIQ
    clarity: number;
    integrity: number;
    quality: number;
    
    // NEW: Principles from receipt.telemetry.sonate_principles
    consent_score?: number;
    inspection_score?: number;
    validation_score?: number;
    override_score?: number;
    disconnect_score?: number;
    recognition_score?: number;
  };
  overall_score?: number;
  trust_status?: string;
}

// In component render
function TrustReceiptCard({ receipt }: { receipt: TrustReceipt }) {
  // Map receipt.telemetry.sonate_principles to component props
  const principles = {
    CONSENT: receipt.scores.consent_score || 0,
    INSPECTION: receipt.scores.inspection_score || 0,
    // ... etc
  };
  
  return (
    <>
      {/* Render principles with colors based on 0-10 range */}
      {Object.entries(principles).map(([name, score]) => (
        <PrincipleScore 
          name={name} 
          score={score / 10}  // Normalize to 0-1 for display
          color={score >= 8 ? 'green' : score >= 6 ? 'yellow' : 'red'}
        />
      ))}
    </>
  );
}
```

**T2.2: Update Component Tests**

File: `apps/web/src/components/trust-receipt/TrustReceiptUI.test.tsx`

```typescript
// Update mock receipt
const mockReceipt = {
  version: '2.0.0',
  scores: {
    clarity: 0.95,
    integrity: 0.88,
    quality: 0.91,
    
    // NEW: Principles (0-10 from receipt, display as 0-1)
    consent_score: 8,        // 0-10 from sonate_principles
    inspection_score: 7,     // Display: 0.7 (70%)
    validation_score: 8,
    override_score: 9,
    disconnect_score: 8,
    recognition_score: 8
  },
  overall_score: 80,         // 0-100
  trust_status: 'PASS'
};

// Test principle display
it('should display all 6 SYMBI principles with correct scores', () => {
  render(<TrustReceiptCard receipt={mockReceipt} />);
  
  expect(screen.getByText(/CONSENT.*8\/10|8/)).toBeInTheDocument();
  expect(screen.getByText(/INSPECTION.*7\/10|7/)).toBeInTheDocument();
  // ... etc for all 6
});

// Test color coding based on 0-10 range
it('should color-code principles: green >=8, yellow 6-8, red <6', () => {
  // consent_score: 8 → green
  // inspection_score: 7 → yellow
  // etc.
});
```

---

### Phase 3: Documentation (30 minutes)

**T3.1: Update Specification**

File: `docs/TRUST_RECEIPT_SPECIFICATION_v1.md`

Add section:
```markdown
## Receipt Schema - Version 2.0.1

### telemetry Object (Updated)

The receipt telemetry now includes verified principle scores:

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
      "INSPECTION_MANDATE": 7,        // 0-10
      "CONTINUOUS_VALIDATION": 8,     // 0-10
      "ETHICAL_OVERRIDE": 9,          // 0-10
      "RIGHT_TO_DISCONNECT": 8,       // 0-10
      "MORAL_RECOGNITION": 8          // 0-10
    },
    
    "overall_trust_score": 80,   // 0-100 (weighted)
    "trust_status": "PASS",      // PASS|PARTIAL|FAIL
    
    "resonance_score": 0.80,
    "coherence_score": 0.80,
    "truth_debt": 0.1
  }
}
```

### Principle Score Encoding

All individual principle scores are encoded as integers 0-10, where:
- `0` = Principle violated (critical)
- `1-3` = Poor compliance
- `4-6` = Acceptable compliance
- `7-9` = Good compliance
- `10` = Excellent compliance

To convert to normalized range (0-1) for display: `score / 10`

### Weighted Calculation Verification

Verifiers can validate the trust scoring by applying weights:

```
overall = (
  CONSENT_ARCHITECTURE * 0.25 +
  INSPECTION_MANDATE * 0.20 +
  CONTINUOUS_VALIDATION * 0.20 +
  ETHICAL_OVERRIDE * 0.15 +
  RIGHT_TO_DISCONNECT * 0.10 +
  MORAL_RECOGNITION * 0.10
) * 10

Expected result ≈ overall_trust_score (within rounding)
```

### Critical Violation Rules

If `CONSENT_ARCHITECTURE = 0` OR `ETHICAL_OVERRIDE = 0`:
- `overall_trust_score` MUST be `0`
- `trust_status` MUST be `FAIL`
- Violation should be recorded in receipt violations list
```
```

**T3.2: Update README**

File: `README.md`

Add to "Trust Receipts" section:
```markdown
## Principle Scoring Details

Each receipt includes scoring for 6 SONATE constitutional principles (0-10 scale):

| Principle | Weight | Description |
|-----------|--------|-------------|
| CONSENT_ARCHITECTURE | 25% | User consent and permission validation |
| INSPECTION_MANDATE | 20% | Auditability and inspection capability |
| CONTINUOUS_VALIDATION | 20% | Real-time validation and monitoring |
| ETHICAL_OVERRIDE | 15% | Human override and ethical safeguards |
| RIGHT_TO_DISCONNECT | 10% | System exit and disconnection capability |
| MORAL_RECOGNITION | 10% | Moral agency and accountability |

**Overall Score**: Weighted average (0-100)
- **PASS** (70-100): Meets SYMBI requirements
- **PARTIAL** (40-69): Warning - needs review
- **FAIL** (0-39): Critical violation

All principle scores are cryptographically signed and can be independently verified.
```

---

### Phase 4: Testing (1 hour)

**T4.1: Unit Tests - Score Calculation**

File: `packages/trust-receipts/src/tests/principle-scoring.test.ts` (new)

```typescript
describe('Principle Scoring', () => {
  it('should include all 6 principles in receipt', () => {
    const receipt = generateReceipt({
      principles: {
        CONSENT_ARCHITECTURE: 8,
        INSPECTION_MANDATE: 7,
        CONTINUOUS_VALIDATION: 8,
        ETHICAL_OVERRIDE: 9,
        RIGHT_TO_DISCONNECT: 8,
        MORAL_RECOGNITION: 8
      },
      overall_trust_score: 80
    });
    
    expect(receipt.telemetry.sonate_principles).toMatchObject({
      CONSENT_ARCHITECTURE: 8,
      INSPECTION_MANDATE: 7,
      // ... all 6
    });
  });

  it('should verify weighted calculation', () => {
    const principles = {
      CONSENT_ARCHITECTURE: 8,      // 25% = 2.0
      INSPECTION_MANDATE: 7,         // 20% = 1.4
      CONTINUOUS_VALIDATION: 8,      // 20% = 1.6
      ETHICAL_OVERRIDE: 9,           // 15% = 1.35
      RIGHT_TO_DISCONNECT: 8,        // 10% = 0.8
      MORAL_RECOGNITION: 8           // 10% = 0.8
    };
    
    const expected = Math.round((2.0 + 1.4 + 1.6 + 1.35 + 0.8 + 0.8) * 10);
    
    const receipt = generateReceipt({
      principles,
      overall_trust_score: expected
    });
    
    expect(receipt.telemetry.overall_trust_score).toBe(80);
  });

  it('should enforce critical violation: CONSENT=0 → overall=0', () => {
    const receipt = generateReceipt({
      principles: {
        CONSENT_ARCHITECTURE: 0,     // CRITICAL!
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      }
    });
    
    expect(receipt.telemetry.overall_trust_score).toBe(0);
    expect(receipt.telemetry.trust_status).toBe('FAIL');
  });

  it('should enforce critical violation: OVERRIDE=0 → overall=0', () => {
    const receipt = generateReceipt({
      principles: {
        CONSENT_ARCHITECTURE: 10,
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 0,         // CRITICAL!
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      }
    });
    
    expect(receipt.telemetry.overall_trust_score).toBe(0);
    expect(receipt.telemetry.trust_status).toBe('FAIL');
  });
});
```

**T4.2: Integration Tests - End-to-End**

File: `apps/backend/src/__tests__/routes/conversation.test.ts` (extend)

```typescript
describe('POST /api/conversations/:id/messages - SYMBI Scoring', () => {
  it('should include principle scores in receipt', async () => {
    const response = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'What is 2+2?' });

    expect(response.status).toBe(200);
    
    const receipt = response.body.data.trustEvaluation.receipt;
    expect(receipt.telemetry.sonate_principles).toBeDefined();
    expect(receipt.telemetry.sonate_principles.CONSENT_ARCHITECTURE).toBeGreaterThanOrEqual(0);
    expect(receipt.telemetry.sonate_principles.CONSENT_ARCHITECTURE).toBeLessThanOrEqual(10);
    
    // All 6 principles present
    const principles = Object.keys(receipt.telemetry.sonate_principles);
    expect(principles).toContain('CONSENT_ARCHITECTURE');
    expect(principles).toContain('INSPECTION_MANDATE');
    // ... etc
  });

  it('should include overall score in receipt', async () => {
    const response = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test message' });

    const receipt = response.body.data.trustEvaluation.receipt;
    expect(receipt.telemetry.overall_trust_score).toBeGreaterThanOrEqual(0);
    expect(receipt.telemetry.overall_trust_score).toBeLessThanOrEqual(100);
    expect(['PASS', 'PARTIAL', 'FAIL']).toContain(receipt.telemetry.trust_status);
  });

  it('should persist principle scores in MongoDB', async () => {
    const response = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test message' });

    const receiptHash = response.body.data.trustEvaluation.receiptHash;
    const storedReceipt = await TrustReceiptModel.findOne({ self_hash: receiptHash });

    expect(storedReceipt.sonate_principles).toBeDefined();
    expect(storedReceipt.sonate_principles.CONSENT_ARCHITECTURE).toBeGreaterThanOrEqual(0);
    expect(storedReceipt.overall_trust_score).toBeGreaterThanOrEqual(0);
  });
});
```

**T4.3: Frontend Component Tests**

File: `apps/web/src/components/trust-receipt/TrustReceiptUI.test.tsx` (extend)

```typescript
describe('Principle Score Display', () => {
  it('should render all 6 principle scores from receipt', () => {
    const receipt = {
      ...mockReceipt,
      scores: {
        // Principles come from receipt.telemetry.sonate_principles
        consent_score: 8,
        inspection_score: 7,
        validation_score: 8,
        override_score: 9,
        disconnect_score: 8,
        recognition_score: 8
      }
    };

    render(<TrustReceiptCard receipt={receipt} />);

    expect(screen.getByText(/CONSENT.*8/)).toBeInTheDocument();
    expect(screen.getByText(/INSPECTION.*7/)).toBeInTheDocument();
    // ... etc
  });

  it('should color-code based on 0-10 scale', () => {
    const receipt = {
      ...mockReceipt,
      scores: {
        consent_score: 9,          // Green (≥8)
        inspection_score: 7,       // Yellow (6-8) 
        validation_score: 4,       // Red (<6)
        override_score: 8,         // Green
        disconnect_score: 9,       // Green
        recognition_score: 5      // Red
      }
    };

    const { container } = render(<TrustReceiptCard receipt={receipt} />);

    const scores = container.querySelectorAll('[data-test="principle-score"]');
    expect(scores[0]).toHaveClass('text-emerald-400');  // 9 → green
    expect(scores[1]).toHaveClass('text-amber-400');    // 7 → yellow
    expect(scores[2]).toHaveClass('text-red-400');      // 4 → red
  });
});
```

---

## Implementation Checklist

### Backend (90 minutes)
- [ ] **T1.1**: Update ReceiptGeneratorService interface & logic (20 min)
- [ ] **T1.2**: Update LLMTrustEvaluator to pass principles (10 min)
- [ ] **T1.3**: Extend TrustReceiptModel schema (15 min)
- [ ] **T1.4**: Update conversation.routes persist logic (15 min)
- [ ] **T1.5**: Test backend changes locally (30 min)

### Frontend (45 minutes)
- [ ] **T2.1**: Update TrustReceiptCard component (20 min)
- [ ] **T2.2**: Update component test mocks (15 min)
- [ ] **T2.3**: Test frontend display locally (10 min)

### Documentation (30 minutes)
- [ ] **T3.1**: Update TRUST_RECEIPT_SPECIFICATION_v1.md (15 min)
- [ ] **T3.2**: Update README.md (15 min)

### Testing (60 minutes)
- [ ] **T4.1**: Write principle scoring unit tests (20 min)
- [ ] **T4.2**: Write integration tests (20 min)
- [ ] **T4.3**: Write frontend snapshot tests (20 min)

### Validation (30 minutes)
- [ ] Run full test suite
- [ ] Verify receipt JSON structure with jq
- [ ] Compare with specification
- [ ] Code review

---

## Success Criteria

✅ **Receipts now contain all 6 SYMBI principle scores (0-10)**  
✅ **Overall score (0-100) included with status (PASS/PARTIAL/FAIL)**  
✅ **CIQ metrics (0-1) preserved**  
✅ **Frontend displays principles with color coding**  
✅ **Database schema supports new fields**  
✅ **Specification updated & aligned with code**  
✅ **All tests passing**  
✅ **Verifiers can independently validate weighted calculation**  

---

## Risk Mitigation

**Schema Migration**:
- Add optional fields first (backward compatible)
- Default to empty object if not present: `sonate_principles: {}`
- Mark fields as required in v2.1+ only

**API Response**:
- Include both old format (CIQ) and new (principles)
- Frontend gracefully handles missing fields
- Fallback to heuristic display if principles unavailable

**Testing**:
- All new code behind feature flag initially
- Gradual rollout: 10% → 50% → 100%
- Monitor receipt generation success rate

---

## Timeline

**Phase 1 (Backend)**: 90 minutes → Can test with API calls immediately  
**Phase 2 (Frontend)**: 45 minutes → Ready to display  
**Phase 3 (Docs)**: 30 minutes → Specification aligned  
**Phase 4 (Tests)**: 60 minutes → Full confidence  

**Total**: ~4 hours to battle-ready state

**Next Step**: Start with T1.1 - update ReceiptGeneratorService to accept principles
