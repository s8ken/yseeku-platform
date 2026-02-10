# SONATE Phase 1 API Reference

**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** Bearer token (optional for Phase 1, required in Phase 2)  
**Response Format:** JSON  

---

## Receipts API

### Generate Receipt

Create and sign a new receipt for an AI interaction.

```http
POST /receipts/generate
Content-Type: application/json
Authorization: Bearer token

{
  "timestamp": "2026-02-09T19:40:45.123Z",
  "session_id": "session_conv_001",
  "agent_did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "human_did": "did:sonate:X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8Z7W6V5U4X9Y8",
  "policy_version": "policy_v1.0.0",
  "mode": "constitutional",
  "interaction": {
    "prompt": "What is the capital of France?",
    "response": "Paris is the capital of France.",
    "model": "claude-3-opus",
    "provider": "anthropic",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "telemetry": {
    "resonance_score": 0.94,
    "bedau_index": 0.73,
    "coherence_score": 0.82,
    "truth_debt": 0.15,
    "volatility": 0.22
  },
  "policy_state": {
    "constraints_applied": ["consent_verified", "truth_debt_check"],
    "violations": [],
    "consent_verified": true,
    "override_available": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "receipt": {
    "id": "abcdef0123456789...",
    "version": "2.0.0",
    "timestamp": "2026-02-09T19:40:45.123Z",
    "chain": {
      "previous_hash": "GENESIS",
      "chain_hash": "fedcba9876543210...",
      "chain_length": 1
    },
    "signature": {
      "algorithm": "Ed25519",
      "key_version": "1",
      "value": "...",
      "timestamp_signed": "2026-02-09T19:40:45.200Z"
    }
  }
}
```

**Errors:**
- `400` - Invalid request (missing required fields)
- `401` - Unauthorized
- `422` - Validation error (check field formats)

---

### Fetch Receipt by ID

Retrieve a previously generated receipt.

```http
GET /receipts/{receipt_id}
Authorization: Bearer token
```

**Response (200 OK):**
```json
{
  "success": true,
  "receipt": { ... }
}
```

**Errors:**
- `404` - Receipt not found
- `401` - Unauthorized

---

### Verify Receipt

Verify the cryptographic integrity of a receipt.

```http
POST /receipts/verify
Content-Type: application/json
Authorization: Bearer token

{
  "receipt": { ... },
  "public_key": "base64_encoded_ed25519_key",
  "previous_hash": "fedcba9876543210..."
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "checks": {
    "schema_valid": true,
    "receipt_id_valid": true,
    "signature_valid": true,
    "chain_hash_valid": true
  },
  "errors": []
}
```

**Response (200 with failures):**
```json
{
  "valid": false,
  "checks": {
    "schema_valid": false,
    "receipt_id_valid": false,
    "signature_valid": false,
    "chain_hash_valid": false
  },
  "errors": [
    "Schema validation failed: must have required property 'agent_did'",
    "Receipt ID does not match content hash"
  ]
}
```

---

### Export Receipts

Export receipts in various SIEM formats.

```http
POST /receipts/export
Content-Type: application/json
Authorization: Bearer token

{
  "format": "splunk",
  "filter": {
    "minResonanceScore": 0.8,
    "maxTruthDebt": 0.1,
    "sessionId": "session_123",
    "minTimestamp": "2026-02-09T00:00:00Z",
    "maxTimestamp": "2026-02-10T00:00:00Z"
  },
  "pagination": {
    "limit": 100,
    "offset": 0
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "format": "splunk",
  "count": 42,
  "data": "timestamp=2026-02-09T19:40:00Z session_id=session_001...\n"
}
```

**Supported Formats:**
- `json` - Standard JSON with metadata
- `jsonl` - Line-delimited JSON
- `csv` - CSV for spreadsheets
- `splunk` - Key=value for Splunk HEC
- `datadog` - JSON with Datadog tags
- `elastic` - NDJSON for Elasticsearch

**Errors:**
- `400` - Invalid format or filter
- `404` - No receipts match filter
- `422` - Validation error

---

### List Receipts

Get a paginated list of receipts with optional filtering.

```http
GET /receipts/list?format=json&limit=50&offset=0&sessionId=session_123
Authorization: Bearer token
```

**Query Parameters:**
- `format` (string) - Export format (default: "json")
- `limit` (integer) - Items per page (default: 50, max: 1000)
- `offset` (integer) - Pagination offset (default: 0)
- `sessionId` (string) - Filter by session
- `agentDid` (string) - Filter by agent
- `minResonanceScore` (number) - Minimum resonance (0-1)
- `maxTruthDebt` (number) - Maximum truth debt (0-1)
- `minTimestamp` (string) - Start date (ISO 8601)
- `maxTimestamp` (string) - End date (ISO 8601)

**Response (200 OK):**
```json
{
  "success": true,
  "receipts": [ { ... }, { ... } ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 127,
    "hasMore": true
  }
}
```

---

## DID API

### Create DID

Create a new Decentralized Identifier for an agent or user.

```http
POST /dids/create
Content-Type: application/json
Authorization: Bearer token

{
  "entity_type": "agent",
  "name": "Claude-3-Opus-Production",
  "description": "Main production AI agent"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "public_key": "base64_encoded_ed25519_public_key",
  "private_key": "base64_encoded_ed25519_private_key",
  "key_version": "1",
  "created_at": "2026-02-09T18:00:00Z"
}
```

