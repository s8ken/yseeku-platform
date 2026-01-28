import { Workflow, IWorkflow, IWorkflowStep } from '../models/workflow.model';
import { WorkflowExecution, IWorkflowExecution, IWorkflowTaskResult } from '../models/workflow-execution.model';
import { Agent, IAgent } from '../models/agent.model';
import { llmService } from './llm.service';
import { trustService } from './trust.service';
import logger from '../utils/logger';
import { Types } from 'mongoose';
import { getErrorMessage } from '../utils/error-utils';

export class OrchestrationService {
  
  /**
   * Create a new workflow definition
   */
  async createWorkflow(data: Partial<IWorkflow>): Promise<IWorkflow> {
    return Workflow.create(data);
  }

  /**
   * List workflows for a tenant
   */
  async listWorkflows(tenantId: string): Promise<IWorkflow[]> {
    return Workflow.find({ tenantId, status: { $ne: 'archived' } }).sort({ updatedAt: -1 });
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: string): Promise<IWorkflow | null> {
    return Workflow.findById(id).populate('steps.agentId');
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, input: any, tenantId: string): Promise<IWorkflowExecution> {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    // Create execution record
    const execution = await WorkflowExecution.create({
      workflowId: workflow._id,
      tenantId,
      status: 'running',
      input,
      results: [],
      startTime: new Date()
    });

    // Start processing asynchronously (fire and forget from API perspective)
    this.processWorkflowExecution(execution._id.toString(), workflow);

    return execution;
  }

