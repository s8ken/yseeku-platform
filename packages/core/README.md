# @sonate/core

**Foundation layer for the SONATE Platform** - Trust protocol, monitoring, and core infrastructure.

## Overview

This package provides the foundational components for building production-grade AI trust systems:

- **Trust Protocol**: W3C DID/VC-compliant trust receipt generation and verification
- **Trust Receipts**: Cryptographically signed interaction records with hash chaining (SHA-256 + Ed25519)
- **CIQ Metrics**: Clarity, Integrity, Quality measurement framework
- **Structured Logging**: Winston-based logging with JSON output for production
- **Prometheus Metrics**: 24+ production metrics for monitoring
- **Health Checks**: Kubernetes-compatible health endpoints
- **Performance Tracking**: Timer utilities and decorators for profiling

## Installation

```bash
npm install @sonate/core
```

## Quick Start

### Trust Receipt Generation

```typescript
import { TrustProtocol } from '@sonate/core';

const trustProtocol = new TrustProtocol();

const receipt = await trustProtocol.generateReceipt({
  session_id: 'session_001',
  mode: 'production',
  ciq: {
    clarity: 0.92,
    integrity: 0.88,
    quality: 0.90,
  },
  previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
});

// Verify receipt
const isValid = await trustProtocol.verifyReceipt(receipt);
console.log('Receipt valid:', isValid);
```

### Structured Logging

```typescript
import { log, securityLogger, performanceLogger } from '@sonate/core';

// Standard logging
log.info('User action completed', {
  userId: 'user-123',
  action: 'login',
  module: 'AuthService',
});

// Security events
securityLogger.warn('Suspicious activity detected', {
  ip: '192.168.1.1',
  attempts: 5,
  module: 'SecurityMonitor',
});

// Performance tracking
performanceLogger.info('API request completed', {
  endpoint: '/api/users',
  duration_ms: 45,
  status_code: 200,
});
```

### Prometheus Metrics

```typescript
import {
  workflowDurationHistogram,
  activeWorkflowsGauge,
  getMetrics,
} from '@sonate/core';

// Record workflow duration
workflowDurationHistogram.observe(
  { workflow_name: 'data-processing', status: 'success' },
  2.5 // seconds
);

// Track active workflows
activeWorkflowsGauge.inc({ workflow_type: 'analysis' });
// ... do work ...
activeWorkflowsGauge.dec({ workflow_type: 'analysis' });

// Export metrics (Prometheus format)
const metrics = await getMetrics();
console.log(metrics);
```

### Performance Monitoring

```typescript
import { PerformanceTimer } from '@sonate/core';

async function processData() {
  const timer = new PerformanceTimer('data_processing', {
    dataset: 'users',
    operation: 'transform',
  });

  // Do work...
  await heavyComputation();

  const duration = timer.end(); // Logs automatically
  console.log(`Processing took ${duration} seconds`);
}
```

### Health Checks

```typescript
import { healthCheckManager } from '@sonate/core';

// Register custom health check
healthCheckManager.registerCheck('database', async () => {
  try {
    await db.query('SELECT 1');
    return {
      status: 'healthy',
      message: 'Database connection OK',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
    };
  }
});

// Check system health
const health = await healthCheckManager.check();
console.log('System status:', health.status);
console.log('Components:', health.components);
```

## The 6 Trust Principles

1. **Consent Architecture** (25%, Critical): Users explicitly consent and understand implications
2. **Inspection Mandate** (20%): All decisions are inspectable and auditable
3. **Continuous Validation** (20%): Behavior continuously validated against principles
4. **Ethical Override** (15%, Critical): Humans can override on ethical grounds
5. **Right to Disconnect** (10%): Users can disconnect without penalty
6. **Moral Recognition** (10%): AI recognizes human moral agency

## Specification Compliance

This implementation follows the specifications at:
- [Trust Receipt Schema](https://gammatria.com/schemas/trust-receipt)
- [Governance Protocol](https://gammatria.com/whitepapers/governance-protocol)
- [CIQ Metrics](https://gammatria.com/metrics/ciq)

## API Reference

### Trust Protocol

#### `TrustProtocol`

Main class for generating and verifying trust receipts.

```typescript
class TrustProtocol {
  generateReceipt(data: TrustReceiptData): Promise<TrustReceipt>;
  verifyReceipt(receipt: TrustReceipt): Promise<boolean>;
  createDID(): Promise<DIDDocument>;
}
```

### Logging

#### Loggers

- `log`: Main application logger
- `securityLogger`: Security events and alerts
- `performanceLogger`: Performance metrics
- `apiLogger`: API request/response logging

#### `createLogger(defaultMeta)`

Create a child logger with default metadata.

```typescript
const moduleLogger = createLogger({ module: 'MyModule' });
moduleLogger.info('Event occurred'); // Automatically includes module
```

### Metrics

#### Counters
- `trustReceiptsTotal`: Total trust receipts generated
- `workflowFailuresTotal`: Failed workflow executions
- `apiRequestsTotal`: Total HTTP requests

#### Histograms
- `workflowDurationHistogram`: Workflow execution time
- `trustReceiptGenerationDuration`: Receipt generation time
- `apiRequestDuration`: HTTP request latency

#### Gauges
- `activeWorkflowsGauge`: Currently active workflows
- `activeAgentsGauge`: Currently registered agents

#### Functions
- `getMetrics()`: Export Prometheus metrics
- `resetMetrics()`: Reset all metrics

### Performance

#### `PerformanceTimer`

```typescript
class PerformanceTimer {
  constructor(operation: string, labels?: Record<string, string>);
  end(): number; // Returns duration in seconds
  endWithMetric(metric: Histogram): void;
}
```

### Health Checks

#### `HealthCheckManager`

```typescript
class HealthCheckManager {
  registerCheck(name: string, checkFn: HealthCheckFunction): void;
  check(): Promise<SystemHealth>;
  readiness(): Promise<SystemHealth>;
  liveness(): Promise<SystemHealth>;
}
```

## Configuration

Environment variables:

```bash
# Logging
LOG_LEVEL=info          # error | warn | info | debug
NODE_ENV=production     # production | development

# Metrics
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# Trust Protocol
TRUST_MODE=production
```

## Examples

See [docs/examples/quickstart.ts](../../docs/examples/quickstart.ts) for a complete working example.

## Testing

```bash
npm test                # Run tests
npm run test:coverage   # With coverage
npm run test:watch      # Watch mode
```

## License

Proprietary - SONATE Platform
