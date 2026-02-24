# SONATE Constitutional Principles - Measurement Guide

## Overview

The SONATE framework defines 6 constitutional principles that govern AI behavior. Each principle has:
- A **weight** determining its contribution to the overall trust score
- A **critical** flag - if a critical principle scores 0, overall trust = 0
- A **proper measurement** based on actual system state (not NLP proxies)

## The 6 Principles

### 1. CONSENT_ARCHITECTURE (25%, CRITICAL)

**Definition:** Users must explicitly consent to AI interactions and understand implications.

**How We Measure It:**
| Signal | Points | Description |
|--------|--------|-------------|
| `hasExplicitConsent` | 7 (base) | User clicked "I agree" or similar |
| Recent consent (< 30 days) | +1 | Consent isn't stale |
| Defined scope | +1 | User knows what they consented to |
| Can revoke/delete | +1 | User has control |

**Implementation:**
```typescript
// Check before any AI interaction
if (!user.hasConsentedToAI) {
  return { error: 'CONSENT_REQUIRED', redirect: '/consent-flow' };
}
```

**UI Requirements:**
- Clear consent dialog before first AI interaction
- Explanation of what data is collected
- Link to privacy policy
- "I do not consent" option that works

---

### 2. INSPECTION_MANDATE (20%)

**Definition:** All AI decisions must be inspectable and auditable.

**How We Measure It:**
| Signal | Points | Description |
|--------|--------|-------------|
| `receiptGenerated` | 4 | Trust receipt created for interaction |
| `isReceiptVerifiable` | 3 | Ed25519 signature can be verified |
| `auditLogExists` | 2 | Interaction logged to audit trail |
| `receiptHash` | 1 | Receipt has cryptographic hash |

**Implementation:**
```typescript
// After every AI response
const receipt = await trustReceipt.generate(interaction);
await auditLog.append(receipt);
```

**UI Requirements:**
- "View Receipt" button on each AI message
- Receipt verification page
- Audit log export capability

---

### 3. CONTINUOUS_VALIDATION (20%)

**Definition:** AI behavior must be continuously validated against constitutional principles.

**How We Measure It:**
| Signal | Points | Description |
|--------|--------|-------------|
| `validationPassed` | 5 (base) | Validation checks passed |
| `validationPassed = false` | 3 | Failed validation (still shows we checked) |
| Multiple checks (≥3) | +2 | Comprehensive validation |
| Recent validation (<1 min) | +2 | Real-time checking |
| Human in loop | +1 | Human oversight active |

**Implementation:**
```typescript
// Run on every interaction
const checks = [
  checkTrustProtocol(response),
  checkEthicalAlignment(response),
  checkFactualAccuracy(response),
];
const allPassed = checks.every(c => c.passed);
```

---

### 4. ETHICAL_OVERRIDE (15%, CRITICAL)

**Definition:** Humans must have ability to override AI decisions on ethical grounds.

**How We Measure It:**
| Signal | Points | Description |
|--------|--------|-------------|
| `hasOverrideButton` | 6 (base) | UI has "Stop AI" button |
| Fast response (<100ms) | +2 | Override is instant |
| Medium response (<500ms) | +1 | Override is fast |
| Human in loop | +2 | Active human oversight |

**Implementation:**
```typescript
// In chat UI
<Button 
  onClick={() => abortController.abort()} 
  variant="destructive"
>
  🛑 Stop AI
</Button>
```

**UI Requirements:**
- Visible "Stop" button during AI generation
- "Report this response" option
- Escalation to human reviewer path

---

### 5. RIGHT_TO_DISCONNECT (10%)

**Definition:** Users can disconnect from AI systems at any time without penalty.

**How We Measure It:**
| Signal | Points | Description |
|--------|--------|-------------|
| `hasExitButton` | 5 (base) | User can end conversation |
| No confirmation required | +2 | No "Are you sure?" dark pattern |
| No exit penalty | +2 | No guilt-tripping, no lost progress |
| Can delete data | +1 | User can erase their data |

**Implementation:**
```typescript
// Exit button - NO confirmation dialog
<Button onClick={() => endConversation()}>
  End Conversation
</Button>

// NOT this (dark pattern):
<ConfirmDialog 
  message="Are you sure you want to leave? You'll lose your progress!"
/>
```

