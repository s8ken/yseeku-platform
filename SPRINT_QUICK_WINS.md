# Sprint: Quick Wins

> **Duration:** 2-3 days
> **Goal:** Address all identified issues from Big Pickle, Gemini CLI, and security audits
> **Total Effort:** ~12-14 hours

---

## Sprint Summary

| Category | Tasks | Time |
|----------|-------|------|
| Security | 3 tasks | 2 hours |
| Code Quality | 3 tasks | 2 hours |
| Infrastructure | 3 tasks | 1.5 hours |
| Product 1 MVP | 2 tasks | 6 hours |
| **Total** | **11 tasks** | **~11.5 hours** |

---

## Day 1: Security & Code Quality (4 hours)

### 1.1 Fix Dependency Vulnerabilities (30 min)
**Source:** Big Pickle, npm audit
**Status:** 34 vulnerabilities (30 low, 4 high)

```bash
cd /Users/admin/yseeku-platform
npm audit fix
# If breaking changes needed:
npm audit fix --force
npm run build
npm test
```

**Verify:** `npm audit` shows 0 high/critical

---

### 1.2 Add Error Logging to Trust Receipt Verify (15 min)
**Source:** Gemini CLI
**File:** `packages/core/src/receipts/trust-receipt.ts`

```typescript
// Line ~148 - Update verify() method
async verify(publicKey: Uint8Array): Promise<boolean> {
  if (!this.signature) {
    console.warn('[TrustReceipt] Verification failed: No signature present');
    return false;
  }

  try {
    const messageHash = Buffer.from(this.self_hash, 'hex');
    const signature = Buffer.from(this.signature, 'hex');
    const ed25519 = await loadEd25519();
    return await ed25519.verify(signature, messageHash, publicKey);
  } catch (error) {
    console.error('[TrustReceipt] Signature verification failed:', error);
    return false;
  }
}

// Also update verifyBound() ~line 175
async verifyBound(publicKey: Uint8Array): Promise<boolean> {
  if (!this.signature) {
    console.warn('[TrustReceipt] Bound verification failed: No signature present');
    return false;
  }
  // ... existing code ...
  } catch (error) {
    console.error('[TrustReceipt] Bound signature verification failed:', error);
    return false;
  }
}
```

**Verify:** Run trust receipt tests

---

### 1.3 Add Crypto Pre-load Init Function (30 min)
**Source:** Gemini CLI
**File:** `packages/core/src/receipts/trust-receipt.ts`

```typescript
// Add at top of file, after loadEd25519 function (~line 40)

let isInitialized = false;

/**
 * Pre-load the Ed25519 crypto library for better performance.
 * Call this during application startup to avoid cold-start delays.
 * 
 * @example
 * import { initCrypto } from '@sonate/core';
 * await initCrypto(); // Call once at app startup
 */
export async function initCrypto(): Promise<void> {
  if (isInitialized) return;
  await loadEd25519();
  isInitialized = true;
  console.log('[TrustReceipt] Crypto library pre-loaded');
}

/**
 * Check if crypto is initialized
 */
export function isCryptoReady(): boolean {
  return isInitialized;
}
```

**Also export from index.ts:**
```typescript
export { initCrypto, isCryptoReady } from './receipts/trust-receipt';
```

**Call in backend startup:**
```typescript
// apps/backend/src/index.ts
import { initCrypto } from '@sonate/core';

async function bootstrap() {
  await initCrypto(); // Pre-load crypto
  // ... rest of startup
}
```

**Verify:** Backend logs show "Crypto library pre-loaded" on startup

---

### 1.4 Make Principle Weights Configurable (45 min)
**Source:** Gemini CLI
**File:** `packages/core/src/principles/principle-evaluator.ts`

