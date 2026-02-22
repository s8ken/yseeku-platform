"""
TrustReceipt - Cryptographically signed AI interaction records
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Union
from .crypto import canonicalize_json, canonicalize_and_hash, sign, verify, hex_to_bytes

Scores = Dict[str, float]


@dataclass
class TrustReceiptData:
    """Data required to create a TrustReceipt"""
    session_id: str
    prompt: Any
    response: Any
    scores: Scores
    agent_id: Optional[str] = None
    prev_receipt_hash: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    include_content: bool = False


@dataclass
class SignedReceipt:
    """A signed TrustReceipt ready for storage or transmission"""
    version: str
    timestamp: str
    session_id: str
    agent_id: Optional[str]
    prompt_hash: str
    response_hash: str
    scores: Scores
    prev_receipt_hash: Optional[str]
    receipt_hash: str
    signature: str
    metadata: Dict[str, Any]
    prompt_content: Optional[Any] = None
    response_content: Optional[Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        d = asdict(self)
        if self.prompt_content is None:
            del d['prompt_content']
        if self.response_content is None:
            del d['response_content']
        return d


class TrustReceipt:
    """TrustReceipt class for creating and verifying signed receipts"""
    
    VERSION = "1.0"
    
    def __init__(self, data: TrustReceiptData):
        """Create a new TrustReceipt"""
        self.version = self.VERSION
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.session_id = data.session_id
        self.agent_id = data.agent_id or None
        self.prompt_hash = self._hash_content(data.prompt)
        self.response_hash = self._hash_content(data.response)
        self.scores = dict(data.scores)
        self.prev_receipt_hash = data.prev_receipt_hash or None
        self.metadata = dict(data.metadata)
        
        if data.include_content:
            self.prompt_content = data.prompt
            self.response_content = data.response
        else:
            self.prompt_content = None
            self.response_content = None
        
        self.receipt_hash = self._compute_receipt_hash()
        self._signature = ""
    
    @staticmethod
    def _hash_content(content: Any) -> str:
        """Hash any content using SHA-256 with JSON canonicalization"""
        if content is None:
            return canonicalize_and_hash(None)
        return canonicalize_and_hash(content)
    
    def _compute_receipt_hash(self) -> str:
        """Compute SHA-256 hash of the full receipt payload"""
        payload = {
            "version": self.version,
            "timestamp": self.timestamp,
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "prompt_hash": self.prompt_hash,
            "response_hash": self.response_hash,
            "scores": self.scores,
            "prev_receipt_hash": self.prev_receipt_hash,
            "metadata": self.metadata,
        }
        return canonicalize_and_hash(payload)
    
    async def sign(self, private_key: Union[str, bytes]) -> None:
        """Sign the receipt with an Ed25519 private key"""
        self._signature = sign(self.receipt_hash, private_key)
    
    @property
    def signature(self) -> str:
        """Get the signature (hex string)"""
        return self._signature
    
    @property
    def is_signed(self) -> bool:
        """Check if receipt is signed"""
        return len(self._signature) > 0
    
    async def verify(self, public_key: Union[str, bytes]) -> bool:
        """Verify the receipt's signature"""
        if not self._signature:
            return False
        return verify(self._signature, self.receipt_hash, public_key)
    
    def verify_chain(self, previous: Union['TrustReceipt', SignedReceipt]) -> bool:
        """Check if this receipt chains correctly from a previous receipt"""
        if isinstance(previous, TrustReceipt):
            prev_hash = previous.receipt_hash
        else:
            prev_hash = previous.receipt_hash
        return self.prev_receipt_hash == prev_hash
    
    def to_json(self) -> SignedReceipt:
        """Export as SignedReceipt object"""
        return SignedReceipt(
            version=self.version,
            timestamp=self.timestamp,
            session_id=self.session_id,
            agent_id=self.agent_id,
            prompt_hash=self.prompt_hash,
            response_hash=self.response_hash,
            scores=self.scores,
            prev_receipt_hash=self.prev_receipt_hash,
            receipt_hash=self.receipt_hash,
            signature=self._signature,
            metadata=self.metadata,
            prompt_content=self.prompt_content,
            response_content=self.response_content,
        )
    
    @staticmethod
    def from_json(data: SignedReceipt) -> 'TrustReceipt':
        """Create a TrustReceipt from JSON data"""
        dummy = TrustReceiptData(
            session_id=data.session_id,
            prompt="",
            response="",
            scores=data.scores,
        )
        receipt = TrustReceipt(dummy)
        
        receipt.timestamp = data.timestamp
        receipt.agent_id = data.agent_id
        receipt.prompt_hash = data.prompt_hash
        receipt.response_hash = data.response_hash
        receipt.prev_receipt_hash = data.prev_receipt_hash
        receipt.metadata = data.metadata
        receipt.receipt_hash = data.receipt_hash
        receipt._signature = data.signature
        receipt.prompt_content = data.prompt_content
        receipt.response_content = data.response_content
        
        return receipt
