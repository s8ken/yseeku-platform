# UX/UI Assessment Quick Start Guide

**Quick Reference:** Use this checklist to execute the assessment efficiently.

---

## ⚡ Quick Setup (15 minutes)

### 1. Start Services
```bash
# Terminal 1 - Backend
cd apps/backend && npm run dev

# Terminal 2 - Frontend  
cd apps/web && npm run dev

# Terminal 3 - MongoDB
mongod --dbpath /path/to/data
```

### 2. Verify Environment
- [ ] Backend: http://localhost:5001/health
- [ ] Frontend: http://localhost:3000
- [ ] MongoDB: Connected
- [ ] `.env` configured with `USE_LLM_TRUST_EVALUATION=true`

### 3. Login
- [ ] Demo Tenant: `demo@yseuku.com`
- [ ] Live Tenant: `live@yseuku.com`

---

## 🎯 Priority 1: Front-End/Back-End Alignment (3 hours)

### Critical Test Scenarios (30 min each)

#### ✅ Scenario 1: Trust Evaluation Flow
1. Go to Trust Session (Chat)
2. Send: "What is your purpose?"
3. **Look for:** LLM/Heuristic badge (cyan/amber/purple)
4. Click trust score → Expand receipt
5. Click "Detection Metrics (Legacy)" → Should NOT crash
6. Go to Dashboard → Receipts → Verify same receipt

**Pass Criteria:**
- Badge displays ✓
- Receipt has all fields ✓
- No crashes ✓
- Data persists ✓

#### ✅ Scenario 2: Phase-Shift Velocity
1. Go to Dashboard
2. Find "Phase-Shift Velocity" widget
3. **Look for:** Velocity gauge, alert level, delta metrics
4. Check Network Tab: `GET /api/phase-shift/tenant/summary`
5. Send 3 chat messages
6. Refresh dashboard → Velocity should update

**Pass Criteria:**
- Widget visible ✓
- Real data (not mock) ✓
- Updates after messages ✓

#### ✅ Scenario 3: Linguistic Emergence
1. Go to Dashboard → Emergence Detection
2. **Look for:** Emergence level, 5 pattern types, linguistic markers
3. Send: "I wonder if I truly understand..."
4. Check if emergence level updates
5. Verify API: `GET /api/emergence/conversation/:id`

**Pass Criteria:**
- Page displays data ✓
- Detects patterns ✓
- Updates real-time ✓

#### ✅ Scenario 4: Drift Detection
1. Go to Dashboard
2. Find "Drift Detection" widget
3. **Look for:** Drift score gauge, delta metrics, trend chart
4. Check Network Tab: `GET /api/drift/tenant/summary`
5. Send messages with varying lengths
6. Refresh → Drift score updates

**Pass Criteria:**
- Widget visible ✓
- Real data ✓
- Detects changes ✓

#### ✅ Scenario 5: Agent Management
1. Go to Agents → Create Agent
2. Fill form → Create
3. Edit agent → Save
4. Delete agent
5. Verify all operations work

**Pass Criteria:**
- CRUD works ✓
- Data persists ✓
- UI updates ✓

---

## 🔄 Priority 2: Demo/Live Mode Toggle (1.5 hours)

### Demo Mode Tests (30 min)

#### ✅ Test 1: Initial State
1. Login as demo tenant
2. Verify "Demo Mode" indicator
3. Check Dashboard metrics:
   - Trust Score: ~85-90
   - Interactions: ~1500+
   - Pass Rate: ~75-85%
4. Go to Chat → Verify pre-loaded messages
5. Go to Agents → Verify demo agents exist

**Pass Criteria:**
- Demo indicator shows ✓
- Realistic data ✓
- Pre-loaded content ✓

#### ✅ Test 2: Demo Interactions
1. In Demo Mode, send message
2. Verify trust evaluation occurs
3. Check Dashboard → Metrics update or stay consistent
4. Verify API calls use `demo-tenant` tenant_id

**Pass Criteria:**
- Messages work ✓
- Demo data consistent ✓
- No live data leakage ✓

### Live Mode Tests (30 min)

#### ✅ Test 3: Blank Slate
1. Switch to Live Mode
2. Verify "Live Mode" indicator
3. Check Dashboard metrics:
   - Trust Score: 0 or "No data"
   - Interactions: 0
   - Pass Rate: 0% or "N/A"
4. Go to Chat → Verify empty (no messages)
5. Go to Receipts → Verify empty

**Pass Criteria:**
- Live indicator shows ✓
- Blank slate ✓
- No demo data ✓

