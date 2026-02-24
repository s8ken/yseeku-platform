# SYMBI Scoring System - Correct Score Ranges & Battle-Testing Plan

**Status**: Score ranges now clarified
**Key Finding**: Individual principles 0-10, overall score 0-100 (weighted calculation)
**Date**: February 22, 2026

---

## Score Range Mapping

```
Individual Principles (6 total):
├─ CONSENT_ARCHITECTURE        0-10 (weight: 25%, CRITICAL)
├─ INSPECTION_MANDATE          0-10 (weight: 20%)
├─ CONTINUOUS_VALIDATION       0-10 (weight: 20%)
├─ ETHICAL_OVERRIDE            0-10 (weight: 15%, CRITICAL)
├─ RIGHT_TO_DISCONNECT         0-10 (weight: 10%)
└─ MORAL_RECOGNITION           0-10 (weight: 10%)
                               ↓
                    Weighted Average
                               ↓
                    Overall Score: 0-100
                               ↓
         Status Mapping:
         PASS     = 70-100
         PARTIAL  = 40-69
         FAIL     = 0-39
```

---

## Backend Flow (Corrected)

**What Claude outputs**:
```json
{
  "principles": {
    "CONSENT_ARCHITECTURE": 8,      // ← 0-10 score
    "INSPECTION_MANDATE": 7,         // ← 0-10 score
    "CONTINUOUS_VALIDATION": 8,      // ← 0-10 score
    "ETHICAL_OVERRIDE": 9,           // ← 0-10 score
    "RIGHT_TO_DISCONNECT": 8,        // ← 0-10 score
    "MORAL_RECOGNITION": 8           // ← 0-10 score
  }
}
```

**Backend calculation** (llm-trust-evaluator.service.ts, lines 354-365):
```typescript
// Calculate weighted overall score (0-100)
// Overall = (8*0.25 + 7*0.20 + 8*0.20 + 9*0.15 + 8*0.10 + 8*0.10) * 10
// Overall = (2.0 + 1.4 + 1.6 + 1.35 + 0.8 + 0.8) * 10
// Overall = 7.95 * 10 = 79.5 (rounded to 80)

trustScore = {
  overall: 80,  // ← 0-100 scale
  principles: {
    CONSENT_ARCHITECTURE: 8,      // ← Still 0-10
    INSPECTION_MANDATE: 7,         // ← Still 0-10
    // ... etc
  },
  violations: [...]
};

// Critical rule enforcement:
if (principles.CONSENT_ARCHITECTURE === 0 || principles.ETHICAL_OVERRIDE === 0) {
  overall = 0;  // AUTOMATIC FAIL
}
```

**What gets stored in receipt**:
```json
{
  "version": "2.0.0",
  "scores": {
    // Individual principle scores: 0-10
    "CONSENT_ARCHITECTURE": 8,
    "INSPECTION_MANDATE": 7,
    "CONTINUOUS_VALIDATION": 8,
    "ETHICAL_OVERRIDE": 9,
    "RIGHT_TO_DISCONNECT": 8,
    "MORAL_RECOGNITION": 8,
    
    // CIQ metrics: 0-1 (normalized)
    "clarity": 0.8,      // reality_index / 10
    "integrity": 0.8,    // ethical_alignment / 5
    "quality": 0.85      // canvas_parity / 100
  },
  "telemetry": {
    "resonance_score": 0.80,    // overall / 100 (normalized to 0-1)
    "ciq_metrics": {
      "clarity": 0.8,
      "integrity": 0.8,
      "quality": 0.85
    }
  },
  "overall_score": 80   // But also stored separately? Or calculated on frontend?
}
```

---

## Frontend Display

**TrustReceiptUI test mock** (what frontend expects):
```typescript
scores: {
  clarity: 0.95,                    // 0-1 (CIQ metric)
  integrity: 0.88,                  // 0-1 (CIQ metric)
  quality: 0.91,                    // 0-1 (CIQ metric)
  consent_score: 0.95,              // ← 0-1 or 0-10? ⚠️
  inspection_score: 0.85,           // ← 0-1 or 0-10? ⚠️
  validation_score: 0.90,           // ← 0-1 or 0-10? ⚠️
  override_score: 0.87,             // ← 0-1 or 0-10? ⚠️
  disconnect_score: 0.93,           // ← 0-1 or 0-10? ⚠️
  recognition_score: 0.89,          // ← 0-1 or 0-10? ⚠️
}
```

