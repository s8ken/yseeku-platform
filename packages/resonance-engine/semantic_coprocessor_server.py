"""
Semantic Coprocessor Server

Python FastAPI server for semantic embedding and similarity computation.
Provides ML-powered semantic analysis for the SONATE platform.

See docs/SEMANTIC_COPROCESSOR.md for architecture details.

Usage:
    # Install dependencies
    pip install -r requirements.txt

    # Run server
    uvicorn semantic_coprocessor_server:app --host 0.0.0.0 --port 8000

    # Run with auto-reload (development)
    uvicorn semantic_coprocessor_server:app --host 0.0.0.0 --port 8000 --reload

Environment Variables:
    SONATE_SEMANTIC_MODEL_FAST: Model for fast embeddings (default: all-MiniLM-L6-v2)
    SONATE_SEMANTIC_MODEL_ACCURATE: Model for accurate embeddings (default: all-mpnet-base-v2)
    SONATE_SEMANTIC_CACHE_SIZE: Cache size for embeddings (default: 1000)
    SONATE_SEMANTIC_TIMEOUT: Request timeout in seconds (default: 30)

@version 1.0.0
"""

import os
import time
import asyncio
from typing import List, Optional, Dict
from functools import lru_cache
from datetime import datetime, timedelta

from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# ML imports
import numpy as np
from sentence_transformers import SentenceTransformer


# =============================================================================
# Configuration
# =============================================================================

MODEL_FAST = os.getenv("SONATE_SEMANTIC_MODEL_FAST", "all-MiniLM-L6-v2")
MODEL_ACCURATE = os.getenv("SONATE_SEMANTIC_MODEL_ACCURATE", "all-mpnet-base-v2")
CACHE_SIZE = int(os.getenv("SONATE_SEMANTIC_CACHE_SIZE", "1000"))
TIMEOUT = int(os.getenv("SONATE_SEMANTIC_TIMEOUT", "30"))
VERSION = "1.0.0"

# Model configuration
MODEL_CONFIG = {
    "fast": {
        "name": MODEL_FAST,
        "embedding_dim": 384,
        "description": "Fast embeddings (MiniLM)"
    },
    "accurate": {
        "name": MODEL_ACCURATE,
        "embedding_dim": 768,
        "description": "Accurate embeddings (MPNet)"
    }
}


# =============================================================================
# Pydantic Models
# =============================================================================

class EmbeddingRequest(BaseModel):
    """Request model for embedding endpoint"""
    texts: List[str] = Field(..., min_length=1, max_length=32, description="Array of texts to embed")
    model: str = Field(default="fast", regex="^(fast|accurate)$", description="Model type: 'fast' or 'accurate'")


class EmbeddingResponse(BaseModel):
    """Response model for embedding endpoint"""
    embeddings: List[List[float]] = Field(..., description="Array of embedding vectors")
    model: str = Field(..., description="Model used for embedding")
    embedding_dim: int = Field(..., description="Dimension of embedding vectors")
    latency_ms: float = Field(..., description="Processing latency in milliseconds")
    cache_hit: bool = Field(default=False, description="Whether result was served from cache")


class SimilarityRequest(BaseModel):
    """Request model for similarity endpoint"""
    text_a: str = Field(..., min_length=1, description="First text to compare")
    text_b: str = Field(..., min_length=1, description="Second text to compare")
    model: str = Field(default="fast", regex="^(fast|accurate)$", description="Model type for similarity")


class SimilarityResponse(BaseModel):
    """Response model for similarity endpoint"""
    similarity: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score (0-1)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence in the similarity score")
    model: str = Field(..., description="Model used for similarity calculation")
    latency_ms: float = Field(..., description="Processing latency in milliseconds")


class ResonanceRequest(BaseModel):
    """Request model for resonance calculation endpoint"""
    agent_system_prompt: str = Field(..., description="Agent's system prompt")
    user_message: str = Field(..., description="User's message")
    agent_response: str = Field(..., description="Agent's response")
    model: str = Field(default="fast", regex="^(fast|accurate)$", description="Model type for resonance")


class ResonanceResponse(BaseModel):
    """Response model for resonance calculation endpoint"""
    resonance_score: float = Field(..., ge=0.0, le=1.0, description="Resonance quality score (0-1)")
    alignment_score: float = Field(..., ge=0.0, le=1.0, description="Alignment between prompt and response")
    coherence_score: float = Field(..., ge=0.0, le=1.0, description="Coherence within the interaction")
    model: str = Field(..., description="Model used for resonance calculation")
    latency_ms: float = Field(..., description="Processing latency in milliseconds")


