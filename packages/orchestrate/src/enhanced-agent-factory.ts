/**
 * Enhanced Agent Factory - SYMBI-Symphony Integration
 * 
 * This enhanced agent factory combines SYMBI-Symphony's proven agent management
 * with Yseeku-Platform's modular architecture, providing enterprise-grade
 * agent orchestration capabilities.
 */

import crypto from 'crypto';
import { TrustProtocol } from '@sonate/core';
import { DIDVCManager } from './did-vc-manager';
import { Logger } from './observability/logger';

export interface AgentCapability {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
}

export interface AgentPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  requiredConfig: string[];
  trustLevel: 'low' | 'medium' | 'high' | 'critical';
  maxConcurrentTasks: number;
  timeoutMs: number;
  metadata: Record<string, any>;
}

export interface AgentType {
  id: string;
  name: string;
  description: string;
  category: 'production' | 'research' | 'support' | 'security';
  defaultCapabilities: AgentCapability[];
  defaultPermissions: AgentPermission[];
  requiredConfig: string[];
  trustArticles: string[];
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  did: string;
  credentials: any[];
  status: 'active' | 'inactive' | 'suspended' | 'error';
  capabilities: AgentCapability[];
  permissions: AgentPermission[];
  trustLevel: string;
  config: AgentConfig;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  performance: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    uptime: number;
  };
}

export interface AgentTemplate {
  type: AgentType;
  defaultCapabilities: AgentCapability[];
  defaultPermissions: AgentPermission[];
  requiredConfig: string[];
  description: string;
  trustArticles: string[];
}

/**
 * Enhanced Agent Factory
 * 
 * Integrates SYMBI-Symphony's agent factory with Yseeku-Platform
 * enterprise features and trust framework
 */
export class EnhancedAgentFactory {
  private templates: Map<string, AgentTemplate> = new Map();
  private agents: Map<string, Agent> = new Map();
  private didManager: DIDVCManager;
  private trustProtocol: TrustProtocol;
  private logger: Logger;

  constructor() {
    this.didManager = new DIDVCManager();
    this.trustProtocol = new TrustProtocol();
    this.logger = new Logger('AgentFactory');
    this.initializeTemplates();
  }

