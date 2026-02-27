/**
 * Semantic Coprocessor Routes
 * 
 * Status endpoints for semantic embeddings system.
 * Checks for:
 * - Provider-based embeddings (OpenAI/Together/HuggingFace APIs)
 * - Python ML sidecar (if deployed)
 * - Fallback to structural projections (hash-based)
 */

import { Router, Request, Response } from 'express';
import { semanticCoprocessor, embedder } from '@sonate/detect';

const router = Router();

/**
 * GET /api/semantic-coprocessor/health
 * Check semantic embedding health (provider API or Python sidecar)
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if we have a real embedding provider (OpenAI/Together/HF)
    const hasProviderEmbeddings = embedder.hasRealProvider();
    
    if (hasProviderEmbeddings) {
      // Provider-based embeddings are active
      res.json({ 
        available: true,
        status: 'ok',
        mode: 'provider',
        provider: process.env.DETECT_EMBEDDINGS_PROVIDER || 'unknown',
        model: process.env.DETECT_EMBEDDINGS_MODEL || 'default',
        lastCheck: new Date().toISOString(),
      });
      return;
    }
    
    // Check Python sidecar as fallback
    const sidecarHealthy = await semanticCoprocessor.healthCheck();
    if (sidecarHealthy) {
      res.json({ 
        available: true,
        status: 'ok',
        mode: 'sidecar',
        lastCheck: new Date().toISOString(),
      });
      return;
    }
    
    // Neither provider nor sidecar available - using structural projections
    res.json({ 
      available: false,
      status: 'degraded',
      mode: 'structural',
      message: 'Using hash-based structural projections (deterministic, not semantic)',
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check embedding system health',
      status: 'error',
    });
  }
});

/**
 * GET /api/semantic-coprocessor/stats
 * Get semantic embedding statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const hasProviderEmbeddings = embedder.hasRealProvider();
    const sidecarStats = semanticCoprocessor.getStats();
    const embedderStats = embedder.getPerformanceStats();
    
    // Combine stats from both systems
    const totalRequests = sidecarStats.totalRequests + embedderStats.total_inferences;
    const mlRequests = hasProviderEmbeddings ? embedderStats.total_inferences : sidecarStats.totalRequests - sidecarStats.fallbackActivations;
    
    res.json({
      totalRequests,
      successfulRequests: mlRequests,
      failedRequests: 0,
      fallbackActivations: sidecarStats.fallbackActivations,
      isAvailable: hasProviderEmbeddings || sidecarStats.isAvailable,
      lastHealthCheck: Date.now(),
      mode: hasProviderEmbeddings ? 'provider' : sidecarStats.isAvailable ? 'sidecar' : 'structural',
      provider: hasProviderEmbeddings ? process.env.DETECT_EMBEDDINGS_PROVIDER : undefined,
      cacheHitRate: embedderStats.cache_hit_rate,
      avgInferenceTimeMs: embedderStats.avg_inference_time_ms,
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch embedding stats',
    });
  }
});

/**
 * POST /api/semantic-coprocessor/test
 * Test semantic coprocessor with sample text
 */
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }
    
    const result = await semanticCoprocessor.similarity({
      text_a: text,
      text_b: text,
      model: 'fast',
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to test coprocessor',
    });
  }
});

export default router;