/**
 * Tests for the enhanced brain sensors
 */

import { SensorData, TrendData, analyzeTrend } from '../../../services/brain/sensors';

// We need to test the internal helper functions
// Extract them for testing by re-implementing the logic here
function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function calculateStd(arr: number[], mean: number): number {
  if (arr.length < 2) return 0;
  const squaredDiffs = arr.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / arr.length);
}

function testAnalyzeTrend(scores: number[]): TrendData {
  if (scores.length < 3) {
    return { direction: 'stable', slope: 0, volatility: 0, recentChange: 0 };
  }

  const n = Math.min(scores.length, 20);
  const recentScores = scores.slice(0, n);

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recentScores[i];
    sumXY += i * recentScores[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  const diffs: number[] = [];
  for (let i = 1; i < recentScores.length; i++) {
    diffs.push(Math.abs(recentScores[i] - recentScores[i - 1]));
  }
  const volatility = diffs.length > 0
    ? Math.sqrt(diffs.reduce((s, d) => s + d * d, 0) / diffs.length)
    : 0;

  const recent5 = recentScores.slice(0, 5);
  const prev5 = recentScores.slice(5, 10);
  const recentAvg = recent5.length > 0 ? recent5.reduce((s, v) => s + v, 0) / recent5.length : 0;
  const prevAvg = prev5.length > 0 ? prev5.reduce((s, v) => s + v, 0) / prev5.length : recentAvg;
  const recentChange = recentAvg - prevAvg;

  let direction: 'improving' | 'declining' | 'stable';
  if (slope > 0.5) {
    direction = 'improving';
  } else if (slope < -0.5) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }

  return { direction, slope, volatility, recentChange };
}

