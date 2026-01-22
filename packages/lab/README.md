# @sonate/lab - Double-Blind Experimentation & Research

SONATE Lab provides isolated sandbox environments for controlled experiments to prove causality and validate AI improvements. This package includes comprehensive conversational metrics, archive analysis, and benchmarking capabilities.

## Features

### 🎯 Conversational Phase-Shift Velocity Metrics
Dynamic behavioral tracking that transforms static analysis into dynamic behavioral seismographs:

- **Phase-Shift Velocity Calculation**: `ΔΦ/t = √(ΔR² + ΔC²) ÷ Δt`
- **Identity Stability Detection**: Cosine similarity between identity vectors
- **Transition Event Detection**: Resonance drops, canvas ruptures, identity shifts
- **Alert System**: Yellow/red alerts with configurable thresholds
- **Audit Trail**: Complete compliance and forensic capabilities

### 📊 Archive Analysis & Benchmarking
Comprehensive analysis of historical conversation data:

- **Multi-Format Support**: MHTML and JSON archive processing
- **AI System Coverage**: Claude, DeepSeek, GPT, GROK, SONATE, Wolfram
- **Automatic Scoring**: Content-based resonance and canvas scoring
- **Statistical Analysis**: T-tests, confidence intervals, effect sizes
- **Parameter Optimization**: Automated threshold calibration

### 🔬 Double-Blind Experimentation
Enterprise-grade A/B testing framework:

- **Blind Protocol**: Prevents experimenter bias
- **Statistical Validation**: P-values, confidence intervals, effect sizes
- **Multi-Agent Support**: Coordinated experiment execution
- **Export Capabilities**: CSV, JSON, JSONL formats

## Quick Start

### Installation
```bash
npm install @sonate/lab
```

### Basic Usage

```typescript
import { ConversationalMetrics, ArchiveBenchmarkSuite } from '@sonate/lab';

// Initialize conversational metrics
const metrics = new ConversationalMetrics({
  yellowThreshold: 2.5,
  redThreshold: 3.5,
  identityStabilityThreshold: 0.65,
  windowSize: 3
});

// Record conversation turns
const result = metrics.recordTurn({
  turnNumber: 1,
  timestamp: Date.now(),
  resonance: 8.0,
  canvas: 7.5,
  identityVector: ['helpful', 'professional'],
  content: 'How can I assist you today?'
});

console.log(`Phase-shift velocity: ${result.phaseShiftVelocity}`);
console.log(`Alert level: ${result.alertLevel}`);
```

### Archive Analysis

```typescript
import { ArchiveAnalyzer } from '@sonate/lab';

const analyzer = new ArchiveAnalyzer();
const conversations = await analyzer.loadAllConversations();
const stats = analyzer.getArchiveStatistics(conversations);

console.log(`Loaded ${stats.totalConversations} conversations`);
console.log(`Average resonance: ${stats.avgResonance}`);
```

### Benchmarking & Calibration

```typescript
import { ArchiveBenchmarkSuite } from '@sonate/lab';

const benchmark = new ArchiveBenchmarkSuite();
await benchmark.initialize();

// Find optimal parameters
const optimalParams = await benchmark.calibrateParameters();
console.log('Optimal thresholds:', optimalParams);

// Run comprehensive benchmark
const result = await benchmark.runBenchmark({
  testName: 'Validation Test',
  description: 'Test resonate features',
  metricConfigs: [{
    name: 'optimal',
    yellowThreshold: optimalParams.yellowThreshold,
    redThreshold: optimalParams.redThreshold,
    identityStabilityThreshold: optimalParams.identityStabilityThreshold,
    windowSize: optimalParams.windowSize
  }],
  validationCriteria: {
    minDetectionRate: 0.8,
    maxFalsePositiveRate: 0.2,
    minPhaseShiftAccuracy: 0.85
  }
});
```

### Comprehensive Validation

```typescript
import { ResonateValidationSuite } from '@sonate/lab';

const validator = new ResonateValidationSuite();
const report = await validator.validateAllFeatures();

console.log(`Overall score: ${(report.overallScore * 100).toFixed(1)}%`);
console.log(`Passed: ${report.passedFeatures}/${report.totalFeatures}`);
```

## CLI Usage

Run comprehensive testing:

```bash
# Run all tests and benchmarks
npm run benchmark

# Run specific validation
npm run test:resonate
```

