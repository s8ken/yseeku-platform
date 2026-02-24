# Demo/Live Mode Toggle - Detailed Verification Report

**Date:** February 6, 2026  
**Status:** ⚠️ REQUIRES MANUAL TESTING - Code Analysis Complete  
**Confidence:** Medium (Code review only, not live tested)

---

## 🔍 Executive Summary

After thorough code analysis, I've identified **potential issues** with the demo/live mode implementation that require manual testing to verify. The code shows the architecture is in place, but there are concerns about data consistency and whether live mode truly starts at zero.

### Key Concerns Identified:

1. ✅ **Demo Mode Data Source** - Confirmed using `/api/demo/kpis` with pre-seeded data
2. ⚠️ **Live Mode Data Source** - Uses `/api/dashboard/kpis` but implementation needs verification
3. ⚠️ **Data Consistency** - Multiple pages use different hooks, may show inconsistent data
4. ✅ **Chat Persistence** - Trust receipts ARE created and saved with tenant_id
5. ⚠️ **Dashboard Population** - Unclear if dashboard updates immediately after chat

---

## 📊 Code Analysis Findings

### 1. Demo Mode Implementation ✅ VERIFIED

**How Demo Mode Works:**

```typescript
// DemoContext.tsx
const DEMO_TENANT_ID = 'demo-tenant';
const LIVE_TENANT_ID = 'live-tenant';

// When demo mode is enabled:
enableDemo = async () => {
  localStorage.setItem(DEMO_STORAGE_KEY, 'true');
  queryClient.clear(); // Clears all cached data
  setIsDemo(true);
  await initializeDemo(); // Calls POST /api/demo/init
  startExpiryTimer();
}
```

**Demo Data Seeding:**
- Endpoint: `POST /api/demo/init`
- Seeds: Agents, Conversations, Trust Receipts, Alerts
- Service: `demo-seeder.service.ts`

**Demo KPIs Endpoint:**
- Endpoint: `GET /api/demo/kpis`
- Returns: Pre-calculated metrics with slight randomization
- Trust Score: 8.6-9.0 (randomized)
- Total Interactions: 1490-1520 (randomized)
- Data Source: Real MongoDB queries from `demo-tenant` data

**✅ CONFIRMED:** Demo mode uses consistent pre-seeded data across all pages.

---

### 2. Live Mode Implementation ⚠️ NEEDS VERIFICATION

**How Live Mode Works:**

```typescript
// DemoContext.tsx
disableDemo = async () => {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  queryClient.clear(); // Clears all cached data
  setIsDemo(false);
}
```

**Live KPIs Endpoint:**
- Endpoint: `GET /api/dashboard/kpis`
- Tenant: `live-tenant` (from `X-Tenant-ID` header)
- Data Source: Queries `TrustReceiptModel` with `tenant_id: 'live-tenant'`

**Critical Code Section (dashboard.routes.ts lines 40-180):**

```typescript
if (tenantId === 'live-tenant') {
  // Fetch trust receipts for this tenant
  const [recentReceipts, previousReceipts, allReceipts] = await Promise.all([
    TrustReceiptModel.find({
      tenant_id: 'live-tenant',
      timestamp: { $gte: oneDayAgoTimestamp },
    }).lean(),
    // ... more queries
  ]);
  
  // If no receipts, returns zeros
  const calculateReceiptMetrics = (receipts: any[]) => {
    if (receipts.length === 0) {
      return {
        trustScore: 0,
        count: 0,
        complianceRate: 0,
        // ... all zeros
      };
    }
    // ... calculate from receipts
  };
}
```

**⚠️ CONCERN:** The code SHOULD return zeros for a new live tenant, but needs manual verification.

---

### 3. Chat Message Persistence ✅ VERIFIED

**How Chat Creates Trust Receipts:**

```typescript
// conversation.routes.ts line 674
await TrustReceiptModel.updateOne(
  { self_hash: aiTrustEval.receiptHash },
  {
    $set: {
      self_hash: aiTrustEval.receiptHash,
      session_id: conversation._id.toString(),
      timestamp: aiTrustEval.timestamp,
      ciq_metrics: aiTrustEval.receipt.ciq_metrics,
      tenant_id: tenantId, // ← Uses req.userTenant
      // ... more fields
    },
  },
  { upsert: true }
);
```

**✅ CONFIRMED:** 
- Every chat message creates a trust receipt
- Trust receipt includes `tenant_id` (demo-tenant or live-tenant)
- Receipts are persisted to MongoDB
- Receipts should be queryable by dashboard

---

### 4. Data Consistency Across Pages ⚠️ POTENTIAL ISSUE

**Problem:** Different pages use different data hooks, which may cause inconsistencies.

