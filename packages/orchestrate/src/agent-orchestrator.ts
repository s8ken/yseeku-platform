/**
 * AgentOrchestrator - Main orchestration controller
 * 
 * Manages the lifecycle of AI agents in production:
 * - Registration (with DID/VC)
 * - Workflow execution
 * - Monitoring and control
 */

import { randomUUID } from 'crypto';
import { Workflow } from './types';
import { Agent, AgentCapability, AgentConfig, AgentPermission, AgentType } from './agent-types-enhanced';
import { DIDVCManager } from './did-vc-manager';
import { WorkflowEngine } from './workflow-engine';
import { TacticalCommand } from './tactical-command';
import { AuditEventType, getAuditLogger } from './security/audit';

type RegisterAgentInput = {
  id: string;
  name: string;
  capabilities: string[];
  metadata?: Record<string, any>;
  type?: AgentType;
  apiKey?: string;
  permissions?: AgentPermission[];
};

export class AgentOrchestrator {
  private didManager: DIDVCManager;
  private workflowEngine: WorkflowEngine;
  private tacticalCommand: TacticalCommand;
  private agents: Map<string, Agent> = new Map();

  constructor() {
    this.didManager = new DIDVCManager();
    this.workflowEngine = new WorkflowEngine();
    this.tacticalCommand = new TacticalCommand();
  }

  /**
   * Register a new agent with DID/VC
   * 
   * @param agent - Agent configuration
   * @returns Registered agent with DID
   */
  async registerAgent(agent: RegisterAgentInput | Omit<Agent, 'did' | 'credentials' | 'status'>): Promise<Agent> {
    const now = new Date();
    const agentType: AgentType = ('type' in agent && agent.type) ? agent.type : 'coordinator';

    const rawCapabilities = (agent as any).capabilities ?? [];
    const capabilities: AgentCapability[] = rawCapabilities.map((cap: any) => {
      if (typeof cap === 'string') {
        return { name: cap, version: '1.0.0' };
      }

      return { ...cap, version: cap.version ?? '1.0.0' };
    });

    const permissions: AgentPermission[] = ('permissions' in agent && Array.isArray(agent.permissions)) ? agent.permissions : [];
    const metadata: Record<string, any> = ('metadata' in agent && agent.metadata) ? agent.metadata : {};

    const baseConfig = ('config' in agent && agent.config) ? agent.config : undefined;
    const apiKey =
      ('apiKey' in agent && agent.apiKey) ? agent.apiKey :
      (baseConfig?.apiKey ?? randomUUID());

    const config: AgentConfig = {
      id: agent.id,
      name: agent.name,
      type: agentType,
      apiKey,
      baseUrl: baseConfig?.baseUrl,
      webhookUrl: baseConfig?.webhookUrl,
      capabilities,
      permissions,
      metadata,
    };

    const did = await this.didManager.createDID(agent.id);
    const credentials = await this.didManager.issueCredentials(did, capabilities.map(c => c.name));

    const registeredAgent: Agent = {
      id: agent.id,
      name: agent.name,
      type: agentType,
      status: 'active',
      config,
      capabilities,
      permissions,
      did,
      credentials,
      metadata,
      createdAt: ('createdAt' in agent && agent.createdAt) ? agent.createdAt : now,
      updatedAt: ('updatedAt' in agent && agent.updatedAt) ? agent.updatedAt : now,
      lastActivity: ('lastActivity' in agent && agent.lastActivity) ? agent.lastActivity : now,
      trustDeclaration: ('trustDeclaration' in agent && agent.trustDeclaration) ? agent.trustDeclaration : undefined,
      trustMetrics: ('trustMetrics' in agent && agent.trustMetrics) ? agent.trustMetrics : undefined,
      trustLevel: ('trustLevel' in agent && agent.trustLevel) ? agent.trustLevel : undefined,
      currentTask: ('currentTask' in agent && agent.currentTask) ? agent.currentTask : undefined,
    };

    this.agents.set(agent.id, registeredAgent);
    await getAuditLogger().log(
      AuditEventType.AGENT_CREATED,
      'agent.register',
      'success',
      {
        resourceType: 'agent',
        resourceId: agent.id,
        details: { agentType, capabilityCount: capabilities.length },
      }
    );
    console.log(`[Orchestrator] Registered agent: ${agent.name} (${did})`);

    return registeredAgent;
  }

  /**
   * Create and execute workflow
   * 
   * @param workflow - Workflow definition
   * @returns Workflow execution result
   */
  async executeWorkflow(workflow: Workflow): Promise<Workflow> {
    console.log(`[Orchestrator] Executing workflow: ${workflow.name}`);

    // Validate agents exist
    for (const step of workflow.steps) {
      if (!this.agents.has(step.agent_id)) {
        throw new Error(`Agent ${step.agent_id} not found`);
      }
    }

    // Execute workflow
    const result = await this.workflowEngine.execute(workflow);

    // Update tactical dashboard
    await this.tacticalCommand.updateWorkflowStatus(result);

    return result;
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
   * Suspend agent (stop all workflows)
   */
  async suspendAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'suspended';
    await this.workflowEngine.stopAgentWorkflows(agentId);

    await getAuditLogger().log(
      AuditEventType.AGENT_UPDATED,
      'agent.suspend',
      'success',
      {
        resourceType: 'agent',
        resourceId: agentId,
        details: { status: 'suspended' },
      }
    );
    console.log(`[Orchestrator] Suspended agent: ${agentId}`);
  }

  /**
   * Get tactical dashboard
   */
  async getDashboard() {
    return this.tacticalCommand.getDashboard(this.agents);
  }
}
