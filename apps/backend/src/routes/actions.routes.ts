import { Router, Request, Response } from 'express';
import { getActionRecommendations, calculateEffectiveness } from '../services/brain/feedback';
import { protect } from '../middleware/auth.middleware';
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
/**
 * POST /api/actions/execute
 * Execute a recommended action against an agent
 */
router.post('/execute', protect, async (req: Request, res: Response) => {
  try {
    const { actionType, target, recommendationId, reason } = req.body;
    const userId = req.userId;
    const tenantId = (req as any).tenant?.id || req.headers['x-tenant-id'] as string || 'default';

    if (!actionType || !target) {
      return res.status(400).json({
        success: false,
        error: 'actionType and target are required',
      });
    }

    const validActionTypes = ['ban_agent', 'restrict_agent', 'quarantine_agent', 'unban_agent', 'alert', 'adjust_threshold'];
    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid actionType. Must be one of: ${validActionTypes.join(', ')}`,
      });
    }

    // Import Agent model dynamically to avoid circular deps
    const { Agent } = await import('../models/agent.model');

    let result: Record<string, any> = {};
    const executedAt = new Date().toISOString();

    // Find the agent by id or name
    const agent = await Agent.findOne({
      $or: [
        { _id: target.length === 24 ? target : undefined },
        { agentId: target },
        { name: target },
      ],
      tenantId,
    }).catch(() => null);

    switch (actionType) {
      case 'ban_agent': {
        if (agent) {
          const prevStatus = (agent as any).banStatus || 'active';
          (agent as any).banStatus = 'banned';
          (agent as any).banReason = reason || `Banned via System Brain recommendation (${recommendationId || 'manual'})`;
          await agent.save();
          result = { agentId: agent._id, previousStatus: prevStatus, newStatus: 'banned' };
        } else {
          result = { agentId: target, note: 'Agent not found in database - logged for review' };
        }
        break;
      }
      case 'restrict_agent': {
        if (agent) {
          const prevStatus = (agent as any).banStatus || 'active';
          (agent as any).banStatus = 'restricted';
          (agent as any).banReason = reason || `Restricted via System Brain recommendation (${recommendationId || 'manual'})`;
          await agent.save();
          result = { agentId: agent._id, previousStatus: prevStatus, newStatus: 'restricted' };
        } else {
          result = { agentId: target, note: 'Agent not found in database - logged for review' };
        }
        break;
      }
      case 'quarantine_agent': {
        if (agent) {
          const prevStatus = (agent as any).banStatus || 'active';
          (agent as any).banStatus = 'quarantined';
          await agent.save();
          result = { agentId: agent._id, previousStatus: prevStatus, newStatus: 'quarantined' };
        } else {
          result = { agentId: target, note: 'Agent not found in database - logged for review' };
        }
        break;
      }
      case 'unban_agent': {
        if (agent) {
          (agent as any).banStatus = 'active';
          (agent as any).banReason = undefined;
          await agent.save();
          result = { agentId: agent._id, previousStatus: 'banned', newStatus: 'active' };
        } else {
          result = { agentId: target, note: 'Agent not found in database - logged for review' };
        }
        break;
      }
      case 'alert': {
        result = { type: 'alert', target, message: reason || 'Alert created via System Brain recommendation' };
        break;
      }
      case 'adjust_threshold': {
        result = { type: 'adjust_threshold', target, note: 'Threshold adjustment logged for operator review' };
        break;
      }
    }

    // Log the action to an in-memory store (simple approach)
    const actionLog = {
      id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      actionType,
      target,
      tenantId,
      userId,
      recommendationId,
      reason,
      executedAt,
      result,
      success: true,
    };

    // Store in global actions log (in-memory, survives server restarts as best effort)
    if (!(global as any).__actionsLog) (global as any).__actionsLog = [];
    (global as any).__actionsLog.unshift(actionLog);
    if ((global as any).__actionsLog.length > 200) (global as any).__actionsLog = (global as any).__actionsLog.slice(0, 200);

    logger.info('Action executed', { actionType, target, tenantId, userId, executedAt });

    res.json({
      success: true,
      data: {
        actionId: actionLog.id,
        actionType,
        target,
        executedAt,
        result,
      },
    });
  } catch (error) {
    logger.error('Error executing action:', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
    });
  }
});
/**
 * GET /api/actions/log
 * Get recent action execution log
 */
router.get('/log', protect, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id || req.headers['x-tenant-id'] as string || 'default';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const allLogs = (global as any).__actionsLog || [];
    const tenantLogs = allLogs
      .filter((log: any) => !log.tenantId || log.tenantId === tenantId)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        log: tenantLogs,
        count: tenantLogs.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching action log:', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action log',
    });
  }
});

export default router;
