# SONATE Platform API Overview

## Introduction

The SONATE platform provides a comprehensive set of APIs for managing autonomous AI agents within a constitutional framework. This documentation covers all available endpoints, data structures, and integration patterns.

## Base URL

```
Production: https://api.sonate.ai/v1
Development: https://dev-api.sonate.ai/v1
```

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer <your-api-token>
```

### Obtaining API Tokens

```javascript
// Request API token
const response = await fetch('https://api.sonate.ai/v1/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret'
  })
});

const { accessToken, expiresIn } = await response.json();
```

## Core API Structure

### Package Organization

The API is organized into four main packages corresponding to the platform architecture:

1. **Core Package** (`/core`) - Constitutional framework and trust protocols
2. **Detect Package** (`/detect`) - Real-time monitoring and detection
3. **Lab Package** (`/lab`) - Research and experimentation
4. **Orchestrate Package** (`/orchestrate`) - Agent management and workflow

### Common Data Structures

#### Agent Object
```typescript
interface Agent {
  id: string;                    // Unique agent identifier
  did: string;                   // Decentralized identifier
  name: string;                  // Human-readable name
  type: AgentType;              // Agent classification
  status: AgentStatus;          // Current operational status
  capabilities: string[];       // List of capabilities
  constitutionalScore: number;  // SONATE compliance score (0-1)
  phaseVelocity: number;        // Current Phase-Shift Velocity
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
  metadata: Record<string, any>; // Additional properties
}
```

#### Trust Receipt
```typescript
interface TrustReceipt {
  id: string;                   // Receipt identifier
  agentId: string;              // Agent identifier
  action: string;               // Performed action
  timestamp: string;            // ISO timestamp
  hash: string;                 // SHA-256 hash
  signature: string;            // Ed25519 signature
  constitutionalScore: number;  // Compliance score at action time
  phaseVelocity: number;        // Velocity at action time
  metadata: Record<string, any>; // Action-specific data
}
```

#### Phase-Shift Velocity
```typescript
interface PhaseVelocity {
  value: number;                // ΔΦ/t value
  reasoning: number;            // ΔR component
  coherence: number;            // ΔC component
  timeInterval: number;         // Δt in milliseconds
  timestamp: string;            // Calculation timestamp
  alert: boolean;               // Exceeds threshold?
  threshold: number;            // Alert threshold
}
```

## Error Handling

### Standard Error Response
```typescript
interface ErrorResponse {
  error: {
    code: string;               // Error code
    message: string;            // Human-readable message
    details?: any;              // Additional error details
    timestamp: string;          // Error timestamp
    requestId: string;          // Request identifier
  };
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `AGENT_NOT_FOUND` | Agent does not exist | 404 |
| `CONSTITUTIONAL_VIOLATION` | SONATE framework violation | 422 |
| `PHASE_VELOCITY_ALERT` | Velocity threshold exceeded | 429 |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

## Rate Limiting

API requests are rate-limited to ensure fair usage:

| Plan | Requests/Minute | Requests/Hour | Concurrent Requests |
|------|-----------------|---------------|-------------------|
| Free | 60 | 1000 | 5 |
| Pro | 300 | 10000 | 20 |
| Enterprise | 1000 | 100000 | 100 |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Configuration

Webhooks allow real-time notifications of platform events:

```javascript
// Register webhook
const webhook = await fetch('/core/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhook',
    events: ['agent.created', 'phase_velocity.alert', 'trust.receipt'],
    secret: 'your-webhook-secret'
  })
});
```

### Webhook Event Structure
```typescript
interface WebhookEvent {
  id: string;                   // Event identifier
  type: string;                 // Event type
  timestamp: string;            // Event timestamp
  data: any;                    // Event-specific data
  signature: string;            // HMAC signature
}
```

### Supported Events

| Event | Description | Data |
|-------|-------------|------|
| `agent.created` | New agent registered | Agent object |
| `agent.updated` | Agent modified | Agent object |
| `agent.deleted` | Agent removed | Agent ID |
| `phase_velocity.alert` | Velocity threshold exceeded | PhaseVelocity object |
| `trust.receipt` | New trust receipt created | TrustReceipt object |
| `constitutional.violation` | SONATE violation detected | Violation details |
| `experiment.completed` | Research experiment finished | Experiment results |

## Pagination

List endpoints support pagination for large datasets:

```http
GET /orchestrate/agents?page=1&limit=50&sort=createdAt&order=desc
```

### Pagination Response
```typescript
interface PaginatedResponse<T> {
  data: T[];                    // Results array
  pagination: {
    page: number;               // Current page
    limit: number;              // Items per page
    total: number;              // Total items
    pages: number;              // Total pages
    hasNext: boolean;           // Has next page
    hasPrev: boolean;           // Has previous page
  };
}
```

## Filtering and Searching

### Filter Parameters

Most list endpoints support filtering:

```http
GET /orchestrate/agents?status=active&type=research&minScore=0.8
```

### Search Parameters

Full-text search across agent metadata:

```http
GET /orchestrate/agents?q=medical+diagnosis&searchFields=name,description
```

### Date Range Filtering

Filter by timestamp ranges:

```http
GET /detect/alerts?startDate=2024-01-01&endDate=2024-01-31
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @sonate/platform-sdk
```

```typescript
import { SonatePlatform } from '@sonate/platform-sdk';

const platform = new SonatePlatform({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.sonate.ai/v1'
});

// Create agent
const agent = await platform.agents.create({
  name: 'Medical Assistant',
  type: 'healthcare',
  capabilities: ['diagnosis', 'treatment_planning']
});
```

### Python SDK

```bash
pip install sonate-platform
```

```python
from sonate_platform import SonatePlatform

platform = SonatePlatform(
    api_key='your-api-key',
    base_url='https://api.sonate.ai/v1'
)

# Create agent
agent = platform.agents.create({
    'name': 'Medical Assistant',
    'type': 'healthcare',
    'capabilities': ['diagnosis', 'treatment_planning']
})
```

## Best Practices

### Security
1. **Never expose API keys** in client-side code
2. **Use HTTPS** for all API communications
3. **Validate webhook signatures** before processing
4. **Implement proper access controls** in your application
5. **Rotate API keys** regularly

### Performance
1. **Use pagination** for large datasets
2. **Implement caching** for frequently accessed data
3. **Use webhooks** instead of polling for real-time updates
4. **Batch operations** when possible
5. **Monitor rate limits** and implement backoff strategies

### Reliability
1. **Implement exponential backoff** for retries
2. **Handle network timeouts** gracefully
3. **Log API errors** for debugging
4. **Validate responses** before processing
5. **Implement circuit breakers** for critical operations

## Testing

### Sandbox Environment

Test your integration in our sandbox environment:

```
Base URL: https://sandbox-api.sonate.ai/v1
Webhook URL: https://sandbox.your-app.com/webhook
```

### Test Data

Use our test data generator for development:

```javascript
// Generate test agent
const testAgent = await platform.test.generateAgent({
  type: 'research',
  capabilities: ['analysis', 'reporting']
});

// Generate test alerts
const testAlerts = await platform.test.generatePhaseVelocityAlerts({
  count: 10,
  agentId: testAgent.id
});
```

## Support and Resources

### Documentation
- [Core Package API](./core.md)
- [Detect Package API](./detect.md)
- [Lab Package API](./lab.md)
- [Orchestrate Package API](./orchestrate.md)

### Developer Resources
- [Getting Started Guide](../getting-started.md)
- [Code Examples](https://github.com/s8ken/yseeku-platform/tree/main/examples)
- [SDK Documentation](https://docs.sonate.ai/sdk)
- [Community Forum](https://community.sonate.ai)

### Support
- [API Status](https://status.sonate.ai)
- [Support Tickets](https://support.sonate.ai)
- [Developer Chat](https://chat.sonate.ai)
- [Email Support](api-support@sonate.ai)

---

For detailed endpoint documentation, please refer to the specific package documentation sections.