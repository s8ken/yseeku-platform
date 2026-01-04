# SONATE Platform Architecture

## Overview

The SONATE Platform is an Enterprise AI Trust Framework designed for production-grade AI agent management, trust verification, and resonance monitoring.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SONATE Platform                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   @sonate/   │  │   @sonate/   │  │   @sonate/   │      │
│  │     core     │  │  orchestrate │  │    detect    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                          │                                   │
│         ┌────────────────┴────────────────┐                 │
│         │                                  │                 │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   @sonate/   │              │   @sonate/   │            │
│  │     lab      │              │ persistence  │            │
│  └──────────────┘              └──────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Package Responsibilities

### @sonate/core
**Foundation layer** - Core trust protocol and infrastructure

- **Trust Protocol**: W3C DID/VC implementation
- **Trust Receipts**: Cryptographic verification chains (SHA-256 + Ed25519)
- **Logging**: Winston-based structured logging
- **Monitoring**: Prometheus metrics, health checks, performance tracking
- **Utilities**: Cryptographic primitives, canonicalization

**Exports**: `TrustProtocol`, `TrustReceipt`, `log`, `metrics`, `healthCheckManager`

### @sonate/orchestrate
**Production agent management** - Multi-agent orchestration

- **Agent Orchestrator**: DID-based agent registration and lifecycle
- **Workflow Engine**: Multi-step workflow execution with metrics
- **Tactical Command**: Real-time monitoring and control dashboard
- **Security**: RBAC, API keys, audit logging, secrets management

**Exports**: `AgentOrchestrator`, `WorkflowEngine`, `TacticalCommand`

### @sonate/detect
**Real-time AI detection** - Quality and trust monitoring

- **Resonance Engine Client**: Integration with Python-based analysis
- **Drift Detection**: Quality degradation monitoring
- **Reality Index**: Grounding in factual accuracy
- **Ethical Alignment**: Constitutional AI principles

**Exports**: `ResonanceClient`, `DriftDetector`, `EthicalAlignmentScorer`

### @sonate/persistence
**Data layer** - PostgreSQL integration

- **User Management**: Authentication and authorization
- **Trust Receipt Storage**: Immutable audit trail
- **Audit Logs**: Compliance and security events

**Exports**: `getPool`, `ensureSchema`, `healthCheck`

### @sonate/lab
**Experimental features** - Research and prototypes

- Pre-production features
- Alpha/beta functionality
- Proof-of-concept implementations

## Key Design Principles

### 1. Trust-First Architecture
Every interaction generates cryptographically verifiable trust receipts:

```typescript
const receipt = await trustProtocol.generateReceipt({
  session_id: 'session_123',
  mode: 'production',
  ciq: { clarity: 0.9, integrity: 0.85, quality: 0.88 },
  previous_hash: genesisHash,
});
```

### 2. Observable by Default
All operations automatically emit structured logs and metrics:

```typescript
// Automatic logging
log.info('Workflow completed', {
  workflowId: 'wf-123',
  duration_seconds: 2.5,
  module: 'WorkflowEngine',
});

// Automatic metrics
workflowDurationHistogram.observe(
  { workflow_name: 'data-processing', status: 'success' },
  2.5
);
```

### 3. Production-Ready
Built for enterprise deployment from day one:

- **Security**: Zero vulnerabilities, secrets management, RBAC
- **Monitoring**: 24+ Prometheus metrics, health checks
- **Testing**: 90% test coverage, comprehensive test suites
- **Logging**: Structured Winston logging with JSON output

### 4. Modular & Extensible
Clean separation of concerns enables:

- Independent package deployment
- Easy feature extension
- Clear dependency boundaries
- Minimal coupling

## Data Flow

### Trust Receipt Generation Flow

```
User Input → AI Response → Trust Protocol
                                 ↓
                         Calculate CIQ Metrics
                                 ↓
                         Generate Receipt Hash
                                 ↓
                         Sign with Ed25519
                                 ↓
                         Store Receipt Chain
                                 ↓
                         Return Trust Receipt
```

### Workflow Execution Flow

```
Workflow Definition → Agent Orchestrator
                              ↓
                      Validate Agents Exist
                              ↓
                      Workflow Engine.execute()
                              ↓
                      ┌───────┴───────┐
                      │               │
            Execute Step 1    Execute Step 2
                      │               │
            Agent API Call    Agent API Call
                      │               │
            Record Metrics    Record Metrics
                      │               │
                      └───────┬───────┘
                              ↓
                      Update Tactical Dashboard
                              ↓
                      Return Workflow Result
```