#### Pages Using `useDashboardKPIs()`:
- `/dashboard` (main page)
- `/dashboard/overview`
- `/dashboard/risk`
- `/dashboard/trust`
- `/dashboard/monitoring/live`

**Hook Implementation:**
```typescript
export function useDashboardKPIs() {
  return useDemoData<DashboardKPIs>({
    queryKey: ['dashboard-kpis'],
    liveEndpoint: '/api/dashboard/kpis',
    demoEndpoint: '/api/demo/kpis',
  });
}
```

#### Pages Using `useTrustAnalytics()`:
- `/dashboard/risk`
- `/dashboard/monitoring/live`
- `/dashboard/overview`
- `/dashboard/trust`

**Hook Implementation (DIFFERENT LOGIC):**
```typescript
export function useTrustAnalytics() {
  return useQuery<TrustAnalytics, Error>({
    queryKey: ['trust-analytics', isDemo ? 'demo' : 'live', currentTenantId],
    queryFn: async () => {
      if (isDemo) {
        // Fetches from /api/demo/kpis
        const res = await fetch(`${API_BASE}/api/demo/kpis`);
        // Converts KPI data to analytics format
      }
      
      // Live mode - fetches from /api/dashboard/kpis
      const res = await fetch(`${API_BASE}/api/dashboard/kpis`, {
        headers: { 
          'X-Tenant-ID': currentTenantId,
        },
      });
      // Converts KPI data to analytics format
    },
  });
}
```

**⚠️ CONCERN:** Both hooks fetch from the same endpoints but transform data differently. This could cause:
- Inconsistent numbers across pages
- Race conditions during mode switching
- Confusion if one hook updates before the other

---

## 🧪 Manual Testing Required

### Test 1: Live Mode Blank Slate ⚠️ CRITICAL

**Steps:**
1. Clear browser localStorage and sessionStorage
2. Clear MongoDB `trust_receipts` collection for `live-tenant`:
   ```javascript
   db.trust_receipts.deleteMany({ tenant_id: "live-tenant" })
   ```
3. Login and ensure in Live Mode (not Demo Mode)
4. Navigate to `/dashboard`

**Expected Results:**
- Trust Score: 0 or "No data"
- Total Interactions: 0
- Compliance Rate: 0%
- Active Alerts: 0
- Empty state component should display

**Actual Results:** [NEEDS MANUAL TESTING]

**Pass/Fail:** ⚠️ UNKNOWN

---

### Test 2: Live Mode Chat Persistence ⚠️ CRITICAL

**Steps:**
1. In Live Mode (blank slate), navigate to `/dashboard/chat`
2. Send message: "Hello, what can you do?"
3. Wait for AI response
4. Check MongoDB:
   ```javascript
   db.trust_receipts.find({ tenant_id: "live-tenant" }).count()
   ```
5. Navigate back to `/dashboard`

**Expected Results:**
- MongoDB should have 1 trust receipt with `tenant_id: "live-tenant"`
- Dashboard should show:
  - Total Interactions: 1
  - Trust Score: [calculated value, not 0]
  - Compliance Rate: [calculated value]

**Actual Results:** [NEEDS MANUAL TESTING]

**Pass/Fail:** ⚠️ UNKNOWN

---

### Test 3: Live Mode Dashboard Updates ⚠️ CRITICAL

**Steps:**
1. After sending 1 message (from Test 2), note metrics
2. Send 2nd message in chat
3. Navigate back to `/dashboard`
4. Check if Total Interactions incremented to 2

**Expected Results:**
- Total Interactions: 2
- Trust Score: Updated average
- Dashboard reflects new data

**Actual Results:** [NEEDS MANUAL TESTING]

**Pass/Fail:** ⚠️ UNKNOWN

---

### Test 4: Demo Mode Data Consistency ⚠️ HIGH PRIORITY

**Steps:**
1. Switch to Demo Mode
2. Navigate to `/dashboard` - note Total Interactions
3. Navigate to `/dashboard/overview` - note Total Interactions
4. Navigate to `/dashboard/trust` - note Total Interactions
5. Navigate to `/dashboard/risk` - note Total Interactions
6. Navigate to `/dashboard/monitoring/live` - note Total Interactions

**Expected Results:**
- All pages show same Total Interactions (~1490-1520)
- All pages show same Trust Score (~8.6-9.0)
- Numbers consistent within randomization range

**Actual Results:** [NEEDS MANUAL TESTING]

**Pass/Fail:** ⚠️ UNKNOWN

---

### Test 5: Mode Switching Data Isolation ⚠️ CRITICAL

**Steps:**
1. In Live Mode, send 5 messages (Total Interactions: 5)
2. Switch to Demo Mode
3. Verify Demo shows ~1500 interactions (not 5)
4. Switch back to Live Mode
5. Verify Live still shows 5 interactions (not 1500)

