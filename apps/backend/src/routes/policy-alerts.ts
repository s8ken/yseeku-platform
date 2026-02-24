/**
 * Policy Alert WebSocket Service
 * 
 * Real-time policy violation alerts via Socket.IO using @sonate/policy
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  createViolationDetector,
  AlertChannel,
  AlertPriority,
  type ViolationAlert,
} from '@sonate/policy';
import logger from '../utils/logger';

export { AlertChannel as AlertType, AlertPriority };

export interface AlertEvent {
  id: string;
  type: string;
  timestamp: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  subject: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Policy Alert Service — broadcasts violation alerts over Socket.IO
 */
export class PolicyAlertService {
  private io: SocketIOServer;
  private detector;
  private intervalId?: NodeJS.Timeout;

  constructor(io: SocketIOServer, _server?: HTTPServer) {
    this.io = io;
    this.detector = createViolationDetector({
      channels: [AlertChannel.CONSOLE, AlertChannel.WEBSOCKET],
      priorities: { critical: true, high: true, medium: true, low: false },
    });
  }

  async start(): Promise<void> {
    logger.info('PolicyAlertService started');
  }

  async stop(): Promise<void> {
    if (this.intervalId) clearInterval(this.intervalId);
    logger.info('PolicyAlertService stopped');
  }

  /**
   * Broadcast an alert to connected clients
   */
  broadcastAlert(alert: AlertEvent): void {
    this.io.emit('policy:alert', alert);
  }

  getConnectedClientsCount(): number {
    return this.io.engine?.clientsCount ?? 0;
  }
}
