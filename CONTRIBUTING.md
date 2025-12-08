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