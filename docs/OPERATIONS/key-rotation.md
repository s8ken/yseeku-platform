# Key Rotation Procedures

## Overview

This document outlines the procedures for rotating cryptographic keys used in the YSEEKU Platform, with a focus on the Ed25519 signing keys used for Trust Receipts and DID verification.

## Key Inventory

| Key Type | Purpose | Storage | Rotation Frequency |
|----------|---------|---------|-------------------|
| `RECEIPT_SIGNING_KEY` | Ed25519 key for signing Trust Receipts | Environment variable / Secrets manager | 90 days or on compromise |
| `JWT_SECRET` | JWT token signing | Environment variable / Secrets manager | 90 days or on compromise |
| `MONGODB_URI` | Database connection credentials | Environment variable / Secrets manager | On compromise only |
| `API_KEYS` (OpenAI, Anthropic) | LLM provider authentication | Environment variable / Secrets manager | On compromise or expiry |

## Ed25519 Key Rotation (Trust Receipts)

### Prerequisites

- Access to production secrets management (Vault/KMS/Railway Secrets)
- Node.js environment for key generation
- Scheduled maintenance window (recommended)

### Step 1: Generate New Key Pair

```bash
# Using the built-in key generation utility
cd apps/backend
npx ts-node -e "
import { generateKeyPair } from './src/services/trust-receipt.service';
const keys = generateKeyPair();
console.log('New Private Key (base64):', Buffer.from(keys.privateKey).toString('base64'));
console.log('New Public Key (base64):', Buffer.from(keys.publicKey).toString('base64'));
"
```

Or using a standalone script:

```typescript
import * as ed from '@noble/ed25519';

async function generateKeys() {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  console.log('Private Key (hex):', Buffer.from(privateKey).toString('hex'));
  console.log('Public Key (hex):', Buffer.from(publicKey).toString('hex'));
  console.log('Private Key (base64):', Buffer.from(privateKey).toString('base64'));
  console.log('Public Key (base64):', Buffer.from(publicKey).toString('base64'));
}

generateKeys();
```

### Step 2: Update Key in Secrets Manager

**Railway:**
```bash
railway variables set RECEIPT_SIGNING_KEY=<new-private-key-base64>
railway variables set RECEIPT_PUBLIC_KEY=<new-public-key-base64>
```

**Kubernetes (via kubectl):**
```bash
kubectl create secret generic receipt-signing-key \
  --from-literal=private-key=<new-private-key-base64> \
  --from-literal=public-key=<new-public-key-base64> \
  --dry-run=client -o yaml | kubectl apply -f -
```

**HashiCorp Vault:**
```bash
vault kv put secret/yseeku/receipt-keys \
  private_key=<new-private-key-base64> \
  public_key=<new-public-key-base64>
```

### Step 3: Rolling Deployment

1. Deploy new instances with new key
2. Old receipts remain verifiable (signatures are stored with receipts)
3. New receipts use new key
4. Monitor for signature verification errors

### Step 4: Update DID Document

If using DID:web for key publication:

```bash
# Update the DID document with the new verification method
curl -X PUT https://your-domain/.well-known/did.json \
  -H "Content-Type: application/json" \
  -d '{
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:web:your-domain",
    "verificationMethod": [{
      "id": "did:web:your-domain#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:your-domain",
      "publicKeyMultibase": "<new-multibase-public-key>"
    }]
  }'
```

### Step 5: Verification

```bash
# Test receipt signing with new key
curl -X POST https://api.yseeku.com/api/dashboard/receipts/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent", "action": "key_rotation_test"}'

# Verify the receipt signature
curl https://api.yseeku.com/api/dashboard/receipts/<receipt-id>/verify
```

### Step 6: Archive Old Key

Store the old private key securely for potential historical verification:

```bash
# Archive in secure, offline storage
vault kv put secret/yseeku/archived-keys/receipt-$(date +%Y%m%d) \
  private_key=<old-private-key> \
  retired_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  reason="scheduled_rotation"
```

## JWT Secret Rotation

### Procedure

1. Generate new secret:
   ```bash
   openssl rand -base64 64
   ```

2. Update environment:
   ```bash
   railway variables set JWT_SECRET=<new-secret>
   ```

3. Rolling deployment (tokens signed with old secret expire naturally)

4. Force logout (optional, for security incidents):
   ```bash
   # Invalidate all existing sessions
   curl -X POST https://api.yseeku.com/api/auth/invalidate-all-sessions \
     -H "X-Admin-Key: <admin-key>"
   ```

## Emergency Key Rotation (Compromise Response)

### Immediate Actions

1. **Generate new key immediately** (skip maintenance window)
2. **Revoke compromised key** in all environments
3. **Force rotation** with zero-downtime deployment
4. **Audit** all receipts/tokens signed during exposure window
5. **Notify** affected tenants if necessary

### Post-Incident

1. Document timeline in incident report
2. Review access logs for key exposure point
3. Update access controls as needed
4. Schedule follow-up security review

## Monitoring and Alerts

### Key Age Monitoring

Add Prometheus metrics for key age:

```yaml
# Alert when key is approaching rotation deadline
- alert: KeyRotationDue
  expr: (time() - key_creation_timestamp) > 7776000  # 90 days
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Key rotation due for {{ $labels.key_type }}"
```

### Rotation Audit Log

All key rotations are logged:

```typescript
await logAudit({
  action: 'key_rotation',
  resourceType: 'signing_key',
  resourceId: 'receipt-signing-key',
  userId: 'system-admin',
  tenantId: 'platform',
  severity: 'info',
  outcome: 'success',
  details: {
    keyType: 'ed25519',
    reason: 'scheduled_rotation',
    oldKeyFingerprint: '<sha256-of-old-public-key>',
    newKeyFingerprint: '<sha256-of-new-public-key>',
  }
});
```

## Compliance Notes

- **SOC 2**: Document all key rotations in change management system
- **GDPR**: Keys used for signing consent receipts must be protected
- **EU AI Act**: Audit trail of key usage for trust receipts

## Appendix: Key Formats

### Ed25519 Key Encoding

| Format | Description | Example |
|--------|-------------|---------|
| Hex | Raw bytes as hexadecimal | `a1b2c3d4...` |
| Base64 | Base64-encoded bytes | `obLD1A==` |
| Multibase | Self-describing encoding | `z6Mk...` (base58btc) |
| JWK | JSON Web Key format | `{"kty":"OKP","crv":"Ed25519",...}` |

### Converting Between Formats

```typescript
import { base58btc } from 'multiformats/bases/base58';

// Hex to Base64
const base64 = Buffer.from(hexKey, 'hex').toString('base64');

// Base64 to Multibase (base58btc)
const multibase = 'z' + base58btc.encode(Buffer.from(base64Key, 'base64'));
```