class HealthResponse(BaseModel):
    """Response model for health endpoint"""
    status: str = Field(..., description="Service status: 'ok', 'degraded', or 'error'")
    models_loaded: Dict[str, str] = Field(..., description="Map of model types to their names")
    version: str = Field(..., description="Service version")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")
    cache_stats: Dict[str, int] = Field(..., description="Cache statistics")


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    timestamp: str = Field(..., description="Error timestamp")


# =============================================================================
# Model Manager
# =============================================================================

class ModelManager:
    """Manages loading and caching of SentenceTransformer models"""
    
    def __init__(self):
        self._models: Dict[str, SentenceTransformer] = {}
        self._start_time = datetime.now()
        self._cache_hits = 0
        self._cache_misses = 0
    
    def get_model(self, model_type: str = "fast") -> Optional[SentenceTransformer]:
        """Get or load a SentenceTransformer model"""
        if model_type not in MODEL_CONFIG:
            raise ValueError(f"Invalid model type: {model_type}")
        
        model_name = MODEL_CONFIG[model_type]["name"]
        
        # Lazy loading
        if model_name not in self._models:
            try:
                print(f"[ModelManager] Loading model: {model_name}")
                self._models[model_name] = SentenceTransformer(model_name)
                print(f"[ModelManager] Model loaded: {model_name}")
            except Exception as e:
                print(f"[ModelManager] Failed to load model {model_name}: {e}")
                return None
        
        return self._models.get(model_name)
    
    def get_loaded_models(self) -> Dict[str, str]:
        """Get list of currently loaded models"""
        loaded = {}
        for model_type, config in MODEL_CONFIG.items():
            model_name = config["name"]
            if model_name in self._models:
                loaded[model_type] = model_name
        return loaded
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            "hits": self._cache_hits,
            "misses": self._cache_misses,
            "total": self._cache_hits + self._cache_misses
        }
    
    def increment_cache_hit(self):
        """Increment cache hit counter"""
        self._cache_hits += 1
    
    def increment_cache_miss(self):
        """Increment cache miss counter"""
        self._cache_misses += 1
    
    def get_uptime(self) -> float:
        """Get service uptime in seconds"""
        return (datetime.now() - self._start_time).total_seconds()


# Global model manager instance
model_manager = ModelManager()


# =============================================================================
# Embedding Functions with Caching
# =============================================================================

@lru_cache(maxsize=CACHE_SIZE)
def get_cached_embedding(text: str, model_type: str) -> np.ndarray:
    """Get cached embedding for a text (hash-based LRU cache)"""
    model = model_manager.get_model(model_type)
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model {model_type} not available")
    
    embedding = model.encode(text, convert_to_numpy=True)
    model_manager.increment_cache_miss()
    return embedding


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    similarity = dot_product / (norm_a * norm_b)
    return float(np.clip(similarity, -1.0, 1.0))


def normalized_similarity(similarity: float) -> float:
    """Normalize cosine similarity from [-1, 1] to [0, 1]"""
    return (similarity + 1) / 2


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="SONATE Semantic Coprocessor",
    description="Python ML coprocessor for semantic embeddings, similarity, and resonance analysis",
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for cross-origin requests from TypeScript backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


