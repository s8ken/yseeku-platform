# Contributing

## Installs & Workspace
- Run `npm install` only at the repository root to maintain a single lockfile.
- Do not run `npm install` inside `apps/*` or `packages/*`.

## Build & Test
- Use `npm run build` and `npm run build:backend` from root.
- Run unit tests via `npm run test`; E2E via `npm run test:e2e`.

## Formatting & Linting
- Format: `npm run format` (covers `packages/*` and `apps/*`).
- Lint: `npm run lint`.

## CI Considerations
- Turbo telemetry is disabled in CI via `TURBO_TELEMETRY_DISABLED=1`.
