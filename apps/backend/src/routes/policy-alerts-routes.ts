/**
 * Policy Alerts WebSocket Routes
 * 
 * Integrates PolicyAlertService with Express app
 * Provides WebSocket event streaming for real-time alerts
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Server as HTTPServer } from 'http';
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
 * Initialize alert service with HTTP server
 */
export function initializeAlertService(
  httpServer: HTTPServer,
  engine: PolicyEngine,
  coherenceTracker: CoherenceTracker,
  resonanceMonitor: ResonanceMonitor
): PolicyAlertService {
  alertService = new PolicyAlertService(
    httpServer,
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
    const snapshot = alertService.getMetricsSnapshot(agentDid);

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
