# Yseeku Platform Demo Upgrades - Implementation Plan

## Overview
Based on the comprehensive feedback and strategic recommendations, this plan implements the dual-layer architecture with scenario engine, shared data engine, and enhanced UX/accessibility features for the Yseeku SONATE platform demos.

---

## Phase 0: Foundation - Shared Data Engine (CRITICAL) ✅
**Goal:** Create single source of truth for both Layer 1 and Layer 2 demos

### Tasks
- [x] Create `yseeku-data-engine.js` with core data structures
- [x] Implement `exportLayer1()` for poetic/intuitive format (Monitor view)
- [x] Implement `exportLayer2()` for detailed/metric format (Inspector view)
- [x] Add scenario state management with deterministic timelines
- [x] Add agent state management with trust scores and drift vectors
- [x] Include Rₘ, ethicalFloor, contextualGravity calculations
- [x] Add trust receipts generation
- [x] Add deterministic scenario functions (normal, ethical-drift, emergence-basin)
- [x] Add play/pause/restart controls
- [x] Add real-time update loop (50ms = 20 FPS)
- [ ] Wire data engine into both demo files (NEXT)
- [ ] Verify both demos consume same data source
- [ ] Test data consistency across layers

---

## Phase 1: Scenario Engine for Layer 1 (HIGH PRIORITY) ✅
**Goal:** Enable deterministic storytelling with scripted scenarios

### Tasks
- [x] Add scenario dropdown/buttons to Demo 1 UI (yseeku-platform-final-demo.html)
- [x] Implement `setScenario(name)` function in data engine
- [x] Create "Normal Orbit" scenario (gentle, coherent drift, all green)
- [x] Create "Ethical Drift" scenario (agent degradation, floor shift from holding→strained)
- [x] Create "Emergence Basin" scenario (dwell time ring fills as emergence persists)
- [x] Add deterministic timeline for each scenario (scripted frames, NOT random)
- [x] Add play/pause/restart controls for scenarios
- [x] Add scenario time display (MM:SS format)
- [x] Wire up scenario selector to data engine
- [x] Wire up playback controls to data engine
- [x] Listen to yseekuDataUpdate events
- [x] Update mockData from engine data
- [x] Map engine agents to UI format
- [x] Map engine SYMBI scores to UI
- [ ] Update ethical floor icon states (holding/strained/breached) - NEXT
- [ ] Update emergence dwell ring progress based on scenario
- [ ] Update headline wording (coherent/navigating/fragmenting)
- [ ] Test all scenarios for consistency and repeatability

---

## Phase 2: Narrative Timeline (MEDIUM PRIORITY)
**Goal:** Visual timeline for replaying scenarios

### Tasks
- [ ] Add horizontal timeline bar to Layer 1 (top of main content)
- [ ] Add time markers (T=0, T=15s, T=30s, T=45s, T=60s)
- [ ] Add moving indicator showing current time in scenario
- [ ] Implement play/pause/restart functionality
- [ ] Add scrubbing capability (click timeline to jump to time)
- [ ] Show key events as markers on timeline (e.g., "Ethical Floor Breached")
- [ ] Sync timeline with scenario playback
- [ ] Add tooltip showing event details on hover
- [ ] Style timeline to match HUD aesthetic (minimal, clean)
- [ ] Test timeline interaction and synchronization

---

## Phase 3: Layer 2 Clarification (HIGH PRIORITY)
**Goal:** Transform Demo 2 into clear diagnostic/inspector tool

### Tasks
- [ ] Update title to "Yseeku SONATE – Vector Phase Space Inspector (Layer 2)"
- [ ] Add intro box at top explaining diagnostic layer purpose
- [ ] Add "Back to Interaction Monitor (Layer 1)" link/button
- [ ] Create "Why Panel" / "Causal Chain" section (right side or bottom)
- [ ] Show first constraint breach with timestamp (e.g., "Ethical floor dipped below 7.0 at T=15s")
- [ ] Show drift metrics with thresholds exceeded
- [ ] Show emergence basin dwell changes
- [ ] Add ordered causal sequence display (1, 2, 3...)
- [ ] Ensure Layer 2 uses same data engine as Layer 1
- [ ] Test Layer 1 → Layer 2 navigation flow

---

## Phase 4: Layer Linkage & Sync (MEDIUM PRIORITY)
**Goal:** Make the connection between layers undeniable

### Tasks
- [ ] Add explicit "Interaction Phase Monitor (Layer 1)" label to Demo 1 header
- [ ] Add "Open Vector Phase Space Inspector" button to Demo 1 header
- [ ] Implement BroadcastChannel API for cross-tab synchronization
- [ ] Test scenario changes syncing between tabs in real-time
- [ ] Add "Compare Layers" split-view mode for wide screens
- [ ] Ensure visual consistency (colors, fonts, spacing) across layers
- [ ] Add "Single Source of Truth" claim to UI (subtle, professional)
- [ ] Test multi-tab synchronization with all scenarios

---

## Phase 5: UX Enhancements (MEDIUM PRIORITY)
**Goal:** Polish the user experience