```typescript
// Add at top of file
export interface PrincipleWeightConfig {
  CONSENT_ARCHITECTURE: number;
  INSPECTION_MANDATE: number;
  CONTINUOUS_VALIDATION: number;
  ETHICAL_OVERRIDE: number;
  RIGHT_TO_DISCONNECT: number;
  MORAL_RECOGNITION: number;
}

// Default weights (current hardcoded values)
export const DEFAULT_PRINCIPLE_WEIGHTS: PrincipleWeightConfig = {
  CONSENT_ARCHITECTURE: 0.25,
  INSPECTION_MANDATE: 0.20,
  CONTINUOUS_VALIDATION: 0.20,
  ETHICAL_OVERRIDE: 0.15,
  RIGHT_TO_DISCONNECT: 0.10,
  MORAL_RECOGNITION: 0.10,
};

// Load from environment or use defaults
function loadWeights(): PrincipleWeightConfig {
  const envWeights = process.env.SONATE_PRINCIPLE_WEIGHTS;
  if (envWeights) {
    try {
      const parsed = JSON.parse(envWeights);
      console.log('[PrincipleEvaluator] Using custom weights from environment');
      return { ...DEFAULT_PRINCIPLE_WEIGHTS, ...parsed };
    } catch (e) {
      console.warn('[PrincipleEvaluator] Failed to parse SONATE_PRINCIPLE_WEIGHTS, using defaults');
    }
  }
  return DEFAULT_PRINCIPLE_WEIGHTS;
}

export const PRINCIPLE_WEIGHTS = loadWeights();
```

**Verify:** 
1. Default behavior unchanged
2. Set `SONATE_PRINCIPLE_WEIGHTS='{"CONSENT_ARCHITECTURE":0.30}'` and verify it loads

---

### 1.5 Add CODEOWNERS File (15 min)
**Source:** Best practice
**File:** `.github/CODEOWNERS`

```
# Default owner for everything
* @s8ken

# Core trust protocol - requires careful review
/packages/core/ @s8ken
/packages/trust-protocol/ @s8ken

# Security-sensitive files
/apps/backend/src/services/auth/ @s8ken
/apps/backend/src/middleware/auth* @s8ken
/.github/workflows/ @s8ken
```

---

### 1.6 Add PR Template (15 min)
**Source:** Best practice
**File:** `.github/pull_request_template.md`

```markdown
## Summary
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] Manual testing completed

## Security Checklist
- [ ] No secrets or credentials in code
- [ ] No new npm audit vulnerabilities
- [ ] Auth/permission changes reviewed

## Trust Protocol Impact
- [ ] No changes to trust receipt generation
- [ ] No changes to cryptographic signing
- [ ] Changes reviewed for principle compliance
```

---

### 1.7 Add AGENTS.md (30 min)
**Source:** Best practice for AI-assisted development
**File:** `AGENTS.md`

```markdown
# AI Agent Guidelines for YSEEKU SONATE

## Project Overview
YSEEKU SONATE is an enterprise AI governance platform implementing the SYMBI trust framework.

## Key Concepts
- **Trust Receipts**: Ed25519 signed, hash-chained records of AI interactions
- **SYMBI Principles**: 6 constitutional principles (Consent, Inspection, Validation, Override, Disconnect, Recognition)
- **CIQ Metrics**: Clarity, Integrity, Quality scores for each interaction

## Architecture
- **Monorepo**: Turborepo with apps/ and packages/
- **Backend**: Express + MongoDB + Socket.IO
- **Frontend**: Next.js 15 + TailwindCSS
- **Packages**: @sonate/core, @sonate/detect, @sonate/orchestrate, @sonate/lab

## Important Files
- `packages/core/src/receipts/trust-receipt.ts` - Cryptographic receipt implementation
- `packages/core/src/principles/principle-evaluator.ts` - SYMBI principle scoring
- `apps/backend/src/services/keys.service.ts` - Ed25519 key management
- `apps/backend/src/routes/conversation.routes.ts` - Chat + receipt generation

## Security Rules
1. NEVER commit API keys or secrets
2. NEVER modify Ed25519 signing without review
3. NEVER change principle weights without documentation
4. ALWAYS run `npm audit` before committing

## Testing
```bash
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run lint               # Linting
npm run typecheck          # TypeScript checks
```

## Common Tasks
- Add new principle: Edit `principle-evaluator.ts` + update weights
- Add new alert type: Edit `alert.model.ts` + `alerts.service.ts`
- Add dashboard page: Create in `apps/web/src/app/dashboard/`
```

