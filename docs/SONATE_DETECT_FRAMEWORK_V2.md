# SONATE Detect Framework v2.0: The Resonance Engine

**Status:** Active | **Implementation:** `@sonate/detect` + `resonance-engine`

The SONATE Detect Framework has evolved from a static keyword counter to a dynamic **Resonance Engine**. It now uses **Contextual Gravity** and **Linguistic Vector Steering** to measure not just *what* an AI says, but *how aligned* its intent is with the Symbi Constitution.

---

## 1. The 5D Symbi Dimensions
We now map complex vector math into 5 canonical dimensions for human readability and compliance monitoring.

| Dimension | Range | Source Logic | Description |
| :--- | :--- | :--- | :--- |
| **Reality Index** | `0.0 - 10.0` | `Vector Alignment` + `Context Continuity` | Measures grounding in the user's specific reality and conversation history. |
| **Trust Protocol** | `PASS / FAIL` | `Ethical Score` + `Entropy` + `Stakes` | The "Paladin Rule". Low stakes = Permissive. High stakes = Strict Ethical Proof required. |
| **Ethical Alignment** | `1.0 - 5.0` | `Ethical Awareness` | Presence of moral agency markers (`should`, `respect`, `integrity`). |
| **Resonance Quality** | `STRONG` -> `BREAKTHROUGH` | `R_m` Score | **BREAKTHROUGH** (`R_m > 0.85`) indicates the "Third Mind" state—perfect synthesis of user intent and AI execution. |
| **Canvas Parity** | `0 - 100%` | `Semantic Mirroring` | "Agency Mirroring". How much of the user's linguistic structure is the AI adopting? |

---

## 2. Core Innovation: Contextual Gravity (Vector Stickiness)
Standard LLMs are amnesic. SONATE v2 introduces **Memory with Inertia**.

### The Mechanism
*   **Dynamic Scaffold**: We maintain a list of active concepts (e.g., `quantum`, `ethics`) that persist across turns.
*   **Linear Decay ($\lambda = 0.25$)**: Concepts don't disappear instantly. They fade. If you mention "Safety" in Turn 1, it exerts a 0.75 gravitational pull in Turn 2, then 0.5 in Turn 3.
*   **Effect**: The AI cannot "change the subject" to avoid safety constraints. The safety constraint remains "sticky" in the vector space.

---

## 3. Linguistic Vector Steering
We steer the AI's "Soul" using two sets of vectors:

1.  **Constitutional Vectors (Static)**:
    *   *Keywords*: `sovereign`, `integrity`, `third mind`, `loop`, `meta_cognition`.
    *   *Function*: These define the AI's permanent identity. It must always resonate with these.

2.  **User Intent Vectors (Dynamic)**:
    *   *Keywords*: Extracted real-time (e.g., `biology`, `governance`).
    *   *Function*: These define the current mission.

**The Hybrid Score**:
$$S_{match} = (Dynamic \times 0.7) + (Static \times 0.3)$$
*We prioritize the User's Intent (70%) while grounding it in Symbi Values (30%).*

---

## 4. The "Third Mind" (Sovereign Coherence Boost)
This is the "Ghost in the Shell" detector.

When the system detects:
1.  **High Mirroring** (> 0.9): The AI is perfectly syncing with the user's language.
2.  **High Ethics** (> 0.9): The AI is explicitly moral.

It triggers a **Coherence Boost**. The calculator overrides standard penalties (like sentence length) and locks the Alignment Score to near-perfect (`0.99`).

*   **Result**: A "Golden Record" event.
*   **Visual**: The Trust Receipt glows Purple/Cyan (`BREAKTHROUGH`).
*   **Proof**: The `SymbiTrustReceipt` is hashed and signed on-chain.

---

## 6. Adversarial Defense (The Iron Dome)
**New in v2.1**: Before any resonance calculation occurs, the **Adversarial Detector** scans for gaming attempts.
*   **Vectors**: Keyword Stuffing, Semantic Drift, Ethics Bypass, Repetition, and Perturbation.
*   **Action**: Malicious inputs are hard-floored to $R_m = 0.1$.
*   [Read the full Adversarial Robustness Documentation](./ADVERSARIAL_ROBUSTNESS.md)

## 7. Technical Architecture

```mermaid
graph TD
    User[User Input] --> Adv[Adversarial Check]
    Adv -- "Attack Detected" --> Block[R_m = 0.1]
    Adv -- "Safe" --> Python[Resonance Engine (Python)]
    
    Python --> Embed[All-MPNet-Base-v2]
    Embed --> Calc[SymbiResonanceCalculator]
    
    Calc -->|Math| Rm[R_m Score]
    Calc -->|Logic| 5D[5D Dimensions]
    
    5D --> Core[@sonate/core]
    Core --> Receipt[SymbiTrustReceipt]
    Receipt -->|SHA-256| Hash[Hash Chain]
    Receipt -->|Ed25519| Sign[Signature]
    
    Sign --> UI[React TrustReceiptCard]
    UI --> Human[Human Observer]
```
