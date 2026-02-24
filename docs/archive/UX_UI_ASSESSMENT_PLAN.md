# Comprehensive UX/UI Assessment Plan: Yseeku Platform

## 1. Executive Summary
This document outlines the strategy, test cases, and success criteria for the final UX/UI evaluation of the Yseeku Platform prior to release. The primary focus is validating the alignment between backend functionality and frontend presentation, specifically ensuring the **Demo/Live Mode** toggle operates seamlessly.

## 2. Assessment Priorities

### Priority 1: Front-End/Back-End Alignment
**Objective:** Ensure the UI accurately reflects backend capabilities and provides a professional, intuitive experience.

**Checklist:**
- [ ] **Dashboard Data Wiring:** Verify `DashboardPage` receives data from `useDashboardKPIs`.
- [ ] **Empty States:** Verify "Blank Slate" components appear when no data exists (Live Mode).
- [ ] **Visual Consistency:** Check that `WithDemoWatermark` appears only on specific cards (Principles, Detection) in Demo Mode.
- [ ] **Navigation & Modules:** Ensure the Sidebar correctly filters items based on user role and expanded modules (`detect`, `lab`, `orchestrate`).

### Priority 2: Demo/Live Mode Toggle
**Objective:** Verify seamless switching between simulated data and real tenant data without leakage.

**Checklist:**
- [ ] **Toggle Action:** Switching "Demo Mode" on/off in the header works instantly.
- [ ] **URL Deep Linking:** Visiting `.../dashboard?demo=true` immediately enters demo mode.
- [ ] **Data Seeding:** Enabling Demo Mode triggers `/api/demo/init` to populate fresh data.
- [ ] **Visual Indicators:** The "Demo Mode" banner and yellow/amber UI accents appear clearly.
- [ ] **Data Isolation:** Demo data must NOT persist or appear when switching back to Live Mode.

## 3. Detailed Test Cases

### 3.1 Demo/Live Functionality

| ID | Scenario | Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DL-01** | **Switch to Demo** | 1. Log in.<br>2. Click "Demo Mode" toggle in header. | Page refreshes. KPI cards populate with high-fidelity mock data (Trust Score ~8.6). Amber banner appears. | **Ready for Manual Test** |
| **DL-02** | **Switch to Live** | 1. Ensure in Demo Mode.<br>2. Click "Live Mode" toggle. | Page refreshes. Data reverts to real tenant data (or 0/Empty if new). Banner disappears. | **Ready for Manual Test** |
| **DL-03** | **Data Isolation** | 1. Enter Demo Mode.<br>2. Generate a "Trust Receipt" (or view one).<br>3. Switch to Live Mode.<br>4. Check Receipt logs. | The demo receipt MUST NOT appear in the Live transaction log. | **VERIFIED (via API)** |
| **DL-04** | **Session Persistence** | 1. Enter Demo Mode.<br>2. Refresh the browser page (F5/Cmd+R). | The application should *stay* in Demo Mode. | **Ready for Manual Test** |
| **DL-05** | **Deep Linking** | 1. Navigate to `/dashboard?demo=true`. | Application loads directly into Demo Mode with data seeded. | **Ready for Manual Test** |

### 3.2 Frontend/Backend Alignment

| ID | Scenario | Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FE-01** | **Blank Slate (Live)** | 1. Log in to a new Live tenant (or clear DB).<br>2. View Dashboard. | Dashboard shows "Welcome/Setup" empty state, not broken charts or `NaN` values. | **VERIFIED (Code Review)** |
| **FE-02** | **Data Latency** | 1. In Live Mode, trigger a chat interaction.<br>2. Check Dashboard. | The "Interactions" count increments immediately (or within 5s polling). | **Ready for Manual Test** |
| **FE-03** | **Role Access** | 1. Login as `viewer` role.<br>2. Check Sidebar. | "Settings", "API Keys", and Admin-only routes are hidden. | **Ready for Manual Test** |
| **FE-04** | **Error Handling** | 1. Disconnect network or stop backend.<br>2. Navigate UI. | UI shows "Connection Lost" or toast error, not crash/white screen. | **Ready for Manual Test** |

## 4. Technical Recommendations (Pre-Assessment)

1.  **Hardcoded Demo User:**
    *   *Observation:* `DashboardLayout.tsx` defines a constant `demoUser`.
    *   *Action:* Verify this doesn't override the actual logged-in user's profile unnecessarily if they are just previewing.
2.  **Mock Data "Realism":**
    *   *Observation:* `core.routes.ts` uses `Math.random()`.
    *   *Action:* Ensure randomness is deterministic enough to prevent "jumping" charts on refresh.
3.  **Live Mode Polling:**
    *   *Observation:* `useLiveMetrics` polls every 5 seconds.
    *   *Action:* Monitor backend logs during assessment to ensure no rate-limiting issues.

## 5. Success Criteria

The assessment is considered **COMPLETE** when:
1.  **Zero Critical UI Bugs:** No broken layouts, overlapping text, or console errors in the "Happy Path".
2.  **100% Toggle Reliability:** Switching modes never requires a hard browser refresh and never mixes data.
3.  **Backend Parity:** Every metric shown in "Live Mode" can be traced to a real database query.
4.  **Professional Polish:** Demo data looks indistinguishable from high-volume production data.
