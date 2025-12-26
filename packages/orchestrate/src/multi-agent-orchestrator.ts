import { EventEmitter } from "events"
import { socketManager } from "@/lib/socket-client"

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  agents: AgentRole[]
  tasks: WorkflowTask[]
  dependencies: TaskDependency[]
  triggers: WorkflowTrigger[]
  timeout?: number
}

export interface AgentRole {
  agentId: string
  role: "coordinator" | "executor" | "validator" | "observer"
  capabilities: string[]
  priority: number
}

export interface WorkflowTask {
  id: string
  name: string
  type: "llm_generation" | "data_processing" | "validation" | "coordination" | "custom"
  assignedAgent?: string
  requiredCapabilities: string[]
  input: any
  output?: any
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  retryCount: number
  maxRetries: number
  timeout: number
}

export interface TaskDependency {
  taskId: string
  dependsOn: string[]
  condition?: "all" | "any" | "custom"
}

export interface WorkflowTrigger {
  type: "manual" | "scheduled" | "event" | "webhook"
  config: any
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "running" | "completed" | "failed" | "cancelled"
  startTime: Date
  endTime?: Date
  currentTask?: string
  results: Map<string, any>
  errors: WorkflowError[]
}

export interface WorkflowError {
  taskId: string
  error: string
  timestamp: Date
  retryAttempt: number
}

export class AgentOrchestrator extends EventEmitter {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private taskQueue: WorkflowTask[] = []
  private agentPool: Map<string, AgentCapabilities> = new Map()
  private messageRouter: MessageRouter

