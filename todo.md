# Phase 2: Dashboard Reimagination & UX Enhancement

## Overview
Transform the dashboard from a data display center into an actionable insights hub by integrating the newly exposed "hidden gems" (Phase-Shift Velocity, Linguistic Emergence, Drift Detection), reducing redundancy, and improving user experience.

## Task List

### 2.1 Dashboard Layout Reorganization
- [x] Design new 4-panel dashboard layout (Hero KPIs, Hidden Gems, Trust Analysis, Recent Activity)
- [x] Create DashboardLayout component with grid system
- [x] Implement responsive breakpoints (mobile, tablet, desktop)
- [ ] Add widget drag-and-drop or slot-based positioning

### 2.2 Integrate Hidden Gems into Dashboard
- [x] Add Phase-Shift Velocity widget to main dashboard
- [x] Add Linguistic Emergence widget to main dashboard
- [x] Add Drift Detection widget to main dashboard
- [x] Create "Safety Overview" composite widget combining all three
- [x] Add demo mode support for all widgets

### 2.3 Reduce Trust Score Redundancy
- [ ] Remove Trust Score from Overview page (keep only on Main Dashboard)
- [ ] Consolidate Constitutional Principles display
- [ ] Create dedicated Trust Score detail page
- [ ] Update navigation and breadcrumbs

### 2.4 Create Actionable Insights Panel
- [x] Design insights data structure (priority, severity, actionable recommendation)
- [x] Implement insights generation logic (backend)
- [x] Create InsightsPanel component
- [x] Add AI-generated recommendations
- [x] Implement quick actions (approve, override, investigate)

### 2.5 UX Enhancements
- [x] Create tooltip system for technical terms
- [x] Build glossary component with plain English explanations
- [ ] Add contextual help buttons
- [ ] Implement loading states and skeletons
- [ ] Add empty states for new tenants

### 2.6 Dashboard Performance Optimization
- [ ] Implement widget-level caching with React Query
- [ ] Add lazy loading for below-fold widgets
- [ ] Optimize API calls (batch where possible)
- [ ] Add performance monitoring

### 2.7 Testing & Validation
- [ ] Test dashboard with demo tenant data
- [ ] Test dashboard with live tenant (blank slate)
- [ ] Verify widget responsive behavior
- [ ] Check performance metrics
- [ ] Validate data accuracy

### 2.8 Documentation
- [ ] Update dashboard documentation
- [ ] Create user guide for new dashboard
- [ ] Document widget configuration
- [ ] Update CHANGELOG.md

## Success Criteria
- Main dashboard displays all 3 hidden gems prominently
- Trust score displayed only once (no redundancy)
- Actionable insights panel provides clear next steps
- All technical terms have tooltips
- Dashboard loads under 3 seconds
- All widgets work in both demo and live modes

## Progress

### Completed
- ✅ Created todo.md with Phase 2 task breakdown
- ✅ Analyzed current dashboard layout (673 lines)
- ✅ Verified Phase 1 widgets exist and ready for integration

### Completed
- ✅ Redesigned main dashboard with 4-panel layout
- ✅ Integrated all 3 Hidden Gems widgets (Phase-Shift, Emergence, Drift)
- ✅ Added ModeIndicator component to header
- ✅ Build verification successful

### In Progress
- 🔄 Creating UX Enhancements (tooltips, glossary, loading states)
- 🔄 Dashboard performance optimization
- 🔄 Testing and validation
- 🔄 Documentation updates (glossary, learn modules)