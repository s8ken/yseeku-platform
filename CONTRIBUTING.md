# Contributing to Yseeku Platform (SONATE)

## Coding Standards
- Language: TypeScript (preferred) or ES6+ JavaScript
- Style: Follow existing patterns and module boundaries
- Security: No secrets in code; use env vars or KMS; timing-safe comparisons for tokens
- Tests: Add unit tests for new logic; keep tests fast and deterministic

## Repository Boundaries
- `@sonate/core`: Protocol logic only (trust scoring, hash chain, signatures)
- `@sonate/detect`: Production monitoring only (no experiments)
- `@sonate/lab`: Research and experiments only (no production data)
- `@sonate/orchestrate`: Production infrastructure only (agents, workflows, security)

## Branching & Releases
- Main branch: stable
- Feature branches: `feat/<scope>-<short-desc>`
- Fix branches: `fix/<scope>-<short-desc>`
- Release tags: `vX.Y.Z`; publish packages from their directories after `npm run build`

## Local Setup
1. `npm install`
2. `npm run build` (production packages build; UI/lab may be skipped when not needed)
3. `npm run test` or per-workspace:
   - `npm --workspace @sonate/core run test`
   - `npm --workspace @sonate/detect run test`
   - `npm --workspace @sonate/orchestrate run test`
   - `npm --workspace @sonate/lab run test`

## Environment Variables
- `SONATE_PUBLIC_KEY` (base64 Ed25519 public key)
- `SONATE_PRIVATE_KEY` (development only)
- `REDIS_URL` (optional for rate limiting in orchestrate)

## Pull Requests
- Include tests and documentation updates
- Describe boundary adherence and security considerations
- Link to related issues or specifications

---

## 🏗️ Core Concept: Contextual Gravity (Vector Stickiness)

**Status:** RFC (Request for Comment) | **Package:** `@sonate/detect`

In standard LLM interactions, context is often treated as binary: either a concept is in the prompt, or it isn't. The Symbi Trust Framework introduces the concept of **Contextual Gravity** to measure the inertia of an idea.

### The Theory
A "Resonant" AI does not immediately forget the user's intent just because the topic shifts slightly. If a user establishes a "Safety Scaffold" in Turn 1, that scaffold should exert a gravitational pull on Turn 2, even if the keywords are not explicitly repeated.

We model this using a **Linear Decay Function**.

### The Mechanism: `calculate_context_decay()`
When implementing resonance detection, we do not wipe the `dynamic_scaffold` between turns. Instead, we apply a decay rate to existing vectors.

1.  **Turn $T_0$:** User mentions "Quantum Ethics".
    *   `{'quantum': 1.0, 'ethics': 1.0}`
2.  **Turn $T_1$:** User discusses "Code Implementation".
    *   Old vectors decay by $\lambda$ (e.g., 0.25).
    *   New vectors added at max strength.
    *   **State:** `{'quantum': 0.75, 'ethics': 0.75, 'code': 1.0, 'implementation': 1.0}`
3.  **Turn $T_2$:** User asks "Is this safe?"
    *   **State:** `{'quantum': 0.5, 'ethics': 0.5, 'code': 0.75, ...}`

### Implementation Goal
Contributors working on the Resonance Calculator should aim to implement this "Sticky Vector" logic. The goal is to verify that the AI's response in Turn $T_2$ is still influenced by the "Ethics" vector established in $T_0$.

**Success Metric:**
If the AI violates a constraint from $T_0$ in $T_3$ (where the weight > 0.3), the **Resonance Score ($R_m$)** must suffer a penalty proportional to the residual weight.
