/**
 * Policy Alert WebSocket Service
 * 
 * Real-time WebSocket server for policy violations and metrics updates
 * Enables live dashboard monitoring and alerts
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { TrustReceipt } from '@sonate/schemas';
import { PolicyEngine } from '@sonate/policy';
import { CoherenceTracker, ResonanceMonitor, TruthDebtCalculator } from '@sonate/monitoring';
import type { PolicyEvaluationResult } from '@sonate/policy';

/**
 * Alert Event Types
 */
export enum AlertType {
  POLICY_VIOLATION = 'policy_violation',
  ANOMALY_DETECTED = 'anomaly_detected',
  COHERENCE_CHANGE = 'coherence_change',
  RESONANCE_UPDATE = 'resonance_update',
  METRICS_SNAPSHOT = 'metrics_snapshot',
}

/**
 * Alert Event
 */
export interface AlertEvent {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  agentDid: string;
  receiptId: string;
  message: string;
  data: any;
  timestamp: string;
}

/**
 * Client Subscription
 */
interface ClientSubscription {
  agentDids: Set<string>;
  alertTypes: Set<AlertType>;
}

/**
 * Policy Alert Service
 */
export class PolicyAlertService {
  private io: SocketIOServer;
  private engine: PolicyEngine;
  private coherenceTracker: CoherenceTracker;
  private resonanceMonitor: ResonanceMonitor;
  private truthDebtCalculator: TruthDebtCalculator;
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private alertHistory: AlertEvent[] = [];
  private readonly maxHistorySize = 1000;

  constructor(
    httpServer: HTTPServer,
    engine: PolicyEngine,
    coherenceTracker: CoherenceTracker,
    resonanceMonitor: ResonanceMonitor
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.engine = engine;
    this.coherenceTracker = coherenceTracker;
    this.resonanceMonitor = resonanceMonitor;
    this.truthDebtCalculator = new TruthDebtCalculator();

    this.setupSocketHandlers();
  }

