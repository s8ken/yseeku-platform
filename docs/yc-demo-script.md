# YC Demo Script (10 minutes)

## Goal
Show one clear wedge: verifiable governance artifacts for AI interactions (trust receipts) with real-time monitoring and incident response.

## 0. Setup (before you start recording)
- Start backend + web.
- Enable demo mode.
- Open three tabs:
  - Dashboard overview
  - Live Monitor
  - Receipts (and Verify)

## 1) Flow A — Generate a receipt (2–3 min)
**Narrative:** “Every AI interaction produces a tamper-evident trust receipt you can audit later.”

- Go to Chat (or demo page) and run an interaction.
- Show the trust evaluation output.
- Generate/mint a receipt.
- Open Receipts list and show the newest receipt.

**Say out loud:**
- “This receipt is a structured artifact: timestamped, hash chained, and signed. It can be verified independently.”

## 2) Flow B — Verify and audit (2–3 min)
**Narrative:** “We can verify integrity and provenance, not just display a score.”

- Copy the receipt hash.
- Go to Verify.
- Verify by hash and show: valid/invalid, signature/hash checks, and any DB lookup.

**Say out loud:**
- “Scores are useful, but verification is what makes governance defensible.”

## 3) Flow C — Real-time monitoring + incident response (3–4 min)
**Narrative:** “When trust degrades, the system generates alerts and routes them to humans/tools.”

- Go to Live Monitor.
- Trigger a trust violation scenario (or load one).
- Show:
  - Trust event in the feed
  - Alert creation
  - Webhook delivery history (if configured)

**Say out loud:**
- “This is designed for teams running AI agents in production: monitoring, evidence, and response.”

## 4) Close (30–60 sec)
- “We start with one integration and one workflow: ingest → score → receipt → alert → report.”
- “Near-term: calibrate heuristics on labeled datasets and expand integrations.”

## Notes (keep credibility)
- If a metric is heuristic, call it a heuristic.
- Avoid claiming embedding cosine similarity unless the path truly uses embeddings.

