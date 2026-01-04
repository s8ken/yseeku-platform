/**
 * WorkflowEngine - Multi-agent workflow execution
 *
 * Orchestrates complex workflows across multiple agents:
 * - Sequential execution
 * - Parallel execution
 * - Error handling and retries
 */

import { Workflow, WorkflowStep } from './index';
import { log } from '@sonate/core';

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

    try {
      // Execute steps sequentially
      for (const step of workflow.steps) {
        await this.executeStep(step);
      }

      workflow.status = 'completed';
      log.info('Workflow completed', {
        workflowId: workflow.id,
        stepCount: workflow.steps.length,
        module: 'WorkflowEngine',
      });
    } catch (error) {
      workflow.status = 'failed';
      log.error('Workflow failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        module: 'WorkflowEngine',
      });
      throw error;
    } finally {
      this.activeWorkflows.delete(workflow.id);
    }

    return workflow;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep): Promise<void> {
    step.status = 'running';
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
    } catch (error) {
      step.status = 'failed';
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
