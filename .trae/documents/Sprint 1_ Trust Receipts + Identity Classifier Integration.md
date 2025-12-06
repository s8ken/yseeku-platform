## Objectives
- Implement end‑to‑end cryptographic trust receipts for analyzed conversations and enable one‑click verification in the dashboard.
- Replace the heuristic identity overlap with a per‑turn identity coherence classifier and expose identity stability series to the UI.

## Scope & Changes
### Trust Receipts (SYMBI)
- Receipt schema (per AI turn):
  - `receiptId`, `timestamp`, `eventType` (ai_generation|ai_action)
  - `contentHash` (SHA‑256 of normalized content), `signature` (Ed25519), `verifiable: boolean`
  - `did` (issuer: `did:key:...`), `vcRef` (optional link to VC registry)
  - `trustPrinciples`: { consent, inspection, validation, override, disconnect, recognition }
  - `trustScore` (0.0–1.0) with −0.1 penalties for CRITICAL violations (consent/override)
- Generation:
  - Lab/detect pipeline adds receipt creation per AI turn and stores it in `archive-analysis-report.json` under each conversation.
- Verification:
  - Implement real signature verification using Ed25519 public key (configurable) and SHA‑256 content hash.
  - Replace stub in `/api/receipts/verify` with actual verification.
- Dashboard:
  - Case detail page: show receipt preview (first turn + latest), and a “Verify” button calling `/api/receipts/verify`.

### Identity Coherence Classifier
- Identity vector extraction per AI turn:
  - Feature set: persona claims (e.g., "as an AI"), role markers, tone indicators (helpful/empathetic/professional), governance language (verification/boundaries), and colloquials.
  - Embed as weighted vector and compute cosine similarity versus session persona baseline (first 2–3 AI turns or provided persona).
- Output:
  - `identityStabilitySeries` with similarity ∈ [0,1] per turn, replacing overlap proxy.
  - Update flags: yellow ≤ 0.85, red ≤ 0.75, critical ≤ 0.65 (already adopted in v2.4), sourced from classifier values.
- Dashboard:
  - Case detail identity sparkline uses classifier series; add thresholds as subtle guides.

## Implementation Plan
1. Add `packages/lab/src/receipts/`:
   - `trust-receipt.ts`: schema, createReceipt(content, principleScores, signer)
   - `signing.ts`: Ed25519 sign/verify utilities; config for public/private key (demo keys)
   - `principles.ts`: weighted scoring + penalties; map from detector outputs to principle scores
2. Integrate receipts in analysis:
   - In `run-full-archive-review.js`, generate a receipt for each AI turn and append to the conversation object (store limited set for report size: first, last, and any failing trust receipts).
3. Implement `/api/receipts/verify` fully:
   - Verify SHA‑256 of normalized content and Ed25519 signature; return `verifiable`, `hashOk`, `signatureOk`.
4. Identity classifier:
   - Add `packages/lab/src/identity/identity-classifier.ts`: extract features → vector; baseline persona → cosine similarity.
   - Replace overlap proxy with classifier output when building `identityStabilitySeries`.
5. Dashboard updates:
   - Case detail header: badges for golden/emergence + trust receipt preview + Verify button.
   - Identity sparkline uses classifier series; add fixed grid lines (0.85/0.75/0.65).

## Data, Config & Security
- Keys: store Ed25519 demo public/private in dev config; in production, inject keys via env.
- Normalization: canonicalize content before hashing (strip HTML, entities, whitespace normalization).
- Privacy: do not persist raw secrets/PII in receipts; store hashes and minimal content.

## Verification
- Re-run full archive analysis; confirm receipts generated where applicable and classifier series populated.
- Validate `/api/receipts/verify` with sample receipts (valid/invalid signatures).
- Visually check case detail identity and velocity sparklines; ensure thresholds align.

## Deliverables
- Receipt utilities, integrated analysis, and verification API.
- Identity classifier module and updated series in reports.
- Dashboard case detail with trust receipts preview + verify; upgraded identity visualization.
- Updated docs in README (Trust Receipts section and identity coherence notes).

## Timeline & Risks
- Parser fidelity affects classifier inputs; mitigate by robust normalization and fallback features.
- Demo keys suitable for local; production requires secure key management.
- Report size management: include receipt summaries (IDs, hashes, verifiable flag) rather than full content.