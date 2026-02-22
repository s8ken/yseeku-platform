import { Router } from 'express';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import { analyzeInteraction } from './controllers/resonanceController';
import receiptsRoutes from './routes/receipts.routes';
import didResolverRoutes from './routes/did-resolver.routes';
// TODO: Restore policy routes when @sonate/policy packages are ready
// import policiesRoutes from './routes/policies.routes';
// import { createPolicyAPIService } from './routes/policy-api';
// import { createAlertRoutes, initializeAlertService } from './routes/policy-alerts-routes';
// import { createOverrideRoutes, initializeOverrideManager } from './routes/policy-overrides-routes';
// import { createAuditRoutes, initializeAuditLogger } from './routes/policy-audit-routes';
// import { createAuditLogger } from './routes/policy-audit-logger';
// import { createOverrideManager } from './routes/policy-override-manager';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';

let router: Router;

/**
 * Initialize routes with HTTP server and optional Socket.IO instance
 */
export function initializeRoutes(httpServer?: HTTPServer, ioInstance?: SocketIOServer): Router {
  router = Router();

  // Phase 1: Receipts & DIDs (no auth required)
  router.use('/receipts', receiptsRoutes);
  router.use('/dids', didResolverRoutes);

  // Phase 2A: Policy Engine routes DISABLED
  // TODO: Restore when @sonate/policy packages are ready
  // router.use('/policies', policiesRoutes);
  // Policy service initialization disabled
  // Policy alert routes disabled
  // Override management routes disabled
  // Audit logging routes disabled

  // The new "Third Mind" Endpoint (no auth required)
  router.post('/trust/analyze', analyzeInteraction);

  return router;
}

// Default export for backward compatibility
router = initializeRoutes();

export default router;