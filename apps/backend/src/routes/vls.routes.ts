/**
 * VLS (Linguistic Vector Steering) Routes
 * 
 * Provides API endpoints for collaboration dynamics analysis.
 * Integrates real conversation analysis with demo fallback.
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { vlsService } from '../services/vls.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/vls/analysis
 * Get VLS analysis for the current user's conversations
 * 
 * Query params:
 * - limit: number (default: 10, max: 50)
 * - demo: boolean (force demo data)
 */
router.get('/analysis', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const forceDemo = req.query.demo === 'true';

    let analysis;
    
    if (forceDemo) {
      // Return demo data
      analysis = vlsService.getDemoVLSAnalysis();
    } else {
      // Try real analysis, fall back to demo if no data
      analysis = await vlsService.getVLSAnalysis(tenantId, userId, limit);
      
      if (analysis.sessions.length === 0) {
        // No real conversations, return demo data
        analysis = vlsService.getDemoVLSAnalysis();
        logger.info('VLS: No conversations found, returning demo data', { userId, tenantId });
      }
    }

    res.json({
      success: true,
      data: analysis,
      meta: {
        isDemo: forceDemo || analysis.sessions.some(s => s.id.startsWith('vls-demo')),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('VLS analysis error', {
      error: getErrorMessage(error),
      userId: req.userId,
    });
    
    // Graceful degradation: return demo data on error
    const demoAnalysis = vlsService.getDemoVLSAnalysis();
    res.json({
      success: true,
      data: demoAnalysis,
      meta: {
        isDemo: true,
        fallback: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/vls/session/:id
 * Get detailed VLS analysis for a specific conversation
 */
router.get('/session/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';

    // Check if requesting demo session
    if (id.startsWith('vls-demo')) {
      const demoAnalysis = vlsService.getDemoVLSAnalysis();
      const session = demoAnalysis.sessions.find(s => s.id === id);
      
      if (session) {
        res.json({
          success: true,
          data: session,
          meta: { isDemo: true },
        });
        return;
      }
    }

    // Try to find real session
    const analysis = await vlsService.getVLSAnalysis(tenantId, userId, 50);
    const session = analysis.sessions.find(s => s.id === id || s.conversationId === id);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
      meta: { isDemo: false },
    });
  } catch (error) {
    logger.error('VLS session lookup error', {
      error: getErrorMessage(error),
      sessionId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VLS session',
    });
  }
});

/**
 * GET /api/vls/baselines
 * Get baseline metrics for comparison
 */
router.get('/baselines', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';

    const analysis = await vlsService.getVLSAnalysis(tenantId, userId, 50);

    if (analysis.baselines.length === 0) {
      // Return demo baselines
      const demoAnalysis = vlsService.getDemoVLSAnalysis();
      res.json({
        success: true,
        data: demoAnalysis.baselines,
        meta: { isDemo: true },
      });
      return;
    }

    res.json({
      success: true,
      data: analysis.baselines,
      meta: { isDemo: false },
    });
  } catch (error) {
    logger.error('VLS baselines error', { error: getErrorMessage(error) });
    
    const demoAnalysis = vlsService.getDemoVLSAnalysis();
    res.json({
      success: true,
      data: demoAnalysis.baselines,
      meta: { isDemo: true, fallback: true },
    });
  }
});

/**
 * GET /api/vls/aggregate
 * Get aggregate VLS metrics across all conversations
 */
router.get('/aggregate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const tenantId = req.userTenant || 'default';

    const analysis = await vlsService.getVLSAnalysis(tenantId, userId, 100);

    res.json({
      success: true,
      data: analysis.aggregateMetrics,
      sessionCount: analysis.sessions.length,
      meta: {
        isDemo: analysis.sessions.some(s => s.id.startsWith('vls-demo')),
      },
    });
  } catch (error) {
    logger.error('VLS aggregate error', { error: getErrorMessage(error) });
    
    const demoAnalysis = vlsService.getDemoVLSAnalysis();
    res.json({
      success: true,
      data: demoAnalysis.aggregateMetrics,
      sessionCount: demoAnalysis.sessions.length,
      meta: { isDemo: true, fallback: true },
    });
  }
});

export default router;
