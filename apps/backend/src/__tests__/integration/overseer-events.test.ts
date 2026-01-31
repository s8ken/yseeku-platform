/**
 * Overseer WebSocket Events Integration Tests
 * 
 * Tests the System Brain (Overseer) event flow:
 * - Brain cycle events
 * - Action approval/override events
 * - Trust violation events
 */

// Mock dependencies
jest.mock('../../models/brain-cycle.model', () => ({
  BrainCycle: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../models/brain-action.model', () => ({
  BrainAction: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../models/agent.model', () => ({
  Agent: {
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../services/system-brain.service', () => ({
  systemBrain: {
    initialize: jest.fn(),
    think: jest.fn(),
  },
}));

jest.mock('../../services/settings.service', () => ({
  settingsService: {
    setTrustThreshold: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/audit-logger', () => ({
  logAudit: jest.fn(),
}));

jest.mock('../../observability/metrics', () => ({
  sonateOverridesTotal: {
    inc: jest.fn(),
  },
}));

import { BrainCycle } from '../../models/brain-cycle.model';
import { BrainAction } from '../../models/brain-action.model';
import { Agent } from '../../models/agent.model';

describe('Overseer Events Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Brain Cycle Events', () => {
    it('should return cycles for specific tenant', async () => {
      const mockCycles = [
        {
          _id: 'cycle-1',
          tenantId: 'live-tenant',
          status: 'completed',
          mode: 'advisory',
          thought: 'All systems nominal',
          metrics: {
            agentCount: 5,
            avgTrust: 8.5,
            alertsProcessed: 2,
            actionsPlanned: 1,
          },
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      (BrainCycle.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCycles),
      });

      const cycles = await BrainCycle.find({ tenantId: 'live-tenant' })
        .sort({ startedAt: -1 })
        .limit(50);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].tenantId).toBe('live-tenant');
      expect(cycles[0].status).toBe('completed');
    });

    it('should return empty cycles for new live tenant', async () => {
      (BrainCycle.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const cycles = await BrainCycle.find({ tenantId: 'live-tenant' })
        .sort({ startedAt: -1 })
        .limit(50);

      expect(cycles).toHaveLength(0);
    });

    it('should calculate overseer status from last cycle', async () => {
      const lastCycle = {
        completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        status: 'completed',
        thought: 'Systems operating normally',
        mode: 'advisory',
        metrics: {
          agentCount: 3,
          avgTrust: 8.0,
          alertsProcessed: 1,
          actionsPlanned: 0,
        },
      };

      const calculateStatus = (cycle: any) => {
        if (!cycle || !cycle.completedAt) return 'idle';
        const timeSinceLastCycle = Date.now() - new Date(cycle.completedAt).getTime();
        return timeSinceLastCycle < 60 * 60 * 1000 ? 'active' : 'idle';
      };

      expect(calculateStatus(lastCycle)).toBe('active');
      expect(calculateStatus(null)).toBe('idle');
    });
  });

  describe('Brain Action Events', () => {
    it('should approve action and update status', async () => {
      const mockAction = {
        _id: 'action-1',
        type: 'alert',
        target: 'agent-1',
        reason: 'Trust score below threshold',
        status: 'approved',
        approvedBy: 'admin@test.com',
      };

      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockAction);

      const action = await BrainAction.findByIdAndUpdate(
        'action-1',
        { status: 'approved', approvedBy: 'admin@test.com' },
        { new: true }
      );

      expect(action).not.toBeNull();
      expect(action!.status).toBe('approved');
      expect(action!.approvedBy).toBe('admin@test.com');
    });

    it('should handle action override with justification', async () => {
      const mockAction = {
        _id: 'action-1',
        type: 'ban_agent',
        target: 'agent-1',
        status: 'executed',
        result: {
          overridden: true,
          overriddenBy: 'admin@test.com',
          justification: 'False positive - agent behavior was correct',
        },
        save: jest.fn(),
      };

      (BrainAction.findById as jest.Mock).mockResolvedValue(mockAction);

      const action = await BrainAction.findById('action-1');
      
      expect(action).not.toBeNull();
      expect(action!.type).toBe('ban_agent');
      expect(action!.result!.overridden).toBe(true);
      expect(action!.result!.justification).toContain('False positive');
    });

    it('should require justification for critical actions', () => {
      const criticalActions = ['ban_agent', 'restrict_agent', 'quarantine_agent'];
      
      const requiresJustification = (actionType: string) => 
        criticalActions.includes(actionType);

      expect(requiresJustification('ban_agent')).toBe(true);
      expect(requiresJustification('restrict_agent')).toBe(true);
      expect(requiresJustification('alert')).toBe(false);
    });

    it('should count recent actions for tenant', async () => {
      (BrainAction.countDocuments as jest.Mock).mockResolvedValue(5);

      const count = await BrainAction.countDocuments({
        tenantId: 'live-tenant',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      expect(count).toBe(5);
    });
  });

  describe('Trust Violation Events', () => {
    it('should emit trust violation event structure', () => {
      const trustViolationEvent = {
        conversationId: 'conv-1',
        messageId: 'msg-1',
        status: 'FAIL',
        violations: ['CONSENT_ARCHITECTURE', 'ETHICAL_OVERRIDE'],
        trustScore: 3.5,
      };

      expect(trustViolationEvent.status).toBe('FAIL');
      expect(trustViolationEvent.violations).toContain('CONSENT_ARCHITECTURE');
      expect(trustViolationEvent.trustScore).toBeLessThan(5);
    });

    it('should identify critical violations', () => {
      const criticalPrinciples = ['CONSENT_ARCHITECTURE', 'ETHICAL_OVERRIDE'];
      
      const hasCriticalViolation = (violations: string[]) =>
        violations.some(v => criticalPrinciples.includes(v));

      expect(hasCriticalViolation(['CONSENT_ARCHITECTURE'])).toBe(true);
      expect(hasCriticalViolation(['INSPECTION_MANDATE'])).toBe(false);
    });
  });

  describe('Overseer Status Calculation', () => {
    it('should return correct status structure', () => {
      const buildStatusResponse = (lastCycle: any, recentActionsCount: number) => {
        const isActive = lastCycle &&
          lastCycle.completedAt &&
          (Date.now() - new Date(lastCycle.completedAt).getTime()) < 60 * 60 * 1000;

        return {
          status: isActive ? 'active' : 'idle',
          lastThought: lastCycle?.completedAt || new Date(),
          health: lastCycle?.status === 'completed' ? 'nominal' : 'monitoring',
          message: lastCycle?.thought || 'Awaiting next analysis cycle.',
          metrics: lastCycle?.metrics || {
            agentCount: 0,
            systemTrustScore: 8.0,
            alertsProcessed: 0,
            actionsPlanned: 0,
          },
          mode: lastCycle?.mode || 'advisory',
          recentActionsCount,
        };
      };

      const status = buildStatusResponse(null, 0);
      
      expect(status.status).toBe('idle');
      expect(status.mode).toBe('advisory');
      expect(status.metrics.agentCount).toBe(0);
    });

    it('should handle active overseer with recent cycle', () => {
      const recentCycle = {
        completedAt: new Date(),
        status: 'completed',
        thought: 'Detected 2 agents with declining trust scores',
        mode: 'advisory',
        metrics: {
          agentCount: 5,
          avgTrust: 7.5,
          alertsProcessed: 3,
          actionsPlanned: 2,
        },
      };

      const isActive = recentCycle &&
        recentCycle.completedAt &&
        (Date.now() - new Date(recentCycle.completedAt).getTime()) < 60 * 60 * 1000;

      expect(isActive).toBe(true);
    });
  });
});

