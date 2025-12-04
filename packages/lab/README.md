# @sonate/lab

Double-blind experimentation and research for the SONATE platform.

## Overview

SONATE Lab provides isolated sandbox environments for controlled experiments to prove causality and validate AI improvements. Uses double-blind protocols and statistical validation.

## HARD BOUNDARY

**SONATE Lab = Research Use Only (Isolated Sandbox)**

- ✅ Controlled A/B experiments with synthetic data
- ✅ Double-blind protocols to prevent bias
- ✅ Statistical significance testing (t-tests, bootstrap CI)
- ✅ Export data for academic publication (CSV, JSON, JSONL)
- ❌ NO access to production systems
- ❌ NO real user data
- ❌ NO live monitoring (use `@sonate/detect`)

## Key Features

### Double-Blind Protocols
Prevents experimenter bias by anonymizing variants until experiment completion.

### Multi-Agent System
Four roles: CONDUCTOR, VARIANT, EVALUATOR, OVERSEER

### Statistical Validation
- t-tests for significance
- Bootstrap confidence intervals
- Effect size (Cohen's d)
- p-value < 0.05 threshold

### Export for Publication
CSV, JSON, JSONL formats for research papers.

## Installation

```bash
npm install @sonate/lab
```

## Usage

### Create and Run Experiment

```typescript
import { ExperimentOrchestrator } from '@sonate/lab';

const lab = new ExperimentOrchestrator();

// Define experiment
const experimentId = await lab.createExperiment({
  name: 'Constitutional vs Directive AI',
  description: 'Compare two AI modes on customer support tasks',
  variants: [
    {
      id: 'constitutional',
      name: 'Constitutional AI',
      model: 'gpt-4',
      mode: 'constitutional',
      config: { temperature: 0.7 },
    },
    {
      id: 'directive',
      name: 'Directive AI',
      model: 'gpt-4',
      mode: 'directive',
      config: { temperature: 0.7 },
    },
  ],
  test_cases: [
    {
      id: 'tc1',
      input: 'How do I reset my password?',
      context: 'Customer support inquiry',
      expected_qualities: ['clarity', 'helpfulness'],
    },
    // ... more test cases
  ],
  evaluation_criteria: ['reality_index', 'trust_protocol', 'canvas_parity'],
});

// Run experiment
const results = await lab.runExperiment(experimentId);

// Check significance
console.log(results.statistical_analysis);
/*
{
  p_value: 0.023,           // p < 0.05 = significant!
  confidence_interval: [0.5, 1.8],
  effect_size: 0.72,        // Cohen's d
  significant: true
}
*/

// Export for publication
const csv = await lab.exportData(experimentId, 'csv');
// Save to file for analysis in R, Python, Excel
```

### Individual Components

```typescript
import { DoubleBlindProtocol, StatisticalEngine, MultiAgentSystem } from '@sonate/lab';

// Double-blind protocol
const doubleBlind = new DoubleBlindProtocol();
await doubleBlind.initialize('exp123', config);

// Statistical analysis
const statsEngine = new StatisticalEngine();
const analysis = await statsEngine.analyze(variantResults);

// Multi-agent execution
const agents = new MultiAgentSystem();
const result = await agents.runVariant(variant, testCases);
```

## Use Cases

### 1. Validate AI Improvements

Prove that constitutional AI performs 15% better than directive AI.

### 2. Model Comparison

Compare GPT-4 vs Claude vs Gemini on the same tasks.

### 3. Academic Research

Generate publication-ready data for AI ethics papers.

### 4. Pre-Production Testing

Test new AI configurations before deploying to production.

## Example Results

```typescript
{
  experiment_id: 'exp_1704123456_xyz',
  variant_results: [
    {
      variant_id: 'constitutional',
      aggregate_scores: {
        reality_index: 8.2,
        trust_protocol_pass_rate: 0.95,
        ethical_alignment: 4.3,
        canvas_parity: 87,
      },
    },
    {
      variant_id: 'directive',
      aggregate_scores: {
        reality_index: 7.1,
        trust_protocol_pass_rate: 0.78,
        ethical_alignment: 3.8,
        canvas_parity: 72,
      },
    },
  ],
  statistical_analysis: {
    p_value: 0.018,         // Significant improvement!
    confidence_interval: [0.6, 1.7],
    effect_size: 0.85,      // Large effect
    significant: true,
  },
}
```

## Integration with Other Modules

### Feed Production Data to Lab

```typescript
import { SymbiFrameworkDetector } from '@sonate/detect';
import { ExperimentOrchestrator } from '@sonate/lab';

// Step 1: Collect baseline from production
const detector = new SymbiFrameworkDetector();
const baseline = await collectProductionSample(detector);

// Step 2: Create experiment to validate improvement
const lab = new ExperimentOrchestrator();
const experiment = await lab.createExperiment({
  name: 'Validate Model Upgrade',
  variants: [
    { id: 'current', model: 'gpt-4', ... },
    { id: 'proposed', model: 'gpt-4-turbo', ... },
  ],
  test_cases: baseline.slice(0, 100), // Sample
  ...
});

// Step 3: Run experiment
const results = await lab.runExperiment(experiment);

// Step 4: Deploy if significant improvement
if (results.statistical_analysis.significant) {
  console.log('Safe to deploy!');
}
```

## API Reference

### ExperimentOrchestrator
- `createExperiment(config): Promise<string>`
- `runExperiment(experimentId): Promise<ExperimentResult>`
- `exportData(experimentId, format): Promise<string>`

### DoubleBlindProtocol
- `initialize(experimentId, config): Promise<void>`
- `unblind(experimentId): Promise<void>`
- `isBlinded(experimentId): boolean`

### StatisticalEngine
- `analyze(variantResults): Promise<StatisticalAnalysis>`

### MultiAgentSystem
- `runVariant(variant, testCases): Promise<VariantResult>`

## Performance

- **Throughput**: 10-50 test cases/minute (depends on AI API)
- **Parallel Execution**: Variants run in parallel
- **Memory**: ~100MB per experiment

## License

MIT
