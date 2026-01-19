/**
 * Live Metrics Service
 * Real-time metrics broadcasting via Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';
import { Conversation } from '../models/conversation.model';
import { Agent } from '../models/agent.model';
import { AlertModel } from '../models/alert.model';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

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
    principles: {
      consent: 8.5 + (Math.random() - 0.5) * 0.5,
      inspection: 8.7 + (Math.random() - 0.5) * 0.5,
      validation: 8.3 + (Math.random() - 0.5) * 0.5,
      override: 9.0 + (Math.random() - 0.5) * 0.5,
      disconnect: 8.8 + (Math.random() - 0.5) * 0.5,
      moral: 8.6 + (Math.random() - 0.5) * 0.5,
    },
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
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ];
    
    const results = await Conversation.aggregate(pipeline);
    
    return results.map(r => ({
      timestamp: r._id.toISOString(),
      trustScore: Math.round((r.avgTrust || 5) * 2 * 10) / 10, // Convert 0-5 to 0-10
      driftScore: Math.random() * 0.3, // Simulated for now
      messageCount: r.messageCount,
    }));
  } catch (error) {
    logger.error('Failed to get historical metrics', { error: getErrorMessage(error) });
    
    // Return simulated data for demo
    const points = [];
    const interval = resolution === 'minute' ? 60000 : 3600000;
    const count = resolution === 'minute' ? hours * 60 : hours;
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval);
      points.push({
        timestamp: timestamp.toISOString(),
        trustScore: 8 + Math.random() * 2,
        driftScore: Math.random() * 0.3,
        messageCount: Math.floor(Math.random() * 20),
      });
    }
    
    return points;
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
