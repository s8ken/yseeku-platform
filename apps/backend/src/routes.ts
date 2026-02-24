import { Router } from 'express';
import type { Server as HTTPServer } from 'http';
import type { Server as SocketIOServer } from 'socket.io';
import { analyzeInteraction } from './controllers/resonanceController';
import receiptsRoutes from './routes/receipts.routes';
import didResolverRoutes from './routes/did-resolver.routes';
import policiesRoutes from './routes/policies.routes';
import policyApiRoutes from './routes/policy-api';
import policyAlertRoutes from './routes/policy-alerts-routes';
import policyOverrideRoutes from './routes/policy-overrides-routes';
import policyAuditRoutes from './routes/policy-audit-routes';
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

  // Phase 2A: Policy Engine routes
  router.use('/policies', policiesRoutes);
  router.use('/policy', policyApiRoutes);
  router.use('/policy-alerts', policyAlertRoutes);
  router.use('/policy-overrides', policyOverrideRoutes);
  router.use('/policy-audit', policyAuditRoutes);

  // The new "Third Mind" Endpoint (no auth required)
  router.post('/trust/analyze', analyzeInteraction);

  return router;
}

// Default export for backward compatibility
router = initializeRoutes();

export default router;