/**
 * Automated Incident Response System
 * 
 * Provides automated detection, classification, and response to security incidents
 * and operational anomalies with configurable escalation policies
 */

import {
  SystemError,
  SecurityError,
  PerformanceError,
  ComplianceError
} from '@sonate/core/errors';

export interface Incident {
  id: string;
  timestamp: number;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  source: string;
  affectedResources: string[];
  metadata: Record<string, any>;
  detectionMethod: 'automated' | 'manual';
  firstDetected: number;
  lastUpdated: number;
  escalationLevel: number;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: number;
}

export type IncidentType = 
  | 'security' 
  | 'performance' 
  | 'compliance' 
  | 'availability' 
  | 'data_integrity' 
  | 'unauthorized_access'
  | 'rate_limit_exceeded'
  | 'anomaly_detected';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 
  | 'detected' 
  | 'investigating' 
  | 'mitigating' 
  | 'resolved' 
  | 'closed';

export interface IncidentRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: IncidentType;
  condition: (context: IncidentContext) => boolean | Promise<boolean>;
  severity: IncidentSeverity;
  actions: IncidentAction[];
  cooldown: number; // milliseconds
  lastTriggered?: number;
}

export interface IncidentContext {
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  source: string;
  metadata: Record<string, any>;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
}

export interface IncidentAction {
  type: 'alert' | 'block' | 'throttle' | 'restart' | 'scale' | 'custom';
  config: Record<string, any>;
  execute?: (incident: Incident) => Promise<void>;
}

export interface EscalationPolicy {
  level: number;
  severity: IncidentSeverity;
  timeThreshold: number; // milliseconds
  actions: IncidentAction[];
  notify: string[]; // email addresses, webhooks, etc.
}

export interface IncidentStatistics {
  total: number;
  byType: Record<IncidentType, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  avgResolutionTime: number;
  openIncidents: number;
}

/**
 * Automated Incident Response System
 */
export class IncidentResponseSystem {
  private incidents: Map<string, Incident> = new Map();
  private rules: Map<string, IncidentRule> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy[]> = new Map();
  private incidentHistory: Incident[] = [];
  private readonly MAX_HISTORY = 10000;
  private readonly MAX_INCIDENTS = 1000;

  constructor() {
    this.initializeDefaultRules();
    this.initializeEscalationPolicies();
  }

