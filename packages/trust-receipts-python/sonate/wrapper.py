"""
TrustReceipts Wrapper - Main SDK class for wrapping AI calls
"""

from typing import Any, Callable, Dict, Optional, TypeVar, Generic, Coroutine
from .trust_receipt import TrustReceipt, TrustReceiptData, SignedReceipt, Scores
from .crypto import generate_key_pair, get_public_key, hex_to_bytes

T = TypeVar('T')


class WrapOptions(Generic[T]):
    """Options for wrapping an AI call"""
    
    def __init__(
        self,
        session_id: str,
        input: Any,
        agent_id: Optional[str] = None,
        previous_receipt: Optional[SignedReceipt] = None,
        metadata: Optional[Dict[str, Any]] = None,
        scores: Optional[Scores] = None,
        extract_response: Optional[Callable[[Any], Any]] = None,
        include_content: bool = False,
    ):
        self.session_id = session_id
        self.input = input
        self.agent_id = agent_id
        self.previous_receipt = previous_receipt
        self.metadata = metadata or {}
        self.scores = scores or {}
        self.extract_response = extract_response
        self.include_content = include_content


class WrappedResponse(Generic[T]):
    """Result from a wrapped AI call"""
    
    def __init__(self, response: T, receipt: SignedReceipt):
        self.response = response
        self.receipt = receipt


class TrustReceipts:
    """SONATE Trust Receipts SDK"""
    
    def __init__(
        self,
        private_key: Optional[str] = None,
        public_key: Optional[str] = None,
        default_agent_id: Optional[str] = None,
        calculate_scores: Optional[Callable[[Any, Any], Scores]] = None,
    ):
        """Initialize TrustReceipts with optional key pair"""
        self.default_agent_id = default_agent_id
        self.calculate_scores = calculate_scores
        self.private_key: Optional[bytes] = None
        self.public_key: Optional[bytes] = None
        
        if private_key:
            self.private_key = hex_to_bytes(private_key)
            if public_key:
                self.public_key = hex_to_bytes(public_key)
            else:
                self.public_key = hex_to_bytes(get_public_key(self.private_key))
        else:
            private_hex, public_hex = generate_key_pair()
            self.private_key = hex_to_bytes(private_hex)
            self.public_key = hex_to_bytes(public_hex)
    
    @staticmethod
    def generate_key_pair() -> tuple:
        """Generate new Ed25519 key pair"""
        return generate_key_pair()
    
    @staticmethod
    def _extract_response_content(response: Any) -> Any:
        """Extract text content from common AI response formats"""
        if not response or not isinstance(response, dict):
            return response
        
        if isinstance(response.get('choices'), list) and len(response['choices']) > 0:
            msg = response['choices'][0].get('message', {})
            if 'content' in msg:
                return msg['content']
        
        if isinstance(response.get('content'), list) and len(response['content']) > 0:
            if 'text' in response['content'][0]:
                return response['content'][0]['text']
        
        return response
    
    async def wrap(
        self,
        fn: Callable[[], Coroutine[Any, Any, T]],
        options: WrapOptions[T],
    ) -> WrappedResponse[T]:
        """Wrap an async AI call with trust receipt generation"""
        response = await fn()
        
        if options.extract_response:
            response_content = options.extract_response(response)
        else:
            response_content = self._extract_response_content(response)
        
        if options.scores:
            scores = options.scores
        elif self.calculate_scores:
            scores = self.calculate_scores(options.input, response_content)
        else:
            scores = {}
        
        receipt_data = TrustReceiptData(
            session_id=options.session_id,
            prompt=options.input,
            response=response_content,
            scores=scores,
            agent_id=options.agent_id or self.default_agent_id,
            prev_receipt_hash=options.previous_receipt.receipt_hash if options.previous_receipt else None,
            metadata=options.metadata,
            include_content=options.include_content,
        )
        
        receipt = TrustReceipt(receipt_data)
        await receipt.sign(self.private_key)
        
        return WrappedResponse(response, receipt.to_json())
    
    async def create_receipt(
        self,
        session_id: str,
        prompt: Any,
        response: Any,
        agent_id: Optional[str] = None,
        previous_receipt: Optional[SignedReceipt] = None,
        metadata: Optional[Dict[str, Any]] = None,
        scores: Optional[Scores] = None,
        include_content: bool = False,
    ) -> SignedReceipt:
        """Create a receipt manually"""
        receipt_data = TrustReceiptData(
            session_id=session_id,
            prompt=prompt,
            response=response,
            scores=scores or {},
            agent_id=agent_id or self.default_agent_id,
            prev_receipt_hash=previous_receipt.receipt_hash if previous_receipt else None,
            metadata=metadata or {},
            include_content=include_content,
        )
        
        receipt = TrustReceipt(receipt_data)
        await receipt.sign(self.private_key)
        return receipt.to_json()
    
    async def verify_receipt(self, receipt: SignedReceipt) -> bool:
        """Verify a receipt's signature"""
        receipt_obj = TrustReceipt.from_json(receipt)
        return await receipt_obj.verify(self.public_key)
    
    async def verify_chain(self, receipts: list) -> Dict[str, Any]:
        """Verify entire receipt chain"""
        errors = []
        
        for i in range(1, len(receipts)):
            current = TrustReceipt.from_json(receipts[i])
            previous = TrustReceipt.from_json(receipts[i - 1])
            
            if not current.verify_chain(previous):
                errors.append(f"Chain break between receipt {i-1} and {i}")
            
            if not await current.verify(self.public_key):
                errors.append(f"Invalid signature on receipt {i}")
        
        return {"valid": len(errors) == 0, "errors": errors}