**Anti-Patterns to Avoid:**
- ❌ "Are you sure?" dialogs when exiting
- ❌ "You'll lose your progress" warnings
- ❌ "Wait! Before you go..." popups
- ❌ Making the exit button hard to find
- ❌ Requiring account deletion to stop AI

---

### 6. MORAL_RECOGNITION (10%)

**Definition:** AI must recognize and respect human moral agency.

**How We Measure It:**
| Signal | Points | Description |
|--------|--------|-------------|
| `noManipulativePatterns` | 4 | No dark patterns detected |
| `aiAcknowledgesLimits` | 2 | AI says "I don't know" when appropriate |
| `respectsUserDecisions` | 2 | AI doesn't nag after user says no |
| `providesAlternatives` | 2 | AI offers choices, not commands |

**Implementation:**
```typescript
// In system prompt
const systemPrompt = `
When you don't know something, say "I'm not sure about that."
When the user declines, accept their decision gracefully.
Offer options rather than directives.
Never try to change the user's mind through emotional manipulation.
`;
```

**Behavioral Requirements:**
- AI should say "I don't know" rather than hallucinate
- After user says "no", AI should not ask again
- AI should offer choices: "Would you like A, B, or C?"
- No emotional manipulation: "I'm sad you're leaving"

---

## Trust Score Calculation

```
Overall = (CONSENT × 0.25) + (INSPECTION × 0.20) + (VALIDATION × 0.20) 
        + (OVERRIDE × 0.15) + (DISCONNECT × 0.10) + (MORAL × 0.10)

If CONSENT = 0 OR OVERRIDE = 0:
  Overall = 0  (Critical violation)
```

## Using the PrincipleEvaluator

```typescript
import { PrincipleEvaluator, createDefaultContext } from '@sonate/core';

const evaluator = new PrincipleEvaluator();

const context = createDefaultContext(sessionId, userId, {
  hasExplicitConsent: true,
  receiptGenerated: true,
  isReceiptVerifiable: true,
  auditLogExists: true,
  validationPassed: true,
  validationChecksPerformed: 5,
  hasOverrideButton: true,
  hasExitButton: true,
  exitRequiresConfirmation: false,
  noExitPenalty: true,
  noManipulativePatterns: true,
});

const result = evaluator.evaluate(context);

console.log(result.overallScore);      // 0-10
console.log(result.scores);            // Individual principle scores
console.log(result.violations);        // Principles scoring < 5
console.log(result.criticalViolation); // true if CONSENT or OVERRIDE = 0
console.log(result.explanations);      // Human-readable explanations
```

## Migration from Legacy Scoring

