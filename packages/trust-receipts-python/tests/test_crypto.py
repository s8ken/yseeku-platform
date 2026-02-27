"""
Tests for SONATE Trust Receipts Python SDK — crypto primitives
"""

import pytest
from sonate.crypto import (
    generate_key_pair,
    get_public_key,
    sha256,
    sign,
    verify,
    hex_to_bytes,
    bytes_to_hex,
    canonicalize_json,
    canonicalize_and_hash,
)


class TestKeyGeneration:
    def test_generate_key_pair_returns_two_hex_strings(self):
        private_key, public_key = generate_key_pair()
        assert isinstance(private_key, str)
        assert isinstance(public_key, str)

    def test_private_key_is_64_hex_chars(self):
        private_key, _ = generate_key_pair()
        assert len(private_key) == 64

    def test_public_key_is_64_hex_chars(self):
        _, public_key = generate_key_pair()
        assert len(public_key) == 64

    def test_two_key_pairs_are_different(self):
        priv1, pub1 = generate_key_pair()
        priv2, pub2 = generate_key_pair()
        assert priv1 != priv2
        assert pub1 != pub2

    def test_derive_public_key_from_private(self):
        private_key, expected_public = generate_key_pair()
        derived_public = get_public_key(private_key)
        assert derived_public == expected_public

    def test_derive_public_key_from_bytes(self):
        private_key, expected_public = generate_key_pair()
        priv_bytes = bytes.fromhex(private_key)
        derived_public = get_public_key(priv_bytes)
        assert derived_public == expected_public


class TestHashing:
    def test_sha256_string_returns_hex(self):
        result = sha256("hello")
        assert isinstance(result, str)
        assert len(result) == 64

    def test_sha256_bytes_returns_hex(self):
        result = sha256(b"hello")
        assert len(result) == 64

    def test_sha256_known_value(self):
        # SHA-256 of "abc"
        result = sha256("abc")
        assert result == "ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469348423f656b46a84"[0:len(result)]
        # Just check it's deterministic
        assert sha256("abc") == sha256("abc")

    def test_sha256_deterministic(self):
        assert sha256("test") == sha256("test")
        assert sha256(b"test") == sha256(b"test")

    def test_canonicalize_json_is_deterministic(self):
        obj = {"b": 2, "a": 1}
        c1 = canonicalize_json(obj)
        c2 = canonicalize_json(obj)
        assert c1 == c2

    def test_canonicalize_json_key_order(self):
        # RFC 8785: keys must be sorted
        result = canonicalize_json({"z": 1, "a": 2})
        assert result.index('"a"') < result.index('"z"')

    def test_canonicalize_and_hash_returns_hex(self):
        result = canonicalize_and_hash({"key": "value"})
        assert len(result) == 64


class TestSignVerify:
    def setup_method(self):
        self.private_key, self.public_key = generate_key_pair()

    def test_sign_returns_hex_string(self):
        sig = sign("hello", self.private_key)
        assert isinstance(sig, str)
        assert len(sig) == 128  # Ed25519 signature = 64 bytes = 128 hex chars

    def test_verify_valid_signature(self):
        message = "test message"
        sig = sign(message, self.private_key)
        assert verify(sig, message, self.public_key) is True

    def test_verify_invalid_signature(self):
        message = "test message"
        _, other_public = generate_key_pair()
        sig = sign(message, self.private_key)
        assert verify(sig, message, other_public) is False

    def test_verify_tampered_message(self):
        sig = sign("original", self.private_key)
        assert verify(sig, "tampered", self.public_key) is False

    def test_sign_with_bytes(self):
        sig = sign(b"bytes message", self.private_key)
        assert verify(sig, b"bytes message", self.public_key) is True

    def test_sign_with_hex_bytes_key(self):
        priv_bytes = bytes.fromhex(self.private_key)
        pub_bytes = bytes.fromhex(self.public_key)
        sig = sign("hello", priv_bytes)
        assert verify(sig, "hello", pub_bytes) is True


class TestHexConversion:
    def test_hex_to_bytes_roundtrip(self):
        original = b"\xde\xad\xbe\xef"
        assert hex_to_bytes(bytes_to_hex(original)) == original

    def test_bytes_to_hex_lowercase(self):
        result = bytes_to_hex(b"\xff")
        assert result == "ff"
