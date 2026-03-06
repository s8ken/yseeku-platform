# Contributing to YSEEKU Platform

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Package Guide](#package-guide)
- [Testing](#testing)
- [Code Standards](#code-standards)
- [Commit & PR Conventions](#commit--pr-conventions)

---

## Architecture Overview

The repository is a **npm workspace monorepo** managed with **Turborepo**. It implements three layers:

```
Layer 1 — SONATE Protocol (packages/)   Open standard for AI verification
Layer 2 — YSEEKU Platform (apps/)       Enterprise orchestration & dashboards
Layer 3 — SYMBI Research (symbi-*)      Experimental governance research
```

### Package dependency graph

```
@sonate/schemas          (shared types, no dependencies)
    └── @sonate/core     (trust protocol, receipts, scoring)
        ├── @sonate/detect      (drift, emergence, Bedau Index)
        ├── @sonate/lab         (A/B testing, experiments)
        ├── @sonate/orchestrate (RBAC, DID/VC, audit)
        ├── @sonate/persistence (database adapters)
        └── @sonate/policy      (constitutional principle enforcement)

apps/backend   (Express API — depends on all packages above)
apps/web       (Next.js dashboard — depends on @sonate/core)
sonate-receipt (standalone npm-published SDK)
```

Turborepo respects this graph automatically via `"dependsOn": ["^build"]` in `turbo.json`. **Do not break the graph** by importing a downstream package into an upstream one.

---

## Getting Started

### Prerequisites

- **Node.js 20.x** — enforced by `engines` field in `package.json`
- **npm 10.x** — this repo uses npm, not pnpm or yarn
- **MongoDB 6+** — required for the backend API

The fastest way to get MongoDB running locally is Docker:

```bash
docker compose up -d mongo
```

This starts only the MongoDB service from `docker-compose.yml`. Alternatively use [MongoDB Atlas free tier](https://www.mongodb.com/atlas).

### First-time setup

```bash
# 1. Clone
git clone https://github.com/s8ken/yseeku-platform.git
cd yseeku-platform

# 2. Install all dependencies (always run from repo root — never inside apps/* or packages/*)
npm install

# 3. Set up backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — at minimum set MONGODB_URI and JWT_SECRET

# 4. Start the full dev stack
npm run dev
```

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | Next.js with hot reload |
| Backend API | http://localhost:3001 | Express with ts-node |
| Prometheus metrics | http://localhost:3001/metrics | Optional |

### Running services independently

```bash
# Backend only
npm run dev --workspace=apps/backend

# Frontend only
npm run dev --workspace=web

# A single package in watch mode
npm run dev --workspace=@sonate/core
```

---

## Development Workflow

### Building

Turborepo handles dependency ordering automatically:

```bash
# Build everything (recommended)
npm run build

# Build only packages (no apps)
npm run build:packages

# Build backend only
npm run build:backend
```

> Do not use `build:vercel` locally — it is a Vercel CI-specific script.

### Adding a new package

1. Create `packages/<name>/` with a `package.json` using the name `@sonate/<name>`.
2. Add `"@sonate/<name>": "*"` to any package that depends on it.
3. Run `npm install` from the repo root to link workspaces.
4. Add a `build` script in the new package (`tsc` is standard).
5. Turborepo will automatically include it in the build graph.

### Environment variables

All required and optional vars are documented in `apps/backend/.env.example`. Key variables:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | Database connection |
| `JWT_SECRET` | Yes | Auth token signing (generate: `openssl rand -hex 64`) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing |
| `ANTHROPIC_API_KEY` | No | Enables LLM-based resonance scoring (replaces heuristic fallback) |
| `OPENAI_API_KEY` | No | Enables semantic embedding similarity for drift detection |
| `PINATA_JWT` | No | Required for "Pin to IPFS" audit bundle feature |
| `SONATE_PUBLIC_KEY` / `SONATE_PRIVATE_KEY` | No | Enables cryptographic receipt signing |

---

## Package Guide

| Package | Responsibility | Key exports |
|---------|---------------|-------------|
| `@sonate/schemas` | Shared Zod schemas and TypeScript types | `TrustReceiptSchema`, `AgentSchema` |
| `@sonate/core` | SONATE protocol engine, trust receipts, principle scoring | `SOANTEClient`, `TrustReceipt`, `PrincipleEvaluator` |
| `@sonate/detect` | Drift detection (K-S test), Bedau emergence index, reality monitoring | `DriftDetector`, `BedauIndex`, `ResonanceScorer` |
| `@sonate/lab` | A/B experiments, statistical analysis, multi-agent scenarios | `ExperimentRunner`, `StatisticsEngine` |
| `@sonate/orchestrate` | Production orchestration, DID/VC, RBAC, audit trails | `Overseer`, `RBACManager`, `AuditLogger` |
| `@sonate/persistence` | Database adapters (MongoDB) | `AgentRepository`, `ReceiptRepository` |
| `@sonate/policy` | Constitutional principle enforcement, compliance rules | `PolicyEngine`, `ComplianceChecker` |
| `sonate-receipt` | Standalone MIT-licensed verification SDK (published to npm) | `SONATE` default export |

---

## Testing

### Running tests

```bash
# All package tests (unit + integration)
npm test

# Backend tests (not included in the above — run separately)
npm test --workspace=apps/backend

# A specific package
npm test --workspace=@sonate/core

# With coverage
npm run test:coverage --workspace=@sonate/core

# E2E (requires both services running)
npm run test:e2e
```

> **Note:** `npm test` at the root runs packages only. Always run `npm test --workspace=apps/backend` before submitting backend changes.

### Writing tests

- Packages use **Vitest** (configured per-package).
- Backend uses **Jest** with the config in `apps/backend`.
- Place unit tests in `src/__tests__/` within the relevant package.
- Integration tests live in `tests/` at the repo root.
- Aim to maintain the existing coverage thresholds (see each package's `test` script for specifics).

---

## Code Standards

### Formatting & linting

```bash
# Format all source files
npm run format

# Lint
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Type check without emitting
npm run typecheck
```

The pre-commit hook runs `npm run quality` (lint + format check + security audit). Do not bypass it with `--no-verify`.

### TypeScript

- All packages compile with `tsc` — no `any` types without a comment explaining why.
- Shared types belong in `@sonate/schemas`, not duplicated across packages.
- Avoid importing from a package's internal files; use its declared public exports.

### Security

```bash
# Run security audit
npm run security

# Auto-fix low-risk audit issues
npm run security:fix
```

Do not commit code with moderate or higher severity audit findings unaddressed.

---

## Commit & PR Conventions

### Commit messages

Use the imperative mood. Format: `<type>: <short description>`

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that is neither a fix nor a feature |
| `test` | Adding or updating tests |
| `chore` | Build scripts, dependency updates, tooling |

Examples:
```
feat: add webhook retry logic with exponential backoff
fix: correct trust score threshold in HumanReadableSummary
docs: document PINATA_JWT environment variable
```

Keep the subject line under 72 characters. Add a body if the "why" is not obvious.

### Branch naming

```
feat/<short-description>
fix/<short-description>
docs/<short-description>
```

### Pull requests

- PRs must pass CI (lint, typecheck, tests) before review.
- Include a description of what changed and why.
- Reference any related issues with `Closes #<issue>`.
- Keep PRs focused — one concern per PR.
- Backend changes require `npm test --workspace=apps/backend` to pass.

### Pre-push checklist

```bash
npm run lint
npm run typecheck
npm test
npm test --workspace=apps/backend
```
