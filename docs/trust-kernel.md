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
The Trust Kernel defines the constitutional boundaries: what identities exist, what actions are permissible, what refusals are mandatory, and how memory influences authority. Overseer operates within these boundaries to monitor, plan, and execute. The Kernel is immutable within a deployment; Overseer's decisions are auditable and reversible.

---

## 1. Tenant Context (v0.1)

### Constitutional Principle
Every action occurs within a tenant scope. No action may execute without valid tenant context.

### Tenant Context Definition
Tenant context includes:
- **Tenant ID**: Unique identifier for the organizational boundary
- **Tenant Authority Level**: Scope of permissible actions within this tenant
- **Tenant-Specific Constraints**: Custom rules, thresholds, and policies
- **Tenant-Scoped Memory**: Operational, evaluative, and refusal memory isolated per tenant

### Kernel Guarantees
- Every action is bound to a single tenant
- Cross-tenant actions are constitutionally refused
- Tenant context loss results in immediate action refusal
- Memory, authority, and audit trails are strictly tenant-scoped

### Kernel Refusals
- Refuses execution without valid tenant context
- Refuses cross-tenant authority delegation
- Refuses cross-tenant memory access
- Refuses ambiguous tenant scope

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

### Escalation Authority Binding
Mode escalation from advisory to enforced requires:
- **(a)** Explicit human approval, OR
- **(b)** Pre-authorized escalation rules bound to specific action types and severity thresholds

Pre-authorized escalation rules must be:
- Tenant-scoped and cannot apply across tenants
- Documented with clear triggering conditions
- Auditable with full escalation history
- Revocable by tenant administrators

**Kernel Guarantee**: No silent escalation may occur under automation without pre-authorized rules or explicit human approval

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

### Refusal Memory Retention Rules
Refusal memory is subject to strict retention requirements:
- Retained for the **operational lifetime of the tenant**
- Plus a minimum of **90 days post-tenant-termination** for compliance review
- **Cannot be deleted**; may only be archived with full audit trail
- Archives must preserve original context, timestamp, and refusal rationale
- Refusal patterns are queryable for governance and security analysis

**Kernel Refusal**: The system refuses to purge refusal memory within the retention window

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
Human override is available for all executory actions. Overrides must satisfy:
- **(a)** Tenant-scoped: overrides apply only within the authorizing tenant
- **(b)** Logged with override rationale: every override requires documented justification
- **(c)** Do not retroactively authorize: overrides reverse outcomes but do not legitimize the original action
- **(d)** Cannot be chained to bypass constraints: overrides cannot create new authority or escalate action classes

**Override Authority Governance**:
- Override authority is explicitly granted per role
- Scoped to specific action types and severity levels
- Revocable by tenant administrators or platform governance
- Subject to audit review and compliance reporting

**Kernel Guarantee**: Override itself is a governed action, not a backdoor

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

---

## 6. Kernel Immutability (v0.1)

### Constitutional Principle
The Trust Kernel rules (Components 1–5) are fixed for a given deployment. Changes to Kernel rules require formal governance processes.

### Kernel Modification Requirements
Changes to Trust Kernel rules require:
- **(a)** Explicit version bump with semantic versioning
- **(b)** Tenant notification with impact summary
- **(c)** Full audit trail of rule changes and rationale
- **(d)** Human approval from authorized governance role

### Runtime Immutability
**Kernel Guarantee**: No runtime escalation, learning process, or automated optimization can modify Kernel rules.

- Overseer cannot rewrite its own constraints
- Memory cannot loosen constitutional boundaries
- LLM reasoning cannot bypass Kernel rules
- API calls cannot dynamically alter action classes or authority scopes

### Versioning & Deployment
- Each Kernel version has a unique identifier (e.g., `v0.1`, `v0.2`)
- Deployments declare their Kernel version explicitly
- Version mismatches between tenants and deployments are logged and alerted
- Kernel upgrades require controlled rollout with rollback capability

**Kernel Refusal**: The system refuses to apply Kernel rule changes without explicit version governance.

---

## 7. Failure Modes (v0.1)

### Purpose
The Trust Kernel must fail safely and visibly. This section names critical failure modes and their handling.

### Defined Failure Modes

**Overseer Failure**
- **Condition**: Overseer agent crashes, becomes unreachable, or enters invalid state
- **Handling**: 
  - All enforcement actions immediately suspend
  - Advisory mode continues with degraded functionality
  - Alert generated for human review
  - Last known state preserved in operational memory
  - No silent failover to unrestricted behavior

