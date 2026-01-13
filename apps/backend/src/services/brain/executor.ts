import { BrainAction } from '../../models/brain-action.model';
import { brainActionsTotal } from '../../observability/metrics';
import { alertsService } from '../alerts.service';
import { settingsService } from '../settings.service';
import { Agent, BanSeverity } from '../../models/agent.model';
import { Conversation } from '../../models/conversation.model';
import { logAudit, AuditAction } from '../../utils/audit-logger';
import { sonateRefusalsTotal, sonateRefusalLatencySeconds } from '../../observability/metrics';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { remember } from './memory';
import { checkKernelConstraints } from './constraints';

export interface PlannedAction {
  type: string;
  target: string;
  reason?: string;
  severity?: BanSeverity;
  restrictions?: string[];
  expiresAt?: Date;
}

export interface ExecutionResult {
  id: string;
  status: 'planned' | 'executed' | 'failed';
  result?: Record<string, any>;
}

export async function executeActions(
  tenantId: string,
  cycleId: string,
  actions: PlannedAction[],
  mode: 'advisory' | 'enforced' = 'advisory'
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (const a of actions) {
    const status = mode === 'enforced' ? 'executed' : 'planned';
    const doc = await BrainAction.create({
      cycleId,
      tenantId,
      type: a.type,
      target: a.target,
      reason: a.reason,
      status,
      executedAt: new Date()
    });
    brainActionsTotal.inc({ type: a.type, status });
    results.push({ id: doc._id.toString(), status });

    // Execute actions only in enforced mode
    if (mode === 'enforced') {
      // Kernel constraints & refusal logic
      const startMs = Date.now()
      const check = checkKernelConstraints(tenantId, mode, a)
      if (!check.ok) {
        doc.status = 'failed'
        doc.result = { refused: true, rule: check.rule, reason: check.reason, details: check.details }
        await doc.save()
        await remember(tenantId, 'refusal:kernel', {
          actionId: doc._id.toString(),
          type: a.type,
          target: a.target,
          rule: check.rule,
          reason: check.reason,
          cycleId,
          timestamp: new Date(),
        }, ['refusal','kernel',a.type])
        sonateRefusalsTotal.inc({ reason: String(check.rule || 'unknown'), tenant_id: tenantId })
        sonateRefusalLatencySeconds.observe({ reason: String(check.rule || 'unknown'), tenant_id: tenantId }, (Date.now() - startMs) / 1000)
        const correlationId = uuidv4()
        sonateRefusalsTotal.inc({ reason: String(check.rule || 'unknown'), tenant_id: tenantId })
        await logAudit({
          action: 'alert_suppress',
          resourceType: 'system',
          resourceId: cycleId,
          userId: 'system-brain',
          tenantId,
          severity: 'warning',
          outcome: 'failure',
          details: { refusedAction: a.type, target: a.target, rule: check.rule, reason: check.reason, correlationId }
        })
        // Emit informational alert
        await alertsService.create({
          type: 'system',
          title: 'Overseer Refusal',
          description: `Refused ${a.type}: ${check.reason}`,
          severity: 'warning',
          details: { tenantId, target: a.target, rule: check.rule }
        }, tenantId)
        // Update results array
        const idx = results.findIndex(r => r.id === doc._id.toString())
        if (idx >= 0) {
          results[idx].status = 'failed'
          results[idx].result = { refused: true, rule: check.rule, reason: check.reason }
        }
        continue
      }
      try {
        switch (a.type) {
          case 'alert':
            await executeAlert(tenantId, a, doc);
            break;

          case 'adjust_threshold':
            await executeAdjustThreshold(tenantId, a, doc);
            break;

          case 'ban_agent':
            await executeBanAgent(tenantId, cycleId, a, doc);
            break;

          case 'restrict_agent':
            await executeRestrictAgent(tenantId, cycleId, a, doc);
            break;

          case 'quarantine_agent':
            await executeQuarantineAgent(tenantId, cycleId, a, doc);
            break;

          case 'unban_agent':
            await executeUnbanAgent(tenantId, cycleId, a, doc);
            break;

          default:
            logger.warn('Unknown action type', { type: a.type, target: a.target });
            doc.result = { error: `Unknown action type: ${a.type}` };
            doc.status = 'failed';
            await doc.save();
        }
      } catch (error: any) {
        doc.status = 'failed';
        doc.result = { error: error.message };
        await doc.save();
        logger.error('Action execution failed', {
          type: a.type,
          target: a.target,
          error: error.message,
        });
        // Update the result in our array
        const idx = results.findIndex(r => r.id === doc._id.toString());
        if (idx >= 0) {
          results[idx].status = 'failed';
          results[idx].result = { error: error.message };
        }
      }
    }
  }

  return results;
}

