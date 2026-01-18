/**
 * Agent Metrics for SONATE Platform
 */

import { metrics } from '@opentelemetry/api';
import { AgentObservabilityData } from '../types';

/**
 * Agent orchestration metrics collector
 */
export class AgentMetrics {
  private meter = metrics.getMeter('sonate-agent');
  
  private agentTaskCounter = this.meter.createCounter('sonate_agent_tasks_total', {
    description: 'Total number of agent tasks executed',
  });
  
  private agentErrorCounter = this.meter.createCounter('sonate_agent_errors_total', {
    description: 'Total number of agent errors',
  });
  
  private agentUptimeGauge = this.meter.createObservableGauge('sonate_agent_uptime_seconds', {
    description: 'Agent uptime in seconds',
    unit: 's',
  });
  
  private agentLastActivityGauge = this.meter.createObservableGauge('sonate_agent_last_activity_timestamp', {
    description: 'Timestamp of last agent activity',
    unit: 's',
  });
  
  private agentStatusGauge = this.meter.createObservableGauge('sonate_agent_status', {
    description: 'Current agent status (1=active, 0=inactive, -1=error)',
  });

  private agentTaskDurationHistogram = this.meter.createHistogram('sonate_agent_task_duration_ms', {
    description: 'Duration of agent task execution',
    unit: 'ms',
  });

  private agentStatusChangesCounter = this.meter.createCounter('sonate_agent_status_changes_total', {
    description: 'Total number of agent status changes',
  });

  // Store agent start times for uptime calculation
  private agentStartTimes = new Map<string, number>();
  private agentStatuses = new Map<string, string>();

  /**
   * Record agent activity
   */
  recordAgentActivity(data: AgentObservabilityData): void {
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
  recordTaskDuration(agentId: string, agentType: string, duration: number, tenant?: string): void {
    this.agentTaskDurationHistogram.record(duration, {
      'sonate.agent.id': agentId,
      'sonate.agent.type': agentType,
      'sonate.tenant': tenant || 'unknown',
    });
  }

  /**
   * Register a new agent
   */
  registerAgent(agentId: string, agentType: string, tenant?: string): void {
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
  unregisterAgent(agentId: string, agentType: string, tenant?: string): void {
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
  private updateAgentStatus(agentId: string, status: string): void {
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
  private updateLastActivity(agentId: string, timestamp: number): void {
    // This will be picked up by the observable gauge
  }

  /**
   * Setup observable gauges
   */
  setupObservableGauges(): void {
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
