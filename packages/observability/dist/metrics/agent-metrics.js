"use strict";
/**
 * Agent Metrics for SONATE Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMetrics = void 0;
const api_1 = require("@opentelemetry/api");
/**
 * Agent orchestration metrics collector
 */
class AgentMetrics {
    constructor() {
        this.meter = api_1.metrics.getMeter('sonate-agent');
        this.agentTaskCounter = this.meter.createCounter('sonate_agent_tasks_total', {
            description: 'Total number of agent tasks executed',
        });
        this.agentErrorCounter = this.meter.createCounter('sonate_agent_errors_total', {
            description: 'Total number of agent errors',
        });
        this.agentUptimeGauge = this.meter.createObservableGauge('sonate_agent_uptime_seconds', {
            description: 'Agent uptime in seconds',
            unit: 's',
        });
        this.agentLastActivityGauge = this.meter.createObservableGauge('sonate_agent_last_activity_timestamp', {
            description: 'Timestamp of last agent activity',
            unit: 's',
        });
        this.agentStatusGauge = this.meter.createObservableGauge('sonate_agent_status', {
            description: 'Current agent status (1=active, 0=inactive, -1=error)',
        });
        this.agentTaskDurationHistogram = this.meter.createHistogram('sonate_agent_task_duration_ms', {
            description: 'Duration of agent task execution',
            unit: 'ms',
        });
        this.agentStatusChangesCounter = this.meter.createCounter('sonate_agent_status_changes_total', {
            description: 'Total number of agent status changes',
        });
        // Store agent start times for uptime calculation
        this.agentStartTimes = new Map();
        this.agentStatuses = new Map();
    }
    /**
     * Record agent activity
     */
    recordAgentActivity(data) {
        // Record task count
        this.agentTaskCounter.add(data.taskCount, {
            'sonate.agent.id': data.agentId,
            'sonate.agent.type': data.agentType,
            'sonate.tenant': data.tenant || 'unknown',
        });
        // Record errors
        if (data.errors > 0) {
            this.agentErrorCounter.add(data.errors, {
                'sonate.agent.id': data.agentId,
                'sonate.agent.type': data.agentType,
                'sonate.tenant': data.tenant || 'unknown',
            });
        }
        // Update last activity
        this.updateLastActivity(data.agentId, data.lastActivity);
        // Update status
        this.updateAgentStatus(data.agentId, data.status);
    }
    /**
     * Record task execution duration
     */
    recordTaskDuration(agentId, agentType, duration, tenant) {
        this.agentTaskDurationHistogram.record(duration, {
            'sonate.agent.id': agentId,
            'sonate.agent.type': agentType,
            'sonate.tenant': tenant || 'unknown',
        });
    }
    /**
     * Register a new agent
     */
    registerAgent(agentId, agentType, tenant) {
        this.agentStartTimes.set(agentId, Date.now());
        this.updateAgentStatus(agentId, 'active');
        // Record status change
        this.agentStatusChangesCounter.add(1, {
            'sonate.agent.id': agentId,
            'sonate.agent.type': agentType,
            'sonate.tenant': tenant || 'unknown',
            'sonate.agent.status_from': 'none',
            'sonate.agent.status_to': 'active',
        });
    }
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId, agentType, tenant) {
        const previousStatus = this.agentStatuses.get(agentId) || 'unknown';
        this.agentStartTimes.delete(agentId);
        this.agentStatuses.delete(agentId);
        // Record status change
        this.agentStatusChangesCounter.add(1, {
            'sonate.agent.id': agentId,
            'sonate.agent.type': agentType,
            'sonate.tenant': tenant || 'unknown',
            'sonate.agent.status_from': previousStatus,
            'sonate.agent.status_to': 'inactive',
        });
    }
    /**
     * Update agent status
     */
    updateAgentStatus(agentId, status) {
        const previousStatus = this.agentStatuses.get(agentId);
        if (previousStatus !== status) {
            this.agentStatuses.set(agentId, status);
            // Record status change
            this.agentStatusChangesCounter.add(1, {
                'sonate.agent.id': agentId,
                'sonate.agent.status_from': previousStatus || 'unknown',
                'sonate.agent.status_to': status,
            });
        }
    }
    /**
     * Update last activity timestamp
     */
    updateLastActivity(agentId, timestamp) {
        // This will be picked up by the observable gauge
    }
    /**
     * Setup observable gauges
     */
    setupObservableGauges() {
        // Uptime gauge
        this.agentUptimeGauge.addCallback((observableResult) => {
            const now = Date.now();
            this.agentStartTimes.forEach((startTime, agentId) => {
                const uptime = (now - startTime) / 1000; // Convert to seconds
                observableResult.observe(uptime, {
                    'sonate.agent.id': agentId,
                });
            });
        });
        // Last activity gauge
        this.agentLastActivityGauge.addCallback((observableResult) => {
            this.agentStatuses.forEach((_, agentId) => {
                // This would be updated by recordAgentActivity
                // For now, use current time as placeholder
                const lastActivity = Date.now() / 1000;
                observableResult.observe(lastActivity, {
                    'sonate.agent.id': agentId,
                });
            });
        });
        // Status gauge
        this.agentStatusGauge.addCallback((observableResult) => {
            this.agentStatuses.forEach((status, agentId) => {
                const statusValue = status === 'active' ? 1 : status === 'error' ? -1 : 0;
                observableResult.observe(statusValue, {
                    'sonate.agent.id': agentId,
                    'sonate.agent.status': status,
                });
            });
        });
    }
    /**
     * Get the meter for custom agent metrics
     */
    getMeter() {
        return this.meter;
    }
}
exports.AgentMetrics = AgentMetrics;