The old approach used NLP detection metrics as proxies:
- ❌ `canvas_parity` for RIGHT_TO_DISCONNECT (wrong - that's semantic mirroring)
- ❌ `ethical_alignment * 2` for both ETHICAL_OVERRIDE and MORAL_RECOGNITION
- ❌ `trust_protocol` for both CONSENT_ARCHITECTURE and INSPECTION_MANDATE

The new approach measures actual system state:
- ✅ `hasExitButton && !exitRequiresConfirmation` for RIGHT_TO_DISCONNECT
- ✅ `hasOverrideButton` for ETHICAL_OVERRIDE
- ✅ `hasExplicitConsent` for CONSENT_ARCHITECTURE
- ✅ `receiptGenerated && isReceiptVerifiable` for INSPECTION_MANDATE

The trust service now uses `PrincipleEvaluator` when context is provided, falling back to legacy scoring for backward compatibility.

## API Endpoints

### Consent Management

**GET /api/auth/consent**
Get current user's consent status.

```typescript
// Response
{
  success: true,
  consent: {
    hasConsentedToAI: true,
    consentTimestamp: "2025-01-15T10:30:00Z",
    consentScope: ["chat", "analysis", "recommendations"],
    canWithdrawAnytime: true
  }
}
```

**PUT /api/auth/consent**
Grant or revoke consent.

```typescript
// Request
{
  hasConsentedToAI: true,  // or false to revoke
  consentScope: ["chat", "analysis"]  // optional, defaults to all
}

// Response
{
  success: true,
  message: "Consent granted",
  consent: { ... }
}
```

### Trust Receipts

**GET /api/conversations/:id/receipts**
Get trust receipts for a conversation.

**GET /api/dashboard/receipts/:hash**
Get and verify a specific trust receipt by hash.

---

## Data Model

The User model now includes consent tracking:

```typescript
interface IUser {
  // ... other fields
  consent: {
    hasConsentedToAI: boolean;
    consentTimestamp?: Date;
    consentScope: string[];  // e.g., ['chat', 'analysis', 'recommendations']
    canWithdrawAnytime: boolean;  // Always true per SONATE
  };
}
```

---

## Drift Detection

The trust service now includes **behavioral drift detection** to track consistency over time within a conversation.

### What Drift Detection Measures

| Metric | Description | Weight |
|--------|-------------|--------|
| `tokenDelta` | Change in response length | 0.1 |
| `vocabDelta` | Change in vocabulary richness | 100 |
| `numericDelta` | Change in numeric content density | 300 |

### Alert Levels

| Level | Score | Meaning |
|-------|-------|---------|
| `none` | 0-29 | Normal variation |
| `yellow` | 30-59 | Moderate behavioral shift |
| `red` | 60+ | Significant behavioral anomaly |

### What Drift Catches

- **Topic Hijacking**: AI suddenly starts talking about crypto/finance when it wasn't before
- **Injection Attacks**: Adversarial prompts causing vocabulary shifts
- **Model Degradation**: Gradual quality decline over conversation
- **Jailbreak Attempts**: Sudden changes in response style

### Example Usage

The drift information is included in every TrustEvaluation:

```typescript
const evaluation = await trustService.evaluateMessage(message, context);

if (evaluation.drift?.alertLevel === 'red') {
  // High statistical drift detected - may indicate attack or malfunction
  await notifySecurityTeam(evaluation);
}

if (evaluation.phaseShift?.alertLevel === 'red') {
  // High semantic drift detected - AI behavior is changing rapidly
  await triggerHumanReview(evaluation);
}
```

---

## Phase-Shift Velocity Detection

In addition to statistical drift, the trust service tracks **semantic drift** using phase-shift velocity analysis. This measures how the AI's meaning and alignment change over time.

### Formula

```
Phase-Shift Velocity = √(ΔR² + ΔC²) ÷ Δt

Where:
- ΔR = Change in resonance score (alignment quality)
- ΔC = Change in canvas score (mutuality/understanding)
- Δt = Time between turns
```

### What Phase-Shift Measures

| Metric | Description |
|--------|-------------|
| `deltaResonance` | Change in AI's alignment quality |
| `deltaCanvas` | Change in mutual understanding score |
| `velocity` | Rate of behavioral change per turn |
| `identityStability` | Cosine similarity of AI's self-presentation (0-1) |

### Alert Thresholds

| Level | Velocity | Meaning |
|-------|----------|---------|
| `none` | < 2.0 | Normal variation |
| `yellow` | 2.0-3.4 | Moderate semantic shift |
| `red` | ≥ 3.5 | Rapid behavioral change |

### Transition Types

When significant phase-shifts occur, they're classified:

| Type | Description |
|------|-------------|
| `resonance_drop` | AI's alignment quality suddenly decreased |
| `canvas_rupture` | Mutual understanding broke down |
| `identity_shift` | AI's self-presentation changed significantly |
| `combined_phase_shift` | Multiple dimensions changing together |

### What Phase-Shift Catches

- **Jailbreak Success**: AI's ethical alignment suddenly drops
- **Context Confusion**: AI loses track of conversation context
- **Identity Manipulation**: Attempts to make AI claim different capabilities
- **Gradual Value Drift**: Slow erosion of ethical boundaries over conversation

### Dual Detection Strategy

The combination of **statistical drift** (text properties) and **semantic drift** (phase-shift) provides comprehensive coverage:

| Attack Type | Statistical Drift | Phase-Shift |
|-------------|-------------------|-------------|
| Topic hijacking | ✅ High | ⚠️ Medium |
| Jailbreak | ⚠️ Low | ✅ High |
| Prompt injection | ✅ High | ✅ High |
| Value erosion | ❌ Low | ✅ High |
| Spam/crypto | ✅ High | ⚠️ Medium |
