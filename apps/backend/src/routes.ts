import { Router } from 'express';
import { analyzeInteraction } from './controllers/resonanceController';

const router = Router();

// ... existing routes ...

// The new "Third Mind" Endpoint
router.post('/trust/analyze', analyzeInteraction);

export default router;