# Environment Variables

## Core
- `JWT_SECRET`: Required for issuing/verifying app tokens
- `DATABASE_URL`: Optional, enables Postgres persistence
- `REDIS_URL`: Optional, enables distributed rate limiting

## OIDC Providers
- Okta: `OIDC_PROVIDER=okta`, `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `OKTA_REDIRECT_URI`
- Azure AD: `OIDC_PROVIDER=azure`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_REDIRECT_URI`
- Generic: `OIDC_AUTH_URL`, `OIDC_TOKEN_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`
