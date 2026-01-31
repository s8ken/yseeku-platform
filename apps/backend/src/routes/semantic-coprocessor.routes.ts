/**
 * Semantic Coprocessor Routes
 * 
 * Proxy routes to the Python ML coprocessor service.
 * Provides stats and health endpoints for the frontend.
 */

import { Router, Request, Response } from 'express';
import { semanticCoprocessor } from '@sonate/detect';

const router = Router();

/**
 * GET /api/semantic-coprocessor/health
 * Check semantic coprocessor health
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const isHealthy = await semanticCoprocessor.healthCheck();
    res.json({ 
      available: isHealthy,
      status: isHealthy ? 'ok' : 'unavailable',
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check coprocessor health',
      status: 'error',
    });
  }
});

/**
 * GET /api/semantic-coprocessor/stats
 * Get semantic coprocessor statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = semanticCoprocessor.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch coprocessor stats',
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