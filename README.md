# YSEEKU Platform - SONATE

**Enterprise AI You Can Trust**

The SONATE platform provides constitutional AI governance through three integrated modules: Detect, Lab, and Orchestrate.

## Architecture

```
yseeku-platform/
├── packages/
│   ├── core/           @sonate/core - Trust protocol implementation
│   ├── detect/         @sonate/detect - Real-time detection
│   ├── lab/            @sonate/lab - Research experiments
│   └── orchestrate/    @sonate/orchestrate - Production orchestration
└── apps/
    ├── web/            React frontend (SONATE dashboard)
    └── backend/        Express API server
```

## The SONATE Modules

### @sonate/core
Core trust protocol implementing the SYMBI framework:
- 6 Trust Principles with weighted scoring
- Cryptographic Trust Receipts (SHA-256 + Ed25519)
- Hash-chained audit trails
- CIQ metrics (Clarity, Integrity, Quality)

**Specification**: https://gammatria.com

### @sonate/detect
Real-time AI detection and scoring (Production):
- 5-dimension SYMBI Framework scoring
- Reality Index (0-10)
- Trust Protocol (PASS/PARTIAL/FAIL)
- Ethical Alignment (1-5)
- Resonance Quality (STRONG/ADVANCED/BREAKTHROUGH)
- Canvas Parity (0-100)

**Use case**: Monitor production AI interactions in real-time

### @sonate/lab
Double-blind experimentation (Research):
- Controlled A/B experiments
- Multi-agent system (CONDUCTOR, VARIANT, EVALUATOR, OVERSEER)
- Statistical validation (t-tests, bootstrap CI, Cohen's d)
- Export data for publication (CSV, JSON, JSONL)

**Use case**: Prove that constitutional AI works better

### @sonate/orchestrate
Production agent management (Infrastructure):
- W3C DID/VC for agent identities
- Multi-agent workflow orchestration
- Tactical Command dashboard
- RBAC, audit logging, API keys

**Use case**: Manage AI agent fleet in production

## Quick Start

### Install Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

This starts TypeScript watchers for all packages in parallel.

### Test

```bash
npm run test
```

## Package Inter-Dependencies

```
@sonate/core (no dependencies)
    ↓
@sonate/detect (depends on core)
    ↓
@sonate/lab (depends on core + detect)

@sonate/orchestrate (depends on core only)
```

## Usage Examples

### Example 1: Real-time Detection

```typescript
import { SymbiFrameworkDetector } from '@sonate/detect';

const detector = new SymbiFrameworkDetector();
const result = await detector.detect({
  content: 'AI response here',
  context: 'User inquiry',
  metadata: { session_id: 'xyz' },
});

console.log(result.reality_index);      // 8.2
console.log(result.trust_protocol);     // 'PASS'
console.log(result.canvas_parity);      // 87
```

### Example 2: Research Experiment

```typescript
import { ExperimentOrchestrator } from '@sonate/lab';

const lab = new ExperimentOrchestrator();
const experimentId = await lab.createExperiment({
  name: 'Constitutional vs Directive',
  variants: [
    { id: 'const', mode: 'constitutional', ... },
    { id: 'dir', mode: 'directive', ... },
  ],
  test_cases: [...],
});

const results = await lab.runExperiment(experimentId);
console.log(results.statistical_analysis.p_value); // 0.023 (significant!)
```

### Example 3: Agent Orchestration

```typescript
import { AgentOrchestrator } from '@sonate/orchestrate';

const orchestrator = new AgentOrchestrator();
const agent = await orchestrator.registerAgent({
  id: 'agent-001',
  name: 'Customer Support AI',
  capabilities: ['chat', 'analyze'],
});

console.log(agent.did); // did:key:z6Mk...
```

## Hard Boundaries

### SONATE Detect (Production Only)
- ✅ Real-time monitoring of live interactions
- ❌ NO A/B testing (use Lab)
- ❌ NO synthetic experiments (use Lab)

### SONATE Lab (Research Only)
- ✅ Controlled experiments with synthetic data
- ❌ NO production data
- ❌ NO real user interactions

### SONATE Orchestrate (Infrastructure)
- ✅ Production agent management
- ❌ NO experiments (use Lab)

## Documentation

- **Core**: [packages/core/README.md](packages/core/README.md)
- **Detect**: [packages/detect/README.md](packages/detect/README.md)
- **Lab**: [packages/lab/README.md](packages/lab/README.md)
- **Orchestrate**: [packages/orchestrate/README.md](packages/orchestrate/README.md)

## The Trinity

SONATE is part of the SYMBI ecosystem:

- **SYMBI.WORLD**: Philosophy and community → https://symbi.world
- **GAMMATRIA.COM**: Research and specifications → https://gammatria.com
- **YSEEKU.COM**: Commercial platform (this repo) → https://yseeku.com

## Publishing Packages

```bash
# Build all packages
npm run build

# Publish to npm (from each package directory)
cd packages/core && npm publish --access public
cd packages/detect && npm publish --access public
cd packages/lab && npm publish --access public
cd packages/orchestrate && npm publish --access public
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT

---

**SONATE** by YSEEKU - Enterprise AI You Can Trust
