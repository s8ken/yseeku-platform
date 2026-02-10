import { Router } from 'express';
import type { Server as HTTPServer } from 'http';
import { analyzeInteraction } from './controllers/resonanceController';
import receiptsRoutes from './routes/receipts.routes';
import didResolverRoutes from './routes/did-resolver.routes';
import policiesRoutes from './routes/policies.routes';
import { createPolicyAPIService } from './routes/policy-api';
import { createAlertRoutes, initializeAlertService } from './routes/policy-alerts-routes';
import { createOverrideRoutes, initializeOverrideManager } from './routes/policy-overrides-routes';
import { createAuditRoutes, initializeAuditLogger } from './routes/policy-audit-routes';
import { createAuditLogger } from './routes/policy-audit-logger';
import { createOverrideManager } from './routes/policy-override-manager';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';

let router: Router;

/**
 * Initialize routes with HTTP server (for WebSocket support)
 */
export function initializeRoutes(httpServer?: HTTPServer): Router {
  router = Router();

  // Phase 1: Receipts & DIDs (no auth required)
  router.use('/receipts', receiptsRoutes);
  router.use('/dids', didResolverRoutes);

  // Phase 2A: Policy Engine (no auth required for policy reading)
  router.use('/policies', policiesRoutes);

  // Phase 2.7-2.10: Initialize Policy Services
  const auditLogger = createAuditLogger();
  const overrideManager = createOverrideManager();
  initializeAuditLogger(auditLogger);
  initializeOverrideManager(overrideManager, auditLogger);

  // Phase 2C: Policy Decision API (SYMBI-based evaluation) with audit logging
  // Apply optional auth - can be called without token but audit logs will note if authenticated
  const policyAPIService = createPolicyAPIService(auditLogger);
  router.use('/api/v2/policy', optionalAuthMiddleware, policyAPIService.getRouter());

  // Phase 2.7: WebSocket Alerts (initialize if HTTP server provided)
  if (httpServer) {
    const alertService = initializeAlertService(
      httpServer,
      policyAPIService.getEngine(),
      (policyAPIService as any).coherenceTracker,
      (policyAPIService as any).resonanceMonitor
    );
    // Re-create API service with alert service
    const enhancedPolicyAPIService = createPolicyAPIService(auditLogger, alertService);
    router.use('/api/v2/policy', optionalAuthMiddleware, enhancedPolicyAPIService.getRouter());
    
    // Mount alert routes (require auth for override operations)
    router.use('/api/v2/policy-alerts', createAlertRoutes());
  }

  // Phase 2.8: Override Management (require auth)
  router.use('/api/v2/overrides', authMiddleware, createOverrideRoutes());

  // Phase 2.10: Audit Logging (require auth)
  router.use('/api/v2/audit', authMiddleware, createAuditRoutes());

  // The new "Third Mind" Endpoint (no auth required)
  router.post('/trust/analyze', analyzeInteraction);

  return router;
}

// Default export for backward compatibility
router = initializeRoutes();

export default router;