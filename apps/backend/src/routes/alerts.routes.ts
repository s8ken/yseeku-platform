/**
 * Alerts Management Routes
 * Trust violation alerts and system alerts with database persistence
 */

import { Router, Request, Response } from 'express';
import logger, { securityLogger } from '../utils/logger';
import { protect } from '../middleware/auth.middleware';
import { alertsService, AlertSeverity, AlertStatus } from '../services/alerts.service';
import { getErrorMessage, getErrorStack } from '../utils/error-utils';

const router = Router();

/**
 * @route   GET /api/dashboard/alerts/management
 * @desc    Get all alerts with filtering
 * @access  Private
 */
router.get('/management', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, severity, search, limit, offset } = req.query;
    const tenantId = String(req.tenant || 'default');

    // Get all alerts for filtering
    let alerts = await alertsService.list(tenantId, {
      status: status && status !== 'all' ? status as AlertStatus : undefined,
      severity: severity && severity !== 'all' ? severity as AlertSeverity : undefined,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });

    // Search filter (client-side for flexibility)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      alerts = alerts.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchLower) ||
          alert.description.toLowerCase().includes(searchLower) ||
          alert.type.toLowerCase().includes(searchLower)
      );
    }

    // Get summary stats
    const summary = await alertsService.getSummary(tenantId);

    res.json({
      success: true,
      data: {
        alerts: alerts.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        total: alerts.length,
        summary,
      },
    });
  } catch (error) {
    logger.error('Failed to get alerts', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/dashboard/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
router.post('/:id/acknowledge', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant || 'default';
    const userEmail = (req as any).userEmail || req.userId || 'unknown';

    const alert = await alertsService.acknowledge(String(id), String(userEmail), tenantId);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: { alert },
    });
  } catch (error) {
    logger.error('Failed to acknowledge alert', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/dashboard/alerts/:id/resolve
 * @desc    Resolve an alert
 * @access  Private
 */
router.post('/:id/resolve', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = String(req.tenant || 'default');
    const userEmail = (req as any).userEmail || req.userId || 'unknown';

    const alert = await alertsService.resolve(String(id), String(userEmail), tenantId);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: { alert },
    });
  } catch (error) {
    logger.error('Failed to resolve alert', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/dashboard/alerts/:id/suppress
 * @desc    Suppress an alert
 * @access  Private
 */
router.post('/:id/suppress', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { duration } = req.body;
    const tenantId = String(req.tenant || 'default');
    const userEmail = (req as any).userEmail || req.userId || 'unknown';

    if (!duration || typeof duration !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Duration (in hours) is required',
      });
      return;
    }

    const alert = await alertsService.suppress(String(id), String(userEmail), tenantId);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
      return;
    }

    res.json({
      success: true,
      message: `Alert suppressed for ${duration} hour(s)`,
      data: { alert },
    });
  } catch (error) {
    logger.error('Failed to suppress alert', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to suppress alert',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get alerts summary for dashboard
 * @access  Private
 */
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = String(req.tenant || 'default');

    // Get active alerts, sorted by timestamp, limited to 10
    const alerts = await alertsService.list(tenantId, {
      status: 'active',
      limit: 10,
    });

    // Get summary stats
    const summary = await alertsService.getSummary(tenantId);

    res.json({
      tenant: tenantId,
      summary: {
        critical: summary.critical,
        error: summary.error,
        warning: summary.warning,
        total: summary.active,
      },
      alerts: alerts.map((alert) => ({
        id: alert.id,
        timestamp: alert.timestamp,
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        details: alert.details,
      })),
    });
  } catch (error) {
    logger.error('Failed to get alerts summary', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts summary',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   POST /api/dashboard/alerts
 * @desc    Create an alert
 * @access  Private
 */
router.post('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, title, description, severity, details, agentId, conversationId } = req.body;
    const tenantId = String(req.tenant || 'default');

    if (!type || !title || !severity) {
      res.status(400).json({ success: false, message: 'type, title, severity required' });
      return;
    }

    const alert = await alertsService.create({
      type,
      title,
      description: description || '',
      severity,
      details,
      userId: req.userId,
      agentId,
      conversationId,
    }, tenantId);

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error('Failed to create alert', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({ success: false, message: 'Failed to create alert', error: getErrorMessage(error) });
  }
});

/**
 * @route   GET /api/dashboard/alerts/:id
 * @desc    Get a single alert by ID
 * @access  Private
 */
router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = String(req.tenant || 'default');

    const alert = await alertsService.get(String(id), tenantId);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
      return;
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Failed to get alert by ID', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: getErrorMessage(error),
    });
  }
});

/**
 * @route   DELETE /api/dashboard/alerts/clear
 * @desc    Clear all alerts for a tenant (admin only)
 * @access  Private
 */
router.delete('/clear', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = String(req.tenant || 'default');

    await alertsService.clear(tenantId);

    res.json({
      success: true,
      message: 'All alerts cleared',
    });
  } catch (error) {
    logger.error('Failed to clear alerts', {
      error,
      stack: getErrorStack(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to clear alerts',
      error: getErrorMessage(error),
    });
  }
});

export default router;
