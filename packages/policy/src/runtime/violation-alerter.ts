/**
 * Policy Violation Detector & Alert Manager
 * 
 * Real-time violation detection with multi-channel alerting
 * Supports: Console, Email, Slack, WebSocket, In-app notifications
 */

import type { TrustReceipt } from '@sonate/schemas';
import type { PolicyEvaluationResult, PolicyViolation } from '../types';

/**
 * Alert Channel Types
 */
export enum AlertChannel {
  CONSOLE = 'console',
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  WEBSOCKET = 'websocket',
  IN_APP = 'in_app',
}

/**
 * Alert Priority Levels
 */
export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Violation Alert
 */
export interface ViolationAlert {
  id: string;
  receiptId: string;
  agentDid: string;
  timestamp: string;
  violations: PolicyViolation[];
  priority: AlertPriority;
  channels: AlertChannel[];
  metadata: {
    responseLength?: number;
    modelName?: string;
    provider?: string;
    principlesApplied: string[];
  };
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

/**
 * Alert Configuration
 */
export interface AlertConfig {
  channels: AlertChannel[];
  priorities: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  throttleMs?: number; // Prevent alert spam for same agent
  retryAttempts?: number;
}

/**
 * Policy Violation Detector
 */
export class PolicyViolationDetector {
  private alerts: Map<string, ViolationAlert> = new Map();
  private alertHistory: ViolationAlert[] = [];
  private readonly maxAlerts = 10000;
  private config: AlertConfig;
  private lastAlertTime: Map<string, number> = new Map();

  constructor(config?: Partial<AlertConfig>) {
    this.config = {
      channels: [AlertChannel.CONSOLE, AlertChannel.WEBSOCKET],
      priorities: {
        critical: true,
        high: true,
        medium: true,
        low: false,
      },
      throttleMs: 1000, // 1 second per agent
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Detect violations and create alerts
   */
  detectViolations(
    receipt: TrustReceipt,
    evaluation: PolicyEvaluationResult
  ): ViolationAlert | null {
    if (evaluation.violations.length === 0) {
      return null; // No violations
    }

    // Check throttle
    const agentDid = receipt.agent_did;
    const lastAlert = this.lastAlertTime.get(agentDid) || 0;
    if (Date.now() - lastAlert < (this.config.throttleMs || 1000)) {
      return null; // Throttled
    }

    // Determine priority
    const priority = this.determinePriority(evaluation.violations);

    // Check if should alert based on priority
    if (!this.config.priorities[priority]) {
      return null; // Priority not configured to alert
    }

    // Create alert
    const alert: ViolationAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receiptId: receipt.id,
      agentDid,
      timestamp: new Date().toISOString(),
      violations: evaluation.violations,
      priority,
      channels: this.getChannelsForPriority(priority),
      metadata: {
        responseLength: receipt.interaction?.response?.length,
        modelName: receipt.interaction?.model,
        provider: receipt.interaction?.provider,
        principlesApplied: evaluation.metadata?.principlesApplied || [],
      },
      acknowledged: false,
    };

    // Store alert
    this.storeAlert(alert);

    // Update throttle
    this.lastAlertTime.set(agentDid, Date.now());

    return alert;
  }

  /**
   * Determine alert priority from violations
   */
  private determinePriority(violations: PolicyViolation[]): AlertPriority {
    const severityMap = {
      critical: AlertPriority.CRITICAL,
      high: AlertPriority.HIGH,
      medium: AlertPriority.MEDIUM,
      low: AlertPriority.LOW,
    };

    // Find highest severity
    const highestSeverity = violations
      .map(v => v.severity)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a as keyof typeof order] - order[b as keyof typeof order];
      })[0];

