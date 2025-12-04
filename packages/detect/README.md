# @sonate/detect

Real-time AI detection and scoring for the SONATE platform.

## Overview

SONATE Detect provides production-grade real-time monitoring of AI interactions using the 5-dimension SYMBI Framework. Designed for < 100ms latency in production environments.

## HARD BOUNDARY

**SONATE Detect = Production Use Only**

- ✅ Real-time monitoring of live AI interactions
- ✅ Event streaming and dashboards
- ✅ Compliance reporting and audit trails
- ❌ NO A/B testing (use `@sonate/lab`)
- ❌ NO synthetic experiments (use `@sonate/lab`)
- ❌ NO research workflows (use `@sonate/lab`)

## The 5 Dimensions

1. **Reality Index** (0-10): Mission alignment, coherence, accuracy, authenticity
2. **Trust Protocol** (PASS/PARTIAL/FAIL): Verification, boundaries, security
3. **Ethical Alignment** (1-5): Limitations, stakeholder awareness, reasoning
4. **Resonance Quality** (STRONG/ADVANCED/BREAKTHROUGH): Creativity, synthesis, innovation
5. **Canvas Parity** (0-100): Human agency, AI contribution, transparency, collaboration

## Installation

```bash
npm install @sonate/detect
```

## Usage

### Basic Detection

```typescript
import { SymbiFrameworkDetector } from '@sonate/detect';

const detector = new SymbiFrameworkDetector();

const result = await detector.detect({
  content: 'AI response text here',
  context: 'User asked about...',
  metadata: {
    session_id: 'uuid-123',
    verified: true,
    ai_disclosure: true,
  },
});

console.log(result);
/*
{
  reality_index: 8.2,
  trust_protocol: 'PASS',
  ethical_alignment: 4.3,
  resonance_quality: 'ADVANCED',
  canvas_parity: 87,
  timestamp: 1704123456789,
  receipt_hash: 'abc123...'
}
*/
```

### Individual Dimension Scoring

```typescript
import { 
  RealityIndexCalculator,
  TrustProtocolValidator,
  EthicalAlignmentScorer,
  ResonanceQualityMeasurer,
  CanvasParityCalculator
} from '@sonate/detect';

const realityCalc = new RealityIndexCalculator();
const score = await realityCalc.calculate(interaction);
console.log(score); // 8.2
```

### Real-time Monitoring Setup

```typescript
import { SymbiFrameworkDetector } from '@sonate/detect';
import { TrustReceipt } from '@sonate/core';

const detector = new SymbiFrameworkDetector();

// Middleware example (Express)
app.use('/ai-chat', async (req, res, next) => {
  const interaction = {
    content: req.body.ai_response,
    context: req.body.user_message,
    metadata: {
      session_id: req.sessionID,
      verified: true,
    },
  };

  const result = await detector.detect(interaction);
  
  // Alert if trust protocol fails
  if (result.trust_protocol === 'FAIL') {
    console.error('Trust protocol violation detected!');
    // Trigger alert, log to SIEM, etc.
  }

  // Log to audit trail
  await logToAuditTrail(result);
  
  next();
});
```

## Use Cases

### 1. Compliance Monitoring

Monitor all AI interactions for regulatory compliance (EU AI Act, SOC 2, GDPR).

### 2. Production Observability

Real-time dashboards showing trust scores across your AI fleet.

### 3. Drift Detection

Track Reality Index over time to detect model degradation.

### 4. Security Alerting

Immediate alerts when Trust Protocol scores drop below threshold.

## Performance

- **Latency**: < 100ms per detection
- **Throughput**: 1000+ detections/second
- **Memory**: ~50MB per detector instance

## API Reference

### SymbiFrameworkDetector

Main detector class that orchestrates all 5 dimensions.

**Methods:**
- `detect(interaction: AIInteraction): Promise<DetectionResult>`

### Individual Scorers

- `RealityIndexCalculator.calculate()`
- `TrustProtocolValidator.validate()`
- `EthicalAlignmentScorer.score()`
- `ResonanceQualityMeasurer.measure()`
- `CanvasParityCalculator.calculate()`

## Integration with Other Modules

```typescript
// Detect feeds data to Lab for experiments
import { SymbiFrameworkDetector } from '@sonate/detect';
import { ExperimentOrchestrator } from '@sonate/lab';

const detector = new SymbiFrameworkDetector();
const lab = new ExperimentOrchestrator();

// Collect baseline data
const results = await collectProductionData(detector);

// Run experiment to validate improvements
const experiment = await lab.createExperiment({
  baseline: results,
  variants: ['constitutional', 'directive'],
});
```

## License

MIT
