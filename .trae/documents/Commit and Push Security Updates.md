I will implement the requested security enhancements to prepare the codebase for production deployment.

### 1. **Secure Signer Implementation**
Modify `packages/orchestrate/src/security/signer.ts` to include real KMS integrations:
- **AWS KMS Signer**: utilizing `@aws-sdk/client-kms`.
- **GCP KMS Signer**: utilizing `@google-cloud/kms`.
- **Vault Signer**: utilizing `node-vault`.
- **Provider Selection**: Update `getDefaultSigner` to initialize the correct provider based on environment variables (`SIGNER_PROVIDER`, `KMS_KEY_ID`, etc.).

### 2. **Distributed Persistence (Nonces & Revocations)**
Create a new module `packages/orchestrate/src/security/persistence.ts` to handle distributed state:
- **NonceManager**: Prevent replay attacks by storing used nonces in Redis (with TTL).
- **RevocationManager**: Store revoked tokens/receipts in Redis/Postgres.
- **Interfaces**: Define generic `Store` interfaces for these to allow swapping backends.

### 3. **Immutable Audit Storage**
Enhance `packages/orchestrate/src/security/audit.ts`:
- Refine `DatabaseAuditStorage` to ensure it uses an append-only pattern.
- Add SQL migration/schema documentation for creating the WORM-compliant table structure.

### 4. **CI Security Scanning**
Create `.github/workflows/security.yml` to:
- Run **CodeQL** analysis.
- Run **Secret Scanning** (trufflehog or similar pattern).
- Run **Tests** for the new signer and persistence modules.

### 5. **RBAC Enforcement**
- Update `apps/web/src/middleware.ts` to leverage the `RBACManager` for stricter route guarding.

I will start by creating the **Signer** and **Persistence** modules.
