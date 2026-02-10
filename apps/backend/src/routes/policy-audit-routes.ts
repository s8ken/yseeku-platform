/**
 * Policy Audit Logger Routes
 * 
 * REST API for querying audit logs and generating reports
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import {
  PolicyAuditLogger,
  type AuditQueryOptions,
} from './policy-audit-logger';

let auditLogger: PolicyAuditLogger | null = null;

/**
 * Initialize audit logger
 */
export function initializeAuditLogger(logger: PolicyAuditLogger): void {
  auditLogger = logger;
}

/**
 * Create audit logging routes
 */
export function createAuditRoutes(): Router {
  const router = Router();

  /**
   * Query audit logs
   * GET /api/v2/audit/logs
   * Query parameters:
   *   - startDate: ISO date string
   *   - endDate: ISO date string
   *   - agentDid: filter by agent
   *   - action: comma-separated actions (evaluate,block,allow,override,escalate)
   *   - result: comma-separated results (passed,failed,blocked)
   *   - limit: max results (default 100, max 1000)
   */
  router.get('/logs', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const options: AuditQueryOptions = {
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      agentDid: req.query.agentDid as string | undefined,
      action: req.query.action
        ? (req.query.action as string).split(',')
        : undefined,
      result: req.query.result
        ? (req.query.result as string).split(',')
        : undefined,
      limit: Math.min(
        parseInt(req.query.limit as string) || 100,
        1000
      ),
    };

    const logs = auditLogger.query(options);

    res.json({
      count: logs.length,
      options,
      logs,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get logs for specific agent
   * GET /api/v2/audit/agent/:agentDid?limit=100
   */
  router.get('/agent/:agentDid', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const limit = Math.min(
      parseInt(req.query.limit as string) || 100,
      1000
    );
    const logs = auditLogger.getAgentLogs(req.params.agentDid, limit);

    res.json({
      agentDid: req.params.agentDid,
      count: logs.length,
      logs,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get audit statistics
   * GET /api/v2/audit/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const stats = auditLogger.getStatistics();

    res.json({
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Export logs as CSV
   * GET /api/v2/audit/export/csv?startDate=...&endDate=...&agentDid=...
   */
  router.get('/export/csv', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const options: AuditQueryOptions = {
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      agentDid: req.query.agentDid as string | undefined,
      action: req.query.action
        ? (req.query.action as string).split(',')
        : undefined,
      result: req.query.result
        ? (req.query.result as string).split(',')
        : undefined,
    };

    const csv = auditLogger.exportAsCSV(options);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  });

  /**
   * Export logs as JSON
   * GET /api/v2/audit/export/json?startDate=...&endDate=...&agentDid=...
   */
  router.get('/export/json', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const options: AuditQueryOptions = {
      startDate: req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined,
      endDate: req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined,
      agentDid: req.query.agentDid as string | undefined,
      action: req.query.action
        ? (req.query.action as string).split(',')
        : undefined,
      result: req.query.result
        ? (req.query.result as string).split(',')
        : undefined,
    };

    const json = auditLogger.exportAsJSON(options);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.send(json);
  });

  /**
   * Get logs in date range
   * GET /api/v2/audit/range?startDate=...&endDate=...
   */
  router.get('/range', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const logs = auditLogger.getLogsInRange(startDate, endDate);

    res.json({
      range: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      count: logs.length,
      logs,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get audit summary for compliance reporting
   * GET /api/v2/audit/summary?days=30
   */
  router.get('/summary', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        error: 'Audit logger not initialized',
      });
    }

    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const logs = auditLogger.getLogsInRange(startDate, endDate);
    const stats = auditLogger.getStatistics();

    const summary = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
      statistics: stats,
      compliance: {
        totalDecisions: stats.totalLogs,
        blockedCount: stats.blockedCount,
        blockRate: (
          (stats.blockedCount / stats.totalLogs) *
          100
        ).toFixed(2),
        overrideCount: stats.overrideCount,
        escalationCount: stats.escalationCount,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(summary);
  });

  /**
   * Health check
   * GET /api/v2/audit/health
   */
  router.get('/health', (req: Request, res: Response) => {
    if (!auditLogger) {
      return res.status(503).json({
        status: 'unavailable',
      });
    }

    res.json({
      status: 'healthy',
      logCount: auditLogger.getLogCount(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
