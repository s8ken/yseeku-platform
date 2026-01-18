# Infrastructure as Code Plan

## Local Development
- `docker-compose.yml` for API, web, database, cache.

## Kubernetes
- Manifests for deployments, services, ingress, HPA.
- Namespaces: `dev`, `staging`, `prod` with overlays.

## Terraform
- Modules: networking, cluster, storage, observability.
- State stored securely; CI apply with approvals.

## CI/CD
- Build, test, scan, deploy pipelines.
- Blue/green and canary strategies; automated rollbacks.