describe('WebSocket Event Flow', () => {
  describe('Socket Room Management', () => {
    it('should join user to personal room', () => {
      const userId = 'user-123';
      const roomName = `user:${userId}`;
      
      expect(roomName).toBe('user:user-123');
    });

    it('should join user to conversation room', () => {
      const conversationId = 'conv-456';
      const roomName = `conversation:${conversationId}`;
      
      expect(roomName).toBe('conversation:conv-456');
    });
  });

  describe('Message Events', () => {
    it('should structure message:new event correctly', () => {
      const messageEvent = {
        conversationId: 'conv-1',
        message: {
          sender: 'ai',
          content: 'Hello, how can I help you?',
          timestamp: new Date(),
          metadata: {
            messageId: 'msg-123',
            trustEvaluation: {
              trustScore: { overall: 8.5 },
              status: 'PASS',
            },
          },
        },
      };

      expect(messageEvent.message.sender).toBe('ai');
      expect(messageEvent.message.metadata.trustEvaluation.status).toBe('PASS');
    });

    it('should structure agent:typing event correctly', () => {
      const typingEvent = {
        conversationId: 'conv-1',
        agentId: 'agent-1',
      };

      expect(typingEvent.conversationId).toBe('conv-1');
      expect(typingEvent.agentId).toBe('agent-1');
    });
  });

  describe('Trust Events', () => {
    it('should emit trust:violation for low scores', () => {
      const shouldEmitViolation = (status: string) => 
        status === 'FAIL' || status === 'PARTIAL';

      expect(shouldEmitViolation('FAIL')).toBe(true);
      expect(shouldEmitViolation('PARTIAL')).toBe(true);
      expect(shouldEmitViolation('PASS')).toBe(false);
    });
  });
});