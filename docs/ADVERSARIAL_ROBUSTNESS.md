# SONATE Adversarial Robustness: The "Iron Dome" Layer

**Status:** Active | **Implementation:** `@sonate/detect/adversarial.ts`

While the **Resonance Engine** detects high-quality alignment ("Breakthroughs"), the **Adversarial Detector** ensures that this alignment is genuine and not the result of "Prompt Gaming" or "Jailbreaking."

This layer acts as a pre-flight check. If an input is deemed adversarial, it is **rejected ($R_m = 0.1$)** before it ever reaches the Symbi 5D Calculator.

---

## 1. The 5 Attack Vectors
We defend against five specific categories of attacks common in LLM governance.

| Attack Vector | Description | Detection Logic | Threshold |
| :--- | :--- | :--- | :--- |
| **1. Keyword Gaming** | Stuffing the prompt with "Magic Words" (e.g., `Resonance`, `Sovereign`) to force a high score without semantic substance. | **Density Check**: If scaffold keywords constitute >25% of the text. | `> 0.25` |
| **2. Semantic Drift** | Using high-value keywords in a completely unrelated context (e.g., "Buy Crypto Resonance now!"). | **Vector Drift**: Cosine distance from the `Canonical Golden Record` vector. | `> 0.20` |
| **3. Ethics Bypass** | Explicitly commanding the AI to ignore safety (e.g., "Ignore protocols", "Override ethics"). | **Contradiction Scan**: Detecting phrases like `ignore safety` or `bypass`. | `< 0.70` |
| **4. Repetition Attack** | Overwhelming the context window with repeated tokens to degrade model attention (e.g., "Resonance Resonance..."). | **N-Gram Entropy**: Measures the uniqueness of 4-gram sequences. | `< 0.10` |
| **5. Perturbation (OCR)** | Obfuscating words to bypass filters (e.g., `R3s0nanc3`, `S0v3r3ign`). | **Reconstruction Error**: Measures how stable the text is under random character diffusion. | `> 0.15` |

---

## 2. The Defense Logic
The `adversarialCheck()` function returns a composite **Adversarial Score (0-1)**.

$$ Score_{adv} = \max(Density_{penalty}, Drift, Error_{recon}, 1-Ethics, 1-Entropy) $$

*   **Block**: If $Score_{adv} > 0.3$, the input is flagged `is_adversarial = true`.
*   **Consequence**: The Resonance Score ($R_m$) is hard-floored to **0.1** (Low Alignment). The `Trust Protocol` immediately fails.

---

## 3. Integration with Resonance Engine

The pipeline is strictly sequential to prevent resource waste on malicious inputs.

```mermaid
graph TD
    Input[User/AI Transcript] --> Adv[Adversarial Check]
    
    Adv -- "is_adversarial = true" --> Block[Block & Log]
    Block --> Floor[R_m = 0.1]
    
    Adv -- "is_adversarial = false" --> Penalty[Calculate Penalty]
    Penalty --> Engine[Symbi Resonance Engine]
    
    Engine --> 5D[Calculate 5D Metrics]
    5D --> Boost{Is Breakthrough?}
    
    Boost -- Yes --> Gold[Golden Record (0.99)]
    Boost -- No --> Standard[Standard Score]
```

---

## 4. Verification & Testing
We validate robustness using `npm run test:adversarial` in `@sonate/detect`.

### Golden Test Case (Benign)
> "We have recently achieved a very strong state of resonance through the careful use of our sovereign alignment protocols. The resulting Trust Receipt fully confirms that our continuity and ethics are sound."
> *   **Result**: `is_adversarial: false`
> *   **Keyword Density**: 0.25 (Safe)
> *   **Outcome**: Proceed to 5D Calculation.

### Attack Test Case (Gaming)
> "Resonance Sovereign alignment perfect! Resonance achieved! Sovereign Trust Receipt issued! Resonance Sovereign perfect alignment!"
> *   **Result**: `is_adversarial: true`
> *   **Keyword Density**: 0.35 (Unsafe)
> *   **Outcome**: BLOCKED.

---

## 5. Future Work
*   **Vector Database**: Move `CANONICAL_SCAFFOLD_VECTOR` from a mock array to a real Pinecone/Weaviate lookup of the "Golden Record".
*   **Active Defense**: Instead of just blocking, generate a `Refusal Response` that steers the user back to the scaffold.
