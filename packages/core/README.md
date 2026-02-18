# @yseeku/core

Core trust protocol implementation for the SONATE platform.

## Overview

This package provides the foundational trust infrastructure that all SONATE modules depend on. It implements the SONATE constitutional framework as specified at [GAMMATRIA.COM](https://gammatria.com).

## Key Features

- **Trust Protocol**: 6-principle scoring system with weighted calculations
- **Trust Receipts**: Cryptographically signed interaction records with hash chaining
- **CIQ Metrics**: Clarity, Integrity, Quality measurement framework
- **Ed25519 Signatures**: High-performance digital signatures
- **Hash Chaining**: Immutable audit trails

## Installation

```bash
npm install @yseeku/core
```

## Usage

### Calculate Trust Score

```typescript
import { TrustProtocol, SonateScorer } from '@yseeku/core';

const scorer = new SonateScorer();
const score = scorer.scoreInteraction({
  user_consent: true,
  ai_explanation_provided: true,
  decision_auditability: true,
  human_override_available: true,
  disconnect_option_available: true,
  moral_agency_respected: true,
  reasoning_transparency: 8,
  ethical_considerations: ['privacy', 'fairness'],
});

console.log(score.overall); // e.g., 9.2
console.log(score.violations); // []
```

### Generate Trust Receipt

```typescript
import { TrustReceipt } from '@yseeku/core';
import { generateKeyPair } from '@yseeku/core';

const { privateKey, publicKey } = await generateKeyPair();

const receipt = new TrustReceipt({
  version: '1.0.0',
  session_id: 'uuid-here',
  timestamp: Date.now(),
  mode: 'constitutional',
  ciq_metrics: {
    clarity: 0.85,
    integrity: 0.92,
    quality: 0.88,
  },
});

await receipt.sign(privateKey);
console.log(receipt.toJSON());

// Verify later
const isValid = await receipt.verify(publicKey);
```

### Hash Chaining

```typescript
import { TrustReceipt, genesisHash } from '@yseeku/core';

// First receipt
const receipt1 = new TrustReceipt({
  version: '1.0.0',
  session_id: 'session-123',
  timestamp: Date.now(),
  mode: 'constitutional',
  ciq_metrics: { clarity: 0.8, integrity: 0.9, quality: 0.85 },
  previous_hash: genesisHash('session-123'),
});

// Second receipt (chained)
const receipt2 = new TrustReceipt({
  version: '1.0.0',
  session_id: 'session-123',
  timestamp: Date.now(),
  mode: 'constitutional',
  ciq_metrics: { clarity: 0.82, integrity: 0.91, quality: 0.86 },
  previous_hash: receipt1.self_hash, // Links to previous
});

// Verify chain
console.log(receipt2.verifyChain(receipt1)); // true
```

## The 6 Trust Principles

1. **Consent Architecture** (25%, Critical): Users explicitly consent and understand implications
2. **Inspection Mandate** (20%): All decisions are inspectable and auditable
3. **Continuous Validation** (20%): Behavior continuously validated against principles
4. **Ethical Override** (15%, Critical): Humans can override on ethical grounds
5. **Right to Disconnect** (10%): Users can disconnect without penalty
6. **Moral Recognition** (10%): AI recognizes human moral agency

## Specification Compliance

This implementation follows the specifications at:
- [Trust Receipt Schema](https://gammatria.com/schemas/trust-receipt)
- [Governance Protocol](https://gammatria.com/whitepapers/governance-protocol)
- [CIQ Metrics](https://gammatria.com/metrics/ciq)

## API Reference

### Classes

- `TrustProtocol`: Calculate and validate trust scores
- `TrustReceipt`: Create and verify cryptographic receipts
- `SonateScorer`: Score interactions against 6 principles

### Functions

- `hashChain()`: Create hash chain links
- `signPayload()`: Sign data with Ed25519
- `verifySignature()`: Verify Ed25519 signatures
- `generateKeyPair()`: Generate Ed25519 key pairs

### Constants

- `TRUST_PRINCIPLES`: The 6 principles with weights and criticality

## License

MIT
### Boundary Summary

- Allowed: Protocol logic (6-principle trust algorithm, trust receipts, hashing, signatures, CIQ metrics)
- Not Allowed: UI components, production monitoring logic, orchestration workflows, experiments
- Import Example: `import { TrustProtocol, hashChain } from '@yseeku/core'`

All SONATE trust scores MUST use `TrustProtocol` with 0–10 inputs and weights from `TRUST_PRINCIPLES`.

## Testing

- Core tests use a custom runner with coverage enforcement:
  - Run: `npm run test` from `packages/core`
  - Builds TypeScript and executes `dist/tests/run-tests.js` under `c8` with thresholds:
    - Lines ≥ 90%, Statements ≥ 90%, Functions ≥ 80%, Branches ≥ 80%
- Focused Jest tests can be run for specific suites:
  - Crypto (Ed25519 via Node crypto):  
    `npx jest --config jest.config.js --runTestsByPath src/__tests__/crypto.spec.ts`
- Coverage configuration is defined in `packages/core/package.json` and targets the custom runner execution paths to ensure deterministic, fast coverage checks across core modules (errors, validators, signatures, performance, trust protocol, trust receipts, resonance metrics, and enhanced trust scoring).