  /**
   * Initialize agent templates from SYMBI-Symphony
   */
  private initializeTemplates(): void {
    // Repository Manager Agent
    this.templates.set('repository_manager', {
      type: {
        id: 'repository_manager',
        name: 'Repository Manager',
        description: 'Manages Git repositories, handles code reviews, merges, and repository maintenance',
        category: 'production',
        defaultCapabilities: [],
        defaultPermissions: [],
        requiredConfig: ['repository_url', 'access_token'],
        trustArticles: ['code_integrity', 'peer_review', 'version_control']
      },
      defaultCapabilities: [
        { name: 'git_operations', version: '1.0.0', description: 'Git clone, pull, push, merge operations', enabled: true },
        { name: 'code_analysis', version: '1.0.0', description: 'Static code analysis and quality checks', enabled: true },
        { name: 'branch_management', version: '1.0.0', description: 'Create, delete, and manage branches', enabled: true },
        { name: 'pull_request_review', version: '1.0.0', description: 'Review and approve pull requests', enabled: true },
        { name: 'issue_management', version: '1.0.0', description: 'Create and manage GitHub issues', enabled: true }
      ],
      defaultPermissions: [
        { resource: 'repository', actions: ['read', 'write', 'admin'] },
        { resource: 'pull_requests', actions: ['read', 'write', 'review', 'merge'] },
        { resource: 'issues', actions: ['read', 'write', 'close'] },
        { resource: 'branches', actions: ['read', 'write', 'delete'] },
        { resource: 'webhooks', actions: ['read', 'write'] }
      ],
      requiredConfig: ['repository_url', 'access_token'],
      description: 'Manages Git repositories and code workflows',
      trustArticles: ['code_integrity', 'peer_review', 'version_control']
    });

    // Website Manager Agent
    this.templates.set('website_manager', {
      type: {
        id: 'website_manager',
        name: 'Website Manager',
        description: 'Manages website deployments, monitoring, and content updates',
        category: 'production',
        defaultCapabilities: [],
        defaultPermissions: [],
        requiredConfig: ['website_url', 'deployment_platform', 'access_key'],
        trustArticles: ['content_integrity', 'performance_monitoring', 'user_experience']
      },
      defaultCapabilities: [
        { name: 'deployment', version: '1.0.0', description: 'Deploy websites to various platforms', enabled: true },
        { name: 'content_management', version: '1.0.0', description: 'Update website content and assets', enabled: true },
        { name: 'performance_monitoring', version: '1.0.0', description: 'Monitor website performance and uptime', enabled: true },
        { name: 'seo_optimization', version: '1.0.0', description: 'SEO analysis and optimization', enabled: true },
        { name: 'analytics_reporting', version: '1.0.0', description: 'Generate website analytics reports', enabled: true }
      ],
      defaultPermissions: [
        { resource: 'website', actions: ['read', 'write', 'deploy'] },
        { resource: 'content', actions: ['read', 'write', 'publish'] },
        { resource: 'analytics', actions: ['read'] },
        { resource: 'cdn', actions: ['read', 'write', 'purge'] }
      ],
      requiredConfig: ['website_url', 'deployment_platform', 'access_key'],
      description: 'Manages website deployments and operations',
      trustArticles: ['content_integrity', 'performance_monitoring', 'user_experience']
    });

    // Research Assistant Agent
    this.templates.set('research_assistant', {
      type: {
        id: 'research_assistant',
        name: 'Research Assistant',
        description: 'Conducts research, analyzes data, and generates reports',
        category: 'research',
        defaultCapabilities: [],
        defaultPermissions: [],
        requiredConfig: ['research_domain', 'data_sources'],
        trustArticles: ['academic_integrity', 'data_privacy', 'intellectual_honesty']
      },
      defaultCapabilities: [
        { name: 'literature_review', version: '1.0.0', description: 'Conduct comprehensive literature reviews', enabled: true },
        { name: 'data_analysis', version: '1.0.0', description: 'Analyze research data and generate insights', enabled: true },
        { name: 'report_generation', version: '1.0.0', description: 'Generate structured research reports', enabled: true },
        { name: 'citation_management', version: '1.0.0', description: 'Manage citations and references', enabled: true },
        { name: 'experiment_design', version: '1.0.0', description: 'Design research experiments and protocols', enabled: true }
      ],
      defaultPermissions: [
        { resource: 'research_data', actions: ['read', 'analyze'] },
        { resource: 'publications', actions: ['read', 'write'] },
        { resource: 'citations', actions: ['read', 'write'] },
        { resource: 'experiments', actions: ['read', 'write', 'execute'] }
      ],
      requiredConfig: ['research_domain', 'data_sources'],
      description: 'Assists with research and academic tasks',
      trustArticles: ['academic_integrity', 'data_privacy', 'intellectual_honesty']
    });

    // Security Monitor Agent
    this.templates.set('security_monitor', {
      type: {
        id: 'security_monitor',
        name: 'Security Monitor',
        description: 'Monitors system security, detects threats, and manages incidents',
        category: 'security',
        defaultCapabilities: [],
        defaultPermissions: [],
        requiredConfig: ['monitoring_scope', 'alert_thresholds'],
        trustArticles: ['security_first', 'privacy_protection', 'threat_detection']
      },
      defaultCapabilities: [
        { name: 'threat_detection', version: '1.0.0', description: 'Detect security threats and anomalies', enabled: true },
        { name: 'incident_response', version: '1.0.0', description: 'Coordinate security incident response', enabled: true },
        { name: 'vulnerability_scanning', version: '1.0.0', description: 'Scan for security vulnerabilities', enabled: true },
        { name: 'compliance_monitoring', version: '1.0.0', description: 'Monitor compliance with security policies', enabled: true },
        { name: 'audit_logging', version: '1.0.0', description: 'Maintain comprehensive security audit logs', enabled: true }
      ],
      defaultPermissions: [
        { resource: 'security_events', actions: ['read', 'write'] },
        { resource: 'system_logs', actions: ['read'] },
        { resource: 'alerts', actions: ['read', 'write', 'manage'] },
        { resource: 'incidents', actions: ['read', 'write', 'resolve'] }
      ],
      requiredConfig: ['monitoring_scope', 'alert_thresholds'],
      description: 'Monitors and manages system security',
      trustArticles: ['security_first', 'privacy_protection', 'threat_detection']
    });

    this.logger.info(`Initialized ${this.templates.size} agent templates`);
  }

