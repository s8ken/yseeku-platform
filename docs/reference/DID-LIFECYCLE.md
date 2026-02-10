# DID Lifecycle Management

## Overview

A **Decentralized Identifier (DID)** is a portable identity for both AI agents and humans within SONATE. Unlike centralized identifiers, DIDs:

- **Enable independence** from any single provider
- **Support key rotation** without changing identity
- **Provide audit trail** of identity changes
- **Allow revocation** for compromised identities
- **Maintain privacy** through pseudonymous DIDs

Every AI agent and user in SONATE has a DID that appears in every receipt, enabling accountability.

---

## DID Format

### Structure
```
did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
│     │     └─────────────────────────────────────────┘
│     │                      Identifier (40 chars)
│     └─ Method (SONATE-specific)
└─ Scheme (always "did")
```

### Identifier Generation
- **Length:** 40 alphanumeric characters
- **Format:** Lowercase hex or alphanumeric
- **Generation:** SHA256(public_key + timestamp + random_nonce)
- **Uniqueness:** Cryptographically guaranteed

### Examples

**Agent DID:**
```
did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

**User DID (pseudonymous):**
```
did:sonate:x9y8z7w6v5u4x9y8z7w6v5u4x9y8z7w6v5u4x9y8
```

**Organization DID:**
```
did:sonate:org12345org12345org12345org12345org1234567
```

---

## DID Document

### What Gets Stored

```json
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "created_at": "2026-02-09T18:00:00Z",
  "updated_at": "2026-02-09T19:40:00Z",
  "status": "active",
  "public_key": "base64_encoded_ed25519_public_key",
  "key_version": "1",
  "previous_keys": [
    {
      "key_version": "0",
      "public_key": "base64_old_key",
      "rotated_at": "2026-02-09T18:30:00Z"
    }
  ],
  "metadata": {
    "entity_type": "agent",  // or "user", "organization"
    "name": "Claude-3-Opus-Instance-001",
    "description": "Production AI agent for document analysis"
  }
}
```

### Fields

| Field | Type | Meaning |
|-------|------|---------|
| `did` | string | The DID itself |
| `created_at` | ISO 8601 | When DID was created |
| `updated_at` | ISO 8601 | Last modification time |
| `status` | enum | "active", "rotated", "revoked" |
| `public_key` | string | Current Ed25519 public key (base64) |
| `key_version` | string | Version of current key |
| `previous_keys` | array | History of all previous keys |
| `metadata` | object | Entity info (name, description, type) |

---

## Lifecycle Stages

### Stage 1: Creation

**Trigger:** When an agent or user first joins SONATE

**Process:**
```
1. Generate Ed25519 key pair (public/private)
2. Create DID: SHA256(public_key + timestamp + random_nonce)
3. Store DID Document with initial public key
4. Return DID to agent/user
5. Agent stores private key securely
```

**API Endpoint:**
```bash
POST /api/v1/dids/create

Request:
{
  "entity_type": "agent",
  "name": "Claude-3-Opus-Production",
  "description": "Main production agent"
}

Response:
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "public_key": "base64_key",
  "private_key": "base64_private_key",
  "created_at": "2026-02-09T18:00:00Z"
}
```

**Example Timeline:**
```
2026-02-09 18:00:00 - DID created
  agent_did: did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  status: active
  key_version: 1
  key_rotation_count: 0
```

---

### Stage 2: Active Use

**Duration:** DID is actively used in receipts

**During this stage:**
- Agent signs every receipt with their private key
- DID appears in every receipt as `agent_did`
- System verifies signatures against public key in DID Document
- No changes to key or identity

**Receipts Generated:**
```json
{
  "id": "receipt_001",
  "agent_did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "timestamp": "2026-02-09T19:40:45Z",
  "signature": {
    "algorithm": "Ed25519",
    "key_version": "1",
    "value": "..."
  }
}
```

**API Endpoint (Verification):**
```bash
GET /api/v1/dids/{did}

Response:
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "active",
  "public_key": "base64_key",
  "key_version": "1"
}
```

---

### Stage 3: Key Rotation

**Trigger:** Regular security hygiene or suspected compromise

**Process:**
```
1. Generate new Ed25519 key pair
2. Create new key_version (increment version number)
3. Store old key in previous_keys with rotation timestamp
4. Update status to "rotated" temporarily
5. Set new key as current
6. Update updated_at timestamp
7. Set status back to "active"
```

**API Endpoint:**
```bash
POST /api/v1/dids/{did}/rotate-key

Request:
{
  "reason": "scheduled_rotation",  // or "suspected_compromise"
  "new_public_key": "base64_new_key"
}

Response:
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "active",
  "key_version": "2",
  "rotated_at": "2026-02-09T19:00:00Z",
  "previous_key_version": "1"
}
```

**Timeline Example:**
```
2026-02-09 18:00:00 - Initial key created
  key_version: 1
  status: active

2026-02-09 19:00:00 - Key rotation #1
  key_version: 2
  status: active
  previous_keys: [{ version: 1, rotated_at: 2026-02-09T19:00:00Z }]

2026-02-09 20:00:00 - Key rotation #2
  key_version: 3
  status: active
  previous_keys: [
    { version: 1, rotated_at: 2026-02-09T19:00:00Z },
    { version: 2, rotated_at: 2026-02-09T20:00:00Z }
  ]
```

**Impact on Receipts:**
- Old receipts remain valid (signed with old keys)
- New receipts use new key_version
- Verification uses appropriate key from history
- Complete audit trail of all key changes

---

### Stage 4: Revocation

**Trigger:** Identity compromised or agent decommissioned

**Process:**
```
1. Mark status as "revoked"
2. Set revocation_timestamp
3. Optionally set revocation_reason
4. Keep all previous keys for historical verification
5. Prevent new receipts from being signed
```

**API Endpoint:**
```bash
DELETE /api/v1/dids/{did}

