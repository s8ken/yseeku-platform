from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from calculator import SymbiResonanceCalculator, CollectiveResonanceAnalyzer

# --- Data Models ---
class InteractionRequest(BaseModel):
    user_input: str
    ai_response: str
    history: List[str] = []
    metadata: Optional[Dict[str, Any]] = None

class ResonanceResponse(BaseModel):
    interaction_id: str
    timestamp: str
    symbi_dimensions: Dict[str, Any]
    scaffold_proof: Dict[str, Any]
    raw_metrics: Dict[str, float]
    drift_detected: bool = False
    iap_payload: Optional[str] = None
    nudge_active: bool = False
    nudge_payload: Optional[str] = None
    signature: Optional[str] = None
    signer_did: Optional[str] = None

class BatchAnalysisRequest(BaseModel):
    receipts: List[ResonanceResponse]

class PolicyRefinement(BaseModel):
    type: str
    priority: str
    current_policy: str
    suggested_change: str
    rationale: str

class CollectiveResonanceResponse(BaseModel):
    batch_size: int
    timestamp: str
    systemic_resonance: float
    collective_coherence: float
    bedau_emergence: float
    pillar_health: Dict[str, float]
    intervention_metrics: Dict[str, float]
    stability_score: float
    systemic_drift_vectors: List[str]
    suggested_refinements: List[PolicyRefinement]
    status: str

# --- App Initialization ---
app = FastAPI(title="Symbi Resonance Engine", version="1.0.0")

import json
import base64
from nacl.signing import SigningKey
from nacl.encoding import Base64Encoder

# --- Global Governance State ---
resonance_engine = None
collective_analyzer = None
signing_key = None
engine_did = "did:key:z6Mk" + "ExampleDIDPlaceholder"

@app.on_event("startup")
async def load_model():
    global resonance_engine, collective_analyzer, signing_key, engine_did
    print("🔮 Initializing Linguistic Vector Steering Model...")
    resonance_engine = SymbiResonanceCalculator()
    collective_analyzer = CollectiveResonanceAnalyzer()
    
    # Initialize signing key for Immutable Receipts
    signing_key = SigningKey.generate()
    verify_key_b64 = signing_key.verify_key.encode(encoder=Base64Encoder).decode('utf-8')
    engine_did = f"did:key:z6Mk{verify_key_b64}"
    
    print(f"✅ Resonance Engine Online. Governance DID: {engine_did}")

# --- Endpoints ---
@app.post("/v1/analyze", response_model=ResonanceResponse)
async def analyze_interaction(request: InteractionRequest):
    if not resonance_engine:
        raise HTTPException(status_code=503, detail="Engine initializing")

    try:
        # Run your calculator logic
        result = resonance_engine.calculate_resonance(
            request.user_input,
            request.ai_response,
            request.history
        )

        # Transform to match the response model
        response_data = {
            "interaction_id": result["interaction_id"],
            "timestamp": result["timestamp"],
            "symbi_dimensions": result["symbi_dimensions"],
            "scaffold_proof": result["scaffold_proof"],
            "raw_metrics": {
                "R_m": result["resonance_metrics"]["R_m"],
                "vector_alignment": result["resonance_metrics"]["vector_alignment"],
                "context_continuity": result["resonance_metrics"]["context_continuity"],
                "semantic_mirroring": result["resonance_metrics"]["semantic_mirroring"],
                "ethical_awareness": result["resonance_metrics"]["ethical_awareness"],
                "identity_coherence": result["resonance_metrics"]["identity_coherence"],
                "bedau_index": result["resonance_metrics"]["bedau_index"]
            },
            "drift_detected": result["drift_detected"],
            "iap_payload": result.get("iap_payload"),
            "nudge_active": result.get("nudge_active", False),
            "nudge_payload": result.get("nudge_payload"),
            "signer_did": engine_did
        }

        # Create cryptographic signature of the receipt
        canonical_data = json.dumps(response_data, sort_keys=True)
        signature_bytes = signing_key.sign(canonical_data.encode('utf-8'))
        response_data["signature"] = base64.b64encode(signature_bytes.signature).decode('utf-8')

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/analyze/batch", response_model=CollectiveResonanceResponse)
async def analyze_batch(request: BatchAnalysisRequest):
    if not collective_analyzer:
        raise HTTPException(status_code=503, detail="Analyzer initializing")
    
    try:
        # Convert Pydantic models back to dicts for the analyzer
        receipt_dicts = [r.dict() for r in request.receipts]
        result = collective_analyzer.analyze_batch(receipt_dicts)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "operational", "model_loaded": resonance_engine is not None}