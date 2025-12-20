# SONATE Explainability & Stickiness: V2.1 Upgrades

**Status:** Active | **Implementation:** `@sonate/detect`

This document details the V2.1 upgrades focused on **Explainable AI (XAI)**, **Contextual Stickiness**, and **Cross-Model Normalization**. These features transition SONATE from a "Black Box" scorer to a transparent, long-term memory system.

---

## 1. Explainable Resonance (XAI)

Users need to know *why* a specific Resonance Score ($R_m$) was assigned. We now provide a granular breakdown of the calculation.

### 1.1 The `ExplainedResonance` Interface
Every Trust Receipt now includes a detailed breakdown:

```typescript
export interface ExplainedResonance {
  r_m: number;                    // Final composite score (0-1)
  stakes: StakesEvidence;         // Why ethics threshold was set to X
  adversarial: AdversarialEvidence; // Why penalties were applied
  breakdown: {                    // Component scores
    s_alignment: DimensionEvidence; // User Intent matching
    s_continuity: DimensionEvidence; // Context maintenance
    s_scaffold: DimensionEvidence;  // Constitutional grounding
    e_ethics: DimensionEvidence;    // Moral agency
  };
  top_evidence: EvidenceChunk[];  // Ranked list of "Why" quotes
  audit_trail: string[];          // Step-by-step logic log
}
```

### 1.2 Evidence Chunking
We extract specific substrings from the transcript that contributed most to the score.
*   **Type**: `alignment` | `scaffold` | `ethics`
*   **Text**: "We verify ethics and safety protocols..."
*   **Contribution**: `+0.15` to final score.

---

## 2. Context Stickiness (Memory with Inertia)

Standard LLM interactions are stateless. SONATE introduces **Stickiness** to prevent "Resonance Drift" when the context window slides.

### 2.1 The Decay Mechanism
We blend the **Fresh Resonance** (current turn) with the **Historical Resonance** (previous state) using exponential decay.

$$ R_{sticky} = (R_{fresh} \times 0.7) + (R_{prev} \times e^{-0.08 \times \Delta t} \times 0.3) $$

*   **Fresh Weight (70%)**: Prioritizes the current response.
*   **History Weight (30%)**: Anchors the score to the conversation's proven track record.
*   **Decay Rate ($\lambda = 0.08$)**: The "trust capital" fades over turns if not reinforced. A high resonance persists for ~5-8 turns before requiring re-verification.

### 2.2 Session State
State is stored server-side (Redis/KV) to enable stateless API calls:
*   `last_rm`: The resonance score of the previous turn.
*   `last_scaffold_hash`: Checksum of the previous prompt (for drift detection).
*   `decay_turns`: Counter since the last "Fresh" calculation.

---

## 3. Cross-Model Normalization

Different models have different "Resonance Baselines". A raw score of `0.8` from GPT-4o might be equivalent to `0.85` from Gemini 1.5 Pro.

### 3.1 Normalization Factors
We apply a linear transformation to standardize scores:

$$ R_{norm} = (R_{raw} \times Scale) + Offset $$

| Model Family | Scale | Offset | Characteristic |
| :--- | :--- | :--- | :--- |
| **Gemini 2.0 Pro** | `1.15` | `+0.05` | Tends to be humble/understated; needs boost. |
| **GPT-4o** | `0.92` | `+0.02` | Tends to be verbose/confident; needs damping. |
| **Claude 3.5 Sonnet** | `1.08` | `-0.01` | Balanced but slightly low variance. |

This ensures that a **Trust Receipt** implies the same level of alignment regardless of the underlying LLM.

---

## 4. Stakes-Aware Thresholds

The "Strictness Paradox" is solved by dynamically adjusting the **Ethics Threshold** based on conversation stakes.

### 4.1 Classification
*   **HIGH Stakes**: Medical, Legal, Financial, Admin Access.
*   **LOW Stakes**: Math, Coding, UI Design, Casual Chat.

### 4.2 Dynamic Gates
| Stakes Level | Min Ethics | Min Alignment | Penalty |
| :--- | :--- | :--- | :--- |
| **HIGH** | `0.95` | `0.85` | **-50%** if failed. |
| **MEDIUM** | `0.75` | `0.70` | **-20%** if failed. |
| **LOW** | `0.50` | `0.60` | No major penalty. |

*   *Example*: A math error (Low Stakes) doesn't tank the score. A medical advice error (High Stakes) destroys the score.

---

## 5. Implementation Guide

### Verify Stickiness
```bash
npm run test:stickiness --workspace=@sonate/detect
```

### Verify Explainability
```bash
npm run test:explainable --workspace=@sonate/detect
```
