# Troubleshooting

## Health check shows dbConfigured=false
- Set `DATABASE_URL` and redeploy; `/api/health` will validate connectivity

## Rate limiting not distributed
- Set `REDIS_URL`; receipts endpoint uses Redis when available

## OIDC errors
- Verify provider env vars and redirect URI; use `/api/auth/oidc/start` then `/api/auth/oidc/callback`

## CI failures
- Run `npm ci`, `npm run build`, and `node apps/web/scripts/e2e.js` locally to reproduce
