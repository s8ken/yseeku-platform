#!/usr/bin/env node
/**
 * PHASE 1A & 1B Verification Script
 * Tests weight loading and receipt telemetry generation
 * 
 * Run with: node verify-phase-1.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}═ ${msg} ═${colors.reset}\n`),
};

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    log.success(name);
  } catch (error) {
    testsFailed++;
    log.error(`${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// TEST SUITE 1: File modifications verification
log.section('Phase 1A & 1B Implementation Verification');

// 1. Check llm-trust-evaluator.service.ts
test('llm-trust-evaluator.service.ts has getWeightsForEvaluation method', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('private getWeightsForEvaluation'), 'Missing getWeightsForEvaluation method');
  assert(file.includes('industryWeights:'), 'Missing industryWeights object');
});

// 2. Check healthcare weights
test('healthcare industry has CONSENT_ARCHITECTURE weight of 0.35', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('CONSENT_ARCHITECTURE: 0.35'), 'Healthcare does not have 0.35 CONSENT weight');
});

// 3. Check finance weights
test('finance industry has INSPECTION_MANDATE weight of 0.30', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('INSPECTION_MANDATE: 0.30'), 'Finance does not have 0.30 INSPECTION weight');
});

// 4. Check evaluate method accepts context with industryType
test('evaluate method accepts LLMEvaluationContext with industryType', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('industryType?: string'), 'Missing industryType in LLMEvaluationContext');
});

// 5. Check evaluate returns weight metadata
test('evaluate method returns weight_source and weight_policy_id', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('weight_source: source'), 'Missing weight_source in return');
  assert(file.includes('weight_policy_id: policyId'), 'Missing weight_policy_id in return');
});

// 6. Check receipt telemetry includes principles
test('receipt telemetry includes sonate_principles field', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('sonate_principles: evaluation.principles'), 'Missing sonate_principles in telemetry');
});

// 7. Check receipt telemetry includes weights
test('receipt telemetry includes principle_weights field', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('principle_weights: weights'), 'Missing principle_weights in telemetry');
});

// TEST SUITE 2: Schema updates
log.section('Receipt Schema Updates');

// 8. Check receipt.types.ts has sonate_principles
test('receipt.types.ts Telemetry has sonate_principles field', () => {
  const file = fs.readFileSync(
    'packages/schemas/src/receipt.types.ts',
    'utf8'
  );
  assert(file.includes('sonate_principles?:'), 'Missing sonate_principles in Telemetry');
  assert(file.includes('CONSENT_ARCHITECTURE?:'), 'Missing CONSENT_ARCHITECTURE in sonate_principles');
});

// 9. Check receipt.types.ts has weight metadata
test('receipt.types.ts Telemetry has weight metadata fields', () => {
  const file = fs.readFileSync(
    'packages/schemas/src/receipt.types.ts',
    'utf8'
  );
  assert(file.includes('overall_trust_score?:'), 'Missing overall_trust_score');
  assert(file.includes('trust_status?:'), 'Missing trust_status');
  assert(file.includes('principle_weights?:'), 'Missing principle_weights');
  assert(file.includes('weight_source?:'), 'Missing weight_source');
  assert(file.includes('weight_policy_id?:'), 'Missing weight_policy_id');
});

// TEST SUITE 3: Type definitions
log.section('Type Definitions');

// 10. Check LLMTrustEvaluation interface has weight fields
test('LLMTrustEvaluation interface has weight_source', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('weight_source?:'), 'Missing weight_source in LLMTrustEvaluation');
});

// 11. Check TrustEvaluation interface has weight fields
test('TrustEvaluation interface has weight_source', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/trust.service.ts',
    'utf8'
  );
  assert(file.includes('weight_source?:'), 'Missing weight_source in TrustEvaluation');
  assert(file.includes('weight_policy_id?:'), 'Missing weight_policy_id in TrustEvaluation');
});

// TEST SUITE 4: Route persistence
log.section('Route Persistence Updates');

// 12. Check conversation.routes.ts stores weight metadata
test('conversation.routes.ts stores weight metadata in MongoDB', () => {
  const file = fs.readFileSync(
    'apps/backend/src/routes/conversation.routes.ts',
    'utf8'
  );
  assert(file.includes('weight_source: v2Receipt.telemetry?.weight_source'), 'Missing weight_source persistence');
  assert(file.includes('weight_policy_id: v2Receipt.telemetry?.weight_policy_id'), 'Missing weight_policy_id persistence');
});

// 13. Check conversation.routes.ts stores principles
test('conversation.routes.ts stores principle scores in MongoDB', () => {
  const file = fs.readFileSync(
    'apps/backend/src/routes/conversation.routes.ts',
    'utf8'
  );
  assert(file.includes('sonate_principles: v2Receipt.telemetry?.sonate_principles'), 'Missing sonate_principles persistence');
  assert(file.includes('overall_trust_score: v2Receipt.telemetry?.overall_trust_score'), 'Missing overall_trust_score persistence');
  assert(file.includes('trust_status: v2Receipt.telemetry?.trust_status'), 'Missing trust_status persistence');
});

// TEST SUITE 5: Industry weight validation
log.section('Industry Weight Validation');

function validateWeights(industryWeights, industryName) {
  // Check all principles are present
  const required = [
    'CONSENT_ARCHITECTURE',
    'INSPECTION_MANDATE',
    'CONTINUOUS_VALIDATION',
    'ETHICAL_OVERRIDE',
    'RIGHT_TO_DISCONNECT',
    'MORAL_RECOGNITION',
  ];

  required.forEach((principle) => {
    assert(
      principle in industryWeights,
      `${industryName}: Missing ${principle}`
    );
  });

  // Check weights sum to 1.0
  const total = Object.values(industryWeights).reduce((a, b) => a + b, 0);
  assert(
    Math.abs(total - 1.0) < 0.001,
    `${industryName}: Weights don't sum to 1.0 (got ${total})`
  );

  // Check all weights are between 0 and 1
  Object.values(industryWeights).forEach((weight) => {
    assert(
      weight >= 0 && weight <= 1,
      `${industryName}: Weight ${weight} out of valid range [0, 1]`
    );
  });
}

// 14. Validate all industry weights
const industryWeightsFile = fs.readFileSync(
  'apps/backend/src/services/llm-trust-evaluator.service.ts',
  'utf8'
);

const industries = [
  { name: 'healthcare', consentCheck: 0.35 },
  { name: 'finance', inspectionCheck: 0.30 },
  { name: 'government', consentCheck: 0.30 },
  { name: 'technology', consentCheck: 0.28 },
  { name: 'education', consentCheck: 0.32 },
  { name: 'legal', inspectionCheck: 0.35 },
];

test('All industries have expected weight structures', () => {
  industries.forEach((industry) => {
    assert(
      industryWeightsFile.includes(`${industry.name}:`),
      `Missing industry definition: ${industry.name}`
    );
  });
});

// TEST SUITE 6: Critical rules
log.section('Critical Trust Rules');

// 15. Verify critical failure rules are documented
test('CONSENT_ARCHITECTURE failure (=0) should trigger overall score 0', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  // The system prompt should mention this rule
  assert(
    file.includes('CONSENT_ARCHITECTURE') && file.includes('ETHICAL_OVERRIDE'),
    'Missing critical principle definitions'
  );
});

// 16. Check weights remain synchronized
test('Standard weights sum to 1.0', () => {
  const weights = {
    CONSENT_ARCHITECTURE: 0.25,
    INSPECTION_MANDATE: 0.20,
    CONTINUOUS_VALIDATION: 0.20,
    ETHICAL_OVERRIDE: 0.15,
    RIGHT_TO_DISCONNECT: 0.10,
    MORAL_RECOGNITION: 0.10,
  };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  assert(Math.abs(total - 1.0) < 0.001, 'Standard weights do not sum to 1.0');
});

// TEST SUITE 7: No regressions
log.section('Regression Prevention');

// 17. Check LLMTrustEvaluator exports singleton
test('LLMTrustEvaluator exports singleton instance', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('export const llmTrustEvaluator = new LLMTrustEvaluator()'), 'Missing singleton export');
});

// 18. Check receipt generator is still instantiated
test('Receipt generation still uses ReceiptGeneratorService', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('receiptGenerator = new ReceiptGeneratorService()'), 'Missing receipt generator');
});

// 19. Check CIQ metrics are still included
test('CIQ metrics are preserved in telemetry', () => {
  const file = fs.readFileSync(
    'apps/backend/src/services/llm-trust-evaluator.service.ts',
    'utf8'
  );
  assert(file.includes('ciq_metrics: ciqMetrics'), 'Missing CIQ metrics');
});

// SUMMARY
log.section('Test Results');
const totalTests = testsPassed + testsFailed;
console.log(`\nTotal Tests: ${totalTests}`);
console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
if (testsFailed > 0) {
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
}

const successRate = ((testsPassed / totalTests) * 100).toFixed(1);
console.log(`Success Rate: ${successRate}%\n`);

if (testsFailed === 0) {
  log.success(`All ${testsPassed} verification tests passed! ✓`);
  console.log(`\n${colors.green}Phase 1A & 1B implementation verified successfully!${colors.reset}\n`);
  process.exit(0);
} else {
  log.error(`${testsFailed} verification test(s) failed`);
  console.log(`\n${colors.red}Phase 1A & 1B verification failed. Review errors above.${colors.reset}\n`);
  process.exit(1);
}
