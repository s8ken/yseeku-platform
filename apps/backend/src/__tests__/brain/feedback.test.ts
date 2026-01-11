// Mock dependencies - must be before imports
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../models/brain-action.model');
jest.mock('../../services/brain/memory');

import {
  recordActionOutcome,
  calculateEffectiveness,
  getActionRecommendations,
  measureActionImpact,
  getRecentOutcomes,
  ActionOutcome,
  SystemState,
} from '../../services/brain/feedback';
import { BrainAction } from '../../models/brain-action.model';
import * as memory from '../../services/brain/memory';

describe('Brain Feedback Service', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordActionOutcome()', () => {
    it('should update action and store outcome in memory', async () => {
      const mockAction = { type: 'ban_agent', target: 'agent-1' };
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (BrainAction.findById as jest.Mock).mockResolvedValue(mockAction);
      (memory.remember as jest.Mock).mockResolvedValue({});

      const outcome: ActionOutcome = {
        actionId: 'action-123',
        success: true,
        impact: 0.8,
        metrics: { trustDelta: 5 },
        timestamp: new Date(),
      };

      await recordActionOutcome(mockTenantId, outcome);

      expect(BrainAction.findByIdAndUpdate).toHaveBeenCalledWith(
        'action-123',
        expect.objectContaining({
          $set: expect.objectContaining({
            'result.outcome': expect.objectContaining({
              success: true,
              impact: 0.8,
            }),
          }),
        })
      );

      expect(memory.remember).toHaveBeenCalledWith(
        mockTenantId,
        'feedback:action_outcome',
        expect.objectContaining({
          actionId: 'action-123',
          actionType: 'ban_agent',
          success: true,
          impact: 0.8,
        }),
        expect.arrayContaining(['feedback', 'outcome', 'ban_agent'])
      );
    });

    it('should handle action not found gracefully', async () => {
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (BrainAction.findById as jest.Mock).mockResolvedValue(null);

      const outcome: ActionOutcome = {
        actionId: 'nonexistent',
        success: true,
        impact: 0.5,
        timestamp: new Date(),
      };

      // Should not throw
      await expect(recordActionOutcome(mockTenantId, outcome)).resolves.not.toThrow();
      expect(memory.remember).not.toHaveBeenCalled();
    });
  });

  describe('calculateEffectiveness()', () => {
    it('should return neutral score when no actions exist', async () => {
      (BrainAction.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await calculateEffectiveness(mockTenantId, 'ban_agent');

      expect(result).toEqual(expect.objectContaining({
        actionType: 'ban_agent',
        successRate: 0.5, // Neutral default
        avgImpact: 0,
        sampleSize: 0,
      }));
    });

    it('should calculate correct effectiveness from actions', async () => {
      const mockActions = [
        { result: { outcome: { success: true, impact: 0.8 } } },
        { result: { outcome: { success: true, impact: 0.6 } } },
        { result: { outcome: { success: false, impact: -0.2 } } },
      ];
      (BrainAction.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockActions),
      });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await calculateEffectiveness(mockTenantId, 'ban_agent');

      expect(result.successRate).toBeCloseTo(2 / 3);
      expect(result.avgImpact).toBeCloseTo(0.4);
      expect(result.sampleSize).toBe(3);
    });

    it('should store effectiveness in memory', async () => {
      const mockActions = [
        { result: { outcome: { success: true, impact: 0.5 } } },
      ];
      (BrainAction.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockActions),
      });
      (memory.remember as jest.Mock).mockResolvedValue({});

      await calculateEffectiveness(mockTenantId, 'alert');

      expect(memory.remember).toHaveBeenCalledWith(
        mockTenantId,
        'effectiveness:alert',
        expect.objectContaining({
          actionType: 'alert',
          successRate: 1,
        }),
        expect.arrayContaining(['effectiveness', 'score', 'alert'])
      );
    });
  });

  describe('getActionRecommendations()', () => {
    it('should recommend maintaining when insufficient data', async () => {
      (memory.recall as jest.Mock).mockResolvedValue(null);
      (BrainAction.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await getActionRecommendations(mockTenantId);

      expect(result.adjustments).toContainEqual(
        expect.objectContaining({
          actionType: 'alert',
          recommendation: 'maintain',
          reason: expect.stringContaining('Insufficient data'),
        })
      );
    });

    it('should recommend increase for high effectiveness', async () => {
      (memory.recall as jest.Mock).mockResolvedValue({
        payload: {
          successRate: 0.9,
          avgImpact: 0.8,
          sampleSize: 10,
        },
      });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await getActionRecommendations(mockTenantId);

      // At least one action type should have increase recommendation
      const alertRec = result.adjustments.find(a => a.actionType === 'alert');
      expect(alertRec?.recommendation).toBe('increase');
    });

    it('should recommend decrease for low effectiveness', async () => {
      (memory.recall as jest.Mock).mockResolvedValue({
        payload: {
          successRate: 0.2,
          avgImpact: -0.5,
          sampleSize: 10,
        },
      });
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await getActionRecommendations(mockTenantId);

      const alertRec = result.adjustments.find(a => a.actionType === 'alert');
      expect(alertRec?.recommendation).toBe('decrease');
    });

    it('should store recommendations in memory', async () => {
      (memory.recall as jest.Mock).mockResolvedValue(null);
      (BrainAction.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });
      (memory.remember as jest.Mock).mockResolvedValue({});

      await getActionRecommendations(mockTenantId);

      expect(memory.remember).toHaveBeenCalledWith(
        mockTenantId,
        'feedback:recommendations',
        expect.objectContaining({
          adjustments: expect.any(Array),
          generatedAt: expect.any(Date),
        }),
        expect.arrayContaining(['feedback', 'recommendations'])
      );
    });
  });

  describe('measureActionImpact()', () => {
    const preActionState: SystemState = {
      avgTrust: 60,
      emergenceLevel: 'WEAK_EMERGENCE',
    };

    const postActionState: SystemState = {
      avgTrust: 75,
      emergenceLevel: 'LINEAR',
    };

    it('should calculate positive impact for trust improvement', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue({
        type: 'adjust_threshold',
      });
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await measureActionImpact(
        mockTenantId,
        'action-1',
        preActionState,
        postActionState
      );

      expect(result.success).toBe(true);
      expect(result.impact).toBeGreaterThan(0);
      expect(result.metrics?.trustDelta).toBe(15);
    });

    it('should calculate negative impact for trust degradation', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue({
        type: 'adjust_threshold',
      });
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await measureActionImpact(
        mockTenantId,
        'action-1',
        { avgTrust: 80, emergenceLevel: 'LINEAR' },
        { avgTrust: 65, emergenceLevel: 'WEAK_EMERGENCE' }
      );

      expect(result.success).toBe(false);
      expect(result.impact).toBeLessThan(0);
    });

    it('should detect emergence improvement for ban_agent', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue({
        type: 'ban_agent',
      });
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await measureActionImpact(
        mockTenantId,
        'action-1',
        { avgTrust: 60, emergenceLevel: 'HIGH_WEAK_EMERGENCE' },
        { avgTrust: 60, emergenceLevel: 'LINEAR' }
      );

      expect(result.success).toBe(true);
      expect(result.impact).toBeGreaterThan(0); // Emergence improved
      expect(result.metrics?.emergenceDelta).toBe(1);
    });

    it('should throw error for nonexistent action', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        measureActionImpact(
          mockTenantId,
          'nonexistent',
          preActionState,
          postActionState
        )
      ).rejects.toThrow('Action not found');
    });

    it('should handle alert actions as always successful', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue({
        type: 'alert',
      });
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await measureActionImpact(
        mockTenantId,
        'action-1',
        preActionState,
        preActionState // Same state
      );

      expect(result.success).toBe(true);
      expect(result.impact).toBe(0.1); // Minimal positive impact
    });

    it('should handle unban_agent with trust monitoring', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue({
        type: 'unban_agent',
      });
      (BrainAction.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (memory.remember as jest.Mock).mockResolvedValue({});

      const result = await measureActionImpact(
        mockTenantId,
        'action-1',
        { avgTrust: 70, emergenceLevel: 'LINEAR' },
        { avgTrust: 75, emergenceLevel: 'LINEAR' }
      );

      expect(result.success).toBe(true);
      expect(result.impact).toBeGreaterThan(0);
    });
  });

  describe('getRecentOutcomes()', () => {
    it('should return recent outcome payloads', async () => {
      const mockMemories = [
        { payload: { actionId: '1', success: true } },
        { payload: { actionId: '2', success: false } },
      ];
      (memory.recallMany as jest.Mock).mockResolvedValue(mockMemories);

      const result = await getRecentOutcomes(mockTenantId, 10);

      expect(memory.recallMany).toHaveBeenCalledWith(mockTenantId, 'feedback:action_outcome', 10);
      expect(result).toHaveLength(2);
      expect(result[0].actionId).toBe('1');
    });
  });
});
