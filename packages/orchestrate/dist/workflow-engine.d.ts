/**
 * WorkflowEngine - Multi-agent workflow execution
 *
 * Orchestrates complex workflows across multiple agents:
 * - Sequential execution
 * - Parallel execution
 * - Error handling and retries
 */
import { Workflow } from './types';
export declare class WorkflowEngine {
    private activeWorkflows;
    /**
     * Execute workflow
     *
     * @param workflow - Workflow definition
     * @returns Completed workflow with results
     */
    execute(workflow: Workflow): Promise<Workflow>;
    /**
     * Execute a single workflow step
     */
    private executeStep;
    /**
     * Call agent to perform action
     */
    private callAgent;
    /**
     * Stop all workflows for an agent
     */
    stopAgentWorkflows(agentId: string): Promise<void>;
    /**
     * Get active workflows
     */
    getActiveWorkflows(): Workflow[];
}
//# sourceMappingURL=workflow-engine.d.ts.map