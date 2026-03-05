# SONATE Trust Receipt — SSL/TLS for AI

[![npm version](https://img.shields.io/npm/v/sonate-receipt.svg?style=flat-square)](https://www.npmjs.com/package/sonate-receipt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SONATE** is the verification protocol for AI systems. This package provides the official client library for generating, signing, and verifying cryptographic trust receipts.

## Installation

```bash
npm install sonate-receipt
```

## Quick Start (Move 2 — The Developer Moment)

### 1. Generate & Sign a Receipt
```javascript
import SONATE from 'sonate-receipt';

const client = new SONATE({ 
  privateKey: process.env.SONATE_PRIVATE_KEY 
});

// Wrap any AI interaction to create a verifiable receipt
const { response, receipt } = await client.wrap(
  () => openai.chat.completions.create({ model: 'gpt-4', messages }),
  { sessionId: 'user-123', input: messages }
);

console.log('Interaction signed:', receipt.hash);
```

### 2. Verify a Receipt
```javascript
const isValid = await client.verifyReceipt(receipt, publicKey);
console.log('Trust verified:', isValid);
```

## Features
- **Signed:** Ed25519 cryptographic signatures (RFC 8032)
- **Hash-Chained:** Every interaction linked to the previous for tamper-proof history.
- **Verifiable:** Independent verification without platform lock-in.
- **Provider-Agnostic:** Works with OpenAI, Anthropic, Gemini, or any LLM.

## SONATE Protocol Specs
This library implements the [SONATE Protocol v1.0](https://github.com/s8ken/yseeku-platform/blob/main/docs/TRUST_RECEIPT_SPECIFICATION_v1.md) spec.

---
© 2026 Stephen Aitken. Published under the [MIT License](LICENSE).
