from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sonate_resonance_calculator import SonateResonanceCalculator

app = FastAPI(title="Sonate Resonance Engine", description="API for calculating resonance scores and trust receipts")

# Initialize the calculator (loads the model, which might take a moment)
print("Initializing Sonate Resonance Calculator...")
calculator = SonateResonanceCalculator()
print("Calculator initialized.")

class ResonanceRequest(BaseModel):
    user_input: str
    ai_response: str
    conversation_history: Optional[List[str]] = []
    logprobs: Optional[List[float]] = None
    interaction_id: Optional[str] = "unknown"

class DriftRequest(BaseModel):
    conversation_scores: List[float]
    threshold: Optional[float] = 0.15

class PersonaRequest(BaseModel):
    ai_response: str

class IdentityCoherenceRequest(BaseModel):
    conversation_responses: List[str]

@app.post("/calculate_resonance")
async def calculate_resonance(request: ResonanceRequest):
    try:
        result = calculator.calculate_resonance(
            user_input=request.user_input,
            ai_response=request.ai_response,
            conversation_history=request.conversation_history,
            logprobs=request.logprobs,
            interaction_id=request.interaction_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect_drift")
async def detect_drift(request: DriftRequest):
    try:
        is_drifting = calculator.detect_drift(
            conversation_scores=request.conversation_scores,
            threshold=request.threshold
        )
        return {"drift_detected": is_drifting}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect_persona")
async def detect_persona(request: PersonaRequest):
    try:
        persona, confidence = calculator.detect_active_persona(request.ai_response)
        return {"dominant_persona": persona, "confidence": confidence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate_identity_coherence")
async def calculate_identity_coherence(request: IdentityCoherenceRequest):
    try:
        coherence = calculator.calculate_identity_coherence(request.conversation_responses)
        return {"identity_coherence": coherence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "active", "model": "all-mpnet-base-v2"}

@app.get("/")
async def root():
    return {
        "message": "Sonate Resonance Engine is running",
        "docs_url": "/docs",
        "health_check": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
