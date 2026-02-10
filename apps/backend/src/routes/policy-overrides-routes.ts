/**
 * Policy Override Routes
 * 
 * REST API for managing policy overrides
 * Requires authorization - add authentication middleware before using
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import {
  PolicyOverrideManager,
  type OverrideRequest,
} from './policy-override-manager';
import { PolicyAuditLogger } from './policy-audit-logger';

let overrideManager: PolicyOverrideManager | null = null;
let auditLogger: PolicyAuditLogger | null = null;

/**
 * Initialize override manager
 */
export function initializeOverrideManager(
  manager: PolicyOverrideManager,
  logger: PolicyAuditLogger
): void {
  overrideManager = manager;
  auditLogger = logger;
}

/**
 * Simple authorization check (stub - replace with real auth in production)
 */
function requireAuthorization(
  req: Request,
  res: Response,
  next: Function
): any {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      error: 'Authorization required',
      message: 'Include Authorization header',
    });
  }

  // Stub: just check token exists
  // In production, validate JWT or session token
  (req as any).authorizedBy = 'system'; // Would be extracted from JWT
  next();
}

/**
 * Create override routes
 */
export function createOverrideRoutes(): Router {
  const router = Router();

  // Apply authorization to all routes
  router.use(requireAuthorization);

  /**
   * Create override
   * POST /api/v2/overrides
   */
  router.post('/', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    const overrideRequest: OverrideRequest = {
      ...req.body,
      authorizedBy: (req as any).authorizedBy,
    };

    // Validate request
    const validation = overrideManager.validateRequest(overrideRequest);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    // Create override
    const override = overrideManager.createOverride(overrideRequest);

    // Log to audit
    if (auditLogger) {
      const receipt = {
        id: overrideRequest.receiptId,
        agent_did: overrideRequest.agentDid,
        timestamp: new Date().toISOString(),
        telemetry: { truth_debt: 0, coherence_score: 0 },
      } as any;

      auditLogger.logOverride(
        receipt,
        overrideRequest.authorizedBy,
        overrideRequest.reason,
        overrideRequest.principlesApplied
      );
    }

    res.status(201).json({
      override,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get override by ID
   * GET /api/v2/overrides/:overrideId
   */
  router.get('/:overrideId', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    const override = overrideManager.getOverride(req.params.overrideId);

    if (!override) {
      return res.status(404).json({
        error: 'Override not found',
      });
    }

    res.json({
      override,
      isValid: overrideManager.isValid(override),
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get active overrides for receipt
   * GET /api/v2/overrides/receipt/:receiptId
   */
  router.get('/receipt/:receiptId', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    const overrides = overrideManager.getActiveOverridesForReceipt(
      req.params.receiptId
    );

    res.json({
      count: overrides.length,
      overrides,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get active overrides for agent
   * GET /api/v2/overrides/agent/:agentDid
   */
  router.get('/agent/:agentDid', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    const overrides = overrideManager.getActiveOverridesForAgent(
      req.params.agentDid
    );

    res.json({
      count: overrides.length,
      agentDid: req.params.agentDid,
      overrides,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Revoke override
   * DELETE /api/v2/overrides/:overrideId
   */
  router.delete('/:overrideId', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    const success = overrideManager.revokeOverride(req.params.overrideId);

    if (!success) {
      return res.status(404).json({
        error: 'Override not found',
      });
    }

    res.json({
      success: true,
      revoked: req.params.overrideId,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get override statistics
   * GET /api/v2/overrides-stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    const stats = overrideManager.getStatistics();

    res.json({
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get all overrides
   * GET /api/v2/overrides-all (with optional date range)
   */
  router.get('/', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        error: 'Override manager not initialized',
      });
    }

    let overrides = overrideManager.getAllOverrides();

    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(0);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      overrides = overrideManager.getOverridesInRange(startDate, endDate);
    }

    res.json({
      count: overrides.length,
      overrides: overrides.slice(-100), // Return last 100
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Health check
   * GET /api/v2/overrides/health
   */
  router.get('/health', (req: Request, res: Response) => {
    if (!overrideManager) {
      return res.status(503).json({
        status: 'unavailable',
      });
    }

    res.json({
      status: 'healthy',
      overrideCount: overrideManager.getCount(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