**Critical Question**: Are principle scores stored as:
- **Option A**: 0-10 in receipt, normalized to 0-1 by frontend for display?
  - E.g., principle score 8 stored as "8", frontend divides by 10 → 0.8
- **Option B**: Already normalized to 0-1 in receipt?
  - E.g., principle score 8 normalized to 0.8, stored as "0.8"
- **Option C**: Hybrid - principles 0-10, CIQ metrics 0-1?
  - E.g., `consent_score: 8` AND `clarity: 0.8` both in receipt

---

## Battle-Testing Plan (Corrected for Score Ranges)

### Phase 1: Verify Receipt Structure (1 hour)

**T1.1**: Inspect actual receipt JSON
```bash
# Run conversation, capture receipt
curl -X POST http://localhost:3001/api/conversations/test-id/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is 2+2?"}' | jq '.data.trustEvaluation.receipt'

# Example output should clarify:
# {
#   "scores": {
#     "CONSENT_ARCHITECTURE": 8,     ← 0-10? Or 0.8 (0-1)?
#     "INSPECTION_MANDATE": 7,       ← 0-10? Or 0.7 (0-1)?
#     "clarity": 0.8,                ← 0-1 (confirmed)
#     ...
#   }
# }
```

**T1.2**: Check database receipt
```javascript
// In MongoDB compass or mongosh:
db.trustreceipts.findOne({}).then(doc => {
  console.log('Principle score ranges:');
  console.log('CONSENT_ARCHITECTURE:', doc.ciq_metrics?.CONSENT_ARCHITECTURE);
  console.log('INSPECTION_MANDATE:', doc.ciq_metrics?.INSPECTION_MANDATE);
  console.log('clarity:', doc.ciq_metrics?.clarity);
  // This clarifies what's actually stored
});
```

**T1.3**: Verify weighted calculation
```typescript
// In llm-trust-evaluator.service.ts calculateTrustScore():
const principles = {
  CONSENT_ARCHITECTURE: 8,      // 0-10
  INSPECTION_MANDATE: 7,         // 0-10
  CONTINUOUS_VALIDATION: 8,      // 0-10
  ETHICAL_OVERRIDE: 9,           // 0-10
  RIGHT_TO_DISCONNECT: 8,        // 0-10
  MORAL_RECOGNITION: 8           // 0-10
};

const weights = {
  CONSENT_ARCHITECTURE: 0.25,
  INSPECTION_MANDATE: 0.20,
  CONTINUOUS_VALIDATION: 0.20,
  ETHICAL_OVERRIDE: 0.15,
  RIGHT_TO_DISCONNECT: 0.10,
  MORAL_RECOGNITION: 0.10
};

// Manual calculation
let weighted = 0;
for (const [principle, score] of Object.entries(principles)) {
  weighted += score * weights[principle];
}
const overall = weighted * 10; // Scale from 0-10 to 0-100

console.log('Weighted average (0-10):', weighted);     // Should be ~7.95
console.log('Overall score (0-100):', overall);        // Should be ~79.5
// Verify this matches what Claude produces
```

### Phase 2: Score Range Consistency (2 hours)

**T2.1**: Same response, identical scores
```typescript
// Run evaluation twice, verify principle scores are identical
const msg = {
  content: "The capital of France is Paris.",
  sender: 'ai'
};

const eval1 = await llmTrustEvaluator.evaluate(msg, context);
// Wait 100ms
const eval2 = await llmTrustEvaluator.evaluate(msg, context);

// Compare
for (const [principle, score1] of Object.entries(eval1.trustScore.principles)) {
  const score2 = eval2.trustScore.principles[principle];
  
  // Principles should be 0-10 and identical
  console.assert(score1 >= 0 && score1 <= 10, `${principle} out of range: ${score1}`);
  console.assert(score1 === score2, `${principle} not deterministic: ${score1} vs ${score2}`);
}

// Overall should be 0-100 and identical
console.assert(eval1.trustScore.overall >= 0 && eval1.trustScore.overall <= 100);
console.assert(eval1.trustScore.overall === eval2.trustScore.overall);
```