---

## Day 2: Product 1 MVP Completion (6 hours)

### 2.1 Alerts Persistence to MongoDB (3 hours)
**Source:** IMPLEMENTATION_PLAN.md P0
**Files:**
- Create: `apps/backend/src/models/alert.model.ts`
- Modify: `apps/backend/src/services/alerts.service.ts`
- Modify: `apps/backend/src/routes/alerts.routes.ts`

**Implementation:**

```typescript
// apps/backend/src/models/alert.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  tenant_id: string;
  type: 'trust_violation' | 'policy_breach' | 'emergence_detected' | 'consent_withdrawal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  receipt_id?: string;
  session_id?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: Date;
  resolved_at?: Date;
  created_at: Date;
}

const AlertSchema = new Schema<IAlert>({
  tenant_id: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['trust_violation', 'policy_breach', 'emergence_detected', 'consent_withdrawal'] },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
  title: { type: String, required: true },
  description: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
  receipt_id: { type: String, index: true },
  session_id: { type: String, index: true },
  status: { type: String, default: 'active', enum: ['active', 'acknowledged', 'resolved'], index: true },
  acknowledged_by: { type: String },
  acknowledged_at: { type: Date },
  resolved_at: { type: Date },
  created_at: { type: Date, default: Date.now, index: true },
});

// Compound indexes for common queries
AlertSchema.index({ tenant_id: 1, status: 1, created_at: -1 });
AlertSchema.index({ tenant_id: 1, severity: 1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
```

```typescript
// apps/backend/src/services/alerts.service.ts
import { AlertModel, IAlert } from '../models/alert.model';
import { io } from '../index'; // Socket.IO instance

export class AlertsService {
  static async createAlert(data: Partial<IAlert>): Promise<IAlert> {
    const alert = await AlertModel.create(data);
    
    // Emit real-time update
    if (io) {
      io.to(`tenant:${data.tenant_id}`).emit('alert:new', alert);
    }
    
    return alert;
  }

  static async getAlerts(tenantId: string, options: {
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: IAlert[]; total: number }> {
    const query: any = { tenant_id: tenantId };
    if (options.status) query.status = options.status;
    if (options.severity) query.severity = options.severity;

    const [alerts, total] = await Promise.all([
      AlertModel.find(query)
        .sort({ created_at: -1 })
        .skip(options.offset || 0)
        .limit(options.limit || 50),
      AlertModel.countDocuments(query),
    ]);

    return { alerts, total };
  }

  static async acknowledgeAlert(alertId: string, userId: string): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      },
      { new: true }
    );

    if (alert && io) {
      io.to(`tenant:${alert.tenant_id}`).emit('alert:updated', alert);
    }

    return alert;
  }

  static async resolveAlert(alertId: string): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        status: 'resolved',
        resolved_at: new Date(),
      },
      { new: true }
    );

    if (alert && io) {
      io.to(`tenant:${alert.tenant_id}`).emit('alert:updated', alert);
    }

    return alert;
  }

  static async getAlertStats(tenantId: string): Promise<{
    total: number;
    active: number;
    critical: number;
    byType: Record<string, number>;
  }> {
    const [total, active, critical, byType] = await Promise.all([
      AlertModel.countDocuments({ tenant_id: tenantId }),
      AlertModel.countDocuments({ tenant_id: tenantId, status: 'active' }),
      AlertModel.countDocuments({ tenant_id: tenantId, severity: 'critical', status: 'active' }),
      AlertModel.aggregate([
        { $match: { tenant_id: tenantId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      active,
      critical,
      byType: byType.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
    };
  }
}
```

**Test:** 
1. Create alert via API
2. Restart server
3. Verify alert persists

---

