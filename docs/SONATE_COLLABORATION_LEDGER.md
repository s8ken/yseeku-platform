# SONATE Collaboration Ledger v0.1 — Git for Multi‑Agent Work

## Purpose
Verifiable provenance for agent collaboration using cryptographic identities, content‑addressed work units, signed human decision checkpoints, and a Merkle aggregation over the workflow. This replaces “relationship contracts” with technical proofs: identity ≠ relationship, work ≠ bond, trust ≠ emotion.

## Concepts
- Agent Attestation: cryptographic identity + capability metadata
- Work Unit: atomic contribution (hashes, agent, branch, parent link)
- Decision Checkpoint: signed human approval/modification/delegation
- Project Manifest: portable `.sonate` JSON with `merkleRoot` and proofs

## Git Metaphor
- commit → logWorkUnit
- merge → logDecision
- blame → verifyWorkUnit
- clone → exportToPortable

## Types
- `AgentAttestation` with verification method (provider_signed | local_key | audit)
- `WorkUnit` with `parentWorkId` and `branchId` for explicit branching
- `DecisionCheckpoint` with `humanSignature`
- `ProjectManifest` with `merkleRoot` and per‑entry `merkleProofs`

## Hashing & Merkle
- Leaf hashing: deterministic JSON → SHA‑256 buffer
- Tree: level concatenation + SHA‑256, emits `getRoot()` and `getProof(leaf)`
- Proof verification: recompute path against `merkleRoot` (use `merkletreejs` or built‑in verifier)

## Context Hydration
`hydrateContext(strategy, tokenLimit)`
- `full`: raw prompt/response pairs (small chains)
- `summary`: compact per‑unit summaries from metadata
- `decision_path`: only units leading to `accept` decisions

## Liability Shield (Enterprise)
Use `DecisionCheckpoint.humanSignature` over a specific output hash. This creates a defensible audit trail: “Human Manager approved artifact X at time T”, aligning with EU AI Act governance.

## Storage & Anchors
- Ledger keeps hashes + minimal metadata
- Vault stores encrypted content (Lit Protocol recommended)
- Optional on‑chain anchor stores `merkleRoot` cheaply (L2/Solana)

## Manifest (.sonate)
Portable JSON containing participants, sanitized work units, decisions, `merkleRoot`, and `merkleProofs`. Do not embed full content; store in Vault and reference.

## Usage (Monorepo)
- Build: `npm run build --workspace @sonate/collaboration-ledger`
- Test: `npm run test --workspace @sonate/collaboration-ledger`
- Demo: `npm run demo:ledger` (writes `examples/ledger-demo/project-001.sonate`)

## Example Flow
1. Register agents (Claude/GPT)
2. Log branches (`branchId`: main, experiment‑a)
3. Human `accept` on target work unit
4. Export `manifest` and vault access tokens
5. Verify proofs and attestation signatures

## References
- Merkle proofs: merkletreejs (JS library for tree + verification)
- Lit Protocol: decentralized programmable encryption and key management for Vaults

## Roadmap
- Signature verification (ECDSA/Ed25519) for humans/agents
- Lit Protocol vault integration
- On‑chain anchor contract and SDK helpers
- Synergy UI: live stream, proofs viewer, export controls
