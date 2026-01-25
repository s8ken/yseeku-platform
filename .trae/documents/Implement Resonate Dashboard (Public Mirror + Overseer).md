## Objective
Build a beautiful Next.js dashboard that visualizes the CSV/JSON reports and provides a public “Resonate Mirror” upload experience, plus a private Overseer archive overview.

## Structure
- New app at `apps/resonate-dashboard` following your provided scaffold:
  - `package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`
  - `app/layout.tsx`, `app/page.tsx` (public mirror), `app/overseer/page.tsx` (private dashboard), `app/api/analyze/route.ts`
  - `components/` with `RadarChart.tsx`, `VelocitySparkline.tsx`, `VerdictBadge.tsx`, `FileUpload.tsx`
  - `lib/resonate-engine.ts` implementing 5D + velocity + identity logic (wrapping our v2.4 thresholds)
  - `public/sonate-logo.svg`
  - `types/index.ts` for shared types

## Tech & Dependencies
- Use your provided `package.json`:
  - Next 14.2.5, React 18.3.1, Recharts, Lucide, Tailwind 3.4.x
- Tailwind theme from your config (graphite, cyan, violet, blue)
- Keep archives excluded via `.gitignore` and read reports from `packages/lab/reports`.

## Data Sources & Logic
- `app/api/analyze/route.ts`:
  - Accept uploaded text; parse turns via robust split (user/assistant labels). 
  - Call `lib/resonate-engine.ts` to compute:
    - 5D aggregates (Reality, Trust, Ethical, Resonance, Canvas)
    - CIQ score (weighted or simple average to match public bands)
    - Max velocity (phase-shift/intra per v2.4 thresholds)
    - Verdict string (95/90/85 bands)
- `app/overseer/page.tsx`:
  - Read `packages/lab/reports/overseer-manual-index.csv` and `archive-analysis-report.json` via server-side loader.
  - Show KPIs (totals, critical/high/medium/low, golden), system distribution bars, top 15 critical and top 8 golden lists.

## Components
- `RadarChart.tsx`:
  - Recharts radar with 0–10 domain for the 5D dimensions; styling per cyan theme.
- `VelocitySparkline.tsx`:
  - Small horizontal sparkline showing per-turn velocity (if provided) and thresholds (2.0/3.2/4.5/5.5 bands).
- `VerdictBadge.tsx`:
  - Displays CIQ score in large gradient; shows verdict band text; velocity severity annotation using v2.4 bands.
- `FileUpload.tsx`:
  - Client-side uploader (txt/json/mhtml/html); calls `analyzeConversation` or `/api/analyze` and passes results up.

## Pages
- `app/page.tsx` (public):
  - Hero title, short pitch, upload box, animated results (Verdict, RadarChart, summary quote).
- `app/overseer/page.tsx` (private):
  - Title, stats line (e.g., 164 conversations, total words), KPI grid, system distribution, top critical/golden cards; link to CSV/MD.

## Styling
- `app/layout.tsx`:
  - Inter font, graphite background, white text.
- Tailwind classes matching your theme; use subtle borders and depth for cards.

## Security & Performance
- Do not store archives; all analysis is in-memory; skip PII keyword checks for small files (<300 words).
- Avoid heavy client-side parsing for large mhtml; accept text content upload.

## Verification
- `npm install` then `npm run dev` → `http://localhost:3000`.
- Validate:
  - Public mirror upload returns CIQ, 5D radar, velocity verdict.
  - Overseer page shows correct totals from CSV/JSON, lists populated.

## Deliverables
- New app `apps/resonate-dashboard` with the above structure and components.
- Working local server with both public and overseer views.

## Next
On approval, I will scaffold the app, implement the API and components, wire to `packages/lab/reports`, and share the live preview URL and paths.