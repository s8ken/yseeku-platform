## Objective
Audit the SYMBI‑SYNERGY repository to avoid duplicating functionality in Yseeku SONATE. Produce a deduplication matrix, integration recommendations, and a clean division of responsibilities.

## What I Will Check
- Trust infrastructure: DID/VC, cryptographic receipts, audit trails
- Detection: real‑time monitors, alerting (velocity/identity), API/middleware
- Lab: experimentation harness, metrics (CIQ, phase‑shift velocity), archive tooling
- Orchestration: RBAC, key management, rate limiting, workflow engine
- Dashboard/UI: operator views, calibration tools, trust receipt viewers

## Method
1. Fetch repo metadata & README to identify modules and capabilities.
2. Read key directories and files (read‑only):
   - `core/` or `trust/`: DID/VC, receipts controllers
   - `detect/`: detector services, thresholds, middleware
   - `lab/`: experiment runner, metrics
   - `orchestrate/`: RBAC, audit, rate limiting
   - `apps/` or `dashboard/`: UI components
3. Build a feature map comparing SYMBI‑SYNERGY to SONATE:
   - Present features, status (present/partial/missing), overlap/duplication risk
   - Recommend merge points or references instead of re‑implementation
4. Output deliverables:
   - Deduplication matrix (CSV/MD)
   - Integration plan (how SONATE should call or depend on SYMBI‑SYNERGY components)
   - Gap list (valuable features to port or expose as APIs)

## Access Note
If direct Git access is restricted, I will:
- Use any provided public URL or mirror
- Or request a zipped export link / read token to complete the audit

## Next
On approval, I will perform the read‑only survey and deliver the matrix and recommendations within this session.