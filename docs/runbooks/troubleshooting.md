# Troubleshooting Guide

- Backend not starting: check `MONGO_URI`, run `npm run build` in `apps/backend`
- Metrics missing: verify Prometheus at `http://localhost:9090`, backend `/api/metrics`
- Traces missing: set `OTEL_ENABLED=true`, collector at `http://localhost:4318`
- Logs missing: ensure Loki/Promtail compose is up, Grafana has Loki datasource
- Socket disconnections: check JWT auth token on client and `REDIS_URL` for adapter