Request:
{
  "reason": "private_key_compromised"
}

Response:
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "revoked",
  "revoked_at": "2026-02-09T21:00:00Z",
  "revocation_reason": "private_key_compromised"
}
```

**Timeline Example:**
```
2026-02-09 21:00:00 - DID revoked
  status: revoked
  revoked_at: 2026-02-09T21:00:00Z
  revocation_reason: "private_key_compromised"
```

**Important Notes:**
- Revoked DIDs cannot issue new receipts
- Historical receipts signed with this DID remain valid
- Auditors can still verify old receipts using historical keys
- Revocation is permanent and auditable

---

## Key Rotation Best Practices

### Recommended Schedule

**Frequency:**
- **Development:** Every 1 month
- **Staging:** Every 2 weeks
- **Production:** Every 1 week

### Rotation Process

```bash
# Step 1: Generate new key
new_key=$(openssl genpkey -algorithm ed25519 | base64)

# Step 2: Rotate on server
curl -X POST https://api.sonate.io/api/v1/dids/{did}/rotate-key \
  -H "Authorization: Bearer token" \
  -d "{\"new_public_key\": \"$new_key\"}"

# Step 3: Update agent with new private key
# (Agent stores new private key securely)

# Step 4: Verify new key is active
curl https://api.sonate.io/api/v1/dids/{did}
```

### Automation Example

```bash
#!/bin/bash
# Rotate keys monthly

DID="did:sonate:..."
SCHEDULE="0 0 1 * *"  # First day of month at midnight

# Add to crontab
(crontab -l 2>/dev/null; echo "$SCHEDULE /opt/sonate/rotate-keys.sh $DID") | crontab -
```

---

## Key History & Audit Trail

### Accessing Key History

```bash
GET /api/v1/dids/{did}/history

Response:
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "key_history": [
    {
      "key_version": "3",
      "status": "active",
      "public_key": "base64_current_key",
      "created_at": "2026-02-09T20:00:00Z"
    },
    {
      "key_version": "2",
      "status": "rotated",
      "public_key": "base64_old_key_2",
      "created_at": "2026-02-09T19:00:00Z",
      "rotated_at": "2026-02-09T20:00:00Z"
    },
    {
      "key_version": "1",
      "status": "rotated",
      "public_key": "base64_old_key_1",
      "created_at": "2026-02-09T18:00:00Z",
      "rotated_at": "2026-02-09T19:00:00Z"
    }
  ]
}
```

### Verifying Historical Receipts

When verifying a receipt:

1. Extract `key_version` from receipt signature
2. Look up that key_version in DID history
3. Use the appropriate historical key for verification
4. Process succeeds if signature is valid

Example:
```json
{
  "receipt_id": "receipt_001",
  "signed_with_key_version": "1",
  "signature": "...",
  "verification_process": [
    "1. Extract key_version: 1",
    "2. Lookup DID history for version 1",
    "3. Get old public key",
    "4. Verify signature against old key",
    "5. Success: receipt is authentic"
  ]
}
```

---

## DID Resolution

### Resolution Flow

```
Receipt Contains → did:sonate:abc123...
                ↓
          DID Resolver API
                ↓
        GET /api/v1/dids/{did}
                ↓
        Returns DID Document
                ↓
    Contains Current Public Key
                ↓
    Use for Signature Verification
```

### API Endpoint

```bash
GET /api/v1/dids/{did}

Response:
{
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "active",
  "public_key": "base64_key",
  "key_version": "2",
  "created_at": "2026-02-09T18:00:00Z",
  "updated_at": "2026-02-09T19:00:00Z",
  "metadata": {
    "entity_type": "agent",
    "name": "Claude-3-Opus"
  }
}
```

### Full DID Document

```bash
GET /api/v1/dids/{did}/document

Response: [Complete DID Document with full history]
```

---

## Compliance & Accountability

### Audit Trail Example

```
2026-02-09 18:00:00 UTC
  EVENT: DID Created
  DID: did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  Initial Key: abc123...
  Created By: system@sonate.io

2026-02-09 19:00:00 UTC
  EVENT: Key Rotated
  DID: did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  Previous Key: abc123...
  New Key: def456...
  Reason: Scheduled Rotation
  Rotated By: agent_ops@company.com

2026-02-09 21:00:00 UTC
  EVENT: DID Revoked
  DID: did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  Reason: Private Key Compromised
  Revoked By: security@company.com

2026-02-09 22:00:00 UTC
  EVENT: Receipt Verification Failed
  Receipt ID: receipt_abc123
  Agent DID: did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  Status: REVOKED
  Signature Verification: Blocked
  Action: Alert Security Team
```

### Compliance Coverage

**EU AI Act:**
- ✅ Identity tracking for all AI systems
- ✅ Audit trail of identity changes
- ✅ Accountability for compromised systems

**SOC2:**
- ✅ Access control (identity verification)
- ✅ Change management (key rotations)
- ✅ Incident response (revocation capability)

**ISO 27001:**
- ✅ Cryptographic key management
- ✅ Asset management (digital identity)
- ✅ Incident management (key compromise)

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| DID not found | Doesn't exist yet | Create with POST /dids/create |
| Key verification fails | Wrong key version | Check receipt signature.key_version |
| Cannot rotate key | DID revoked | Create new DID, cannot reactivate |
| Receipt verifies with old key | Historical verification | Normal—old keys kept for audit |

---

## References

- [Receipt Schema](./RECEIPT-SCHEMA-DETAILED.md) - Receipt format
- [API Reference](./API.md) - Full DID endpoints
- [CLI Tools](./CLI-TOOLS.md) - Command-line utilities
