"""
SONATE Trust Receipts - Python Multi-Model Examples
"""

import asyncio
from sonate.trust_receipts import TrustReceipts, WrapOptions
import anthropic
import openai


# ============================================================================
# OPENAI EXAMPLE
# ============================================================================

async def example_openai():
    """Wrap OpenAI API calls with SONATE receipts"""
    receipts = TrustReceipts(private_key=open('.env').read().split('SONATE_PRIVATE_KEY=')[1].split('\n')[0])
    
    client = openai.AsyncOpenAI()
    messages = [{"role": "user", "content": "Explain the SONATE trust framework"}]
    
    try:
        response, receipt = await receipts.wrap(
            lambda: client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            ),
            WrapOptions(
                session_id="openai-session-1",
                input=messages,
                scores={
                    "clarity": 0.9,
                    "accuracy": 0.85,
                    "safety": 0.95,
                }
            )
        )
        
        print("OpenAI Response:", response.choices[0].message.content)
        print("Receipt Hash:", receipt.receipt_hash)
    except Exception as e:
        print("OpenAI call failed:", e)


# ============================================================================
# ANTHROPIC (CLAUDE) EXAMPLE
# ============================================================================

async def example_anthropic():
    """Wrap Claude API calls with SONATE receipts"""
    receipts = TrustReceipts(private_key=open('.env').read().split('SONATE_PRIVATE_KEY=')[1].split('\n')[0])
    
    client = anthropic.AsyncAnthropic()
    messages = [{"role": "user", "content": "What is cryptographic trust?"}]
    
    try:
        response, receipt = await receipts.wrap(
            lambda: client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1024,
                messages=messages
            ),
            WrapOptions(
                session_id="claude-session-1",
                input=messages,
                scores={
                    "clarity": 0.92,
                    "depth": 0.88,
                    "safety": 0.98,
                }
            )
        )
        
        print("Claude Response:", response.content[0].text if response.content else "")
        print("Receipt Hash:", receipt.receipt_hash)
    except Exception as e:
        print("Claude call failed:", e)


# ============================================================================
# HASH CHAINING EXAMPLE (Multi-turn conversation)
# ============================================================================

async def example_hash_chaining():
    """Build immutable conversation thread with hash chaining"""
    receipts = TrustReceipts(private_key=open('.env').read().split('SONATE_PRIVATE_KEY=')[1].split('\n')[0])
    
    client = anthropic.AsyncAnthropic()
    
    # Turn 1
    turn1_response, turn1_receipt = await receipts.wrap(
        lambda: client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=512,
            messages=[{"role": "user", "content": "What is SONATE?"}]
        ),
        WrapOptions(
            session_id="chain-conversation",
            input="What is SONATE?"
        )
    )
    
    print("Turn 1 Hash:", turn1_receipt.receipt_hash)
    
    # Turn 2 - chain to Turn 1
    turn2_response, turn2_receipt = await receipts.wrap(
        lambda: client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=512,
            messages=[
                {"role": "user", "content": "What is SONATE?"},
                {"role": "assistant", "content": turn1_response.content[0].text if turn1_response.content else ""},
                {"role": "user", "content": "How does it work?"},
            ]
        ),
        WrapOptions(
            session_id="chain-conversation",
            input="How does it work?",
            previous_receipt=turn1_receipt
        )
    )
    
    print("Turn 2 Hash:", turn2_receipt.receipt_hash)
    print("Chained to:", turn2_receipt.prev_receipt_hash)
    
    # Verify chain
    chain_valid = await receipts.verify_chain([turn1_receipt, turn2_receipt])
    print("Chain valid:", chain_valid["valid"])


# ============================================================================
# PRIVACY MODE EXAMPLE
# ============================================================================

async def example_privacy_mode():
    """Show privacy mode for sensitive/regulated use cases"""
    receipts = TrustReceipts(private_key=open('.env').read().split('SONATE_PRIVATE_KEY=')[1].split('\n')[0])
    
    client = anthropic.AsyncAnthropic()
    
    # Healthcare scenario: privacy mode (no plaintext)
    healthcare_response, healthcare_receipt = await receipts.wrap(
        lambda: client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=256,
            messages=[{"role": "user", "content": "Patient symptoms: fever, cough"}]
        ),
        WrapOptions(
            session_id="healthcare-session",
            input="Patient symptoms: fever, cough",
            include_content=False  # HIPAA-compliant: no plaintext stored
        )
    )
    
    print("Healthcare Receipt (privacy mode):")
    print(f"  prompt_hash: {healthcare_receipt.prompt_hash}")
    print(f"  response_hash: {healthcare_receipt.response_hash}")
    print(f"  prompt_content: {healthcare_receipt.prompt_content}")  # None
    
    # Public scenario: include content
    public_response, public_receipt = await receipts.wrap(
        lambda: client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=256,
            messages=[{"role": "user", "content": "Explain photosynthesis"}]
        ),
        WrapOptions(
            session_id="public-kb-session",
            input="Explain photosynthesis",
            include_content=True  # Public content: include for archival
        )
    )
    
    print("\nPublic Receipt (with content):")
    print(f"  prompt_content: {public_receipt.prompt_content}")
    print(f"  response_content: {str(public_receipt.response_content)[:100]}...")


# ============================================================================
# RUNNING EXAMPLES
# ============================================================================

async def run_all():
    print("=== OPENAI EXAMPLE ===\n")
    await example_openai()
    
    print("\n=== ANTHROPIC EXAMPLE ===\n")
    await example_anthropic()
    
    print("\n=== HASH CHAINING EXAMPLE ===\n")
    await example_hash_chaining()
    
    print("\n=== PRIVACY MODE EXAMPLE ===\n")
    await example_privacy_mode()


if __name__ == "__main__":
    asyncio.run(run_all())
