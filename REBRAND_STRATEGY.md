# SYMBI → SONATE Rebranding Strategy

## Executive Summary

**Goal**: Rebrand the "SYMBI Framework" to "SONATE Framework" for brand consistency across the platform.

**Scope**: ~1,636 references across code, documentation, and demos
- 777 references in code files (.ts, .tsx, .js, .json)
- 651 references in markdown files (.md)
- 208 lowercase "symbi" references

**Current State**:
- ✅ Platform already branded as "SONATE Platform - The Trust Layer for AI"
- ✅ Package names already use @sonate/* namespace
- ❌ Framework principles still referenced as "SYMBI" throughout

## Replacement Categories

### Category 1: **CHANGE** - User-Facing Text
These directly impact user experience and should be changed for brand consistency.

#### Frontend UI Components
- [ ] Page titles: "SYMBI Analysis" → "SONATE Analysis"
- [ ] Navigation items: "SYMBI Home", "Chat with SYMBI" → "SONATE Home", "Chat with SONATE"
- [ ] Buttons and labels
- [ ] Tooltips and help text
- [ ] Error messages and notifications

**Files to update** (~20 files):
```
apps/web/src/app/dashboard/page.tsx
apps/web/src/app/proof/page.tsx
apps/web/src/components/ConstitutionalPrinciples.tsx
apps/web/src/components/chat/ChatMessage.tsx
apps/web/src/components/chat/ChatContainer.tsx
apps/web/src/components/trust-receipt/TrustReceiptCard.tsx
apps/web/src/components/trust-receipt/TrustReceiptCompact.tsx
apps/web/src/components/dashboard.tsx
apps/web/src/components/demo-initializer.tsx
apps/web/src/app/dashboard/reports/page.tsx
apps/web/src/app/dashboard/monitoring/live/page.tsx
apps/web/src/app/dashboard/chat/page.tsx
apps/web/src/app/dashboard/settings/trust/page.tsx
apps/web/src/app/dashboard/api/page.tsx
apps/web/src/app/demo/layout.tsx
apps/web/src/store/useTutorialStore.ts
apps/web/src/components/ui/info-tooltip.tsx
apps/web/src/lib/api/index.ts
apps/web/src/lib/api/lab.ts
```

#### HTML Demo Files
- [ ] comprehensive-demo2.html (40+ references)
- [ ] yseeku-platform-enhanced-canonical.html (20+ references)
- [ ] yseeku-platform-mvp-unified-fixed.html (10+ references)
- [ ] yseeku-dual-layer-demo.html
- [ ] standalone-demo.html

### Category 2: **CHANGE** - Documentation
Essential for external communication and developer onboarding.

#### User-Facing Documentation
- [ ] README.md - Framework description and overview
- [ ] PLATFORM_REVIEW_2026.md - Recent review document
- [ ] PR_DESCRIPTION.md - PR templates and descriptions
- [ ] SCENARIO_ENGINE_IMPLEMENTATION.md - Implementation guides

#### Technical Documentation
- [ ] All markdown files in /docs (if exists)
- [ ] Package READMEs in packages/*/README.md
- [ ] API documentation

**Pattern to apply**:
```markdown
# Before:
"SYMBI Framework consists of six constitutional principles..."
"The SYMBI framework is like a constitution for AI systems..."

# After:
"SONATE Framework consists of six constitutional principles..."
"The SONATE framework is like a constitution for AI systems..."
```

### Category 3: **CHANGE** - Code Comments and Docstrings
Improve code documentation clarity for future developers.

#### File Headers
```typescript
// Before:
/**
 * SYMBI Framework Types
 * This file defines the core types for the SYMBI framework detection...
 */

// After:
/**
 * SONATE Framework Types
 * This file defines the core types for the SONATE framework detection...
 */
```

**Files to update** (~50+ files):
```
packages/detect/src/symbi-types.ts
packages/detect/src/detector-enhanced.ts
packages/core/src/trust-protocol.ts
apps/backend/src/services/trust.service.ts
apps/backend/src/routes/proof.routes.ts
apps/backend/src/routes/conversation.routes.ts
apps/backend/src/routes/reports.routes.ts
... (all files with "SYMBI" in comments)
```

