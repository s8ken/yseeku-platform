/**
 * Alerts Management Routes
 * Trust violation alerts and system alerts with database persistence
 */

import { Router, Request, Response } from 'express';
import logger, { securityLogger } from '../utils/logger';
import { protect } from '../middleware/auth.middleware';
import { AlertsService } from '../services/alerts.service';
import { IAlert } from '../models/alert.model';
import { getErrorMessage, getErrorStack } from '../utils/error-utils';

type AlertSeverity = IAlert['severity'];
type AlertStatus = IAlert['status'];

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

    // Query real alerts for any tenant (including live-tenant)
    // If no alerts exist for the tenant, the query naturally returns empty results

    // Get all alerts for filtering
    let { alerts, total } = await AlertsService.getAlerts(tenantId, {
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
    const summary = await AlertsService.getAlertStats(tenantId);

    res.json({
      success: true,
      data: {
        alerts: alerts.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // created_at instead of timestamp
        ),
        total: total,
        summary: {
          critical: summary.critical,
          high: 0, // No high severity in new AlertsService.getAlertStats
          medium: 0, // No medium severity in new AlertsService.getAlertStats
          low: 0, // No low severity in new AlertsService.getAlertStats
          total: summary.total,
          active: summary.active,
          acknowledged: 0, // Not available in new AlertsService.getAlertStats
          resolved: 0, // Not available in new AlertsService.getAlertStats
        },
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
    const userEmail = (req as any).userEmail || req.userId || 'unknown';

    const alert = await AlertsService.acknowledgeAlert(String(id), String(userEmail));

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

    const alert = await AlertsService.resolveAlert(String(id));

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
 * @route   GET /api/dashboard/alerts
 * @desc    Get alerts summary for dashboard
 * @access  Private
 */
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = String(req.tenant || 'default');

    // Query real alerts for any tenant (including live-tenant)
    // If no alerts exist, the query naturally returns empty results

    // Get active alerts, sorted by created_at, limited to 10
    const { alerts } = await AlertsService.getAlerts(tenantId, {
      status: 'active',
      limit: 10,
    });

    // Get summary stats
    const summary = await AlertsService.getAlertStats(tenantId);

    res.json({
      tenant: tenantId,
      summary: {
        critical: summary.critical,
        total: summary.active,
      },
      alerts: alerts.map((alert) => ({
        id: alert._id.toString(), // Use _id.toString() from IAlert
        created_at: alert.created_at, // Use created_at from IAlert
        type: alert.type,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        metadata: alert.metadata, // Use metadata from IAlert
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
    const { type, title, description, severity, metadata, receipt_id, session_id } = req.body;
    const tenantId = String(req.tenant || 'default'); // This is available from req.tenant

    if (!type || !title || !severity) {
      res.status(400).json({ success: false, message: 'type, title, severity required' });
      return;
    }

    const alert = await AlertsService.createAlert({
      tenant_id: tenantId, // From req.tenant
      type,
      title,
      description: description || '',
      severity,
      metadata: metadata || {}, // Assuming details is now metadata
      receipt_id,
      session_id,
      // status will default to active
      // created_at will default to Date.now
    });

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

    const { alerts } = await AlertsService.getAlerts(tenantId, { limit: 1000 }); // Fetch a reasonable number of alerts

    const alert = alerts.find(a => a._id.toString() === id);

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



export default router;
