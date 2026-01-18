import { BrainAction, IBrainAction } from '../models/brain-action.model';
import { OverrideDecision, IOverrideDecision } from '../models/override-decision.model';
import { Agent } from '../models/agent.model';
import { settingsService } from './settings.service';
import { logAudit } from '../utils/audit-logger';
import { Types } from 'mongoose';

export interface OverrideQueueItem {
  id: string;
  type: string;
  target: string;
  reason?: string;
  status: string;
  createdAt: Date;
  requestedBy?: string;
  severity?: string;
  canOverride: boolean;
}

export interface OverrideDecisionData {
  actionId: string;
  decision: 'approve' | 'reject';
  reason: string;
  emergency?: boolean;
  userId: string;
  tenantId: string;
}

export interface OverrideResult {
  success: boolean;
  reverted: boolean;
  details: Record<string, any>;
  message?: string;
}

export const overrideService = {
  async getOverrideQueue(tenantId: string, filters?: {
    status?: string[];
    type?: string[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const match: any = { tenantId };
    
    if (filters?.status?.length) {
      match.status = { $in: filters.status };
    }
    if (filters?.type?.length) {
      match.type = { $in: filters.type };
    }
    if (filters?.startDate || filters?.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }
    if (filters?.search) {
      match.$or = [
        { type: { $regex: filters.search, $options: 'i' } },
        { target: { $regex: filters.search, $options: 'i' } },
        { reason: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const [actions, total] = await Promise.all([
      BrainAction.find(match)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      BrainAction.countDocuments(match)
    ]);

    const queueItems: OverrideQueueItem[] = actions.map(action => ({
      id: action._id.toString(),
      type: action.type,
      target: action.target,
      reason: action.reason,
      status: action.status,
      createdAt: action.createdAt,
      requestedBy: action.approvedBy,
      severity: (action.result as any)?.severity,
      canOverride: ['planned', 'approved', 'executed'].includes(action.status)
    }));

    return { items: queueItems, total, limit, offset };
  },

  async getOverrideHistory(tenantId: string, filters?: {
    decision?: ('approve' | 'reject')[];
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    emergency?: boolean;
  }, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const match: any = { tenantId };
    
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
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
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
      OverrideDecision.aggregate(pipeline as any[]),
      OverrideDecision.countDocuments(match)
    ]);

    return { items: history, total, limit, offset };
  },

  async processOverride(data: OverrideDecisionData): Promise<OverrideResult> {
    const { actionId, decision, reason, emergency = false, userId, tenantId } = data;

    const action = await BrainAction.findById(actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    if (action.tenantId !== tenantId) {
      throw new Error('Tenant mismatch');
    }

    // Check if override already exists
    const existingOverride = await OverrideDecision.findOne({ actionId: action._id });
    if (existingOverride) {
      throw new Error('Override already processed for this action');
    }

    let reverted = false;
    let details: Record<string, any> = {};

    try {
      switch (action.type) {
        case 'adjust_threshold': {
          const prevValue = (action.result as any)?.previousValue;
          if (decision === 'approve' && prevValue !== undefined) {
            await settingsService.setTrustThreshold(tenantId, prevValue);
            reverted = true;
            details = { previousValue: prevValue };
          }
          break;
        }
        case 'ban_agent':
        case 'restrict_agent':
        case 'quarantine_agent': {
          const agent = await Agent.findById(action.target);
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
      const overrideDecision = await OverrideDecision.create({
        actionId: action._id,
        userId,
        decision,
        reason,
        emergency,
        impact: details,
        tenantId
      });

      // Log audit event
      await logAudit({
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

    } catch (error: any) {
      // Log failure
      await logAudit({
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
          error: error.message 
        }
      });

      throw error;
    }
  },

  async getOverrideStats(tenantId: string) {
    const [pending, approved, rejected, total] = await Promise.all([
      BrainAction.countDocuments({ tenantId, status: 'pending' }),
      OverrideDecision.countDocuments({ tenantId, decision: 'approve' }),
      OverrideDecision.countDocuments({ tenantId, decision: 'reject' }),
      OverrideDecision.countDocuments({ tenantId })
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