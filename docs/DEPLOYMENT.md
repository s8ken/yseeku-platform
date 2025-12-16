# Deployment Guide

## Vercel

- Set env vars: `JWT_SECRET`, optional `DATABASE_URL`, `REDIS_URL`, OIDC vars
- Build and deploy from main branch; health at `/api/health`

## Docker Compose

- `docker-compose up --build`
- Services: `web` at `http://localhost:3000`, Postgres `5432`, Redis `6379`

## Kubernetes (preview)

- Container image built via `apps/web/Dockerfile`
- Expose web deployment and configure secrets via Kubernetes `Secret`
