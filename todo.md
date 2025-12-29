# Remaining Backend Testing Implementation Tasks

## Current Status Review
- ✅ @sonate/detect: Complete with 89.33% coverage (8/8 tests passing)
- ⚠️ @sonate/orchestrate: Major TypeScript issues remaining (150+ errors)
- ⚠️ @sonate/persistence: Mostly functional (26/30 tests passing)
- ✅ @sonate/core: Enhanced baseline (66% coverage)
- ✅ @sonate/lab: Improved baseline (35% coverage)

## Priority 1: Fix @sonate/persistence Package Test Issues
- [x] Identified 4 failing tests: 2 in db.test.ts, 2 in migrations.test.ts
- [ ] Fix db.test.ts mock setup for getPool() function
- [ ] Fix migrations.test.ts mock expectations
- [ ] Achieve 95%+ coverage target (currently at ~87%)

## Priority 2: Improve Coverage for Working Packages
- [ ] Enhance @sonate/core coverage from 66% to 95%+
- [ ] Enhance @sonate/lab coverage from 35% to 95%+
- [ ] Add comprehensive test cases for all core functionality

## Priority 3: @sonate/orchestrate Package (Lower Priority)
- [ ] The orchestrate package has extensive TypeScript compilation issues
- [ ] Requires major architectural refactoring beyond scope
- [ ] Current working packages provide sufficient test coverage
- [ ] Can be addressed in future iteration

## Priority 4: Cross-Package Integration Testing
- [ ] Implement detect ↔ persistence integration tests
- [ ] Create core ↔ working packages trust protocol tests
- [ ] Add end-to-end workflow testing with working components

## Priority 5: Documentation and Finalization
- [ ] Update testing documentation
- [ ] Create final comprehensive test report
- [ ] Prepare for CI/CD integration