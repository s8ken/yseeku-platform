# Frontend Deep Dive & Reimagination

## Phase 1: Diagnose Current Issues

### Demo/Live Mode Investigation
- [x] Examine DemoContext.tsx - tenant switching logic
- [x] Check use-demo-data.ts - data source for demo mode
- [x] Verify dashboard data fetching for live mode
- [x] Identify why live mode shows demo data instead of blank slate
- [x] Check API routes: demo.routes.ts vs live.routes.ts vs dashboard.routes.ts

### Dashboard Update Issue Investigation
- [x] Examine ChatContainer.tsx - chat interaction flow
- [x] Check useDashboardInvalidation - query invalidation after chat
- [x] Verify WebSocket events for real-time updates
- [x] Check trust receipt creation after chat
- [x] Identify why dashboard doesn't update after live interaction

### Semantic Coprocessor Frontend Integration
- [x] Review where resonance is displayed in UI
- [x] Check if Semantic Coprocessor status is shown
- [x] Identify opportunities to show ML vs structural usage
- [x] Plan UI elements for semantic features

---

## Phase 2: Reimagine Frontend Architecture

### Design Principles
- Clear separation between Demo (pre-seeded) and Live (blank slate) modes
- Real-time updates for Live mode
- Showcase Semantic Coprocessor features
- Highlight v2.0.1 changes (3 validated dimensions)

### Proposed Changes
1. **Enhanced Demo/Live Mode Toggle**
   - Visual indicator of current mode
   - Mode-specific messaging
   - Reset functionality for Live mode

2. **Real-Time Dashboard Updates**
   - WebSocket integration for live metrics
   - Immediate reflection of interactions
   - Animated counters

3. **Semantic Coprocessor Dashboard**
   - Show coprocessor availability status
   - Display ML vs structural usage stats
   - Resonance quality visualization
   - Performance metrics

4. **Trust Analytics Dashboard Redesign**
   - Show v2.0.1 validated dimensions only
   - Real-time interaction counter
   - Live mode: blank slate → populate as interactions happen
   - Demo mode: pre-seeded with realistic data

---

## Phase 3: Implementation Plan

### Critical Fixes
- [x] Fix live mode data source (should use live.routes.ts not demo data)
- [x] Fix dashboard real-time updates after chat
- [x] Ensure trust receipts are created and queried correctly
- [x] Add WebSocket listener for dashboard updates

### Enhancements
- [x] Add mode indicator in UI
- [x] Add Semantic Coprocessor status panel
- [x] Show ML vs structural fallback stats
- [x] Add resonance quality visualization
- [x] Update dashboard to show v2.0.1 dimensions only

### Testing
- [ ] Test live mode starts blank
- [ ] Test chat populates dashboard
- [ ] Test demo mode shows pre-seeded data
- [ ] Test mode switching clears data
- [ ] Test Semantic Coprocessor integration

---

## Phase 4: Documentation & Deployment

- [ ] Update frontend documentation
- [ ] Add user guide for Demo vs Live modes
- [ ] Document Semantic Coprocessor features
- [ ] Deploy and verify fixes