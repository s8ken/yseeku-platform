"""
SONATE Trust Receipts Python SDK
=================================

Cryptographically sign and verify AI interactions.

Installation:
    pip install sonate-trust-receipts

Quick Start:
    from sonate.trust_receipts import TrustReceipts
    import anthropic

    receipts = TrustReceipts(private_key=os.environ['SONATE_PRIVATE_KEY'])
    
    client = anthropic.Anthropic()
    messages = [{"role": "user", "content": "Explain quantum computing."}]
    
    async with receipts.wrap(
        lambda: client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=messages
        ),
        session_id="user-123",
        input=messages
    ) as (response, receipt):
        print(response.content[0].text)
        print(f"Receipt: {receipt.receipt_hash}")
"""

__version__ = "1.0.0"
__author__ = "SONATE"
__license__ = "MIT"

from .trust_receipt import TrustReceipt, TrustReceiptData, SignedReceipt
from .wrapper import TrustReceipts, WrapOptions, WrappedResponse
from .crypto import (
    generate_key_pair,
    hex_to_bytes,
    bytes_to_hex,
    get_public_key,
    sha256,
    sign,
    verify,
)

__all__ = [
    "TrustReceipt",
    "TrustReceiptData",
    "SignedReceipt",
    "TrustReceipts",
    "WrapOptions",
    "WrappedResponse",
    "generate_key_pair",
    "hex_to_bytes",
    "bytes_to_hex",
    "get_public_key",
    "sha256",
    "sign",
    "verify",
]
