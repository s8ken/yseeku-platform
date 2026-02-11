# YSEEKU SONATE Implementation Plan

> **Created:** 2026-02-11
> **Purpose:** Complete implementation guide for Product 1 MVP and Product 2 preparation
> **For use with:** OpenCode, Cursor, Aider, or any AI coding assistant

---

## Executive Summary

### Product Definitions

| Product | Name | Timeline | Revenue Target |
|---------|------|----------|----------------|
| **Product 1** | Policy Compliance Dashboard / AI Black Box Flight Recorder | NOW (2-4 weeks) | $50K-150K/customer |
| **Product 2** | Enterprise Multi-Provider Governance Platform | 6-10 weeks | $150K-500K/customer |
| **Product 3** | Decentralized Trust Network | 18-24 months | Token-funded |

### Current Status

- **Product 1:** ~95% complete
- **Product 2:** ~70-80% complete (infrastructure exists)
- **Product 3:** ~10% (concepts documented)

---

## Part 1: Product 1 MVP Completion

### P0 - Critical (Must Fix Before Demo)

#### 1.1 Alerts Persistence to MongoDB
**Status:** Alerts are in-memory, lost on restart
**Files to modify:**
- `apps/backend/src/services/alerts.service.ts`

**Implementation:**
```typescript
// Create alerts model if not exists
// apps/backend/src/models/alert.model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  tenant_id: string;
  type: 'trust_violation' | 'policy_breach' | 'emergence_detected' | 'consent_withdrawal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: Date;
  resolved_at?: Date;
  created_at: Date;
}

const AlertSchema = new Schema<IAlert>({
  tenant_id: { type: String, required: true, index: true },
  type: { type: String, required: true },
  severity: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  metadata: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'active', index: true },
  acknowledged_by: String,
  acknowledged_at: Date,
  resolved_at: Date,
  created_at: { type: Date, default: Date.now, index: true },
});

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
```

**Update alerts.service.ts:**
- Replace in-memory array with MongoDB queries
- Add `createAlert()`, `getAlerts()`, `acknowledgeAlert()`, `resolveAlert()`

**Test:** Send a message in chat, check `/dashboard/alerts` shows the alert, restart server, alert should persist.

---

#### 1.2 Receipt Grouping by Session in Dashboard
**Status:** Receipts show as flat list, overwhelming at scale
**Files to modify:**
- `apps/web/src/app/dashboard/receipts/page.tsx`
- `apps/backend/src/routes/trust.routes.ts`

**Backend - Add grouped endpoint:**
```typescript
// GET /api/trust/receipts/grouped
// Returns receipts grouped by session_id with summary stats

router.get('/receipts/grouped', protect, async (req, res) => {
  const tenantId = req.userTenant || 'default';
  
  const grouped = await TrustReceiptModel.aggregate([
    { $match: { tenant_id: tenantId } },
    { $group: {
      _id: '$session_id',
      count: { $sum: 1 },
      avgTrustScore: { $avg: '$trustScore' },
      firstReceipt: { $min: '$timestamp' },
      lastReceipt: { $max: '$timestamp' },
      receipts: { $push: '$$ROOT' }
    }},
    { $sort: { lastReceipt: -1 } },
    { $limit: 50 }
  ]);
  
  res.json({ success: true, data: grouped });
});
```

**Frontend - Update receipts page:**
- Fetch from `/api/trust/receipts/grouped`
- Display as expandable session cards
- Show: session_id, message count, avg trust score, time range
- Click to expand and see individual receipts

---

### P1 - Important (Should Have for MVP)

#### 1.3 Truth Debt Counter
**Status:** Not implemented - unique differentiator
**Concept:** Track when AI makes unverifiable claims

**Files to create/modify:**
- `apps/backend/src/services/truth-debt.service.ts` (new)
- `apps/backend/src/routes/conversation.routes.ts` (add to trust eval)
- `packages/schemas/src/receipt.types.ts` (add truth_debt field)

