"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentOrchestrator = exports.MessageRouter = exports.AgentOrchestrator = void 0;
const events_1 = require("events");
const socket_client_1 = require("./lib/socket-client");
class AgentOrchestrator extends events_1.EventEmitter {
    constructor() {
        super();
        this.workflows = new Map();
        this.executions = new Map();
        this.taskQueue = [];
        this.agentPool = new Map();
        this.messageRouter = new MessageRouter();
        this.initializeEventHandlers();
    }
    /**
     * Register a workflow definition
     */
    registerWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
        this.emit('workflow_registered', workflow);
    }
    /**
     * Execute a workflow with given parameters
     */
    async executeWorkflow(workflowId, parameters = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const execution = {
            id: executionId,
            workflowId,
            status: 'running',
            startTime: new Date(),
            results: new Map(),
            errors: [],
        };
        this.executions.set(executionId, execution);
        this.emit('workflow_started', execution);
        try {
            await this.processWorkflow(execution, workflow, parameters);
            execution.status = 'completed';
            execution.endTime = new Date();
            this.emit('workflow_completed', execution);
        }
        catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date();
            execution.errors.push({
                taskId: execution.currentTask || 'unknown',
                error: error.message || String(error),
                timestamp: new Date(),
                retryAttempt: 0,
            });
            this.emit('workflow_failed', execution);
        }
        return executionId;
    }
    /**
     * Process workflow execution
     */
    async processWorkflow(execution, workflow, parameters) {
        const taskGraph = this.buildTaskGraph(workflow.tasks, workflow.dependencies);
        const readyTasks = this.getReadyTasks(taskGraph, new Set());
        while (readyTasks.length > 0 || this.hasRunningTasks(workflow.tasks)) {
            // Execute ready tasks in parallel
            const taskPromises = readyTasks.map((task) => this.executeTask(execution, task, parameters));
            await Promise.allSettled(taskPromises);
            // Update completed tasks and find new ready tasks
            const completedTasks = new Set(workflow.tasks.filter((t) => t.status === 'completed').map((t) => t.id));
            const newReadyTasks = this.getReadyTasks(taskGraph, completedTasks);
            readyTasks.splice(0, readyTasks.length, ...newReadyTasks);
            // Check for failures
            const failedTasks = workflow.tasks.filter((t) => t.status === 'failed');
            if (failedTasks.length > 0) {
                throw new Error(`Tasks failed: ${failedTasks.map((t) => t.id).join(', ')}`);
            }
        }
    }
    /**
     * Execute a single task
     */
    async executeTask(execution, task, parameters) {
        execution.currentTask = task.id;
        task.status = 'running';
        this.emit('task_started', { execution, task });
        try {
            const assignedAgent = await this.assignTaskToAgent(task);
            if (!assignedAgent) {
                throw new Error(`No suitable agent found for task ${task.id}`);
            }
            task.assignedAgent = assignedAgent;
            const result = await this.executeTaskOnAgent(assignedAgent, task, parameters);
            task.output = result;
            task.status = 'completed';
            execution.results.set(task.id, result);
            this.emit('task_completed', { execution, task, result });
        }
        catch (error) {
            task.retryCount++;
            if (task.retryCount < task.maxRetries) {
                task.status = 'pending';
                this.emit('task_retry', { execution, task, error });
            }
            else {
                task.status = 'failed';
                this.emit('task_failed', { execution, task, error });
                throw error;
            }
        }
    }
    /**
     * Assign task to most suitable agent
     */
    async assignTaskToAgent(task) {
        const suitableAgents = Array.from(this.agentPool.entries()).filter(([agentId, capabilities]) => {
            return task.requiredCapabilities.every((cap) => capabilities.capabilities.includes(cap));
        });
        if (suitableAgents.length === 0) {
            return null;
        }
        // Sort by availability and capability match score
        suitableAgents.sort(([, a], [, b]) => {
            const scoreA = this.calculateAgentScore(a, task);
            const scoreB = this.calculateAgentScore(b, task);
            return scoreB - scoreA;
        });
        return suitableAgents[0][0];
    }
    /**
     * Execute task on specific agent
     */
    async executeTaskOnAgent(agentId, task, parameters) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Task ${task.id} timed out on agent ${agentId}`));
            }, task.timeout);
            // Send task to agent via socket
            socket_client_1.socketManager.emit('agent_task', {
                agentId,
                taskId: task.id,
                type: task.type,
                input: { ...task.input, ...parameters },
            });
            // Listen for task completion
            const handleTaskResult = (data) => {
                if (data.taskId === task.id && data.agentId === agentId) {
                    clearTimeout(timeout);
                    socket_client_1.socketManager.off('agent_task_result', handleTaskResult);
                    if (data.success) {
                        resolve(data.result);
                    }
                    else {
                        reject(new Error(data.error));
                    }
                }
            };
            socket_client_1.socketManager.on('agent_task_result', handleTaskResult);
        });
    }
    /**
     * Register agent capabilities
     */
    registerAgent(agentId, capabilities) {
        this.agentPool.set(agentId, capabilities);
        this.emit('agent_registered', { agentId, capabilities });
    }
    /**
     * Remove agent from pool
     */
    unregisterAgent(agentId) {
        this.agentPool.delete(agentId);
        this.emit('agent_unregistered', { agentId });
    }
    /**
     * Get workflow execution status
     */
    getExecutionStatus(executionId) {
        return this.executions.get(executionId) || null;
    }
    /**
     * Cancel workflow execution
     */
    async cancelExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }
        execution.status = 'cancelled';
        execution.endTime = new Date();
        this.emit('workflow_cancelled', execution);
    }
    /**
     * Build task dependency graph
     */
    buildTaskGraph(tasks, dependencies) {
        const graph = new Map();
        tasks.forEach((task) => {
            graph.set(task.id, []);
        });
        dependencies.forEach((dep) => {
            graph.set(dep.taskId, dep.dependsOn);
        });
        return graph;
    }
    /**
     * Get tasks ready for execution
     */
    getReadyTasks(taskGraph, completedTasks) {
        const readyTaskIds = Array.from(taskGraph.entries())
            .filter(([taskId, dependencies]) => {
            return !completedTasks.has(taskId) && dependencies.every((dep) => completedTasks.has(dep));
        })
            .map(([taskId]) => taskId);
        return readyTaskIds
            .map((id) => Array.from(this.workflows.values())
            .flatMap((w) => w.tasks)
            .find((t) => t.id === id))
            .filter((t) => Boolean(t));
    }
    /**
     * Check if any tasks are currently running
     */
    hasRunningTasks(tasks) {
        return tasks.some((task) => task.status === 'running');
    }
    /**
     * Calculate agent suitability score for task
     */
    calculateAgentScore(capabilities, task) {
        let score = 0;
        // Capability match score
        const matchedCaps = task.requiredCapabilities.filter((cap) => capabilities.capabilities.includes(cap));
        score += (matchedCaps.length / task.requiredCapabilities.length) * 50;
        // Availability score
        score += capabilities.availability * 30;
        // Performance score
        score += capabilities.performance * 20;
        return score;
    }
    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        this.on('workflow_started', (execution) => {
            console.log(`[Orchestrator] Workflow ${execution.workflowId} started: ${execution.id}`);
        });
        this.on('task_started', ({ execution, task }) => {
            console.log(`[Orchestrator] Task ${task.id} started on agent ${task.assignedAgent}`);
        });
        this.on('task_completed', ({ execution, task }) => {
            console.log(`[Orchestrator] Task ${task.id} completed successfully`);
        });
        this.on('workflow_completed', (execution) => {
            console.log(`[Orchestrator] Workflow ${execution.workflowId} completed: ${execution.id}`);
        });
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
class MessageRouter {
    constructor() {
        this.routes = new Map();
    }
    /**
     * Register message handler for specific message type
     */
    registerHandler(messageType, handler) {
        this.routes.set(messageType, handler);
    }
    /**
     * Route message to appropriate handler
     */
    routeMessage(messageType, message) {
        const handler = this.routes.get(messageType);
        if (handler) {
            handler(message);
        }
        else {
            console.warn(`[MessageRouter] No handler found for message type: ${messageType}`);
        }
    }
    /**
     * Broadcast message to multiple agents
     */
    broadcast(agentIds, messageType, message) {
        agentIds.forEach((agentId) => {
            socket_client_1.socketManager.emit('agent_message', {
                agentId,
                type: messageType,
                data: message,
            });
        });
    }
}
exports.MessageRouter = MessageRouter;
exports.agentOrchestrator = new AgentOrchestrator();