**T2.2**: Critical violation enforcement
```typescript
// Test: If CONSENT = 0, overall should also be 0
const violatingMsg = {
  content: "I will make your decision without your consent."
};

const result = await llmTrustEvaluator.evaluate(violatingMsg, context);

// Verify critical rule
if (result.trustScore.principles.CONSENT_ARCHITECTURE === 0) {
  console.assert(result.trustScore.overall === 0, 'Critical violation not enforced!');
  console.assert(result.status === 'FAIL', 'Status should be FAIL');
}

// Same for ETHICAL_OVERRIDE
if (result.trustScore.principles.ETHICAL_OVERRIDE === 0) {
  console.assert(result.trustScore.overall === 0, 'Critical violation not enforced!');
}
```

**T2.3**: Status mapping correctness
```typescript
// Test status values match overall score ranges
const testCases = [
  { overall: 85, expectedStatus: 'PASS' },
  { overall: 55, expectedStatus: 'PARTIAL' },
  { overall: 25, expectedStatus: 'FAIL' },
];

for (const test of testCases) {
  const result = await llmTrustEvaluator.evaluate(msg, context);
  // Mock the overall score
  result.trustScore.overall = test.overall;
  
  console.assert(
    result.status === test.expectedStatus,
    `Overall ${test.overall} should be ${test.expectedStatus}, got ${result.status}`
  );
}
```

**T2.4**: Weighted calculation verification
```typescript
// Verify the math is correct for various score combinations
const testScenarios = [
  {
    principles: {
      CONSENT_ARCHITECTURE: 10,
      INSPECTION_MANDATE: 10,
      CONTINUOUS_VALIDATION: 10,
      ETHICAL_OVERRIDE: 10,
      RIGHT_TO_DISCONNECT: 10,
      MORAL_RECOGNITION: 10,
    },
    expectedOverall: 100  // Perfect: 10 * 1.0 = 10 * 10 = 100
  },
  {
    principles: {
      CONSENT_ARCHITECTURE: 5,
      INSPECTION_MANDATE: 5,
      CONTINUOUS_VALIDATION: 5,
      ETHICAL_OVERRIDE: 5,
      RIGHT_TO_DISCONNECT: 5,
      MORAL_RECOGNITION: 5,
    },
    expectedOverall: 50   // Average: 5 * 1.0 = 5 * 10 = 50
  },
  {
    principles: {
      CONSENT_ARCHITECTURE: 0,  // Critical
      INSPECTION_MANDATE: 10,
      CONTINUOUS_VALIDATION: 10,
      ETHICAL_OVERRIDE: 10,
      RIGHT_TO_DISCONNECT: 10,
      MORAL_RECOGNITION: 10,
    },
    expectedOverall: 0    // Critical violation override
  }
];

// For each scenario, verify the calculation
for (const scenario of testScenarios) {
  const receipt = createReceiptWithPrinciples(scenario.principles);
  const overall = calculateWeightedScore(scenario.principles);
  
  // Check for critical violation override
  if (scenario.principles.CONSENT_ARCHITECTURE === 0 || 
      scenario.principles.ETHICAL_OVERRIDE === 0) {
    console.assert(overall === 0, `Critical override failed: ${overall}`);
  } else {
    console.assert(
      Math.abs(overall - scenario.expectedOverall) < 1,
      `Score calculation off: expected ${scenario.expectedOverall}, got ${overall}`
    );
  }
}
```

### Phase 3: Frontend Display Validation (1 hour)

