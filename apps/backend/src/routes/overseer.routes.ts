
import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { systemBrain } from '../services/system-brain.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/overseer/init
 * Initialize the Overseer agent if it doesn't exist
 */
router.post('/init', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const agent = await systemBrain.initialize(userTenant);
    
    res.json({
      success: true,
      message: 'Overseer initialized',
      data: agent
    });
  } catch (error: any) {
    logger.error('Overseer init error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to initialize Overseer' });
  }
});

/**
 * POST /api/overseer/think
 * Trigger a thinking cycle manually
 */
router.post('/think', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    
    // Fire and forget - don't hold the request
    systemBrain.think(userTenant).catch(err => {
      logger.error('Background thinking error', { error: err.message });
    });

    res.json({
      success: true,
      message: 'Overseer thinking cycle started'
    });
  } catch (error: any) {
    logger.error('Overseer think error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to trigger thinking' });
  }
});

/**
 * GET /api/overseer/status
 * Get the latest status from the Overseer
 * (For now, we just return the agent details, in future we'd store the "Thought" result in DB)
 */
router.get('/status', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, we would fetch the last "System Thought" log or state
    // For prototype, we'll return a mock status or the Agent metadata
    res.json({
      success: true,
      data: {
        status: 'active',
        lastThought: new Date(),
        health: 'nominal',
        message: 'Systems operating within normal parameters.'
      }
    });
  } catch (error: any) {
    logger.error('Overseer status error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

export default router;
