/**
 * AgentOrchestrator - Main orchestration controller
 *
 * Manages the lifecycle of AI agents in production:
 * - Registration (with DID/VC)
 * - Workflow execution
 * - Monitoring and control
 */
import { Agent, AgentPermission, AgentType } from './agent-types-enhanced';
import { Workflow } from './types';
type RegisterAgentInput = {
    id: string;
    name: string;
    capabilities: string[];
    metadata?: Record<string, any>;
    type?: AgentType;
    apiKey?: string;
    permissions?: AgentPermission[];
};
export declare class AgentOrchestrator {
    private didManager;
    private workflowEngine;
    private tacticalCommand;
    private agents;
    constructor();
    /**
     * Register a new agent with DID/VC
     *
     * @param agent - Agent configuration
     * @returns Registered agent with DID
     */
    registerAgent(agent: RegisterAgentInput | Omit<Agent, 'did' | 'credentials' | 'status'>): Promise<Agent>;
    /**
     * Create and execute workflow
     *
     * @param workflow - Workflow definition
     * @returns Workflow execution result
     */
    executeWorkflow(workflow: Workflow): Promise<Workflow>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Agent | undefined;
    /**
     * List all agents
     */
    listAgents(): Agent[];
    /**
     * Suspend agent (stop all workflows)
     */
    suspendAgent(agentId: string): Promise<void>;
    /**
     * Get tactical dashboard
     */
    getDashboard(): Promise<import("./types").TacticalDashboard>;
}
export {};
