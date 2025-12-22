# Platform Runbook

## Goals
- Minimal local setup to run web/API and persistence
- Secure handling of secrets and signing keys
- Guided Kubernetes deployment with production-minded defaults

## Prerequisites
- `Node.js >=20`
- `Docker` and `docker-compose` (optional for DB/Redis)
- `Postgres` and `Redis` (optional; enable persistence and rate limiting)

## Environment Setup
- Create `.env` files per app or use shell exports
- Required: `JWT_SECRET`
- Optional: `DATABASE_URL`, `REDIS_URL`, OIDC provider variables
- Signing keys (dev only): `SONATE_PRIVATE_KEY`, `SONATE_PUBLIC_KEY` for lab demos
- Production secrets must be provided by a vault/KMS; never commit secrets

## Local Development (Web/API)
- Install: `npm install`
- Run all apps: `npm run dev`
- Run only web: `npm --workspace web run dev`
- Default web: `http://localhost:3000`
- Health: `GET /api/health`

## Local Persistence (Docker Compose)
- Start services: `docker-compose up --build`
- Services:
  - `web`: `http://localhost:3000`
  - `postgres`: `5432`
  - `redis`: `6379`
- Set `DATABASE_URL` and `REDIS_URL` for the web app if using compose services

## Secure Key Handling
- Development:
  - Use ephemeral dev `JWT_SECRET` and demo Ed25519 keys for local runs
  - Store secrets in shell or `.env.local` files excluded from VCS
- Production:
  - Provision secrets via vault/KMS (AWS KMS, GCP KMS, HashiCorp Vault)
  - Inject into workloads with managed secret stores; rotate on schedule
  - Use signer microservice for server-side signing; log to immutable audit trail
  - Disable any file-based private keys in app containers

## Kubernetes Deployment (Preview)
- Build image: `apps/web/Dockerfile`
- Required secrets:
  - `JWT_SECRET` in a Kubernetes `Secret`
  - Optional OIDC provider credentials
  - Optional `DATABASE_URL`, `REDIS_URL`
- Recommended:
  - Ingress with TLS termination
  - Network policies to restrict DB/Redis access
  - Readiness/liveness probes on web/API
  - Horizontal Pod Autoscaler for web
- Signer microservice (planned):
  - Deploy as a separate service with no outbound key export
  - Provide signing API that binds session and nonce
  - Emit audit logs to append-only storage (e.g., WORM S3 or immutable DB table)

## Operational Notes
- Token hygiene:
  - Use short-lived JWTs, refresh tokens, and role-based access control
  - Enforce TTLs and revocation for sessions
- Observability:
  - Enable audit logging in persistence for all critical operations
  - Export structured logs to SIEM
- Backups:
  - Daily DB backups with retention
  - Secure storage with object lock (where available)

## Quick Checks
- `GET /api/health` returns `200`
- Auth flow returns JWT when `JWT_SECRET` is set
- Receipts API reachable at `/api/receipts`
- Dashboard verification endpoint responds at `apps/resonate-dashboard`

