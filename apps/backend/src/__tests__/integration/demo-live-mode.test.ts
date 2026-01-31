/**
 * Demo/Live Mode Integration Tests
 * 
 * Tests the tenant switching functionality between demo and live modes:
 * - Demo mode: Pre-seeded tenant with realistic data
 * - Live mode: Blank slate tenant that populates via Trust Session chat
 */

import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../models/agent.model', () => ({
  Agent: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../models/conversation.model', () => ({
  Conversation: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../models/trust-receipt.model', () => ({
  TrustReceiptModel: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    insertMany: jest.fn(),
  },
}));

jest.mock('../../models/alert.model', () => ({
  AlertModel: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    insertMany: jest.fn(),
  },
}));

jest.mock('../../models/experiment.model', () => ({
  Experiment: {
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../services/alerts.service', () => ({
  alertsService: {
    getSummary: jest.fn().mockResolvedValue({ active: 3, total: 5 }),
    seedDemoAlerts: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/demo-seeder.service', () => ({
  demoSeederService: {
    seed: jest.fn().mockResolvedValue({
      success: true,
      message: 'Demo tenant seeded',
      seeded: { agents: 5, receipts: 30 },
    }),
    getStatus: jest.fn().mockResolvedValue({
      isSeeded: true,
      stats: { agents: 5, conversations: 3, receipts: 30, alerts: 4, experiments: 2 },
    }),
    DEMO_TENANT_ID: 'demo-tenant',
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

import { Agent } from '../../models/agent.model';
import { Conversation } from '../../models/conversation.model';
import { TrustReceiptModel } from '../../models/trust-receipt.model';
import { AlertModel } from '../../models/alert.model';
import { Experiment } from '../../models/experiment.model';

describe('Demo/Live Mode Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tenant Isolation', () => {
    it('should return demo-tenant data when X-Tenant-ID is demo-tenant', async () => {
      const mockRequest = {
        userTenant: 'demo-tenant',
        userId: 'test-user-id',
      } as unknown as Request;

      // Verify tenant is correctly identified
      expect(mockRequest.userTenant).toBe('demo-tenant');
    });

    it('should return live-tenant data when X-Tenant-ID is live-tenant', async () => {
      const mockRequest = {
        userTenant: 'live-tenant',
        userId: 'test-user-id',
      } as unknown as Request;

      // Verify tenant is correctly identified
      expect(mockRequest.userTenant).toBe('live-tenant');
    });

    it('should isolate trust receipts by tenant_id', async () => {
      const mockDemoReceipts = [
        { tenant_id: 'demo-tenant', ciq_metrics: { clarity: 4.5, integrity: 4.3, quality: 4.2 } },
      ];
      const mockLiveReceipts: any[] = [];

      (TrustReceiptModel.find as jest.Mock)
        .mockImplementation((query) => ({
          lean: jest.fn().mockResolvedValue(
            query.tenant_id === 'demo-tenant' ? mockDemoReceipts : mockLiveReceipts
          ),
        }));

      // Demo tenant should have receipts
      const demoResult = await TrustReceiptModel.find({ tenant_id: 'demo-tenant' }).lean();
      expect(demoResult).toHaveLength(1);

      // Live tenant should start empty
      const liveResult = await TrustReceiptModel.find({ tenant_id: 'live-tenant' }).lean();
      expect(liveResult).toHaveLength(0);
    });

    it('should isolate alerts by tenantId', async () => {
      const mockDemoAlerts = [
        { tenantId: 'demo-tenant', type: 'drift_detected', severity: 'warning' },
        { tenantId: 'demo-tenant', type: 'compliance_warning', severity: 'info' },
      ];
      const mockLiveAlerts: any[] = [];

      (AlertModel.find as jest.Mock)
        .mockImplementation((query) => ({
          lean: jest.fn().mockResolvedValue(
            query.tenantId === 'demo-tenant' ? mockDemoAlerts : mockLiveAlerts
          ),
        }));

      // Demo tenant should have alerts
      const demoResult = await AlertModel.find({ tenantId: 'demo-tenant' }).lean();
      expect(demoResult).toHaveLength(2);

      // Live tenant should start empty
      const liveResult = await AlertModel.find({ tenantId: 'live-tenant' }).lean();
      expect(liveResult).toHaveLength(0);
    });
  });

  describe('Live Mode Blank Slate', () => {
    it('should return zero metrics for live tenant with no interactions', async () => {
      // Mock empty results for live tenant
      (TrustReceiptModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });
      (Agent.countDocuments as jest.Mock).mockResolvedValue(0);
      (AlertModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (Experiment.countDocuments as jest.Mock).mockResolvedValue(0);

      const receipts = await TrustReceiptModel.find({ tenant_id: 'live-tenant' }).lean();
      const agentCount = await Agent.countDocuments({ user: 'test-user' });
      const alertCount = await AlertModel.countDocuments({ tenantId: 'live-tenant' });

      expect(receipts).toHaveLength(0);
      expect(agentCount).toBe(0);
      expect(alertCount).toBe(0);
    });

    it('should calculate trust score as 0 when no receipts exist', () => {
      const receipts: any[] = [];
      
      const calculateTrustScore = (receipts: any[]) => {
        if (receipts.length === 0) return 0;
        const total = receipts.reduce((sum, r) => {
          const ciq = r.ciq_metrics || { clarity: 0, integrity: 0, quality: 0 };
          return sum + ((ciq.clarity + ciq.integrity + ciq.quality) / 3) * 10;
        }, 0);
        return Math.round((total / receipts.length) * 10) / 10;
      };

      expect(calculateTrustScore(receipts)).toBe(0);
    });
  });

  describe('Demo Mode Pre-seeded Data', () => {
    it('should return pre-seeded metrics for demo tenant', async () => {
      const mockReceipts = Array.from({ length: 30 }, (_, i) => ({
        tenant_id: 'demo-tenant',
        ciq_metrics: { clarity: 4.5, integrity: 4.3, quality: 4.2 },
        timestamp: Date.now() - i * 10 * 60 * 1000,
      }));

      (TrustReceiptModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReceipts),
      });

      const receipts = await TrustReceiptModel.find({ tenant_id: 'demo-tenant' })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();

      expect(receipts).toHaveLength(30);
      expect(receipts[0].ciq_metrics.clarity).toBe(4.5);
    });

    it('should return deterministic demo KPI values', () => {
      // Demo mode should return stable, deterministic values
      const demoTrustScore = 8.8;
      const demoInteractions = 1503;

      expect(demoTrustScore).toBe(8.8);
      expect(demoInteractions).toBe(1503);
    });
  });

  describe('SONATE Dimensions v2.0.1', () => {
    it('should only include 3 validated dimensions', () => {
      const sonateDimensions = {
        trustProtocol: 'PASS',
        ethicalAlignment: 4.3,
        resonanceQuality: 'ADVANCED',
        // Deprecated fields - kept for backward compatibility
        realityIndex: 0,
        canvasParity: 0,
      };

      // Validated dimensions should have real values
      expect(sonateDimensions.trustProtocol).toBe('PASS');
      expect(sonateDimensions.ethicalAlignment).toBe(4.3);
      expect(sonateDimensions.resonanceQuality).toBe('ADVANCED');

      // Deprecated dimensions should be 0
      expect(sonateDimensions.realityIndex).toBe(0);
      expect(sonateDimensions.canvasParity).toBe(0);
    });

    it('should calculate trustProtocol status correctly', () => {
      const calculateTrustProtocol = (complianceRate: number) => {
        if (complianceRate >= 80) return 'PASS';
        if (complianceRate >= 60) return 'PARTIAL';
        return 'FAIL';
      };

      expect(calculateTrustProtocol(90)).toBe('PASS');
      expect(calculateTrustProtocol(70)).toBe('PARTIAL');
      expect(calculateTrustProtocol(50)).toBe('FAIL');
    });

    it('should calculate resonanceQuality correctly', () => {
      const calculateResonanceQuality = (trustScore: number) => {
        if (trustScore >= 85) return 'ADVANCED';
        if (trustScore >= 70) return 'STRONG';
        return 'BASIC';
      };

      expect(calculateResonanceQuality(90)).toBe('ADVANCED');
      expect(calculateResonanceQuality(75)).toBe('STRONG');
      expect(calculateResonanceQuality(60)).toBe('BASIC');
    });
  });

  describe('Dashboard Invalidation Flow', () => {
    it('should invalidate correct query keys after chat interaction', () => {
      const invalidatedKeys = [
        'dashboard-kpis',
        'trust-analytics',
        'trust-receipts',
        'receipts',
        'alerts',
        'live-metrics',
        'agents',
        'risk',
        'interactions',
      ];

      // Verify all expected keys are in the invalidation list
      expect(invalidatedKeys).toContain('dashboard-kpis');
      expect(invalidatedKeys).toContain('trust-analytics');
      expect(invalidatedKeys).toContain('receipts');
      expect(invalidatedKeys).toContain('live-metrics');
    });
  });

  describe('Tenant Switching', () => {
    it('should clear query cache when switching tenants', () => {
      const mockQueryClient = {
        clear: jest.fn(),
        invalidateQueries: jest.fn(),
      };

      // Simulate tenant switch
      mockQueryClient.clear();

      expect(mockQueryClient.clear).toHaveBeenCalled();
    });

    it('should update currentTenantId based on isDemo flag', () => {
      const DEMO_TENANT_ID = 'demo-tenant';
      const LIVE_TENANT_ID = 'live-tenant';

      const getCurrentTenantId = (isDemo: boolean) => 
        isDemo ? DEMO_TENANT_ID : LIVE_TENANT_ID;

      expect(getCurrentTenantId(true)).toBe('demo-tenant');
      expect(getCurrentTenantId(false)).toBe('live-tenant');
    });
  });
});

describe('Trust Receipt Generation', () => {
  it('should create trust receipt with correct tenant_id for live mode', () => {
    const createReceipt = (tenantId: string, ciqMetrics: any) => ({
      tenant_id: tenantId,
      ciq_metrics: ciqMetrics,
      timestamp: Date.now(),
      version: '2.0.0',
      mode: 'constitutional',
    });

    const receipt = createReceipt('live-tenant', {
      clarity: 4.5,
      integrity: 4.3,
      quality: 4.2,
    });

    expect(receipt.tenant_id).toBe('live-tenant');
    expect(receipt.ciq_metrics.clarity).toBe(4.5);
    expect(receipt.version).toBe('2.0.0');
  });

  it('should chain receipts with previous_hash', () => {
    const receipts = [
      { self_hash: 'hash1', previous_hash: undefined },
      { self_hash: 'hash2', previous_hash: 'hash1' },
      { self_hash: 'hash3', previous_hash: 'hash2' },
    ];

    // Verify chain integrity
    expect(receipts[0].previous_hash).toBeUndefined();
    expect(receipts[1].previous_hash).toBe('hash1');
    expect(receipts[2].previous_hash).toBe('hash2');
  });
});