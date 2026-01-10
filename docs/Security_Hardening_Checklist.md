# Security Hardening Checklist

## Governance
- Document SLA, access policies, audit logging, least privilege.

## Secrets Management
- Use KMS or HashiCorp Vault; no plaintext secrets.
- Automated rotation; audit trail.

## Application Security
- Per-user/API key rate limiting.
- SAST/DAST integrated in CI.
- Security headers (Helmet), CSRF, input validation.

## Infrastructure Security
- Signed container images; supply chain checks.
- Network policies, ingress rules; TLS everywhere.
- Backups encrypted at rest; DR tested.

## Testing
- Penetration test engagement; remediate findings.
- Dependency scanning; SBOM generation.

