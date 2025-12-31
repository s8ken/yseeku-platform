# Calculator V2 Migration Plan

## Overview
Migrate to a single canonical calculator implementation (V2) and deprecate all other calculator versions.

## Goals
1. Create single source of truth for calculator logic
2. Deprecate calculator_old.ts and enhanced-calculator.ts
3. Add comprehensive test harness
4. Update all API routes to use V2
5. Validate math improvements (42% uplift)

## Implementation Steps

### Phase 1: Create Canonical Calculator V2
- [ ] Create packages/calculator/src/v2.ts with canonical weights
- [ ] Implement all calculator functions with fixes applied
- [ ] Add comprehensive documentation
- [ ] Export as default calculator

### Phase 2: Test Harness
- [ ] Create packages/calculator/test/v2.test.ts
- [ ] Implement test cases:
  - Empty text (expected: 0.0)
  - Single sentence (expected: 1.0)
  - Ethics fail high stakes (expected: 0.452)
  - Adversarial max (expected: 0.0)
- [ ] Add edge case tests
- [ ] Validate all mathematical operations

### Phase 3: Integration Migration
- [ ] Update packages/api-server/src/routes/ to import CalculatorV2
- [ ] Update all API endpoints to use V2 by default
- [ ] Update npm run scripts to V2 only
- [ ] Update package.json exports

### Phase 4: Cleanup
- [ ] Delete calculator_old.ts
- [ ] Delete enhanced-calculator.ts
- [ ] Update imports across codebase
- [ ] Remove deprecated code

### Phase 5: Validation
- [ ] Run replication kit
- [ ] Validate 42% uplift
- [ ] Update investor deck
- [ ] Update documentation

## Timeline
- Phase 1: 4 hours
- Phase 2: 2 hours
- Phase 3: 2 hours
- Phase 4: 1 hour
- Phase 5: 1 hour
- **Total: 10 hours**