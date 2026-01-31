import { EventEmitter } from 'events';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    agents: AgentRole[];
    tasks: WorkflowTask[];
    dependencies: TaskDependency[];
    triggers: WorkflowTrigger[];
    timeout?: number;
}
export interface AgentRole {
    agentId: string;
    role: 'coordinator' | 'executor' | 'validator' | 'observer';
    capabilities: string[];
    priority: number;
}
export interface WorkflowTask {
    id: string;
    name: string;
    type: 'llm_generation' | 'data_processing' | 'validation' | 'coordination' | 'custom';
    assignedAgent?: string;
    requiredCapabilities: string[];
    input: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    retryCount: number;
    maxRetries: number;
    timeout: number;
}
export interface TaskDependency {
    taskId: string;
    dependsOn: string[];
    condition?: 'all' | 'any' | 'custom';
}
export interface WorkflowTrigger {
    type: 'manual' | 'scheduled' | 'event' | 'webhook';
    config: any;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    currentTask?: string;
    results: Map<string, any>;
    errors: WorkflowError[];
}
export interface WorkflowError {
    taskId: string;
    error: string;
    timestamp: Date;
    retryAttempt: number;
}
export declare class AgentOrchestrator extends EventEmitter {
    private workflows;
    private executions;
    private taskQueue;
    private agentPool;
    private messageRouter;
    constructor();
    /**
     * Register a workflow definition
     */
    registerWorkflow(workflow: WorkflowDefinition): void;
    /**
     * Execute a workflow with given parameters
     */
    executeWorkflow(workflowId: string, parameters?: any): Promise<string>;
    /**
     * Process workflow execution
     */
    private processWorkflow;
    /**
     * Execute a single task
     */
    private executeTask;
    /**
     * Assign task to most suitable agent
     */
    private assignTaskToAgent;
    /**
     * Execute task on specific agent
     */
    private executeTaskOnAgent;
    /**
     * Register agent capabilities
     */
    registerAgent(agentId: string, capabilities: AgentCapabilities): void;
    /**
     * Remove agent from pool
     */
    unregisterAgent(agentId: string): void;
    /**
     * Get workflow execution status
     */
    getExecutionStatus(executionId: string): WorkflowExecution | null;
    /**
     * Cancel workflow execution
     */
    cancelExecution(executionId: string): Promise<void>;
    /**
     * Build task dependency graph
     */
    private buildTaskGraph;
    /**
     * Get tasks ready for execution
     */
    private getReadyTasks;
    /**
     * Check if any tasks are currently running
     */
    private hasRunningTasks;
    /**
     * Calculate agent suitability score for task
     */
    private calculateAgentScore;
    /**
     * Initialize event handlers
     */
    private initializeEventHandlers;
}
export interface AgentCapabilities {
    capabilities: string[];
    availability: number;
    performance: number;
    maxConcurrentTasks: number;
    currentTasks: number;
}
export declare class MessageRouter {
    private routes;
    /**
     * Register message handler for specific message type
     */
    registerHandler(messageType: string, handler: (message: any) => void): void;
    /**
     * Route message to appropriate handler
     */
    routeMessage(messageType: string, message: any): void;
    /**
     * Broadcast message to multiple agents
     */
    broadcast(agentIds: string[], messageType: string, message: any): void;
}
export declare const agentOrchestrator: AgentOrchestrator;
