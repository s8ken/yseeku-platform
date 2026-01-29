"use strict";
/**
 * AgentOrchestrator - Main orchestration controller
 *
 * Manages the lifecycle of AI agents in production:
 * - Registration (with DID/VC)
 * - Workflow execution
 * - Monitoring and control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
const crypto_1 = require("crypto");
const did_vc_manager_1 = require("./did-vc-manager");
const audit_1 = require("./security/audit");
const tactical_command_1 = require("./tactical-command");
const workflow_engine_1 = require("./workflow-engine");
class AgentOrchestrator {
    constructor() {
        this.agents = new Map();
        this.didManager = new did_vc_manager_1.DIDVCManager();
        this.workflowEngine = new workflow_engine_1.WorkflowEngine();
        this.tacticalCommand = new tactical_command_1.TacticalCommand();
    }
    /**
     * Register a new agent with DID/VC
     *
     * @param agent - Agent configuration
     * @returns Registered agent with DID
     */
    async registerAgent(agent) {
        const now = new Date();
        const agentType = 'type' in agent && agent.type ? agent.type : 'coordinator';
        const rawCapabilities = agent.capabilities ?? [];
        const capabilities = rawCapabilities.map((cap) => {
            if (typeof cap === 'string') {
                return { name: cap, version: '1.0.0' };
            }
            return { ...cap, version: cap.version ?? '1.0.0' };
        });
        const permissions = 'permissions' in agent && Array.isArray(agent.permissions) ? agent.permissions : [];
        const metadata = 'metadata' in agent && agent.metadata ? agent.metadata : {};
        const baseConfig = 'config' in agent && agent.config ? agent.config : undefined;
        const apiKey = 'apiKey' in agent && agent.apiKey ? agent.apiKey : baseConfig?.apiKey ?? (0, crypto_1.randomUUID)();
        const config = {
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
        const credentials = await this.didManager.issueCredentials(did, capabilities.map((c) => c.name));
        const registeredAgent = {
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
            createdAt: 'createdAt' in agent && agent.createdAt ? agent.createdAt : now,
            updatedAt: 'updatedAt' in agent && agent.updatedAt ? agent.updatedAt : now,
            lastActivity: 'lastActivity' in agent && agent.lastActivity ? agent.lastActivity : now,
            trustDeclaration: 'trustDeclaration' in agent && agent.trustDeclaration ? agent.trustDeclaration : undefined,
            trustMetrics: 'trustMetrics' in agent && agent.trustMetrics ? agent.trustMetrics : undefined,
            trustLevel: 'trustLevel' in agent && agent.trustLevel ? agent.trustLevel : undefined,
            currentTask: 'currentTask' in agent && agent.currentTask ? agent.currentTask : undefined,
        };
        this.agents.set(agent.id, registeredAgent);
        await (0, audit_1.getAuditLogger)().log(audit_1.AuditEventType.AGENT_CREATED, 'agent.register', 'success', {
            resourceType: 'agent',
            resourceId: agent.id,
            details: { agentType, capabilityCount: capabilities.length },
        });
        console.log(`[Orchestrator] Registered agent: ${agent.name} (${did})`);
        return registeredAgent;
    }
    /**
     * Create and execute workflow
     *
     * @param workflow - Workflow definition
     * @returns Workflow execution result
     */
    async executeWorkflow(workflow) {
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
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * List all agents
     */
    listAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Suspend agent (stop all workflows)
     */
    async suspendAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        agent.status = 'suspended';
        await this.workflowEngine.stopAgentWorkflows(agentId);
        await (0, audit_1.getAuditLogger)().log(audit_1.AuditEventType.AGENT_UPDATED, 'agent.suspend', 'success', {
            resourceType: 'agent',
            resourceId: agentId,
            details: { status: 'suspended' },
        });
        console.log(`[Orchestrator] Suspended agent: ${agentId}`);
    }
    /**
     * Get tactical dashboard
     */
    async getDashboard() {
        return this.tacticalCommand.getDashboard(this.agents);
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