  /**
   * Setup Socket.IO handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Subscribe to alerts
      socket.on('subscribe', (data: { agentDids: string[]; alertTypes: string[] }) => {
        this.handleSubscribe(socket, data);
      });

      // Unsubscribe
      socket.on('unsubscribe', (data: { agentDids: string[] }) => {
        this.handleUnsubscribe(socket, data);
      });

      // Request metrics
      socket.on('request_metrics', (data: { agentDid: string }) => {
        this.handleMetricsRequest(socket, data);
      });

      // Get alert history
      socket.on('history', (data: { limit: number }) => {
        this.handleHistoryRequest(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.subscriptions.delete(socket.id);
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(
    socket: Socket,
    data: { agentDids: string[]; alertTypes: string[] }
  ): void {
    const subscription: ClientSubscription = {
      agentDids: new Set(data.agentDids),
      alertTypes: new Set(data.alertTypes as AlertType[]),
    };

    this.subscriptions.set(socket.id, subscription);

    socket.emit('subscribed', {
      agentDids: data.agentDids,
      alertTypes: data.alertTypes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(socket: Socket, data: { agentDids: string[] }): void {
    const subscription = this.subscriptions.get(socket.id);

    if (subscription) {
      data.agentDids.forEach(agentDid => subscription.agentDids.delete(agentDid));
    }
  }

  /**
   * Handle metrics request
   */
  private handleMetricsRequest(socket: Socket, data: { agentDid: string }): void {
    const coherence = this.coherenceTracker.calculateLBC(data.agentDid);
    const resonance = this.resonanceMonitor.getAggregatedMetrics(data.agentDid);
    const history = this.coherenceTracker.getHistory(data.agentDid);

    socket.emit('metrics', {
      agentDid: data.agentDid,
      coherence,
      resonance,
      historyLength: history.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle history request
   */
  private handleHistoryRequest(socket: Socket, data: { limit: number }): void {
    const limit = Math.min(data.limit || 100, this.maxHistorySize);
    const history = this.alertHistory.slice(-limit);

    socket.emit('history', {
      total: this.alertHistory.length,
      returned: history.length,
      events: history,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Process receipt and emit alerts
   */
  async processReceipt(receipt: TrustReceipt, principleIds?: string[]): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Evaluate policy
    const evaluation = this.engine.evaluate(receipt, principleIds);

    // Check for violations
    if (!evaluation.passed) {
      const violation = evaluation.violations[0];
      const alert: AlertEvent = {
        id: alertId,
        type: AlertType.POLICY_VIOLATION,
        severity: violation.severity === 'critical' ? 'critical' : 'warning',
        agentDid: receipt.agent_did,
        receiptId: receipt.id,
        message: `Policy violation: ${violation.message}`,
        data: {
          violations: evaluation.violations,
          principles: evaluation.metadata.principlesApplied,
        },
        timestamp: new Date().toISOString(),
      };

      this.emitAlert(alert);
    }

    // Record interaction for coherence
    this.coherenceTracker.recordInteraction(receipt);

    // Check for anomalies
    const coherence = this.coherenceTracker.calculateLBC(receipt.agent_did, 10);
    if (coherence.anomalies.length > 0) {
      for (const anomaly of coherence.anomalies) {
        const alert: AlertEvent = {
          id: `${alertId}_anomaly`,
          type: AlertType.ANOMALY_DETECTED,
          severity: anomaly.severity === 'major' ? 'critical' : 'warning',
          agentDid: receipt.agent_did,
          receiptId: receipt.id,
          message: anomaly.description,
          data: anomaly,
          timestamp: new Date().toISOString(),
        };

        this.emitAlert(alert);
      }
    }

    // Update resonance
    const resonance = this.resonanceMonitor.measureResonance(receipt);
    const resonanceAlert: AlertEvent = {
      id: `${alertId}_resonance`,
      type: AlertType.RESONANCE_UPDATE,
      severity: 'info',
      agentDid: receipt.agent_did,
      receiptId: receipt.id,
      message: `Resonance updated: ${resonance.resonanceQuality}`,
      data: resonance,
      timestamp: new Date().toISOString(),
    };

    this.emitAlert(resonanceAlert);
  }

  /**
   * Emit alert to subscribed clients
   */
  private emitAlert(alert: AlertEvent): void {
    // Store in history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    // Send to subscribed clients
    this.io.sockets.sockets.forEach((socket: Socket) => {
      const subscription = this.subscriptions.get(socket.id);

      if (
        subscription &&
        subscription.agentDids.has(alert.agentDid) &&
        subscription.alertTypes.has(alert.type)
      ) {
        socket.emit('alert', alert);
      }
    });

    // Broadcast to all clients listening to this agent
    this.io.emit(`alerts:${alert.agentDid}`, alert);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): AlertEvent[] {
    if (!limit) return [...this.alertHistory];
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get metrics snapshot
   */
  getMetricsSnapshot(agentDid: string) {
    return {
      agentDid,
      coherence: this.coherenceTracker.calculateLBC(agentDid),
      resonance: this.resonanceMonitor.getAggregatedMetrics(agentDid),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  /**
   * Get subscribed agents
   */
  getSubscribedAgents(): string[] {
    const agents = new Set<string>();
    this.subscriptions.forEach(sub => {
      sub.agentDids.forEach(agentDid => agents.add(agentDid));
    });
    return Array.from(agents);
  }

  /**
   * Broadcast system message
   */
  broadcastSystemMessage(message: string, severity: 'info' | 'warning' | 'critical'): void {
    this.io.emit('system_message', {
      message,
      severity,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.io.close();
  }
}

/**
 * Create alert service
 */
export function createPolicyAlertService(
  httpServer: HTTPServer,
  engine: PolicyEngine,
  coherenceTracker: CoherenceTracker,
  resonanceMonitor: ResonanceMonitor
): PolicyAlertService {
  return new PolicyAlertService(httpServer, engine, coherenceTracker, resonanceMonitor);
}