### Category 4: **CHANGE WITH CAUTION** - Type and Interface Names
Requires careful refactoring to maintain type safety.

#### TypeScript Types/Interfaces
```typescript
// Before:
export interface SymbiFrameworkAssessment { ... }
export class SymbiFrameworkDetector { ... }
export class SYMBICollaborationLedger { ... }

// After:
export interface SonateFrameworkAssessment { ... }
export class SonateFrameworkDetector { ... }
export class SonateCollaborationLedger { ... }
```

**Critical files** (update exports AND all imports):
1. `packages/detect/src/symbi-types.ts` → Consider renaming to `sonate-types.ts`
   - SymbiFrameworkAssessment → SonateFrameworkAssessment
2. `packages/detect/src/detector-enhanced.ts`
   - SymbiFrameworkDetector → SonateFrameworkDetector
3. `packages/collaboration-ledger/src/index.ts`
   - SYMBICollaborationLedger → SonateCollaborationLedger
4. All consuming files that import these types

**Migration approach**:
1. Create type aliases for backward compatibility (Phase 1)
2. Update all internal usages (Phase 2)
3. Remove aliases after verification (Phase 3)

Example:
```typescript
// Phase 1: Add aliases
export interface SonateFrameworkAssessment { ... }
/** @deprecated Use SonateFrameworkAssessment */
export type SymbiFrameworkAssessment = SonateFrameworkAssessment;

// Phase 2: Update all usages
// Phase 3: Remove deprecated aliases
```

### Category 5: **CHANGE** - Variable Names
Improve code consistency.

#### Variable/Property Names
```typescript
// Before:
const symbiScore = ...;
const symbi = {
  consent: 8.5,
  inspection: 9.0,
  // ...
};

// After:
const sonateScore = ...;
const sonate = {
  consent: 8.5,
  inspection: 9.0,
  // ...
};
```

**Files with lowercase "symbi"** (~208 references):
- JavaScript data engine files
- Demo HTML files
- TypeScript service files

### Category 6: **CHANGE** - Backend API Responses
Ensure API consistency (requires API versioning consideration).

#### API Response Fields
```typescript
// Before:
{
  symbi: {
    consent: 8.5,
    inspection: 9.0,
    // ...
  }
}

// After:
{
  sonate: {
    consent: 8.5,
    inspection: 9.0,
    // ...
  }
}
```

**Files to update** (~18 backend files):
```
apps/backend/src/routes/proof.routes.ts
apps/backend/src/routes/conversation.routes.ts
apps/backend/src/routes/reports.routes.ts
apps/backend/src/routes/trust.routes.ts
apps/backend/src/routes/dashboard.routes.ts
apps/backend/src/services/trust.service.ts
apps/backend/src/services/compliance-report.service.ts
apps/backend/src/services/live-metrics.service.ts
apps/backend/src/services/demo-seeder.service.ts
... (and others)
```

### Category 7: **PRESERVE** - Historical/Archive References
Do not change these to maintain historical accuracy.

#### Git History
- ✅ KEEP: All commit messages mentioning "SYMBI"
- ✅ KEEP: Git tags and branch names with "SYMBI"
- ✅ KEEP: Historical changelog entries

#### Archived Code
- ✅ KEEP: `_archived/symbi-symphony/` directory
- ✅ KEEP: Historical documentation in archived folders

### Category 8: **PRESERVE** - Package Names
Already correctly branded.

#### npm Package Names
- ✅ KEEP: @sonate/core
- ✅ KEEP: @sonate/detect
- ✅ KEEP: @sonate/orchestrate
- ✅ KEEP: @sonate/lab
- ✅ KEEP: @sonate/persistence
- ✅ KEEP: @sonate/monitoring
- ✅ KEEP: @sonate/collaboration-ledger

### Category 9: **UPDATE** - File Names
Consider renaming for consistency.

#### TypeScript Files
```
packages/detect/src/symbi-types.ts → packages/detect/src/sonate-types.ts
```

Update all imports:
```typescript
// Before:
import { SymbiFrameworkAssessment } from './symbi-types';

// After:
import { SonateFrameworkAssessment } from './sonate-types';
```