/**
 * Execute alert action
 */
async function executeAlert(
  tenantId: string,
  action: PlannedAction,
  doc: any
): Promise<void> {
  await alertsService.create({
    type: 'system',
    title: action.reason || 'System Alert',
    description: `Overseer: ${action.reason || ''}`,
    severity: 'warning',
    details: { target: action.target, tenantId }
  }, tenantId);
  doc.result = { routed: true, channel: 'system' };
  await doc.save();
}

/**
 * Execute adjust threshold action
 */
async function executeAdjustThreshold(
  tenantId: string,
  action: PlannedAction,
  doc: any
): Promise<void> {
  const current = await settingsService.getTrustThreshold(tenantId);
  const next = (current ?? 75) - 5;
  await settingsService.setTrustThreshold(tenantId, next);
  doc.result = { adjusted: true, target: action.target, previousValue: current, value: next };
  await doc.save();
}

/**
 * Execute ban agent action
 */
async function executeBanAgent(
  tenantId: string,
  cycleId: string,
  action: PlannedAction,
  doc: any
): Promise<void> {
  // 1. Find the agent
  const agent = await Agent.findById(action.target);
  if (!agent) {
    throw new Error(`Agent not found: ${action.target}`);
  }

  // 2. Update agent ban status using the model method
  await agent.ban(
    'system-brain',
    action.reason || 'System Brain automated ban',
    action.severity || 'medium',
    action.expiresAt
  );

  // 3. Clear agent sessions by archiving active conversations
  const archiveResult = await Conversation.updateMany(
    { agents: action.target, isArchived: false },
    { $set: { isArchived: true } }
  );
  const sessionsCleared = archiveResult.modifiedCount || 0;

  // 4. Create audit trail
  await logAudit({
    action: 'agent_update' as AuditAction,
    resourceType: 'agent',
    resourceId: action.target,
    userId: 'system-brain',
    tenantId,
    severity: 'critical',
    outcome: 'success',
    details: {
      operation: 'ban',
      reason: action.reason,
      severity: action.severity || 'medium',
      expiresAt: action.expiresAt,
      cycleId,
      sessionsCleared,
    },
  });

  // 5. Store in brain memory for feedback loop
  await remember(tenantId, 'action:ban_agent', {
    agentId: action.target,
    agentName: agent.name,
    reason: action.reason,
    severity: action.severity || 'medium',
    timestamp: new Date(),
    cycleId,
    sessionsCleared,
  }, ['ban', 'agent', 'action', 'enforcement']);

  // 6. Emit alert
  await alertsService.create({
    type: 'security',
    title: `Agent Banned: ${agent.name}`,
    description: `Agent ${agent.name} has been banned by System Brain. Reason: ${action.reason}`,
    severity: action.severity === 'critical' ? 'critical' : action.severity === 'high' ? 'error' : 'warning',
    details: {
      agentId: action.target,
      agentName: agent.name,
      reason: action.reason,
      severity: action.severity,
      tenantId,
      cycleId,
    },
    agentId: action.target,
  }, tenantId);

  // 7. Update action result
  doc.result = {
    banned: true,
    agentId: action.target,
    agentName: agent.name,
    sessionsCleared,
    alertCreated: true,
  };
  await doc.save();

  logger.info('Agent banned by System Brain', {
    agentId: action.target,
    agentName: agent.name,
    reason: action.reason,
    severity: action.severity,
    sessionsCleared,
  });
}

/**
 * Execute restrict agent action
 */
async function executeRestrictAgent(
  tenantId: string,
  cycleId: string,
  action: PlannedAction,
  doc: any
): Promise<void> {
  const agent = await Agent.findById(action.target);
  if (!agent) {
    throw new Error(`Agent not found: ${action.target}`);
  }

  const restrictions = action.restrictions || ['api_access', 'new_conversations'];

  // Update agent with restrictions
  await agent.restrict(restrictions, action.reason || 'System Brain automated restriction');

  // Create audit trail
  await logAudit({
    action: 'agent_update' as AuditAction,
    resourceType: 'agent',
    resourceId: action.target,
    userId: 'system-brain',
    tenantId,
    severity: 'warning',
    outcome: 'success',
    details: {
      operation: 'restrict',
      reason: action.reason,
      restrictions,
      cycleId,
    },
  });

  // Store in memory
  await remember(tenantId, 'action:restrict_agent', {
    agentId: action.target,
    agentName: agent.name,
    reason: action.reason,
    restrictions,
    timestamp: new Date(),
    cycleId,
  }, ['restrict', 'agent', 'action', 'enforcement']);

  // Emit alert
  await alertsService.create({
    type: 'security',
    title: `Agent Restricted: ${agent.name}`,
    description: `Agent ${agent.name} has been restricted. Features disabled: ${restrictions.join(', ')}`,
    severity: 'warning',
    details: {
      agentId: action.target,
      agentName: agent.name,
      restrictions,
      reason: action.reason,
      tenantId,
    },
    agentId: action.target,
  }, tenantId);

  doc.result = {
    restricted: true,
    agentId: action.target,
    agentName: agent.name,
    restrictions,
  };
  await doc.save();

  logger.info('Agent restricted by System Brain', {
    agentId: action.target,
    agentName: agent.name,
    restrictions,
  });
}

