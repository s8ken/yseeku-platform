/**
 * Policy Events WebSocket Service
 * 
 * Real-time event streaming for policy violations, overrides, and metrics
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { ViolationAlert } from './violation-alerter';

/**
 * Event Types
 */
export enum PolicyEventType {
  VIOLATION_DETECTED = 'violation_detected',
  VIOLATION_ACKNOWLEDGED = 'violation_acknowledged',
  OVERRIDE_CREATED = 'override_created',
  OVERRIDE_REVOKED = 'override_revoked',
  METRICS_UPDATE = 'metrics_update',
  POLICY_EVALUATION = 'policy_evaluation',
  SYSTEM_ALERT = 'system_alert',
}

/**
 * Policy Event
 */
export interface PolicyEvent {
  id: string;
  type: PolicyEventType;
  timestamp: string;
  agentDid?: string;
  receiptId?: string;
  severity?: 'info' | 'warning' | 'critical';
  data: Record<string, any>;
}

/**
 * Client Subscription
 */
interface ClientSubscription {
  agentDids: Set<string>;
  eventTypes: Set<PolicyEventType>;
  lastHeartbeat: number;
}

/**
 * Policy Events Service
 */
export class PolicyEventsService {
  private io: SocketIOServer;
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private eventHistory: PolicyEvent[] = [];
  private readonly maxHistorySize = 5000;
  private heartbeatIntervalMs = 30000; // 30 seconds
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketHandlers();
    this.startHeartbeat();
  }

  /**
   * Setup Socket.IO handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[PolicyEvents] Client connected: ${socket.id}`);

      // Subscribe
      socket.on('subscribe', (data: { agentDids: string[]; eventTypes: string[] }) => {
        this.handleSubscribe(socket, data);
      });

      // Unsubscribe
      socket.on('unsubscribe', (data: { agentDids: string[] }) => {
        this.handleUnsubscribe(socket, data);
      });

      // Request history
      socket.on('request_history', (data: { limit: number }) => {
        this.handleHistoryRequest(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.subscriptions.delete(socket.id);
        console.log(`[PolicyEvents] Client disconnected: ${socket.id}`);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`[PolicyEvents] Socket error: ${socket.id}`, error);
      });
    });
  }

  /**
   * Handle subscription
   */
  private handleSubscribe(
    socket: Socket,
    data: { agentDids: string[]; eventTypes: string[] }
  ): void {
    const subscription: ClientSubscription = {
      agentDids: new Set(data.agentDids),
      eventTypes: new Set(data.eventTypes as PolicyEventType[]),
      lastHeartbeat: Date.now(),
    };

    this.subscriptions.set(socket.id, subscription);

    socket.emit('subscribed', {
      agentDids: data.agentDids,
      eventTypes: data.eventTypes,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[PolicyEvents] Subscribed: ${socket.id} -> ${data.agentDids.length} agents, ${data.eventTypes.length} types`
    );
  }

  /**
   * Handle unsubscribe
   */
  private handleUnsubscribe(socket: Socket, data: { agentDids: string[] }): void {
    const subscription = this.subscriptions.get(socket.id);

    if (subscription) {
      data.agentDids.forEach(agentDid => subscription.agentDids.delete(agentDid));
    }
  }

  /**
   * Handle history request
   */
  private handleHistoryRequest(
    socket: Socket,
    data: { limit: number }
  ): void {
    const limit = Math.min(data.limit || 100, this.maxHistorySize);
    const history = this.eventHistory.slice(-limit);

    socket.emit('history', {
      total: this.eventHistory.length,
      returned: history.length,
      events: history,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit policy event
   */
  emitEvent(event: Omit<PolicyEvent, 'id' | 'timestamp'>): void {
    const fullEvent: PolicyEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    // Store in history
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Broadcast to subscribed clients
    this.io.sockets.sockets.forEach((socket: Socket) => {
      const subscription = this.subscriptions.get(socket.id);

      if (!subscription) return;

      // Check if client is subscribed to this event type
      if (!subscription.eventTypes.has(fullEvent.type)) return;

      // Check if client is subscribed to this agent
      if (fullEvent.agentDid && !subscription.agentDids.has(fullEvent.agentDid)) {
        return;
      }

      socket.emit('policy_event', fullEvent);
    });

    // Also emit to specific agent room
    if (fullEvent.agentDid) {
      this.io.emit(`policy_events:${fullEvent.agentDid}`, fullEvent);
    }
  }

  /**
   * Emit violation alert
   */
  emitViolationAlert(alert: ViolationAlert): void {
    this.emitEvent({
      type: PolicyEventType.VIOLATION_DETECTED,
      severity: alert.priority === 'critical' ? 'critical' : alert.priority === 'high' ? 'warning' : 'info',
      agentDid: alert.agentDid,
      receiptId: alert.receiptId,
      data: {
        alertId: alert.id,
        violations: alert.violations,
        principlesApplied: alert.metadata.principlesApplied,
        channels: alert.channels,
      },
    });
  }

  /**
   * Emit metrics update
   */
  emitMetricsUpdate(agentDid: string, metrics: Record<string, any>): void {
    this.emitEvent({
      type: PolicyEventType.METRICS_UPDATE,
      severity: 'info',
      agentDid,
      data: metrics,
    });
  }

  /**
   * Emit system alert
   */
  emitSystemAlert(message: string, severity: 'info' | 'warning' | 'critical'): void {
    this.emitEvent({
      type: PolicyEventType.SYSTEM_ALERT,
      severity,
      data: { message },
    });
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
   * Get event statistics
   */
  getStatistics() {
    const eventCounts: Record<PolicyEventType, number> = {} as any;

    for (const type of Object.values(PolicyEventType)) {
      eventCounts[type as PolicyEventType] = this.eventHistory.filter(e => e.type === type).length;
    }

    return {
      connectedClients: this.getConnectedClientsCount(),
      totalSubscriptions: this.subscriptions.size,
      subscribedAgents: this.getSubscribedAgents().length,
      totalEvents: this.eventHistory.length,
      eventCounts,
      lastEventTime: this.eventHistory[this.eventHistory.length - 1]?.timestamp,
    };
  }

  /**
   * Start heartbeat (keep-alive)
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.io.sockets.sockets.forEach((socket: Socket) => {
        socket.emit('heartbeat', { timestamp: new Date().toISOString() });
      });

      // Update last heartbeat for all subscriptions
      this.subscriptions.forEach(sub => {
        sub.lastHeartbeat = Date.now();
      });
    }, this.heartbeatIntervalMs);
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): PolicyEvent[] {
    if (!limit) return [...this.eventHistory];
    return this.eventHistory.slice(-limit);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    await this.io.close();
    console.log('[PolicyEvents] Service shutdown complete');
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}

/**
 * Create events service
 */
export function createPolicyEventsService(httpServer: HTTPServer): PolicyEventsService {
  return new PolicyEventsService(httpServer);
}