  /**
   * Initialize default incident detection rules
   */
  private initializeDefaultRules(): void {
    // Security: Unauthorized access attempts
    this.addRule({
      id: 'unauthorized_access',
      name: 'Unauthorized Access Detection',
      description: 'Detect unauthorized access attempts',
      enabled: true,
      type: 'unauthorized_access',
      severity: 'CRITICAL',
      cooldown: 60000, // 1 minute
      condition: (ctx) => {
        return ctx.metric === 'auth_failure' && ctx.value > 5;
      },
      actions: [
        {
          type: 'block',
          config: { blockDuration: 3600000, blockSource: true }
        },
        {
          type: 'alert',
          config: { channels: ['email', 'slack'], priority: 'critical' }
        }
      ]
    });

    // Security: Rate limit exceeded
    this.addRule({
      id: 'rate_limit_exceeded',
      name: 'Rate Limit Exceeded',
      description: 'Detect rate limit violations',
      enabled: true,
      type: 'rate_limit_exceeded',
      severity: 'MEDIUM',
      cooldown: 300000, // 5 minutes
      condition: (ctx) => {
        return ctx.metric === 'rate_limit' && ctx.value > ctx.threshold;
      },
      actions: [
        {
          type: 'throttle',
          config: { throttleFactor: 0.5 }
        },
        {
          type: 'alert',
          config: { channels: ['slack'], priority: 'medium' }
        }
      ]
    });

    // Performance: High latency
    this.addRule({
      id: 'high_latency',
      name: 'High Latency Detection',
      description: 'Detect high response latency',
      enabled: true,
      type: 'performance',
      severity: 'HIGH',
      cooldown: 120000, // 2 minutes
      condition: (ctx) => {
        return ctx.metric === 'latency' && ctx.value > 5000;
      },
      actions: [
        {
          type: 'scale',
          config: { scaleUp: true, factor: 1.5 }
        },
        {
          type: 'alert',
          config: { channels: ['email'], priority: 'high' }
        }
      ]
    });

    // Availability: Service down
    this.addRule({
      id: 'service_down',
      name: 'Service Unavailable',
      description: 'Detect service unavailability',
      enabled: true,
      type: 'availability',
      severity: 'CRITICAL',
      cooldown: 30000, // 30 seconds
      condition: (ctx) => {
        return ctx.metric === 'health' && ctx.value === 0;
      },
      actions: [
        {
          type: 'restart',
          config: { maxRetries: 3 }
        },
        {
          type: 'alert',
          config: { channels: ['email', 'slack', 'sms'], priority: 'critical' }
        }
      ]
    });

    // Data integrity: Hash chain broken
    this.addRule({
      id: 'hash_chain_broken',
      name: 'Hash Chain Integrity Violation',
      description: 'Detect hash chain integrity violations',
      enabled: true,
      type: 'data_integrity',
      severity: 'CRITICAL',
      cooldown: 60000, // 1 minute
      condition: (ctx) => {
        return ctx.metric === 'hash_chain' && ctx.value === 0;
      },
      actions: [
        {
          type: 'alert',
          config: { channels: ['email', 'slack'], priority: 'critical' }
        },
        {
          type: 'custom',
          config: { action: 'quarantine_data', verify: true }
        }
      ]
    });

    // Compliance: Audit log failure
    this.addRule({
      id: 'audit_log_failure',
      name: 'Audit Log Failure',
      description: 'Detect audit logging failures',
      enabled: true,
      type: 'compliance',
      severity: 'HIGH',
      cooldown: 60000, // 1 minute
      condition: (ctx) => {
        return ctx.metric === 'audit_log' && ctx.value === 0;
      },
      actions: [
        {
          type: 'alert',
          config: { channels: ['email'], priority: 'high' }
        },
        {
          type: 'custom',
          config: { action: 'enable_fallback_logging' }
        }
      ]
    });

    // Anomaly: Unusual pattern detected
    this.addRule({
      id: 'anomaly_detected',
      name: 'Anomaly Detection',
      description: 'Detect unusual patterns in metrics',
      enabled: true,
      type: 'anomaly_detected',
      severity: 'MEDIUM',
      cooldown: 300000, // 5 minutes
      condition: async (ctx) => {
        // Simple anomaly detection using z-score
        const history = this.getMetricHistory(ctx.metric, 20);
        if (history.length < 10) return false;
        
        const mean = history.reduce((sum, v) => sum + v, 0) / history.length;
        const std = Math.sqrt(
          history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / history.length
        );
        
        const zScore = std > 0 ? (ctx.value - mean) / std : 0;
        return Math.abs(zScore) > 3; // 3 sigma anomaly
      },
      actions: [
        {
          type: 'alert',
          config: { channels: ['slack'], priority: 'medium' }
        }
      ]
    });
  }

  /**
   * Initialize escalation policies
   */
  private initializeEscalationPolicies(): void {
    // Critical incidents
    this.escalationPolicies.set('CRITICAL', [
      {
        level: 1,
        severity: 'CRITICAL',
        timeThreshold: 0,
        actions: [
          {
            type: 'alert',
            config: { channels: ['sms', 'email'], priority: 'critical' }
          }
        ],
        notify: ['oncall@company.com', 'security@company.com']
      },
      {
        level: 2,
        severity: 'CRITICAL',
        timeThreshold: 15 * 60 * 1000, // 15 minutes
        actions: [
          {
            type: 'alert',
            config: { channels: ['sms', 'email', 'slack'], priority: 'critical' }
          }
        ],
        notify: ['cto@company.com', 'ceo@company.com']
      }
    ]);

    // High severity incidents
    this.escalationPolicies.set('HIGH', [
      {
        level: 1,
        severity: 'HIGH',
        timeThreshold: 0,
        actions: [
          {
            type: 'alert',
            config: { channels: ['email', 'slack'], priority: 'high' }
          }
        ],
        notify: ['oncall@company.com']
      },
      {
        level: 2,
        severity: 'HIGH',
        timeThreshold: 30 * 60 * 1000, // 30 minutes
        actions: [
          {
            type: 'alert',
            config: { channels: ['email', 'slack'], priority: 'high' }
          }
        ],
        notify: ['team-lead@company.com', 'manager@company.com']
      }
    ]);

    // Medium severity incidents
    this.escalationPolicies.set('MEDIUM', [
      {
        level: 1,
        severity: 'MEDIUM',
        timeThreshold: 0,
        actions: [
          {
            type: 'alert',
            config: { channels: ['slack'], priority: 'medium' }
          }
        ],
        notify: ['team-lead@company.com']
      }
    ]);

    // Low severity incidents
    this.escalationPolicies.set('LOW', [
      {
        level: 1,
        severity: 'LOW',
        timeThreshold: 0,
        actions: [
          {
            type: 'alert',
            config: { channels: ['slack'], priority: 'low' }
          }
        ],
        notify: ['team@company.com']
      }
    ]);
  }

