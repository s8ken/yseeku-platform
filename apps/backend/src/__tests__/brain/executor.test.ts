// Mock all dependencies first - must be before imports
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../observability/metrics', () => ({
  brainActionsTotal: { inc: jest.fn() },
}));

jest.mock('../../models/brain-action.model', () => ({
  BrainAction: {
    create: jest.fn(),
  },
}));

jest.mock('../../models/agent.model', () => ({
  Agent: {
    findById: jest.fn(),
  },
  BanSeverity: {},
}));

jest.mock('../../models/conversation.model', () => ({
  Conversation: {
    updateMany: jest.fn(),
  },
}));

jest.mock('../../services/alerts.service', () => ({
  alertsService: {
    create: jest.fn(),
  },
}));

jest.mock('../../services/settings.service', () => ({
  settingsService: {
    getTrustThreshold: jest.fn(),
    setTrustThreshold: jest.fn(),
  },
}));

jest.mock('../../utils/audit-logger', () => ({
  logAudit: jest.fn(),
}));

jest.mock('../../services/brain/memory', () => ({
  remember: jest.fn(),
}));

import { executeActions, PlannedAction } from '../../services/brain/executor';
import { BrainAction } from '../../models/brain-action.model';
import { Agent } from '../../models/agent.model';
import { Conversation } from '../../models/conversation.model';
import { alertsService } from '../../services/alerts.service';
import { settingsService } from '../../services/settings.service';
import * as auditLogger from '../../utils/audit-logger';
import * as memory from '../../services/brain/memory';