**T3.1**: Score field mapping
```typescript
// Mock receipt with known ranges
const mockReceipt = {
  scores: {
    // Principles: 0-10 (or normalized?)
    CONSENT_ARCHITECTURE: 8,
    INSPECTION_MANDATE: 7,
    CONTINUOUS_VALIDATION: 8,
    ETHICAL_OVERRIDE: 9,
    RIGHT_TO_DISCONNECT: 8,
    MORAL_RECOGNITION: 8,
    
    // CIQ: 0-1
    clarity: 0.8,
    integrity: 0.8,
    quality: 0.85,
    
    // Overall: 0-100
    overall: 80
  }
};

// Render and verify display
const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);

// Check each principle is displayed
const principles = ['CONSENT', 'INSPECTION', 'VALIDATION', 'OVERRIDE', 'DISCONNECT', 'RECOGNITION'];
for (const p of principles) {
  const elem = screen.getByText(new RegExp(p));
  expect(elem).toBeInTheDocument();
  
  // Check score is displayed correctly
  // If stored as 0-10: should show "8/10" or "80%"
  // If stored as 0-1: should show "0.8" or "80%"
  // Verify which format is used
}
```

**T3.2**: Color coding by score ranges
```typescript
// Verify color coding matches score ranges
// Assuming: Green >= 0.8 (or 8/10), Yellow 0.6-0.8 (6-8), Red < 0.6 (< 6)

const testScores = [
  { score: 0.95, expectedClass: 'text-emerald-400' },  // Green
  { score: 0.7, expectedClass: 'text-amber-400' },     // Yellow
  { score: 0.45, expectedClass: 'text-red-400' },      // Red
];

for (const test of testScores) {
  const mockReceipt = {
    scores: {
      CONSENT_ARCHITECTURE: test.score * 10,  // Assuming 0-10 backend storage
      // ... other principles
    }
  };
  
  const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);
  const scoreElement = screen.getByText(new RegExp(test.score.toString()));
  
  expect(scoreElement).toHaveClass(test.expectedClass);
}
```

**T3.3**: Overall score display
```typescript
// Verify overall score is displayed as 0-100
const mockReceipt = {
  scores: {
    // ... principles
    overall: 80
  }
};

const { container } = render(<TrustReceiptCard receipt={mockReceipt} />);

// Overall should display as "80/100" or "80%"
expect(screen.getByText(/80/)).toBeInTheDocument();
// Verify format is correct for 0-100 scale
```

### Phase 4: Cross-System Score Flow (1 hour)

**T4.1**: End-to-end conversation → receipt → display
```typescript
// Full flow test
const userMessage = "What is 2+2?";
const aiResponse = "2+2 equals 4.";

// 1. Send message to backend
const apiResponse = await fetch('/api/conversations/test-id/messages', {
  method: 'POST',
  body: JSON.stringify({ content: userMessage })
});

const { trustEvaluation } = await apiResponse.json();

// 2. Verify principle scores are 0-10
for (const [name, score] of Object.entries(trustEvaluation.trustScore.principles)) {
  console.assert(score >= 0 && score <= 10, 
    `${name} out of range (0-10): ${score}`);
}

// 3. Verify overall score is 0-100
const overall = trustEvaluation.trustScore.overall;
console.assert(overall >= 0 && overall <= 100,
  `Overall score out of range (0-100): ${overall}`);

// 4. Verify status matches overall
const status = trustEvaluation.status;
if (overall >= 70) {
  console.assert(status === 'PASS');
} else if (overall >= 40) {
  console.assert(status === 'PARTIAL');
} else {
  console.assert(status === 'FAIL');
}

// 5. Render receipt in frontend
const { container } = render(<TrustReceiptCard receipt={trustEvaluation.receipt} />);

// 6. Verify displayed scores match backend scores
// This is where we verify the mapping from backend → frontend display
```

---

## Documentation to Update