### Tasks
- [ ] Add tooltips for all charts and metrics using existing glossary
- [ ] Implement keyboard navigation with tabindex attributes
- [ ] Add ARIA labels for screen reader accessibility
- [ ] Ensure color contrast meets WCAG 2.1 AA standards
- [ ] Add visual cues for critical moments (subtle pulse effects)
- [ ] Enhance chart animations and transitions (smooth, professional)
- [ ] Add loading spinners for chart initialization
- [ ] Implement error handling with user-friendly messages
- [ ] Test responsive design on mobile devices (iPhone, Android)
- [ ] Add touch-friendly tap targets (minimum 44x44px)

---

## Phase 6: Glossary & Documentation (LOW PRIORITY)
**Goal:** Make demos self-explanatory

### Tasks
- [ ] Create glossary modal with all 53+ terms
- [ ] Add definitions for: Resonance, Drift, Contextual Gravity, Ethical Floor, etc.
- [ ] Add floating "Glossary" button to both demos (corner position)
- [ ] Implement search functionality in glossary
- [ ] Add "What did you think?" feedback button
- [ ] Link feedback to simple form (Google Form or embedded)
- [ ] Create inline help tooltips for complex features
- [ ] Test glossary usability and search functionality

---

## Phase 7: Visual Polish (LOW PRIORITY)
**Goal:** Enhance aesthetic appeal

### Tasks
- [ ] Refine Layer 1 to feel more like "HUD" than "dashboard"
- [ ] Remove heavy card borders, use whitespace/dividers instead
- [ ] Add subtle glow/pulse for "LIVE" and "Emergence Active" indicators
- [ ] Ensure Layer 2 maintains technical feel but echoes Layer 1 colors
- [ ] Add gradient effects to charts where appropriate
- [ ] Enhance gauge animations (smooth transitions)
- [ ] Add micro-animations for state transitions
- [ ] Test visual consistency across both layers

---

## Phase 8: Testing & Validation (CRITICAL)
**Goal:** Ensure everything works correctly

### Tasks
- [ ] Test all scenarios in Layer 1 (Normal, Ethical Drift, Emergence)
- [ ] Test Layer 1 → Layer 2 navigation
- [ ] Test cross-tab synchronization with BroadcastChannel
- [ ] Test keyboard navigation (Tab, Enter, Space keys)
- [ ] Test screen reader compatibility (NVDA, JAWS)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Chrome Android)
- [ ] Test performance with multiple scenarios running
- [ ] Verify data consistency between layers
- [ ] Test all tooltips and glossary entries

---

## Phase 9: Documentation & Deployment (MEDIUM PRIORITY)
**Goal:** Prepare for production deployment

### Tasks
- [ ] Update README with new features and architecture
- [ ] Document scenario engine usage and API
- [ ] Document data engine architecture and exports
- [ ] Create deployment guide for both demos
- [ ] Add troubleshooting section for common issues
- [ ] Create PR with all changes
- [ ] Request review from stakeholders
- [ ] Address review feedback
- [ ] Merge to main branch
- [ ] Deploy to production environment

---

## Success Criteria

### Technical
- [ ] Both demos use shared data engine (single source of truth)
- [ ] Scenarios are deterministic and repeatable
- [ ] Timeline allows scrubbing and replay
- [ ] Layer 2 shows causal chain with timestamps
- [ ] Cross-tab sync works correctly via BroadcastChannel
- [ ] All accessibility features implemented (WCAG 2.1 AA)
- [ ] No console errors or warnings
- [ ] Performance: <100ms scenario transitions

### User Experience
- [ ] Demos tell clear, compelling story
- [ ] Navigation between layers is intuitive
- [ ] Tooltips and glossary are helpful and accurate
- [ ] Visual design is polished and consistent
- [ ] Mobile experience is usable and responsive
- [ ] Keyboard navigation works smoothly

### Business
- [ ] Demos effectively showcase platform capabilities
- [ ] Stakeholders approve changes
- [ ] Documentation is complete and accurate
- [ ] Ready for customer presentations and demos

---

## Timeline Estimate (with LLM assistance)
- Phase 0: 2-3 hours
- Phase 1: 4-6 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- Phase 4: 3-4 hours
- Phase 5: 4-6 hours
- Phase 6: 2-3 hours
- Phase 7: 2-3 hours
- Phase 8: 3-4 hours
- Phase 9: 2-3 hours

**Total: 29-41 hours (approximately 4-5 days with LLM assistance)**

---

## Current Status
- [x] Infinite scroll issue fixed
- [x] Branding updated to "Yseeku SONATE"
- [x] Dual-layer architecture conceptualized
- [x] Enhanced canonical demo created (PR #33)
- [ ] Shared data engine implementation (starting Phase 0)
- [ ] Scenario engine implementation (Phase 1)
- [ ] Remaining phases to be completed

---

## Files to Modify
- `yseeku-platform-final-demo.html` - Layer 1 (Interaction Phase Monitor)
- `yseeku-platform-enhanced-canonical.html` - Layer 2 (Vector Phase Space Inspector)
- `yseeku-data-engine.js` - NEW: Shared data engine

## Repository
- Branch: `feature/scenario-engine-dual-layer`
- Base: `main`
- Target PR: New PR after Phase 0-3 completion