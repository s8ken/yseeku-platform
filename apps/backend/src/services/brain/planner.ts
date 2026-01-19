import { AnalysisResult, Anomaly } from './analyzer';
import { SensorData } from './sensors';
import { recallMany, recall } from './memory';
import logger from '../../utils/logger';

export type PlannedAction = {
  type: string;
  target: string;
  reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  severity?: string;
};

export interface PlanningContext {
  analysis: AnalysisResult;
  sensors: SensorData;
  recommendations?: ActionRecommendation[];
  recentActions?: RecentAction[];
}

interface ActionRecommendation {
  actionType: string;
  recommendation: 'increase' | 'decrease' | 'maintain';
  confidence: number;
  reason: string;
}

interface RecentAction {
  type: string;
  success: boolean;
  impact: number;
  timestamp: Date;
}

/**
 * Plan actions based on comprehensive analysis and historical learning
 */
export async function planActions(context: PlanningContext): Promise<PlannedAction[]> {
  const actions: PlannedAction[] = [];
  const { analysis, sensors, recommendations = [] } = context;

  // Build recommendation lookup
  const recLookup = new Map(recommendations.map(r => [r.actionType, r]));

  // 1. Handle critical anomalies first
  for (const anomaly of analysis.anomalies) {
    const action = planForAnomaly(anomaly, recLookup);
    if (action && !isDuplicateAction(actions, action)) {
      actions.push(action);
    }
  }

  // 2. Handle observations
  for (const observation of analysis.observations) {
    const action = planForObservation(observation, analysis, sensors, recLookup);
    if (action && !isDuplicateAction(actions, action)) {
      actions.push(action);
    }
  }

  // 3. Proactive actions based on trends
  const proactiveActions = planProactiveActions(analysis, sensors, recLookup);
  for (const action of proactiveActions) {
    if (!isDuplicateAction(actions, action)) {
      actions.push(action);
    }
  }

  // 4. Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 5. Limit total actions per cycle (prevent action storm)
  const maxActions = analysis.urgency === 'immediate' ? 5 : 3;
  return actions.slice(0, maxActions);
}

/**
 * Plan action for a specific anomaly
 */
function planForAnomaly(
  anomaly: Anomaly,
  recLookup: Map<string, ActionRecommendation>
): PlannedAction | null {
  switch (anomaly.type) {
    case 'trust_critical':
      return {
        type: 'alert',
        target: 'system',
        reason: `Critical trust level: ${anomaly.description}`,
        priority: 'critical',
        confidence: 0.95,
      };

    case 'zscore_anomaly':
      return {
        type: 'alert',
        target: 'system',
        reason: `Statistical anomaly detected: ${anomaly.description}`,
        priority: 'high',
        confidence: 0.85,
      };

    case 'emergence_high':
      // Check if we should adjust threshold based on recommendations
      const thresholdRec = recLookup.get('adjust_threshold');
      if (thresholdRec?.recommendation !== 'decrease') {
        return {
          type: 'adjust_threshold',
          target: 'trust',
          reason: `High emergence requires stricter thresholds: ${anomaly.description}`,
          priority: 'high',
          confidence: 0.8,
        };
      }
      return {
        type: 'alert',
        target: 'system',
        reason: anomaly.description,
        priority: 'high',
        confidence: 0.9,
      };

    case 'rapid_decline':
      return {
        type: 'alert',
        target: 'system',
        reason: `Rapid trust decline detected: ${anomaly.description}`,
        priority: 'high',
        confidence: 0.85,
      };

    case 'volatility':
      return {
        type: 'alert',
        target: 'monitoring',
        reason: `High volatility in trust scores: ${anomaly.description}`,
        priority: 'medium',
        confidence: 0.7,
      };

    default:
      return null;
  }
}

/**
 * Plan action for a specific observation
 */
