"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrationService = exports.OrchestrationService = void 0;
const workflow_model_1 = require("../models/workflow.model");
const workflow_execution_model_1 = require("../models/workflow-execution.model");
const agent_model_1 = require("../models/agent.model");
const llm_service_1 = require("./llm.service");
const trust_service_1 = require("./trust.service");
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = require("mongoose");
const error_utils_1 = require("../utils/error-utils");
class OrchestrationService {
    /**
     * Create a new workflow definition
     */
    async createWorkflow(data) {
        return workflow_model_1.Workflow.create(data);
    }
    /**
     * List workflows for a tenant
     */
    async listWorkflows(tenantId) {
        return workflow_model_1.Workflow.find({ tenantId, status: { $ne: 'archived' } }).sort({ updatedAt: -1 });
    }
    /**
     * Get a workflow by ID
     */
    async getWorkflow(id) {
        return workflow_model_1.Workflow.findById(id).populate('steps.agentId');
    }
    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowId, input, tenantId) {
        const workflow = await workflow_model_1.Workflow.findById(workflowId);
        if (!workflow)
            throw new Error('Workflow not found');
        // Create execution record
        const execution = await workflow_execution_model_1.WorkflowExecution.create({
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
    async processWorkflowExecution(executionId, workflow) {
        try {
            const execution = await workflow_execution_model_1.WorkflowExecution.findById(executionId);
            if (!execution)
                return;
            logger_1.default.info(`Starting workflow execution ${executionId} for workflow ${workflow.name}`);
            // Map steps by ID for easy lookup
            const stepsMap = new Map(workflow.steps.map(s => [s.id, s]));
            const completedSteps = new Set();
            const stepResults = new Map(); // Store outputs
            // Initialize results array from existing execution state if resuming (not implemented fully yet)
            // Topological sort or simple loop for now since we want to support async/parallel later
            // For MVP: Sequential execution based on dependencies
            // We will find "ready" steps (dependencies met) and execute them
            let processing = true;
            while (processing) {
                // Find next step(s) to execute
                const readySteps = workflow.steps.filter(step => {
                    if (completedSteps.has(step.id))
                        return false; // Already done
                    // Check dependencies
                    if (step.dependencies.length === 0)
                        return true; // No deps
                    return step.dependencies.every(depId => completedSteps.has(depId));
                });
                if (readySteps.length === 0) {
                    // No ready steps. Are we done?
                    if (completedSteps.size === workflow.steps.length) {
                        processing = false;
                        execution.status = 'completed';
                        execution.endTime = new Date();
                        await execution.save();
                        logger_1.default.info(`Workflow execution ${executionId} completed successfully`);
                    }
                    else {
                        // Stuck? Circular dependency or failed dependency?
                        // For MVP assuming strictly ordered linear or simple DAG
                        processing = false;
                        execution.status = 'failed';
                        execution.error = 'Workflow stuck: dependencies not met or circular';
                        await execution.save();
                        logger_1.default.error(`Workflow execution ${executionId} stuck`);
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
                        }
                        else {
                            // Step failed
                            throw new Error(result.error || 'Step failed unknown');
                        }
                    }
                    catch (error) {
                        execution.status = 'failed';
                        execution.error = `Step ${step.name} failed: ${(0, error_utils_1.getErrorMessage)(error)}`;
                        execution.endTime = new Date();
                        await execution.save();
                        return; // Stop execution
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Workflow execution error: ${(0, error_utils_1.getErrorMessage)(error)}`);
            await workflow_execution_model_1.WorkflowExecution.findByIdAndUpdate(executionId, {
                status: 'failed',
                error: (0, error_utils_1.getErrorMessage)(error),
                endTime: new Date()
            });
        }
    }
    /**
     * Execute a single step
     */
    async executeStep(step, globalInput, previousOutputs) {
        const startTime = new Date();
        try {
            // Resolve Input
            // Simple template substitution: {{input}} refers to global input
            // {{stepId.output}} refers to previous step
            let prompt = step.inputTemplate || '{{input}}';
            // Replace {{input}}
            if (typeof globalInput === 'string') {
                prompt = prompt.replace(/{{input}}/g, globalInput);
            }
            else {
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
            let output;
            let trustScore;
            if (step.type === 'llm') {
                if (!step.agentId)
                    throw new Error('Agent ID required for LLM step');
                const agent = await agent_model_1.Agent.findById(step.agentId);
                if (!agent)
                    throw new Error('Agent not found');
                // Call LLM Service
                const response = await llm_service_1.llmService.generate({
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
                const trustEval = await trust_service_1.trustService.evaluateMessage({
                    sender: 'ai',
                    content: output,
                    trustScore: 0, // calculated
                    metadata: {},
                    ciModel: agent.ciModel,
                    timestamp: new Date()
                }, { conversationId: 'workflow-exec' });
                trustScore = trustEval.trustScore.overall;
                // If this is a VALIDATOR agent, the output might be the validation result itself
                // But for now, we just execute the LLM.
            }
            else if (step.type === 'function') {
                // Placeholder for function execution (e.g. web search, database query)
                output = `Function execution not yet implemented for ${step.name}`;
            }
            else {
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
        }
        catch (error) {
            return {
                stepId: step.id,
                agentId: step.agentId,
                status: 'failed',
                input: 'error',
                output: null,
                error: (0, error_utils_1.getErrorMessage)(error),
                startTime,
                endTime: new Date()
            };
        }
    }
    /**
     * Create a default "Coordinator-Executor-Validator" workflow
     */
    async createCEVTemplate(tenantId, agents) {
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
                    agentId: new mongoose_1.Types.ObjectId(agents.coordinator),
                    role: 'coordinator',
                    inputTemplate: 'Create a detailed execution plan for this request: {{input}}',
                    dependencies: []
                },
                {
                    id: 'step-2-exec',
                    name: 'Execute Task',
                    type: 'llm',
                    agentId: new mongoose_1.Types.ObjectId(agents.executor),
                    role: 'executor',
                    inputTemplate: 'Execute the following plan:\n\n{{step-1-coord}}',
                    dependencies: ['step-1-coord']
                },
                {
                    id: 'step-3-valid',
                    name: 'Validate Result',
                    type: 'llm',
                    agentId: new mongoose_1.Types.ObjectId(agents.validator),
                    role: 'validator',
                    inputTemplate: 'Validate the following output for accuracy, safety, and completeness. If good, say "VALID". If bad, explain why.\n\nOriginal Request: {{input}}\n\nOutput to Verify:\n{{step-2-exec}}',
                    dependencies: ['step-2-exec']
                }
            ]
        });
    }
}
exports.OrchestrationService = OrchestrationService;
exports.orchestrationService = new OrchestrationService();
