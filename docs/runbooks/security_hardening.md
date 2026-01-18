# Security Hardening

- Enforce RBAC scopes: `llm`, `gateway`, `secrets` routes use `requireScopes`
- Rate limiting: configure per-user/IP and endpoint limiters by environment
- Secrets: use Vault/KMS providers; avoid storing raw secrets in env
- Headers: enable Helmet and strict CORS per environment
- CI scans: ZAP baseline nightly; add SAST (CodeQL) and dependency audits