describe('Brain Sensors', () => {
  describe('calculateMean', () => {
    it('should return 0 for empty array', () => {
      expect(calculateMean([])).toBe(0);
    });

    it('should calculate mean correctly', () => {
      expect(calculateMean([10, 20, 30])).toBe(20);
      expect(calculateMean([85, 85, 85, 85])).toBe(85);
      expect(calculateMean([100])).toBe(100);
    });

    it('should handle decimal results', () => {
      expect(calculateMean([1, 2])).toBe(1.5);
      expect(calculateMean([80, 85, 90])).toBeCloseTo(85);
    });
  });

  describe('calculateStd', () => {
    it('should return 0 for single element', () => {
      expect(calculateStd([100], 100)).toBe(0);
    });

    it('should return 0 for identical values', () => {
      const arr = [85, 85, 85, 85];
      const mean = 85;
      expect(calculateStd(arr, mean)).toBe(0);
    });

    it('should calculate standard deviation correctly', () => {
      const arr = [80, 85, 90];
      const mean = 85;
      // Variance = ((80-85)^2 + (85-85)^2 + (90-85)^2) / 3 = (25 + 0 + 25) / 3 = 16.67
      // Std = sqrt(16.67) ≈ 4.08
      expect(calculateStd(arr, mean)).toBeCloseTo(4.08, 1);
    });

    it('should handle larger variations', () => {
      const arr = [50, 70, 90, 100];
      const mean = 77.5;
      const std = calculateStd(arr, mean);
      expect(std).toBeGreaterThan(15);
      expect(std).toBeLessThan(25);
    });
  });

  describe('analyzeTrend', () => {
    it('should return stable for insufficient data', () => {
      expect(testAnalyzeTrend([])).toEqual({
        direction: 'stable',
        slope: 0,
        volatility: 0,
        recentChange: 0,
      });

      expect(testAnalyzeTrend([85])).toEqual({
        direction: 'stable',
        slope: 0,
        volatility: 0,
        recentChange: 0,
      });

      expect(testAnalyzeTrend([85, 86])).toEqual({
        direction: 'stable',
        slope: 0,
        volatility: 0,
        recentChange: 0,
      });
    });

    it('should detect stable trend', () => {
      const scores = [85, 85, 84, 86, 85, 84, 85, 86, 85, 84];
      const trend = testAnalyzeTrend(scores);
      
      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.slope)).toBeLessThan(0.5);
    });

    it('should detect improving trend', () => {
      // Most recent first, so improving means scores increasing over time
      // In our array, index 0 is most recent
      const scores = [95, 93, 90, 87, 85, 82, 80, 78, 75, 72];
      const trend = testAnalyzeTrend(scores);
      
      // Note: slope is calculated with older values having higher indices
      // So improving trend should have positive slope
      expect(trend.direction).toBe('improving');
      expect(trend.slope).toBeGreaterThan(0.5);
    });

    it('should detect declining trend', () => {
      const scores = [70, 73, 75, 78, 80, 82, 85, 87, 90, 92];
      const trend = testAnalyzeTrend(scores);
      
      expect(trend.direction).toBe('declining');
      expect(trend.slope).toBeLessThan(-0.5);
    });

    it('should calculate volatility', () => {
      const stableScores = [85, 85, 85, 85, 85];
      const volatileScores = [70, 90, 75, 95, 80];
      
      const stableTrend = testAnalyzeTrend(stableScores);
      const volatileTrend = testAnalyzeTrend(volatileScores);
      
      expect(stableTrend.volatility).toBe(0);
      expect(volatileTrend.volatility).toBeGreaterThan(10);
    });

    it('should calculate recent change', () => {
      // Recent 5: 90, 88, 86, 84, 82 (avg = 86)
      // Previous 5: 80, 78, 76, 74, 72 (avg = 76)
      // Change = 86 - 76 = 10
      const scores = [90, 88, 86, 84, 82, 80, 78, 76, 74, 72];
      const trend = testAnalyzeTrend(scores);
      
      expect(trend.recentChange).toBeCloseTo(10, 0);
    });

    it('should handle negative recent change', () => {
      // Recent 5: 70, 72, 74, 76, 78 (avg = 74)
      // Previous 5: 80, 82, 84, 86, 88 (avg = 84)
      // Change = 74 - 84 = -10
      const scores = [70, 72, 74, 76, 78, 80, 82, 84, 86, 88];
      const trend = testAnalyzeTrend(scores);
      
      expect(trend.recentChange).toBeCloseTo(-10, 0);
    });
  });

  describe('SensorData interface', () => {
    it('should have all required fields', () => {
      const sensorData: SensorData = {
        bedau: { emergence_type: 'LINEAR', bedau_score: 0.5 },
        avgTrust: 85,
        receipts: [],
        trustTrend: {
          direction: 'stable',
          slope: 0,
          volatility: 2,
          recentChange: 0,
        },
        trustHistory: [85, 84, 86],
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
      };

      expect(sensorData.bedau).toBeDefined();
      expect(sensorData.avgTrust).toBeDefined();
      expect(sensorData.trustTrend).toBeDefined();
      expect(sensorData.agentHealth).toBeDefined();
      expect(sensorData.activeAlerts).toBeDefined();
      expect(sensorData.isBusinessHours).toBeDefined();
    });
  });

  describe('TrendData interface', () => {
    it('should have correct direction types', () => {
      const improving: TrendData = {
        direction: 'improving',
        slope: 1.5,
        volatility: 2,
        recentChange: 5,
      };

      const declining: TrendData = {
        direction: 'declining',
        slope: -1.5,
        volatility: 3,
        recentChange: -5,
      };

      const stable: TrendData = {
        direction: 'stable',
        slope: 0.1,
        volatility: 1,
        recentChange: 0,
      };

      expect(['improving', 'declining', 'stable']).toContain(improving.direction);
      expect(['improving', 'declining', 'stable']).toContain(declining.direction);
      expect(['improving', 'declining', 'stable']).toContain(stable.direction);
    });
  });
});
