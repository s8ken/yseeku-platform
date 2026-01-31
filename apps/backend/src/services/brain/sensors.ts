import { bedauService } from '../bedau.service';
import { TrustReceiptModel } from '../../models/trust-receipt.model';
import { Agent } from '../../models/agent.model';
import { Conversation } from '../../models/conversation.model';
import { alertsService } from '../alerts.service';
import { recallMany } from './memory';
import logger from '../../utils/logger';

/**
 * Comprehensive sensor data structure for the Overseer
 */
export interface SensorData {
  // Core metrics
  bedau: any;
  avgTrust: number;
  receipts: any[];

  // Trend analysis
  trustTrend: TrendData;
  trustHistory: number[];

  // Statistical context
  historicalMean: number;
  historicalStd: number;

  // Agent health
  agentHealth: AgentHealthSummary;

  // Active alerts
  activeAlerts: AlertSummary;

  // Temporal context
  timestamp: Date;
  hourOfDay: number;
  isBusinessHours: boolean;
}

export interface TrendData {
  direction: 'improving' | 'declining' | 'stable';
  slope: number;
  volatility: number;
  recentChange: number; // Change in last hour
}

export interface AgentHealthSummary {
  total: number;
  active: number;
  banned: number;
  restricted: number;
  quarantined: number;
  avgAgentTrust: number;
}

export interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  unacknowledged: number;
}

/**
 * Gather comprehensive sensor data for the Overseer brain
 */
export async function gatherSensors(tenantId: string): Promise<SensorData> {
  const timestamp = new Date();

  // 1. Core metrics (existing)
  const bedau = await bedauService.getMetrics(tenantId);
  const receipts = await TrustReceiptModel.find({ tenant_id: tenantId })
    .sort({ timestamp: -1 })
    .limit(100) // Increased for trend analysis
    .select('ciq_metrics timestamp')
    .lean();

  // 2. Calculate trust metrics with history
  const trustScores = receipts.map((r: any) => {
    const ciq = r.ciq_metrics || {};
    return ((ciq.quality || 0) + (ciq.integrity || 0) + (ciq.clarity || 0)) / 3;
  });

  const avgTrust = trustScores.length > 0
    ? Math.round(trustScores.reduce((s, v) => s + v, 0) / trustScores.length)
    : 85;

  // 3. Historical statistics
  const historicalMean = calculateMean(trustScores);
  const historicalStd = calculateStd(trustScores, historicalMean);

  // 4. Trend analysis
  const trustTrend = analyzeTrend(trustScores);

  // 5. Agent health
  const agentHealth = await gatherAgentHealth(tenantId);

  // 6. Active alerts
  const activeAlerts = await gatherAlertSummary(tenantId);

  // 7. Temporal context
  const hourOfDay = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();
  const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5;

  return {
    bedau,
    avgTrust,
    receipts: receipts.slice(0, 50), // Return recent 50 for context
    trustTrend,
    trustHistory: trustScores.slice(0, 20),
    historicalMean,
    historicalStd,
    agentHealth,
    activeAlerts,
    timestamp,
    hourOfDay,
    isBusinessHours,
  };
}

/**
 * Gather agent health summary
 */
async function gatherAgentHealth(tenantId: string): Promise<AgentHealthSummary> {
  try {
    // Add tenant filtering when agent model supports it
    const query: any = {};
    if (tenantId) {
      query.tenantId = tenantId;
    }

    const tenantAgents = await Agent.find(query).lean();

    const banned = tenantAgents.filter((a: any) => a.banStatus?.isBanned);
    const restricted = tenantAgents.filter((a: any) =>
      a.banStatus?.restrictions && a.banStatus.restrictions.length > 0 && !a.banStatus?.isBanned
    );
    const quarantined = tenantAgents.filter((a: any) =>
      a.banStatus?.severity === 'critical' && a.banStatus?.isBanned
    );

    // Calculate average agent trust from recent conversations
    let avgAgentTrust = 85; // Default baseline
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const agentIds = tenantAgents.map((a: any) => a._id);
      
      if (agentIds.length > 0) {
        const trustAggregation = await Conversation.aggregate([
          {
            $match: {
              agents: { $in: agentIds },
              lastActivity: { $gte: oneWeekAgo }
            }
          },
          { $unwind: '$messages' },
          {
            $group: {
              _id: null,
              avgTrust: { $avg: '$messages.trustScore' },
              count: { $sum: 1 }
            }
          }
        ]);
        
        if (trustAggregation.length > 0 && trustAggregation[0].count > 0) {
          // Convert 0-5 scale to 0-100 scale (multiply by 20)
          avgAgentTrust = Math.round(trustAggregation[0].avgTrust * 20);
        }
      }
    } catch (trustError) {
      logger.warn('Failed to calculate avg agent trust, using baseline', { error: trustError });
    }

    return {
      total: tenantAgents.length,
      active: tenantAgents.length - banned.length,
      banned: banned.length,
      restricted: restricted.length,
      quarantined: quarantined.length,
      avgAgentTrust,
    };
  } catch (error) {
    logger.warn('Failed to gather agent health', { error });
    return {
      total: 0,
      active: 0,
      banned: 0,
      restricted: 0,
      quarantined: 0,
      avgAgentTrust: 85,
    };
  }
}

/**
 * Gather alert summary
 */
async function gatherAlertSummary(tenantId: string): Promise<AlertSummary> {
  try {
    const alerts = await alertsService.list(tenantId, {
      status: 'active',
      limit: 100,
    });

    const alertList = Array.isArray(alerts) ? alerts : (alerts as any)?.data || [];

    return {
      total: alertList.length,
      critical: alertList.filter((a: any) => a.severity === 'critical').length,
      warning: alertList.filter((a: any) => a.severity === 'warning').length,
      unacknowledged: alertList.filter((a: any) => !a.acknowledged).length,
    };
  } catch (error) {
    logger.warn('Failed to gather alert summary', { error });
    return {
      total: 0,
      critical: 0,
      warning: 0,
      unacknowledged: 0,
    };
  }
}

/**
 * Analyze trend in trust scores
 */
function analyzeTrend(scores: number[]): TrendData {
  if (scores.length < 3) {
    return { direction: 'stable', slope: 0, volatility: 0, recentChange: 0 };
  }

  // Calculate slope using simple linear regression
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

  // Calculate volatility (standard deviation of differences)
  const diffs: number[] = [];
  for (let i = 1; i < recentScores.length; i++) {
    diffs.push(Math.abs(recentScores[i] - recentScores[i - 1]));
  }
  const volatility = diffs.length > 0
    ? Math.sqrt(diffs.reduce((s, d) => s + d * d, 0) / diffs.length)
    : 0;

  // Recent change (last 5 vs previous 5)
  const recent5 = recentScores.slice(0, 5);
  const prev5 = recentScores.slice(5, 10);
  const recentAvg = recent5.length > 0 ? recent5.reduce((s, v) => s + v, 0) / recent5.length : 0;
  const prevAvg = prev5.length > 0 ? prev5.reduce((s, v) => s + v, 0) / prev5.length : recentAvg;
  const recentChange = recentAvg - prevAvg;

  // Determine direction
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

/**
 * Calculate mean of array
 */
function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
function calculateStd(arr: number[], mean: number): number {
  if (arr.length < 2) return 0;
  const squaredDiffs = arr.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / arr.length);
}