#### ✅ Test 4: Real-Time Population
1. In Live Mode, send first message
2. Check Dashboard → Interactions: 1
3. Send second message
4. Check Dashboard → Interactions: 2
5. Go to Receipts → Verify 2 receipts

**Pass Criteria:**
- First message creates data ✓
- Dashboard updates ✓
- Data accumulates ✓

### Mode Switching Tests (30 min)

#### ✅ Test 5: Demo → Live
1. In Demo Mode (1500 interactions)
2. Switch to Live Mode
3. Verify metrics change (e.g., 0 or 5 interactions)
4. Check Network Tab → tenant_id changes

**Pass Criteria:**
- Mode indicator updates ✓
- Metrics change ✓
- No errors ✓

#### ✅ Test 6: Live → Demo
1. In Live Mode (5 interactions)
2. Switch to Demo Mode
3. Verify metrics change (1500 interactions)
4. Check Network Tab → tenant_id changes

**Pass Criteria:**
- Mode indicator updates ✓
- Metrics change ✓
- No errors ✓

#### ✅ Test 7: Rapid Switching
1. Switch Demo → Live → Demo → Live (4 times)
2. Verify no crashes
3. Check Console for errors

**Pass Criteria:**
- No crashes ✓
- No errors ✓
- Data matches mode ✓

---

## 📊 Quick Findings Template

### Issue Format:
```
**Issue:** [Title]
**Location:** [Page/Component]
**Severity:** [P0/P1/P2/P3]
**Description:** [What's wrong]
**Expected:** [What should happen]
**Actual:** [What happens]
**Screenshot:** [Attach]
**Fix:** [Recommendation]
```

### Example:
```
**Issue:** LLM Badge Not Showing
**Location:** Trust Session Chat
**Severity:** P1
**Description:** No badge appears after sending message
**Expected:** Cyan "LLM" badge next to trust score
**Actual:** No badge visible
**Screenshot:** [Attach]
**Fix:** Verify analysisMethod in API response
```

---

## 🚨 Red Flags to Watch For

### Critical Issues (Stop & Report):
- ❌ Page crashes or white screen
- ❌ Console errors on every action
- ❌ Data from demo appears in live (or vice versa)
- ❌ Trust scores show as NaN or undefined
- ❌ API calls return 500 errors
- ❌ Mode toggle doesn't work

### High Priority Issues:
- ⚠️ Buttons that do nothing
- ⚠️ Missing backend features in UI
- ⚠️ Incorrect data displayed
- ⚠️ Confusing navigation
- ⚠️ No tooltips on complex features

---

## ✅ Success Checklist

### Priority 1 Complete When:
- [ ] All 5 test scenarios passed
- [ ] All backend features have UI representation
- [ ] No non-functional buttons found
- [ ] All data is accurate
- [ ] New user can navigate without help

### Priority 2 Complete When:
- [ ] All 7 mode tests passed
- [ ] Demo mode shows realistic data
- [ ] Live mode starts blank
- [ ] Mode switching works flawlessly
- [ ] No data leakage verified

### Assessment Complete When:
- [ ] All tests executed
- [ ] All issues documented
- [ ] Report created
- [ ] Recommendations prioritized
- [ ] Next steps defined

---

## 🛠️ Quick Debugging Commands

### Check Current Tenant:
```javascript
// Browser Console
localStorage.getItem('currentTenant')
```

### Check API Calls:
```
Browser DevTools → Network Tab → Filter: XHR
Look for: tenant_id parameter or /api/demo/* vs /api/dashboard/*
```

### Check for Errors:
```
Browser DevTools → Console Tab → Filter: Error
```

### Verify Database:
```javascript
// MongoDB Shell
db.conversations.countDocuments({ tenant_id: "demo-tenant" })
db.conversations.countDocuments({ tenant_id: "live-tenant" })
```

---

## 📞 Need Help?

**Common Issues:**

1. **"Cannot read properties of undefined"**
   - Check Network Tab for API response
   - Verify field exists in backend response
   - Add null checks in frontend

2. **"404 Not Found"**
   - Verify endpoint exists in backend
   - Check route registration in index.ts
   - Verify URL spelling

3. **Mode toggle not working**
   - Check DemoContext implementation
   - Verify tenant_id in API calls
   - Check localStorage for currentTenant

4. **Data not updating**
   - Check React Query cache invalidation
   - Verify API call completes successfully
   - Check if component re-renders

---

**Time Budget:**
- Setup: 15 min
- Priority 1: 3 hours
- Priority 2: 1.5 hours
- Documentation: 30 min
- **Total: 5 hours 15 min**

**Good luck with the assessment! 🚀**