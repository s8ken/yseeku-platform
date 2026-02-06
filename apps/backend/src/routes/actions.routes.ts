import { Router, Request, Response } from 'express';
import { getActionRecommendations, calculateEffectiveness } from '../services/brain/feedback';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/actions/recommendations
 * Get recommended actions based on historical feedback
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const tenantId = (req.query.tenant as string) || req.headers['x-tenant-id'] as string || 'default';
    
    const recommendations = await getActionRecommendations(tenantId);
    
    res.json({
      success: true,
      data: {
        recommendations: recommendations.adjustments
      },
      tenantId,
    });
  } catch (error) {
    logger.error('Error fetching action recommendations:', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action recommendations',
    });
  }
});

/**
 * GET /api/actions/effectiveness
 * Get effectiveness metrics for action types
 */
router.get('/effectiveness', async (req: Request, res: Response) => {
  try {
    const tenantId = (req.query.tenant as string) || req.headers['x-tenant-id'] as string || 'default';
    const actionType = req.query.actionType as string;
    
    const actionTypes = actionType 
      ? [actionType] 
      : ['alert', 'adjust_threshold', 'ban_agent', 'restrict_agent', 'quarantine_agent', 'unban_agent'];
    
    const effectiveness: Record<string, any> = {};
    
    for (const type of actionTypes) {
      effectiveness[type] = await calculateEffectiveness(tenantId, type);
    }
    
    res.json({
      success: true,
      data: effectiveness,
      tenantId,
    });
  } catch (error) {
    logger.error('Error fetching action effectiveness:', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action effectiveness',
    });
  }
});

export default router;
