import { Router, Request, Response } from 'express';
import { protect, requireTenant } from '../middleware/auth.middleware';
import { requireScopes } from '../middleware/rbac.middleware';
import { bindTenantContext } from '../middleware/tenant-context.middleware';
import { overrideService } from '../services/override.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/overrides/queue
 * Get override queue with filtering and pagination
 */
router.get('/queue', protect, bindTenantContext, requireTenant, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const {
      status,
      type,
      startDate,
      endDate,
      search,
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      status: status ? (status as string).split(',') : undefined,
      type: type ? (type as string).split(',') : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string
    };

    const options = {
      limit: Math.min(100, Math.max(1, parseInt(limit as string))),
      offset: Math.max(0, parseInt(offset as string))
    };

    const result = await overrideService.getOverrideQueue(tenantId, filters, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    logger.error('Get override queue error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch override queue',
      error: getErrorMessage(error)
    });
  }
});

/**
 * GET /api/overrides/history
 * Get override history with filtering and pagination
 */
router.get('/history', protect, bindTenantContext, requireTenant, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const {
      decision,
      userId,
      startDate,
      endDate,
      emergency,
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      decision: decision ? (decision as string).split(',') as ('approve' | 'reject')[] : undefined,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      emergency: emergency ? emergency === 'true' : undefined
    };

    const options = {
      limit: Math.min(100, Math.max(1, parseInt(limit as string))),
      offset: Math.max(0, parseInt(offset as string))
    };

    const result = await overrideService.getOverrideHistory(tenantId, filters, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    logger.error('Get override history error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch override history',
      error: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/overrides/decide
 * Process override decision (approve/reject)
 */
router.post('/decide', protect, bindTenantContext, requireTenant, requireScopes(['overseer:act']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const userId = req.userId || 'system';
    const userEmail = req.userEmail || 'system';
    
    const { actionId, decision, reason, emergency = false } = req.body;

    if (!actionId || !decision || !reason) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: actionId, decision, reason'
      });
      return;
    }

    if (!['approve', 'reject'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be "approve" or "reject"'
      });
      return;
    }

    if (reason.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Reason must be at least 3 characters long'
      });
      return;
    }

    const result = await overrideService.processOverride({
      actionId,
      decision: decision as 'approve' | 'reject',
      reason: reason.trim().slice(0, 1000), // Limit to 1000 characters
      emergency: Boolean(emergency),
      userId,
      tenantId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    logger.error('Process override decision error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to process override decision',
      error: getErrorMessage(error)
    });
  }
});

/**
 * GET /api/overrides/stats
 * Get override statistics
 */
router.get('/stats', protect, bindTenantContext, requireTenant, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const stats = await overrideService.getOverrideStats(tenantId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: unknown) {
    logger.error('Get override stats error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch override statistics',
      error: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/overrides/bulk
 * Process bulk override decisions
 */
router.post('/bulk', protect, bindTenantContext, requireTenant, requireScopes(['overseer:act']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.userTenant || 'default';
    const userId = req.userId || 'system';
    
    const { actionIds, decision, reason } = req.body;

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'actionIds must be a non-empty array'
      });
      return;
    }

    if (!decision || !['approve', 'reject'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be "approve" or "reject"'
      });
      return;
    }

    if (!reason || reason.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Reason must be at least 3 characters long'
      });
      return;
    }

    const results = [];
    const errors = [];

    for (const actionId of actionIds) {
      try {
        const result = await overrideService.processOverride({
          actionId,
          decision: decision as 'approve' | 'reject',
          reason: reason.trim().slice(0, 1000),
          emergency: false,
          userId,
          tenantId
        });
        results.push({ actionId, ...result, processed: true });
      } catch (error: unknown) {
        errors.push({ actionId, error: getErrorMessage(error) });
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error: unknown) {
    logger.error('Bulk override error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk overrides',
      error: getErrorMessage(error)
    });
  }
});

export default router;