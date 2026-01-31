# Live Mode Investigation Guide

## Overview
This document explains the diagnostic logging added to investigate two critical issues:
1. **Live mode showing demo data** - After switching to live mode, demo data appears after a brief blank slate
2. **Chat → Dashboard data flow** - Verifying that chat interactions properly update dashboard metrics

---

## Diagnostic Logging Added

### Frontend Logging

#### 1. DemoContext.tsx
**Location:** `apps/web/src/contexts/DemoContext.tsx`

**Logs Added:**
- `[DemoContext] Current tenant before switch: {tenant}`
- `[DemoContext] Clearing React Query cache...`
- `[DemoContext] Setting isDemo to {true/false}...`
- `[DemoContext] New tenant after switch: {tenant}`

**What to Look For:**
- Verify tenant changes from `demo-tenant` to `live-tenant` (or vice versa)
- Confirm cache is cleared before state changes
- Check timing between cache clear and state update

#### 2. use-demo-data.ts
**Location:** `apps/web/src/hooks/use-demo-data.ts`

**Logs Added:**
- `[useDemoData] Query config: {queryKey, endpoint, currentTenantId, isDemo, isLoaded}`
- `[useDemoData] Fetching data: {endpoint, currentTenantId}`
- `[useTrustAnalytics] Hook called: {isDemo, isLoaded, currentTenantId}`
- `[useTrustAnalytics] Query function executing: {isDemo, currentTenantId}`
- `[useTrustAnalytics] Fetching DEMO data from /api/demo/kpis`
- `[useTrustAnalytics] DEMO data received: {totalInteractions}`
- `[useTrustAnalytics] Fetching LIVE data from /api/dashboard/kpis with tenant: {tenant}`
- `[useTrustAnalytics] LIVE data received: {totalInteractions}`

**What to Look For:**
- Verify queries execute with correct `currentTenantId`
- Check if queries are called multiple times with different tenant IDs
- Confirm correct endpoint is used (demo vs live)
- Verify data received matches expected mode

#### 3. ChatContainer.tsx
**Location:** `apps/web/src/components/chat/ChatContainer.tsx`

**Logs Added:**
- `[ChatContainer] Invalidating dashboard after consent withdrawal`
- `[ChatContainer] Invalidating dashboard after AI response {conversationId, trustScore, status}`

**What to Look For:**
- Verify invalidation is called after each message
- Check conversation ID and trust score values
- Confirm timing of invalidation relative to message display

#### 4. useDashboardInvalidation.ts
**Location:** `apps/web/src/hooks/use-dashboard-invalidation.ts`

**Logs Added:**
- `[useDashboardInvalidation] Starting query invalidation...`
- `[useDashboardInvalidation] Invalidated: dashboard-kpis`
- `[useDashboardInvalidation] Invalidated: trust-analytics`
- `[useDashboardInvalidation] All queries invalidated - dashboard should refetch`

**What to Look For:**
- Verify all query keys are invalidated
- Check if invalidation triggers refetch
- Confirm timing between invalidation and refetch

---

### Backend Logging

#### 1. dashboard.routes.ts
**Location:** `apps/backend/src/routes/dashboard.routes.ts`

**Logs Added:**
- `[LIVE MODE] Fetching trust receipts for live-tenant {userId, tenantId}`
- `[LIVE MODE] Trust receipts fetched {recentCount, previousCount, totalCount}`

**What to Look For:**
- Verify queries are executed for `live-tenant`
- Check receipt counts (should be 0 initially, then increase)
- Confirm user ID and tenant ID are correct

#### 2. conversation.routes.ts
**Location:** `apps/backend/src/routes/conversation.routes.ts`

**Logs Added:**
- `[TRUST RECEIPT] Creating trust receipt {conversationId, tenantId, receiptHash, trustScore, status}`
- `[TRUST RECEIPT] Trust receipt persisted successfully {conversationId, tenantId, receiptHash}`
- `[TRUST RECEIPT] Failed to persist AI trust receipt {error, conversationId, tenantId}` (error case)

**What to Look For:**
- Verify receipts are created for each message
- Check tenant ID is `live-tenant` for live mode
- Confirm receipt hash and trust score values
- Watch for any persistence errors

---

## Testing Procedure

### Test 1: Live Mode Blank Slate Issue

**Steps:**
1. Open browser DevTools console
2. Start in Demo mode
3. Switch to Live mode using the toggle
4. Observe console logs

**Expected Behavior:**
```
[DemoContext] Disabling demo mode (switching to live)
[DemoContext] Current tenant before switch: demo-tenant
[DemoContext] Clearing React Query cache...
[DemoContext] Setting isDemo to false...
[DemoContext] New tenant after switch: live-tenant
[useTrustAnalytics] Hook called: {isDemo: false, isLoaded: true, currentTenantId: "live-tenant"}
[useTrustAnalytics] Query function executing: {isDemo: false, currentTenantId: "live-tenant"}
[useTrustAnalytics] Fetching LIVE data from /api/dashboard/kpis with tenant: live-tenant
[useTrustAnalytics] LIVE data received: {totalInteractions: 0}
```

**What to Check:**
- Does `currentTenantId` change to `live-tenant` immediately?
- Are queries executed with `live-tenant` or `demo-tenant`?
- Is there a delay between cache clear and query execution?
- Do any queries execute with the wrong tenant ID?