/**
 * Execute quarantine agent action
 */
async function executeQuarantineAgent(
  tenantId: string,
  cycleId: string,
  action: PlannedAction,
  doc: any
): Promise<void> {
  const agent = await Agent.findById(action.target);
  if (!agent) {
    throw new Error(`Agent not found: ${action.target}`);
  }

  // Quarantine the agent
  await agent.quarantine(action.reason || 'System Brain automated quarantine for investigation');

  // Archive active conversations
  const archiveResult = await Conversation.updateMany(
    { agents: action.target, isArchived: false },
    { $set: { isArchived: true } }
  );

  // Create audit trail
  await logAudit({
    action: 'agent_update' as AuditAction,
    resourceType: 'agent',
    resourceId: action.target,
    userId: 'system-brain',
    tenantId,
    severity: 'warning',
    outcome: 'success',
    details: {
      operation: 'quarantine',
      reason: action.reason,
      cycleId,
      conversationsArchived: archiveResult.modifiedCount,
    },
  });

  // Store in memory
  await remember(tenantId, 'action:quarantine_agent', {
    agentId: action.target,
    agentName: agent.name,
    reason: action.reason,
    timestamp: new Date(),
    cycleId,
  }, ['quarantine', 'agent', 'action', 'enforcement']);

  // Emit alert
  await alertsService.create({
    type: 'security',
    title: `Agent Quarantined: ${agent.name}`,
    description: `Agent ${agent.name} has been quarantined for investigation. Reason: ${action.reason}`,
    severity: 'warning',
    details: {
      agentId: action.target,
      agentName: agent.name,
      reason: action.reason,
      tenantId,
    },
    agentId: action.target,
  }, tenantId);

  doc.result = {
    quarantined: true,
    agentId: action.target,
    agentName: agent.name,
    conversationsArchived: archiveResult.modifiedCount,
  };
  await doc.save();

  logger.info('Agent quarantined by System Brain', {
    agentId: action.target,
    agentName: agent.name,
    reason: action.reason,
  });
}

/**
 * Execute unban agent action
 */
async function executeUnbanAgent(
  tenantId: string,
  cycleId: string,
  action: PlannedAction,
  doc: any
): Promise<void> {
  const agent = await Agent.findById(action.target);
  if (!agent) {
    throw new Error(`Agent not found: ${action.target}`);
  }

  const previousStatus = agent.banStatus;

  // Unban the agent
  await agent.unban();

  // Create audit trail
  await logAudit({
    action: 'agent_update' as AuditAction,
    resourceType: 'agent',
    resourceId: action.target,
    userId: 'system-brain',
    tenantId,
    severity: 'info',
    outcome: 'success',
    details: {
      operation: 'unban',
      previousStatus,
      reason: action.reason,
      cycleId,
    },
  });

  // Store in memory
  await remember(tenantId, 'action:unban_agent', {
    agentId: action.target,
    agentName: agent.name,
    previousStatus,
    reason: action.reason,
    timestamp: new Date(),
    cycleId,
  }, ['unban', 'agent', 'action', 'enforcement']);

  // Emit info alert
  await alertsService.create({
    type: 'system',
    title: `Agent Restored: ${agent.name}`,
    description: `Agent ${agent.name} has been restored to active status.`,
    severity: 'info',
    details: {
      agentId: action.target,
      agentName: agent.name,
      previousStatus,
      tenantId,
    },
    agentId: action.target,
  }, tenantId);

  doc.result = {
    unbanned: true,
    agentId: action.target,
    agentName: agent.name,
    previousStatus,
  };
  await doc.save();

  logger.info('Agent unbanned by System Brain', {
    agentId: action.target,
    agentName: agent.name,
    previousStatus,
  });
}
