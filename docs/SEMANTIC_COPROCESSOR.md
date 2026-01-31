# SEMANTIC_COPROCESSOR.md
## Python ML Integration Architecture

**Status:** IMPLEMENTED (v1.0.0)  
**Version:** 1.0.0  
**Last Updated:** 2025-01-31

---

## Executive Summary

The SONATE platform now supports **true semantic analysis** through a Python ML coprocessor. The platform defaults to **structural projections** (hash-based deterministic vectors) for fast, reproducible scoring in TypeScript, but can optionally use semantic embeddings from SentenceTransformer models for enhanced accuracy.

The Semantic Coprocessor provides:
- ✅ True semantic understanding (paraphrases, context, meaning)
- ✅ Graceful fallback to structural projections
- ✅ Health monitoring and retry logic
- ✅ Batch processing with caching
- ✅ Resonance calculation for agent interactions

---

## Architecture Overview

### Design Principles

1. **TypeScript remains the orchestrator** - All API endpoints, business logic, and flow control stay in TypeScript
2. **Python handles semantic-heavy operations** - Embedding generation, similarity scoring, resonance calculation
3. **Clear interface boundary** - Well-defined HTTP/JSON interface between TS and Python
4. **Graceful degradation** - System works with structural projections if Python is unavailable

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    TypeScript Layer                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │ API Routes   │  │ Calculator   │  │ Structural                         │  │
│  │              │  │ V2           │  │ Projections                        │  │
│  └──────┬───────┘  └──────┬───────┘  │ (Fast, Deterministic)              │  │
│         │                 │          └────────────────────────────────────┘  │
│         │                 │                                                │
│         │                 │ (when semantic needed)                         │
│         │                 ▼                                                │
│         │    ┌────────────────────────────────────┐                        │
│         │    │      calculateSemanticResonance()  │                        │
│         │    │    - Checks coprocessor availability│                        │
│         │    │    - Falls back to structural       │                        │
│         │    └────────────────┬───────────────────┘                        │
│         │                     │                                               │
│         └─────────────────────┼─────────────────────┐                        │
│                               │                     │                        │
└───────────────────────────────┼─────────────────────┼────────────────────────┘
                                │                     │
                                ▼                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              Semantic Coprocessor Client (TypeScript)                        │
│  - HTTP interface                                                            │
│  - Request batching                                                         │
│  - Timeout handling (configurable)                                          │
│  - Retry logic with exponential backoff                                     │
│  - Fallback to structural projections                                       │
│  - Health check monitoring                                                  │
│  - Statistics tracking (requests, fallbacks, etc.)                          │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/JSON
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Python Layer                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Semantic Coprocessor Server (FastAPI)                   │   │
│  │  - POST /embed    - Generate embeddings for texts                    │   │
│  │  - POST /similarity - Calculate semantic similarity                 │   │
│  │  - POST /resonance - Calculate resonance for agent interactions      │   │
│  │  - GET  /health    - Health check with cache stats                   │   │
│  │  - GET  /docs      - Interactive API documentation                  │   │
│  └────────────────────────────┬───────────────────────────────────────────┘   │
│                               │                                               │
│  ┌────────────────────────────┴───────────────────────────────────────────┐   │
│  │                    Model Manager                                      │   │
│  │  - Lazy model loading                                                 │   │
│  │  - Model caching                                                      │   │
│  │  - LRU cache for embeddings                                           │   │
│  └────────────────────────────┬───────────────────────────────────────────┘   │
│                               │                                               │
│  ┌────────────────────────────┴───────────────────────────────────────────┐   │
│  │                    ML Models                                          │   │
│  │  - all-MiniLM-L6-v2 (384 dims, fast, ~80MB)                          │   │
│  │  - all-mpnet-base-v2 (768 dims, accurate, ~400MB)                    │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### TypeScript Client

**Location:** `packages/detect/src/semantic-coprocessor-client.ts`

**Features:**
- Automatic health check with periodic monitoring
- Retry logic with exponential backoff (configurable)
- Timeout handling (default 5s)
- Statistics tracking (requests, successes, failures, fallbacks)
- Graceful fallback to structural projections
- Singleton instance for convenience

**Configuration:**
```typescript
export interface SemanticCoprocessorConfig {
  endpoint: string;           // e.g., "http://localhost:8000"
  timeout: number;            // ms, default 5000
  batchSize: number;          // max texts per request, default 32
  maxRetries: number;         // default 3
  retryDelay: number;         // initial delay, default 100ms
  retryBackoff: number;       // backoff factor, default 2
  fallbackToStructural: boolean; // default true
  healthCheckInterval: number; // default 60000ms
}
```

