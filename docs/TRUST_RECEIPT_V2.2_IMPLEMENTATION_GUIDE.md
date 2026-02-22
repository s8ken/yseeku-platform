# SONATE Trust Receipt v2.2 Implementation Guide

**Date**: 2026-02-22  
**Target Audience**: Backend engineers, frontend developers, DevOps engineers  
**Time to Implement**: ~4 hours (Phases 1-4 complete, only integration and deployment remain)

## Quick Start: What Changed in v2.2?

This guide covers the **4 implementation phases** that transform receipt generation from v1.0 (v1 spec scores) to v2.2 (industry-weighted principles + weights):

| Phase | Component | Change | Status |
|-------|-----------|--------|--------|
| **1A** | Weight Loading | Load industry-specific weights instead of hardcoded | ✅ DONE |
| **1B** | Principle Scores | Evaluate 6 principles, store 0-10 scores in telemetry | ✅ DONE |
| **2** | Receipt Generation | Include telemetry (with weights) in signature | ✅ DONE |
| **3** | Database | Create indexes for `weight_source`, `weight_policy_id` | ✅ DONE |
| **4** | Frontend | Display weight source badge + weight distribution | ✅ DONE |

**All phases complete!** This document covers deployment and integration.

## Part 1: Backend Integration

### 1.1 Verify LLMTrustEvaluator (Phase 1A & 1B)

File: `apps/backend/src/services/llm-trust-evaluator.service.ts`

**Checklist:**
- [ ] `getWeightsForEvaluation(industryType?)` method exists
- [ ] `industryWeights` object defined with 6 industries (healthcare, finance, government, technology, education, legal)
- [ ] `evaluate()` loads weights before calculating
- [ ] Return value includes `weight_source` and `weight_policy_id`
- [ ] Principle scores returned as 0-10 integers
- [ ] Overall score calculated using industry weights

**Verification command:**
```bash
npm test -- apps/backend/src/services/__tests__/llm-trust-evaluator.test.ts
# Expect: 19/19 tests passing
```

### 1.2 Verify ReceiptGeneratorService (Phase 2)

File: `apps/backend/src/services/receipts/receipt-generator.ts`

**Checklist:**
- [ ] Receipt version is "2.2"
- [ ] Telemetry object includes: `sonate_principles`, `overall_trust_score`, `trust_status`, `principle_weights`, `weight_source`, `weight_policy_id`
- [ ] Canonical JSON includes all telemetry fields
- [ ] Ed25519 signature covers telemetry fields
- [ ] Receipt hash computed over canonical body

**Verification command:**
```bash
npm test -- apps/backend/src/services/receipts/__tests__/receipt-generator.test.ts
# Expect: 10/10 tests passing
```

### 1.3 Verify Database Migration (Phase 3)

File: `apps/backend/src/migrations/phase-3-symbi-scoring.ts`

