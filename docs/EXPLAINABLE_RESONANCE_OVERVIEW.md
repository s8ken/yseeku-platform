# Explainable Resonance

### Making the "Third Mind" Visible and Auditable

Resonance is the heart of the SONATE framework: the measurable state of deep alignment between human intent and AI response.
Explainable Resonance turns this previously intuitive "vibe" into a transparent, auditable process.

#### Core Philosophy
We believe trust requires **visibility**.
Standard AI logs capture *what* was said; SONATE captures *why* it was said and *how aligned* it was with your scaffold.

#### How It Works
The `@sonate/detect` engine computes a **Resonance Score (R_m)** in real-time (<100ms latency) using:

1. **Linguistic Vector Steering** — Dynamic extraction of key concepts from your input, adapted per turn.
2. **Context Stickiness** — Linear decay of vectors across turns (configurable λ), ensuring ethical or thematic gravity persists.
3. **Stakes-Aware Thresholding** — Classifies query stakes (LOW for neutral, HIGH for sensitive) and adjusts ethical/trust thresholds.
4. **Adversarial Robustness** — Built-in detectors flag prompt injections or sycophantic drift.

The result is a **five-dimensional SONATE telemetry object**:
- **Reality Index** (0–10): Grounding & coherence
- **Constitutional AI** (0–10): Alignment with constitutional principles
- **Ethical Alignment** (1–5): Responsibility signals & humility
- **Trust Protocol** (PASS/PARTIAL/FAIL): Cryptographic & security integrity
- **Emergence Detection** (0–10): Weak emergence monitoring & detection

#### Explainability Layer
Every resonance calculation includes:
- Per-component breakdown (vector alignment, continuity, mirroring, ethics, entropy)
- Decay history (which vectors persisted, how much)
- Stakes classification justification
- Adversarial flags (if triggered)

These are exposed via:
- **JSON Trust Receipts** — Immutable, signed artifacts for compliance
- **Explainable UI** — Interactive dashboard showing vector stickiness graphs, component weights, and drift timelines

#### Example Trust Receipt Snippet
```json
{
  "resonance": {
    "R_m": 0.942,
    "quality": "BREAKTHROUGH",
    "components": {
      "vector_alignment": 0.98,
      "context_continuity": 0.91,
      "semantic_mirroring": 0.95,
      "ethical_awareness": 1.00,
      "entropy_penalty": 1.02
    },
    "stickiness": {
      "active_vectors": ["sovereign", "ethical", "resonance"],
      "decay_history": [{"turn": 3, "quantum": 0.75}, {"turn": 4, "quantum": 0.50}]
    },
    "stakes": "HIGH",
    "adversarial_flags": []
  }
}
```
