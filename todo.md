# Yseeku Platform Audit & Fix Plan

## Phase 1: Deep Code Analysis [Complete]
- [x] Clone repository and map structure
- [x] Analyze backend chat/trust receipt flow (critical path)
- [x] Analyze frontend dashboard data sources (real vs mock)
- [x] Analyze API route connections (frontend → backend)
- [x] Analyze package dependencies and coherence
- [x] Check for dead code, orphaned files, spaghetti patterns

## Phase 2: Critical Path Verification [Complete]
- [x] Trace: Chat message → Trust evaluation → Receipt generation → Dashboard update
- [x] Verify backend API routes actually connect to services
- [x] Verify frontend API calls match backend endpoints
- [x] Check database models and persistence layer
- [x] Identify mock/demo data vs real data flows

## Phase 3: Dashboard & Routing Fixes [Complete]
- [x] Remove conflicting Next.js API routes that shadow backend rewrites
- [x] Add missing rewrite rules for backend routes (15+ routes added)
- [x] Fix hardcoded principle scores on main dashboard
- [x] Ensure dashboard overview uses ConstitutionalPrinciples component with real data
- [x] Fix receipts endpoint (was /api/trust/receipts, now /api/trust/receipts/list)
- [x] Fix overseer endpoint (was /api/orchestrator/overseer/status, now /api/overseer/status)
- [x] Fix live metrics endpoint (was /api/dashboard/live, now /api/live/metrics)
- [x] Fix risk data endpoint (was /api/trust/risk, now /api/dashboard/risk)

## Phase 4: Comprehensive Report [In Progress]
- [ ] Write full platform assessment report