function planForObservation(
  observation: string,
  analysis: AnalysisResult,
  sensors: SensorData,
  recLookup: Map<string, ActionRecommendation>
): PlannedAction | null {
  // Skip if already handled by anomaly
  const anomalyHandled = [
    'critical_trust_level', 'statistical_anomaly', 'high_emergence_detected',
    'rapid_decline', 'high_volatility'
  ];
  if (anomalyHandled.includes(observation)) {
    return null;
  }

  switch (observation) {
    case 'low_trust':
      // Only adjust if recommendations don't say to decrease this action
      const adjustRec = recLookup.get('adjust_threshold');
      if (adjustRec?.recommendation === 'decrease') {
        logger.info('Skipping adjust_threshold due to low effectiveness');
        return null;
      }
      return {
        type: 'adjust_threshold',
        target: 'trust',
        reason: 'Trust below acceptable threshold',
        priority: 'medium',
        confidence: adjustRec?.confidence || 0.7,
      };

    case 'emergence_detected':
      return {
        type: 'alert',
        target: 'system',
        reason: 'Weak emergence pattern detected in system behavior',
        priority: 'medium',
        confidence: 0.75,
      };

    case 'declining_trend':
      return {
        type: 'alert',
        target: 'monitoring',
        reason: 'Trust trend is declining - monitoring recommended',
        priority: 'low',
        confidence: 0.65,
      };

    case 'critical_alerts_active':
      return {
        type: 'alert',
        target: 'escalation',
        reason: `${sensors.activeAlerts.critical} critical alerts require attention`,
        priority: 'high',
        confidence: 0.9,
      };

    case 'many_unacknowledged_alerts':
      return {
        type: 'alert',
        target: 'operators',
        reason: `${sensors.activeAlerts.unacknowledged} alerts pending acknowledgment`,
        priority: 'medium',
        confidence: 0.8,
      };

    case 'high_ban_ratio':
      return {
        type: 'alert',
        target: 'system',
        reason: 'High ratio of banned agents - review agent policies',
        priority: 'medium',
        confidence: 0.7,
      };

    default:
      return null;
  }
}

/**
 * Plan proactive actions based on predictions
 */
function planProactiveActions(
  analysis: AnalysisResult,
  sensors: SensorData,
  recLookup: Map<string, ActionRecommendation>
): PlannedAction[] {
  const actions: PlannedAction[] = [];

  // If trend is declining and we're approaching a threshold
  if (
    sensors.trustTrend.direction === 'declining' &&
    sensors.avgTrust < 80 &&
    sensors.avgTrust > 65
  ) {
    // Predict when we'll hit critical
    const predictedCyclesUntilCritical = sensors.trustTrend.slope !== 0
      ? Math.abs((sensors.avgTrust - 60) / sensors.trustTrend.slope)
      : Infinity;

    if (predictedCyclesUntilCritical < 5) {
      actions.push({
        type: 'alert',
        target: 'predictive',
        reason: `Trust predicted to reach critical in ~${Math.round(predictedCyclesUntilCritical)} cycles`,
        priority: 'medium',
        confidence: Math.min(0.8, 0.5 + (1 / predictedCyclesUntilCritical) * 0.3),
      });
    }
  }

  // If improving trend, consider relaxing restrictions
  if (
    sensors.trustTrend.direction === 'improving' &&
    sensors.avgTrust > 85 &&
    sensors.agentHealth.banned > 0
  ) {
    const unbanRec = recLookup.get('unban_agent');
    if (unbanRec?.recommendation !== 'decrease') {
      actions.push({
        type: 'alert',
        target: 'review',
        reason: 'Trust improving - consider reviewing agent bans',
        priority: 'low',
        confidence: 0.6,
      });
    }
  }

  return actions;
}

/**
 * Check if action is duplicate
 */
function isDuplicateAction(actions: PlannedAction[], newAction: PlannedAction): boolean {
  return actions.some(a => a.type === newAction.type && a.target === newAction.target);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use planActions with full PlanningContext instead
 */
export function planActionsLegacy(analysis: { status: string; observations: string[] }): PlannedAction[] {
  const actions: PlannedAction[] = [];
  if (analysis.observations.includes('emergence_detected')) {
    actions.push({ type: 'alert', target: 'system', reason: 'emergence_detected', priority: 'medium', confidence: 0.7 });
  }
  if (analysis.observations.includes('low_trust')) {
    actions.push({ type: 'adjust_threshold', target: 'trust', reason: 'low_trust', priority: 'medium', confidence: 0.7 });
  }
  return actions;
}
