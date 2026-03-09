# SONATE Licensing & Open Standards

## Our Philosophy

SONATE is built on a simple belief:

**AI governance must be independently verifiable.**
**Verification should never depend on a single vendor — including us.**

We publish open standards, open verification tools, and transparent cryptographic foundations.

At the same time, we protect the proprietary governance engine that powers SONATE's enterprise-grade enforcement, drift detection, and oversight.

This balance — **open verification, protected governance** — is what makes SONATE both trustworthy and defensible.

---

## Open Components (MIT Licensed)

The following components are fully open source and available under the MIT License.

They enable anyone — developers, auditors, regulators — to independently verify SONATE trust receipts without relying on our API, infrastructure, or services.

### Verification SDKs

- Ed25519 signature validation
- SHA-256 hash-chain verification
- RFC 8785 canonicalization validation
- W3C Verifiable Credential proof verification
- Deterministic receipt parsing and validation
- JavaScript and Python parity

**Repository:** [sonate-verify-sdk](https://github.com/s8ken/sonate-verify-sdk)

### Trust Receipt Specification v1.0

- Full receipt schema
- Canonical JSON structure
- Hash-chaining format
- Public key endpoint definition
- DID identity structure
- Privacy mode semantics
- Compliance mappings (NIST, ISO 27001, SOC 2)
- Test vectors for interoperability

### Internal Open Packages

The following packages within this monorepo are MIT-licensed:

- `@yseeku/trust-receipts` — Receipt generation and validation
- `@sonate/schemas` — Trust receipt and policy schemas
- `@sonate/core` — Core utility functions and configuration

**Verification is vendor-neutral by design.**

Anyone can validate SONATE receipts offline, in any environment, using open tools. You are not locked into SONATE infrastructure to verify cryptographic integrity.

---

## Proprietary Components (Commercial License)

These systems form SONATE's governance engine — the intelligence layer that evaluates, enforces, and governs AI behavior.

They represent SONATE's core intellectual property and are licensed under commercial terms.

### Policy Engine Runtime

- Weighted constraint orchestration
- Real-time enforcement logic
- Tenant-configurable rule frameworks
- Violation persistence and audit logic
- SONATE principle evaluation

### Behavioral Drift Detection

- Cross-session volatility modeling
- Temporal alignment analysis
- Instability threshold calibration
- Multi-turn behavioral deviation scoring

### Phase-Shift Velocity Model

- Multi-signal behavioral transition detection
- Policy-alignment variance scoring
- Identity-state oscillation analysis

### Overseer Governance Layer

- Closed-loop monitoring and escalation
- Autonomous policy enforcement sequencing
- Enterprise-grade orchestration and controls
- Archive analysis and validation
- Real-time threat detection

**These systems are the backbone of SONATE's enterprise governance capabilities.**

---

## Commercial Licensing

SONATE is licensed on a per-tenant, per-environment basis.

### Enterprise Licensing Includes

- Unified model gateway
- Governance enforcement
- Drift detection
- Trust receipt generation
- Archive ingestion
- Compliance export tooling
- Key rotation and security controls
- Multi-region deployment options

### Custom Licensing

Custom licensing is available for regulated industries and high-assurance environments.

For commercial licensing inquiries: **licensing@yseeku.com**

---

## Main Repository License

This repository is distributed under a **Proprietary Source Available** license. See [LICENSE](LICENSE) for full terms.

**PERMISSIONS:**
- View and study source code for personal, educational purposes
- Submit issues and pull requests to contribute improvements
- Reference architecture and design patterns

**RESTRICTIONS:**
- No commercial use, modification, or distribution without explicit permission
- No competing service provision using this code
- No sublicensing, selling, or transfer

**CONTRIBUTIONS:**
By submitting a pull request, you agree to assign all rights to Yseeku Pty Ltd and grant a perpetual, irrevocable license to use your contribution.

---

## Standards Commitment

We are committed to:

- **Open verification** — Anyone can validate SONATE receipts
- **Independent auditability** — No black boxes, cryptography is transparent
- **Transparent cryptographic foundations** — Ed25519, SHA-256, RFC standards
- **No lock-in for receipt validation** — Use our SDKs or implement your own
- **Stable, versioned specifications** — Trust Receipt Specification v1.0+
- **Interoperability across languages and platforms** — JavaScript, Python, Go, etc.

SONATE aims to become the industry standard for AI non-repudiation infrastructure — a foundation that any organization can trust, verify, and build upon.

---

## Summary

**SONATE is:**

✅ **Open where it matters** — verification, cryptography, specification, open SDKs

🔒 **Proprietary where it must be** — governance engine, enforcement logic, drift detection, Overseer system

🔍 **Transparent by design** — no black boxes, no unverifiable claims

🌐 **Built for the ecosystem** — not just for our platform

---

## Platform Structure

For a detailed breakdown of which components are open vs. proprietary, see the individual package READMEs:

- [`packages/trust-receipts`](packages/trust-receipts/README.md) — MIT
- [`packages/schemas`](packages/schemas/README.md) — MIT
- [`packages/core`](packages/core/README.md) — Proprietary (core platform logic)
- [`packages/detect`](packages/detect/README.md) — Proprietary (drift detection)
- [`packages/orchestrate`](packages/orchestrate/README.md) — Proprietary (enforcement engine)
- [`packages/lab`](packages/lab/README.md) — MIT (experimental, non-production)
- [`apps/backend`](apps/backend/README.md) — Proprietary (governance runtime)
- [`apps/web`](apps/web/README.md) — Proprietary (dashboard and UI)
