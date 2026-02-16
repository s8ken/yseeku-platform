/**
 * Policy Alerts WebSocket Routes
 * 
 * Integrates PolicyAlertService with Express app
 * Provides WebSocket event streaming for real-time alerts
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import {
  PolicyAlertService,
  type AlertEvent,
} from './policy-alerts';
import { PolicyEngine } from '@sonate/policy';
import {
  CoherenceTracker,
  ResonanceMonitor,
} from '@sonate/monitoring';

let alertService: PolicyAlertService | null = null;

/**
 * Alert Thresholds Configuration
 * These values control alert sensitivity (0.0 - 1.0 scale)
 * Higher values = fewer alerts (higher sensitivity threshold)
 */
interface AlertThresholds {
  highRiskThreshold: number;
  violationThreshold: number;
  escalationThreshold: number;
}

const defaultThresholds: AlertThresholds = {
  highRiskThreshold: 0.7,
  violationThreshold: 1.0,
  escalationThreshold: 0.5,
};

// Current thresholds (mutable, will be used by alert service)
let currentThresholds: AlertThresholds = { ...defaultThresholds };

/**
 * Validate threshold values are in range [0, 1]
 */
function validateThresholds(thresholds: Partial<AlertThresholds>): string | null {
  for (const [key, value] of Object.entries(thresholds)) {
    if (typeof value === 'number' && (value < 0 || value > 1)) {
      return `${key} must be between 0 and 1, got ${value}`;
    }
  }
  return null;
}

/**
 * Initialize alert service with HTTP server
 */
export function initializeAlertService(
  ioOrServer: SocketIOServer | HTTPServer,
  engine: PolicyEngine,
  coherenceTracker: CoherenceTracker,
  resonanceMonitor: ResonanceMonitor
): PolicyAlertService {
  alertService = new PolicyAlertService(
    ioOrServer,
    engine,
    coherenceTracker,
    resonanceMonitor
  );
  return alertService;
}

/**
 * Get alert service instance
 */
export function getAlertService(): PolicyAlertService | null {
  return alertService;
}

/**
 * Get current alert thresholds
 */
export function getAlertThresholds(): AlertThresholds {
  return { ...currentThresholds };
}

/**
 * Create alert routes
 */
export function createAlertRoutes(): Router {
  const router = Router();

  /**
   * Get alert history
   * GET /api/v2/policy-alerts/history?limit=100
   */
  router.get('/history', (req: Request, res: Response) => {
    if (!alertService) {
      return res.status(503).json({
        error: 'Alert service not initialized',
      });
    }

    const limit = Math.min(
      parseInt(req.query.limit as string) || 100,
      1000
    );
    const history = alertService.getAlertHistory(limit);

    res.json({
      count: history.length,
      limit,
      alerts: history,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get metrics snapshot
   * GET /api/v2/policy-alerts/metrics/:agentDid
   */
  router.get('/metrics/:agentDid', (req: Request, res: Response) => {
    if (!alertService) {
      return res.status(503).json({
        error: 'Alert service not initialized',
      });
    }

    const { agentDid } = req.params;
    const snapshot = alertService.getMetricsSnapshot(agentDid as string);

    res.json(snapshot);
  });

  /**
   * Get connected clients count
   * GET /api/v2/policy-alerts/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    if (!alertService) {
      return res.status(503).json({
        error: 'Alert service not initialized',
      });
    }

    const stats = {
      connectedClients: alertService.getConnectedClientsCount(),
      subscribedAgents: alertService.getSubscribedAgents(),
      historySize: alertService.getAlertHistory().length,
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  });

  /**
   * Broadcast system message
   * POST /api/v2/policy-alerts/broadcast
   */
  router.post('/broadcast', (req: Request, res: Response) => {
    if (!alertService) {
      return res.status(503).json({
        error: 'Alert service not initialized',
      });
    }

    const { message, severity } = req.body;

    if (!message || !['info', 'warning', 'critical'].includes(severity)) {
      return res.status(400).json({
        error: 'Invalid message or severity',
      });
    }

    alertService.broadcastSystemMessage(
      message,
      severity as 'info' | 'warning' | 'critical'
    );

    res.json({
      success: true,
      message,
      severity,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get alert thresholds
   * GET /api/v2/policy-alerts/thresholds
   */
  router.get('/thresholds', (req: Request, res: Response) => {
    const thresholds = getAlertThresholds();
    res.json({
      thresholds,
      defaults: defaultThresholds,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Update alert thresholds
   * PUT /api/v2/policy-alerts/thresholds
   * Body: { highRiskThreshold?: number, violationThreshold?: number, escalationThreshold?: number }
   */
  router.put('/thresholds', (req: Request, res: Response) => {
    const { highRiskThreshold, violationThreshold, escalationThreshold } = req.body;

    // Validate that at least one threshold is provided
    if (
      highRiskThreshold === undefined &&
      violationThreshold === undefined &&
      escalationThreshold === undefined
    ) {
      return res.status(400).json({
        error: 'At least one threshold must be provided',
      });
    }

    // Build partial update object
    const updates: Partial<AlertThresholds> = {};
    if (highRiskThreshold !== undefined) {
      updates.highRiskThreshold = highRiskThreshold;
    }
    if (violationThreshold !== undefined) {
      updates.violationThreshold = violationThreshold;
    }
    if (escalationThreshold !== undefined) {
      updates.escalationThreshold = escalationThreshold;
    }

    // Validate all values
    const validationError = validateThresholds(updates);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Apply updates
    Object.assign(currentThresholds, updates);

    res.json({
      success: true,
      thresholds: getAlertThresholds(),
      updated: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Reset alert thresholds to defaults
   * POST /api/v2/policy-alerts/thresholds/reset
   */
  router.post('/thresholds/reset', (req: Request, res: Response) => {
    currentThresholds = { ...defaultThresholds };
    res.json({
      success: true,
      thresholds: getAlertThresholds(),
      message: 'Thresholds reset to defaults',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Health check
   * GET /api/v2/policy-alerts/health
   */
  router.get('/health', (req: Request, res: Response) => {
    if (!alertService) {
      return res.status(503).json({
        status: 'unavailable',
        reason: 'Alert service not initialized',
      });
    }

    res.json({
      status: 'healthy',
      wsServer: 'running',
      connectedClients: alertService.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

/**
 * Graceful shutdown
 */
export async function shutdownAlertService(): Promise<void> {
  if (alertService) {
    await alertService.shutdown();
  }
}