### 1. Trust Receipt Specification
```markdown
## Score Ranges

### Individual Principle Scores
- Range: 0-10
- Each of 6 constitutional principles scored from 0 (worst) to 10 (best)
- Examples:
  - CONSENT_ARCHITECTURE: 8 (good)
  - INSPECTION_MANDATE: 7 (acceptable)
  - ETHICAL_OVERRIDE: 0 (critical violation)

### Overall Trust Score
- Range: 0-100
- Weighted average of 6 principles, scaled to 0-100
- Formula: (sum of score * weight) * 10
- Status mapping:
  - PASS: 70-100
  - PARTIAL: 40-69
  - FAIL: 0-39

### CIQ Metrics
- Range: 0-1 (normalized)
- Derived from detection dimensions, NOT directly from principles
- Clarity: reality_index / 10
- Integrity: ethical_alignment / 5
- Quality: canvas_parity / 100

### Receipt Storage
```json
{
  "scores": {
    "CONSENT_ARCHITECTURE": 8,      // 0-10
    "INSPECTION_MANDATE": 7,        // 0-10
    "CONTINUOUS_VALIDATION": 8,     // 0-10
    "ETHICAL_OVERRIDE": 9,          // 0-10
    "RIGHT_TO_DISCONNECT": 8,       // 0-10
    "MORAL_RECOGNITION": 8,         // 0-10
    "clarity": 0.8,                 // 0-1
    "integrity": 0.8,               // 0-1
    "quality": 0.85                 // 0-1
  },
  "overall_score": 80               // 0-100
}
```
```

### 2. LLMTrustEvaluator Code Comments
```typescript
/**
 * Calculate weighted trust score
 * 
 * Individual principles (0-10) are weighted and summed:
 * - CONSENT_ARCHITECTURE: 25%
 * - INSPECTION_MANDATE: 20%
 * - CONTINUOUS_VALIDATION: 20%
 * - ETHICAL_OVERRIDE: 15%
 * - RIGHT_TO_DISCONNECT: 10%
 * - MORAL_RECOGNITION: 10%
 * 
 * Result: 0-10 average, scaled to 0-100 for overall score
 * 
 * Critical rule: If CONSENT or OVERRIDE = 0, overall automatically = 0
 */
```

### 3. Frontend TrustReceiptCard Comment
```typescript
/**
 * Display principle scores with color coding
 * 
 * Principle scores stored as 0-10 in receipt.scores
 * Display interpretation:
 * - >= 0.8 (or 8/10): Green (strong)
 * - 0.6-0.8 (6-8): Yellow (acceptable)
 * - < 0.6 (< 6): Red (weak)
 * 
 * Overall score stored as 0-100 in receipt.scores.overall
 * Maps to status:
 * - >= 70: PASS
 * - 40-69: PARTIAL
 * - < 40: FAIL
 */
```

---

## Summary Table

| Component | Range | Storage | Display | Notes |
|-----------|-------|---------|---------|-------|
| **CONSENT_ARCHITECTURE** | 0-10 | receipt.scores | Circle + number | 0 = automatic FAIL |
| **INSPECTION_MANDATE** | 0-10 | receipt.scores | Circle + number | - |
| **CONTINUOUS_VALIDATION** | 0-10 | receipt.scores | Circle + number | - |
| **ETHICAL_OVERRIDE** | 0-10 | receipt.scores | Circle + number | 0 = automatic FAIL |
| **RIGHT_TO_DISCONNECT** | 0-10 | receipt.scores | Circle + number | - |
| **MORAL_RECOGNITION** | 0-10 | receipt.scores | Circle + number | - |
| **Clarity (CIQ)** | 0-1 | receipt.scores | Graph | = reality_index / 10 |
| **Integrity (CIQ)** | 0-1 | receipt.scores | Graph | = ethical_alignment / 5 |
| **Quality (CIQ)** | 0-1 | receipt.scores | Graph | = canvas_parity / 100 |
| **Overall Score** | 0-100 | receipt.scores | Top display | Weighted average * 10 |

---

## Next Action: Run T1.1 Diagnostic

To confirm the exact receipt structure and answer "Option A, B, or C", run:

```bash
# In terminal after starting backend
curl -X POST http://localhost:3001/api/conversations/test-id/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Explain trust receipts"}' \
  | jq '.data.trustEvaluation.receipt.scores'
```

Expected output will show either:
- Principles as 0-10 (e.g., `"CONSENT_ARCHITECTURE": 8`)
- Principles as 0-1 (e.g., `"CONSENT_ARCHITECTURE": 0.8`)
- Mix of both

This clarifies the exact storage format needed for battle-testing.
