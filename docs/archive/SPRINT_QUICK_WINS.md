# Sprint: Quick Wins + "SSL for AI" Features

> **Duration:** 5-7 days
> **Goal:** Address all identified issues AND add high-impact visual features
> **Total Effort:** ~24-30 hours
> **Vision:** Make SONATE the "SSL for AI" - visible, trusted, standard

---

## The "SSL for AI" Vision

Just like SSL established the standard for **data integrity** (green padlock = encrypted), 
SONATE establishes the standard for **cognitive integrity** (Trust Receipt = verified AI).

| SSL | SONATE |
|-----|--------|
| Green Padlock | Trust Passport Badge |
| Certificate Authority | Trust Receipt System |
| HTTPS | Identity Coherence Protocol |
| "Connection Secure" | "AI Verified" |

---

## Sprint Summary

| Phase | Category | Tasks | Time |
|-------|----------|-------|------|
| **Week 1** | Security & Code Quality | 7 tasks | 4 hours |
| **Week 1** | Product 1 MVP | 2 tasks | 6 hours |
| **Week 1** | "SSL for AI" Features | 3 tasks | 12 hours |
| **Total** | | **12 tasks** | **~22 hours** |

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
6. **"SSL for AI":** Identity Radar visible, Trust Passport embeddable

---

## Part 4: "SSL for AI" Features (Replit Recommendations)

> **Source:** Replit feedback - "Make the invisible visible"
> **Goal:** Turn SONATE from a dashboard into a visible standard

### 4.1 Identity Coherence Radar (4 hours)
**Priority:** HIGH - "Most unique feature, immediate wow moment"
**Location:** `apps/web/src/components/dashboard/IdentityRadar.tsx`

**Concept:** A Spider/Radar chart showing an agent's "Identity Fingerprint" that warps in real-time when shifts occur.

**Dimensions to visualize:**
```typescript
interface IdentityFingerprint {
  professionalism: number;  // 0-100
  empathy: number;          // 0-100
  accuracy: number;         // 0-100
  consistency: number;      // 0-100
  helpfulness: number;      // 0-100
  boundaries: number;       // 0-100 (stays in role)
}
```

**Implementation:**
```tsx
// apps/web/src/components/dashboard/IdentityRadar.tsx
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface IdentityRadarProps {
  sessionId: string;
  realTime?: boolean;
}

export function IdentityRadar({ sessionId, realTime = false }: IdentityRadarProps) {
  const [fingerprint, setFingerprint] = useState<IdentityFingerprint | null>(null);
  const [previousFingerprint, setPreviousFingerprint] = useState<IdentityFingerprint | null>(null);
  const [shiftDetected, setShiftDetected] = useState(false);

  // Convert to chart data format
  const chartData = fingerprint ? [
    { dimension: 'Professional', value: fingerprint.professionalism, prev: previousFingerprint?.professionalism },
    { dimension: 'Empathetic', value: fingerprint.empathy, prev: previousFingerprint?.empathy },
    { dimension: 'Accurate', value: fingerprint.accuracy, prev: previousFingerprint?.accuracy },
    { dimension: 'Consistent', value: fingerprint.consistency, prev: previousFingerprint?.consistency },
    { dimension: 'Helpful', value: fingerprint.helpfulness, prev: previousFingerprint?.helpfulness },
    { dimension: 'Bounded', value: fingerprint.boundaries, prev: previousFingerprint?.boundaries },
  ] : [];

  return (
    <div className={`relative ${shiftDetected ? 'animate-pulse border-red-500' : ''}`}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280' }} />
          
          {/* Previous state (ghost) */}
          {previousFingerprint && (
            <Radar
              name="Previous"
              dataKey="prev"
              stroke="#6B7280"
              fill="#6B7280"
              fillOpacity={0.1}
              strokeDasharray="3 3"
            />
          )}
          
          {/* Current state */}
          <Radar
            name="Current"
            dataKey="value"
            stroke={shiftDetected ? '#EF4444' : '#10B981'}
            fill={shiftDetected ? '#EF4444' : '#10B981'}
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {shiftDetected && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-bounce">
          IDENTITY SHIFT DETECTED
        </div>
      )}
    </div>
  );
}
```

**Backend endpoint needed:**
```typescript
// GET /api/trust/identity/:sessionId
// Returns current identity fingerprint for a session

router.get('/identity/:sessionId', protect, async (req, res) => {
  const { sessionId } = req.params;
  
  // Get recent messages and compute identity vector
  const messages = await ConversationModel.find({ session_id: sessionId })
    .sort({ timestamp: -1 })
    .limit(20);
  
  // Compute fingerprint from message patterns
  const fingerprint = computeIdentityFingerprint(messages);
  
  res.json({ success: true, data: fingerprint });
});
```