**Usage:**
```typescript
import { semanticCoprocessor, CalculatorV2 } from '@sonate/detect';

// Check if coprocessor is available
const isAvailable = await semanticCoprocessor.healthCheck();

// Calculate semantic resonance
const resonance = await CalculatorV2.computeSemanticResonance(
  'You are a helpful assistant',
  'What is AI?',
  'AI stands for Artificial Intelligence...'
);

// Check if ML was used
console.log(`Used ML: ${resonance.used_ml}`);

// Get statistics
const stats = semanticCoprocessor.getStats();
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Fallback activations: ${stats.fallbackActivations}`);
```

### Python Server

**Location:** `packages/resonance-engine/semantic_coprocessor_server.py`

**Features:**
- FastAPI with automatic OpenAPI documentation
- Lazy model loading (models loaded on first request)
- LRU cache for embeddings (configurable size)
- Health endpoint with cache statistics
- Comprehensive error handling
- CORS support for development

**Endpoints:**

#### POST /embed
Generate semantic embeddings for texts.

```json
{
  "texts": ["Hello world", "Hi there"],
  "model": "fast"
}
```

Response:
```json
{
  "embeddings": [[...], [...]],
  "model": "all-MiniLM-L6-v2",
  "embedding_dim": 384,
  "latency_ms": 45.2,
  "cache_hit": false
}
```

#### POST /similarity
Calculate semantic similarity between two texts.

```json
{
  "text_a": "Hello world",
  "text_b": "Hi there",
  "model": "fast"
}
```

Response:
```json
{
  "similarity": 0.85,
  "confidence": 0.8,
  "model": "all-MiniLM-L6-v2",
  "latency_ms": 23.1
}
```

#### POST /resonance
Calculate resonance quality for an agent interaction.

```json
{
  "agent_system_prompt": "You are a helpful assistant",
  "user_message": "What is AI?",
  "agent_response": "AI stands for Artificial Intelligence...",
  "model": "fast"
}
```

Response:
```json
{
  "resonance_score": 0.87,
  "alignment_score": 0.92,
  "coherence_score": 0.85,
  "model": "all-MiniLM-L6-v2",
  "latency_ms": 67.4
}
```

#### GET /health
Health check endpoint.

Response:
```json
{
  "status": "ok",
  "models_loaded": {
    "fast": "all-MiniLM-L6-v2",
    "accurate": "all-mpnet-base-v2"
  },
  "version": "1.0.0",
  "uptime_seconds": 1234.56,
  "cache_stats": {
    "hits": 45,
    "misses": 12,
    "total": 57
  }
}
```

---

## Deployment

### Local Development

**Option 1: Direct Python execution**

```bash
cd packages/resonance-engine

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn semantic_coprocessor_server:app --host 0.0.0.0 --port 8000 --reload
```

**Option 2: Docker Compose**

```bash
cd packages/resonance-engine

# Build and start
docker-compose up --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Deployment

**Option 1: Docker Container**

```bash
# Build image
docker build -t sonate-semantic-coprocessor:latest .

# Run container
docker run -d \
  --name sonate-semantic-coprocessor \
  -p 8000:8000 \
  -e SONATE_SEMANTIC_MODEL_FAST=all-MiniLM-L6-v2 \
  -e SONATE_SEMANTIC_MODEL_ACCURATE=all-mpnet-base-v2 \
  -e SONATE_SEMANTIC_CACHE_SIZE=1000 \
  sonate-semantic-coprocessor:latest
```

**Option 2: Kubernetes (Sidecar)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yseeku-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: yseeku-backend:latest
        env:
        - name: SONATE_SEMANTIC_COPROCESSOR_URL
          value: "http://localhost:8000"
        - name: SONATE_SEMANTIC_COPROCESSOR_ENABLED
          value: "true"
      - name: semantic-coprocessor
        image: sonate-semantic-coprocessor:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

---

## Configuration

### Environment Variables

**TypeScript Client (Backend):**

```bash
# Enable semantic coprocessor (default: false)
SONATE_SEMANTIC_COPROCESSOR_ENABLED=true

# Coprocessor endpoint
SONATE_SEMANTIC_COPROCESSOR_URL=http://localhost:8000

# Timeout in milliseconds
SONATE_SEMANTIC_COPROCESSOR_TIMEOUT=5000

# Maximum retry attempts
SONATE_SEMANTIC_COPROCESSOR_MAX_RETRIES=3

# Fallback to structural projections if coprocessor unavailable
SONATE_SEMANTIC_COPROCESSOR_FALLBACK=true
```

**Python Server:**

```bash
# Fast model (default: all-MiniLM-L6-v2)
SONATE_SEMANTIC_MODEL_FAST=all-MiniLM-L6-v2

# Accurate model (default: all-mpnet-base-v2)
SONATE_SEMANTIC_MODEL_ACCURATE=all-mpnet-base-v2

# Cache size (default: 1000)
SONATE_SEMANTIC_CACHE_SIZE=1000

# Request timeout in seconds (default: 30)
SONATE_SEMANTIC_TIMEOUT=30
```

