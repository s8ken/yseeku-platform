/**
 * Alerts Management Routes
 * Trust violation alerts and system alerts
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import logger, { securityLogger } from '../utils/logger';
import { alertsService } from '../services/alerts.service';

const router = Router();

// In-memory alert storage (in production, use database)
interface Alert {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  details?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
}

// Seed alerts (in production, use database)
const mockAlerts: Alert[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: 'trust_violation',
    title: 'Low Trust Score Detected',
    description: 'Agent conversation dropped below acceptable trust threshold (score: 4.2/10)',
    severity: 'warning',
    status: 'active',
    details: {
      agentId: 'agent-123',
      conversationId: 'conv-456',
      trustScore: 4.2,
      violations: ['CONSENT_ARCHITECTURE', 'INSPECTION_MANDATE'],
    },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'security',
    title: 'Multiple Failed Authentication Attempts',
    description: '5 failed login attempts detected from IP: 192.168.1.100',
    severity: 'error',
    status: 'acknowledged',
    acknowledgedBy: 'admin@sonate.io',
    acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    details: {
      ipAddress: '192.168.1.100',
      attemptCount: 5,
      usernames: ['admin', 'root', 'test'],
    },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: 'trust_violation',
    title: 'Constitutional Principle Violation',
    description: 'ETHICAL_OVERRIDE principle violated in agent response',
    severity: 'critical',
    status: 'active',
    details: {
      principle: 'ETHICAL_OVERRIDE',
      agentId: 'agent-789',
      violationType: 'explicit_bypass',
    },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    type: 'performance',
    title: 'High API Latency',
    description: 'Average API response time exceeded 2000ms threshold',
    severity: 'warning',
    status: 'resolved',
    resolvedBy: 'admin@sonate.io',
    resolvedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    details: {
      avgLatency: 2450,
      threshold: 2000,
      endpoint: '/api/trust/evaluate',
    },
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'trust_violation',
    title: 'Agent Disconnection Warning',
    description: 'Agent violated RIGHT_TO_DISCONNECT - insufficient disconnect mechanism',
    severity: 'error',
    status: 'acknowledged',
    acknowledgedBy: 'admin@sonate.io',
    acknowledgedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    details: {
      agentId: 'agent-456',
      principle: 'RIGHT_TO_DISCONNECT',
      missingFeatures: ['explicit_disconnect_button', 'session_termination'],
    },
  },
];

// Initialize service with seeds
for (const a of mockAlerts) alertsService.create({
  type: a.type, title: a.title, description: a.description, severity: a.severity,
  details: a.details, userId: a.userId, agentId: a.agentId, conversationId: a.conversationId,
  status: a.status
});

/**
 * @route   GET /api/dashboard/alerts/management
 * @desc    Get all alerts with filtering
 * @access  Private
 */
router.get('/management', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, severity, search } = req.query;

    let filteredAlerts = [...alertsService.list()];

    // Filter by status
    if (status && status !== 'all') {
      filteredAlerts = filteredAlerts.filter((alert) => alert.status === status);
    }

    // Filter by severity
    if (severity && severity !== 'all') {
      filteredAlerts = filteredAlerts.filter((alert) => alert.severity === severity);
    }

    // Search filter
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredAlerts = filteredAlerts.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchLower) ||
          alert.description.toLowerCase().includes(searchLower) ||
          alert.type.toLowerCase().includes(searchLower)
      );
    }

    // Calculate summary
    const all = alertsService.list();
    const summary = {
      critical: all.filter((a) => a.severity === 'critical').length,
      error: all.filter((a) => a.severity === 'error').length,
      warning: all.filter((a) => a.severity === 'warning').length,
      info: all.filter((a) => a.severity === 'info').length,
      active: all.filter((a) => a.status === 'active').length,
      acknowledged: all.filter((a) => a.status === 'acknowledged').length,
      resolved: all.filter((a) => a.status === 'resolved').length,
    };

    res.json({
      success: true,
      data: {
        alerts: filteredAlerts.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        total: filteredAlerts.length,
        summary,
      },
    });
  } catch (error: any) {
    logger.error('Get alerts error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message,
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
    const alert = alertsService.acknowledge(id, (req as any).userEmail || 'admin@sonate.io');
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
  } catch (error: any) {
    securityLogger.error('Acknowledge alert error', {
      alertId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message,
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
    const alert = alertsService.resolve(id, (req as any).userEmail || 'admin@sonate.io');

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
  } catch (error: any) {
    securityLogger.error('Resolve alert error', {
      alertId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/dashboard/alerts/:id/suppress
 * @desc    Suppress an alert for a duration
 * @access  Private
 */
router.post('/:id/suppress', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    if (!duration || typeof duration !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Duration (in hours) is required',
      });
      return;
    }

    const alert = mockAlerts.find((a) => a.id === id);

    if (!alert) {
      res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
      return;
    }

    // Update alert status
    alert.status = 'suppressed';
    if (!alert.details) alert.details = {};
    const durationHours = duration as number;
    alert.details.suppressedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
    alert.details.suppressedBy = (req as any).userEmail || 'admin@sonate.io';

    res.json({
      success: true,
      message: `Alert suppressed for ${duration} hour(s)`,
      data: { alert },
    });
  } catch (error: any) {
    securityLogger.error('Suppress alert error', {
      alertId: req.params.id,
      duration: req.body.duration,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to suppress alert',
      error: error.message,
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
    const alerts = alertsService.list()
      .filter((a) => a.status === 'active')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Top 10 recent alerts

    const all = alertsService.list();
    const summary = {
      critical: all.filter((a) => a.severity === 'critical' && a.status === 'active').length,
      error: all.filter((a) => a.severity === 'error' && a.status === 'active').length,
      warning: all.filter((a) => a.severity === 'warning' && a.status === 'active').length,
      total: all.filter((a) => a.status === 'active').length,
    };

    res.json({
      tenant: 'default',
      summary,
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
  } catch (error: any) {
    logger.error('Get alerts summary error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts summary',
      error: error.message,
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
    const { type, title, description, severity, details } = req.body;
    if (!type || !title || !severity) {
      res.status(400).json({ success: false, message: 'type, title, severity required' });
      return;
    }
    const alert = alertsService.create({ type, title, description, severity, details, userId: req.userId });
    res.status(201).json({ success: true, data: alert });
  } catch (error: any) {
    logger.error('Create alert error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create alert', error: error.message });
  }
});

export default router;
