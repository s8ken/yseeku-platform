/**
 * Agent Metrics for SONATE Platform
 */
import { AgentObservabilityData } from '../types';
/**
 * Agent orchestration metrics collector
 */
export declare class AgentMetrics {
    private meter;
    private agentTaskCounter;
    private agentErrorCounter;
    private agentUptimeGauge;
    private agentLastActivityGauge;
    private agentStatusGauge;
    private agentTaskDurationHistogram;
    private agentStatusChangesCounter;
    private agentStartTimes;
    private agentStatuses;
    /**
     * Record agent activity
     */
    recordAgentActivity(data: AgentObservabilityData): void;
    /**
     * Record task execution duration
     */
    recordTaskDuration(agentId: string, agentType: string, duration: number, tenant?: string): void;
    /**
     * Register a new agent
     */
    registerAgent(agentId: string, agentType: string, tenant?: string): void;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string, agentType: string, tenant?: string): void;
    /**
     * Update agent status
     */
    private updateAgentStatus;
    /**
     * Update last activity timestamp
     */
    private updateLastActivity;
    /**
     * Setup observable gauges
     */
    setupObservableGauges(): void;
    /**
     * Get the meter for custom agent metrics
     */
    getMeter(): import("@opentelemetry/api").Meter;
}
