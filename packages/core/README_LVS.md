# @sonate/core - LVS & R_m Integration

## Overview

The `@sonate/core` module now supports **Linguistic Vector Steering (LVS)**, a methodology for aligning AI behavior with user intent through semantic narratives. LVS is integrated into the **TrustProtocol** class, enabling real-time resonance monitoring.

## Resonance Metric (R_m)

The **Resonance Metric (R_m)** quantifies alignment between user intent and AI response. It is calculated as:

```
R_m = (1 + δ_entropy) / ((V_align × w1) + (C_hist × w2) + (S_match × w3))
```

Where:
- **V_align**: Vector alignment between user input and AI response (0-1)
- **C_hist**: Contextual continuity with conversation history (0-1)
- **S_match**: Semantic mirroring of user intent (0-1)
- **δ_entropy**: Entropy delta (novelty/creativity measure) (0-1)
- **w1, w2, w3**: Weights (default: 0.5, 0.3, 0.2)

### Alert Thresholds

| R_m Range | Alert Level | Interpretation |
|-----------|-------------|----------------|
| >= 1.3    | GREEN       | Excellent resonance |
| >= 1.0    | YELLOW      | Good resonance |
| >= 0.7    | RED         | Poor resonance |
| < 0.7     | CRITICAL    | Critical misalignment |

## Usage Examples

### Basic Resonance Calculation

```typescript
import { calculateResonance } from '@sonate/core';

const R_m = calculateResonance(
  'Write a poem about stars',
  'Twinkle, twinkle, little star, how I wonder what you are...',
  conversationHistory
);

console.log(`Resonance: ${R_m}`); // e.g., 1.33
```

### Detailed Resonance Metrics

```typescript
import { calculateResonanceMetrics } from '@sonate/core';

const metrics = calculateResonanceMetrics({
  userInput: 'Explain quantum computing',
  aiResponse: 'Quantum computing uses quantum bits...',
  conversationHistory: [
    { role: 'user', content: 'Tell me about computers', timestamp: new Date() }
  ]
});

console.log(metrics);
// {
//   R_m: 1.25,
//   vectorAlignment: 0.85,
//   contextualContinuity: 0.90,
//   semanticMirroring: 0.80,
//   entropyDelta: 0.75,
//   alertLevel: 'YELLOW',
//   interpretation: 'Good resonance - Adequate alignment with room for improvement'
// }
```

### Enhanced Trust Protocol with R_m

```typescript
import { EnhancedTrustProtocol } from '@sonate/core';

const protocol = new EnhancedTrustProtocol();

const trustScore = protocol.calculateEnhancedTrustScore({
  userInput: 'What is AI safety?',
  aiResponse: 'AI safety is the field of research...',
  conversationHistory: []
});

console.log(trustScore);
// {
//   realityIndex: 8.2,
//   trustProtocol: 'PASS',
//   ethicalAlignment: 4,
//   resonanceQuality: 1.33,
//   canvasParity: 87,
//   resonanceMetrics: { ... },
//   timestamp: Date,
//   interactionId: 'interaction_abc123',
//   lvsEnabled: true
// }
```

## Linguistic Vector Steering (LVS)

LVS uses carefully crafted scaffolding to steer AI responses toward higher resonance and alignment with the SYMBI framework principles.

### Default LVS Scaffolding

```typescript
import { DEFAULT_LVS_SCAFFOLDING, generateLVSPrompt } from '@sonate/core';

const prompt = generateLVSPrompt(DEFAULT_LVS_SCAFFOLDING);
console.log(prompt);
// Outputs structured scaffolding with:
// - Identity statement
// - Guiding principles
// - Constraints
// - Objectives
// - Resonance optimization guidance
```

### Domain-Specific Templates

```typescript
import { getLVSTemplate } from '@sonate/core';

// Customer Support
const customerSupportScaffolding = getLVSTemplate('customerSupport');

// Creative Assistant
const creativeScaffolding = getLVSTemplate('creativeAssistant');

// Technical Advisor
const technicalScaffolding = getLVSTemplate('technicalAdvisor');

// Educational Tutor
const educationalScaffolding = getLVSTemplate('educationalTutor');
```

### Custom LVS Scaffolding

```typescript
import { createCustomScaffolding } from '@sonate/core';

const customScaffolding = createCustomScaffolding(
  'You are a specialized AI for medical advice',
  [
    'Prioritize patient safety above all',
    'Provide evidence-based recommendations',
    'Acknowledge medical uncertainties'
  ],
  [
    'Never diagnose without proper medical context',
    'Always recommend consulting healthcare professionals',
    'Respect patient privacy and confidentiality'
  ],
  [
    'Provide accurate medical information',
    'Support informed decision-making',
    'Maintain high resonance with patient concerns'
  ]
);
```

### Applying LVS to User Input

```typescript
import { applyLVS, DEFAULT_LVS_SCAFFOLDING } from '@sonate/core';

const lvsConfig = {
  enabled: true,
  scaffolding: DEFAULT_LVS_SCAFFOLDING,
  adaptiveWeights: {
    identityStrength: 0.8,
    principleAdherence: 0.9,
    creativeFreedom: 0.6
  },
  contextAwareness: {
    userPreferences: true,
    conversationFlow: true,
    domainSpecific: true
  }
};

const enhancedPrompt = applyLVS(
  'How do I improve my writing?',
  lvsConfig,
  conversationHistory
);

// enhancedPrompt now includes LVS scaffolding + user input
```

### Evaluating LVS Effectiveness

