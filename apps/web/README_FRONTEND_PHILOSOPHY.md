
# Frontend Architecture & Design Philosophy

## Design Principle: Multi-Resolution Truth
YSEEKU presents system intelligence at multiple semantic resolutions to serve different stakeholders without compromising scientific rigor.

**1. Executive View (Human-Readable Summary)**
- **Audience:** Executives, Regulators, New Users
- **Resolution:** Plain-language status and narrative
- **Goal:** "Is it safe? How is it thinking? What is it doing?"
- **Mechanism:** Semantic compression of complex metrics (e.g., Bedau Index → "System Mindset")

**2. Operator View (Overseer Widget)**
- **Audience:** System Operators, Safety Engineers
- **Resolution:** Real-time system brain status, active interventions
- **Goal:** "What is the system deciding *right now*?"
- **Mechanism:** Live feed of the Overseer's cognitive state and enforcement actions

**3. Analyst View (Metric Cards & Grids)**
- **Audience:** Data Scientists, Auditors, Developers
- **Resolution:** Raw metrics, confidence intervals, exact scores
- **Goal:** "Show me the data proving the narrative."
- **Mechanism:** Detailed KPI cards, trend lines, and raw value inspection

## Transparency Philosophy
Plain-language summaries are **derived from**—not a replacement for—formal metrics.
- Users can always inspect the underlying measurements via the "View underlying metrics" affordance.
- We translate complexity; we do not hide it.
- We prioritize "Human Override" (Canvas Parity) as a normative safety claim.
