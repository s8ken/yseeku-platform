# Pilot Deployment Guide

## Prerequisites
- Docker and Docker Compose
- API keys as needed:
  - `TOGETHER_API_KEY` for BGE embeddings via Together
  - or `OPENAI_API_KEY` for OpenAI embeddings
  - or `HF_API_TOKEN` for Hugging Face MiniLM
- Optional secrets:
  - `SECRETS_PROVIDER=vault`, `VAULT_ENDPOINT`, `VAULT_TOKEN`, and `TRUST_SIGNING_PRIVATE_KEY_REF`

## Start Locally
```bash
docker compose -f docker-compose.pilot.yml up --build
```
- Web: `http://localhost:5000`
- Backend: `http://localhost:3001`
- Postgres: `localhost:5432` (user/pass `yseeku`)
- Mongo: `localhost:27017`
- Redis: `localhost:6379`

## Recommended Environment
- Set embeddings:
  - `DETECT_EMBEDDINGS_PROVIDER=together` and `DETECT_EMBEDDINGS_MODEL=BAAI/bge-small-en-v1.5`
  - Or `DETECT_EMBEDDINGS_PROVIDER=huggingface` and `DETECT_EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2`
  - Or `DETECT_EMBEDDINGS_PROVIDER=openai` and `DETECT_EMBEDDINGS_MODEL=text-embedding-3-small`
- Disable demos in production:
  - `DEMO_ROUTES_ENABLED=false`
- Redis durability is enabled by default in `docker-compose.pilot.yml`.

## Railway / Vercel
- Vercel:
  - Deploy `apps/web` with env:
    - `NEXT_PUBLIC_BACKEND_URL` pointing to your backend URL
    - `DATABASE_URL`, `REDIS_HOST/PORT` (or managed providers)
    - `DETECT_*` provider vars and corresponding API key
    - `DEMO_ROUTES_ENABLED=false`
- Railway (or similar) for backend:
  - Deploy `apps/backend` with env:
    - `PORT=3001`, `MONGODB_URI`, `CORS_ORIGIN` (Vercel URL)
    - `SECRETS_PROVIDER=vault` and secrets references if used
    - `DEMO_ROUTES_ENABLED=false`

## Invite Testers
- Create 3–5 test users in the web app (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and share the Vercel URL.
- Provide a short walkthrough:
  - Trust Settings: saved in Postgres
  - Audit Trails: backed by `audit_logs`
  - Trust Receipts: signed and chained; visible under analytics
  - Detection: embeddings powered by your configured provider

