
import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requireScopes } from '../middleware/rbac.middleware';
import { systemBrain } from '../services/system-brain.service';
import logger from '../utils/logger';
import { BrainCycle } from '../models/brain-cycle.model';
import { BrainAction } from '../models/brain-action.model';

const router = Router();

/**
 * POST /api/overseer/init
 * Initialize the Overseer agent if it doesn't exist
 */
router.post('/init', protect, requireScopes(['overseer:plan']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const userId = req.userId;
    const agent = await systemBrain.initialize(userTenant, userId);
    
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
router.post('/think', protect, requireScopes(['overseer:plan']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const mode = (req.query.mode as any) || (req.body?.mode as any) || 'advisory';
    
    // Fire and forget - don't hold the request
    systemBrain.think(userTenant, mode).catch(err => {
      logger.error('Background thinking error', { error: err.message });
    });

    res.json({
      success: true,
      message: 'Overseer thinking cycle started',
      mode
    });
  } catch (error: any) {
    logger.error('Overseer think error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to initialize Overseer' });
  }
});

router.get('/cycles', protect, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = req.userTenant || 'default';
    const cycles = await BrainCycle.find({ tenantId: tenant }).sort({ startedAt: -1 }).limit(50);
    res.json({ success: true, data: cycles });
  } catch (error: any) {
    logger.error('Overseer list cycles error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to list cycles' });
  }
});

router.get('/cycles/:id', protect, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const cycle = await BrainCycle.findById(req.params.id);
    if (!cycle) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const actions = await BrainAction.find({ cycleId: cycle._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { cycle, actions } });
  } catch (error: any) {
    logger.error('Overseer get cycle error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get cycle' });
  }
});

router.post('/actions/:id/approve', protect, requireScopes(['overseer:act']), async (req: Request, res: Response): Promise<void> => {
  try {
    const action = await BrainAction.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: (req as any).userEmail || 'system' }, { new: true });
    if (!action) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: action });
  } catch (error: any) {
    logger.error('Overseer approve action error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to approve action' });
  }
});

/**
 * GET /api/overseer/status
 * Get the latest status from the Overseer including last brain cycle
 */
router.get('/status', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = req.userTenant || 'default';

    // Fetch the most recent brain cycle
    const lastCycle = await BrainCycle.findOne({ tenantId: tenant })
      .sort({ completedAt: -1 })
      .lean();

    // Fetch recent actions count
    const recentActionsCount = await BrainAction.countDocuments({
      tenantId: tenant,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Calculate status based on last cycle
    const isActive = lastCycle &&
      lastCycle.completedAt &&
      (Date.now() - new Date(lastCycle.completedAt).getTime()) < 60 * 60 * 1000; // Active if cycle within last hour

    res.json({
      success: true,
      data: {
        status: isActive ? 'active' : 'idle',
        lastThought: lastCycle?.completedAt || new Date(),
        health: lastCycle?.status === 'completed' ? 'nominal' : 'monitoring',
        message: lastCycle?.thought || 'Systems operating within normal parameters. Awaiting next analysis cycle.',
        metrics: lastCycle?.metrics ? {
          agentCount: lastCycle.metrics.agentCount || 0,
          systemTrustScore: lastCycle.metrics.avgTrust || 8.0,
          alertsProcessed: lastCycle.metrics.alertsProcessed || 0,
          actionsPlanned: lastCycle.metrics.actionsPlanned || 0,
        } : {
          agentCount: 0,
          systemTrustScore: 8.0,
          alertsProcessed: 0,
          actionsPlanned: 0,
        },
        mode: lastCycle?.mode || 'advisory',
        recentActionsCount,
        lastCycleId: lastCycle?._id?.toString(),
      }
    });
  } catch (error: any) {
    logger.error('Overseer status error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

export default router;
