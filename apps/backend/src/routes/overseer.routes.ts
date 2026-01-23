
import { Router, Request, Response } from 'express';
import { protect, requireTenant } from '../middleware/auth.middleware';
import { requireScopes } from '../middleware/rbac.middleware';
import { systemBrain } from '../services/system-brain.service';
import logger from '../utils/logger';
import { BrainCycle } from '../models/brain-cycle.model';
import { BrainAction } from '../models/brain-action.model';
import { Agent } from '../models/agent.model';
import { settingsService } from '../services/settings.service';
import { logAudit } from '../utils/audit-logger';
import { sonateOverridesTotal } from '../observability/metrics';
import { bindTenantContext } from '../middleware/tenant-context.middleware';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * POST /api/overseer/init
 * Initialize the Overseer agent if it doesn't exist
 */
router.post('/init', protect, requireTenant, requireScopes(['overseer:plan']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const userId = req.userId;
    const agent = await systemBrain.initialize(userTenant, userId);
    
    res.json({
      success: true,
      message: 'Overseer initialized',
      data: agent
    });
  } catch (error: unknown) {
    logger.error('Overseer init error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to initialize Overseer' });
  }
});

/**
 * POST /api/overseer/think
 * Trigger a thinking cycle manually
 */
router.post('/think', protect, requireTenant, requireScopes(['overseer:plan']), async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const mode = (req.query.mode as any) || (req.body?.mode as any) || 'advisory';
    
    // Fire and forget - don't hold the request
    systemBrain.think(userTenant, mode).catch(err => {
      logger.error('Background thinking error', { error: getErrorMessage(err) });
    });

    res.json({
      success: true,
      message: 'Overseer thinking cycle started',
      mode
    });
  } catch (error: unknown) {
    logger.error('Overseer think error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to initialize Overseer' });
  }
});

router.get('/cycles', protect, requireTenant, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = req.userTenant || 'default';
    const cycles = await BrainCycle.find({ tenantId: tenant }).sort({ startedAt: -1 }).limit(50);
    res.json({ success: true, data: cycles });
  } catch (error: unknown) {
    logger.error('Overseer list cycles error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to list cycles' });
  }
});

router.get('/cycles/:id', protect, requireTenant, requireScopes(['overseer:read']), async (req: Request, res: Response): Promise<void> => {
  try {
    const cycle = await BrainCycle.findById(req.params.id);
    if (!cycle) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const actions = await BrainAction.find({ cycleId: cycle._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { cycle, actions } });
  } catch (error: unknown) {
    logger.error('Overseer get cycle error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to get cycle' });
  }
});

router.post('/actions/:id/approve', protect, requireTenant, requireScopes(['overseer:act']), async (req: Request, res: Response): Promise<void> => {
  try {
    const action = await BrainAction.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: (req as any).userEmail || 'system' }, { new: true });
    if (!action) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: action });
  } catch (error: unknown) {
    logger.error('Overseer approve action error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to approve action' });
  }
});

/**
 * POST /api/overseer/actions/:id/override
 * Human override: revert or cancel effects of an executed action
 */
router.post('/actions/:id/override', protect, bindTenantContext, requireTenant, requireScopes(['overseer:act']), async (req: Request, res: Response): Promise<void> => {
  try {
    const action = await BrainAction.findById(req.params.id);
    if (!action) { res.status(404).json({ success: false, message: 'Not found' }); return; }

    const tenantId = req.userTenant || 'default';
    const by = (req as any).userEmail || 'admin';
    const rawReason = String((req.body as any)?.reason || '');
    const reason = rawReason.trim().slice(0, 1000);
    const requireJustification = ['ban_agent','restrict_agent','quarantine_agent'].includes(action.type);
    if (requireJustification && reason.length < 3) { res.status(400).json({ success: false, message: 'Justification required' }); return; }

    let reverted = false;
    let details: Record<string, any> = {};

    switch (action.type) {
      case 'adjust_threshold': {
        const prev = (action.result as any)?.previousValue;
        if (prev !== undefined) {
          await settingsService.setTrustThreshold(tenantId, prev);
          reverted = true;
          details = { previousValue: prev };
        }
        break;
      }
      case 'ban_agent':
      case 'restrict_agent':
      case 'quarantine_agent': {
        const agent = await Agent.findById(action.target);
        if (!agent) { throw new Error('Agent not found for override'); }
        await agent.unban();
        reverted = true;
        details = { agentId: agent._id.toString(), restored: true };
        break;
      }
      case 'alert': {
        reverted = true; // informational only
        details = { alert: 'informational' };
        break;
      }
      default:
        break;
    }

    action.status = 'executed';
    action.result = { ...(action.result || {}), overridden: true, overriddenBy: by, details, justification: reason };
    await action.save();

    await logAudit({
      action: 'config_update',
      resourceType: 'system',
      resourceId: action._id.toString(),
      userId: by,
      userEmail: by,
      tenantId,
      severity: reverted ? 'warning' : 'info',
      outcome: reverted ? 'success' : 'partial',
      details: { overrideOf: action.type, target: action.target, reverted },
    });

    sonateOverridesTotal.inc({ status: reverted ? 'approved' : 'partial', tenant_id: tenantId })

    res.json({ success: true, data: { overridden: true, reverted, details } });
  } catch (error: unknown) {
    logger.error('Overseer override action error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to override action' });
  }
});

/**
 * GET /api/overseer/status
 * Get the latest status from the Overseer including last brain cycle
 */
router.get('/status', protect, requireTenant, async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: unknown) {
    logger.error('Overseer status error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

export default router;
