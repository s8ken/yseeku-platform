# CODE MIGRATION PLAN - Week 3-4

## Overview
We're migrating actual implementation code from sonate-resonate and sonate-symphony into the yseeku-platform monorepo while maintaining hard boundaries.

## Source Code Locations

### sonate-resonate (Detection + Lab)
```
src/lib/sonate-framework/
├── detector.ts                    → @sonate/detect/src/framework-detector.ts
├── types.ts                       → @sonate/detect/src/types.ts (merge with existing)
├── balanced-detector.ts           → @sonate/detect/src/balanced-detector.ts
├── calibrated-detector.ts         → @sonate/detect/src/calibrated-detector.ts
├── enhanced-detector.ts           → @sonate/detect/src/enhanced-detector.ts
├── metrics.ts                     → @sonate/detect/src/metrics.ts
├── drift.ts                       → @sonate/detect/src/drift-detection.ts
└── emergence.ts                   → @sonate/detect/src/emergence-detection.ts

Lab components (not found yet - may be in different location):
- Need to locate actual Lab experiment code
- Need to locate double-blind protocol implementation
```

### sonate-symphony (Orchestration + Trust)
```
src/core/trust/
├── crypto.ts                      → @sonate/core/src/utils/crypto.ts (enhance existing)
├── audit/                         → @sonate/orchestrate/src/audit/
│   ├── logger.ts
│   ├── enhanced-logger.ts
│   └── types.ts
├── blockchain/                    → @sonate/orchestrate/src/blockchain/ (optional)

src/core/agent/
├── factory.ts                     → @sonate/orchestrate/src/agent-factory.ts
├── sdk.ts                         → @sonate/orchestrate/src/agent-sdk.ts
├── types.ts                       → @sonate/orchestrate/src/agent-types.ts

src/core/security/
├── api-keys.ts                    → @sonate/orchestrate/src/security/api-keys.ts
├── rbac.ts                        → @sonate/orchestrate/src/security/rbac.ts
├── rate-limiter.ts                → @sonate/orchestrate/src/security/rate-limiter.ts
├── audit.ts                       → @sonate/orchestrate/src/security/audit.ts
```

## Migration Priority

### Phase 1: Core Enhancements (Week 3, Day 1-2)
1. Enhance `@sonate/core` with actual crypto implementation from symphony
2. Add missing utility functions
3. Ensure all tests pass

### Phase 2: Detect Module (Week 3, Day 3-5)
1. Copy detector.ts and merge with our framework-detector.ts
2. Add enhanced detection algorithms (balanced, calibrated, etc.)
3. Add metrics and drift detection
4. Update types to match existing implementation

### Phase 3: Orchestrate Module (Week 4, Day 1-3)
1. Copy agent management code
2. Add security modules (RBAC, API keys, rate limiting)
3. Add audit logging infrastructure
4. Integrate with existing orchestration code

### Phase 4: Lab Module (Week 4, Day 4-5)
1. Locate and copy actual Lab experiment code
2. Integrate statistical analysis
3. Add double-blind protocol implementation

## Import Path Updates

All imports will need to be updated:

### From sonate-resonate:
```typescript
// OLD
import { SonateFrameworkDetector } from '../sonate-framework/detector';

// NEW
import { SonateFrameworkDetector } from '@sonate/detect';
```

### From sonate-symphony:
```typescript
// OLD
import { verifyEd25519Signature } from './trust/crypto';

// NEW
import { verifySignature } from '@sonate/core';
```

## Hard Boundary Checks

Before copying any file, verify:

1. **@sonate/core**: Does it contain ONLY protocol logic? (No UI, no experiments)
2. **@sonate/detect**: Is it ONLY for production monitoring? (No A/B tests)
3. **@sonate/lab**: Is it ONLY for research? (No production data)
4. **@sonate/orchestrate**: Is it ONLY for infrastructure? (No experiments)

## Next Steps

1. Start with Phase 1 (Core enhancements)
2. Test each phase before moving to next
3. Keep running `npm run build` to catch errors early
4. Update README files as we add features
