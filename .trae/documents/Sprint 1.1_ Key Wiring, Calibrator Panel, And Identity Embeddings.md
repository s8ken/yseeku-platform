## Objectives
- Wire Ed25519 keys via environment for consistent trust receipt verification across sessions.
- Add a calibrator UI on case detail pages to approve/reject flags, promote to Golden, and annotate decisions with an audit trail.
- Upgrade identity classifier with lightweight embeddings to improve persona coherence measurement.

## Implementation Plan
### 1) Key Management & Verification
- Add `.env.local` variables to `apps/resonate-dashboard` and `packages/lab`:
  - `SONATE_PUBLIC_KEY` (base64 DER/SPKI)
  - `SONATE_PRIVATE_KEY` (base64 DER/PKCS8) — dev only; use secure vault in prod.
- Update receipt signing/verification to read keys from env consistently (no transient key gen);
  - Ensure `/api/receipts/verify` uses `SONATE_PUBLIC_KEY` when receipt lacks `publicKey`.
- Security: redact private key from logs; document production guidance (KMS/Secrets Manager).

### 2) Calibrator Panel (Case Detail)
- UI actions on `/overseer/case/[id]`:
  - Approve/Downgrade flag, Promote to Golden, Add Annotation.
- Server routes:
  - `POST /api/calibration/decision` → persists a decision record: `{ caseId, action, reason, user, timestamp }`.
  - `POST /api/calibration/thresholds` → optional batch adjustments (e.g., tweak identity/red bands), logged with audit trail.
- Storage: write to `packages/lab/reports/calibration-ledger.json` (append-only) for demo; abstract to DB later.
- Dashboard: show latest decisions and annotation excerpts on case page.

### 3) Identity Embeddings Upgrade
- Add a light-weight embedding (e.g., bag-of-keyphrase vectors or optional local model) to augment tag weights.
- Compute per-turn vector and cosine similarity to baseline persona; replace current heuristic-only series.
- Persist enhanced `identityStabilitySeries` and include summary metrics: mean, min, count of sub-threshold events.
- Visual: draw threshold guide lines at 0.85/0.75/0.65.

### 4) Documentation
- README updates: key management, calibrator workflow, identity embeddings rationale and thresholds.
- Add a short “Operator Guide” to `apps/resonate-dashboard` describing calibration actions and how decisions affect thresholds.

## Deliverables
- Env-based key wiring for trust receipts; consistent verification.
- Calibrator panel with decision ledger and case annotations.
- Improved identity classifier with embeddings; updated series and visuals.
- Updated docs and operator guide.

## Verification
- Generate and verify receipts with env keys in local dev.
- Perform calibration actions and confirm ledger persists decisions.
- Validate identity sparkline reflects upgraded series and thresholds.
- Confirm no secrets are committed; `.gitignore` continues to exclude Archives.
