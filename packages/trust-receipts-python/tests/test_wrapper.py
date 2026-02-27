"""
Tests for SONATE Trust Receipts Python SDK — TrustReceipts wrapper (high-level API)
"""

import pytest
from sonate import TrustReceipts, WrapOptions


@pytest.fixture
def sdk():
    return TrustReceipts()


class TestTrustReceiptsInit:
    def test_auto_generates_key_pair(self):
        sdk = TrustReceipts()
        assert sdk.private_key is not None
        assert sdk.public_key is not None

    def test_accepts_explicit_private_key(self):
        from sonate.crypto import generate_key_pair
        priv, pub = generate_key_pair()
        sdk = TrustReceipts(private_key=priv)
        assert sdk.public_key is not None

    def test_generate_key_pair_static(self):
        priv, pub = TrustReceipts.generate_key_pair()
        assert len(priv) == 64
        assert len(pub) == 64


class TestWrap:
    @pytest.mark.asyncio
    async def test_wrap_returns_response_and_receipt(self, sdk):
        async def fake_llm():
            return {"choices": [{"message": {"content": "Paris"}}]}

        result = await sdk.wrap(
            fake_llm,
            WrapOptions(
                session_id="sess-001",
                input="What is the capital of France?",
            ),
        )
        assert result.response is not None
        assert result.receipt is not None

    @pytest.mark.asyncio
    async def test_wrap_receipt_is_signed(self, sdk):
        async def fake_llm():
            return {"content": [{"text": "Hello!"}]}

        result = await sdk.wrap(
            fake_llm,
            WrapOptions(session_id="s", input="Hi"),
        )
        assert len(result.receipt.signature) == 128

    @pytest.mark.asyncio
    async def test_wrap_receipt_verifiable(self, sdk):
        async def fake_llm():
            return {"choices": [{"message": {"content": "ok"}}]}

        result = await sdk.wrap(
            fake_llm,
            WrapOptions(session_id="s", input="test"),
        )
        assert await sdk.verify_receipt(result.receipt) is True

    @pytest.mark.asyncio
    async def test_wrap_custom_scores(self, sdk):
        async def fake_llm():
            return "raw response"

        result = await sdk.wrap(
            fake_llm,
            WrapOptions(
                session_id="s",
                input="query",
                scores={"overall": 0.88, "clarity": 0.92},
                extract_response=lambda r: r,
            ),
        )
        assert result.receipt.scores["overall"] == 0.88

    @pytest.mark.asyncio
    async def test_wrap_chains_receipts(self, sdk):
        async def fake_llm():
            return "response"

        opts1 = WrapOptions(session_id="s", input="q1", extract_response=lambda r: r)
        result1 = await sdk.wrap(fake_llm, opts1)

        opts2 = WrapOptions(
            session_id="s",
            input="q2",
            extract_response=lambda r: r,
            previous_receipt=result1.receipt,
        )
        result2 = await sdk.wrap(fake_llm, opts2)
        assert result2.receipt.prev_receipt_hash == result1.receipt.receipt_hash


class TestCreateReceipt:
    @pytest.mark.asyncio
    async def test_create_receipt_manually(self, sdk):
        receipt = await sdk.create_receipt(
            session_id="sess-manual",
            prompt="prompt text",
            response="response text",
            scores={"overall": 0.9},
        )
        assert receipt.session_id == "sess-manual"
        assert len(receipt.signature) == 128

    @pytest.mark.asyncio
    async def test_created_receipt_verifiable(self, sdk):
        receipt = await sdk.create_receipt(
            session_id="s",
            prompt="p",
            response="r",
        )
        assert await sdk.verify_receipt(receipt) is True


class TestVerifyChain:
    @pytest.mark.asyncio
    async def test_verify_valid_chain(self, sdk):
        r1 = await sdk.create_receipt(session_id="s", prompt="q1", response="a1")
        r2 = await sdk.create_receipt(session_id="s", prompt="q2", response="a2",
                                       previous_receipt=r1)
        r3 = await sdk.create_receipt(session_id="s", prompt="q3", response="a3",
                                       previous_receipt=r2)

        result = await sdk.verify_chain([r1, r2, r3])
        assert result["valid"] is True
        assert result["errors"] == []

    @pytest.mark.asyncio
    async def test_verify_broken_chain(self, sdk):
        r1 = await sdk.create_receipt(session_id="s", prompt="q1", response="a1")
        r2 = await sdk.create_receipt(session_id="s", prompt="q2", response="a2")
        # r2 not linked to r1 (no previous_receipt)

        result = await sdk.verify_chain([r1, r2])
        assert result["valid"] is False
        assert len(result["errors"]) > 0