**Implementation:**
```typescript
// apps/backend/src/services/truth-debt.service.ts

export class TruthDebtService {
  // Patterns that indicate unverifiable claims
  private readonly unverifiablePatterns = [
    /I believe|I think|probably|likely|might be|could be/i,
    /studies show|research indicates|experts say/i, // without citation
    /always|never|everyone|no one/i, // absolute claims
  ];
  
  // Patterns that indicate verifiable/grounded claims
  private readonly verifiablePatterns = [
    /according to|as stated in|per the documentation/i,
    /the code shows|looking at the file/i,
    /\d+%|\d+ percent/i, // specific numbers (if sourced)
  ];

  calculateTruthDebt(response: string): { score: number; flags: string[] } {
    const flags: string[] = [];
    let debt = 0;
    
    for (const pattern of this.unverifiablePatterns) {
      if (pattern.test(response)) {
        debt += 0.1;
        flags.push(`Unverifiable: ${pattern.source}`);
      }
    }
    
    for (const pattern of this.verifiablePatterns) {
      if (pattern.test(response)) {
        debt -= 0.05; // Reduce debt for grounded claims
      }
    }
    
    return { 
      score: Math.max(0, Math.min(1, debt)), // 0-1 scale
      flags 
    };
  }
}

export const truthDebtService = new TruthDebtService();
```

**Add to receipt generation:**
```typescript
// In conversation.routes.ts, after generating AI response:
const truthDebt = truthDebtService.calculateTruthDebt(aiResponse.content);

// Include in receipt
receipt.truth_debt = {
  score: truthDebt.score,
  flags: truthDebt.flags,
  threshold: 0.3, // Configurable per tenant
  exceeded: truthDebt.score > 0.3
};
```

**Display in UI:**
- Add truth debt indicator to TrustReceiptCard
- Show warning if truth_debt.exceeded

---

#### 1.4 Policy Version in Receipts
**Status:** Receipts don't embed which policy version was active
**Files to modify:**
- `apps/backend/src/routes/conversation.routes.ts`
- `packages/schemas/src/receipt.types.ts`

**Implementation:**
```typescript
// Add to receipt structure
receipt.policy = {
  version: '1.0.0', // From @sonate/policy package.json or config
  principles_version: 'SONATE-6P-v1',
  tenant_overrides: [], // Any tenant-specific policy changes
  evaluated_at: new Date().toISOString()
};
```

---

#### 1.5 Receipt Verification CLI
**Status:** SDK exists but no CLI for auditors
**Files to create:**
- `apps/cli/src/commands/verify.ts`