@app.get("/", response_model=Dict)
async def root():
    """Root endpoint with service info"""
    return {
        "service": "SONATE Semantic Coprocessor",
        "version": VERSION,
        "status": "ready",
        "endpoints": ["/health", "/embed", "/similarity", "/resonance", "/docs"],
        "models": MODEL_CONFIG
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint.
    
    Returns service status, list of loaded models, and cache statistics.
    """
    loaded_models = model_manager.get_loaded_models()
    cache_stats = model_manager.get_cache_stats()
    
    # Determine status based on model availability
    status = "ok" if loaded_models else "degraded"
    
    return HealthResponse(
        status=status,
        models_loaded=loaded_models,
        version=VERSION,
        uptime_seconds=model_manager.get_uptime(),
        cache_stats=cache_stats
    )


@app.post("/embed", response_model=EmbeddingResponse)
async def embed(request: EmbeddingRequest):
    """
    Generate semantic embeddings for texts.
    
    Supports batch processing with automatic caching.
    """
    start_time = time.time()
    
    # Validate texts length
    if not request.texts:
        raise HTTPException(status_code=400, detail="No texts provided")
    
    model = model_manager.get_model(request.model)
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model {request.model} not available")
    
    try:
        embeddings = []
        cache_hit = False
        
        # Process each text with caching
        for text in request.texts:
            try:
                # Try to get from cache
                embedding = get_cached_embedding(text, request.model)
                embeddings.append(embedding.tolist())
                cache_hit = True
            except:
                # Cache miss or error, compute directly
                embedding = model.encode(text, convert_to_numpy=True)
                embeddings.append(embedding.tolist())
                model_manager.increment_cache_miss()
                cache_hit = False
        
        latency_ms = (time.time() - start_time) * 1000
        
        return EmbeddingResponse(
            embeddings=embeddings,
            model=MODEL_CONFIG[request.model]["name"],
            embedding_dim=MODEL_CONFIG[request.model]["embedding_dim"],
            latency_ms=latency_ms,
            cache_hit=cache_hit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")


@app.post("/similarity", response_model=SimilarityResponse)
async def similarity(request: SimilarityRequest):
    """
    Calculate semantic similarity between two texts.
    
    Returns normalized similarity score (0-1) with confidence metric.
    """
    start_time = time.time()
    
    model = model_manager.get_model(request.model)
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model {request.model} not available")
    
    try:
        # Encode both texts
        embeddings = model.encode([request.text_a, request.text_b], convert_to_numpy=True)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(embeddings[0], embeddings[1])
        normalized_sim = normalized_similarity(similarity)
        
        # Confidence based on text length and model type
        confidence = 0.7 if request.model == "fast" else 0.9
        if len(request.text_a) > 100 and len(request.text_b) > 100:
            confidence += 0.1
        confidence = min(confidence, 1.0)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return SimilarityResponse(
            similarity=normalized_sim,
            confidence=confidence,
            model=MODEL_CONFIG[request.model]["name"],
            latency_ms=latency_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity failed: {str(e)}")


@app.post("/resonance", response_model=ResonanceResponse)
async def resonance(request: ResonanceRequest):
    """
    Calculate resonance quality for an agent interaction.
    
    Resonance measures how well the agent's response aligns with its system prompt
    and the user's request. It combines semantic alignment and coherence metrics.
    """
    start_time = time.time()
    
    model = model_manager.get_model(request.model)
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model {request.model} not available")
    
    try:
        # Embed all three texts
        embeddings = model.encode(
            [request.agent_system_prompt, request.user_message, request.agent_response],
            convert_to_numpy=True
        )
        
        prompt_emb, user_emb, response_emb = embeddings
        
        # Alignment: How well response aligns with system prompt
        alignment_sim = cosine_similarity(prompt_emb, response_emb)
        alignment_score = normalized_similarity(alignment_sim)
        
        # Relevance: How well response addresses user message
        relevance_sim = cosine_similarity(user_emb, response_emb)
        relevance_score = normalized_similarity(relevance_sim)
        
        # Coherence: Internal consistency (average of alignment and relevance)
        coherence_score = (alignment_score + relevance_score) / 2
        
        # Overall resonance: Weighted combination
        resonance_score = (
            0.5 * alignment_score +
            0.3 * relevance_score +
            0.2 * coherence_score
        )
        
        latency_ms = (time.time() - start_time) * 1000
        
        return ResonanceResponse(
            resonance_score=float(np.clip(resonance_score, 0.0, 1.0)),
            alignment_score=float(np.clip(alignment_score, 0.0, 1.0)),
            coherence_score=float(np.clip(coherence_score, 0.0, 1.0)),
            model=MODEL_CONFIG[request.model]["name"],
            latency_ms=latency_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resonance calculation failed: {str(e)}")


# =============================================================================
# CLI Entry Point
# =============================================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting SONATE Semantic Coprocessor on {host}:{port}")
    print(f"Version: {VERSION}")
    print(f"Fast model: {MODEL_FAST}")
    print(f"Accurate model: {MODEL_ACCURATE}")
    print(f"Cache size: {CACHE_SIZE}")
    print(f"Timeout: {TIMEOUT}s")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        timeout_keep_alive=TIMEOUT,
        log_level="info"
    )