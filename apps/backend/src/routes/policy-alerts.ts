/**
 * Policy Alert WebSocket Service
 * 
 * NOTE: This file is disabled - @sonate/policy and @sonate/monitoring packages not yet available
 * Service will be restored when packages are ready for production
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Alert types disabled - packages not available
export enum AlertType {
  POLICY_VIOLATION = 'policy_violation',
  ANOMALY_DETECTED = 'anomaly_detected',
  COHERENCE_CHANGE = 'coherence_change',
  RESONANCE_UPDATE = 'resonance_update',
  METRICS_SNAPSHOT = 'metrics_snapshot',
}

export interface AlertEvent {
  id: string;
  type: AlertType;
  timestamp: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  subject: string;
  message: string;
  data?: Record<string, any>;
}

// Stub service - restore when packages are available
export class PolicyAlertService {
  constructor(_io: SocketIOServer, _server?: HTTPServer) {}
  
  async start(): Promise<void> {
    // Disabled
  }
  
  async stop(): Promise<void> {
    // Disabled
  }
  
  getConnectedClientsCount(): number {
    return 0;
  }
}