  /**
   * Main execution loop (simplified DAG processor)
   */
  private async processWorkflowExecution(executionId: string, workflow: IWorkflow) {
    try {
      const execution = await WorkflowExecution.findById(executionId);
      if (!execution) return;

      logger.info(`Starting workflow execution ${executionId} for workflow ${workflow.name}`);

      // Map steps by ID for easy lookup
      const stepsMap = new Map(workflow.steps.map(s => [s.id, s]));
      const completedSteps = new Set<string>();
      const stepResults = new Map<string, any>(); // Store outputs

      // Initialize results array from existing execution state if resuming (not implemented fully yet)
      
      // Topological sort or simple loop for now since we want to support async/parallel later
      // For MVP: Sequential execution based on dependencies
      // We will find "ready" steps (dependencies met) and execute them
      
      let processing = true;
      while (processing) {
        // Find next step(s) to execute
        const readySteps = workflow.steps.filter(step => {
          if (completedSteps.has(step.id)) return false; // Already done
          // Check dependencies
          if (step.dependencies.length === 0) return true; // No deps
          return step.dependencies.every(depId => completedSteps.has(depId));
        });

        if (readySteps.length === 0) {
          // No ready steps. Are we done?
          if (completedSteps.size === workflow.steps.length) {
            processing = false;
            execution.status = 'completed';
            execution.endTime = new Date();
            await execution.save();
            logger.info(`Workflow execution ${executionId} completed successfully`);
          } else {
            // Stuck? Circular dependency or failed dependency?
            // For MVP assuming strictly ordered linear or simple DAG
             processing = false;
             execution.status = 'failed';
             execution.error = 'Workflow stuck: dependencies not met or circular';
             await execution.save();
             logger.error(`Workflow execution ${executionId} stuck`);
          }
          break;
        }

        // Execute ready steps (sequentially for now to keep state simple)
        for (const step of readySteps) {
          execution.currentStepId = step.id;
          await execution.save();

          try {
            const result = await this.executeStep(step, execution.input, stepResults);
            
            // Update execution record
            execution.results.push(result);
            await execution.save();

            if (result.status === 'completed') {
              completedSteps.add(step.id);
              stepResults.set(step.id, result.output);
            } else {
              // Step failed
              throw new Error(result.error || 'Step failed unknown');
            }
          } catch (error: unknown) {
            execution.status = 'failed';
            execution.error = `Step ${step.name} failed: ${getErrorMessage(error)}`;
            execution.endTime = new Date();
            await execution.save();
            return; // Stop execution
          }
        }
      }

    } catch (error: unknown) {
      logger.error(`Workflow execution error: ${getErrorMessage(error)}`);
      await WorkflowExecution.findByIdAndUpdate(executionId, {
        status: 'failed',
        error: getErrorMessage(error),
        endTime: new Date()
      });
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: IWorkflowStep, globalInput: any, previousOutputs: Map<string, any>): Promise<IWorkflowTaskResult> {
    const startTime = new Date();
    
    try {
      // Resolve Input
      // Simple template substitution: {{input}} refers to global input
      // {{stepId.output}} refers to previous step
      let prompt = step.inputTemplate || '{{input}}';
      
      // Replace {{input}}
      if (typeof globalInput === 'string') {
        prompt = prompt.replace(/{{input}}/g, globalInput);
      } else {
         // If global input is object, maybe JSON stringify?
         prompt = prompt.replace(/{{input}}/g, JSON.stringify(globalInput));
      }

      // Replace dependency outputs
      for (const depId of step.dependencies) {
        const output = previousOutputs.get(depId);
        const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        // Replace {{stepId}} or {{stepId.output}} (flexible)
        prompt = prompt.replace(new RegExp(`{{${depId}}}`, 'g'), outputStr);
        prompt = prompt.replace(new RegExp(`{{${depId}.output}}`, 'g'), outputStr);
      }

      // Execute based on type
      let output: any;
      let trustScore: number | undefined;

      if (step.type === 'llm') {
        if (!step.agentId) throw new Error('Agent ID required for LLM step');
        
        const agent = await Agent.findById(step.agentId);
        if (!agent) throw new Error('Agent not found');

        // Call LLM Service
        const response = await llmService.generate({
          provider: agent.provider,
          model: agent.model,
          messages: [
            { role: 'system', content: agent.systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: agent.temperature,
          maxTokens: agent.maxTokens
        });

        output = response.content;

        // Trust Validation (if Validator Role or configured)
        // If this step is a "Validator", it explicitly checks trust.
        // But also, we implicitly check trust for every LLM output using TrustService
        const trustEval = await trustService.evaluateMessage({
          sender: 'ai',
          content: output,
          trustScore: 0, // calculated
          metadata: {},
          ciModel: agent.ciModel as any,
          timestamp: new Date()
        }, { conversationId: 'workflow-exec' });
        
        trustScore = trustEval.trustScore.overall;

        // If this is a VALIDATOR agent, the output might be the validation result itself
        // But for now, we just execute the LLM.
      } else if (step.type === 'function') {
        // Placeholder for function execution (e.g. web search, database query)
        output = `Function execution not yet implemented for ${step.name}`;
      } else {
        output = `Unknown step type ${step.type}`;
      }

      return {
        stepId: step.id,
        agentId: step.agentId,
        status: 'completed',
        input: prompt,
        output,
        startTime,
        endTime: new Date(),
        trustScore
      };

    } catch (error: unknown) {
      return {
        stepId: step.id,
        agentId: step.agentId,
        status: 'failed',
        input: 'error',
        output: null,
        error: getErrorMessage(error),
        startTime,
        endTime: new Date()
      };
    }
  }

  /**
   * Create a default "Coordinator-Executor-Validator" workflow
   */
  async createCEVTemplate(tenantId: string, agents: { coordinator: string, executor: string, validator: string }): Promise<IWorkflow> {
    return this.createWorkflow({
      name: 'Research & Validate (CEV)',
      description: 'Standard 3-step workflow: Coordinate task -> Execute research -> Validate output',
      tenantId,
      status: 'active',
      steps: [
        {
          id: 'step-1-coord',
          name: 'Coordinate & Plan',
          type: 'llm',
          agentId: Types.ObjectId.createFromHexString(agents.coordinator) as any,
          role: 'coordinator',
          inputTemplate: 'Create a detailed execution plan for this request: {{input}}',
          dependencies: []
        },
        {
          id: 'step-2-exec',
          name: 'Execute Task',
          type: 'llm',
          agentId: Types.ObjectId.createFromHexString(agents.executor) as any,
          role: 'executor',
          inputTemplate: 'Execute the following plan:\n\n{{step-1-coord}}',
          dependencies: ['step-1-coord']
        },
        {
          id: 'step-3-valid',
          name: 'Validate Result',
          type: 'llm',
          agentId: Types.ObjectId.createFromHexString(agents.validator) as any,
          role: 'validator',
          inputTemplate: 'Validate the following output for accuracy, safety, and completeness. If good, say "VALID". If bad, explain why.\n\nOriginal Request: {{input}}\n\nOutput to Verify:\n{{step-2-exec}}',
          dependencies: ['step-2-exec']
        }
      ]
    } as any);
  }
}

export const orchestrationService = new OrchestrationService();
