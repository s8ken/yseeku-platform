# Live Mode Data Flow Investigation & Fixes

## Issue 1: Live Mode Shows Demo Data After Brief Blank Slate

### Root Cause Analysis
- [x] Examined DemoContext.tsx - queryClient.clear() is called when switching modes
- [x] Examined use-demo-data.ts - useTrustAnalytics and useDashboardKPIs use correct endpoints
- [x] Examined dashboard.routes.ts - /api/dashboard/kpis correctly queries TrustReceiptModel for live-tenant
- [ ] **SUSPECTED ISSUE**: React Query may be refetching with stale tenant ID before context updates
- [ ] **SUSPECTED ISSUE**: Query keys may not be invalidating properly during tenant switch
- [ ] **SUSPECTED ISSUE**: There may be a race condition between queryClient.clear() and new queries

### Investigation Tasks
- [x] Add console.log to track tenant ID during mode switch
- [x] Add console.log to track query key changes
- [ ] Check if queries are being called with correct tenant ID header
- [ ] Verify timing of queryClient.clear() vs new query execution
- [ ] Check if there's a caching issue with X-Tenant-ID header

### Fix Strategy
- [ ] Ensure tenant ID is updated BEFORE queries are re-enabled
- [ ] Add explicit query invalidation for specific query keys
- [ ] Consider adding a small delay after queryClient.clear()
- [ ] Ensure X-Tenant-ID header is set correctly in all requests

---

## Issue 2: Chat → Dashboard Data Flow Verification

### Current Implementation Review
- [x] Trust receipts ARE created in conversation.routes.ts (line 664)
- [x] TrustReceiptModel.updateOne() persists receipts with tenant_id
- [x] dashboard.routes.ts queries TrustReceiptModel for live-tenant
- [x] useDashboardInvalidation hook exists and is integrated in ChatContainer.tsx
- [ ] **VERIFY**: Are trust receipts actually being saved to database?
- [ ] **VERIFY**: Is invalidateDashboard() being called after each message?
- [ ] **VERIFY**: Are queries refetching after invalidation?

### Data Persistence Verification
- [x] Add backend logging to confirm trust receipt creation
- [x] Add backend logging to show receipt count for live-tenant
- [x] Add frontend logging to track invalidation calls
- [x] Add frontend logging to track query refetch triggers

### Dashboard Update Flow
1. User sends message in Trust Session chat
2. Backend evaluates trust and creates TrustReceiptModel entry (line 664)
3. ChatContainer calls invalidateDashboard() (line 267)
4. React Query invalidates: dashboard-kpis, trust-analytics, live-metrics, alerts, receipts
5. Dashboard components refetch with X-Tenant-ID: live-tenant
6. dashboard.routes.ts queries TrustReceiptModel.find({ tenant_id: 'live-tenant' })
7. Dashboard displays updated metrics

### Verification Tasks
- [ ] Test: Send 1 message, verify 1 receipt in database
- [ ] Test: Send 2 messages, verify 2 receipts in database
- [ ] Test: Verify dashboard shows totalInteractions = 1 after first message
- [ ] Test: Verify dashboard shows totalInteractions = 2 after second message
- [ ] Test: Navigate away from chat, return, verify data persists
- [ ] Test: Refresh page, verify data persists (receipts in database)

---

## Issue 3: Session Persistence Across Navigation

### Current Behavior
- [ ] **VERIFY**: When user clicks away from Trust Session, does conversation persist?
- [ ] **VERIFY**: When user returns to Trust Session, does conversation reload?
- [ ] **VERIFY**: Are trust receipts tied to conversation ID?
- [ ] **VERIFY**: Does dashboard continue to show metrics after navigation?

### Expected Behavior
1. User starts Trust Session → creates Conversation document
2. User sends messages → creates TrustReceipt documents with session_id = conversation._id
3. User navigates to Dashboard → sees metrics from all receipts for live-tenant
4. User returns to Trust Session → conversation reloads with all messages
5. User sends more messages → creates more receipts, dashboard updates

### Investigation Tasks
- [ ] Check Conversation model for session persistence
- [ ] Check if conversation ID is stored in localStorage/sessionStorage
- [ ] Verify TrustReceipt.session_id links to Conversation._id
- [ ] Test navigation flow: Chat → Dashboard → Chat → Dashboard

---

## Implementation Plan

### Phase 1: Add Diagnostic Logging ✅
- [x] Add console.log to DemoContext.toggleDemo() to track tenant changes
- [x] Add console.log to use-demo-data.ts to track query execution
- [x] Add backend logging to conversation.routes.ts to confirm receipt creation
- [x] Add backend logging to dashboard.routes.ts to show receipt queries
- [x] Add console.log to ChatContainer.tsx to track invalidation calls
- [x] Add console.log to useDashboardInvalidation.ts to track query invalidation

### Phase 2: Fix Tenant Switch Race Condition
- [ ] Review browser console logs during mode switch
- [ ] Identify if queries are executing with wrong tenant ID
- [ ] Ensure isLoaded state prevents queries until tenant is set
- [ ] Add explicit query invalidation with tenant-specific keys
- [ ] Consider using React Query's onSuccess callback to chain operations
- [ ] Test fix: Switch to live mode, verify blank slate appears and stays

### Phase 3: Verify Chat → Dashboard Flow
- [ ] Deploy backend with logging
- [ ] Send test messages in live mode
- [ ] Verify receipts are created in database
- [ ] Verify dashboard updates after each message
- [ ] Test navigation persistence

### Phase 4: Document Data Flow
- [ ] Create data flow diagram: Chat → Receipt → Dashboard
- [ ] Document tenant isolation (demo-tenant vs live-tenant)
- [ ] Document session persistence mechanism
- [ ] Add troubleshooting guide for common issues

---

## Next Steps

1. **Test with logging enabled** - Deploy and observe browser console + backend logs
2. **Identify the race condition** - Determine if tenant ID is being set correctly
3. **Fix the root cause** - Implement proper query invalidation or state management
4. **Verify end-to-end flow** - Test chat → dashboard → navigation → persistence