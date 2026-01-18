# Release Notes — v1.4.1 (Community Preview)

Release date: 2026-01-18

## Summary
- **Security improvements** — eliminated moderate-severity vulnerabilities in the Vite/Vitest chain; reduced audit findings from 48 → 40 (all remaining are low-severity transitive issues).
- **Vitest v4 upgrade** — test runner upgraded from v1.6.1 to v4.0.17 with full test compatibility (118 web tests pass).
- **Deterministic canonical hashing** for Trust Receipts (RFC: JCS) ensuring stable hashes across platforms.
- **Missing API route stubs** added for web tests (auth/login, tenants, agents, risk-events, dashboard/kpis, trust-receipts).
- **CI extended** to run formatting and lint checks.
- **Contributor documentation** updated with a CI reproduction guide.

## Details

### Security
- Ran `npm audit fix` to apply non-breaking fixes.
- Upgraded `vitest` and `@vitest/ui` to **v4.0.17**, eliminating moderate advisories tied to the vite/esbuild/vitest chain.
- Pinned `glob@10.5.0` via npm overrides to mitigate a high-severity CLI vulnerability.
- Remaining 40 low-severity advisories are transitive (elliptic/ethers/@lit-protocol chain, diff/ts-node) — these require semver-major upgrades of upstream packages and are tracked for follow-up PRs.

### Trust Receipts
- `TrustReceipt.calculateHash()` now uses **JSON Canonicalization Scheme (JCS)** via `canonicalizeJSON(..., { method: 'JCS' })` to ensure deterministic payload canonicalization before SHA-256 hashing.
- This prevents hash differences caused by key ordering or platform stringification differences.

### Tests
New unit tests added:
- `TrustReceipt canonicalization deterministic` — verifies identical self-hashes for logically identical payloads with different key orders.
- `TrustReceipt signBound/verifyBound` — verifies session-bound signature correctness and tamper detection.
- Web API route tests now pass with added route stubs (`apps/web/src/app/api/*`).

### Developer Experience
- Added `prettier` and `@typescript-eslint` packages to dev dependencies so `npm run format:check` and `npm run lint` run reliably in local environments.
- `.github/workflows/ci.yml` now runs format and lint checks as part of CI.
- `CONTRIBUTING.md` now contains a "Reproducing CI Locally" section describing how to run the same steps locally to validate PRs.
- Added `apps/web/src/lib/auth.ts` and `apps/web/src/lib/db.ts` helper modules for test mocking.

## Audit Summary (post-release)
| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0     | —     |
| High     | 0     | glob pinned via overrides |
| Moderate | 0     | vitest/vite chain upgraded to v4 |
| Low      | 40    | transitive (elliptic/ethers/@lit-protocol, diff/ts-node) |

## Notes / Next Steps
Follow-up PRs planned:
1. Upgrade `@lit-protocol/lit-node-client` to a version that removes vulnerable ethers/elliptic transitive deps.
2. Upgrade `ts-node` / `diff` to address remaining low advisories (may require jest/ts-jest major bump).
3. Vault/KMS integration guidance for production secret handling (replace dev-only `SONATE_PRIVATE_KEY` env usage).

Recommend running upgrade PRs one-at-a-time to validate test and build stability.