**Suspected Issues:**
- If you see queries with `demo-tenant` after switching to live, there's a race condition
- If you see demo data (totalInteractions: 1503) instead of 0, queries are hitting wrong endpoint
- If cache clear happens after queries start, timing issue exists

---

### Test 2: Chat → Dashboard Data Flow

**Steps:**
1. Switch to Live mode
2. Open browser DevTools console
3. Open backend logs (if running locally)
4. Navigate to Trust Session page
5. Send a message
6. Navigate to Dashboard
7. Observe console logs and dashboard metrics

**Expected Frontend Logs:**
```
[ChatContainer] Invalidating dashboard after AI response {conversationId: "...", trustScore: 85, status: "PASS"}
[useDashboardInvalidation] Starting query invalidation...
[useDashboardInvalidation] Invalidated: dashboard-kpis
[useDashboardInvalidation] Invalidated: trust-analytics
[useDashboardInvalidation] All queries invalidated - dashboard should refetch
[useTrustAnalytics] Query function executing: {isDemo: false, currentTenantId: "live-tenant"}
[useTrustAnalytics] Fetching LIVE data from /api/dashboard/kpis with tenant: live-tenant
[useTrustAnalytics] LIVE data received: {totalInteractions: 1}
```

**Expected Backend Logs:**
```
[TRUST RECEIPT] Creating trust receipt {conversationId: "...", tenantId: "live-tenant", receiptHash: "...", trustScore: 85, status: "PASS"}
[TRUST RECEIPT] Trust receipt persisted successfully {conversationId: "...", tenantId: "live-tenant", receiptHash: "..."}
[LIVE MODE] Fetching trust receipts for live-tenant {userId: "...", tenantId: "live-tenant"}
[LIVE MODE] Trust receipts fetched {recentCount: 1, previousCount: 0, totalCount: 1}
```

**What to Check:**
- Is trust receipt created in backend?
- Is `tenant_id` set to `live-tenant`?
- Is invalidation called after message?
- Do queries refetch after invalidation?
- Does dashboard show updated metrics (totalInteractions: 1)?

**Suspected Issues:**
- If no backend logs appear, receipts aren't being created
- If `tenant_id` is wrong, receipts won't be queried correctly
- If invalidation doesn't trigger refetch, React Query config issue
- If dashboard doesn't update, query key mismatch

---

### Test 3: Session Persistence

**Steps:**
1. Send 2 messages in Trust Session (live mode)
2. Navigate to Dashboard (should show 2 interactions)
3. Navigate back to Trust Session
4. Navigate to Dashboard again
5. Refresh the page

**Expected Behavior:**
- Dashboard always shows 2 interactions
- Receipts persist in database
- Conversation persists across navigation

**What to Check:**
- Do receipts remain in database after navigation?
- Does dashboard query receipts correctly after refresh?
- Is conversation ID consistent across navigation?

---

## Common Issues & Solutions

### Issue: Live mode shows demo data (1503 interactions)

**Diagnosis:**
- Check if `currentTenantId` is `live-tenant` in query logs
- Check if endpoint is `/api/dashboard/kpis` not `/api/demo/kpis`
- Check if `X-Tenant-ID` header is set correctly

**Possible Causes:**
1. Race condition: queries execute before `isDemo` state updates
2. Query key doesn't include tenant ID
3. Cache isn't cleared properly

**Solutions:**
1. Add tenant ID to query key (already done)
2. Ensure `isLoaded` prevents queries until tenant is set
3. Add explicit query invalidation with tenant-specific keys

---

### Issue: Dashboard doesn't update after chat

**Diagnosis:**
- Check if trust receipt is created in backend logs
- Check if invalidation is called in frontend logs
- Check if queries refetch after invalidation

**Possible Causes:**
1. Trust receipt not persisted to database
2. Invalidation not called
3. Query key mismatch prevents refetch
4. Tenant ID mismatch in queries

**Solutions:**
1. Verify `TrustReceiptModel.updateOne()` succeeds
2. Verify `invalidateDashboard()` is called
3. Ensure query keys match between invalidation and queries
4. Ensure `X-Tenant-ID` header is consistent

---

### Issue: Data doesn't persist across navigation

**Diagnosis:**
- Check if receipts exist in database
- Check if conversation ID is consistent
- Check if queries use correct tenant ID

**Possible Causes:**
1. Receipts not saved to database
2. Conversation ID changes on navigation
3. Queries use wrong tenant ID after navigation

**Solutions:**
1. Verify database persistence
2. Store conversation ID in localStorage/sessionStorage
3. Ensure tenant ID is set correctly on mount

---

## Next Steps

1. **Deploy with logging** - Push changes and deploy to test environment
2. **Run tests** - Follow testing procedures above
3. **Analyze logs** - Identify root cause from console/backend logs
4. **Implement fix** - Based on findings, implement appropriate solution
5. **Verify fix** - Re-test to confirm issue is resolved
6. **Remove debug logs** - Clean up console.log statements (or keep for production debugging)

---

## Files Modified

### Frontend
- `apps/web/src/contexts/DemoContext.tsx`
- `apps/web/src/hooks/use-demo-data.ts`
- `apps/web/src/components/chat/ChatContainer.tsx`
- `apps/web/src/hooks/use-dashboard-invalidation.ts`

### Backend
- `apps/backend/src/routes/dashboard.routes.ts`
- `apps/backend/src/routes/conversation.routes.ts`

### Documentation
- `todo.md` - Investigation plan and progress tracking
- `docs/LIVE_MODE_INVESTIGATION.md` - This document