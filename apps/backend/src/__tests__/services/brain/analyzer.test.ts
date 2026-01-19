/**
 * Tests for the enhanced brain analyzer
 */

import { analyzeContext, AnalysisResult } from '../../../services/brain/analyzer';
import { SensorData } from '../../../services/brain/sensors';

// Helper to create mock sensor data
function createMockSensorData(overrides: Partial<SensorData> = {}): SensorData {
  return {
    bedau: { emergence_type: 'LINEAR', bedau_score: 0.5 },
    avgTrust: 85,
    receipts: [],
    trustTrend: {
      direction: 'stable',
      slope: 0,
      volatility: 2,
      recentChange: 0,
    },
    trustHistory: [85, 84, 86, 85, 84],
    historicalMean: 85,
    historicalStd: 5,
    agentHealth: {
      total: 10,
      active: 10,
      banned: 0,
      restricted: 0,
      quarantined: 0,
      avgAgentTrust: 85,
    },
    activeAlerts: {
      total: 0,
      critical: 0,
      warning: 0,
      unacknowledged: 0,
    },
    timestamp: new Date(),
    hourOfDay: 14,
    isBusinessHours: true,
    ...overrides,
  };
}

describe('Brain Analyzer', () => {
  describe('analyzeContext', () => {
    it('should return healthy status for normal system state', () => {
      const sensors = createMockSensorData();
      const result = analyzeContext(sensors);

      expect(result.status).toBe('healthy');
      expect(result.riskScore).toBeLessThan(25);
      expect(result.anomalies).toHaveLength(0);
      expect(result.urgency).toBe('low');
    });

    it('should detect low trust and add observation', () => {
      const sensors = createMockSensorData({ avgTrust: 65 });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('low_trust');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect critical trust level', () => {
      const sensors = createMockSensorData({ avgTrust: 45 });
      const result = analyzeContext(sensors);

      expect(result.status).toBe('critical');
      expect(result.observations).toContain('critical_trust_level');
      expect(result.anomalies.some(a => a.type === 'trust_critical')).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
    });

    it('should detect statistical anomaly (z-score)', () => {
      const sensors = createMockSensorData({
        avgTrust: 65,
        historicalMean: 85,
        historicalStd: 5,
      });
      const result = analyzeContext(sensors);

      // Z-score = (65 - 85) / 5 = -4
      expect(result.observations).toContain('statistical_anomaly');
      expect(result.anomalies.some(a => a.type === 'zscore_anomaly')).toBe(true);
      expect(result.context.trustZScore).toBeLessThan(-2);
    });

    it('should detect high weak emergence', () => {
      const sensors = createMockSensorData({
        bedau: { emergence_type: 'HIGH_WEAK_EMERGENCE', bedau_score: 0.9 },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('high_emergence_detected');
      expect(result.anomalies.some(a => a.type === 'emergence_high')).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });

    it('should detect weak emergence', () => {
      const sensors = createMockSensorData({
        bedau: { emergence_type: 'WEAK_EMERGENCE', bedau_score: 0.7 },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('emergence_detected');
    });

    it('should detect declining trend', () => {
      const sensors = createMockSensorData({
        trustTrend: {
          direction: 'declining',
          slope: -0.8,
          volatility: 3,
          recentChange: -5,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('declining_trend');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect rapid decline', () => {
      const sensors = createMockSensorData({
        trustTrend: {
          direction: 'declining',
          slope: -1.5,
          volatility: 5,
          recentChange: -10,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('rapid_decline');
      expect(result.anomalies.some(a => a.type === 'rapid_decline')).toBe(true);
    });

    it('should detect improving trend and reduce risk', () => {
      const sensors = createMockSensorData({
        trustTrend: {
          direction: 'improving',
          slope: 1.0,
          volatility: 2,
          recentChange: 5,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('improving_trend');
      // Risk should be lower due to positive trend
    });

    it('should detect high volatility', () => {
      const sensors = createMockSensorData({
        trustTrend: {
          direction: 'stable',
          slope: 0,
          volatility: 15,
          recentChange: 0,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('high_volatility');
      expect(result.anomalies.some(a => a.type === 'volatility')).toBe(true);
    });

    it('should detect banned agents', () => {
      const sensors = createMockSensorData({
        agentHealth: {
          total: 10,
          active: 8,
          banned: 2,
          restricted: 0,
          quarantined: 0,
          avgAgentTrust: 80,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('agents_banned');
    });

    it('should detect high ban ratio', () => {
      const sensors = createMockSensorData({
        agentHealth: {
          total: 10,
          active: 7,
          banned: 3,
          restricted: 0,
          quarantined: 0,
          avgAgentTrust: 75,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('high_ban_ratio');
    });

    it('should detect critical alerts', () => {
      const sensors = createMockSensorData({
        activeAlerts: {
          total: 5,
          critical: 2,
          warning: 3,
          unacknowledged: 4,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('critical_alerts_active');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect many unacknowledged alerts', () => {
      const sensors = createMockSensorData({
        activeAlerts: {
          total: 10,
          critical: 0,
          warning: 10,
          unacknowledged: 8,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.observations).toContain('many_unacknowledged_alerts');
    });

    it('should reduce risk during off-hours', () => {
      const businessHours = createMockSensorData({
        avgTrust: 65,
        isBusinessHours: true,
      });
      const offHours = createMockSensorData({
        avgTrust: 65,
        isBusinessHours: false,
      });

      const businessResult = analyzeContext(businessHours);
      const offHoursResult = analyzeContext(offHours);

      // Off-hours should have lower risk for same conditions
      expect(offHoursResult.riskScore).toBeLessThan(businessResult.riskScore);
    });

    it('should set urgency to immediate for high risk', () => {
      const sensors = createMockSensorData({
        avgTrust: 40,
        bedau: { emergence_type: 'HIGH_WEAK_EMERGENCE', bedau_score: 0.95 },
        trustTrend: {
          direction: 'declining',
          slope: -2,
          volatility: 15,
          recentChange: -15,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.urgency).toBe('immediate');
      expect(result.status).toBe('critical');
    });

    it('should provide context with all metrics', () => {
      const sensors = createMockSensorData({
        avgTrust: 70,
        agentHealth: {
          total: 10,
          active: 9,
          banned: 1,
          restricted: 0,
          quarantined: 0,
          avgAgentTrust: 80,
        },
        activeAlerts: {
          total: 2,
          critical: 0,
          warning: 2,
          unacknowledged: 1,
        },
      });
      const result = analyzeContext(sensors);

      expect(result.context).toEqual(
        expect.objectContaining({
          trustZScore: expect.any(Number),
          emergenceLevel: 'LINEAR',
          trendDirection: 'stable',
          hasActiveAlerts: true,
          hasBannedAgents: true,
        })
      );
    });

    it('should clamp risk score between 0 and 100', () => {
      // Very bad scenario
      const badSensors = createMockSensorData({
        avgTrust: 30,
        bedau: { emergence_type: 'HIGH_WEAK_EMERGENCE', bedau_score: 1.0 },
        historicalMean: 90,
        historicalStd: 5,
        trustTrend: { direction: 'declining', slope: -3, volatility: 20, recentChange: -20 },
        agentHealth: { total: 10, active: 2, banned: 5, restricted: 2, quarantined: 1, avgAgentTrust: 50 },
        activeAlerts: { total: 20, critical: 10, warning: 10, unacknowledged: 15 },
      });
      const result = analyzeContext(badSensors);

      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });
  });
});