describe('Brain Executor Service', () => {
  const mockTenantId = 'tenant-123';
  const mockCycleId = 'cycle-456';

  let actionCounter = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    actionCounter = 0;

    // Setup default BrainAction mock with stable IDs
    (BrainAction.create as jest.Mock).mockImplementation((data) => {
      const actionId = `action-${++actionCounter}`;
      return {
        _id: { toString: () => actionId },
        ...data,
        save: jest.fn().mockResolvedValue(true),
      };
    });
  });

  describe('executeActions - advisory mode', () => {
    it('should create actions with planned status in advisory mode', async () => {
      const actions: PlannedAction[] = [
        { type: 'alert', target: 'system', reason: 'Test alert' },
        { type: 'ban_agent', target: 'agent-123', reason: 'Test ban' },
      ];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'advisory');

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('planned');
      expect(results[1].status).toBe('planned');
      expect(Agent.findById).not.toHaveBeenCalled(); // Should not execute
    });
  });

  describe('executeActions - alert', () => {
    it('should create alert via alertsService in enforced mode', async () => {
      const actions: PlannedAction[] = [
        { type: 'alert', target: 'system', reason: 'High emergence detected' },
      ];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('executed');
      expect(alertsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          title: 'High emergence detected',
          severity: 'warning',
        }),
        mockTenantId
      );
    });
  });

  describe('executeActions - adjust_threshold', () => {
    it('should adjust threshold in enforced mode', async () => {
      (settingsService.getTrustThreshold as jest.Mock).mockResolvedValue(80);
      (settingsService.setTrustThreshold as jest.Mock).mockResolvedValue(75);

      const actions: PlannedAction[] = [
        { type: 'adjust_threshold', target: 'trust', reason: 'Low trust detected' },
      ];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('executed');
      expect(settingsService.getTrustThreshold).toHaveBeenCalledWith(mockTenantId);
      expect(settingsService.setTrustThreshold).toHaveBeenCalledWith(mockTenantId, 75);
    });
  });

  describe('executeActions - ban_agent', () => {
    it('should ban agent and clear sessions in enforced mode', async () => {
      const mockAgent = {
        _id: 'agent-123',
        name: 'Test Agent',
        banStatus: 'active',
        ban: jest.fn().mockResolvedValue(true),
      };

      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (Conversation.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });
      (alertsService.create as jest.Mock).mockReturnValue({ id: 'alert-1' });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const actions: PlannedAction[] = [{
        type: 'ban_agent',
        target: 'agent-123',
        reason: 'Malicious behavior detected',
        severity: 'high',
      }];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('executed');

      // Verify agent was banned
      expect(mockAgent.ban).toHaveBeenCalledWith(
        'system-brain',
        'Malicious behavior detected',
        'high',
        undefined
      );

      // Verify conversations were archived
      expect(Conversation.updateMany).toHaveBeenCalledWith(
        { agents: 'agent-123', isArchived: false },
        { $set: { isArchived: true } }
      );

      // Verify audit log was created
      expect(auditLogger.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'agent_update',
          resourceType: 'agent',
          resourceId: 'agent-123',
          severity: 'critical',
          details: expect.objectContaining({
            operation: 'ban',
            reason: 'Malicious behavior detected',
          }),
        })
      );

      // Verify alert was created
      expect(alertsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security',
          title: expect.stringContaining('Agent Banned'),
          severity: 'error', // high severity maps to error
        }),
        mockTenantId
      );

      // Verify memory was stored
      expect(memory.remember).toHaveBeenCalledWith(
        mockTenantId,
        'action:ban_agent',
        expect.objectContaining({
          agentId: 'agent-123',
          reason: 'Malicious behavior detected',
        }),
        expect.arrayContaining(['ban', 'agent', 'action'])
      );
    });

    it('should handle agent not found error', async () => {
      (Agent.findById as jest.Mock).mockResolvedValue(null);

      const actions: PlannedAction[] = [{
        type: 'ban_agent',
        target: 'nonexistent-agent',
        reason: 'Test',
      }];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('failed');
      expect(results[0].result?.error).toContain('Agent not found');
    });

    it('should use default severity when not specified', async () => {
      const mockAgent = {
        _id: 'agent-123',
        name: 'Test Agent',
        ban: jest.fn().mockResolvedValue(true),
      };

      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (Conversation.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const actions: PlannedAction[] = [{
        type: 'ban_agent',
        target: 'agent-123',
        reason: 'Test ban',
        // No severity specified
      }];

      await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(mockAgent.ban).toHaveBeenCalledWith(
        'system-brain',
        'Test ban',
        'medium', // Default severity
        undefined
      );
    });
  });

  describe('executeActions - restrict_agent', () => {
    it('should restrict agent with specified features', async () => {
      const mockAgent = {
        _id: 'agent-123',
        name: 'Test Agent',
        restrict: jest.fn().mockResolvedValue(true),
      };

      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (memory.remember as jest.Mock).mockResolvedValue({});

      const actions: PlannedAction[] = [{
        type: 'restrict_agent',
        target: 'agent-123',
        reason: 'Rate limit exceeded',
        restrictions: ['api_access', 'new_conversations'],
      }];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('executed');
      expect(mockAgent.restrict).toHaveBeenCalledWith(
        ['api_access', 'new_conversations'],
        'Rate limit exceeded'
      );

      expect(alertsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security',
          title: expect.stringContaining('Agent Restricted'),
        }),
        mockTenantId
      );
    });
  });

  describe('executeActions - quarantine_agent', () => {
    it('should quarantine agent and archive conversations', async () => {
      const mockAgent = {
        _id: 'agent-123',
        name: 'Test Agent',
        quarantine: jest.fn().mockResolvedValue(true),
      };

      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (Conversation.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 3 });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const actions: PlannedAction[] = [{
        type: 'quarantine_agent',
        target: 'agent-123',
        reason: 'Suspicious activity detected',
      }];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('executed');
      expect(mockAgent.quarantine).toHaveBeenCalledWith('Suspicious activity detected');
      expect(Conversation.updateMany).toHaveBeenCalled();
    });
  });

  describe('executeActions - unban_agent', () => {
    it('should unban agent and restore to active status', async () => {
      const mockAgent = {
        _id: 'agent-123',
        name: 'Test Agent',
        banStatus: 'banned',
        unban: jest.fn().mockResolvedValue(true),
      };

      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (memory.remember as jest.Mock).mockResolvedValue({});

      const actions: PlannedAction[] = [{
        type: 'unban_agent',
        target: 'agent-123',
        reason: 'Agent behavior improved',
      }];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('executed');
      expect(mockAgent.unban).toHaveBeenCalled();

      expect(alertsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          title: expect.stringContaining('Agent Restored'),
          severity: 'info',
        }),
        mockTenantId
      );
    });
  });

  describe('executeActions - error handling', () => {
    it('should catch errors and mark action as failed', async () => {
      (Agent.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const actions: PlannedAction[] = [{
        type: 'ban_agent',
        target: 'agent-123',
        reason: 'Test',
      }];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('failed');
      expect(results[0].result?.error).toBe('Database error');
    });

    it('should continue processing other actions after error', async () => {
      (Agent.findById as jest.Mock)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          _id: 'agent-456',
          name: 'Second Agent',
          ban: jest.fn().mockResolvedValue(true),
        });

      (Conversation.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const actions: PlannedAction[] = [
        { type: 'ban_agent', target: 'agent-123', reason: 'First ban' },
        { type: 'ban_agent', target: 'agent-456', reason: 'Second ban' },
      ];

      const results = await executeActions(mockTenantId, mockCycleId, actions, 'enforced');

      expect(results[0].status).toBe('failed');
      expect(results[1].status).toBe('executed');
    });
  });
});
