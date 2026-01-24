# SONATE Trust Kernel

The SONATE Trust Kernel defines identity, authority, memory, and enforcement boundaries for intelligent agents operating in production. It governs what actions are permissible; Overseer governs when and how permissible actions are considered.

## What the Trust Kernel Is
- A constitutional control layer that binds every action to a declared identity, scoped authority, and tenant context
- A classification and mode framework separating observation, advice, and execution
- An audit spine that preserves intent, rationale, and outcomes for accountability

## What It Is Not
- Not a replacement for cryptographic verification or signing
- Not an unbounded decision-maker; reasoning does not equal authority
- Not cross-tenant; all authority is scoped to a tenant

## v0.1 Guarantees (Identity & Authority)
- Every action is attributable to a named identity
- Every action is tenant-scoped; no cross-tenant authority
- Every enforcement action is auditable and produces an audit record
- Advisory and enforced actions are explicitly separated by mode
- No system agent can silently escalate its authority

## v0.1 Refusals (Identity & Authority)
- Refuses anonymous execution
- Refuses cross-tenant authority
- Refuses autonomous enforcement without explicit mode escalation
- Refuses irreversible actions without audit records

## Relationship to Overseer
Overseer is a system governance agent that operates within the SONATE Trust Kernel to monitor trust health and emergence, plan mitigations, and—only under explicit enforcement authority—execute auditable actions.
\- Overseer operates within Kernel boundaries and cannot exceed granted authority

## Kernel Boundary Statement
The Trust Kernel governs what actions are permissible. Overseer governs when and how permissible actions are considered.

---

## 2. Intent & Action Classification (v0.1)

### Kernel Rule: Intent is Required
No action may be planned or executed without an interpretable intent. Intent must be explicit or derivable, and recordable.

### Action Classes
**Observational Actions**
- Purpose: Understand state
- Examples: pull Bedau metrics; compute average trust; label emergence signals
- Properties: no side effects; always allowed; always logged
- Kernel Guarantee: observational actions never alter system state

**Advisory Actions**
- Purpose: Recommend intervention
- Examples: alert planning; threshold adjustment proposals; enforcement recommendations
- Properties: planned, not executed; stored as intent + plan; require explicit escalation to execute
- Kernel Guarantee: advisory actions inform humans/systems but do not act on the world

**Executory Actions**
- Purpose: Change system state
- Examples: adjust trust thresholds; ban/restrict/quarantine agents; session archival/cleanup
- Properties: side effects exist; must be authorized; must be auditable; reversible where possible
- Kernel Guarantee: executory actions require explicit mode escalation and are always audited

### Formal Flow
Signal → Observation → Intent → Plan → (Optional) Execution → Outcome → Memory

Intent forms at the Analyzer → Planner boundary and is preserved with the plan and any outcomes.

### LLM Reasoning Is Not Authority
Kernel Rule: Reasoning does not equal authority.
- LLM provides interpretation, rationale, suggested plans
- LLM does not execute actions, escalate modes, or bypass constraints

### Mode Escalation Rules
- Advisory mode preserves human sovereignty: think, plan, record
- Enforced mode enables delegated authority under audit: act, measure, learn
- Escalation requires explicit mode declaration and authority

### Guarantees (Component #2)
- Every planned action has interpretable intent
- Actions are classified before execution
- Advisory actions never mutate system state
- Executory actions require explicit escalation
- Reasoning outputs are preserved for audit

### Refusals (Component #2)
- Refuses to execute without intent
- Refuses to treat reasoning as authority
- Refuses silent escalation
- Refuses irreversible execution without trace

---

## 3. Constraint & Refusal Logic (v0.1)

Constraint & Refusal Logic ensures the system fails safely, visibly, and learnably when proposed actions violate constitutional boundaries.

Refusal as a Feature
- A refusal is not an error condition; it is a trust-preserving outcome.

Rules (implemented in code)
- Tenant context is required for all actions
- Only permitted action types may be proposed
- Executory actions require enforced mode
- High/critical enforcement requires explicit reason
- Ban/quarantine actions require explicit reason

---

## 4. Memory & Continuity Ethics (v0.1)

