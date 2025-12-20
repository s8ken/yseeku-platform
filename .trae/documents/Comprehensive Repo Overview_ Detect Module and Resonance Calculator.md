## Deliverables
- A clear, structured overview of the monorepo architecture with emphasis on `packages/detect` and `packages/resonance-engine`
- A deep dive into the TypeScript resonance calculator and its evidence pipeline
- An explanation of the Python Resonance Engine, its components, and API integration
- Key data flows, thresholds, and robustness features (adversarial, stakes, stickiness, normalization)
- Pointers to tests and where each behavior is verified

## Proposed Next Steps (upon approval)
- Create a developer-facing doc in `docs/` consolidating Detect + Resonance Engine usage and integration examples
- Add two diagrams (data flow from app → detect → Python engine, and scoring composition for R_m)
- Provide a short “Quickstart” snippet showing how to call `explainableSymbiResonance` and the Python API client
- Add a small smoke test to ensure the Python service responds and TypeScript mapping remains consistent

## Scope Notes
- No code changes will be made until approved
- Documentation will reference source locations using `file_path:line` for easy navigation
- Diagrams will be lightweight ASCII or Mermaid unless you prefer PNG/SVG assets