**Implementation:**
```typescript
// apps/cli/src/commands/verify.ts
import { Command } from 'commander';
import { verifyReceipt, fetchPublicKey } from 'sonate-verify-sdk';
import fs from 'fs';

export const verifyCommand = new Command('verify')
  .description('Verify a SONATE trust receipt')
  .argument('<file>', 'Path to receipt JSON file')
  .option('--api <url>', 'API URL', 'https://yseeku-backend.fly.dev')
  .action(async (file, options) => {
    const receipt = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const publicKey = await fetchPublicKey(options.api);
    const result = await verifyReceipt(receipt, publicKey);
    
    console.log('\n=== SONATE Receipt Verification ===\n');
    console.log(`Receipt ID: ${receipt.id || receipt.self_hash}`);
    console.log(`Timestamp:  ${receipt.timestamp}`);
    console.log('');
    console.log('Checks:');
    console.log(`  Signature: ${result.checks.signature ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Chain:     ${result.checks.chain ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Structure: ${result.checks.structure ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Timestamp: ${result.checks.timestamp ? '✓ PASS' : '✗ FAIL'}`);
    console.log('');
    console.log(`Overall: ${result.valid ? '✓ VALID' : '✗ INVALID'}`);
    
    process.exit(result.valid ? 0 : 1);
  });
```

**Update package.json:**
```json
{
  "bin": {
    "sonate": "./dist/index.js"
  }
}
```

**Usage:** `npx sonate verify receipt.json`

---

### P2 - Nice to Have (Polish)

#### 1.6 Demo Mode Improvements
- Add "Demo Mode" banner to all dashboard pages
- Ensure demo data is clearly labeled
- Add "Exit Demo" button that clears demo cookies

#### 1.7 Export Receipts to SIEM Format
**Files to create:**
- `apps/backend/src/routes/export.routes.ts`

```typescript
// GET /api/export/receipts?format=splunk|datadog|elastic
// Returns receipts in SIEM-compatible format
```

#### 1.8 Keyboard Shortcuts for Tactical Command
- Already partially implemented
- Add help modal showing all shortcuts

---

## Part 2: Product 2 Preparation

### 2.1 Multi-Tenant Configuration UI
**Status:** Backend supports multi-tenant, UI for config missing
**Files to modify:**
- `apps/web/src/app/dashboard/settings/page.tsx`

**Add sections for:**
- Trust score thresholds (per tenant)
- Alert severity mappings
- Policy overrides
- API rate limits

---

### 2.2 Provider Cost Tracking
**Status:** Not implemented
**Files to create:**
- `apps/backend/src/models/usage.model.ts`
- `apps/backend/src/services/usage-tracking.service.ts`

**Schema:**
```typescript
interface IUsage {
  tenant_id: string;
  provider: 'openai' | 'anthropic' | 'together' | 'cohere';
  model: string;
  tokens_input: number;
  tokens_output: number;
  estimated_cost_usd: number;
  timestamp: Date;
  conversation_id?: string;
}
```

**Track in llm.service.ts after each generation.**

---

### 2.3 Provider Failover
**Status:** Not implemented
**Files to modify:**
- `apps/backend/src/services/llm.service.ts`

**Implementation:**
```typescript
// If primary provider fails, try fallback
const providerPriority = ['anthropic', 'openai', 'together'];

async generateWithFailover(params) {
  for (const provider of providerPriority) {
    try {
      return await this.generate({ ...params, provider });
    } catch (error) {
      logger.warn(`Provider ${provider} failed, trying next`);
    }
  }
  throw new Error('All providers failed');
}
```

---

### 2.4 Compliance Report Generation
**Status:** Backend exists at `/api/reports/generate`, UI incomplete
**Files to modify:**
- `apps/web/src/app/dashboard/reports/page.tsx`

**Add:**
- Report template selector (EU AI Act, SOC 2, ISO 27001)
- Date range picker
- Generate button → calls `/api/reports/generate`
- Download as PDF/JSON

---

## Part 3: Infrastructure & DevOps

### 3.1 Branch Protection
**Action:** Enable in GitHub Settings
- Require PR reviews before merge
- Require status checks (CI must pass)
- No direct pushes to main

### 3.2 CODEOWNERS File
**Create:** `.github/CODEOWNERS`
```
# Default owner
* @s8ken

# Backend
/apps/backend/ @s8ken
/packages/ @s8ken

# Frontend
/apps/web/ @s8ken
```

### 3.3 PR Template
**Create:** `.github/pull_request_template.md`
```markdown
## Description
<!-- What does this PR do? -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Manual testing done

## Checklist
- [ ] No secrets committed
- [ ] Code follows existing style
- [ ] Self-reviewed
```

### 3.4 AGENTS.md
**Create:** `AGENTS.md`
```markdown
# AGENTS.md - AI Agent Instructions

## Repository Overview
YSEEKU SONATE is an AI governance platform with:
- Backend: Express.js + MongoDB (apps/backend)
- Frontend: Next.js (apps/web)
- Packages: Shared libraries (packages/*)

## Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Conventions
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Feature branches → PR → main

## Key Files
- Trust receipts: `apps/backend/src/services/keys.service.ts`
- Policy engine: `packages/policy/src/runtime/policy-engine.ts`
- Trust kernel: `apps/backend/src/services/brain/constraints.ts`

## Testing
- Backend: `cd apps/backend && npm test`
- Web: `cd apps/web && npm test`
- Packages: `cd packages/core && npm test`
```

---

## Part 4: Security Fixes

### 4.1 Resolve Secret Scanning Alerts
**Status:** 6 MongoDB URIs exposed in markdown files
**Action:**
1. Go to GitHub → Security → Secret scanning
2. For each alert, either:
   - Remove the secret from the file
   - Mark as revoked (if credentials rotated)
   - Mark as false positive (if example/placeholder)

**Files with exposed secrets:**
- `IMPLEMENTATION_SUMMARY.md`
- `MANUAL_STEPS_CHECKLIST.md`
- `RAILWAY_DEPLOYMENT_INSTRUCTIONS.md`
- `.env.example` files

### 4.2 Add Dependabot
**Create:** `.github/dependabot.yml`
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

---

## Part 5: File Reference

### Key Backend Files
| File | Purpose |
|------|---------|
| `apps/backend/src/routes/conversation.routes.ts` | Chat + receipt generation |
| `apps/backend/src/routes/trust.routes.ts` | Trust receipts API |
| `apps/backend/src/services/keys.service.ts` | Ed25519 signing |
| `apps/backend/src/services/brain/constraints.ts` | Trust Kernel constraints |
| `apps/backend/src/services/brain/executor.ts` | Action execution with refusals |
| `apps/backend/src/services/trust.service.ts` | Trust evaluation |
| `apps/backend/src/services/llm-trust-evaluator.service.ts` | LLM-based trust scoring |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `apps/web/src/app/dashboard/chat/page.tsx` | Chat page with history |
| `apps/web/src/app/dashboard/receipts/page.tsx` | Trust receipts dashboard |
| `apps/web/src/app/dashboard/alerts/page.tsx` | Alerts dashboard |
| `apps/web/src/components/chat/ChatContainer.tsx` | Chat component |
| `apps/web/src/components/chat/TrustReceiptCard.tsx` | Receipt display |

### Key Package Files
| File | Purpose |
|------|---------|
| `packages/policy/src/runtime/policy-engine.ts` | Policy evaluation |
| `packages/core/src/principles/sonate-scorer.ts` | 6 principles scoring |
| `packages/schemas/src/receipt.types.ts` | Receipt type definitions |

---

## Part 6: Deployment

### Backend (Fly.io)
```bash
cd /Users/admin/yseeku-platform
fly deploy --app yseeku-backend
```

### Frontend (Vercel)
- Auto-deploys on push to main
- Preview deploys on PRs

### Environment Variables (Fly.io)
```bash
fly secrets set TRUST_SIGNING_PRIVATE_KEY=xxx --app yseeku-backend
fly secrets set TRUST_SIGNING_PUBLIC_KEY=xxx --app yseeku-backend
fly secrets set MONGODB_URI=xxx --app yseeku-backend
```

---

## Part 7: Testing Checklist

### Product 1 MVP Acceptance Tests
- [ ] **Chat:** Send message → get AI response with trust score
- [ ] **Receipts:** Receipt appears in `/dashboard/receipts`
- [ ] **Verify:** Copy receipt → paste in verify page → all checks pass
- [ ] **History:** Navigate away → return → conversation history loads
- [ ] **Alerts:** Trust violation → alert appears in `/dashboard/alerts`
- [ ] **Demo:** Guest login → can use chat without API key
- [ ] **Export:** Download conversation as JSON/Markdown

### API Health Checks
```bash
# Backend health
curl https://yseeku-backend.fly.dev/health

# Public key endpoint
curl https://yseeku-backend.fly.dev/.well-known/sonate-pubkey

# Guest auth
curl -X POST https://yseeku-backend.fly.dev/api/auth/guest
```

---

## Recommended AI Tools for Implementation

### 1. OpenCode (Recommended)
- Free/cheap
- Good for focused file edits
- Works well with this plan

### 2. Cursor
- Better IDE integration
- Good for larger refactors
- Paid but reasonable

### 3. Aider
- CLI-based
- Works with any model (GPT-4, Claude, local)
- Good for git-aware edits

### 4. Continue.dev
- VSCode extension
- Free tier available
- Good for chat + code

### Usage Tips
1. Copy relevant section of this plan
2. Paste the file paths and code snippets
3. Ask for specific implementation
4. Test after each change
5. Commit working changes frequently

---

## Priority Order

1. **P0 - Alerts Persistence** (1 day)
2. **P0 - Receipt Grouping** (1 day)
3. **P1 - Truth Debt Counter** (2 days)
4. **P1 - Policy Version in Receipts** (0.5 day)
5. **P1 - Verification CLI** (1 day)
6. **Infrastructure** - AGENTS.md, CODEOWNERS, PR template (0.5 day)
7. **Security** - Fix secret scanning alerts (0.5 day)

**Total estimated time:** 6-7 days of focused work

---

## Contact & Resources

- **Repo:** https://github.com/s8ken/yseeku-platform
- **Backend:** https://yseeku-backend.fly.dev
- **Frontend:** https://yseeku-platform.vercel.app
- **Website:** https://www.yseeku.com
- **SDK:** https://github.com/s8ken/sonate-verify-sdk