  /**
   * Create new agent from template
   */
  async createAgent(templateId: string, config: Partial<AgentConfig>): Promise<Agent> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Agent template '${templateId}' not found`);
    }

    // Validate required configuration
    this.validateConfig(template.requiredConfig, config);

    // Generate unique agent ID
    const agentId = this.generateAgentId();
    
    // Create DID for agent
    const did = await this.didManager.createDID(agentId);

    // Issue credentials based on capabilities
    const credentials = await this.didManager.issueCredentials(
      did, 
      template.defaultCapabilities.map(cap => cap.name)
    );

    const agent: Agent = {
      id: agentId,
      name: config.name || `${template.type.name} ${agentId.slice(-8)}`,
      type: template.type,
      did,
      credentials,
      status: 'active',
      capabilities: template.defaultCapabilities,
      permissions: template.defaultPermissions,
      trustLevel: this.calculateTrustLevel(template.trustArticles),
      config: {
        id: agentId,
        name: config.name || `${template.type.name} ${agentId.slice(-8)}`,
        type: template.type,
        description: config.description || template.type.description,
        capabilities: template.defaultCapabilities,
        permissions: template.defaultPermissions,
        requiredConfig: template.requiredConfig,
        trustLevel: this.calculateTrustLevel(template.trustArticles),
        maxConcurrentTasks: config.maxConcurrentTasks || 10,
        timeoutMs: config.timeoutMs || 30000,
        metadata: config.metadata || {}
      },
      metadata: {
        templateId,
        ...config.metadata,
        trustArticles: template.trustArticles,
        createdAt: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
      performance: {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        uptime: 100
      }
    };

    // Store agent
    this.agents.set(agentId, agent);

    // Generate trust receipt for agent creation
    await this.generateTrustReceipt(agent, 'agent_creation');

    this.logger.info(`Created agent '${agent.name}' (${agentId}) from template '${templateId}'`);

    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * List agents by type
   */
  listAgentsByType(typeId: string): Agent[] {
    return this.agents.filter(agent => agent.type.id === typeId);
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<Agent> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Apply updates
    Object.assign(agent.config, updates);
    agent.updatedAt = new Date();

    // Regenerate credentials if capabilities changed
    if (updates.capabilities) {
      agent.credentials = await this.didManager.issueCredentials(
        agent.did,
        updates.capabilities.map(cap => cap.name)
      );
    }

    // Generate trust receipt for update
    await this.generateTrustReceipt(agent, 'agent_update');

    this.logger.info(`Updated agent '${agent.name}' (${agentId})`);
    return agent;
  }

  /**
   * Deactivate agent
   */
  async deactivateAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'inactive';
    agent.updatedAt = new Date();

    // Revoke credentials
    await this.didManager.revokeCredentials(agent.did, agent.credentials);

    this.logger.info(`Deactivated agent '${agent.name}' (${agentId})`);
  }

  /**
   * Get agent performance metrics
   */
  getAgentPerformance(agentId: string): any {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return {
      ...agent.performance,
      successRate: agent.performance.totalTasks > 0 
        ? agent.performance.successfulTasks / agent.performance.totalTasks 
        : 0,
      efficiency: agent.performance.averageResponseTime > 0
        ? 1000 / agent.performance.averageResponseTime
        : 0
    };
  }

  /**
   * Update agent performance metrics
   */
  updatePerformance(agentId: string, metrics: {
    tasksCompleted?: number;
    tasksSuccessful?: number;
    tasksFailed?: number;
    responseTime?: number;
  }): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return;
    }

    if (metrics.tasksCompleted !== undefined) {
      agent.performance.totalTasks += metrics.tasksCompleted;
    }
    if (metrics.tasksSuccessful !== undefined) {
      agent.performance.successfulTasks += metrics.tasksSuccessful;
    }
    if (metrics.tasksFailed !== undefined) {
      agent.performance.failedTasks += metrics.tasksFailed;
    }
    if (metrics.responseTime !== undefined) {
      const totalResponseTime = agent.performance.averageResponseTime * (agent.performance.totalTasks - metrics.tasksCompleted) + metrics.responseTime;
      agent.performance.averageResponseTime = totalResponseTime / agent.performance.totalTasks;
    }

    agent.lastActivity = new Date();
  }

  /**
   * Get available templates
   */
  getTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): AgentTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Add custom template
   */
  addTemplate(template: AgentTemplate): void {
    this.templates.set(template.type.id, template);
    this.logger.info(`Added custom template '${template.type.id}'`);
  }

  /**
   * Validate configuration against template requirements
   */
  private validateConfig(required: string[], config: Partial<AgentConfig>): void {
    const missing = required.filter(req => !config[req as keyof AgentConfig]);
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }

  /**
   * Generate unique agent ID
   */
  private generateAgentId(): string {
    return `agent_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Calculate trust level based on trust articles
   */
  private calculateTrustLevel(trustArticles: string[]): string {
    // Enhanced trust calculation based on trust articles
    const criticalArticles = ['security_first', 'privacy_protection', 'user_safety'];
    const hasCritical = trustArticles.some(article => criticalArticles.includes(article));
    
    if (hasCritical) return 'critical';
    if (trustArticles.length >= 4) return 'high';
    if (trustArticles.length >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generate trust receipt for agent operation
   */
  private async generateTrustReceipt(agent: Agent, operation: string): Promise<void> {
    // This would integrate with @sonate/core trust receipt system
    const trustReceipt = {
      agentId: agent.id,
      operation,
      timestamp: Date.now(),
      trustScore: await this.calculateAgentTrustScore(agent),
      articles: agent.metadata.trustArticles || []
    };

    // Store trust receipt (implementation depends on storage system)
    this.logger.debug(`Generated trust receipt for ${operation} on agent ${agent.id}`);
  }

  /**
   * Calculate agent trust score
   */
  private async calculateAgentTrustScore(agent: Agent): Promise<number> {
    // Integrate with @sonate/core trust protocol
    const score = this.trustProtocol.scoreInteraction({
      user_consent: true,
      ai_explanation_provided: true,
      decision_auditability: true,
      human_override_available: true,
      disconnect_option_available: true,
      moral_agency_respected: true,
      reasoning_transparency: 8,
      ethical_considerations: agent.metadata.trustArticles || [],
    });

    return score.overall;
  }

  /**
   * Verify agent credentials
   */
  async verifyAgentCredentials(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    return await this.didManager.verifyCredentials(agent.did, agent.credentials);
  }

  /**
   * Get agent health status
   */
  getAgentHealth(agentId: string): any {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { status: 'not_found', healthy: false };
    }

    const timeSinceLastActivity = Date.now() - agent.lastActivity.getTime();
    const isStale = timeSinceLastActivity > 300000; // 5 minutes

    return {
      status: agent.status,
      healthy: agent.status === 'active' && !isStale,
      lastActivity: agent.lastActivity,
      uptime: agent.performance.uptime,
      successRate: agent.performance.totalTasks > 0 
        ? agent.performance.successfulTasks / agent.performance.totalTasks 
        : 0,
      averageResponseTime: agent.performance.averageResponseTime
    };
  }

  /**
   * Archive inactive agents
   */
  async archiveInactiveAgents(maxInactiveDays: number = 30): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxInactiveDays);

    const archivedAgents: string[] = [];

    for (const [agentId, agent] of this.agents) {
      if (agent.lastActivity < cutoffDate && agent.status === 'inactive') {
        await this.deactivateAgent(agentId);
        // In production, move to archive storage
        this.agents.delete(agentId);
        archivedAgents.push(agentId);
      }
    }

    this.logger.info(`Archived ${archivedAgents.length} inactive agents`);
    return archivedAgents;
  }
}