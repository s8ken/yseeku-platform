# API Reference

This document covers the primary HTTP endpoints implemented in the platform. All endpoints are provided by Next.js route handlers under `apps/web` and `apps/resonate-dashboard`.

## Conventions
- Base URL: your deployed domain
- Auth: JWT via `session_token` cookie or Authorization header `Bearer <token>` where applicable
- Formats: JSON by default; some endpoints support `csv` and `ndjson`

## Health
- Method: `GET`
- Path: `/api/health`
- Description: Reports database configuration and connectivity
- Response:
  - `dbConfigured`: `boolean`
  - `dbConnected`: `boolean`
  - `error?`: `string`
- Example:
```bash
curl -s https://your.domain/api/health
```

## Trust Receipts
### Create Receipt
- Method: `POST`
- Path: `/api/receipts`
- Description: Persists a cryptographic trust receipt
- Request: JSON matching `TrustReceipt` schema
- Response:
  - `saved`: `boolean`
  - `reason?`: `string`
  - Rate-limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Example:
```bash
curl -X POST https://your.domain/api/receipts \
  -H 'content-type: application/json' \
  -d '{"content": {"text": "..."}, "principles": {"...": 0.9}, "cryptography": {"signature": "...", "publicKey": "..."}}'
```

### List Receipts by Session
- Method: `GET`
- Path: `/api/receipts?session=<id>&tenant=<optional>`
- Description: Returns stored receipts for a session
- Response:
  - `rows`: `Array<object>` (receipt records)
- Example:
```bash
curl -s 'https://your.domain/api/receipts?session=abc123&tenant=default'
```

## Audit Export
- Method: `GET`
- Path: `/api/audit/export?tenant=<id>&limit=<n>&format=json|csv|ndjson`
- Description: Exports audit logs in the selected format
- Response:
  - `rows` in JSON, or CSV/NDJSON stream
- Example:
```bash
curl -s 'https://your.domain/api/audit/export?tenant=default&limit=100&format=csv'
```

## Policy Evaluation
- Method: `POST`
- Path: `/api/policy/evaluate`
- Description: Evaluates a trust policy against provided scores
- Request:
  - `scores`: object of metrics (e.g., `reality_index`, `canvas_parity`, etc.)
  - `policy?`: custom policy object; defaults to server `defaultPolicy`
- Response: evaluation result with pass/fail and details
- Example:
```bash
curl -X POST https://your.domain/api/policy/evaluate \
  -H 'content-type: application/json' \
  -d '{"scores": {"reality_index": 8.2, "canvas_parity": 87}}'
```

## Auth
### Demo Login
- Method: `POST`
- Path: `/api/auth/login`
- Description: Demo login that issues a JWT; in production use an IdP
- Request:
  - `username`: string
  - `password`: string
  - `roles?`: array of strings
  - `tenant_id?`: string
- Response:
  - `token`: JWT
  - `user`: user object
  - Cookie: `session_token`
- Example:
```bash
curl -X POST https://your.domain/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username": "demo", "password": "demo"}'
```

### OIDC Start
- Method: `GET`
- Path: `/api/auth/oidc/start`
- Description: Initiates OIDC auth flow; redirects to provider

### OIDC Callback
- Method: `GET`
- Path: `/api/auth/oidc/callback?code=<code>&state=<state>`
- Description: Completes OIDC flow, sets app session token
- Response:
  - `token`: JWT
  - `user`: user object
  - Cookie: `session_token`

## Dashboard Status
- Method: `GET`
- Path: `/api/dashboard/policy-status`
- Description: Returns current policy status for dashboard views

## Resonate Dashboard APIs
### Verify Trust Receipt
- Method: `POST`
- Path: `/api/receipts/verify`
- Description: Verifies a receipt signature and content hash
- Request: `{ content: object, cryptography: { signature: string, publicKey?: string } }`
- Response:
  - `verifiable`: `boolean`
  - `hashOk`: `boolean`
  - `signatureOk`: `boolean`
  - `computedHash`: `string`
  - `error?`: `string`

### Analyze Content
- Method: `POST`
- Path: `/api/analyze`
- Description: Content analysis for dashboard (implementation-specific)

### Calibration Decision
- Method: `POST`
- Path: `/api/calibration/decision`
- Description: Records a calibration decision in the demo ledger

### Alerts Export
- Method: `GET`
- Path: `/api/alerts/export`
- Description: Exports alert data (format options may apply)

## Error Handling
- JSON responses include `error` and human-readable `message` on failures
- Rate limiting responses use HTTP 429 with descriptive body and headers

## Security & Rate Limiting
- Rate limiting is applied to `POST /api/receipts`; headers indicate limits
- JWT secrets and OIDC credentials must be configured via environment variables

## Environments
- Required variables:
  - `JWT_SECRET`
  - `DATABASE_URL`
  - `REDIS_URL`
  - OIDC: `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_AUTH_URL`, `OIDC_TOKEN_URL`, `OIDC_REDIRECT_URI`
