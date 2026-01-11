/**
 * Override Service Tests
 * Comprehensive testing for override management functionality
 */

import { jest } from '@jest/globals';
import { Types } from 'mongoose';

// Mock dependencies before imports
jest.mock('../models/brain-action.model');
jest.mock('../models/override-decision.model');
jest.mock('../models/agent.model');
jest.mock('../services/settings.service');
jest.mock('../utils/audit-logger');

import { BrainAction } from '../models/brain-action.model';
import { OverrideDecision } from '../models/override-decision.model';
import { Agent } from '../models/agent.model';
import { settingsService } from '../services/settings.service';
import { logAudit } from '../utils/audit-logger';
import { overrideService } from '../services/override.service';

describe('Override Service', () => {
  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';
  const mockActionId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverrideQueue', () => {
    it('should return override queue with proper filtering', async () => {
      const mockActions = [
        {
          _id: mockActionId,
          type: 'ban_agent',
          target: 'agent-789',
          status: 'pending',
          createdAt: new Date(),
          reason: 'Suspicious activity',
          result: { severity: 'high' },
          approvedBy: 'system'
        }
      ];

      (BrainAction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockActions)
          })
        })
      });
      (BrainAction.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await overrideService.getOverrideQueue(mockTenantId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('ban_agent');
      expect(result.items[0].canOverride).toBe(true);
      expect(result.total).toBe(1);
    });

    it('should apply status filter correctly', async () => {
      (BrainAction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });
      (BrainAction.countDocuments as jest.Mock).mockResolvedValue(0);

      await overrideService.getOverrideQueue(mockTenantId, {
        status: ['pending', 'approved']
      });

      expect(BrainAction.find).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        status: { $in: ['pending', 'approved'] }
      });
    });

    it('should handle search filter', async () => {
      (BrainAction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });
      (BrainAction.countDocuments as jest.Mock).mockResolvedValue(0);

      await overrideService.getOverrideQueue(mockTenantId, {
        search: 'agent-789'
      });

      expect(BrainAction.find).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        $or: [
          { type: { $regex: 'agent-789', $options: 'i' } },
          { target: { $regex: 'agent-789', $options: 'i' } },
          { reason: { $regex: 'agent-789', $options: 'i' } }
        ]
      });
    });
  });

  describe('getOverrideHistory', () => {
    it('should return override history with proper aggregation', async () => {
      const mockHistory = [
        {
          id: 'hist-123',
          actionId: mockActionId,
          decision: 'approve',
          reason: 'Valid justification',
          emergency: false,
          createdAt: new Date(),
          userId: mockUserId,
          actionType: 'ban_agent',
          actionTarget: 'agent-789',
          actionStatus: 'overridden'
        }
      ];

      (OverrideDecision.aggregate as jest.Mock).mockResolvedValue(mockHistory);
      (OverrideDecision.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await overrideService.getOverrideHistory(mockTenantId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].decision).toBe('approve');
      expect(result.total).toBe(1);
    });

    it('should apply decision filter', async () => {
      (OverrideDecision.aggregate as jest.Mock).mockResolvedValue([]);
      (OverrideDecision.countDocuments as jest.Mock).mockResolvedValue(0);

      await overrideService.getOverrideHistory(mockTenantId, {
        decision: ['approve', 'reject']
      });

      expect(OverrideDecision.aggregate).toHaveBeenCalled();
      const pipeline = (OverrideDecision.aggregate as jest.Mock).mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match);
      expect(matchStage.$match.decision).toEqual({ $in: ['approve', 'reject'] });
    });
  });

  describe('processOverride', () => {
    it('should successfully approve a ban_agent override', async () => {
      const mockAction = {
        _id: mockActionId,
        tenantId: mockTenantId,
        type: 'ban_agent',
        target: 'agent-789',
        status: 'executed',
        result: { severity: 'high' },
        save: jest.fn().mockResolvedValue(true)
      };

      const mockAgent = {
        _id: 'agent-789',
        name: 'Test Agent',
        unban: jest.fn().mockResolvedValue(true)
      };

      (BrainAction.findById as jest.Mock).mockResolvedValue(mockAction);
      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (OverrideDecision.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        actionId: mockActionId,
        decision: 'approve',
        reason: 'Valid justification'
      });

      const result = await overrideService.processOverride({
        actionId: mockActionId.toString(),
        decision: 'approve',
        reason: 'Valid justification',
        userId: mockUserId,
        tenantId: mockTenantId
      });

      expect(result.success).toBe(true);
      expect(result.reverted).toBe(true);
      expect(mockAgent.unban).toHaveBeenCalled();
      expect(mockAction.save).toHaveBeenCalled();
      expect(logAudit).toHaveBeenCalled();
    });

    it('should reject override for tenant mismatch', async () => {
      const mockAction = {
        _id: mockActionId,
        tenantId: 'different-tenant',
        type: 'ban_agent',
        target: 'agent-789',
        status: 'executed'
      };

      (BrainAction.findById as jest.Mock).mockResolvedValue(mockAction);

      await expect(overrideService.processOverride({
        actionId: mockActionId.toString(),
        decision: 'approve',
        reason: 'Justification',
        userId: mockUserId,
        tenantId: mockTenantId
      })).rejects.toThrow('Tenant mismatch');
    });

    it('should handle non-existent action', async () => {
      (BrainAction.findById as jest.Mock).mockResolvedValue(null);

      await expect(overrideService.processOverride({
        actionId: mockActionId.toString(),
        decision: 'approve',
        reason: 'Justification',
        userId: mockUserId,
        tenantId: mockTenantId
      })).rejects.toThrow('Action not found');
    });

    it('should handle unknown action types gracefully', async () => {
      const mockAction = {
        _id: mockActionId,
        tenantId: mockTenantId,
        type: 'unknown_action',
        target: 'some-target',
        status: 'executed',
        result: {},
        save: jest.fn().mockResolvedValue(true)
      };

      (BrainAction.findById as jest.Mock).mockResolvedValue(mockAction);
      (OverrideDecision.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        actionId: mockActionId,
        decision: 'approve',
        reason: 'Justification'
      });

      const result = await overrideService.processOverride({
        actionId: mockActionId.toString(),
        decision: 'approve',
        reason: 'Justification',
        userId: mockUserId,
        tenantId: mockTenantId
      });

      expect(result.success).toBe(true);
      expect(result.reverted).toBe(false);
      expect(result.details.message).toBe('Unknown action type');
    });
  });

  describe('getOverrideStats', () => {
    it('should return accurate statistics', async () => {
      (OverrideDecision.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          { _id: 'approve', count: 15 },
          { _id: 'reject', count: 5 }
        ])
        .mockResolvedValueOnce([
          { _id: 'pending', count: 3 },
          { _id: 'approved', count: 2 },
          { _id: 'executed', count: 10 }
        ]);

      const result = await overrideService.getOverrideStats(mockTenantId);

      expect(result.pending).toBe(3);
      expect(result.approved).toBe(15);
      expect(result.rejected).toBe(5);
      expect(result.total).toBe(20);
      expect(result.approvalRate).toBe(75);
    });

    it('should handle empty statistics', async () => {
      (OverrideDecision.aggregate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await overrideService.getOverrideStats(mockTenantId);

      expect(result.pending).toBe(0);
      expect(result.approved).toBe(0);
      expect(result.rejected).toBe(0);
      expect(result.total).toBe(0);
      expect(result.approvalRate).toBe(0);
    });
  });

  describe('processBulkOverrides', () => {
    it('should process multiple overrides successfully', async () => {
      const actionIds = [
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString()
      ];

      const mockAction = {
        _id: mockActionId,
        tenantId: mockTenantId,
        type: 'ban_agent',
        target: 'agent-789',
        status: 'executed',
        result: {},
        save: jest.fn().mockResolvedValue(true)
      };

      const mockAgent = {
        _id: 'agent-789',
        unban: jest.fn().mockResolvedValue(true)
      };

      (BrainAction.findById as jest.Mock).mockResolvedValue(mockAction);
      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (OverrideDecision.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        actionId: mockActionId,
        decision: 'approve',
        reason: 'Bulk justification'
      });

      const result = await overrideService.processBulkOverrides({
        actionIds,
        decision: 'approve',
        reason: 'Bulk justification',
        userId: mockUserId,
        tenantId: mockTenantId
      });

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures in bulk operations', async () => {
      const actionIds = [
        new Types.ObjectId().toString(),
        new Types.ObjectId().toString()
      ];

      (BrainAction.findById as jest.Mock)
        .mockResolvedValueOnce(null) // First action not found
        .mockResolvedValueOnce({
          _id: mockActionId,
          tenantId: mockTenantId,
          type: 'ban_agent',
          target: 'agent-789',
          status: 'executed',
          result: {},
          save: jest.fn().mockResolvedValue(true)
        }); // Second action found

      const mockAgent = {
        _id: 'agent-789',
        unban: jest.fn().mockResolvedValue(true)
      };

      (Agent.findById as jest.Mock).mockResolvedValue(mockAgent);
      (OverrideDecision.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        actionId: mockActionId,
        decision: 'approve',
        reason: 'Bulk justification'
      });

      const result = await overrideService.processBulkOverrides({
        actionIds,
        decision: 'approve',
        reason: 'Bulk justification',
        userId: mockUserId,
        tenantId: mockTenantId
      });

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Action not found');
    });
  });
});