  constructor() {
    super()
    this.messageRouter = new MessageRouter()
    this.initializeEventHandlers()
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow)
    this.emit("workflow_registered", workflow)
  }

  /**
   * Execute a workflow with given parameters
   */
  async executeWorkflow(workflowId: string, parameters: any = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: "running",
      startTime: new Date(),
      results: new Map(),
      errors: [],
    }

    this.executions.set(executionId, execution)
    this.emit("workflow_started", execution)

    try {
      await this.processWorkflow(execution, workflow, parameters)
      execution.status = "completed"
      execution.endTime = new Date()
      this.emit("workflow_completed", execution)
    } catch (error) {
      execution.status = "failed"
      execution.endTime = new Date()
      execution.errors.push({
        taskId: execution.currentTask || "unknown",
        error: error.message,
        timestamp: new Date(),
        retryAttempt: 0,
      })
      this.emit("workflow_failed", execution)
    }

    return executionId
  }

  /**
   * Process workflow execution
   */
  private async processWorkflow(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    parameters: any,
  ): Promise<void> {
    const taskGraph = this.buildTaskGraph(workflow.tasks, workflow.dependencies)
    const readyTasks = this.getReadyTasks(taskGraph, new Set())

    while (readyTasks.length > 0 || this.hasRunningTasks(workflow.tasks)) {
      // Execute ready tasks in parallel
      const taskPromises = readyTasks.map((task) => this.executeTask(execution, task, parameters))
      await Promise.allSettled(taskPromises)

      // Update completed tasks and find new ready tasks
      const completedTasks = new Set(workflow.tasks.filter((t) => t.status === "completed").map((t) => t.id))
      const newReadyTasks = this.getReadyTasks(taskGraph, completedTasks)
      readyTasks.splice(0, readyTasks.length, ...newReadyTasks)

      // Check for failures
      const failedTasks = workflow.tasks.filter((t) => t.status === "failed")
      if (failedTasks.length > 0) {
        throw new Error(`Tasks failed: ${failedTasks.map((t) => t.id).join(", ")}`)
      }
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(execution: WorkflowExecution, task: WorkflowTask, parameters: any): Promise<void> {
    execution.currentTask = task.id
    task.status = "running"
    this.emit("task_started", { execution, task })

    try {
      const assignedAgent = await this.assignTaskToAgent(task)
      if (!assignedAgent) {
        throw new Error(`No suitable agent found for task ${task.id}`)
      }

      task.assignedAgent = assignedAgent
      const result = await this.executeTaskOnAgent(assignedAgent, task, parameters)

      task.output = result
      task.status = "completed"
      execution.results.set(task.id, result)

      this.emit("task_completed", { execution, task, result })
    } catch (error) {
      task.retryCount++
      if (task.retryCount < task.maxRetries) {
        task.status = "pending"
        this.emit("task_retry", { execution, task, error })
      } else {
        task.status = "failed"
        this.emit("task_failed", { execution, task, error })
        throw error
      }
    }
  }

  /**
   * Assign task to most suitable agent
   */
  private async assignTaskToAgent(task: WorkflowTask): Promise<string | null> {
    const suitableAgents = Array.from(this.agentPool.entries()).filter(([agentId, capabilities]) => {
      return task.requiredCapabilities.every((cap) => capabilities.capabilities.includes(cap))
    })

    if (suitableAgents.length === 0) {
      return null
    }

    // Sort by availability and capability match score
    suitableAgents.sort(([, a], [, b]) => {
      const scoreA = this.calculateAgentScore(a, task)
      const scoreB = this.calculateAgentScore(b, task)
      return scoreB - scoreA
    })

    return suitableAgents[0][0]
  }

  /**
   * Execute task on specific agent
   */
  private async executeTaskOnAgent(agentId: string, task: WorkflowTask, parameters: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out on agent ${agentId}`))
      }, task.timeout)

      // Send task to agent via socket
      socketManager.emit("agent_task", {
        agentId,
        taskId: task.id,
        type: task.type,
        input: { ...task.input, ...parameters },
      })

      // Listen for task completion
      const handleTaskResult = (data: any) => {
        if (data.taskId === task.id && data.agentId === agentId) {
          clearTimeout(timeout)
          socketManager.off("agent_task_result", handleTaskResult)

          if (data.success) {
            resolve(data.result)
          } else {
            reject(new Error(data.error))
          }
        }
      }

      socketManager.on("agent_task_result", handleTaskResult)
    })
  }

  /**
   * Register agent capabilities
   */
  registerAgent(agentId: string, capabilities: AgentCapabilities): void {
    this.agentPool.set(agentId, capabilities)
    this.emit("agent_registered", { agentId, capabilities })
  }

  /**
   * Remove agent from pool
   */
  unregisterAgent(agentId: string): void {
    this.agentPool.delete(agentId)
    this.emit("agent_unregistered", { agentId })
  }

  /**
   * Get workflow execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`)
    }

    execution.status = "cancelled"
    execution.endTime = new Date()
    this.emit("workflow_cancelled", execution)
  }

  /**
   * Build task dependency graph
   */
  private buildTaskGraph(tasks: WorkflowTask[], dependencies: TaskDependency[]): Map<string, string[]> {
    const graph = new Map<string, string[]>()

    tasks.forEach((task) => {
      graph.set(task.id, [])
    })

    dependencies.forEach((dep) => {
      graph.set(dep.taskId, dep.dependsOn)
    })

    return graph
  }

  /**
   * Get tasks ready for execution
   */
  private getReadyTasks(taskGraph: Map<string, string[]>, completedTasks: Set<string>): WorkflowTask[] {
    const readyTaskIds = Array.from(taskGraph.entries())
      .filter(([taskId, dependencies]) => {
        return !completedTasks.has(taskId) && dependencies.every((dep) => completedTasks.has(dep))
      })
      .map(([taskId]) => taskId)

    return readyTaskIds
      .map((id) =>
        this.workflows
          .values()
          .next()
          .value?.tasks.find((t: WorkflowTask) => t.id === id),
      )
      .filter(Boolean)
  }

  /**
   * Check if any tasks are currently running
   */
  private hasRunningTasks(tasks: WorkflowTask[]): boolean {
    return tasks.some((task) => task.status === "running")
  }

  /**
   * Calculate agent suitability score for task
   */
  private calculateAgentScore(capabilities: AgentCapabilities, task: WorkflowTask): number {
    let score = 0

    // Capability match score
    const matchedCaps = task.requiredCapabilities.filter((cap) => capabilities.capabilities.includes(cap))
    score += (matchedCaps.length / task.requiredCapabilities.length) * 50

    // Availability score
    score += capabilities.availability * 30

    // Performance score
    score += capabilities.performance * 20

    return score
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    this.on("workflow_started", (execution) => {
      console.log(`[Orchestrator] Workflow ${execution.workflowId} started: ${execution.id}`)
    })

    this.on("task_started", ({ execution, task }) => {
      console.log(`[Orchestrator] Task ${task.id} started on agent ${task.assignedAgent}`)
    })

    this.on("task_completed", ({ execution, task }) => {
      console.log(`[Orchestrator] Task ${task.id} completed successfully`)
    })

    this.on("workflow_completed", (execution) => {
      console.log(`[Orchestrator] Workflow ${execution.workflowId} completed: ${execution.id}`)
    })
  }
}

export interface AgentCapabilities {
  capabilities: string[]
  availability: number // 0-1
  performance: number // 0-1
  maxConcurrentTasks: number
  currentTasks: number
}

export class MessageRouter {
  private routes: Map<string, (message: any) => void> = new Map()

  /**
   * Register message handler for specific message type
   */
  registerHandler(messageType: string, handler: (message: any) => void): void {
    this.routes.set(messageType, handler)
  }

  /**
   * Route message to appropriate handler
   */
  routeMessage(messageType: string, message: any): void {
    const handler = this.routes.get(messageType)
    if (handler) {
      handler(message)
    } else {
      console.warn(`[MessageRouter] No handler found for message type: ${messageType}`)
    }
  }

  /**
   * Broadcast message to multiple agents
   */
  broadcast(agentIds: string[], messageType: string, message: any): void {
    agentIds.forEach((agentId) => {
      socketManager.emit("agent_message", {
        agentId,
        type: messageType,
        data: message,
      })
    })
  }
}

export const agentOrchestrator = new AgentOrchestrator()
