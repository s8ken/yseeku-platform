/**
 * VLS (Velocity Linguistic Steering) Routes
 * 
 * Provides API endpoints for linguistic analysis of conversations.
 * 
 * RESEARCH PREVIEW: These metrics are experimental and should be
 * interpreted as research signals, not definitive measurements.
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { vlsService } from '../services/vls.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/lab/vls/sessions
 * Get VLS metrics for recent sessions/conversations
 */
router.get('/sessions', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const sessionId = req.query.sessionId as string | undefined;
    
    const sessions = await vlsService.getSessionMetrics(userTenant, sessionId);
    
    res.json({
      success: true,
      data: {
        sessions,
        researchPreview: true,
        disclaimer: 'VLS metrics are experimental research signals and should not be used as definitive measurements.',
      },
    });
  } catch (error) {
    logger.error('VLS sessions error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get VLS sessions',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/lab/vls/baselines
 * Get VLS baselines by project type
 */
router.get('/baselines', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    
    const baselines = await vlsService.getBaselines(userTenant);
    
    res.json({
      success: true,
      data: {
        baselines,
        researchPreview: true,
      },
    });
  } catch (error) {
    logger.error('VLS baselines error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to get VLS baselines',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/lab/vls/analyze
 * Analyze a text snippet for linguistic metrics
 */
router.post('/analyze', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, baselineText } = req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Text is required',
      });
      return;
    }
    
    const baselineVocab: Set<string> = baselineText 
      ? new Set(baselineText.toLowerCase().split(/\s+/) as string[])
      : new Set<string>();
    
    const metrics = vlsService.analyzeText(text, baselineVocab);
    
    res.json({
      success: true,
      data: {
        metrics,
        researchPreview: true,
        disclaimer: 'VLS metrics are experimental research signals.',
      },
    });
  } catch (error) {
    logger.error('VLS analyze error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to analyze text',
      error: getErrorMessage(error),
    });
  }
});

export default router;