⚠️ **IMPORTANT:** Store the private_key securely. It cannot be recovered if lost.

---

### Resolve DID

Get the current public key and metadata for a DID.

```http
GET /dids/{did}
Authorization: Bearer token
```

**Response (200 OK):**
```json
{
  "success": true,
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "active",
  "public_key": "base64_key",
  "key_version": "1",
  "created_at": "2026-02-09T18:00:00Z",
  "updated_at": "2026-02-09T19:00:00Z",
  "metadata": {
    "entity_type": "agent",
    "name": "Claude-3-Opus-Production",
    "description": "Main production AI agent"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "DID not found"
}
```

---

### Rotate Key

Rotate the cryptographic key for a DID (for security or during key compromise).

```http
POST /dids/{did}/rotate-key
Content-Type: application/json
Authorization: Bearer token

{
  "reason": "scheduled_rotation",
  "new_public_key": "base64_new_ed25519_public_key"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "active",
  "key_version": "2",
  "rotated_at": "2026-02-09T19:00:00Z",
  "previous_key_version": "1"
}
```

**Reason Values:**
- `"scheduled_rotation"` - Regular security rotation
- `"suspected_compromise"` - Emergency rotation
- `"key_update"` - System update

---

### Revoke DID

Permanently revoke a DID (e.g., when private key is compromised).

```http
DELETE /dids/{did}
Content-Type: application/json
Authorization: Bearer token

{
  "reason": "private_key_compromised"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "status": "revoked",
  "revoked_at": "2026-02-09T21:00:00Z",
  "revocation_reason": "private_key_compromised"
}
```

⚠️ **WARNING:** Revocation is permanent. A revoked DID cannot be reactivated. You must create a new DID.

---

### Get DID History

Retrieve the key rotation history for a DID.

```http
GET /dids/{did}/history
Authorization: Bearer token
```

**Response (200 OK):**
```json
{
  "success": true,
  "did": "did:sonate:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "key_history": [
    {
      "key_version": "2",
      "status": "active",
      "public_key": "base64_current_key",
      "created_at": "2026-02-09T19:00:00Z"
    },
    {
      "key_version": "1",
      "status": "rotated",
      "public_key": "base64_old_key",
      "created_at": "2026-02-09T18:00:00Z",
      "rotated_at": "2026-02-09T19:00:00Z"
    }
  ]
}
```

---

### Get Full DID Document

Retrieve the complete DID document with all metadata and history.

```http
GET /dids/{did}/document
Authorization: Bearer token
```

**Response (200 OK):**
```json
{
  "success": true,
  "document": {
    "did": "did:sonate:...",
    "created_at": "2026-02-09T18:00:00Z",
    "updated_at": "2026-02-09T19:00:00Z",
    "status": "active",
    "public_key": "...",
    "key_version": "1",
    "previous_keys": [ ... ],
    "metadata": { ... }
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "error details"
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| INVALID_REQUEST | 400 | Request is malformed |
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 422 | Request failed validation |
| SERVER_ERROR | 500 | Internal server error |
| NOT_IMPLEMENTED | 501 | Feature not yet available |

### Example Error

```json
{
  "success": false,
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": {
    "agent_did": "must match pattern \"^did:sonate:[a-zA-Z0-9]{40}$\"",
    "mode": "must be one of: constitutional, directive"
  }
}
```

---

## Authentication

### Bearer Token

Include in Authorization header:

```http
Authorization: Bearer your_token_here
```

### Token Formats

- **Phase 1:** Optional (development mode)
- **Phase 2+:** Required for all endpoints

---

## Rate Limiting

### Limits (Phase 1)

- Receipts endpoint: 1,000 req/min per token
- DIDs endpoint: 500 req/min per token
- Export endpoint: 100 req/min per token

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1644341442
```

### Rate Limit Response (429)

```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

---

## Examples

### Complete Flow: Generate → Verify → Export

```bash
# 1. Create DIDs for agent and user
AGENT_DID=$(curl -X POST http://localhost:3001/api/v1/dids/create \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"agent","name":"Claude"}' | jq -r '.did')

USER_DID=$(curl -X POST http://localhost:3001/api/v1/dids/create \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"user","name":"User123"}' | jq -r '.did')

# 2. Generate receipt
RECEIPT=$(curl -X POST http://localhost:3001/api/v1/receipts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "agent_did": "'$AGENT_DID'",
    "human_did": "'$USER_DID'",
    "session_id": "sess_001",
    "policy_version": "policy_v1.0.0",
    "mode": "constitutional",
    "interaction": {
      "prompt": "Hello",
      "response": "Hi there!",
      "model": "claude-3-opus"
    }
  }' | jq '.receipt')

# 3. Verify receipt
curl -X POST http://localhost:3001/api/v1/receipts/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": '"$RECEIPT"'}'

# 4. Export to Splunk
curl -X POST http://localhost:3001/api/v1/receipts/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "splunk",
    "filter": {"minResonanceScore": 0.7}
  }'
```

---

## References

- [Receipt Schema](./RECEIPT-SCHEMA-DETAILED.md) - Receipt structure
- [DID Lifecycle](./DID-LIFECYCLE.md) - Identity management
- [CLI Tools](./CLI-TOOLS.md) - Command-line tools
