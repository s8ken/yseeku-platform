# Ops Runbook (v1)

## Purpose
- Provide actionable procedures for common operations and incidents.

## Environments
- `dev`, `staging`, `prod` with parity; deployments via CI/CD to Kubernetes.

## Health Checks
- `GET /healthz` per service; Prometheus targets; Grafana dashboards.

## On-Call Procedures
- Alert channels: PagerDuty/Slack.
- Triage: identify impacted service, check logs/traces/metrics.
- Escalation: SRE → Platform → Security → Product.

## Common Incidents
- Elevated 5xx errors: roll back last deploy; inspect logs/traces; verify dependencies.
- Latency spikes: check database/load; scale replicas; enable caching.
- Auth failures: validate secrets/keys; rate limiting rules; rotate credentials.

## Standard Operations
- Rollout: blue/green; verify canary; full rollout after health checks.
- Rollback: trigger previous stable image; revalidate.
- Secrets rotation: via KMS/Vault; update deployments; audit.

## DR Procedures (Outline)
- Backups: scheduled snapshots; verify restores weekly.
- Restore: documented steps per datastore; RTO/RPO targets.
- Failover: multi-zone replicas; DNS or ingress switch.

## Troubleshooting Checklist
- Logs: structured JSON; filter by correlation ID/trace ID.
- Traces: OpenTelemetry spans for critical paths.
- Metrics: error rate, latency, saturation.

