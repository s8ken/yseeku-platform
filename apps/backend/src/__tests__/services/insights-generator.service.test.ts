/**
 * InsightsGeneratorService Tests
 *
 * Tests for the actionable insights generation service.
 */

// Mock the TrustReceiptModel
jest.mock('../../models/trust-receipt.model', () => ({
  TrustReceiptModel: {
    find: jest.fn(),
  },
}));

import { InsightsGeneratorService } from '../../services/insights-generator.service';
import { TrustReceiptModel } from '../../models/trust-receipt.model';
import { InsightPriority, InsightCategory, InsightAction } from '../../types/insights.types';

const mockFind = TrustReceiptModel.find as jest.Mock;

function makeMockQuery(receipts: any[]) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(receipts),
  };
}

function makeReceipt(overrides: Partial<any> = {}): any {
  return {
    overallTrustScore: 85,
    complianceRate: 95,
    status: 'PASS',
    metrics: {},
    ...overrides,
  };
}

describe('InsightsGeneratorService', () => {
  let service: InsightsGeneratorService;

  beforeEach(() => {
    service = new InsightsGeneratorService();
    jest.clearAllMocks();
  });

  describe('generateInsights', () => {
    it('returns empty-state insight when no receipts exist', async () => {
      mockFind.mockReturnValue(makeMockQuery([]));

      const insights = await service.generateInsights('tenant-1');

      expect(insights).toHaveLength(1);
      expect(insights[0].priority).toBe(InsightPriority.INFO);
      expect(insights[0].category).toBe(InsightCategory.TRUST);
      expect(insights[0].title).toBe('No Trust Data Available');
    });

    it('generates critical trust score insight when avgTrustScore < 50', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 30 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const criticalInsight = insights.find(
        (i) => i.category === InsightCategory.TRUST && i.priority === InsightPriority.CRITICAL
      );
      expect(criticalInsight).toBeDefined();
      expect(criticalInsight!.title).toBe('Critical Trust Score Degradation');
      expect(criticalInsight!.suggestedActions).toContain(InsightAction.ESCALATE);
    });

    it('generates high-priority trust score insight when avgTrustScore is between 50 and 70', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 60 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const warningInsight = insights.find(
        (i) => i.category === InsightCategory.TRUST && i.priority === InsightPriority.HIGH
      );
      expect(warningInsight).toBeDefined();
      expect(warningInsight!.title).toBe('Trust Score Below Warning Threshold');
    });

    it('does not generate trust score insight when score is above warning threshold', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 90 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const trustScoreInsight = insights.find(
        (i) =>
          i.category === InsightCategory.TRUST &&
          (i.priority === InsightPriority.CRITICAL || i.priority === InsightPriority.HIGH) &&
          i.source.type === 'trust_score'
      );
      expect(trustScoreInsight).toBeUndefined();
    });

    it('generates high failure rate insight when >10% of receipts fail', async () => {
      const passing = Array.from({ length: 88 }, () => makeReceipt({ status: 'PASS' }));
      const failing = Array.from({ length: 12 }, () => makeReceipt({ status: 'FAIL' }));
      mockFind.mockReturnValue(makeMockQuery([...passing, ...failing]));

      const insights = await service.generateInsights('tenant-1');

      const failureInsight = insights.find(
        (i) => i.title === 'High Trust Evaluation Failure Rate'
      );
      expect(failureInsight).toBeDefined();
      expect(failureInsight!.priority).toBe(InsightPriority.HIGH);
    });

    it('generates phase-shift insight when receipts have high velocity', async () => {
      const receipts = Array.from({ length: 5 }, () =>
        makeReceipt({
          metrics: { phaseShiftVelocity: { currentVelocity: 0.5 } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const phaseShiftInsight = insights.find((i) => i.source.type === 'phase_shift');
      expect(phaseShiftInsight).toBeDefined();
      expect(phaseShiftInsight!.category).toBe(InsightCategory.BEHAVIORAL);
    });

    it('generates critical phase-shift insight when velocity exceeds critical threshold', async () => {
      const receipts = Array.from({ length: 5 }, () =>
        makeReceipt({
          metrics: { phaseShiftVelocity: { currentVelocity: 0.8 } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const phaseShiftInsight = insights.find((i) => i.source.type === 'phase_shift');
      expect(phaseShiftInsight).toBeDefined();
      expect(phaseShiftInsight!.priority).toBe(InsightPriority.CRITICAL);
    });

    it('generates emergence insight when strong emergence is detected', async () => {
      const receipts = Array.from({ length: 3 }, () =>
        makeReceipt({
          metrics: { emergence: { level: 'strong' } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const emergenceInsight = insights.find((i) => i.source.type === 'emergence');
      expect(emergenceInsight).toBeDefined();
      expect(emergenceInsight!.category).toBe(InsightCategory.EMERGENCE);
    });

    it('generates drift insight when more than 5 receipts exceed drift threshold', async () => {
      const receipts = Array.from({ length: 10 }, () =>
        makeReceipt({
          metrics: { drift: { currentDriftScore: 60 } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const driftInsight = insights.find((i) => i.source.type === 'drift');
      expect(driftInsight).toBeDefined();
      expect(driftInsight!.category).toBe(InsightCategory.BEHAVIORAL);
    });

    it('does not generate drift insight when fewer than 6 receipts exceed threshold', async () => {
      const normal = Array.from({ length: 47 }, () => makeReceipt());
      const drifting = Array.from({ length: 3 }, () =>
        makeReceipt({
          metrics: { drift: { currentDriftScore: 60 } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery([...normal, ...drifting]));

      const insights = await service.generateInsights('tenant-1');

      const driftInsight = insights.find((i) => i.source.type === 'drift');
      expect(driftInsight).toBeUndefined();
    });

    it('generates compliance insight when avgCompliance < 90', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ complianceRate: 80 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      const complianceInsight = insights.find((i) => i.source.type === 'compliance');
      expect(complianceInsight).toBeDefined();
      expect(complianceInsight!.category).toBe(InsightCategory.COMPLIANCE);
    });

    it('sorts insights by priority (critical first)', async () => {
      // Low trust + high phase-shift velocity → critical + high insights
      const receipts = Array.from({ length: 5 }, () =>
        makeReceipt({
          overallTrustScore: 30,
          metrics: { phaseShiftVelocity: { currentVelocity: 0.5 } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      expect(insights.length).toBeGreaterThan(1);
      // Critical should come before high/medium
      const firstNonCritical = insights.findIndex((i) => i.priority !== InsightPriority.CRITICAL);
      const firstCritical = insights.findIndex((i) => i.priority === InsightPriority.CRITICAL);
      if (firstCritical !== -1 && firstNonCritical !== -1) {
        expect(firstCritical).toBeLessThan(firstNonCritical);
      }
    });

    it('respects the limit parameter', async () => {
      const receipts = Array.from({ length: 5 }, () =>
        makeReceipt({
          overallTrustScore: 30,
          complianceRate: 70,
          metrics: { phaseShiftVelocity: { currentVelocity: 0.8 }, drift: { currentDriftScore: 80 } },
        })
      );
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1', 2);

      expect(insights.length).toBeLessThanOrEqual(2);
    });

    it('includes required fields in each insight', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 30 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await service.generateInsights('tenant-1');

      insights.forEach((insight) => {
        expect(insight.id).toBeDefined();
        expect(insight.tenantId).toBe('tenant-1');
        expect(insight.priority).toBeDefined();
        expect(insight.category).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.recommendation).toBeDefined();
        expect(insight.source).toBeDefined();
        expect(insight.metrics).toBeDefined();
        expect(insight.suggestedActions).toBeInstanceOf(Array);
        expect(insight.availableActions).toBeInstanceOf(Array);
        expect(insight.status).toBe('open');
        expect(insight.createdAt).toBeInstanceOf(Date);
        expect(insight.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('getInsightsSummary', () => {
    it('returns summary with correct counts', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 30 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const summary = await service.getInsightsSummary('tenant-1');

      expect(summary.total).toBeGreaterThan(0);
      expect(summary.byPriority).toBeDefined();
      expect(summary.byCategory).toBeDefined();
      expect(summary.byStatus).toBeDefined();
      expect(summary.criticalCount).toBe(summary.byPriority.critical);
      expect(summary.highCount).toBe(summary.byPriority.high);
    });

    it('returns zero counts when no receipts exist', async () => {
      mockFind.mockReturnValue(makeMockQuery([]));

      const summary = await service.getInsightsSummary('tenant-1');

      expect(summary.total).toBe(1); // empty state insight
      expect(summary.byPriority.info).toBe(1);
      expect(summary.criticalCount).toBe(0);
      expect(summary.highCount).toBe(0);
    });

    it('counts byStatus correctly', async () => {
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 30 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const summary = await service.getInsightsSummary('tenant-1');

      // All generated insights have status 'open'
      expect(summary.byStatus['open']).toBe(summary.total);
    });
  });

  describe('updateInsightStatus', () => {
    it('returns null (insights are not persisted)', async () => {
      const result = await service.updateInsightStatus('insight-id', 'acknowledged');
      expect(result).toBeNull();
    });
  });

  describe('custom config', () => {
    it('respects custom trust score thresholds', async () => {
      const customService = new InsightsGeneratorService({
        thresholds: {
          trustScore: { critical: 80, warning: 90 },
          phaseShiftVelocity: { critical: 0.6, warning: 0.4 },
          emergenceLevel: { threshold: 'strong' },
          driftScore: { critical: 70, warning: 50 },
        },
        priorities: {
          overrideEnabled: true,
          autoResolveLowPriority: false,
          escalateToOverseer: true,
        },
      });

      // Score of 75 is below critical=80 with custom config
      const receipts = Array.from({ length: 5 }, () => makeReceipt({ overallTrustScore: 75 }));
      mockFind.mockReturnValue(makeMockQuery(receipts));

      const insights = await customService.generateInsights('tenant-1');

      const criticalInsight = insights.find(
        (i) => i.category === InsightCategory.TRUST && i.priority === InsightPriority.CRITICAL
      );
      expect(criticalInsight).toBeDefined();
    });
  });
});
