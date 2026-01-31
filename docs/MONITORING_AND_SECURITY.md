# YSEEKU Platform - Monitoring & Security Guide

## Overview

This document describes the monitoring infrastructure and security measures implemented in the YSEEKU/SONATE platform.

## Table of Contents

1. [Monitoring Infrastructure](#monitoring-infrastructure)
2. [Grafana Dashboards](#grafana-dashboards)
3. [Prometheus Alerting](#prometheus-alerting)
4. [Security Measures](#security-measures)
5. [Rate Limiting](#rate-limiting)
6. [Input Validation](#input-validation)

---

## Monitoring Infrastructure

### Components

The platform uses a comprehensive observability stack:

| Component | Purpose | Port |
|-----------|---------|------|
| Prometheus | Metrics collection & alerting | 9090 |
| Grafana | Visualization & dashboards | 3000 |
| Loki | Log aggregation | 3100 |
| Promtail | Log shipping | - |
| OTEL Collector | Distributed tracing (optional) | 4317 |

### Metrics Exposed

The backend exposes metrics at `/api/metrics` in Prometheus format:

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests by method, path, status
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_in_flight` - Current active requests

#### Database Metrics
- `db_query_duration_seconds` - MongoDB query latency
- `db_connections_active` - Active database connections

#### Socket.IO Metrics
- `socket_connections_active` - Active WebSocket connections
- `socket_events_total` - Socket events by type and status

#### SONATE Trust Metrics
- `sonate_trust_score_gauge` - Current trust score by tenant
- `sonate_trust_evaluations_total` - Trust evaluations by status (PASS/PARTIAL/FAIL)
- `sonate_principle_violations_total` - Violations by SONATE principle
- `sonate_brain_cycles_total` - Overseer brain thinking cycles
- `sonate_brain_actions_total` - Brain actions taken
- `sonate_overrides_total` - Human overrides by status
- `sonate_ciq_clarity_gauge` - CIQ Clarity score
- `sonate_ciq_integrity_gauge` - CIQ Integrity score
- `sonate_ciq_quality_gauge` - CIQ Quality score
- `sonate_agents_active` - Active AI agents
- `sonate_active_sessions` - Active sessions by tenant

---

## Grafana Dashboards

### Available Dashboards

1. **Backend Overview** (`backend_overview.json`)
   - HTTP request rates and latencies
   - Error rates (5xx)
   - Database query performance
   - Socket.IO event rates

2. **SONATE Trust Platform** (`sonate_trust.json`)
   - Overall trust score gauge
   - Trust evaluation trends
   - Principle violation distribution
   - Overseer brain activity
   - Human override rates
   - CIQ metrics trends
   - Tenant activity status

3. **HTTP Overview** (`http_overview.json`)
   - Request rate by endpoint
   - Response time percentiles
   - Status code distribution

4. **Database Overview** (`db_overview.json`)
   - Query latency
   - Connection pool status

5. **Socket Overview** (`socket_overview.json`)
   - Active connections
   - Event throughput

### Accessing Dashboards

```bash
# Start Grafana (via docker-compose)
docker-compose up -d grafana

# Access at http://localhost:3000
# Default credentials: admin/admin
```

---

## Prometheus Alerting

### Alert Categories

#### Backend Alerts
| Alert | Severity | Condition |
|-------|----------|-----------|
| HighErrorRate | warning | >5% 5xx errors for 5min |
| SlowHttpP95 | warning | p95 latency >2s for 10min |
| DBQueryLatencyHigh | warning | p95 query >500ms for 10min |
| SocketRpsSpike | warning | >100 events/sec for 2min |

#### SONATE Trust Alerts
| Alert | Severity | Condition |
|-------|----------|-----------|
| TrustScoreCritical | critical | Avg trust <5.0 for 5min |
| TrustScoreDegrading | warning | Avg trust 5.0-7.0 for 15min |
| HighTrustFailureRate | warning | >10% FAIL status for 5min |
| TrustEvaluationSpike | critical | >10 failures/min for 2min |
| CriticalPrincipleViolation | critical | CONSENT or ETHICAL_OVERRIDE violation |
| FrequentPrincipleViolations | warning | >5 violations/min for 5min |
| OverseerInactive | warning | No brain cycles for 30min |
| HighOverrideRate | warning | >10 overrides/hour for 15min |
| AgentTrustDrift | warning | High variance in agent scores |
| LowClarityScore | warning | Avg clarity <3.0 for 10min |
| LowIntegrityScore | warning | Avg integrity <3.0 for 10min |

### Alert Configuration

Alerts are defined in `observability/alerts.yml` and loaded by Prometheus.

```yaml
# Example alert rule
- alert: TrustScoreCritical
  expr: avg(sonate_trust_score_gauge) < 5
  for: 5m
  labels:
    severity: critical
    category: trust
  annotations:
    summary: Critical trust score detected
    description: Average trust score has dropped below 5.0
```

---

## Security Measures

### Security Headers

The platform implements comprehensive security headers via `security-headers.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Restrictive CSP | Prevent XSS, injection |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Legacy XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Permissions-Policy | Restrictive | Disable unused features |
| Cross-Origin-Opener-Policy | same-origin | Isolate browsing context |
| Cross-Origin-Resource-Policy | same-origin | Restrict resource loading |

### Helmet.js

The platform uses Helmet.js for additional security headers:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### CORS Configuration

CORS is configured to allow only specified origins:

```typescript
const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : 'http://localhost:5000';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
```

---

## Rate Limiting

### Global Rate Limiting

Default rate limit: 300 requests per minute per user/IP.

```typescript
import { rateLimiter } from './middleware/rate-limit';
app.use(rateLimiter);
```

### Tenant-Aware Rate Limiting

Different limits apply based on tenant type:

| Tenant | Limit | Window |
|--------|-------|--------|
| demo-tenant | 500 req | 1 min |
| live-tenant | 200 req | 1 min |
| default | 300 req | 1 min |

### Endpoint-Specific Limits

Sensitive endpoints have stricter limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/login | 10 req | 15 min |
| /api/auth/register | 5 req | 1 hour |
| /api/auth/guest | 30 req | 1 min |
| /api/llm/generate | 30 req | 1 min |
| /api/trust/evaluate | 100 req | 1 min |
| /api/overseer/think | 10 req | 1 min |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1234567890
X-RateLimit-Tenant: live-tenant
```

---

## Input Validation

### Validation Middleware

The platform uses Zod for schema validation:

```typescript
import { validateBody, schemas } from './middleware/input-validation';

router.post('/agents', 
  validateBody(schemas.agentConfig),
  createAgent
);
```

### Available Schemas

- `objectId` - MongoDB ObjectId validation
- `uuid` - UUID format validation
- `email` - Email format validation
- `password` - Strong password requirements
- `tenantId` - Tenant ID format
- `pagination` - Page/limit/sort parameters
- `messageContent` - Chat message content
- `agentConfig` - Agent configuration
- `trustEvaluation` - Trust evaluation request
- `webhookConfig` - Webhook configuration

### Sanitization

All input is automatically sanitized:

- Script tags removed
- Event handlers stripped
- JavaScript protocol removed
- HTML entities escaped
- Null bytes removed

### Injection Detection

The platform logs potential injection attempts:

- SQL injection patterns
- NoSQL injection patterns ($where, $gt, etc.)

---

## Health Checks

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic health check (always 200) |
| `/api/health` | Detailed health with DB status |
| `/api/live/health` | Live metrics health check |

### Health Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-31T12:00:00.000Z",
  "environment": "production",
  "uptime": 3600,
  "mongodb": "connected",
  "memory": {
    "used": 128,
    "total": 256
  }
}
```

---

## Environment Variables

### Required for Monitoring

```bash
# Prometheus
PROMETHEUS_ENABLED=true

# OTEL (optional)
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Logging
LOG_LEVEL=info
```

### Required for Security

```bash
# CORS
CORS_ORIGIN=https://app.yseeku.com,https://yseeku.com

# Rate Limiting
RATE_LIMIT_MAX=300

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

---

## Deployment Checklist

### Monitoring
- [ ] Prometheus configured and scraping
- [ ] Grafana dashboards imported
- [ ] Alert rules loaded
- [ ] Alert notifications configured (email, Slack, etc.)

### Security
- [ ] CORS origins configured for production
- [ ] JWT secrets rotated
- [ ] Rate limits appropriate for expected traffic
- [ ] Security headers verified
- [ ] Input validation enabled

### Health Checks
- [ ] Health endpoint accessible
- [ ] Load balancer health checks configured
- [ ] Database connectivity monitored

---

## Troubleshooting

### Common Issues

1. **High Error Rate Alert**
   - Check application logs for errors
   - Verify database connectivity
   - Check external API availability (OpenAI, Anthropic)

2. **Trust Score Degradation**
   - Review recent agent configurations
   - Check for prompt injection attempts
   - Verify LLM API responses

3. **Rate Limit Exceeded**
   - Identify source (user, IP, tenant)
   - Consider increasing limits for legitimate traffic
   - Check for potential abuse

4. **Overseer Inactive**
   - Verify scheduler is running
   - Check for errors in brain cycle execution
   - Review system resources

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/s8ken/yseeku-platform/issues
- Documentation: https://docs.yseeku.com