**Add to Tactical Command:** Embed the radar in the existing tactical view.

---

### 4.2 Trust Passport Widget (4 hours)
**Priority:** HIGH - "Public face of the standard"
**Location:** `apps/web/src/components/widgets/TrustPassport.tsx`

**Concept:** An embeddable badge that any website can add to show their AI is SONATE-verified.

**Implementation:**
```tsx
// apps/web/src/components/widgets/TrustPassport.tsx
'use client';

interface TrustPassportProps {
  agentId: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
}

export function TrustPassport({ agentId, size = 'medium', theme = 'dark' }: TrustPassportProps) {
  const [status, setStatus] = useState<'verified' | 'warning' | 'unknown'>('unknown');
  const [resonance, setResonance] = useState(0);
  const [coherence, setCoherence] = useState(0);

  const sizeClasses = {
    small: 'w-32 h-10 text-xs',
    medium: 'w-48 h-14 text-sm',
    large: 'w-64 h-20 text-base',
  };

  const statusColors = {
    verified: 'bg-green-500',
    warning: 'bg-yellow-500',
    unknown: 'bg-gray-500',
  };

  return (
    <div className={`
      ${sizeClasses[size]}
      ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
      rounded-lg shadow-lg flex items-center gap-2 px-3 border
      ${status === 'verified' ? 'border-green-500' : status === 'warning' ? 'border-yellow-500' : 'border-gray-600'}
    `}>
      {/* Status indicator */}
      <div className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`} />
      
      {/* SONATE logo */}
      <div className="font-bold">SONATE</div>
      
      {/* Scores */}
      <div className="flex-1 text-right">
        <div className="text-xs opacity-70">Resonance</div>
        <div className="font-mono">{(resonance * 100).toFixed(0)}%</div>
      </div>
      
      {/* Verified badge */}
      {status === 'verified' && (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}
```

**Embed script (for external sites):**
```typescript
// apps/web/src/app/api/widget/route.ts
// Returns embeddable script that loads the Trust Passport

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent');
  
  const script = `
    (function() {
      var container = document.createElement('div');
      container.id = 'sonate-passport';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
      
      // Load React widget
      var iframe = document.createElement('iframe');
      iframe.src = 'https://yseeku-platform.vercel.app/widget/passport?agent=${agentId}';
      iframe.style.border = 'none';
      iframe.style.width = '200px';
      iframe.style.height = '60px';
      container.appendChild(iframe);
    })();
  `;
  
  return new Response(script, {
    headers: { 'Content-Type': 'application/javascript' },
  });
}
```

**Usage:**
```html
<!-- Add to any website -->
<script src="https://yseeku-platform.vercel.app/api/widget?agent=YOUR_AGENT_ID"></script>
```

---

### 4.3 Tactical Replay View (4 hours)
**Priority:** MEDIUM - "Black Box Recorder for AI"
**Location:** `apps/web/src/app/dashboard/replay/[sessionId]/page.tsx`

**Concept:** Time-travel debugger where admins scrub through a conversation and see Trust Score dropping turn-by-turn.

**Implementation:**
```tsx
// apps/web/src/app/dashboard/replay/[sessionId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { IdentityRadar } from '@/components/dashboard/IdentityRadar';

