# SEMANTIC_COPROCESSOR.md
## Python ML Integration Architecture

**Status:** PLANNED (Document First, Wire Later)  
**Version:** 1.0.0  
**Last Updated:** 2025-01-20

---

## Executive Summary

The SONATE platform currently uses **structural projections** (hash-based deterministic vectors) for fast, reproducible scoring in TypeScript. These are NOT semantic embeddings - they capture lexical patterns but do not understand meaning.

This document outlines the architecture for integrating Python-based ML models as a **semantic coprocessor** to provide true semantic understanding where needed.

---

## Current State: Structural Projections

### What We Have (TypeScript)
```typescript
// packages/detect/src/v2.ts
function createStructuralProjection(text: string, dims = 384): number[]
```

**Characteristics:**
- ✅ Deterministic (same input → same output)
- ✅ Fast (~1ms per projection)
- ✅ No external dependencies
- ✅ Works offline
- ❌ No semantic understanding
- ❌ Cannot detect paraphrases
- ❌ Cannot understand context/meaning

### What We Need (Python)
```python
# packages/resonance-engine/sonate_resonance_calculator.py
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(texts)
```

**Characteristics:**
- ✅ True semantic understanding
- ✅ Detects paraphrases and meaning
- ✅ Context-aware
- ❌ Requires ML model (~400MB)
- ❌ Slower (~50-100ms per batch)
- ❌ Requires Python runtime

---

## Architecture: Python as Coprocessor

### Design Principles

1. **TypeScript remains the orchestrator** - All API endpoints, business logic, and flow control stay in TypeScript
2. **Python handles semantic-heavy operations** - Embedding generation, similarity scoring, emergence detection
3. **Clear interface boundary** - Well-defined JSON-RPC or HTTP interface between TS and Python
4. **Graceful degradation** - System works with structural projections if Python is unavailable

### Integration Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    TypeScript Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ API Routes  │  │ Calculator  │  │ Structural          │  │
│  │             │──│ V2          │──│ Projections         │  │
│  └─────────────┘  └──────┬──────┘  │ (Fast, Deterministic)│  │
│                          │         └─────────────────────┘  │
│                          │ (when semantic needed)            │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Semantic Coprocessor Client                 ││
│  │  - HTTP/JSON-RPC interface                               ││
│  │  - Request batching                                      ││
│  │  - Timeout handling                                      ││
│  │  - Fallback to structural projections                    ││
│  └──────────────────────────┬──────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼ HTTP/JSON-RPC
┌─────────────────────────────────────────────────────────────┐
│                    Python Layer                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Semantic Coprocessor Server                 ││
│  │  - FastAPI/Flask endpoint                                ││
│  │  - SentenceTransformer model                             ││
│  │  - Batch processing                                      ││
│  │  - Model caching                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              ML Models                                   ││
│  │  - all-MiniLM-L6-v2 (384 dims, fast)                    ││
│  │  - all-mpnet-base-v2 (768 dims, accurate)               ││
│  │  - Custom fine-tuned models (future)                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Interface Specification

### TypeScript Client (Stub)

```typescript
// packages/detect/src/semantic-coprocessor-client.ts

export interface SemanticCoprocessorConfig {
  endpoint: string;           // e.g., "http://localhost:8000"
  timeout: number;            // ms, default 5000
  batchSize: number;          // max texts per request, default 32
  fallbackToStructural: boolean; // default true
}

export interface EmbeddingRequest {
  texts: string[];
  model?: 'fast' | 'accurate'; // default 'fast'
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  latency_ms: number;
}

export interface SimilarityRequest {
  text_a: string;
  text_b: string;
}

export interface SimilarityResponse {
  similarity: number;  // 0-1, true semantic similarity
  confidence: number;  // model confidence
}

export class SemanticCoprocessorClient {
  constructor(config: SemanticCoprocessorConfig) {}
  
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {}
  async similarity(request: SimilarityRequest): Promise<SimilarityResponse> {}
  async healthCheck(): Promise<boolean> {}
}
```

### Python Server (Stub)

```python
# packages/resonance-engine/semantic_coprocessor_server.py

from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel

app = FastAPI()

MODELS = {
    'fast': SentenceTransformer('all-MiniLM-L6-v2'),
    'accurate': SentenceTransformer('all-mpnet-base-v2'),
}

class EmbeddingRequest(BaseModel):
    texts: list[str]
    model: str = 'fast'

class EmbeddingResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    latency_ms: float

@app.post("/embed")
async def embed(request: EmbeddingRequest) -> EmbeddingResponse:
    model = MODELS[request.model]
    embeddings = model.encode(request.texts)
    return EmbeddingResponse(
        embeddings=embeddings.tolist(),
        model=request.model,
        latency_ms=0  # TODO: measure
    )

@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": list(MODELS.keys())}
```

---

## Migration Path

### Phase 1: Document & Stub (Current)
- [x] Document architecture intent
- [ ] Create TypeScript client stub (interface only)
- [ ] Create Python server stub (interface only)
- [ ] Add feature flag for semantic coprocessor

### Phase 2: Local Development
- [ ] Implement Python server with FastAPI
- [ ] Implement TypeScript client with fallback
- [ ] Add integration tests
- [ ] Benchmark latency impact

### Phase 3: Production Integration
- [ ] Docker container for Python coprocessor
- [ ] Kubernetes sidecar deployment option
- [ ] Health monitoring and alerting
- [ ] Gradual rollout with feature flags

### Phase 4: Optimization
- [ ] Model quantization for faster inference
- [ ] GPU acceleration (optional)
- [ ] Custom fine-tuned models for SONATE domain
- [ ] Caching layer for common phrases

---

## When to Use Semantic vs Structural

| Use Case | Structural Projection | Semantic Coprocessor |
|----------|----------------------|---------------------|
| Real-time scoring (<100ms) | ✅ Primary | ❌ Too slow |
| Batch analysis | ⚠️ Fallback | ✅ Primary |
| Paraphrase detection | ❌ Cannot do | ✅ Primary |
| Adversarial detection | ⚠️ Limited | ✅ Enhanced |
| Emergence detection | ⚠️ Structural only | ✅ Semantic |
| Offline/edge deployment | ✅ Primary | ❌ Requires model |

---

## Configuration

### Environment Variables

```bash
# Enable semantic coprocessor (default: false)
SONATE_SEMANTIC_COPROCESSOR_ENABLED=true

# Coprocessor endpoint
SONATE_SEMANTIC_COPROCESSOR_URL=http://localhost:8000

# Timeout in milliseconds
SONATE_SEMANTIC_COPROCESSOR_TIMEOUT=5000

# Fallback to structural projections if coprocessor unavailable
SONATE_SEMANTIC_COPROCESSOR_FALLBACK=true
```

---

## Open Questions

1. **Deployment model:** Sidecar vs. shared service vs. embedded?
2. **Model selection:** Should we allow runtime model switching?
3. **Caching strategy:** Cache embeddings? For how long?
4. **Cost allocation:** How to attribute ML compute costs?

---

## References

- [SentenceTransformers Documentation](https://www.sbert.net/)
- [all-MiniLM-L6-v2 Model Card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- Internal: `packages/resonance-engine/sonate_resonance_calculator.py` (existing Python implementation)