"""
Cryptographic utilities for SONATE Trust Receipts

Provides Ed25519 signing/verification, SHA-256 hashing,
and RFC 8785 JSON canonicalization.
"""

import hashlib
from typing import Tuple, Union
from nacl import signing, utils
import json_canonicalize


def sha256(data: Union[str, bytes]) -> str:
    """SHA-256 hash of data"""
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def canonicalize_json(obj: any) -> str:
    """RFC 8785 JSON canonicalization"""
    return json_canonicalize.canonicalize(obj)


def canonicalize_and_hash(obj: any) -> str:
    """Canonicalize object and hash with SHA-256"""
    canonical = canonicalize_json(obj)
    return sha256(canonical)


def generate_key_pair() -> Tuple[str, str]:
    """Generate new Ed25519 key pair"""
    private_key = signing.SigningKey.generate()
    private_hex = private_key.encode(encoder=utils.HexEncoder).decode('ascii')
    public_hex = private_key.verify_key.encode(encoder=utils.HexEncoder).decode('ascii')
    return private_hex, public_hex


def get_public_key(private_key: Union[str, bytes]) -> str:
    """Derive public key from private key"""
    if isinstance(private_key, str):
        private_key = bytes.fromhex(private_key)
    
    signing_key = signing.SigningKey(private_key)
    return signing_key.verify_key.encode(encoder=utils.HexEncoder).decode('ascii')


def sign(message: Union[str, bytes], private_key: Union[str, bytes]) -> str:
    """Sign message with Ed25519 private key"""
    if isinstance(message, str):
        message = message.encode('utf-8')
    if isinstance(private_key, str):
        private_key = bytes.fromhex(private_key)
    
    signing_key = signing.SigningKey(private_key)
    signed_msg = signing_key.sign(message)
    return signed_msg.signature.hex()


def verify(signature: Union[str, bytes], message: Union[str, bytes], public_key: Union[str, bytes]) -> bool:
    """Verify Ed25519 signature"""
    if isinstance(signature, str):
        signature = bytes.fromhex(signature)
    if isinstance(message, str):
        message = message.encode('utf-8')
    if isinstance(public_key, str):
        public_key = bytes.fromhex(public_key)
    
    try:
        verify_key = signing.VerifyKey(public_key)
        verify_key.verify(message, signature)
        return True
    except Exception:
        return False


def hex_to_bytes(hex_string: str) -> bytes:
    """Convert hex string to bytes"""
    return bytes.fromhex(hex_string)


def bytes_to_hex(data: bytes) -> str:
    """Convert bytes to hex string"""
    return data.hex()