**Audit Corruption**
- **Condition**: Audit log write fails, becomes corrupted, or is tampered with
- **Handling**:
  - Executory actions are refused until audit integrity is restored
  - Audit corruption events are logged to secondary immutable store
  - Affected actions are marked with audit failure flag
  - Human review required before resuming enforcement

**Tenant Context Loss**
- **Condition**: Tenant ID becomes invalid, ambiguous, or unretrievable
- **Handling**:
  - Immediate refusal of all actions
  - No fallback to default tenant or global scope
  - Session terminated with context loss error
  - Audit record created with partial context (if recoverable)

**Memory Consistency Failure**
- **Condition**: Operational, evaluative, or refusal memory becomes inconsistent or unreachable
- **Handling**:
  - Actions continue with degraded memory (no historical context)
  - Memory inconsistency logged and alerted
  - No fabrication of missing memory
  - Enforcement mode may be suspended if memory is critical to constraint evaluation

**Escalation Authority Ambiguity**
- **Condition**: Unclear whether escalation rules authorize a specific action
- **Handling**:
  - Action is refused with ambiguity rationale
  - Human review requested
  - Ambiguous cases logged for rule refinement

### General Failure Principles
- **Fail Closed**: Ambiguity results in refusal, not permissiveness
- **Fail Visible**: Failures generate alerts and audit records
- **Fail Recoverable**: System state is preserved for post-failure analysis
- **Fail Learnable**: Failure patterns inform Kernel evolution

**Kernel Guarantee**: No failure mode permits silent escalation or unauthorized execution.

---

## 8. Kernel Evolution (v0.1)

### Purpose
The Trust Kernel must evolve to meet new requirements without becoming a cage. This section defines the governance path for Kernel changes.

### Evolution Governance Process

Changes to the Trust Kernel (e.g., adding new action classes, modifying constraint logic, updating memory retention rules) require:

1. **Documented Rationale**
   - Business or security justification for the change
   - Specific problem being solved
   - Alternative approaches considered

2. **Impact Analysis**
   - Assessment of affected tenants and existing actions
   - Backward compatibility evaluation
   - Risk analysis for unintended consequences

3. **Human Review and Approval**
   - Review by platform governance committee or authorized role
   - Approval from affected tenant administrators (for tenant-impacting changes)
   - Security and compliance review

4. **Version Increment**
   - Semantic version bump reflecting change severity
   - Change documented in Kernel version history
   - Migration path defined for tenants on older versions

5. **Controlled Rollout**
   - Staged deployment with monitoring
   - Rollback plan in place
   - Post-deployment validation

### Evolution Constraints

**Constitutional Principles Must Remain Intact**:
- Tenant scoping cannot be removed
- Audit requirements cannot be weakened
- Identity attribution cannot be made optional
- Refusal memory retention cannot be shortened below minimums

**Evolution Cannot**:
- Retroactively authorize previously refused actions
- Weaken oversight without explicit governance approval
- Remove human override capability
- Enable silent cross-tenant authority

**Evolution Can**:
- Add new action classes with appropriate constraints
- Refine constraint logic based on operational learnings
- Extend memory retention for enhanced governance
- Improve failure mode handling

### Experimental Features

New Kernel features may be deployed as experimental with:
- Opt-in tenant participation
- Enhanced audit logging
- Automatic sunset if not promoted to stable
- Clear experimental labeling in audit trails

**Kernel Guarantee**: Evolution is governed, documented, and reversible. The Kernel does not evolve autonomously.

---

## Implementation References
- Overseer routes: `apps/backend/src/routes/overseer.routes.ts:34–51`, `58–89`, `96–143`
- Thinking cycle: `apps/backend/src/services/system-brain.service.ts:84–179`
- Sensors & analyzer: `apps/backend/src/services/brain/sensors.ts:4–8`, `apps/backend/src/services/brain/analyzer.ts:1–8`
- Planner & executor: `apps/backend/src/services/brain/planner.ts:3–11`, `apps/backend/src/services/brain/executor.ts:26–101`
- Enforcement actions (ban/restrict/quarantine/unban): `apps/backend/src/services/brain/executor.ts:141–232`, `237–309`, `314–388`, `393–464`
- Feedback loop & recommendations: `apps/backend/src/services/brain/feedback.ts:55–95`, `100–142`, `147–213`, `218–291`

---

## Version History

### v0.1 (Current)
- Initial Trust Kernel specification
- Components 1–5: Tenant Context, Intent & Action Classification, Constraint & Refusal Logic, Memory & Continuity Ethics, Accountability & Human Override
- Components 6–8: Kernel Immutability, Failure Modes, Kernel Evolution governance
- Deployment: YSEEKU SONATE platform initial release