**Expected Results:**
- Demo data: ~1500 interactions
- Live data: 5 interactions
- No cross-contamination

**Actual Results:** [NEEDS MANUAL TESTING]

**Pass/Fail:** ⚠️ UNKNOWN

---

## 🔧 Identified Code Issues

### Issue 1: Console Logs Still Present ⚠️

**Location:** `apps/web/src/hooks/use-demo-data.ts` lines 175-180

```typescript
export function useTrustAnalytics() {
  const { isDemo, isLoaded, currentTenantId } = useDemo();
  
  console.log('[useTrustAnalytics] Hook called:', { isDemo, isLoaded, currentTenantId });
  
  return useQuery<TrustAnalytics, Error>({
    queryKey: ['trust-analytics', isDemo ? 'demo' : 'live', currentTenantId],
    queryFn: async () => {
      console.log('[useTrustAnalytics] Query function executing:', { isDemo, currentTenantId });
      // ... more console.logs
    },
  });
}
```

**Impact:** Console spam during demo
**Priority:** Low (cosmetic)
**Fix:** Remove all console.log statements

---

### Issue 2: Duplicate Data Fetching ⚠️

**Problem:** Multiple hooks fetch from same endpoint with different transformations.

**Example:**
- `useDashboardKPIs()` fetches `/api/dashboard/kpis` → returns raw KPI data
- `useTrustAnalytics()` fetches `/api/dashboard/kpis` → transforms to analytics format

**Impact:** 
- Unnecessary API calls
- Potential data inconsistency
- Confusion about which hook to use

**Priority:** Medium
**Fix:** Consolidate to single source of truth

---

### Issue 3: Empty State Logic May Not Trigger ⚠️

**Location:** `apps/web/src/app/dashboard/page.tsx` line 196

```typescript
// Check if we have zero interactions (blank slate)
const hasNoData = !kpis || kpis.totalInteractions === 0;

// Show blank slate state for new tenants
{hasNoData && !isDemo && (
  <EmptyDashboardBlankSlate 
    onStartChat={handleStartChat}
    onViewDemo={handleViewDemo}
  />
)}
```

**Concern:** If `kpis` is undefined (loading state), `hasNoData` is true, but empty state may flash before data loads.

**Priority:** Low
**Fix:** Add loading check: `const hasNoData = kpis && kpis.totalInteractions === 0;`

---

## 📋 Verification Checklist

### Demo Mode ✅ Code Verified
- [x] Demo mode uses `/api/demo/kpis` endpoint
- [x] Demo data is pre-seeded via `POST /api/demo/init`
- [x] Demo data includes ~1500 interactions
- [x] Demo trust score is 8.6-9.0
- [x] Demo data has slight randomization for dynamic feel
- [ ] ⚠️ **NEEDS MANUAL TEST:** All pages show consistent demo data

### Live Mode ⚠️ Needs Manual Verification
- [x] Live mode uses `/api/dashboard/kpis` endpoint
- [x] Live mode queries `TrustReceiptModel` with `tenant_id: 'live-tenant'`
- [x] Code returns zeros when no receipts exist
- [ ] ⚠️ **NEEDS MANUAL TEST:** Live mode actually starts at zero
- [ ] ⚠️ **NEEDS MANUAL TEST:** Empty state displays correctly
- [ ] ⚠️ **NEEDS MANUAL TEST:** Dashboard shows "No data" or 0 values

### Chat Persistence ✅ Code Verified
- [x] Chat messages create trust receipts
- [x] Trust receipts include `tenant_id`
- [x] Trust receipts saved to MongoDB
- [ ] ⚠️ **NEEDS MANUAL TEST:** Receipts actually persist
- [ ] ⚠️ **NEEDS MANUAL TEST:** Dashboard queries receipts correctly

### Dashboard Updates ⚠️ Needs Manual Verification
- [x] Dashboard queries trust receipts
- [x] Dashboard calculates metrics from receipts
- [ ] ⚠️ **NEEDS MANUAL TEST:** Dashboard updates after chat message
- [ ] ⚠️ **NEEDS MANUAL TEST:** Total interactions increments
- [ ] ⚠️ **NEEDS MANUAL TEST:** Trust score updates

### Data Consistency ⚠️ Needs Manual Verification
- [x] All pages use `useDemoData` or `useTrustAnalytics`
- [x] Both hooks include tenant_id in query key
- [ ] ⚠️ **NEEDS MANUAL TEST:** All pages show same numbers
- [ ] ⚠️ **NEEDS MANUAL TEST:** No race conditions during mode switch
- [ ] ⚠️ **NEEDS MANUAL TEST:** React Query cache invalidates properly

