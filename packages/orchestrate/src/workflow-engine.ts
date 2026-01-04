/**
 * WorkflowEngine - Multi-agent workflow execution
 *
 * Orchestrates complex workflows across multiple agents:
 * - Sequential execution
 * - Parallel execution
 * - Error handling and retries
 */

import { Workflow, WorkflowStep } from './index';
import {
  log,
  workflowDurationHistogram,
  workflowStepDurationHistogram,
  workflowFailuresTotal,
  activeWorkflowsGauge,
  PerformanceTimer,
} from '@sonate/core';

export class WorkflowEngine {
  private activeWorkflows: Map<string, Workflow> = new Map();

  /**
   * Execute workflow
   * 
   * @param workflow - Workflow definition
   * @returns Completed workflow with results
   */
  async execute(workflow: Workflow): Promise<Workflow> {
    workflow.status = 'running';
    this.activeWorkflows.set(workflow.id, workflow);

    // Update active workflows gauge
    activeWorkflowsGauge.inc({ workflow_type: workflow.name });

    // Start workflow timer
    const timer = new PerformanceTimer('workflow_execution', {
      workflow_name: workflow.name,
    });

    try {
      // Execute steps sequentially
      for (const step of workflow.steps) {
        await this.executeStep(step, workflow.name);
      }

      workflow.status = 'completed';
      const duration = timer.end();

      // Record successful workflow execution
      workflowDurationHistogram.observe(
        { workflow_name: workflow.name, status: 'success' },
        duration
      );

      log.info('Workflow completed', {
        workflowId: workflow.id,
        stepCount: workflow.steps.length,
        duration_seconds: duration,
        module: 'WorkflowEngine',
      });
    } catch (error) {
      workflow.status = 'failed';
      const duration = timer.end();

      // Record failed workflow execution
      workflowDurationHistogram.observe(
        { workflow_name: workflow.name, status: 'failure' },
        duration
      );

      // Increment failure counter
      workflowFailuresTotal.inc({
        workflow_name: workflow.name,
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      });

      log.error('Workflow failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration_seconds: duration,
        module: 'WorkflowEngine',
      });
      throw error;
    } finally {
      this.activeWorkflows.delete(workflow.id);
      // Decrement active workflows gauge
      activeWorkflowsGauge.dec({ workflow_type: workflow.name });
    }

    return workflow;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, workflowName: string): Promise<void> {
    step.status = 'running';

    // Start step timer
    const stepTimer = new PerformanceTimer('workflow_step', {
      workflow_name: workflowName,
      step_name: step.id,
      agent_id: step.agent_id,
    });

    log.debug('Executing workflow step', {
      stepId: step.id,
      agentId: step.agent_id,
      action: step.action,
      module: 'WorkflowEngine',
    });

    try {
      // Simulate step execution (in production, call actual agent API)
      await this.callAgent(step.agent_id, step.action, step.input);

      step.output = {
        success: true,
        result: `Completed ${step.action}`,
      };
      step.status = 'completed';

      // Record step duration
      const duration = stepTimer.end();
      workflowStepDurationHistogram.observe(
        { workflow_name: workflowName, step_name: step.id, agent_id: step.agent_id },
        duration
      );
    } catch (error) {
      step.status = 'failed';
      stepTimer.end();
      throw error;
    }
  }

  /**
   * Call agent to perform action
   */
  private async callAgent(agentId: string, action: string, input: Record<string, any>): Promise<any> {
    // In production, make HTTP/gRPC call to agent service
    // For now, simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      agent_id: agentId,
      action_performed: action,
      input_processed: input,
    };
  }

  /**
   * Stop all workflows for an agent
   */
  async stopAgentWorkflows(agentId: string): Promise<void> {
    for (const [workflowId, workflow] of this.activeWorkflows.entries()) {
      const hasAgent = workflow.steps.some(step => step.agent_id === agentId);
      
      if (hasAgent) {
        workflow.status = 'failed';
        this.activeWorkflows.delete(workflowId);
        log.warn('Workflow stopped due to agent suspension', {
          workflowId,
          agentId,
          module: 'WorkflowEngine',
        });
      }
    }
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows.values());
  }
}