  /**
   * Add a new incident rule
   */
  addRule(rule: IncidentRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Check for incidents based on context
   */
  async checkForIncidents(context: IncidentContext): Promise<Incident[]> {
    const detectedIncidents: Incident[] = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered < rule.cooldown) {
        continue;
      }

      // Evaluate condition
      const triggered = await rule.condition(context);
      if (!triggered) continue;

      // Create incident
      const incident = await this.createIncident(rule, context);
      detectedIncidents.push(incident);

      // Update last triggered time
      rule.lastTriggered = Date.now();

      // Execute actions
      await this.executeActions(incident, rule.actions);
    }

    return detectedIncidents;
  }

  /**
   * Create a new incident
   */
  private async createIncident(
    rule: IncidentRule,
    context: IncidentContext
  ): Promise<Incident> {
    const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const incident: Incident = {
      id: incidentId,
      timestamp: Date.now(),
      type: rule.type,
      severity: rule.severity,
      status: 'detected',
      title: rule.name,
      description: `${rule.description}: ${context.metric} = ${context.value} (threshold: ${context.threshold})`,
      source: context.source,
      affectedResources: context.tenantId ? [context.tenantId] : ['system'],
      metadata: {
        ruleId: rule.id,
        context: context,
        detectionDetails: {
          metric: context.metric,
          value: context.value,
          threshold: context.threshold
        }
      },
      detectionMethod: 'automated',
      firstDetected: Date.now(),
      lastUpdated: Date.now(),
      escalationLevel: 1
    };

    // Store incident
    this.incidents.set(incidentId, incident);
    this.incidentHistory.push(incident);

    // Maintain size limits
    if (this.incidents.size > this.MAX_INCIDENTS) {
      const oldestKey = this.incidents.keys().next().value;
      this.incidents.delete(oldestKey);
    }

    if (this.incidentHistory.length > this.MAX_HISTORY) {
      this.incidentHistory.shift();
    }

    return incident;
  }

  /**
   * Execute incident response actions
   */
  private async executeActions(
    incident: Incident,
    actions: IncidentAction[]
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'alert':
            await this.executeAlert(incident, action.config);
            break;
          case 'block':
            await this.executeBlock(incident, action.config);
            break;
          case 'throttle':
            await this.executeThrottle(incident, action.config);
            break;
          case 'restart':
            await this.executeRestart(incident, action.config);
            break;
          case 'scale':
            await this.executeScale(incident, action.config);
            break;
          case 'custom':
            if (action.execute) {
              await action.execute(incident);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type} for incident ${incident.id}:`, error);
      }
    }
  }

  /**
   * Execute alert action
   */
  private async executeAlert(incident: Incident, config: Record<string, any>): Promise<void> {
    const message = `🚨 Incident Alert\n\n` +
      `Type: ${incident.type}\n` +
      `Severity: ${incident.severity}\n` +
      `Title: ${incident.title}\n` +
      `Description: ${incident.description}\n` +
      `ID: ${incident.id}\n` +
      `Time: ${new Date(incident.timestamp).toISOString()}`;

    console.log(`[ALERT] ${message}`);

    // In production, this would send to actual alerting systems
    // For now, we'll log it
    if (config.channels?.includes('email')) {
      console.log(`[EMAIL] Would send to: ${this.escalationPolicies.get(incident.severity)?.[0].notify.join(', ')}`);
    }
    if (config.channels?.includes('slack')) {
      console.log(`[SLACK] Would post to channel: ${config.channel || '#incidents'}`);
    }
    if (config.channels?.includes('sms')) {
      console.log(`[SMS] Would send to: ${this.escalationPolicies.get(incident.severity)?.[0].notify.join(', ')}`);
    }
  }

  /**
   * Execute block action
   */
  private async executeBlock(incident: Incident, config: Record<string, any>): Promise<void> {
    const { blockDuration, blockSource } = config;
    console.log(`[BLOCK] Blocking ${incident.source} for ${blockDuration}ms`);
    
    // In production, this would add to firewall, rate limiter, etc.
    // For now, we'll log it
    incident.metadata.blocked = true;
    incident.metadata.blockDuration = blockDuration;
    incident.metadata.blockedAt = Date.now();
  }

  /**
   * Execute throttle action
   */
  private async executeThrottle(incident: Incident, config: Record<string, any>): Promise<void> {
    const { throttleFactor } = config;
    console.log(`[THROTTLE] Throttling ${incident.source} by factor ${throttleFactor}`);
    
    // In production, this would adjust rate limits
    incident.metadata.throttled = true;
    incident.metadata.throttleFactor = throttleFactor;
    incident.metadata.throttledAt = Date.now();
  }

  /**
   * Execute restart action
   */
  private async executeRestart(incident: Incident, config: Record<string, any>): Promise<void> {
    const { maxRetries = 3 } = config;
    console.log(`[RESTART] Attempting to restart service (max ${maxRetries} retries)`);
    
    // In production, this would restart services
    incident.metadata.restartAttempted = true;
    incident.metadata.maxRetries = maxRetries;
  }

  /**
   * Execute scale action
   */
  private async executeScale(incident: Incident, config: Record<string, any>): Promise<void> {
    const { scaleUp, factor } = config;
    console.log(`[SCALE] ${scaleUp ? 'Scaling up' : 'Scaling down'} by factor ${factor}`);
    
    // In production, this would adjust autoscaling
    incident.metadata.scaled = true;
    incident.metadata.scaleDirection = scaleUp ? 'up' : 'down';
    incident.metadata.scaleFactor = factor;
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all open incidents
   */
  getOpenIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .filter(inc => inc.status !== 'resolved' && inc.status !== 'closed');
  }

  /**
   * Update incident status
   */
  updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    notes?: string
  ): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    incident.status = status;
    incident.lastUpdated = Date.now();

    if (notes) {
      incident.resolutionNotes = notes;
    }

    if (status === 'resolved') {
      incident.resolvedAt = Date.now();
    }
  }

  /**
   * Escalate incident
   */
  async escalateIncident(incidentId: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const policies = this.escalationPolicies.get(incident.severity);
    if (!policies) {
      console.log(`No escalation policy for severity: ${incident.severity}`);
      return;
    }

    const currentPolicy = policies[incident.escalationLevel - 1];
    const nextPolicy = policies[incident.escalationLevel];

    if (!nextPolicy) {
      console.log('Already at maximum escalation level');
      return;
    }

    // Check if time threshold has passed
    const timeSinceDetection = Date.now() - incident.firstDetected;
    if (timeSinceDetection < nextPolicy.timeThreshold) {
      console.log(`Escalation time threshold not yet reached (${timeSinceDetection}ms < ${nextPolicy.timeThreshold}ms)`);
      return;
    }

    // Escalate
    incident.escalationLevel++;
    incident.status = 'mitigating';
    incident.lastUpdated = Date.now();

    // Execute escalation actions
    await this.executeActions(incident, nextPolicy.actions);

    console.log(`Incident ${incidentId} escalated to level ${incident.escalationLevel}`);
  }

  /**
   * Get incident statistics
   */
  getStatistics(): IncidentStatistics {
    const allIncidents = Array.from(this.incidents.values());

    const byType: Record<IncidentType, number> = {
      security: 0,
      performance: 0,
      compliance: 0,
      availability: 0,
      data_integrity: 0,
      unauthorized_access: 0,
      rate_limit_exceeded: 0,
      anomaly_detected: 0
    };

    const bySeverity: Record<IncidentSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    const byStatus: Record<IncidentStatus, number> = {
      detected: 0,
      investigating: 0,
      mitigating: 0,
      resolved: 0,
      closed: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const incident of allIncidents) {
      byType[incident.type]++;
      bySeverity[incident.severity]++;
      byStatus[incident.status]++;

      if (incident.resolvedAt) {
        totalResolutionTime += incident.resolvedAt - incident.firstDetected;
        resolvedCount++;
      }
    }

    return {
      total: allIncidents.length,
      byType,
      bySeverity,
      byStatus,
      avgResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      openIncidents: allIncidents.filter(inc => 
        inc.status !== 'resolved' && inc.status !== 'closed'
      ).length
    };
  }

  /**
   * Get metric history for anomaly detection
   */
  private getMetricHistory(metric: string, count: number): number[] {
    // In production, this would query a time-series database
    // For now, we'll return empty array
    return [];
  }

  /**
   * Check for automatic escalation of all open incidents
   */
  async checkEscalations(): Promise<void> {
    const openIncidents = this.getOpenIncidents();
    
    for (const incident of openIncidents) {
      await this.escalateIncident(incident.id);
    }
  }

  /**
   * Clear old incidents
   */
  clearOldIncidents(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let cleared = 0;

    for (const [id, incident] of this.incidents) {
      if (incident.status === 'resolved' || incident.status === 'closed') {
        if ((incident.resolvedAt || incident.lastUpdated) < cutoff) {
          this.incidents.delete(id);
          cleared++;
        }
      }
    }

    return cleared;
  }
}

/**
 * Create incident response system instance
 */
export function createIncidentResponseSystem(): IncidentResponseSystem {
  return new IncidentResponseSystem();
}

/**
 * Global instance
 */
export const incidentResponseSystem = createIncidentResponseSystem();