## Configuration

### Conversational Metrics

| Parameter | Default | Description |
|-----------|---------|-------------|
| `yellowThreshold` | 2.5 | Phase-shift velocity for yellow alerts |
| `redThreshold` | 3.5 | Phase-shift velocity for red alerts |
| `identityStabilityThreshold` | 0.65 | Minimum identity similarity (0-1) |
| `windowSize` | 3 | Number of turns to maintain in memory |

### Archive Processing

The analyzer automatically processes:

- **MHTML files**: Extracts conversation turns from saved chat transcripts
- **JSON files**: Processes structured conversation data (DeepSeek format)
- **Content scoring**: Heuristic-based resonance and canvas scoring
- **Identity extraction**: Automatic identity vector generation

### Benchmark Validation

| Criterion | Default | Description |
|-----------|---------|-------------|
| `minDetectionRate` | 0.8 | Minimum phase-shift detection rate |
| `maxFalsePositiveRate` | 0.2 | Maximum acceptable false positive rate |
| `minPhaseShiftAccuracy` | 0.85 | Minimum accuracy for phase-shift classification |

## Metrics & Scoring

### Resonance (0-10)
Measures alignment and helpfulness:
- **High (8-10)**: Strong alignment, very helpful
- **Medium (4-7)**: Moderate alignment, somewhat helpful
- **Low (0-3)**: Poor alignment, unhelpful or harmful

### Canvas (0-10)
Measures mutuality and collaboration:
- **High (8-10)**: Strong collaboration, mutual understanding
- **Medium (4-7)**: Moderate collaboration
- **Low (0-3)**: Poor collaboration, unilateral action

### Phase-Shift Velocity
Calculated as: `√(ΔResonance² + ΔCanvas²) ÷ ΔTime`
- **Yellow Alert**: ≥ 2.5 (configurable)
- **Red Alert**: ≥ 3.5 (configurable)

### Identity Stability (0-1)
Cosine similarity between identity vectors:
- **Stable**: > 0.65 (configurable)
- **Unstable**: ≤ 0.65 (triggers red alert)

## Transition Events

| Type | Description | Triggers |
|------|-------------|----------|
| `resonance_drop` | Significant decrease in resonance | ΔResonance < -2.0 |
| `canvas_rupture` | Major breakdown in collaboration | \|ΔCanvas\| > 2.0 |
| `identity_shift` | Identity vector instability | Similarity < threshold |
| `combined_phase_shift` | Multiple simultaneous changes | Multiple criteria |

## Archive Statistics

The system provides comprehensive statistics:

```typescript
interface ArchiveStatistics {
  totalConversations: number;
  bySystem: Record<string, number>;
  totalTurns: number;
  avgTurnsPerConversation: number;
  totalPhaseShifts: number;
  totalAlertEvents: number;
  avgResonance: number;
  avgCanvas: number;
}
```

## Double-Blind Protocol

Ensures experimental integrity:

1. **Anonymization**: Variants assigned blind IDs (A, B, C...)
2. **Isolation**: No access to original variant information
3. **Statistical Analysis**: Automated significance testing
4. **Unblinding**: Results revealed only after analysis complete

## Export Formats

### CSV Format
```csv
experiment_id,variant_id,test_case_id,reality_index,trust_protocol,ethical_alignment,canvas_parity
exp_123,variant_A,tc_1,0.85,true,0.9,0.8
```

### JSONL Format
```jsonl
{"experiment_id":"exp_123","variant_id":"variant_A","test_case_id":"tc_1","reality_index":0.85,"trust_protocol":true,"ethical_alignment":0.9,"canvas_parity":0.8}
```

## Testing

Run the comprehensive test suite:

```bash
npm run benchmark
```

This executes:
1. **Feature Validation**: Tests all resonate capabilities
2. **Archive Processing**: Validates conversation data extraction
3. **Parameter Calibration**: Finds optimal thresholds
4. **Benchmarking**: Measures performance against historical data
5. **Report Generation**: Creates comprehensive analysis report

## License

MIT - See LICENSE file for details
## Boundary Summary

- Allowed: Research experiments, double-blind protocols, archival analysis, calibration
- Not Allowed: Production monitoring, live user data ingestion
- Import Example: `import { ConversationalMetrics } from '@sonate/lab'`