### Monitoring Data Flow

```
Application Events → Metrics Registry
                            ↓
                    Prometheus Metrics
                            ↓
                    ┌───────┴───────┐
                    │               │
            Grafana Dashboard    Alert Manager
                    │               │
            Visualizations      Notifications
```

## Security Architecture

### Authentication & Authorization

```
Request → API Key Validation → RBAC Check → Route Handler
              ↓                      ↓
         Audit Log            Permission Check
```

### Secrets Management

```
Application → SecretsManager Interface
                    ↓
        ┌───────────┼───────────┐
        │           │           │
    AWS KMS    HashiCorp    Local Dev
                Vault      (AES-256)
```

### Trust Verification Chain

```
Receipt[n] ← hash(Receipt[n-1] + new_data)
    ↓
Signature = Ed25519.sign(Receipt[n], private_key)
    ↓
Verify = Ed25519.verify(Signature, Receipt[n], public_key)
```

## Performance Characteristics

### Latency Targets

- Trust Receipt Generation: < 10ms
- Workflow Step Execution: < 100ms
- API Request Processing: < 50ms (p95)
- Health Check Response: < 5ms

### Scalability

- Horizontal scaling via stateless design
- Database connection pooling
- Redis caching layer (optional)
- Async operation support

### Resource Usage

- Memory: ~200MB baseline per instance
- CPU: < 5% idle, < 80% peak
- Network: Event-driven, minimal polling

## Deployment Architecture

### Recommended Production Setup

```
┌─────────────────────────────────────────┐
│         Load Balancer (NGINX)           │
└────────────┬─────────────┬──────────────┘
             │             │
    ┌────────┴──────┐  ┌──┴─────────┐
    │  SONATE API   │  │  SONATE API│
    │  Instance 1   │  │  Instance 2│
    └────────┬──────┘  └──┬─────────┘
             │            │
        ┌────┴────────────┴────┐
        │   PostgreSQL Cluster  │
        │   (Primary + Replica) │
        └───────────────────────┘
               │
        ┌──────┴──────┐
        │   Redis     │
        │   (Cache)   │
        └─────────────┘
```

### Observability Stack

```
┌─────────────────────────────────────────┐
│         SONATE Application              │
│     /metrics, /health endpoints         │
└────────────┬────────────────────────────┘
             │
    ┌────────┴──────────┐
    │   Prometheus      │
    │   (Metrics Store) │
    └────────┬──────────┘
             │
    ┌────────┴──────────┐
    │     Grafana       │
    │   (Dashboards)    │
    └───────────────────┘
```

## Technology Stack

### Runtime
- **Node.js**: >= 20.0.0
- **TypeScript**: ^5.0.0

### Core Dependencies
- **Trust/Crypto**: @noble/ed25519, @noble/hashes, jsonwebtoken
- **Logging**: winston ^3.19.0
- **Metrics**: prom-client ^15.1.3
- **Database**: pg (PostgreSQL client)
- **HTTP**: express ^4.21.2

### Development Tools
- **Testing**: jest ^29.7.0, ts-jest ^29.4.6
- **Linting**: eslint, prettier ^3.0.0
- **Git Hooks**: husky ^9.0.0, lint-staged ^15.0.0
- **Build**: typescript, turbo ^1.10.0

## Configuration Management

### Environment Variables

```bash
# Application
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sonate
POSTGRES_URL=postgresql://... (alternative)

# Security
JWT_SECRET=<required>
API_KEY_SALT=<required>
SECRETS_PROVIDER=aws-kms|vault|local
AWS_KMS_KEY_ID=<optional>
VAULT_ENDPOINT=<optional>
VAULT_TOKEN=<optional>

# Monitoring
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# Features
FEATURE_WORKFLOW_RETRY=true
FEATURE_ASYNC_RECEIPTS=false
```

## Migration Strategy

### Database Migrations

```typescript
import { runMigrations } from '@sonate/persistence';

await runMigrations(); // Apply all pending migrations
```

### Version Compatibility

- **Major version**: Breaking changes
- **Minor version**: New features (backward compatible)
- **Patch version**: Bug fixes

Current: v1.4.0

## Further Reading

- [API Documentation](./api/index.html) - TypeDoc generated API reference
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [ADRs](./adr/) - Architecture Decision Records
- [Examples](./examples/) - Code examples and tutorials
