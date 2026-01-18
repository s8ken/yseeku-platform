# Release Notes — v1.4.1 (Community Preview)

Release date: 2026-01-18

Summary
- Security improvements and developer experience updates.
- Deterministic canonical hashing for Trust Receipts (RFC: JCS) ensuring stable hashes across platforms.
- Tests added for TrustReceipt canonicalization and session-bound signatures.
- CI extended to run formatting and lint checks.
- Contributor documentation updated with a CI reproduction guide.

Details
- Security: Ran `npm audit fix` to apply non-breaking fixes. Several advisories remain that require major updates (e.g., `elliptic`, `esbuild`, `glob`). These are recorded and will be addressed in targeted dependency upgrade PRs.

- Trust Receipts: `TrustReceipt.calculateHash()` now uses JSON Canonicalization Scheme (JCS) via `canonicalizeJSON(..., { method: 'JCS' })` to ensure deterministic payload canonicalization before SHA-256 hashing. This prevents hash differences caused by key ordering or platform stringification differences.

- Tests: New unit tests were added:
  - `TrustReceipt canonicalization deterministic` — verifies identical self-hashes for logically identical payloads with different key orders.
  - `TrustReceipt signBound/verifyBound` — verifies session-bound signature correctness and tamper detection.

- Developer Experience:
  - Added `prettier` and `@typescript-eslint` packages to dev dependencies so `npm run format:check` and `npm run lint` run reliably in local environments.
  - `.github/workflows/ci.yml` now runs format and lint checks as part of CI.
  - `CONTRIBUTING.md` now contains a "Reproducing CI Locally" section describing how to run the same steps locally to validate PRs.

Notes / Next Steps
- Follow-up PRs planned:
  1. Targeted dependency upgrades for remaining high/critical advisories (may require careful upgrades to some consumer packages).
  2. Vault/KMS integration guidance for production secret handling (replace dev-only `SONATE_PRIVATE_KEY` env usage).

If you'd like, I can open the follow-up PRs and start the targeted dependency upgrade process next. (Recommend running the upgrade PRs one-at-a-time to validate test and build stability.)