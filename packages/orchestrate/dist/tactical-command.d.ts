/**
 * TacticalCommand - Real-time monitoring and control dashboard
 *
 * Provides operational visibility into agent fleet:
 * - Agent status monitoring
 * - Workflow execution tracking
 * - Trust score aggregation
 * - Alert management
 */
import { Agent } from './agent-types-enhanced';
import { Workflow, TacticalDashboard, Alert } from './types';
export declare class TacticalCommand {
    private alerts;
    private trustProtocol;
    constructor();
    /**
     * Get real-time dashboard
     */
    getDashboard(agents: Map<string, Agent>): Promise<TacticalDashboard>;
    /**
     * Update workflow status
     */
    updateWorkflowStatus(workflow: Workflow): Promise<void>;
    /**
     * Create alert
     */
    createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void;
    /**
     * Monitor agent trust score
     */
    monitorTrustScore(agentId: string, trustScore: number): Promise<void>;
    /**
     * Get alerts by severity
     */
    getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): Alert[];
    /**
     * Clear alerts
     */
    clearAlerts(): void;
}
