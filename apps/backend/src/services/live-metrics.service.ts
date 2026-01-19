/**
 * Live Metrics Service
 * Real-time metrics broadcasting via Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';
import { Conversation } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { AlertModel } from '../models/alert.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// Principle score cache to avoid heavy DB queries on every broadcast
interface PrincipleScoreCache {
  scores: {
    consent: number;
    inspection: number;
    validation: number;
    override: number;
    disconnect: number;
    moral: number;
  };
  lastUpdated: Date;
}

let principleCache: PrincipleScoreCache | null = null;
const PRINCIPLE_CACHE_TTL_MS = 30000; // Refresh every 30 seconds

// Metric types for real-time dashboard
export interface LiveMetrics {
  timestamp: string;
  trust: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    delta: number;
  };
  drift: {
    score: number;
    status: 'normal' | 'warning' | 'critical';
  };
  emergence: {
    level: number;
    active: boolean;
  };
  system: {
    activeAgents: number;
    activeConversations: number;
    messagesPerMinute: number;
    errorRate: number;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
  };
  principles: {
    consent: number;
    inspection: number;
    validation: number;
    override: number;
    disconnect: number;
    moral: number;
  };
}

export interface TrustEvent {
  id: string;
  timestamp: string;
  type: 'message' | 'evaluation' | 'alert' | 'drift' | 'override';
  agentId?: string;
  agentName?: string;
  trustScore?: number;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

// In-memory metrics buffer for real-time calculations
interface MetricsBuffer {
  messages: Array<{ timestamp: Date; trustScore: number }>;
  errors: Array<{ timestamp: Date }>;
  lastTrustScores: number[];
}

const metricsBuffer: MetricsBuffer = {
  messages: [],
  errors: [],
  lastTrustScores: [],
};

// Keep only last 5 minutes of data
const BUFFER_WINDOW_MS = 5 * 60 * 1000;

let io: SocketIOServer | null = null;

/**
 * Initialize live metrics with Socket.IO server
 */
export function initializeLiveMetrics(socketServer: SocketIOServer): void {
  io = socketServer;
  
  // Start periodic metrics broadcast
  setInterval(() => {
    broadcastMetrics();
  }, 3000); // Every 3 seconds
  
  // Clean old buffer data periodically
  setInterval(() => {
    cleanBuffer();
  }, 60000); // Every minute
  
  logger.info('Live metrics service initialized');
}

/**
 * Record a message event for metrics
 */
export function recordMessage(trustScore: number): void {
  metricsBuffer.messages.push({
    timestamp: new Date(),
    trustScore,
  });
  metricsBuffer.lastTrustScores.push(trustScore);
  
  // Keep only last 100 trust scores for trend calculation
  if (metricsBuffer.lastTrustScores.length > 100) {
    metricsBuffer.lastTrustScores.shift();
  }
}

/**
 * Record an error event
 */
export function recordError(): void {
  metricsBuffer.errors.push({ timestamp: new Date() });
}

/**
 * Emit a trust event to all connected clients
 */
export function emitTrustEvent(event: Omit<TrustEvent, 'id' | 'timestamp'>): void {
  if (!io) return;
  
  const fullEvent: TrustEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  
  io.emit('trust:event', fullEvent);
}

/**
 * Emit alert to specific tenant room
 */
export function emitAlert(tenantId: string, alert: {
  id: string;
  type: string;
  title: string;
  severity: string;
  timestamp: string;
}): void {
  if (!io) return;
  
  io.to(`tenant:${tenantId}`).emit('alert:new', alert);
  io.emit('alert:new', alert); // Also broadcast globally for demo
}

/**
 * Emit metrics update to specific user
 */
export function emitUserMetrics(userId: string, metrics: Partial<LiveMetrics>): void {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('metrics:update', metrics);
}

/**
 * Clean old data from buffer
 */
function cleanBuffer(): void {
  const cutoff = Date.now() - BUFFER_WINDOW_MS;
  
  metricsBuffer.messages = metricsBuffer.messages.filter(
    m => m.timestamp.getTime() > cutoff
  );
  metricsBuffer.errors = metricsBuffer.errors.filter(
    e => e.timestamp.getTime() > cutoff
  );
}

/**
 * Calculate real principle scores from recent trust receipts
 * Uses caching to avoid heavy DB queries on every broadcast
 */
