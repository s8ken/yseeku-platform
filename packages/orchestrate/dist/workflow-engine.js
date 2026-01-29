"use strict";
/**
 * WorkflowEngine - Multi-agent workflow execution
 *
 * Orchestrates complex workflows across multiple agents:
 * - Sequential execution
 * - Parallel execution
 * - Error handling and retries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngine = void 0;
class WorkflowEngine {
    constructor() {
        this.activeWorkflows = new Map();
    }
    /**
     * Execute workflow
     *
     * @param workflow - Workflow definition
     * @returns Completed workflow with results
     */
    async execute(workflow) {
        workflow.status = 'running';
        this.activeWorkflows.set(workflow.id, workflow);
        try {
            // Execute steps sequentially
            for (const step of workflow.steps) {
                await this.executeStep(step);
            }
            workflow.status = 'completed';
            console.log(`[WorkflowEngine] Completed workflow: ${workflow.id}`);
        }
        catch (error) {
            workflow.status = 'failed';
            console.error(`[WorkflowEngine] Failed workflow: ${workflow.id}`, error);
            throw error;
        }
        finally {
            this.activeWorkflows.delete(workflow.id);
        }
        return workflow;
    }
    /**
     * Execute a single workflow step
     */
    async executeStep(step) {
        step.status = 'running';
        console.log(`[WorkflowEngine] Executing step: ${step.id} (Agent: ${step.agent_id})`);
        try {
            // Simulate step execution (in production, call actual agent API)
            await this.callAgent(step.agent_id, step.action, step.input);
            step.output = {
                success: true,
                result: `Completed ${step.action}`,
            };
            step.status = 'completed';
        }
        catch (error) {
            step.status = 'failed';
            throw error;
        }
    }
    /**
     * Call agent to perform action
     */
    async callAgent(agentId, action, input) {
        // In production, make HTTP/gRPC call to agent service
        // For now, simulate delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            agent_id: agentId,
            action_performed: action,
            input_processed: input,
        };
    }
    /**
     * Stop all workflows for an agent
     */
    async stopAgentWorkflows(agentId) {
        for (const [workflowId, workflow] of this.activeWorkflows.entries()) {
            const hasAgent = workflow.steps.some((step) => step.agent_id === agentId);
            if (hasAgent) {
                workflow.status = 'failed';
                this.activeWorkflows.delete(workflowId);
                console.log(`[WorkflowEngine] Stopped workflow ${workflowId} due to agent ${agentId} suspension`);
            }
        }
    }
    /**
     * Get active workflows
     */
    getActiveWorkflows() {
        return Array.from(this.activeWorkflows.values());
    }
}
exports.WorkflowEngine = WorkflowEngine;
