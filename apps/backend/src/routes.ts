import { Router } from 'express';
import { analyzeInteraction } from './controllers/resonanceController';
import receiptsRoutes from './routes/receipts.routes';
import didResolverRoutes from './routes/did-resolver.routes';
import policiesRoutes from './routes/policies.routes';
import { createPolicyAPIService } from './routes/policy-api';

const router = Router();

// Phase 1: Receipts & DIDs
router.use('/receipts', receiptsRoutes);
router.use('/dids', didResolverRoutes);

// Phase 2A: Policy Engine
router.use('/policies', policiesRoutes);

// Phase 2C: Policy Decision API (SYMBI-based evaluation)
const policyAPIService = createPolicyAPIService();
router.use('/api/v2/policy', policyAPIService.getRouter());

// ... existing routes ...

// The new "Third Mind" Endpoint
router.post('/trust/analyze', analyzeInteraction);

export default router;