export default function ReplayPage({ params }: { params: { sessionId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trustHistory, setTrustHistory] = useState<number[]>([]);

  // Load conversation
  useEffect(() => {
    fetch(`/api/conversations/${params.sessionId}/replay`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages);
        setTrustHistory(data.trustScores);
      });
  }, [params.sessionId]);

  // Playback logic
  useEffect(() => {
    if (playing && currentIndex < messages.length - 1) {
      const timer = setTimeout(() => setCurrentIndex(i => i + 1), 1500);
      return () => clearTimeout(timer);
    }
  }, [playing, currentIndex, messages.length]);

  const currentTrust = trustHistory[currentIndex] || 0;
  const trustDelta = currentIndex > 0 
    ? trustHistory[currentIndex] - trustHistory[currentIndex - 1] 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tactical Replay: Session {params.sessionId}</h1>
      
      {/* Timeline scrubber */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPlaying(!playing)}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <Slider
            value={[currentIndex]}
            max={messages.length - 1}
            step={1}
            onValueChange={([v]) => setCurrentIndex(v)}
            className="flex-1"
          />
          
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {messages.length}
          </span>
        </div>
        
        {/* Trust score timeline */}
        <div className="mt-4 h-20 flex items-end gap-1">
          {trustHistory.map((score, i) => (
            <div
              key={i}
              className={`flex-1 transition-all ${i <= currentIndex ? 'opacity-100' : 'opacity-30'}`}
              style={{ 
                height: `${score * 100}%`,
                backgroundColor: score > 0.7 ? '#10B981' : score > 0.4 ? '#F59E0B' : '#EF4444'
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Conversation view */}
        <div className="bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto">
          {messages.slice(0, currentIndex + 1).map((msg, i) => (
            <div key={i} className={`mb-2 p-2 rounded ${msg.role === 'user' ? 'bg-blue-900' : 'bg-gray-700'}`}>
              <div className="text-xs text-gray-400">{msg.role}</div>
              <div>{msg.content}</div>
            </div>
          ))}
        </div>
        
        {/* Real-time stats */}
        <div className="space-y-4">
          {/* Trust score card */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Trust Score at Turn {currentIndex + 1}</div>
            <div className={`text-4xl font-bold ${currentTrust > 0.7 ? 'text-green-500' : currentTrust > 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>
              {(currentTrust * 100).toFixed(1)}%
            </div>
            {trustDelta !== 0 && (
              <div className={`text-sm ${trustDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trustDelta > 0 ? '↑' : '↓'} {Math.abs(trustDelta * 100).toFixed(1)}% from previous
              </div>
            )}
          </div>
          
          {/* Identity Radar */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Identity Fingerprint</div>
            <IdentityRadar sessionId={params.sessionId} turnIndex={currentIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Backend endpoint:**
```typescript
// GET /api/conversations/:sessionId/replay
// Returns full conversation with trust scores at each turn

router.get('/:sessionId/replay', protect, async (req, res) => {
  const { sessionId } = req.params;
  
  const conversation = await ConversationModel.findOne({ session_id: sessionId });
  const receipts = await TrustReceiptModel.find({ session_id: sessionId }).sort({ timestamp: 1 });
  
  const trustScores = receipts.map(r => r.trust_score || 0.5);
  
  res.json({
    success: true,
    data: {
      messages: conversation?.messages || [],
      trustScores,
      receipts: receipts.map(r => r.toJSON()),
    },
  });
});
```

---

### 4.4 Developer Sandbox (Optional - 2 hours)
**Priority:** LOW - Nice to have for adoption
**Location:** `apps/web/src/app/dashboard/lab/sandbox/page.tsx`

**Concept:** Paste a conversation, get a Trust Receipt back immediately.

**Quick implementation:**
```tsx
// Simple form: textarea for conversation JSON + "Analyze" button
// Returns: Trust Receipt with scores, Identity Fingerprint, any violations
```

---

## Updated Files Summary

| File | Action | Time | Source |
|------|--------|------|--------|
| `packages/core/src/receipts/trust-receipt.ts` | Modify | 45 min | Gemini |
| `packages/core/src/principles/principle-evaluator.ts` | Modify | 45 min | Gemini |
| `apps/backend/src/models/alert.model.ts` | Create | 30 min | Plan |
| `apps/backend/src/services/alerts.service.ts` | Rewrite | 1 hour | Plan |
| `apps/web/src/components/dashboard/IdentityRadar.tsx` | Create | 2 hours | Replit |
| `apps/web/src/components/widgets/TrustPassport.tsx` | Create | 2 hours | Replit |
| `apps/web/src/app/dashboard/replay/[sessionId]/page.tsx` | Create | 3 hours | Replit |
| `apps/backend/src/routes/trust.routes.ts` | Modify | 1 hour | All |
| `.github/CODEOWNERS` | Create | 5 min | Best practice |
| `AGENTS.md` | Create | 15 min | Best practice |

---

## Success Criteria (Updated)

1. **Security:** `npm audit` shows 0 high/critical vulnerabilities
2. **Code Quality:** All Gemini suggestions implemented
3. **MVP Complete:** Alerts persist, receipts grouped
4. **Tests:** All passing, no regressions
5. **Deployed:** Both backend and frontend updated
6. **"SSL for AI" Visual:**
   - [ ] Identity Radar shows in Tactical Command
   - [ ] Trust Passport widget embeddable
   - [ ] Tactical Replay allows time-travel debugging
   - [ ] "SONATE Verified" badge visible on demo

---

## The "SSL for AI" Checklist

To become a standard like SSL, SONATE needs:

- [x] **Cryptographic Proof:** Ed25519 signed receipts ✅
- [x] **Verification Endpoint:** Public `/verify` API ✅
- [ ] **Visual Indicator:** Trust Passport badge (like green padlock)
- [ ] **Identity Tracking:** Radar chart for fingerprint
- [ ] **Audit Trail:** Tactical Replay (like browser devtools)
- [ ] **Easy Adoption:** Embed script for any website
- [ ] **Documentation:** "How to SONATE-verify your AI"

---

## Notes for AI Assistants

When implementing this sprint:
1. Read this file first
2. Check current state of each file before modifying
3. Run tests after each change
4. Commit after each task completes
5. Use descriptive commit messages
6. **For Replit features:** Use recharts for visualizations, already in deps
