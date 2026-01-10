# Developer Onboarding

- Prereqs: Node 20, Docker, Kubernetes context (optional), Redis (optional)
- Setup: `npm ci`, `npm run dev` in `apps/backend` and `apps/web`
- Observability: `docker compose -f docker-compose.observability.yml up`
- Logging: `docker compose -f docker-compose.logging.yml up`
- Env flags: `OTEL_ENABLED=true`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces`

