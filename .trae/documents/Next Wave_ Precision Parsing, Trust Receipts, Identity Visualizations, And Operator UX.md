## Goals
- Strengthen data fidelity (turn segmentation, identity stability per turn) and governance (cryptographic trust receipts) while elevating the operator experience (filters/search, SIEM export, golden/emergence badges).

## 1) Precision Turn Parsing (Claude/ChatGPT/Grok/Wolfram)
- Add system‑specific parsers in `packages/lab/src/parsers/`:
  - `claude.parser.ts`, `chatgpt.parser.ts`, `grok.parser.ts`, `wolfram.parser.ts`
  - Extract alternating turns: role, timestamp, content; strip hydration/boilerplate; decode quoted‑printable.
- Integrate into `enhanced-archive-analyzer.ts` with a system → parser map and robust fallback.
- Tests: realistic `.mhtml/.html` fixtures to validate alternation, content extraction, and quote capture.

## 2) Identity Stability Per Turn + Export
- Extend `ConversationalMetrics.recordTurn(...)` to accumulate per‑turn identity similarity values.
- Export arrays: `identityStabilitySeries` and `velocitySeries` in `archive-analysis-report.json` per conversation.
- Update generator in `run-full-archive-review.js` to persist series and golden flags.

## 3) Golden/Emergence Criteria (Production Aligned)
- Golden: `resonance BREAKTHROUGH present` AND `realityIndexAvg ≥ 7.5` AND `trustProtocolRates.PASS ≥ 1` AND `maxVelocity < 1.2`.
- Emergence marker: sustained resonance (≥9.0) across ≥3 consecutive AI turns with low volatility.
- Persist to JSON; display badges in Overseer list and case detail header.

## 4) Cryptographic Trust Receipts (SYMBI)
- Add trust receipt generation in detect/orchestrate:
  - Content hash (SHA‑256), Ed25519 signature, timestamp, event type, compliance weights (6 trust principles), final trust score (0–1).
- One‑click verify API:
  - `apps/web/src/app/api/receipts/verify/route.ts` accepts receipt → verifies hash/signature, returns `verifiable: true/false` and details.
- Dashboard UI: show receipt JSON and a “Verify” button in case detail.

## 5) SIEM/Alert Export
- Add endpoint `apps/web/src/app/api/alerts/export/route.ts` to emit red/critical cases with file/system/reasons/quotes and velocity/identity context as NDJSON.
- Button on Overseer to download filtered alerts.

## 6) Operator UX: Filters, Search, Breadcrumbs
- FilterBar (system, priority, golden) and SearchBox (file/reasons) on `/overseer`.
- Persist selection in query params; case detail reads params and provides breadcrumb “Back to filtered list”.

## 7) Identity & Velocity Visualizations
- Case Detail: identity stability sparkline (0–1 scale) next to velocity sparkline.
- Threshold guides (2.0/3.2/4.5/5.5 bands) rendered as subtle grid lines.

## 8) Performance & Hygiene
- Lazy load CSV/JSON and cache results server‑side; avoid loading Archives; keep `Archives/` excluded in `.gitignore`.
- Ensure PII guardrail (skip keyword scans <300 words) persists.

## 9) Documentation
- Extend README with Trust Receipts section, verify API snippet, SIEM export example, and reconciled golden/emergence definitions.

## Deliverables
- New parsers and tests; updated analysis report with per‑turn series and badges.
- Trust receipts generation + verify route; Overseer UI updates (filters/search, badges, identity sparkline).
- SIEM export route and download in UI.

## Verification
- Re-run full archive analysis; spot‑check multi‑system parsing; confirm identity/velocity series render accurately in case pages.
- Verify trust receipts with Ed25519 keys; confirm hash mismatch returns `verifiable: false`.
- Export alerts; validate NDJSON payloads in a SIEM importer.
