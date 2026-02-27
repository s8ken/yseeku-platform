"""
Tests for SONATE Trust Receipts Python SDK — TrustReceipt class
"""

import pytest
from sonate.crypto import generate_key_pair
from sonate.trust_receipt import TrustReceipt, TrustReceiptData, SignedReceipt


@pytest.fixture
def key_pair():
    return generate_key_pair()


@pytest.fixture
def sample_data():
    return TrustReceiptData(
        session_id="sess-001",
        prompt="What is the capital of France?",
        response="Paris.",
        scores={"overall": 0.95, "clarity": 0.97},
        agent_id="agent-abc",
    )


class TestTrustReceiptCreation:
    def test_receipt_has_expected_fields(self, sample_data):
        r = TrustReceipt(sample_data)
        assert r.session_id == "sess-001"
        assert r.agent_id == "agent-abc"
        assert isinstance(r.prompt_hash, str) and len(r.prompt_hash) == 64
        assert isinstance(r.response_hash, str) and len(r.response_hash) == 64
        assert isinstance(r.receipt_hash, str) and len(r.receipt_hash) == 64
        assert isinstance(r.timestamp, str)

    def test_unsigned_receipt_not_signed(self, sample_data):
        r = TrustReceipt(sample_data)
        assert not r.is_signed
        assert r.signature == ""

    def test_scores_stored_correctly(self, sample_data):
        r = TrustReceipt(sample_data)
        assert r.scores["overall"] == 0.95

    def test_content_not_stored_by_default(self, sample_data):
        r = TrustReceipt(sample_data)
        assert r.prompt_content is None
        assert r.response_content is None

    def test_content_stored_when_requested(self):
        data = TrustReceiptData(
            session_id="s",
            prompt="hello",
            response="world",
            scores={},
            include_content=True,
        )
        r = TrustReceipt(data)
        assert r.prompt_content == "hello"
        assert r.response_content == "world"

    def test_prev_receipt_hash_linked(self, sample_data):
        r1 = TrustReceipt(sample_data)
        data2 = TrustReceiptData(
            session_id="sess-001",
            prompt="Follow-up?",
            response="Yes.",
            scores={},
            prev_receipt_hash=r1.receipt_hash,
        )
        r2 = TrustReceipt(data2)
        assert r2.prev_receipt_hash == r1.receipt_hash


class TestTrustReceiptSigning:
    @pytest.mark.asyncio
    async def test_sign_marks_receipt_as_signed(self, sample_data, key_pair):
        private_key, _ = key_pair
        r = TrustReceipt(sample_data)
        await r.sign(private_key)
        assert r.is_signed
        assert len(r.signature) == 128

    @pytest.mark.asyncio
    async def test_verify_valid_signature(self, sample_data, key_pair):
        private_key, public_key = key_pair
        r = TrustReceipt(sample_data)
        await r.sign(private_key)
        assert await r.verify(public_key) is True

    @pytest.mark.asyncio
    async def test_verify_fails_with_wrong_key(self, sample_data, key_pair):
        private_key, _ = key_pair
        _, other_public = generate_key_pair()
        r = TrustReceipt(sample_data)
        await r.sign(private_key)
        assert await r.verify(other_public) is False

    @pytest.mark.asyncio
    async def test_unsigned_receipt_fails_verify(self, sample_data, key_pair):
        _, public_key = key_pair
        r = TrustReceipt(sample_data)
        assert await r.verify(public_key) is False


class TestTrustReceiptChaining:
    def test_verify_chain_correct(self, sample_data):
        r1 = TrustReceipt(sample_data)
        data2 = TrustReceiptData(
            session_id="sess-001",
            prompt="Q2",
            response="A2",
            scores={},
            prev_receipt_hash=r1.receipt_hash,
        )
        r2 = TrustReceipt(data2)
        assert r2.verify_chain(r1) is True

    def test_verify_chain_broken(self, sample_data):
        r1 = TrustReceipt(sample_data)
        data2 = TrustReceiptData(
            session_id="sess-001",
            prompt="Q2",
            response="A2",
            scores={},
            prev_receipt_hash="wrong_hash",
        )
        r2 = TrustReceipt(data2)
        assert r2.verify_chain(r1) is False


class TestSignedReceiptSerialization:
    @pytest.mark.asyncio
    async def test_to_json_produces_signed_receipt(self, sample_data, key_pair):
        private_key, _ = key_pair
        r = TrustReceipt(sample_data)
        await r.sign(private_key)
        signed = r.to_json()
        assert isinstance(signed, SignedReceipt)
        assert signed.session_id == "sess-001"
        assert len(signed.signature) == 128

    @pytest.mark.asyncio
    async def test_to_dict_excludes_none_content(self, sample_data, key_pair):
        private_key, _ = key_pair
        r = TrustReceipt(sample_data)
        await r.sign(private_key)
        d = r.to_json().to_dict()
        assert "prompt_content" not in d
        assert "response_content" not in d

    @pytest.mark.asyncio
    async def test_from_json_roundtrip(self, sample_data, key_pair):
        private_key, public_key = key_pair
        r = TrustReceipt(sample_data)
        await r.sign(private_key)
        signed = r.to_json()

        restored = TrustReceipt.from_json(signed)
        assert restored.receipt_hash == r.receipt_hash
        assert restored.session_id == r.session_id
        assert restored.signature == r.signature
        # Signature should still be verifiable
        assert await restored.verify(public_key) is True