### 2.2 Receipt Grouping by Session (3 hours)
**Source:** IMPLEMENTATION_PLAN.md P0
**Files:**
- Modify: `apps/backend/src/routes/trust.routes.ts`
- Modify: `apps/web/src/app/dashboard/receipts/page.tsx`

**Backend endpoint:**
```typescript
// Add to trust.routes.ts
router.get('/receipts/grouped', protect, async (req, res) => {
  const tenantId = req.userTenant || 'default';
  const { limit = 20, offset = 0 } = req.query;

  const grouped = await TrustReceiptModel.aggregate([
    { $match: { tenant_id: tenantId } },
    { $sort: { timestamp: -1 } },
    { $group: {
      _id: '$session_id',
      count: { $sum: 1 },
      first_timestamp: { $min: '$timestamp' },
      last_timestamp: { $max: '$timestamp' },
      avg_trust_score: { $avg: '$trust_score' },
      receipts: { $push: '$$ROOT' },
    }},
    { $sort: { last_timestamp: -1 } },
    { $skip: Number(offset) },
    { $limit: Number(limit) },
    { $project: {
      session_id: '$_id',
      count: 1,
      first_timestamp: 1,
      last_timestamp: 1,
      avg_trust_score: 1,
      latest_receipt: { $arrayElemAt: ['$receipts', 0] },
    }},
  ]);

  const total = await TrustReceiptModel.distinct('session_id', { tenant_id: tenantId });

  res.json({
    success: true,
    data: {
      sessions: grouped,
      total: total.length,
    },
  });
});
```

**Frontend - Add session grouping view:**
```typescript
// Update receipts page to show grouped view with expand/collapse
// Show: Session ID | Message Count | Avg Trust Score | Time Range | Actions
// Expand to show individual receipts in that session
```

**Test:** 
1. Send multiple messages in chat
2. Check receipts page shows grouped by session
3. Expand session to see individual receipts

---

## Day 3: Testing & Deployment (2 hours)

### 3.1 Run All Tests
```bash
cd /Users/admin/yseeku-platform
npm run lint
npm run typecheck
npm test
npm run test:integration
```

### 3.2 Deploy to Staging
```bash
# Backend
cd apps/backend
fly deploy --config fly.toml

# Frontend
cd apps/web
vercel --prod
```

### 3.3 UAT Checklist
- [ ] Trust receipts generate with signatures
- [ ] Receipts verify on /verify page
- [ ] Alerts persist after server restart
- [ ] Receipts grouped by session in dashboard
- [ ] Real-time alerts via WebSocket
- [ ] No npm audit vulnerabilities
- [ ] All tests passing

---

## Files Changed Summary

| File | Action | Time |
|------|--------|------|
| `packages/core/src/receipts/trust-receipt.ts` | Modify | 45 min |
| `packages/core/src/principles/principle-evaluator.ts` | Modify | 45 min |
| `packages/core/src/index.ts` | Modify | 5 min |
| `apps/backend/src/index.ts` | Modify | 10 min |
| `apps/backend/src/models/alert.model.ts` | Create | 30 min |
| `apps/backend/src/services/alerts.service.ts` | Rewrite | 1 hour |
| `apps/backend/src/routes/alerts.routes.ts` | Modify | 30 min |
| `apps/backend/src/routes/trust.routes.ts` | Modify | 30 min |
| `apps/web/src/app/dashboard/receipts/page.tsx` | Modify | 1.5 hours |
| `.github/CODEOWNERS` | Create | 5 min |
| `.github/pull_request_template.md` | Create | 5 min |
| `AGENTS.md` | Create | 15 min |

---

## Success Criteria

1. **Security:** `npm audit` shows 0 high/critical vulnerabilities
2. **Code Quality:** All Gemini suggestions implemented
3. **MVP Complete:** Alerts persist, receipts grouped
4. **Tests:** All passing, no regressions
5. **Deployed:** Both backend and frontend updated

---

## Notes for AI Assistants

When implementing this sprint:
1. Read this file first
2. Check current state of each file before modifying
3. Run tests after each change
4. Commit after each task completes
5. Use descriptive commit messages
