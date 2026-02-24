/**
 * Policy Alerts Routes
 * 
 * CRUD endpoints for policy violation alerts using @sonate/policy
 */

import { Router, Request, Response } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import {
  createViolationDetector,
  AlertChannel,
  type ViolationAlert,
} from '@sonate/policy';

// Shared violation detector instance
const violationDetector = createViolationDetector({
  channels: [AlertChannel.CONSOLE, AlertChannel.WEBSOCKET],
  priorities: { critical: true, high: true, medium: true, low: false },
  throttleMs: 1000,
});

const router = Router();

/**
 * GET /api/policy-alerts
 * List recent violation alerts
 */
router.get('/', protect, (_req: Request, res: Response): void => {
  const alerts = violationDetector.getUnacknowledgedAlerts();
  const stats = violationDetector.getStatistics();

  res.json({
    success: true,
    data: {
      alerts: alerts.slice(0, 100),
      stats,
    },
  });
});

/**
 * POST /api/policy-alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId || 'unknown';

    violationDetector.acknowledgeAlert(id, userId);

    res.json({ success: true, message: 'Alert acknowledged' });
  } catch (error) {
    logger.error('Alert acknowledgement failed', { error: getErrorMessage(error), alertId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
});

export { violationDetector };
export default router;
