# Enterprise Readiness

This document summarizes controls and operational practices to run the platform in regulated and mission-critical environments.

## Security
- Identities: W3C DID/VC for agent identities (`@sonate/orchestrate`)
- Access: RBAC with roles and tenants; API key rotation and rate limiting
- Audit: Cryptographic audit logging with hash-chain integrity
- Secrets: External secrets manager/KMS recommended; avoid `SONATE_PRIVATE_KEY` in production

## Compliance Alignment
- Frameworks: EU AI Act principles, SOC 2 readiness, GDPR, ISO/NIST mappings
- Data protection: PII minimization, configurable retention, export mechanisms
- Monitoring: Real-time trust scoring and alerts to support compliance controls

## Data Governance
- Trust Receipts: SHA-256 content hashing, Ed25519 signatures, append-only verification trails
- Ledger Options: Portable `.sonate` manifests with Merkle proofs; database-backed persistence for production

## SLOs & Performance
- Detection latency: sub-100ms typical under production load
- Throughput: 1000+ detections/sec (horizontally scalable)
- Availability targets: 99.9% typical; design for multi-zone deployments

## Resilience
- Rate limiting: Protects critical endpoints from abuse and spikes
- Backups: Regular DB snapshotting; verify restore procedures
- Disaster recovery: Multi-region replication recommended for RTO/RPO goals

## Incident Response
- Triage: Severity classification (Yellow/Red/Critical) based on trust alerts
- Forensics: Audit export (`/api/audit/export`) in JSON/CSV/NDJSON
- Post-incident: Integrity verification via trust receipts and hash chains

## Deployment Options
- Cloud: Vercel/Next.js for web; containerized services via Docker Compose
- Kubernetes: Preview configurations; production-grade manifests can be layered (ingress, HPA, secrets)
- Hybrid/Edge: Supported via container-based deployment

## Multi-Tenancy
- Tenant scoping across APIs (e.g., audit exports, receipts listing) to isolate organizations

## Observability
- Logs: Structured JSON logs for API handlers and orchestrator
- Metrics: Add Prometheus/OpenTelemetry in production environments

## Configuration
- Required env vars: `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, OIDC parameters
- Secrets storage: Use cloud KMS or vault; rotate routinely

## Support & Governance
- Support tiers: Enterprise SLA coverage with defined response times
- Change management: Changelog maintained at repo root; semantic versioning recommended
