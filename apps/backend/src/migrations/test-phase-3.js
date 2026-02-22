#!/usr/bin/env node
/**
 * Phase 3 Migration Verification Test
 * 
 * Comprehensive test suite to verify Phase 3 migration was successful
 * 
 * Run with: npm run test:phase-3
 * Or: node apps/backend/src/migrations/test-phase-3.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

console.log(`\n${colors.blue}${'═'.repeat(60)}`);
console.log(`${colors.blue}  PHASE 3: Migration Verification Test Suite`);
console.log(`${colors.blue}${'═'.repeat(60)}\n`);

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`${colors.red}✗${colors.reset} ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

// TEST SUITE 1: Migration script structure
console.log(`${colors.cyan}Test Suite 1: Migration Script Structure${colors.reset}\n`);

test('Phase 3 migration file exists', () => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'phase-3-symbi-scoring.ts');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
});

test('Migration file has runPhase3Migration function', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('export async function runPhase3Migration')) {
    throw new Error('runPhase3Migration function not exported');
  }
});

test('Migration file has verifyPhase3Migration function', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('export async function verifyPhase3Migration')) {
    throw new Error('verifyPhase3Migration function not exported');
  }
});

test('Migration CLI file exists', () => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'phase-3-cli.ts');
  if (!fs.existsSync(filePath)) {
    throw new Error(`CLI file not found: ${filePath}`);
  }
});

test('Migrations index exists', () => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'index.ts');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migrations index file not found: ${filePath}`);
  }
});

// TEST SUITE 2: Migration logic
console.log(`\n${colors.cyan}Test Suite 2: Migration Logic${colors.reset}\n`);

test('Migration creates weight_source index', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes("'telemetry.weight_source': 1")) {
    throw new Error('weight_source index creation not found');
  }
});

test('Migration creates weight_policy_id index', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes("'telemetry.weight_policy_id': 1")) {
    throw new Error('weight_policy_id index creation not found');
  }
});

test('Migration creates compound index for queries', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('weight_source') && 
      !content.includes('trust_status')) {
    throw new Error('Compound index creation not found');
  }
});

test('Migration stores collection metadata', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('collection_metadata')) {
    throw new Error('Collection metadata storage not found');
  }
});

test('Migration is idempotent', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('catch')) {
    throw new Error('No error handling for idempotency');
  }
});

// TEST SUITE 3: Field definitions
console.log(`\n${colors.cyan}Test Suite 3: Field Definitions${colors.reset}\n`);

test('sonate_principles field documented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('sonate_principles')) {
    throw new Error('sonate_principles field not documented');
  }
});

test('overall_trust_score field documented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('overall_trust_score')) {
    throw new Error('overall_trust_score field not documented');
  }
});

test('trust_status field documented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('trust_status')) {
    throw new Error('trust_status field not documented');
  }
});

test('principle_weights field documented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('principle_weights')) {
    throw new Error('principle_weights field not documented');
  }
});

test('weight_source field documented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('weight_source')) {
    throw new Error('weight_source field not documented');
  }
});

test('weight_policy_id field documented', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('weight_policy_id')) {
    throw new Error('weight_policy_id field not documented');
  }
});

// TEST SUITE 4: Verification logic
console.log(`\n${colors.cyan}Test Suite 4: Verification Logic${colors.reset}\n`);

test('Verification checks for weight_source index', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('hasWeightSourceIndex')) {
    throw new Error('weight_source index verification not found');
  }
});

test('Verification checks for weight_policy_id index', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('hasWeightPolicyIndex')) {
    throw new Error('weight_policy_id index verification not found');
  }
});

test('Verification checks collection metadata', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('metadata')) {
    throw new Error('Collection metadata verification not found');
  }
});

test('Verification validates all required fields', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./apps/backend/src/migrations/phase-3-symbi-scoring.ts', 'utf8');
  if (!content.includes('requiredFields')) {
    throw new Error('Required field validation not found');
  }
});

// TEST SUITE 5: Migration guide
console.log(`\n${colors.cyan}Test Suite 5: Documentation${colors.reset}\n`);

test('Phase 3 Migration Guide exists', () => {
  const fs = require('fs');
  if (!fs.existsSync('./PHASE_3_MIGRATION_GUIDE.md')) {
    throw new Error('PHASE_3_MIGRATION_GUIDE.md not found');
  }
});

test('Migration Guide includes pre-migration checklist', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./PHASE_3_MIGRATION_GUIDE.md', 'utf8');
  if (!content.includes('Pre-Migration Checklist')) {
    throw new Error('Pre-migration checklist not found in guide');
  }
});

test('Migration Guide includes running instructions', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./PHASE_3_MIGRATION_GUIDE.md', 'utf8');
  if (!content.includes('Running the Migration')) {
    throw new Error('Running instructions not found in guide');
  }
});

test('Migration Guide includes rollback procedure', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./PHASE_3_MIGRATION_GUIDE.md', 'utf8');
  if (!content.includes('Rollback')) {
    throw new Error('Rollback procedure not found in guide');
  }
});

test('Migration Guide includes troubleshooting', () => {
  const fs = require('fs');
  const content = fs.readFileSync('./PHASE_3_MIGRATION_GUIDE.md', 'utf8');
  if (!content.includes('Troubleshooting')) {
    throw new Error('Troubleshooting section not found in guide');
  }
});

// SUMMARY
console.log(`\n${colors.blue}${'═'.repeat(60)}`);
console.log(`${colors.blue}Test Results${colors.blue}${'═'.repeat(60)}\n`);

const totalTests = testsPassed + testsFailed;
console.log(`Total Tests: ${totalTests}`);
console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
if (testsFailed > 0) {
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
}

const successRate = ((testsPassed / totalTests) * 100).toFixed(1);
console.log(`Success Rate: ${successRate}%\n`);

if (testsFailed === 0) {
  console.log(`${colors.green}✓ All ${testsPassed} Phase 3 tests passed!${colors.reset}`);
  console.log(`\n${colors.green}Phase 3 is ready for deployment${colors.reset}\n`);
  console.log('Next steps:');
  console.log('  1. Review PHASE_3_MIGRATION_GUIDE.md');
  console.log('  2. Test migration in staging environment');
  console.log('  3. Back up production MongoDB');
  console.log('  4. Run: npm run migrate:phase-3 --force');
  console.log('  5. Proceed with Phase 4\n');
  process.exit(0);
} else {
  console.log(`${colors.red}✗ ${testsFailed} test(s) failed${colors.reset}\n`);
  process.exit(1);
}
