# @sonate/core

Core trust protocol implementation for the SONATE platform.

## Overview

This package provides the foundational trust infrastructure that all SONATE modules depend on. It implements the SYMBI constitutional framework as specified at [GAMMATRIA.COM](https://gammatria.com).

## Key Features

- **Trust Protocol**: 6-principle scoring system with weighted calculations
- **Trust Receipts**: Cryptographically signed interaction records with hash chaining
- **CIQ Metrics**: Clarity, Integrity, Quality measurement framework
- **Ed25519 Signatures**: High-performance digital signatures
- **Hash Chaining**: Immutable audit trails

## Installation

```bash
npm install @sonate/core
```

## Usage

### Calculate Trust Score

```typescript
import { TrustProtocol, SymbiScorer } from '@sonate/core';

const scorer = new SymbiScorer();
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
import { TrustReceipt } from '@sonate/core';
import { generateKeyPair } from '@sonate/core';

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
import { TrustReceipt, genesisHash } from '@sonate/core';

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
- `SymbiScorer`: Score interactions against 6 principles

### Functions

- `hashChain()`: Create hash chain links
- `signPayload()`: Sign data with Ed25519
- `verifySignature()`: Verify Ed25519 signatures
- `generateKeyPair()`: Generate Ed25519 key pairs

### Constants

- `TRUST_PRINCIPLES`: The 6 principles with weights and criticality

## License

MIT