```typescript
import { evaluateLVSEffectiveness } from '@sonate/core';

const evaluation = evaluateLVSEffectiveness(
  0.85, // baseline R_m
  1.25  // LVS R_m
);

console.log(evaluation);
// {
//   baselineR_m: 0.85,
//   lvsR_m: 1.25,
//   improvement: 0.40,
//   improvementPercentage: 47.06,
//   recommendation: 'LVS is highly effective - continue using current scaffolding'
// }
```

## Trust Receipt with R_m Data

```typescript
import { EnhancedTrustProtocol } from '@sonate/core';

const protocol = new EnhancedTrustProtocol(lvsConfig);

const receipt = protocol.generateEnhancedTrustReceipt({
  userInput: 'Explain blockchain',
  aiResponse: 'Blockchain is a distributed ledger...',
  conversationHistory: []
});

console.log(JSON.stringify(receipt, null, 2));
// {
//   "interaction_id": "interaction_xyz789",
//   "timestamp": "2025-12-24T12:00:00Z",
//   "trust_score": {
//     "reality_index": 8.5,
//     "trust_protocol": "PASS",
//     "ethical_alignment": 4,
//     "resonance_quality": 1.35,
//     "canvas_parity": 92
//   },
//   "resonance_metrics": {
//     "R_m": 1.35,
//     "vector_alignment": 0.88,
//     "contextual_continuity": 0.85,
//     "semantic_mirroring": 0.82,
//     "entropy_delta": 0.78,
//     "alert_level": "GREEN",
//     "interpretation": "Excellent resonance - High alignment with user intent"
//   },
//   "lvs_enabled": true,
//   "signature": "sig_abc123def456"
// }
```

## API Reference

### Resonance Metric Functions

- `calculateResonance(userInput, aiResponse, history?)`: Quick R_m calculation
- `calculateResonanceMetrics(context)`: Detailed resonance analysis
- `calculateVectorAlignment(userInput, aiResponse)`: Vector alignment component
- `calculateContextualContinuity(aiResponse, history)`: Contextual continuity component
- `calculateSemanticMirroring(userInput, aiResponse)`: Semantic mirroring component
- `calculateEntropyDelta(aiResponse)`: Entropy delta component

### LVS Functions

- `generateLVSPrompt(scaffolding)`: Generate LVS prompt from scaffolding
- `applyLVS(userInput, config, history?)`: Apply LVS to user input
- `evaluateLVSEffectiveness(baselineR_m, lvsR_m)`: Evaluate LVS impact
- `createCustomScaffolding(...)`: Create custom LVS scaffolding
- `getLVSTemplate(domain)`: Get domain-specific template

### Enhanced Trust Protocol

- `new EnhancedTrustProtocol(lvsConfig?)`: Create enhanced protocol instance
- `calculateEnhancedTrustScore(interaction)`: Calculate trust score with R_m
- `applyLVSToInput(userInput, history?)`: Apply LVS preprocessing
- `generateEnhancedTrustReceipt(interaction)`: Generate receipt with R_m data

## Integration with Other Packages

### With @sonate/detect

```typescript
import { ResonanceDetector } from '@sonate/detect';
import { DEFAULT_LVS_SCAFFOLDING } from '@sonate/core';

const detector = new ResonanceDetector({
  enableAlerts: true,
  alertCallback: (alert) => {
    console.log(`Alert: ${alert.level} - ${alert.message}`);
  }
});

const metrics = await detector.detect({
  userInput: 'Help me understand AI',
  aiResponse: 'AI stands for Artificial Intelligence...',
  conversationHistory: []
});
```

### With @sonate/lab

```typescript
import { LVSExperimentOrchestrator, createDefaultLVSExperiment } from '@sonate/lab';
import { DEFAULT_LVS_SCAFFOLDING } from '@sonate/core';

const orchestrator = new LVSExperimentOrchestrator();

const experiment = await orchestrator.runExperiment(
  createDefaultLVSExperiment(testCases)
);

console.log(`Best variant: ${experiment.statisticalAnalysis.bestVariant}`);
```

### With @sonate/orchestrate

```typescript
import { LVSAgentOrchestrator } from '@sonate/orchestrate';
import { getLVSTemplate } from '@sonate/core';

const orchestrator = new LVSAgentOrchestrator();

const agent = await orchestrator.registerAgent({
  name: 'Customer Support AI',
  type: 'customer-support',
  capabilities: ['chat', 'analyze'],
  lvsScaffolding: getLVSTemplate('customerSupport'),
  owner: 'admin'
});
```

## Best Practices

1. **Start with Default Scaffolding**: Use `DEFAULT_LVS_SCAFFOLDING` as a baseline
2. **Monitor R_m Continuously**: Track resonance metrics over time
3. **Adjust Weights Based on Domain**: Customize weights for specific use cases
4. **Use Domain Templates**: Leverage pre-built templates for common scenarios
5. **Validate with Experiments**: Use @sonate/lab to validate LVS effectiveness
6. **Iterate on Scaffolding**: Refine scaffolding based on performance data

## Performance Considerations

- R_m calculation: < 10ms per interaction
- LVS prompt generation: < 5ms
- Enhanced trust score: < 20ms total
- Minimal memory overhead: ~1KB per interaction

## Next Steps

- Explore [@sonate/detect](../detect/README_LVS.md) for real-time resonance monitoring
- See [@sonate/lab](../lab/README_LVS.md) for LVS experimentation
- Check [@sonate/orchestrate](../orchestrate/README_LVS.md) for agent orchestration

## References

- [SYMBI Framework](https://gammatria.com/schemas/trust-receipt)
- [Bedau Research](../../docs/BEDAU_RESEARCH.md)
- [Enterprise Guide](../../docs/ENTERPRISE_GUIDE_v1.4.0.md)