## Implementation Plan

### Phase 1: Preparation (Low Risk)
1. ✅ Create this strategy document
2. [ ] Create git branch: `feature/rebrand-symbi-to-sonate`
3. [ ] Update documentation (markdown files)
4. [ ] Update code comments and docstrings
5. [ ] Update HTML demo files
6. [ ] Test build: `npm run build`
7. [ ] Commit: "docs: Rebrand SYMBI Framework to SONATE Framework in documentation"

### Phase 2: Frontend (Medium Risk)
1. [ ] Update frontend UI text (React components)
2. [ ] Update variable names in frontend
3. [ ] Update store names (useTutorialStore, etc.)
4. [ ] Test build: `npm run build`
5. [ ] Manual UI testing
6. [ ] Commit: "feat: Rebrand SYMBI to SONATE in frontend UI"

### Phase 3: Backend (Medium Risk)
1. [ ] Update backend API response field names
2. [ ] Update service method names
3. [ ] Update route handlers
4. [ ] Test build: `npm run build:backend`
5. [ ] API integration testing
6. [ ] Commit: "feat: Rebrand SYMBI to SONATE in backend API"

### Phase 4: TypeScript Types (High Risk - Breaking Changes)
1. [ ] Add type aliases for backward compatibility
2. [ ] Update interface names in source files
3. [ ] Update all imports across codebase
4. [ ] Rename `symbi-types.ts` to `sonate-types.ts`
5. [ ] Update package exports
6. [ ] Test build: `npm run build`
7. [ ] Run all tests: `npm test`
8. [ ] Commit: "refactor: Rename SYMBI types to SONATE types"

### Phase 5: Verification and Cleanup
1. [ ] Run full build: `npm run build`
2. [ ] Run all tests: `npm test`
3. [ ] Manual end-to-end testing
4. [ ] Search for remaining "SYMBI" references: `grep -r "SYMBI" --exclude-dir=node_modules --exclude-dir=dist`
5. [ ] Update package.json descriptions if needed
6. [ ] Remove deprecated type aliases (if Phase 4 was stable)
7. [ ] Final commit: "chore: Complete SYMBI to SONATE rebranding"

### Phase 6: Deployment
1. [ ] Push to remote: `git push origin feature/rebrand-symbi-to-sonate`
2. [ ] Create pull request
3. [ ] Review changes
4. [ ] Merge to main
5. [ ] Deploy to staging
6. [ ] Final verification
7. [ ] Deploy to production

## Search Commands

### Find all SYMBI references
```bash
# Code files
grep -r "SYMBI" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next

# Documentation
grep -r "SYMBI" --include="*.md" --exclude-dir=node_modules

# Lowercase symbi
grep -ri "symbi" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist

# HTML demos
grep -r "SYMBI" --include="*.html"
```

### Verify no SYMBI references remain (after changes)
```bash
# Should return only archived files and git history
grep -r "SYMBI" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=_archived
```

## Risk Mitigation

### Breaking Changes
- **Type renames**: Use type aliases during migration
- **API field renames**: Consider API versioning (v1 vs v2)
- **Variable renames**: Extensive testing required

### Rollback Plan
If issues arise after deployment:
1. Revert the merge commit
2. Deploy previous version
3. Review failures
4. Fix issues in feature branch
5. Re-deploy

## Estimated Effort

- **Phase 1 (Documentation)**: 30 minutes
- **Phase 2 (Frontend)**: 1 hour
- **Phase 3 (Backend)**: 1 hour
- **Phase 4 (Types)**: 2 hours
- **Phase 5 (Verification)**: 1 hour
- **Phase 6 (Deployment)**: 30 minutes

**Total**: ~6 hours

## Success Criteria

1. ✅ Zero "SYMBI" references in non-archived code (except git history)
2. ✅ All builds pass successfully
3. ✅ All tests pass
4. ✅ UI displays "SONATE" consistently
5. ✅ API responses use "sonate" field names
6. ✅ Documentation updated
7. ✅ No breaking changes for existing API consumers (if applicable)

---

**Created**: 2026-01-22
**Author**: Claude Code
**Status**: Ready for Implementation
