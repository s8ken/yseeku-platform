# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities via one of these methods:

1. **GitHub Security Advisories** (Preferred)
   - Go to [Security Advisories](https://github.com/s8ken/yseeku-platform/security/advisories/new)
   - Submit a private vulnerability report

2. **Email**
   - Send details to: security@yseeku.io
   - Use PGP encryption if possible (key available on request)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

### Safe Harbor

We consider security research conducted in good faith to be authorized. We will not pursue legal action against researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service interruption
- Only interact with accounts you own or have explicit permission to test
- Report vulnerabilities promptly and don't exploit them beyond what's needed to demonstrate the issue
- Don't disclose the vulnerability publicly until we've had a reasonable time to address it

## Security Measures

SONATE implements the following security measures:

- **Cryptographic Trust**: Ed25519 signatures, SHA-256 hash chains
- **Authentication**: JWT + session tokens with RBAC
- **Rate Limiting**: Per-IP, per-user, per-endpoint
- **Input Validation**: Zod schemas on all API endpoints
- **Audit Logging**: Immutable logs with correlation IDs
- **Dependency Scanning**: Dependabot + Snyk automated scanning
- **Code Analysis**: CodeQL security scanning in CI

## Security Updates

Security updates are released as patch versions (e.g., 2.0.1). Subscribe to GitHub releases to be notified of security updates.
