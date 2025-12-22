/**
 * AgentOrchestrator - Main orchestration controller
 * 
 * Manages the lifecycle of AI agents in production:
 * - Registration (with DID/VC)
 * - Workflow execution
 * - Monitoring and control
 */

import { Agent, Workflow, WorkflowStep } from './index';
import { DIDVCManager } from './did-vc-manager';
import { WorkflowEngine } from './workflow-engine';
import { TacticalCommand } from './tactical-command';

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
  async registerAgent(agent: Omit<Agent, 'did' | 'credentials' | 'status'>): Promise<Agent> {
    // Generate DID for agent
    const did = await this.didManager.createDID(agent.id);

    // Issue capability credentials
    const credentials = await this.didManager.issueCredentials(did, agent.capabilities);

    const registeredAgent: Agent = {
      ...agent,
      did,
      credentials,
      status: 'active',
    };

    this.agents.set(agent.id, registeredAgent);
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

    console.log(`[Orchestrator] Suspended agent: ${agentId}`);
  }

  /**
   * Get tactical dashboard
   */
  async getDashboard() {
    return this.tacticalCommand.getDashboard(this.agents);
  }
}
