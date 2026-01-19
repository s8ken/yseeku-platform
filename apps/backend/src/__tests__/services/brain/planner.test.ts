/**
 * Tests for the enhanced brain planner
 */

import { planActions, PlannedAction, PlanningContext } from '../../../services/brain/planner';
import { AnalysisResult, Anomaly } from '../../../services/brain/analyzer';
import { SensorData } from '../../../services/brain/sensors';

// Helper to create mock analysis result
function createMockAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    status: 'healthy',
    observations: [],
    riskScore: 10,
    anomalies: [],
    urgency: 'low',
    context: {
      trustZScore: 0,
      emergenceLevel: 'LINEAR',
      trendDirection: 'stable',
      hasActiveAlerts: false,
      hasBannedAgents: false,
    },
    ...overrides,
  };
}

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

describe('Brain Planner', () => {
  describe('planActions', () => {
    it('should return empty actions for healthy system', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis(),
        sensors: createMockSensorData(),
      };

      const actions = await planActions(context);
      expect(actions).toHaveLength(0);
    });

    it('should plan alert for critical trust anomaly', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          status: 'critical',
          anomalies: [
            {
              type: 'trust_critical',
              severity: 'high',
              value: 45,
              threshold: 50,
              description: 'Critical trust level: Trust score critically low at 45%',
            },
          ],
        }),
        sensors: createMockSensorData({ avgTrust: 45 }),
      };

      const actions = await planActions(context);
      
      expect(actions.length).toBeGreaterThan(0);
      const alertAction = actions.find(a => a.type === 'alert' && a.priority === 'critical');
      expect(alertAction).toBeDefined();
      expect(alertAction?.confidence).toBeGreaterThan(0.9);
    });

    it('should plan alert for statistical anomaly', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          anomalies: [
            {
              type: 'zscore_anomaly',
              severity: 'high',
              value: -3,
              threshold: -2,
              description: 'Trust 3 std devs below mean',
            },
          ],
        }),
        sensors: createMockSensorData(),
      };

      const actions = await planActions(context);
      
      const alertAction = actions.find(a => a.type === 'alert' && a.priority === 'high');
      expect(alertAction).toBeDefined();
      expect(alertAction?.reason).toContain('Statistical anomaly');
    });

    it('should plan threshold adjustment for high emergence', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          anomalies: [
            {
              type: 'emergence_high',
              severity: 'high',
              value: 1,
              threshold: 0,
              description: 'High weak emergence detected',
            },
          ],
        }),
        sensors: createMockSensorData(),
      };

      const actions = await planActions(context);
      
      const adjustAction = actions.find(a => a.type === 'adjust_threshold');
      expect(adjustAction).toBeDefined();
      expect(adjustAction?.priority).toBe('high');
    });

    it('should skip threshold adjustment if recommendations say decrease', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          anomalies: [
            {
              type: 'emergence_high',
              severity: 'high',
              value: 1,
              threshold: 0,
              description: 'High weak emergence detected',
            },
          ],
        }),
        sensors: createMockSensorData(),
        recommendations: [
          {
            actionType: 'adjust_threshold',
            recommendation: 'decrease',
            confidence: 0.8,
            reason: 'Low effectiveness',
          },
        ],
      };

      const actions = await planActions(context);
      
      // Should fall back to alert instead of adjust_threshold
      const adjustAction = actions.find(a => a.type === 'adjust_threshold');
      expect(adjustAction).toBeUndefined();
      
      const alertAction = actions.find(a => a.type === 'alert');
      expect(alertAction).toBeDefined();
    });

    it('should plan alert for low trust observation', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['low_trust'],
        }),
        sensors: createMockSensorData({ avgTrust: 65 }),
      };

      const actions = await planActions(context);
      
      const adjustAction = actions.find(a => a.type === 'adjust_threshold');
      expect(adjustAction).toBeDefined();
    });

    it('should plan alert for critical alerts', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['critical_alerts_active'],
        }),
        sensors: createMockSensorData({
          activeAlerts: { total: 5, critical: 3, warning: 2, unacknowledged: 4 },
        }),
      };

      const actions = await planActions(context);
      
      const alertAction = actions.find(a => a.target === 'escalation');
      expect(alertAction).toBeDefined();
      expect(alertAction?.priority).toBe('high');
    });

    it('should plan proactive alert for predicted critical state', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['declining_trend'],
        }),
        sensors: createMockSensorData({
          avgTrust: 75,
          trustTrend: {
            direction: 'declining',
            slope: -5, // Will hit 60 in 3 cycles
            volatility: 3,
            recentChange: -5,
          },
        }),
      };

      const actions = await planActions(context);
      
      const predictiveAction = actions.find(a => a.target === 'predictive');
      expect(predictiveAction).toBeDefined();
      expect(predictiveAction?.reason).toContain('predicted');
    });

    it('should not duplicate actions', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['low_trust', 'emergence_detected'],
          anomalies: [
            {
              type: 'trust_critical',
              severity: 'high',
              value: 55,
              threshold: 50,
              description: 'Trust critical',
            },
          ],
        }),
        sensors: createMockSensorData({ avgTrust: 55 }),
      };

      const actions = await planActions(context);
      
      // Check no duplicate type+target combinations
      const seen = new Set<string>();
      for (const action of actions) {
        const key = `${action.type}:${action.target}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });

    it('should sort actions by priority', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['low_trust', 'declining_trend'],
          anomalies: [
            {
              type: 'trust_critical',
              severity: 'high',
              value: 45,
              threshold: 50,
              description: 'Critical trust',
            },
            {
              type: 'volatility',
              severity: 'medium',
              value: 15,
              threshold: 10,
              description: 'High volatility',
            },
          ],
        }),
        sensors: createMockSensorData({ avgTrust: 45 }),
      };

      const actions = await planActions(context);
      
      // First action should be critical priority
      if (actions.length > 1) {
        expect(actions[0].priority).toBe('critical');
      }
    });

    it('should limit actions per cycle', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          urgency: 'immediate',
          observations: [
            'low_trust',
            'declining_trend',
            'high_volatility',
            'critical_alerts_active',
            'many_unacknowledged_alerts',
            'high_ban_ratio',
          ],
          anomalies: [
            { type: 'trust_critical', severity: 'high', value: 40, threshold: 50, description: 'a' },
            { type: 'zscore_anomaly', severity: 'high', value: -3, threshold: -2, description: 'b' },
            { type: 'emergence_high', severity: 'high', value: 1, threshold: 0, description: 'c' },
            { type: 'rapid_decline', severity: 'medium', value: -2, threshold: -1, description: 'd' },
            { type: 'volatility', severity: 'medium', value: 20, threshold: 10, description: 'e' },
          ],
        }),
        sensors: createMockSensorData({
          avgTrust: 40,
          activeAlerts: { total: 20, critical: 10, warning: 10, unacknowledged: 15 },
        }),
      };

      const actions = await planActions(context);
      
      // Should be limited to 5 for immediate urgency
      expect(actions.length).toBeLessThanOrEqual(5);
    });

    it('should limit to 3 actions for non-immediate urgency', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          urgency: 'medium',
          observations: [
            'low_trust',
            'declining_trend',
            'emergence_detected',
            'critical_alerts_active',
          ],
        }),
        sensors: createMockSensorData({
          avgTrust: 65,
          activeAlerts: { total: 3, critical: 1, warning: 2, unacknowledged: 2 },
        }),
      };

      const actions = await planActions(context);
      
      expect(actions.length).toBeLessThanOrEqual(3);
    });

    it('should consider improving trend for ban reviews', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['improving_trend'],
        }),
        sensors: createMockSensorData({
          avgTrust: 90,
          trustTrend: {
            direction: 'improving',
            slope: 1.5,
            volatility: 2,
            recentChange: 5,
          },
          agentHealth: {
            total: 10,
            active: 9,
            banned: 1,
            restricted: 0,
            quarantined: 0,
            avgAgentTrust: 88,
          },
        }),
      };

      const actions = await planActions(context);
      
      const reviewAction = actions.find(a => a.target === 'review');
      expect(reviewAction).toBeDefined();
      expect(reviewAction?.reason).toContain('reviewing agent bans');
    });

    it('should include confidence scores on all actions', async () => {
      const context: PlanningContext = {
        analysis: createMockAnalysis({
          observations: ['low_trust', 'emergence_detected'],
        }),
        sensors: createMockSensorData({ avgTrust: 65 }),
      };

      const actions = await planActions(context);
      
      for (const action of actions) {
        expect(action.confidence).toBeGreaterThan(0);
        expect(action.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});
