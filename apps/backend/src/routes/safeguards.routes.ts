/**
 * Relational Safeguards Routes
 *
 * Evaluates AI-human interaction health against SONATE's Right to Disconnect
 * and Consent Architecture principles. Results are advisory only.
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { relationalSafeguardsService } from '../services/relational-safeguards.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/safeguards
 * List available safeguard endpoints and their descriptions.
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Relational Safeguards API',
    endpoints: [
      {
        method: 'POST',
        path: '/api/safeguards/evaluate',
        description: 'Evaluate relational safeguards for a conversation',
        body: { conversationId: 'string' },
      },
    ],
  });
});

/**
 * POST /api/safeguards/evaluate
 * Evaluate relational safeguards for a specific conversation.
 * Analyses AI message content for attachment risk and boundary health.
 */
router.post('/evaluate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.body;
    const tenantId = (req as any).tenant || 'default';

    if (!conversationId) {
      res.status(400).json({
        success: false,
        error: 'conversationId is required',
      });
      return;
    }

    const result = await relationalSafeguardsService.evaluate(conversationId as string, tenantId as string);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Safeguards evaluation endpoint error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Safeguards evaluation failed',
    });
  }
});

/**
 * GET /api/safeguards/evaluate/:conversationId
 * GET variant of evaluate for convenience (e.g., from dashboard widgets).
 */
router.get('/evaluate/:conversationId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const tenantId = (req as any).tenant || 'default';

    const result = await relationalSafeguardsService.evaluate(conversationId as string, tenantId as string);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Safeguards GET evaluation error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Safeguards evaluation failed',
    });
  }
});

export default router;