---

## When to Use Semantic vs Structural

| Use Case | Structural Projection | Semantic Coprocessor |
|----------|----------------------|---------------------|
| Real-time scoring (<100ms) | ✅ Primary (~1ms) | ⚠️ Slower (~50-100ms) |
| Batch analysis | ⚠️ Fallback | ✅ Primary |
| Paraphrase detection | ❌ Cannot do | ✅ Excellent |
| Adversarial detection | ⚠️ Limited | ✅ Enhanced |
| Emergence detection | ⚠️ Structural only | ✅ Semantic |
| Resonance calculation | ⚠️ Structural | ✅ ML-based |
| Offline/edge deployment | ✅ Primary | ❌ Requires model |

---

## Performance Characteristics

### Latency

| Operation | Structural | Semantic (Fast) | Semantic (Accurate) |
|-----------|-----------|-----------------|---------------------|
| Embedding (1 text) | ~1ms | ~45ms | ~120ms |
| Embedding (32 texts) | ~32ms | ~80ms | ~200ms |
| Similarity | ~2ms | ~23ms | ~60ms |
| Resonance | ~5ms | ~67ms | ~180ms |

### Memory

| Component | Memory Usage |
|-----------|--------------|
| Fast model (all-MiniLM-L6-v2) | ~80MB |
| Accurate model (all-mpnet-base-v2) | ~400MB |
| Python runtime + FastAPI | ~50MB |
| Cache (1000 embeddings) | ~30MB |

---

## Monitoring

### Health Checks

```bash
# Check coprocessor health
curl http://localhost:8000/health

# Expected response
{
  "status": "ok",
  "models_loaded": {"fast": "all-MiniLM-L6-v2"},
  "version": "1.0.0",
  "uptime_seconds": 1234.56,
  "cache_stats": {"hits": 45, "misses": 12, "total": 57}
}
```

### Statistics

```typescript
// Get client statistics from TypeScript
const stats = semanticCoprocessor.getStats();
console.log(`
  Total Requests: ${stats.totalRequests}
  Successful: ${stats.successfulRequests}
  Failed: ${stats.failedRequests}
  Fallbacks: ${stats.fallbackActivations}
  Available: ${stats.isAvailable}
`);
```

### Metrics to Monitor

- **Request latency** - P50, P95, P99
- **Error rate** - Failed requests / Total requests
- **Fallback rate** - Fallback activations / Total requests
- **Cache hit rate** - Cache hits / (Cache hits + Cache misses)
- **Coprocessor availability** - % of time coprocessor is healthy

---

## Integration with Calculator V2

The `CalculatorV2` now includes semantic resonance capabilities:

```typescript
import { CalculatorV2 } from '@sonate/detect';

// Calculate ML-based resonance
const resonance = await CalculatorV2.computeSemanticResonance(
  agentSystemPrompt,
  userMessage,
  agentResponse
);

console.log(`Resonance: ${resonance.resonance_score}`);
console.log(`Alignment: ${resonance.alignment_score}`);
console.log(`Coherence: ${resonance.coherence_score}`);
console.log(`Used ML: ${resonance.used_ml}`);

// Check coprocessor availability
const isAvailable = await CalculatorV2.isSemanticCoprocessorAvailable();

// Get coprocessor statistics
const stats = CalculatorV2.getSemanticCoprocessorStats();
```

---

## Troubleshooting

### Coprocessor unavailable

**Symptoms:** Fallback to structural projections, high fallback rate

**Solutions:**
1. Check if coprocessor is running: `curl http://localhost:8000/health`
2. Verify environment variable: `SONATE_SEMANTIC_COPROCESSOR_ENABLED=true`
3. Check logs for connection errors
4. Verify timeout configuration

### High latency

**Symptoms:** Slow response times, timeouts

**Solutions:**
1. Use 'fast' model instead of 'accurate'
2. Increase cache size: `SONATE_SEMANTIC_CACHE_SIZE=5000`
3. Batch requests where possible
4. Consider GPU acceleration

### Out of memory

**Symptoms:** OOM errors, crashes

**Solutions:**
1. Load only 'fast' model (smaller)
2. Reduce cache size
3. Increase memory limits
4. Use model quantization

---

## Future Enhancements

1. **Model quantization** - Reduce model size and improve latency
2. **GPU acceleration** - CUDA support for faster inference
3. **Custom fine-tuning** - Domain-specific models for SONATE
4. **Advanced caching** - Redis/distributed cache for embeddings
5. **Streaming support** - Real-time embeddings for streaming text
6. **Multi-language support** - Models for non-English languages

---

## References

- [SentenceTransformers Documentation](https://www.sbert.net/)
- [all-MiniLM-L6-v2 Model Card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [all-mpnet-base-v2 Model Card](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Documentation](https://www.uvicorn.org/)