Constitutional Principle
- Memory exists to improve safety and governance, not to expand authority or autonomy.

Memory Classes
**Operational Memory**
- Purpose: enable continuity across cycles
- Examples: recent cycles; planned/executed actions; action status (success/failed/refused)
- Properties: short-to-medium retention; tenant-scoped; immutable once written
- Kernel Guarantee: operational memory preserves what happened, not why it mattered

**Evaluative Memory**
- Purpose: learn from outcomes
- Examples: action effectiveness scores; recommendations; trend summaries
- Properties: derived (not raw); non-authoritative; subject to decay/recalibration
- Kernel Guarantee: evaluative memory may inform planning but never authorise execution

**Refusal Memory**
- Purpose: preserve constitutional boundaries
- Examples: kernel refusals; constraint violations; unsafe proposals
- Properties: high-integrity; non-deletable within retention policy; explicitly labeled as refusals
- Kernel Guarantee: refusal memory is preserved as a trust signal, not a failure record

Memory Influence Limits
- Rule: memory may influence recommendations, but may not escalate authority, loosen constraints, or bypass review
- Memory cannot: auto‑escalate advisory → enforced; remove justification requirements; authorise new action classes
- Memory can: adjust confidence; recommend human review; suggest safer alternatives

Retention & Expiry (v0.1)
- Operational memory: retained per tenant, rolling window
- Evaluative memory: retained while statistically relevant
- Refusal memory: retained longer than success memory
- No cross‑tenant memory sharing
- Kernel Refusal: the system refuses to retain memory without declared purpose

Continuity Without Identity Drift
- Rule: memory continuity must not imply identity continuity
- Overseer does not become a persona; memory does not create goals; each cycle remains bounded by current authority and constraints

Implementation Mapping
- BrainMemory: evaluative + refusal memory
- Action outcomes: operational memory
- Feedback loop: evaluative synthesis
- Refusal recording: constitutional trace

Component #4 Guarantees
- Memory is tenant‑scoped
- Memory is classified by purpose
- Refusals are preserved and visible
- Memory informs planning, not execution
- Memory influence is bounded and reviewable

Component #4 Refusals
- Refuses to use memory to escalate authority
- Refuses cross‑tenant memory reuse
- Refuses undeclared retention
- Refuses to treat memory as intent

---

## 5. Accountability, Auditability & Human Override (v0.1)

Principle
- Accountability is the ability to attribute every action to an identity and tenant, with auditable outcomes and human override preserved.

Auditability
- All executory actions produce audit logs with identity, tenant, action type, target, severity, outcome, and details
- Refusals are audited as trust‑preserving outcomes
- Audit logs are queryable per tenant and traceable to cycles and actions

Human Override
- Administrators may override executed actions (e.g., restore agents, revert thresholds) under audit
- Overrides are tenant‑scoped, recorded, and do not bypass constraints
- Override authority does not escalate permissible action classes

Operational Rules (implemented)
- Kernel refusals are logged and alerted
- Override endpoint supports reversal of threshold adjustments and agent enforcement
- Advisory vs enforced separation remains intact under override

Guarantees
- Every executory or override action is auditable
- Human override is available and recorded
- Overrides cannot silently expand authority

Refusals
- Refuses execution without audit attribution
- Refuses override without tenant context and identity

## Implementation References
- Overseer routes: `apps/backend/src/routes/overseer.routes.ts:34–51`, `58–89`, `96–143`
- Thinking cycle: `apps/backend/src/services/system-brain.service.ts:84–179`
- Sensors & analyzer: `apps/backend/src/services/brain/sensors.ts:4–8`, `apps/backend/src/services/brain/analyzer.ts:1–8`
- Planner & executor: `apps/backend/src/services/brain/planner.ts:3–11`, `apps/backend/src/services/brain/executor.ts:26–101`
- Enforcement actions (ban/restrict/quarantine/unban): `apps/backend/src/services/brain/executor.ts:141–232`, `237–309`, `314–388`, `393–464`
- Feedback loop & recommendations: `apps/backend/src/services/brain/feedback.ts:55–95`, `100–142`, `147–213`, `218–291`
