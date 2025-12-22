# Static Secrets Scan Report

## Scope
- Scanned repository for common secrets patterns: cloud keys, tokens, private keys, and hardcoded credentials
- Focused on `apps/*`, `packages/*`, `docs/*`, `examples/*`

## Findings
- `apps/web/.env.local` contains `JWT_SECRET=dev-secret-please-change`
  - This appears to be a development-only value; ensure `.env.local` is not committed to VCS
- No AWS Access Key IDs (`AKIA...`) detected in source files during heuristic scan
- No GitHub Personal Access Tokens (`ghp_...`) detected
- No Google API keys (`AIza...`) detected
- No Slack tokens (`xoxb-...`) detected
- No PEM private key blobs committed as standalone files
- Crypto utilities and labs generate keys at runtime for demos (`packages/lab/src/receipts/signing.js`, `packages/core/src/security/crypto-enhanced.ts`)

## Recommendations
- Replace committed env files with examples:
  - Add `apps/web/.env.example` with placeholders
  - Ensure `.env.local` and any real `.env` files are git-ignored
- Rotate demo keys regularly; document demo-only usage
- Add CI secret scanning:
  - `trufflehog` against PRs and protected branches
  - `git-secrets` pre-commit hook for developers
- Centralize secrets via vault/KMS in production; avoid file-based private keys in containers
- Audit env var usage for `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, and OIDC credentials to ensure no defaults are shipping to production

## Next Actions
- Implement pre-commit and CI scanners
- Replace `.env.local` with `.env.example` placeholders
- Add signer microservice with immutable audit logging and KMS-backed keys