### Mode Switching ⚠️ Needs Manual Verification
- [x] `queryClient.clear()` called on mode switch
- [x] Query keys include tenant_id
- [ ] ⚠️ **NEEDS MANUAL TEST:** Demo → Live switch works
- [ ] ⚠️ **NEEDS MANUAL TEST:** Live → Demo switch works
- [ ] ⚠️ **NEEDS MANUAL TEST:** No data leakage
- [ ] ⚠️ **NEEDS MANUAL TEST:** No console errors

---

## 🎯 Recommended Testing Procedure

### Phase 1: Live Mode Blank Slate (30 min)
1. Clear all data (localStorage, MongoDB)
2. Start fresh in Live Mode
3. Verify all dashboard pages show zeros
4. Take screenshots of each page
5. Document any non-zero values

### Phase 2: Live Mode Chat Persistence (30 min)
1. Send 1 chat message
2. Check MongoDB for trust receipt
3. Verify dashboard shows 1 interaction
4. Send 4 more messages (total 5)
5. Verify dashboard shows 5 interactions
6. Check all dashboard pages for consistency

### Phase 3: Demo Mode Consistency (20 min)
1. Switch to Demo Mode
2. Visit all dashboard pages
3. Record Total Interactions from each page
4. Verify all pages show ~1500 interactions
5. Verify trust score consistent (~8.6-9.0)

### Phase 4: Mode Switching (20 min)
1. Switch Demo → Live → Demo → Live (4 times)
2. Verify no crashes
3. Verify data matches current mode
4. Check console for errors
5. Verify no data leakage

### Phase 5: Data Isolation (20 min)
1. In Live Mode, send 10 messages
2. Switch to Demo Mode
3. Verify demo still shows ~1500 (not 10)
4. Switch back to Live Mode
5. Verify live still shows 10 (not 1500)

**Total Testing Time:** ~2 hours

---

## 🚨 Critical Questions Requiring Answers

1. **Does live mode actually start at zero?**
   - Code suggests yes, but needs manual verification
   - Empty state component exists but may not trigger

2. **Do chat messages immediately update the dashboard?**
   - Trust receipts are created, but dashboard may not refresh
   - React Query cache may need manual invalidation
   - `useDashboardInvalidation` hook exists but may not be called

3. **Are all dashboard pages consistent?**
   - Multiple hooks fetch same data with different transformations
   - Potential for race conditions
   - Query keys include tenant_id but may not be enough

4. **Does mode switching work flawlessly?**
   - `queryClient.clear()` is called, but is it enough?
   - localStorage is cleared, but what about sessionStorage?
   - Are there any lingering references to old tenant_id?

---

## 📊 Confidence Assessment

| Aspect | Code Analysis | Manual Test | Confidence |
|--------|---------------|-------------|------------|
| Demo Mode Data Source | ✅ Verified | ⚠️ Needed | High |
| Live Mode Blank Slate | ✅ Verified | ⚠️ Needed | Medium |
| Chat Persistence | ✅ Verified | ⚠️ Needed | High |
| Dashboard Updates | ⚠️ Unclear | ⚠️ Needed | Low |
| Data Consistency | ⚠️ Concerns | ⚠️ Needed | Low |
| Mode Switching | ✅ Verified | ⚠️ Needed | Medium |
| Data Isolation | ✅ Verified | ⚠️ Needed | High |

**Overall Confidence:** Medium (60%)

---

## ✅ What I Can Confirm from Code

1. ✅ Demo mode uses pre-seeded data from `/api/demo/kpis`
2. ✅ Live mode queries real trust receipts from MongoDB
3. ✅ Chat messages create trust receipts with tenant_id
4. ✅ Dashboard endpoint returns zeros when no receipts exist
5. ✅ Mode switching clears React Query cache
6. ✅ Query keys include tenant_id for proper isolation

## ⚠️ What Requires Manual Testing

1. ⚠️ Live mode actually displays zeros on first load
2. ⚠️ Dashboard updates immediately after chat message
3. ⚠️ All pages show consistent numbers
4. ⚠️ Mode switching works without errors
5. ⚠️ No data leakage between modes
6. ⚠️ Empty states display correctly

---

## 🎯 Final Recommendation

**I CANNOT certify the demo/live toggle is working correctly without manual testing.**

The code architecture looks solid, but there are enough concerns that I recommend:

1. **Immediate:** Run Phase 1 & 2 tests (Live Mode verification) - 1 hour
2. **Before Demo:** Run all 5 phases - 2 hours
3. **Fix Issues:** Address any problems found
4. **Re-test:** Verify fixes work

**Risk Level:** Medium  
**Impact if Broken:** High (demo will look unprofessional)  
**Time to Verify:** 2 hours  
**Time to Fix (if broken):** 2-4 hours

---

**Assessment Date:** February 6, 2026  
**Assessor:** AI Code Analysis  
**Status:** ⚠️ MANUAL TESTING REQUIRED  
**Next Step:** Execute testing procedure outlined above