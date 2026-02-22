# @sonate/trust-receipts-python

Python SDK for SONATE Trust Receipts - identical behavior to JavaScript SDK.

## Install

```bash
pip install sonate-trust-receipts
```

## Quick Start

```python
import asyncio
from sonate.trust_receipts import TrustReceipts, WrapOptions
import anthropic

async def main():
    receipts = TrustReceipts(private_key="your-private-key-hex")
    
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": "Explain quantum computing."}]
    
    response, receipt = await receipts.wrap(
        lambda: client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=messages
        ),
        WrapOptions(session_id="user-123", input=messages)
    )
    
    print(f"Receipt Hash: {receipt.receipt_hash}")

asyncio.run(main())
```

## Features

- Ed25519 Signing
- SHA-256 Hashing  
- RFC 8785 Canonicalization
- Hash Chaining
- Privacy Mode (hash-only receipts)
- Zero-Backend Verification
- Cross-Language Compatibility with JavaScript SDK

See README.md in JavaScript package for full documentation.