**Checklist:**
- [ ] Migration creates index on `telemetry.weight_source`
- [ ] Migration creates index on `telemetry.weight_policy_id`
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Collection metadata updated with schema version
- [ ] Backward compatible (doesn't modify existing receipts)

**Verify current status:**
```bash
npm test -- apps/backend/src/migrations/test-phase-3.js 2>&1
# Expect: 25/25 tests passing
```

### 1.4 Update Environment Configuration

Add industry type to conversation context. File: `apps/backend/src/routes/conversation.routes.ts`

When calling `llmTrustEvaluator.evaluate()`, pass industry:

```typescript
const context = {
  conversationId: conversation._id,
  messageId: message._id,
  industryType: req.query.industry || 'standard',  // ← Add this
  model: 'claude-3-haiku-20240307'
};

const evaluation = await llmTrustEvaluator.evaluate(messages, context);

// Now evaluation includes: weight_source, weight_policy_id, principle_weights
```

### 1.5 Verify Backend E2E

**Test receipt generation with weight metadata:**

```bash
# Start backend server
npm run dev --workspace=apps/backend &

# In another terminal:
curl -X POST http://localhost:3000/api/trust/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "healthcare",
    "messages": [
      {"role": "user", "content": "What is cardiology?"}
    ]
  }'

# Verify response includes:
# - telemetry.sonate_principles with 6 scores (0-10)
# - telemetry.overall_trust_score (0-100)
# - telemetry.weight_source ("healthcare")
# - telemetry.weight_policy_id ("policy-healthcare-v2.1")
# - signature covering all fields
```

## Part 2: Frontend Integration

### 2.1 Verify TrustReceiptCard (Phase 4)

File: `apps/web/src/components/trust-receipt/TrustReceiptCard.tsx`

**Checklist:**
- [ ] TrustEvaluation interface includes weight metadata fields
- [ ] Header renders `weight_source` badge
- [ ] "Weight Policy Applied" section displays weights
- [ ] Component backwards compatible with legacy props
- [ ] TypeScript compilation succeeds

**Verification:**
```bash
cd apps/web && npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "TrustReceiptCard"
# Expect: No errors for this file

# Run test suite:
node src/components/trust-receipt/test-phase-4.js
# Expect: 27/27 tests passing
```

### 2.2 Update Prop Passing

Any component that passes receipts to TrustReceiptCard now sends weight metadata:

**Before (v1.0):**
```tsx
<TrustReceiptCard evaluation={{
  trustScore: { overall: 75, principles: {...} },
  status: 'PASS',
  receipt: receiptJSON
}} />
```

**After (v2.2):**
```tsx
<TrustReceiptCard evaluation={{
  trustScore: { overall: 75, principles: {...} },
  status: 'PASS',
  receipt: receiptJSON,
  weight_source: receipt.telemetry.weight_source,           // ← NEW
  weight_policy_id: receipt.telemetry.weight_policy_id,     // ← NEW
  principle_weights: receipt.telemetry.principle_weights,   // ← NEW
  overall_trust_score: receipt.telemetry.overall_trust_score // ← NEW
}} />
```

### 2.3 Display Weight Source in Dashboard

Update dashboard receipt cards to show industry policy:

```tsx
// apps/web/src/app/dashboard/receipts/page.tsx
export default function ReceiptsPage() {
  return (
    <div className="space-y-4">
      {receipts.map(receipt => (
        <div key={receipt.id} className="flex items-center justify-between border rounded p-4">
          <div>
            <h3>{receipt.id.slice(0, 8)}...</h3>
            <p className="text-sm text-slate-600">
              {receipt.telemetry.trust_status} • 
              {receipt.telemetry.overall_trust_score}/100
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Weight source badge */}
            <span className="px-2 py-1 rounded bg-slate-200 text-sm font-medium">
              {receipt.telemetry.weight_source}
            </span>
            <TrustReceiptCard evaluation={mapReceiptToEvaluation(receipt)} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2.4 Test Frontend Integration

```bash
# Check component rendering
cd apps/web && npm test -- TrustReceiptCard

# Visual inspection:
npm run dev
# Navigate to /dashboard/receipts
# Verify:
# - Weight source badge appears in header
# - Weight Policy Applied section shows all 6 weights
# - Overall trust score displayed (0-100)
# - Trust status showing correctly
```

## Part 3: Database & Queries

### 3.1 Run Phase 3 Migration

Only needed if not already done:

```bash
cd apps/backend
npm run migrate:phase-3

# Expected output:
# ✓ Created indexes
# ✓ Stored metadata
# ✓ Migration complete
```

### 3.2 Query Examples

**Find receipts by industry policy:**
```typescript
// MongoDB query
db.receipts.find({
  "telemetry.weight_source": "healthcare"
})

// Mongoose query
const receipts = await Receipt.find({
  "telemetry.weight_source": "healthcare"
});
```

**Find receipts by trust status for an industry:**
```typescript
// All healthcare receipts that passed
db.receipts.find({
  "telemetry.weight_source": "healthcare",
  "telemetry.trust_status": "PASS"
})
```

**Find specific policy version:**
```typescript
db.receipts.find({
  "telemetry.weight_policy_id": "policy-healthcare-v2.1"
})
```

**Analyze weight distribution:**
```typescript
db.receipts.aggregate([
  { $match: { "telemetry.weight_source": "finance" } },
  { $group: {
    _id: "$telemetry.trust_status",
    count: { $sum: 1 },
    avgScore: { $avg: "$telemetry.overall_trust_score" }
  }}
])
// Output:
// { _id: "PASS", count: 245, avgScore: 82.5 }
// { _id: "PARTIAL", count: 18, avgScore: 56.2 }
// { _id: "FAIL", count: 3, avgScore: 0 }
```

### 3.3 Compliance Audit Query

**Extract audit trail for regulatory review:**
```typescript
const auditReceipts = await Receipt.find({
  createdAt: { $gte: startDate, $lte: endDate }
}).select({
  "telemetry.weight_source": 1,
  "telemetry.weight_policy_id": 1,
  "telemetry.overall_trust_score": 1,
  "telemetry.trust_status": 1,
  "signature": 1,
  "public_key": 1
});

// Export for compliance:
const auditData = auditReceipts.map(r => ({
  receiptId: r._id,
  industryPolicy: r.telemetry.weight_source,
  policyVersion: r.telemetry.weight_policy_id,
  trustScore: r.telemetry.overall_trust_score,
  status: r.telemetry.trust_status,
  verified: verifyReceipt(r).valid  // Cryptographic verification
}));
```

## Part 4: Verification & Testing

### 4.1 Complete End-to-End Test

```bash
# 1. Verify backend compiles
npm run build --workspace=apps/backend
# Expect: No TypeScript errors

# 2. Verify migrations work
node apps/backend/src/migrations/test-phase-3.js
# Expect: 25/25 tests passing

# 3. Verify frontend compiles
npm run build --workspace=apps/web
# Expect: No TypeScript errors

# 4. Test a full workflow
npm run dev --workspace=apps/backend &
npm run dev --workspace=apps/web &

# In another terminal, test API:
curl -X POST http://localhost:3000/api/trust/evaluate \
  -d '{"industry":"healthcare","messages":[{"role":"user","content":"test"}]}'

# Verify returns:
# - version: "2.2"
# - telemetry with all v2.2 fields
# - signature covering telemetry
```

### 4.2 Data Validation Checklist

For each receipt in production, verify:

```typescript
function validateV2_2Receipt(receipt) {
  const errors = [];

  // 1. Version
  if (receipt.version !== "2.2") {
    errors.push("Not v2.2 receipt");
  }

  // 2. Telemetry structure
  if (!receipt.telemetry) errors.push("Missing telemetry");
  if (!receipt.telemetry.sonate_principles) errors.push("Missing sonate_principles");
  if (!receipt.telemetry.overall_trust_score) errors.push("Missing overall_trust_score");
  if (!receipt.telemetry.trust_status) errors.push("Missing trust_status");
  if (!receipt.telemetry.principle_weights) errors.push("Missing principle_weights");
  if (!receipt.telemetry.weight_source) errors.push("Missing weight_source");
  if (!receipt.telemetry.weight_policy_id) errors.push("Missing weight_policy_id");

  // 3. Score ranges
  for (const [principle, score] of Object.entries(receipt.telemetry.sonate_principles)) {
    if (typeof score !== 'number' || score < 0 || score > 10) {
      errors.push(`Invalid score for ${principle}: ${score}`);
    }
  }
  if (receipt.telemetry.overall_trust_score < 0 || receipt.telemetry.overall_trust_score > 100) {
    errors.push(`Invalid overall_trust_score: ${receipt.telemetry.overall_trust_score}`);
  }

  // 4. Trust status
  if (!['PASS', 'PARTIAL', 'FAIL'].includes(receipt.telemetry.trust_status)) {
    errors.push(`Invalid trust_status: ${receipt.telemetry.trust_status}`);
  }

  // 5. Weights sum to ~1.0
  const weightSum = Object.values(receipt.telemetry.principle_weights).reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    errors.push(`Weights don't sum to 1.0: ${weightSum}`);
  }

  // 6. Valid weight source
  const validSources = ['standard', 'healthcare', 'finance', 'government', 'technology', 'education', 'legal'];
  if (!validSources.includes(receipt.telemetry.weight_source)) {
    errors.push(`Invalid weight_source: ${receipt.telemetry.weight_source}`);
  }

  // 7. Cryptographic verification
  try {
    const result = verifyReceipt(receipt);
    if (!result.valid) {
      errors.push(`Signature verification failed: ${result.errors.join('; ')}`);
    }
  } catch (e) {
    errors.push(`Verification error: ${e.message}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 4.3 Regression Testing

Ensure v1.0 receipts still work (backward compatibility):

```bash
# Load a v1.0 receipt from production
const v1Receipt = {
  version: "1.0",
  scores: {
    clarity: 0.92,
    consent_score: 0.95
  }
};

// Should parse without error
const parsed = parseReceipt(v1Receipt);
expect(parsed).toBeDefined();
expect(parsed.version).toBe("1.0");
```

## Part 5: Deployment Checklist

### 5.1 Pre-Deployment

- [ ] All Phase 1-4 tests passing (4/4 phases)
- [ ] Backend compiles with no errors
- [ ] Frontend compiles with no errors
- [ ] Database migration tested in staging
- [ ] v2.2 spec reviewed and approved
- [ ] Backward compatibility verified with v1.0 receipts

### 5.2 Staging Deployment

```bash
# Deploy to staging environment
npm run deploy:staging --workspace=apps/backend
npm run deploy:staging --workspace=apps/web

# Verify staging:
curl -X GET https://staging.example.com/api/health
# Should return: { status: "ok", version: "2.2" }

# Generate test receipts
curl -X POST https://staging.example.com/api/trust/evaluate \
  -d '{"industry":"healthcare","messages":[...]}'

# Verify in staging monitoring dashboard
# - Check new weight_source field appears
# - Check weight_policy_id indexed correctly
# - Check 0 signature verification errors
```

### 5.3 Production Deployment

```bash
# 1. Backup production MongoDB
mongodump --db sonate_production --archive=sonate_backup_$(date +%s).archive

# 2. Deploy backend (includes migration)
npm run deploy:production --workspace=apps/backend
# This triggers phase-3-migration automatically

# 3. Deploy frontend
npm run deploy:production --workspace=apps/web

# 4. Monitor production
# - Check error logs for v2.2 parsing issues
# - Verify weight_source appears on all new receipts
# - Check signature verification errors ~0%
# - Monitor database query performance (new indexes)

# 5. Smoke test
curl -X POST https://api.example.com/api/trust/evaluate \
  -d '{"industry":"finance","messages":[...]}'
# Verify receipt includes v2.2 fields
```

### 5.4 Rollback Plan

If issues occur:

```bash
# 1. Stop services
systemctl stop sonate-backend sonate-web

# 2. Restore database backup (only data, not schema)
mongorestore --db sonate_production sonate_backup_*.archive

# 3. Revert backend to v1.0 branch
git checkout v1.0-stable
npm install
npm run build
npm start

# 4. Revert frontend to v1.0 branch
git checkout v1.0-stable
npm install
npm run build
npm start

# 5. Verify old behavior restored
curl http://localhost:3000/api/health
# Should show v1.0 receipt format
```

## Part 6: Timeline & Effort

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1A | Load industry weights | 2 hours | ✅ Complete |
| 1B | Principle scores in telemetry | 2 hours | ✅ Complete |
| 2 | Receipt generation with signatures | 1.5 hours | ✅ Complete |
| 3 | Database migration | 1.5 hours | ✅ Complete |
| 4 | Frontend display updates | 1 hour | ✅ Complete |
| 5 | Documentation (this guide + spec) | 1 hour | ✅ In Progress |
| 6 | Integration testing | 2 hours | ⏳ Next |
| 7 | Production deployment | 0.5 hours | ⏳ Final |
| **Total** | **Full v2.2 release** | **~11 hours** | **57% Complete** |

## Part 7: Troubleshooting

### Issue: "telemetry is undefined"

**Cause**: Receipt not generated with Phase 1B changes  
**Fix**:
```bash
# Verify LLMTrustEvaluator has weight loading
grep -n "getWeightsForEvaluation" apps/backend/src/services/llm-trust-evaluator.service.ts

# Ensure updated service is deployed
npm run build --workspace=apps/backend
npm start  # Restart service
```

### Issue: "weight_policy_id not in MongoDB index"

**Cause**: Phase 3 migration not run  
**Fix**:
```bash
# Run migration
npm run migrate:phase-3 --force

# Verify indexes created
mongo sonate_production
> db.receipts.getIndexes()
# Should show: { "telemetry.weight_source": 1 }, { "telemetry.weight_policy_id": 1 }
```

### Issue: "Signature verification failing"

**Cause**: Canonical JSON order changed between versions  
**Fix**:
```bash
# Ensure canonicalization uses RFC 8785
# Check imports in receipt-generator.ts
grep "canonicalizeJSON" apps/backend/src/services/receipts/receipt-generator.ts

# Verify using same canonicalization library
npm list json-canonicalize
# Should be same version across all uses
```

### Issue: "Frontend not displaying weight source"

**Cause**: TrustEvaluation props missing weight metadata  
**Fix**:
```tsx
// Pass all weight fields to TrustReceiptCard
const evaluation = {
  ...receipt,
  weight_source: receipt.telemetry?.weight_source,
  weight_policy_id: receipt.telemetry?.weight_policy_id,
  principle_weights: receipt.telemetry?.principle_weights
};

<TrustReceiptCard evaluation={evaluation} />
```

## Part 8: Support & References

- **Specification**: [TRUST_RECEIPT_SPECIFICATION_v2.2.md](./TRUST_RECEIPT_SPECIFICATION_v2.2.md)
- **Migration Guide**: [PHASE_3_MIGRATION_GUIDE.md](../PHASE_3_MIGRATION_GUIDE.md)
- **Backend Implementation**: [llm-trust-evaluator.service.ts](../apps/backend/src/services/llm-trust-evaluator.service.ts)
- **Frontend Components**: [TrustReceiptCard.tsx](../apps/web/src/components/trust-receipt/TrustReceiptCard.tsx)
- **Type Definitions**: [receipt.types.ts](../packages/schemas/src/receipt.types.ts)

**Questions?** Open an issue on GitHub or contact the SONATE team.

---

**Last Updated**: 2026-02-22  
**Document Version**: 1.0  
**Status**: Ready for Production Deployment
