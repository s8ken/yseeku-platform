import { Router } from 'express';
import { z } from 'zod';
import { multiModelComparisonService, ComparisonRequestSchema } from '../services/multi-model-comparison.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/compare
 * Run a multi-model comparison
 */
router.post('/', async (req, res) => {
  try {
    const validated = ComparisonRequestSchema.parse(req.body);
    
    logger.info('Starting multi-model comparison', { providers: validated.providers });
    
    const result = await multiModelComparisonService.compare(validated);
    
    res.json({
      success: true,
      comparison: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      });
    }
    
    const err = error as Error;
    logger.error('Comparison failed', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Comparison failed',
      message: err.message
    });
  }
});

/**
 * GET /api/compare/providers
 * Get available model providers
 */
router.get('/providers/list', (req, res) => {
  const providers = multiModelComparisonService.getAvailableProviders();
  
  res.json({
    success: true,
    providers
  });
});

/**
 * GET /api/compare/:id
 * Get a specific comparison result
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const comparison = multiModelComparisonService.getComparison(id);
  
  if (!comparison) {
    return res.status(404).json({
      success: false,
      error: 'Comparison not found'
    });
  }
  
  res.json({
    success: true,
    comparison
  });
});

/**
 * GET /api/compare
 * List recent comparisons
 */
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  
  const comparisons = multiModelComparisonService.listComparisons(limit);
  
  res.json({
    success: true,
    comparisons,
    count: comparisons.length
  });
});

export default router;
