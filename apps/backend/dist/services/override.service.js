"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideService = void 0;
const brain_action_model_1 = require("../models/brain-action.model");
const override_decision_model_1 = require("../models/override-decision.model");
const agent_model_1 = require("../models/agent.model");
const settings_service_1 = require("./settings.service");
const audit_logger_1 = require("../utils/audit-logger");
const error_utils_1 = require("../utils/error-utils");
exports.overrideService = {
    async getOverrideQueue(tenantId, filters, options) {
        const limit = options?.limit || 50;
        const offset = options?.offset || 0;
        const match = { tenantId };
        if (filters?.status?.length) {
            match.status = { $in: filters.status };
        }
        if (filters?.type?.length) {
            match.type = { $in: filters.type };
        }
        if (filters?.startDate || filters?.endDate) {
            match.createdAt = {};
            if (filters.startDate)
                match.createdAt.$gte = filters.startDate;
            if (filters.endDate)
                match.createdAt.$lte = filters.endDate;
        }
        if (filters?.search) {
            match.$or = [
                { type: { $regex: filters.search, $options: 'i' } },
                { target: { $regex: filters.search, $options: 'i' } },
                { reason: { $regex: filters.search, $options: 'i' } }
            ];
        }
        const [actions, total] = await Promise.all([
            brain_action_model_1.BrainAction.find(match)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            brain_action_model_1.BrainAction.countDocuments(match)
        ]);
        const queueItems = actions.map(action => ({
            id: action._id.toString(),
            type: action.type,
            target: action.target,
            reason: action.reason,
            status: action.status,
            createdAt: action.createdAt,
            requestedBy: action.approvedBy,
            severity: action.result?.severity,
            canOverride: ['planned', 'approved', 'executed'].includes(action.status)
        }));
        return { items: queueItems, total, limit, offset };
    },
    async getOverrideHistory(tenantId, filters, options) {
        const limit = options?.limit || 50;
        const offset = options?.offset || 0;
        const match = { tenantId };
        if (filters?.decision?.length) {
            match.decision = { $in: filters.decision };
        }
        if (filters?.userId) {
            match.userId = filters.userId;
        }
        if (filters?.emergency !== undefined) {
            match.emergency = filters.emergency;
        }
        if (filters?.startDate || filters?.endDate) {
            match.createdAt = {};
            if (filters.startDate)
                match.createdAt.$gte = filters.startDate;
            if (filters.endDate)
                match.createdAt.$lte = filters.endDate;
        }
        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: 'brain_actions',
                    localField: 'actionId',
                    foreignField: '_id',
                    as: 'action'
                }
            },
            { $unwind: '$action' },
            {
                $project: {
                    id: '$_id',
                    actionId: 1,
                    decision: 1,
                    reason: 1,
                    emergency: 1,
                    impact: 1,
                    createdAt: 1,
                    userId: 1,
                    actionType: '$action.type',
                    actionTarget: '$action.target',
                    actionStatus: '$action.status'
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: offset },
            { $limit: limit }
        ];
        const [history, total] = await Promise.all([
            override_decision_model_1.OverrideDecision.aggregate(pipeline),
            override_decision_model_1.OverrideDecision.countDocuments(match)
        ]);
        return { items: history, total, limit, offset };
    },
    async processOverride(data) {
        const { actionId, decision, reason, emergency = false, userId, tenantId } = data;
        const action = await brain_action_model_1.BrainAction.findById(actionId);
        if (!action) {
            throw new Error('Action not found');
        }
        if (action.tenantId !== tenantId) {
            throw new Error('Tenant mismatch');
        }
        // Check if override already exists
        const existingOverride = await override_decision_model_1.OverrideDecision.findOne({ actionId: action._id });
        if (existingOverride) {
            throw new Error('Override already processed for this action');
        }
        let reverted = false;
        let details = {};
        try {
            switch (action.type) {
                case 'adjust_threshold': {
                    const prevValue = action.result?.previousValue;
                    if (decision === 'approve' && prevValue !== undefined) {
                        await settings_service_1.settingsService.setTrustThreshold(tenantId, prevValue);
                        reverted = true;
                        details = { previousValue: prevValue };
                    }
                    break;
                }
                case 'ban_agent':
                case 'restrict_agent':
                case 'quarantine_agent': {
                    const agent = await agent_model_1.Agent.findById(action.target);
                    if (agent) {
                        if (decision === 'approve') {
                            await agent.unban();
                            reverted = true;
                            details = { agentId: agent._id.toString(), restored: true };
                        }
                    }
                    break;
                }
                case 'alert': {
                    // Informational actions can always be overridden
                    reverted = decision === 'approve';
                    details = { alert: 'informational' };
                    break;
                }
                default:
                    details = { message: 'Unknown action type' };
            }
            // Update action status
            action.status = decision === 'approve' ? 'overridden' : 'failed';
            action.result = {
                ...(action.result || {}),
                overridden: true,
                overriddenBy: userId,
                overrideDecision: decision,
                overrideReason: reason
            };
            await action.save();
            // Create override decision record
            const overrideDecision = await override_decision_model_1.OverrideDecision.create({
                actionId: action._id,
                userId,
                decision,
                reason,
                emergency,
                impact: details,
                tenantId
            });
            // Log audit event
            await (0, audit_logger_1.logAudit)({
                action: 'config_update',
                resourceType: 'system',
                resourceId: action._id.toString(),
                userId,
                tenantId,
                severity: reverted ? 'warning' : 'info',
                outcome: reverted ? 'success' : 'partial',
                details: {
                    overrideOf: action.type,
                    target: action.target,
                    reverted,
                    decision,
                    emergency
                }
            });
            return { success: true, reverted, details };
        }
        catch (error) {
            // Log failure
            await (0, audit_logger_1.logAudit)({
                action: 'config_update',
                resourceType: 'system',
                resourceId: action._id.toString(),
                userId,
                tenantId,
                severity: 'error',
                outcome: 'failure',
                details: {
                    overrideOf: action.type,
                    target: action.target,
                    error: (0, error_utils_1.getErrorMessage)(error)
                }
            });
            throw error;
        }
    },
    async getOverrideStats(tenantId) {
        const [pending, approved, rejected, total] = await Promise.all([
            brain_action_model_1.BrainAction.countDocuments({ tenantId, status: 'pending' }),
            override_decision_model_1.OverrideDecision.countDocuments({ tenantId, decision: 'approve' }),
            override_decision_model_1.OverrideDecision.countDocuments({ tenantId, decision: 'reject' }),
            override_decision_model_1.OverrideDecision.countDocuments({ tenantId })
        ]);
        return {
            pending,
            approved,
            rejected,
            total,
            approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
        };
    }
};
