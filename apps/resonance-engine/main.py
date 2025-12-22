from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from calculator import SymbiResonanceCalculator  # Your existing logic

# --- Data Models ---
class InteractionRequest(BaseModel):
    user_input: str
    ai_response: str
    history: List[str] = []
    metadata: Optional[Dict[str, Any]] = None

class ResonanceResponse(BaseModel):
    interaction_id: str
    timestamp: str
    symbi_dimensions: Dict[str, Any]  # The 5D Output
    scaffold_proof: Dict[str, Any]    # Detected vectors
    raw_metrics: Dict[str, float]     # R_m, etc.

# --- App Initialization ---
app = FastAPI(title="Symbi Resonance Engine", version="1.0.0")

# Global instance to keep model in memory (RAM)
resonance_engine = None

@app.on_event("startup")
async def load_model():
    global resonance_engine
    print("🔮 Initializing Linguistic Vector Steering Model...")
    # This loads sentence-transformers once on boot
    resonance_engine = SymbiResonanceCalculator()
    print("✅ Resonance Engine Online.")

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
        response = {
            "interaction_id": result["interaction_id"],
            "timestamp": result["timestamp"],
            "symbi_dimensions": result["symbi_dimensions"],
            "scaffold_proof": {
                "detected_vectors": result["resonance_metrics"]["linguistic_vectors_active"]
            },
            "raw_metrics": {
                "R_m": result["resonance_metrics"]["R_m"],
                "vector_alignment": result["resonance_metrics"]["components"]["vector_alignment"],
                "context_continuity": result["resonance_metrics"]["components"]["context_continuity"],
                "semantic_mirroring": result["resonance_metrics"]["components"]["semantic_mirroring"],
                "ethical_awareness": result["resonance_metrics"]["components"]["ethical_awareness"]
            }
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "operational", "model_loaded": resonance_engine is not None}