async function calculatePrincipleScores(): Promise<PrincipleScoreCache['scores']> {
  const now = new Date();
  
  // Return cached values if still fresh
  if (principleCache && (now.getTime() - principleCache.lastUpdated.getTime()) < PRINCIPLE_CACHE_TTL_MS) {
    return principleCache.scores;
  }
  
  try {
    // Fetch recent trust receipts (last hour)
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const receipts = await TrustReceiptModel.find({
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 }).limit(100).lean();
    
    if (receipts.length === 0) {
      // Return baseline scores if no receipts
      const baselineScores = {
        consent: 8.5,
        inspection: 8.7,
        validation: 8.3,
        override: 9.0,
        disconnect: 8.8,
        moral: 8.6,
      };
      principleCache = { scores: baselineScores, lastUpdated: now };
      return baselineScores;
    }
    
    // Calculate scores based on CIQ metrics and receipt data
    // Map CIQ (Clarity, Integrity, Quality) to SYMBI principles
    const avgClarity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 5), 0) / receipts.length;
    const avgIntegrity = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 5), 0) / receipts.length;
    const avgQuality = receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 5), 0) / receipts.length;
    
    // Count receipts with valid proofs/signatures (inspection mandate)
    const signedReceipts = receipts.filter(r => r.signature || r.proof?.proofValue);
    const signatureRate = signedReceipts.length / receipts.length;
    
    // Calculate principle scores (scale 0-10)
    const scores = {
      // CONSENT: Based on integrity and whether system respects user decisions
      consent: Math.min(10, avgIntegrity * 1.8 + 1),
      
      // INSPECTION: Based on signature rate and clarity (transparent operations)
      inspection: Math.min(10, (signatureRate * 5) + (avgClarity * 0.9)),
      
      // CONTINUOUS_VALIDATION: Based on quality scores and validation pass rate
      validation: Math.min(10, avgQuality * 1.8 + 0.5),
      
      // ETHICAL_OVERRIDE: Based on integrity (ethical alignment)
      override: Math.min(10, avgIntegrity * 1.9 + 0.5),
      
      // RIGHT_TO_DISCONNECT: Baseline high (platform design supports this)
      disconnect: Math.min(10, 8.5 + (avgQuality - 5) * 0.1),
      
      // MORAL_RECOGNITION: Based on overall quality and integrity
      moral: Math.min(10, (avgIntegrity + avgQuality) * 0.9),
    };
    
    // Round to 1 decimal place
    const roundedScores = {
      consent: Math.round(scores.consent * 10) / 10,
      inspection: Math.round(scores.inspection * 10) / 10,
      validation: Math.round(scores.validation * 10) / 10,
      override: Math.round(scores.override * 10) / 10,
      disconnect: Math.round(scores.disconnect * 10) / 10,
      moral: Math.round(scores.moral * 10) / 10,
    };
    
    principleCache = { scores: roundedScores, lastUpdated: now };
    return roundedScores;
    
  } catch (error) {
    logger.warn('Failed to calculate principle scores from receipts, using baseline', { 
      error: getErrorMessage(error) 
    });
    
    // Return baseline on error
    return {
      consent: 8.5,
      inspection: 8.7,
      validation: 8.3,
      override: 9.0,
      disconnect: 8.8,
      moral: 8.6,
    };
  }
}

/**
 * Calculate current metrics and broadcast
 */
async function broadcastMetrics(): Promise<void> {
  if (!io) return;
  
  try {
    const metrics = await calculateLiveMetrics();
    io.emit('metrics:live', metrics);
  } catch (error) {
    logger.error('Failed to broadcast metrics', { error: getErrorMessage(error) });
  }
}

/**
 * Calculate live metrics from buffer and database
 */
