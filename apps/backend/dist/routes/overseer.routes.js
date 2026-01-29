"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const system_brain_service_1 = require("../services/system-brain.service");
const logger_1 = __importDefault(require("../utils/logger"));
const brain_cycle_model_1 = require("../models/brain-cycle.model");
const brain_action_model_1 = require("../models/brain-action.model");
const agent_model_1 = require("../models/agent.model");
const settings_service_1 = require("../services/settings.service");
const audit_logger_1 = require("../utils/audit-logger");
const metrics_1 = require("../observability/metrics");
const tenant_context_middleware_1 = require("../middleware/tenant-context.middleware");
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * POST /api/overseer/init
 * Initialize the Overseer agent if it doesn't exist
 */
router.post('/init', auth_middleware_1.protect, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:plan']), async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const userId = req.userId;
        const agent = await system_brain_service_1.systemBrain.initialize(userTenant, userId);
        res.json({
            success: true,
            message: 'Overseer initialized',
            data: agent
        });
    }
    catch (error) {
        logger_1.default.error('Overseer init error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to initialize Overseer' });
    }
});
/**
 * POST /api/overseer/think
 * Trigger a thinking cycle manually
 */
router.post('/think', auth_middleware_1.protect, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:plan']), async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const mode = req.query.mode || req.body?.mode || 'advisory';
        // Fire and forget - don't hold the request
        system_brain_service_1.systemBrain.think(userTenant, mode).catch(err => {
            logger_1.default.error('Background thinking error', { error: (0, error_utils_1.getErrorMessage)(err) });
        });
        res.json({
            success: true,
            message: 'Overseer thinking cycle started',
            mode
        });
    }
    catch (error) {
        logger_1.default.error('Overseer think error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to initialize Overseer' });
    }
});
router.get('/cycles', auth_middleware_1.protect, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:read']), async (req, res) => {
    try {
        const tenant = req.userTenant || 'default';
        const cycles = await brain_cycle_model_1.BrainCycle.find({ tenantId: tenant }).sort({ startedAt: -1 }).limit(50);
        res.json({ success: true, data: cycles });
    }
    catch (error) {
        logger_1.default.error('Overseer list cycles error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to list cycles' });
    }
});
router.get('/cycles/:id', auth_middleware_1.protect, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:read']), async (req, res) => {
    try {
        const cycle = await brain_cycle_model_1.BrainCycle.findById(req.params.id);
        if (!cycle) {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        const actions = await brain_action_model_1.BrainAction.find({ cycleId: cycle._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: { cycle, actions } });
    }
    catch (error) {
        logger_1.default.error('Overseer get cycle error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to get cycle' });
    }
});
router.post('/actions/:id/approve', auth_middleware_1.protect, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:act']), async (req, res) => {
    try {
        const action = await brain_action_model_1.BrainAction.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.userEmail || 'system' }, { new: true });
        if (!action) {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        res.json({ success: true, data: action });
    }
    catch (error) {
        logger_1.default.error('Overseer approve action error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to approve action' });
    }
});
/**
 * POST /api/overseer/actions/:id/override
 * Human override: revert or cancel effects of an executed action
 */
router.post('/actions/:id/override', auth_middleware_1.protect, tenant_context_middleware_1.bindTenantContext, auth_middleware_1.requireTenant, (0, rbac_middleware_1.requireScopes)(['overseer:act']), async (req, res) => {
    try {
        const action = await brain_action_model_1.BrainAction.findById(req.params.id);
        if (!action) {
            res.status(404).json({ success: false, message: 'Not found' });
            return;
        }
        const tenantId = req.userTenant || 'default';
        const by = req.userEmail || 'admin';
        const rawReason = String(req.body?.reason || '');
        const reason = rawReason.trim().slice(0, 1000);
        const requireJustification = ['ban_agent', 'restrict_agent', 'quarantine_agent'].includes(action.type);
        if (requireJustification && reason.length < 3) {
            res.status(400).json({ success: false, message: 'Justification required' });
            return;
        }
        let reverted = false;
        let details = {};
        switch (action.type) {
            case 'adjust_threshold': {
                const prev = action.result?.previousValue;
                if (prev !== undefined) {
                    await settings_service_1.settingsService.setTrustThreshold(tenantId, prev);
                    reverted = true;
                    details = { previousValue: prev };
                }
                break;
            }
            case 'ban_agent':
            case 'restrict_agent':
            case 'quarantine_agent': {
                const agent = await agent_model_1.Agent.findById(action.target);
                if (!agent) {
                    throw new Error('Agent not found for override');
                }
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
        await (0, audit_logger_1.logAudit)({
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
        metrics_1.sonateOverridesTotal.inc({ status: reverted ? 'approved' : 'partial', tenant_id: tenantId });
        res.json({ success: true, data: { overridden: true, reverted, details } });
    }
    catch (error) {
        logger_1.default.error('Overseer override action error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to override action' });
    }
});
/**
 * GET /api/overseer/status
 * Get the latest status from the Overseer including last brain cycle
 */
router.get('/status', auth_middleware_1.protect, auth_middleware_1.requireTenant, async (req, res) => {
    try {
        const tenant = req.userTenant || 'default';
        // Fetch the most recent brain cycle
        const lastCycle = await brain_cycle_model_1.BrainCycle.findOne({ tenantId: tenant })
            .sort({ completedAt: -1 })
            .lean();
        // Fetch recent actions count
        const recentActionsCount = await brain_action_model_1.BrainAction.countDocuments({
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
    }
    catch (error) {
        logger_1.default.error('Overseer status error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to get status' });
    }
});
exports.default = router;
