/**
 * TacticalCommand - Real-time monitoring and control dashboard
 *
 * Provides operational visibility into agent fleet:
 * - Agent status monitoring
 * - Workflow execution tracking
 * - Trust score aggregation
 * - Alert management
 */

import { TrustProtocol } from '@sonate/core';

import { Agent } from './agent-types-enhanced';
import { Workflow, TacticalDashboard, Alert } from './types';

export class TacticalCommand {
  private alerts: Alert[] = [];
  private trustProtocol: TrustProtocol;

  constructor() {
    this.trustProtocol = new TrustProtocol();
  }

  /**
   * Get real-time dashboard
   */
  async getDashboard(agents: Map<string, Agent>): Promise<TacticalDashboard> {
    const activeAgents = Array.from(agents.values()).filter((a) => a.status === 'active').length;

    return {
      active_agents: activeAgents,
      workflows_running: 0, // Updated by workflow engine
      trust_score_avg: 0, // Updated by trust scoring
      alerts: this.alerts.slice(-10), // Last 10 alerts
    };
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(workflow: Workflow): Promise<void> {
    if (workflow.status === 'failed') {
      this.createAlert({
        severity: 'high',
        message: `Workflow ${workflow.name} failed`,
        agent_id: workflow.steps[0]?.agent_id,
      });
    }
  }

  /**
   * Create alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const fullAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: Date.now(),
    };

    this.alerts.push(fullAlert);
    console.log(`[TacticalCommand] ALERT [${alert.severity}]: ${alert.message}`);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Monitor agent trust score
   */
  async monitorTrustScore(agentId: string, trustScore: number): Promise<void> {
    if (trustScore < 5.0) {
      this.createAlert({
        severity: 'critical',
        message: `Agent ${agentId} trust score critically low: ${trustScore}`,
        agent_id: agentId,
      });
    } else if (trustScore < 7.0) {
      this.createAlert({
        severity: 'medium',
        message: `Agent ${agentId} trust score below threshold: ${trustScore}`,
        agent_id: agentId,
      });
    }
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): Alert[] {
    return this.alerts.filter((a) => a.severity === severity);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }
}