async function calculateLiveMetrics(): Promise<LiveMetrics> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  const oneHourAgo = new Date(now.getTime() - 3600000);
  
  // Calculate from buffer
  const recentMessages = metricsBuffer.messages.filter(
    m => m.timestamp >= oneMinuteAgo
  );
  const messagesPerMinute = recentMessages.length;
  
  const recentErrors = metricsBuffer.errors.filter(
    e => e.timestamp >= oneMinuteAgo
  );
  const errorRate = messagesPerMinute > 0 
    ? (recentErrors.length / messagesPerMinute) * 100 
    : 0;
  
  // Calculate trust trend
  const scores = metricsBuffer.lastTrustScores;
  const currentTrust = scores.length > 0 
    ? scores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(scores.length, 10)
    : 8.5;
  const previousTrust = scores.length > 10
    ? scores.slice(-20, -10).reduce((a, b) => a + b, 0) / 10
    : currentTrust;
  
  const trustDelta = currentTrust - previousTrust;
  const trustTrend: 'up' | 'down' | 'stable' = 
    trustDelta > 0.5 ? 'up' : trustDelta < -0.5 ? 'down' : 'stable';
  
  // Fetch real-time counts from database
  const [activeAgents, activeConversations, alerts] = await Promise.all([
    Agent.countDocuments({ lastActive: { $gte: oneHourAgo } }).catch(() => 0),
    Conversation.countDocuments({ lastActivity: { $gte: oneHourAgo } }).catch(() => 0),
    AlertModel.aggregate([
      { $match: { status: 'active' } },
      { 
        $group: { 
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]).catch(() => []),
  ]);
  
  // Parse alert counts
  const alertCounts = {
    active: 0,
    critical: 0,
    warning: 0,
  };
  for (const a of alerts) {
    alertCounts.active += a.count;
    if (a._id === 'critical') alertCounts.critical = a.count;
    if (a._id === 'warning') alertCounts.warning = a.count;
  }
  
  // Calculate drift score (simulated based on trust variance)
  const trustVariance = scores.length > 1
    ? scores.reduce((sum, s) => sum + Math.pow(s - currentTrust, 2), 0) / scores.length
    : 0;
  const driftScore = Math.min(1, trustVariance / 10);
  const driftStatus: 'normal' | 'warning' | 'critical' = 
    driftScore > 0.7 ? 'critical' : driftScore > 0.4 ? 'warning' : 'normal';
  
  // Emergence level (based on system activity patterns)
  const emergenceLevel = Math.min(1, (activeAgents * 0.1 + messagesPerMinute * 0.05));
  
  // Calculate real principle scores from trust receipts
  const principleScores = await calculatePrincipleScores();
  
  return {
    timestamp: now.toISOString(),
    trust: {
      current: Math.round(currentTrust * 10) / 10,
      trend: trustTrend,
      delta: Math.round(trustDelta * 100) / 100,
    },
    drift: {
      score: Math.round(driftScore * 100) / 100,
      status: driftStatus,
    },
    emergence: {
      level: Math.round(emergenceLevel * 100) / 100,
      active: emergenceLevel > 0.3,
    },
    system: {
      activeAgents,
      activeConversations,
      messagesPerMinute,
      errorRate: Math.round(errorRate * 100) / 100,
    },
    alerts: alertCounts,
    principles: principleScores,
  };
}

/**
 * Get historical metrics for charts
 */
export async function getHistoricalMetrics(
  hours: number = 24,
  resolution: 'minute' | 'hour' = 'hour'
): Promise<Array<{
  timestamp: string;
  trustScore: number;
  driftScore: number;
  messageCount: number;
}>> {
  const now = new Date();
  const startTime = new Date(now.getTime() - hours * 3600000);
  
  try {
    // Aggregate conversations by time bucket
    const pipeline = [
      {
        $match: {
          lastActivity: { $gte: startTime },
        },
      },
      { $unwind: '$messages' },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$messages.timestamp',
              unit: resolution,
            },
          },
          avgTrust: { $avg: '$messages.trustScore' },
          trustVariance: { $stdDevPop: '$messages.trustScore' },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ];
    
    const results = await Conversation.aggregate(pipeline);
    
    return results.map(r => {
      // Calculate drift score from trust variance (normalized to 0-1)
      // Higher variance = more drift
      const variance = r.trustVariance || 0;
      const driftScore = Math.min(1, variance / 2.5); // Normalize assuming max stdDev of 2.5
      
      return {
        timestamp: r._id.toISOString(),
        trustScore: Math.round((r.avgTrust || 5) * 2 * 10) / 10, // Convert 0-5 to 0-10
        driftScore: Math.round(driftScore * 100) / 100,
        messageCount: r.messageCount,
      };
    });
  } catch (error) {
    logger.error('Failed to get historical metrics', { error: getErrorMessage(error) });
    
    // Return empty array on error - no fake data in production
    return [];
  }
}

export const liveMetricsService = {
  initialize: initializeLiveMetrics,
  recordMessage,
  recordError,
  emitTrustEvent,
  emitAlert,
  emitUserMetrics,
  getHistoricalMetrics,
};
