# SONATE Platform

## Overview
SONATE Platform is an Enterprise AI Trust Framework built as a Turborepo monorepo. It provides tools for AI trust verification, resonance detection, and collaboration ledger management.

## Project Structure
- **apps/web** - Main Next.js web dashboard (port 5000)
- **apps/backend** - Backend API service
- **apps/resonate-dashboard** - Secondary dashboard app
- **apps/enterprise-demo** - Vite-based enterprise demo
- **apps/new-demo** - Interactive demo application
- **apps/resonance-engine** - Python-based resonance calculation service
- **packages/core** - Core trust protocol and utilities
- **packages/detect** - AI detection algorithms
- **packages/lab** - Experiment and analysis tools
- **packages/orchestrate** - Agent orchestration system
- **packages/persistence** - Database and storage layer
- **packages/collaboration-ledger** - Collaboration tracking

## Running the Project
The main web app runs on port 5000:
```bash
npm run dev --workspace web
```

## Tech Stack
- **Frontend**: Next.js 14, React 18/19, Tailwind CSS, Radix UI
- **Backend**: Node.js, TypeScript
- **Build System**: Turborepo
- **Styling**: Tailwind CSS v4

## Architecture Decisions
- Monorepo structure with npm workspaces
- Standalone Next.js output for production builds
- Local package references for internal dependencies

## Recent Changes (December 2025)

### Frontend Modernization
The web dashboard has been redesigned with a 3-module architecture:

1. **DETECT Module** (Green/LIVE) - Production monitoring
   - Dashboard with KPI cards and SONATE 5-dimension visualization
   - Agent Trust page with circular trust gauges per agent
   - Risk Monitor for resonance and drift detection
   - Real-time alerts feed

2. **LAB Module** (Purple/SANDBOX) - Research environment
   - Experiments page (`/dashboard/lab/experiments`) - A/B testing with statistical validation
   - SONATE Analysis page (`/dashboard/lab/symbi`) - 5-dimension trust framework scoring
   - Emergence Testing page (`/dashboard/lab/emergence`) - Test suites with simulation controls
   - Bedau Index page (`/dashboard/lab/bedau`) - Comprehensive emergence monitoring with 4-component analysis
   - All LAB pages use synthetic data only - no production data access

3. **ORCHESTRATE Module** (Blue/ADMIN) - Enterprise operations
   - Tenant management for multi-tenant isolation
   - Trust Receipts with cryptographic hash chain visualization
   - Audit Trails for compliance reporting
   - API Gateway configuration

### UI/UX Improvements
- Color-coded module navigation with collapsible sections
- Data source badges (LIVE DATA vs SYNTHETIC DATA)
- Loading skeletons and trend indicators
- Modern card-based layouts with progress bars
- **InfoTooltip Component** - Hover explanations for technical terms
  - 50+ term glossary covering SONATE, Bedau Index, statistical terms
  - Small (i) icons next to complex terms throughout the platform
  - Located at `apps/web/src/components/ui/info-tooltip.tsx`
  - SONATE dimensions: Reality Index, Trust Protocol, Ethical Alignment, Canvas Parity, Resonance Quality
  - Trust Principles: Consent Architecture, Inspection Mandate, Continuous Validation, Ethical Override, Right to Disconnect, Moral Recognition
  - Tooltip bubble styling with background, border, and shadow for better visibility

### API Endpoints Added
- `/api/dashboard/kpis` - Platform KPIs with SONATE dimensions
- `/api/dashboard/alerts` - System alerts with severity levels
- `/api/dashboard/risk` - Risk metrics, compliance reports, trust principle scores
- `/api/lab/experiments` - Active experiments with statistical analysis
- `/api/tenants` - Tenant CRUD operations (GET, POST, PATCH, DELETE)
- `/api/agents` - Agent management with SONATE dimensions
- `/api/audit/trails` - Audit trail listing with filtering
- `/api/resonance/analyze` - Bridge to Python resonance engine with fallback

### Database Integration
- PostgreSQL database with tables: tenants, agents, users, trust_receipts, audit_logs, experiments, risk_events
- API endpoints connect to database with graceful fallback to mock data when database is empty
- Database connection helper at `apps/web/src/lib/db.ts`
- Schema auto-creation on first API call via `ensureSchema()`

### Documentation Page
- In-platform documentation at `/dashboard/docs`
- 33 documented terms across 6 sections:
  - SONATE 5-Dimension Framework
  - Trust Principles
  - Bedau Index & Emergence
  - Resonance Metrics
  - Statistical Analysis
  - Compliance & Governance
- Searchable interface with term definitions and examples

### Resonance Engine Bridge
- Python FastAPI service at `apps/resonance-engine/`
- Uses sentence-transformers for semantic analysis
- API bridge at `/api/resonance/analyze` with fallback calculations
- Calculates R_m (resonance score) and SONATE 5 dimensions

### Authentication
- Uses localStorage for JWT tokens (Replit iframe compatible)
- Default admin credentials: admin / admin123
