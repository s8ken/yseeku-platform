/**
 * Policy Override Routes
 * 
 * Manage authorized policy overrides with audit trail using @sonate/policy
 */

import { Router, Request, Response } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import { createOverrideManager, type OverrideRequest } from '@sonate/policy';

// Shared override manager instance
const overrideManager = createOverrideManager();

const router = Router();

/**
 * POST /api/policy-overrides
 * Create a new policy override
 */
router.post('/', protect, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId || 'unknown';
    const request: OverrideRequest = {
      ...req.body,
      authorizedBy: userId,
    };

    const result = overrideManager.createOverride(request);

    if ('error' in result) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    logger.info('Policy override created', { overrideId: result.id, authorizedBy: userId });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('Override creation failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to create override' });
  }
});

/**
 * GET /api/policy-overrides
 * List all overrides with optional filtering
 */
router.get('/', protect, (_req: Request, res: Response): void => {
  const overrides = overrideManager.getActiveOverrides();
  const stats = overrideManager.getStatistics();

  res.json({
    success: true,
    data: { overrides, stats },
  });
});

/**
 * DELETE /api/policy-overrides/:id
 * Revoke an override
 */
router.delete('/:id', protect, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId || 'unknown';
    const { reason } = req.body || {};

    overrideManager.revokeOverride(id, userId, reason || 'Manual revocation');

    logger.info('Policy override revoked', { overrideId: id, revokedBy: userId });
    res.json({ success: true, message: 'Override revoked' });
  } catch (error) {
    logger.error('Override revocation failed', { error: getErrorMessage(error), overrideId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to revoke override' });
  }
});

export { overrideManager };
export default router;