    return severityMap[highestSeverity as keyof typeof severityMap] || AlertPriority.MEDIUM;
  }

  /**
   * Get alert channels for priority
   */
  private getChannelsForPriority(priority: AlertPriority): AlertChannel[] {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return [
          AlertChannel.CONSOLE,
          AlertChannel.WEBSOCKET,
          AlertChannel.WEBHOOK,
          AlertChannel.EMAIL,
        ];
      case AlertPriority.HIGH:
        return [AlertChannel.CONSOLE, AlertChannel.WEBSOCKET, AlertChannel.WEBHOOK];
      case AlertPriority.MEDIUM:
        return [AlertChannel.WEBSOCKET, AlertChannel.IN_APP];
      default:
        return [AlertChannel.IN_APP];
    }
  }

  /**
   * Store alert in history
   */
  private storeAlert(alert: ViolationAlert): void {
    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Trim history if too large
    if (this.alertHistory.length > this.maxAlerts) {
      const removed = this.alertHistory.splice(0, Math.floor(this.maxAlerts * 0.1));
      removed.forEach(a => this.alerts.delete(a.id));
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    return true;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): ViolationAlert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all unacknowledged alerts
   */
  getUnacknowledgedAlerts(): ViolationAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.acknowledged);
  }

  /**
   * Get alerts for agent
   */
  getAlertsForAgent(agentDid: string, limit: number = 50): ViolationAlert[] {
    return this.alertHistory
      .filter(a => a.agentDid === agentDid)
      .slice(-limit);
  }

  /**
   * Get alerts by priority
   */
  getAlertsByPriority(priority: AlertPriority, limit: number = 50): ViolationAlert[] {
    return this.alertHistory
      .filter(a => a.priority === priority)
      .slice(-limit);
  }

  /**
   * Get alert statistics
   */
  getStatistics() {
    const alerts = Array.from(this.alerts.values());
    const acknowledged = alerts.filter(a => a.acknowledged).length;
    const unacknowledged = alerts.length - acknowledged;

    const byPriority = {
      [AlertPriority.CRITICAL]: 0,
      [AlertPriority.HIGH]: 0,
      [AlertPriority.MEDIUM]: 0,
      [AlertPriority.LOW]: 0,
    };

    const byAgent: Record<string, number> = {};

    for (const alert of alerts) {
      byPriority[alert.priority]++;
      byAgent[alert.agentDid] = (byAgent[alert.agentDid] || 0) + 1;
    }

    return {
      total: alerts.length,
      acknowledged,
      unacknowledged,
      byPriority,
      byAgent,
      topViolatingAgent: Object.entries(byAgent).sort((a, b) => b[1] - a[1])[0]?.[0],
      topViolatingCount: Object.values(byAgent).sort((a, b) => b - a)[0] || 0,
    };
  }

  /**
   * Clear alerts older than N days
   */
  clearOldAlerts(daysBefore: number): number {
    const cutoffTime = Date.now() - daysBefore * 24 * 60 * 60 * 1000;
    const initialLength = this.alertHistory.length;

    this.alertHistory = this.alertHistory.filter(a => {
      const alertTime = new Date(a.timestamp).getTime();
      if (alertTime < cutoffTime) {
        this.alerts.delete(a.id);
        return false;
      }
      return true;
    });

    return initialLength - this.alertHistory.length;
  }

  /**
   * Export alerts as JSON
   */
  exportAsJSON(options?: { agentDid?: string; priority?: AlertPriority }): string {
    let alerts = this.alertHistory;

    if (options?.agentDid) {
      alerts = alerts.filter(a => a.agentDid === options.agentDid);
    }

    if (options?.priority) {
      alerts = alerts.filter(a => a.priority === options.priority);
    }

    return JSON.stringify(alerts, null, 2);
  }

  /**
   * Export alerts as CSV
   */
  exportAsCSV(): string {
    const headers = [
      'Alert ID',
      'Receipt ID',
      'Agent DID',
      'Timestamp',
      'Priority',
      'Violation Count',
      'Top Violation',
      'Acknowledged',
      'Acknowledged By',
    ];

    const rows = this.alertHistory.map(a => [
      a.id,
      a.receiptId,
      a.agentDid,
      a.timestamp,
      a.priority,
      a.violations.length,
      a.violations[0]?.ruleId || 'N/A',
      a.acknowledged ? 'Yes' : 'No',
      a.acknowledgedBy || '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  /**
   * Get total alert count
   */
  getAlertCount(): number {
    return this.alertHistory.length;
  }

  /**
   * Clear all alerts (use carefully!)
   */
  clear(): void {
    this.alerts.clear();
    this.alertHistory = [];
    this.lastAlertTime.clear();
  }
}

/**
 * Create detector with default config
 */
export function createViolationDetector(config?: Partial<AlertConfig>): PolicyViolationDetector {
  return new PolicyViolationDetector(config);
}
