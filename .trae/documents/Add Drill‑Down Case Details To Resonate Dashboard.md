## Objective
Make the Overseer dashboard interactive: clicking an item drills into a full case view with metrics, charts, quotes, and stats, while preserving data sources from `packages/lab/reports/` and keeping Archives excluded from git.

## Features
- Case list → detail navigation:
  - Click a card in Top Critical/Top Golden opens `/overseer/case/[id]`.
  - `[id]` uses a stable key (conversationId if present, else slugified original file name).
- Case detail view:
  - Header: file name, system, priority, reasons, date.
  - KPIs: max phase velocity, max intra velocity, identity stability bands, CIQ if available.
  - Charts:
    - 5D Radar (Reality, Trust, Ethical, Resonance, Canvas)
    - Velocity sparkline (per-turn where available; fallback to spikes list)
    - Identity stability sparkline (if available)
  - Quotes section: 3–5 direct excerpts aiding calibration.
  - Flags & tags: priority badge, trust protocol counts (PASS/PARTIAL/FAIL).
  - Navigation: previous/next within current filtered list.
- Filters & search on `/overseer`:
  - Filter by system & priority; text search on file/reasons; updates list and clicks carry context.

## Data Flow
- Loader reads reports at runtime:
  - CSV: `overseer-manual-index.csv` → list entries including `file`, `system`, `priority`, `reasons`, `golden`.
  - JSON: `archive-analysis-report.json` → detailed per-conversation metrics; matched by `originalFileName` or `conversationId`.
- Case id strategy:
  - Prefer `conversationId` (from JSON `conversations[].conversationId`).
  - Fallback: `encodeURIComponent(originalFileName)`.

## Implementation
- Routing:
  - Add `app/overseer/case/[id]/page.tsx`.
- Utilities:
  - `lib/reports.ts`: helpers to read & parse CSV/JSON, build index map by `conversationId` and `originalFileName`.
- Components:
  - `CaseHeader.tsx`: title, system badge, priority badge, reasons.
  - `CaseKpis.tsx`: velocity, identity stability, trust counts.
  - `CaseRadar.tsx`: wraps existing `RadarChart` for detail.
  - `CaseVelocitySpark.tsx`: wraps existing `VelocitySparkline`.
  - `QuotesList.tsx`: render `directQuotes`.
  - `FilterBar.tsx` and `SearchBox.tsx` for `/overseer` list.
- Overseer list updates:
  - Cards become links (`<a href={`/overseer/case/${id}`}>`).
  - Add filter/search controls at the top.

## UX & Styling
- Maintain graphite/cyan theme; subtle borders; responsive two-column layout.
- Breadcrumb from detail back to `/overseer` with filters preserved via query params.

## Verification
- Navigate `/overseer`, filter & search, click a case → detail page loads matching JSON entry and displays metrics/quotes.
- Test fallback when JSON lacks `conversationId` (match by `originalFileName`).

## Constraints
- Runtime reads from `packages/lab/reports/`; do not commit `Archives/`.
- Handle missing metrics gracefully; show placeholders when sparkline data is unavailable.

## Deliverables
- New pages and components under `apps/resonate-dashboard`.
- Working drill‑down navigation and detail views integrated with existing reports.