## Objective
Use the existing archives and generated reports to power the new Resonate dashboard/demo, while keeping `Archives/` excluded from version control.

## Data Access
- Primary source: `packages/lab/reports/overseer-manual-index.csv` and `archive-analysis-report.json` (already generated from archives).
- Live analysis (upload): Parse client‑provided text (txt/json/mhtml/html) and compute 5D + velocity via `lib/resonate-engine.ts` (heuristics aligned to v2.4 thresholds).
- Optional: Read from `Archives/` at runtime for private overseer views; keep `Archives/` in `.gitignore`.

## App Structure (as provided)
- `apps/resonate-dashboard/`
  - `app/page.tsx`: Resonate Mirror (public upload → verdict, radar, velocity)
  - `app/overseer/page.tsx`: Private archive dashboard (KPIs, by‑system bars, top critical/golden)
  - `app/api/analyze/route.ts`: Upload → instant analysis; no persistence
  - `components`: `RadarChart`, `VelocitySparkline`, `VerdictBadge`, `FileUpload`
  - `lib/resonate-engine.ts`: 5D + velocity + identity logic; verdict bands
  - Tailwind config/theme exactly as provided (graphite/cyan/violet/blue)

## Wiring Details
- Overseer data loader: Server route reads CSV/JSON from `packages/lab/reports/`; aggregates totals, system distribution, top lists; returns JSON to the dashboard.
- Mirror upload: Client → `analyze/route.ts` (or client-side `analyzeConversation`) → returns `{ciq,fiveD,maxVelocity,verdict}` for charts/badges.
- Velocity thresholds (v2.4): phase critical 5.5, intra critical 4.5, red 3.5/3.2, yellow 2.0; identity yellow/red/critical 0.85/0.75/0.65.

## Security & Git Hygiene
- `.gitignore` already contains `Archives/`; preserve and enforce for future pushes.
- No raw archive content is stored in the app; overseer reads reports generated locally.
- PII guardrail: skip keyword risk checks when `word_count < 300`.

## Verification
- `npm install` then `npm run dev` → `http://localhost:3000` (public mirror) and `/overseer` (archive overview).
- Cross‑check KPIs match CSV counts; radar renders 0–10; verdict badges follow public bands.

## Deliverables
- Fully wired `apps/resonate-dashboard` with public mirror and private overseer using the archives‑derived reports.
- Live demo ready; archives remain excluded from git pushes.