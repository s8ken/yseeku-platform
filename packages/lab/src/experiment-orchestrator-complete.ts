/**
 * Experiment Orchestrator
 * Core orchestration system for managing multi-agent experiments
 * Implements double-blind protocols and integrity verification
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
  ExperimentConfig,
  ExperimentRun,
  Trial,
  Evaluation,
  AgentRole,
  AgentMessage,
  MessageTypes,
  MessageBuilder,
  InMemoryAgentBus,
  ExperimentError,
  IntegrityError,
  SymbiDimension,
} from './types';
import { AgentBus } from './agent-bus';

/**
 * Experiment Orchestrator
 * Manages the lifecycle of experiments with double-blind integrity
 */
export class ExperimentOrchestrator {
  private bus: AgentBus;
  private activeRuns: Map<string, ExperimentRun> = new Map();
  private slotMappings: Map<string, Record<string, string>> = new Map(); // runId -> slotMapping

  constructor(bus?: AgentBus) {
    this.bus = bus || new InMemoryAgentBus();
    this.setupMessageHandlers();
  }

  /**
   * Start a new experiment run
   */
  async startExperiment(config: ExperimentConfig): Promise<ExperimentRun> {
    const runId = uuidv4();
    const randomSeed = this.generateSecureRandomSeed();
    
    const run: ExperimentRun = {
      id: runId,
      experimentId: config.name, // Using name as experiment ID for now
      status: "QUEUED",
      totalTrials: config.tasks.length,
      completedTrials: 0,
      failedTrials: 0,
      randomSeed,
      totalCostUsd: 0,
      createdAt: new Date().toISOString(),
    };

    this.activeRuns.set(runId, run);

    // Generate secure slot mapping for double-blind protocol
    const slotMapping = this.generateSlotMapping(config.variants, randomSeed);
    this.slotMappings.set(runId, slotMapping);

    // Notify agents of experiment start
    const startMessage = new MessageBuilder("CONDUCTOR")
      .to("OVERSEER")
      .type(MessageTypes.EXPERIMENT_START)
      .payload({ config, run, slotMapping })
      .experiment(config.name)
      .run(runId)
      .build();

    await this.bus.publish(startMessage);

    // Queue the run for execution
    await this.queueRun(run, config, slotMapping);

    return run;
  }

  /**
   * Queue a run for execution
   */
  private async queueRun(run: ExperimentRun, config: ExperimentConfig, slotMapping: Record<string, string>): Promise<void> {
    // Update run status
    run.status = "RUNNING";
    run.startedAt = new Date().toISOString();

    // Process trials sequentially for v1 (can be made parallel later)
    for (let i = 0; i < config.tasks.length; i++) {
      const task = config.tasks[i];
      const trialId = uuidv4();

      try {
        await this.executeTrial(run.id, config, task, trialId, slotMapping);
        run.completedTrials++;
      } catch (error) {
        console.error(`Trial ${trialId} failed:`, error);
        run.failedTrials++;
        
        // Notify overseer of failure
        const failureMessage = new MessageBuilder("CONDUCTOR")
          .to("OVERSEER")
          .type(MessageTypes.TRIAL_FAILED)
          .payload({ trialId, taskId: task.id, error: error.message })
          .experiment(config.name)
          .run(run.id)
          .trial(trialId)
          .build();

        await this.bus.publish(failureMessage);
      }
    }

    // Complete the run
    await this.completeRun(run, config);
  }

  /**
   * Execute a single trial with double-blind integrity
   */
  private async executeTrial(
    runId: string, 
    config: ExperimentConfig, 
    task: any, 
    trialId: string, 
    slotMapping: Record<string, string>
  ): Promise<void> {
    // Create trial record
    const trial: Trial = {
      id: trialId,
      runId,
      experimentId: config.name,
      taskId: task.id,
      status: "PENDING",
      slotMapping,
      createdAt: new Date().toISOString(),
    };

    // Notify variants to generate responses
    const outputs: Record<string, string> = {};
    
    for (const [slot, variantId] of Object.entries(slotMapping)) {
      const variant = config.variants.find(v => v.id === variantId);
      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      // Request response from variant
      const requestMessage = new MessageBuilder("CONDUCTOR")
        .to("VARIANT")
        .type(MessageTypes.TRIAL_REQUEST)
        .payload({
          task,
          variantConfig: variant,
          slot,
        })
        .experiment(config.name)
        .run(runId)
        .trial(trialId)
        .build();

      await this.bus.publish(requestMessage);

      // For v1, we'll simulate the response (in real implementation, this would be async)
      // TODO: Implement proper async response handling
      const response = await this.simulateVariantResponse(variant, task);
      outputs[slot] = response;
    }

    trial.outputs = outputs;
    trial.status = "COMPLETED";

    // Request evaluation
    await this.requestEvaluation(trial, config, outputs);

    // Calculate integrity hash
    trial.integrityHash = this.calculateTrialIntegrityHash(trial, config);
  }

  /**
   * Request evaluation of trial outputs
   */
  private async requestEvaluation(
    trial: Trial, 
    config: ExperimentConfig, 
    outputs: Record<string, string>
  ): Promise<void> {
    const evaluationMessage = new MessageBuilder("CONDUCTOR")
      .to("EVALUATOR")
      .type(MessageTypes.EVALUATION_REQUEST)
      .payload({
        task: config.tasks.find(t => t.id === trial.taskId),
        outputs,
        evaluationCriteria: config.evaluationCriteria,
        symbiDimensions: config.symbiDimensions,
      })
      .experiment(trial.experimentId)
      .run(trial.runId)
      .trial(trial.id)
      .build();

    await this.bus.publish(evaluationMessage);

    // For v1, simulate evaluation
    const evaluation = await this.simulateEvaluation(trial, config, outputs);
    trial.evaluations = [evaluation];
  }

  /**
   * Complete a run and calculate final integrity
   */
  private async completeRun(run: ExperimentRun, config: ExperimentConfig): Promise<void> {
    run.status = "COMPLETED";
    run.completedAt = new Date().toISOString();

    // Calculate run-level integrity hash
    run.integrityHash = this.calculateRunIntegrityHash(run, config);

    // Notify overseer of completion
    const completionMessage = new MessageBuilder("CONDUCTOR")
      .to("OVERSEER")
      .type(MessageTypes.EXPERIMENT_END)
      .payload({ run, config })
      .experiment(config.name)
      .run(run.id)
      .build();

    await this.bus.publish(completionMessage);

    // Clean up mappings for privacy
    this.slotMappings.delete(run.id);
  }

  /**
   * Generate secure slot mapping for double-blind protocol
   */
  private generateSlotMapping(variants: any[], randomSeed: number): Record<string, string> {
    const slots = ['A', 'B', 'C', 'D'].slice(0, variants.length);
    const shuffled = this.secureShuffle([...variants], randomSeed);
    
    const mapping: Record<string, string> = {};
    slots.forEach((slot, index) => {
      mapping[slot] = shuffled[index].id;
    });

    return mapping;
  }

  /**
   * Cryptographically secure shuffle
   */
  private secureShuffle<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    
    // Use crypto for v1, can be enhanced with better CSPRNG later
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomBytes = crypto.randomBytes(4);
      const randomValue = randomBytes.readUInt32BE(0) / 0xFFFFFFFF;
      const j = Math.floor(randomValue * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Generate secure random seed
   */
  private generateSecureRandomSeed(): number {
    return crypto.randomBytes(4).readUInt32BE(0);
  }

  /**
   * Calculate trial integrity hash
   */
  private calculateTrialIntegrityHash(trial: Trial, config: ExperimentConfig): string {
    const hashInput = {
      experimentConfig: {
        name: config.name,
        variants: config.variants.map(v => ({ id: v.id, name: v.name })),
        tasks: config.tasks.map(t => ({ id: t.id, content: t.content })),
      },
      trial: {
        id: trial.id,
        taskId: trial.taskId,
        slotMapping: trial.slotMapping,
        outputs: trial.outputs,
        evaluations: trial.evaluations?.map(e => ({
          winnerSlot: e.winnerSlot,
          scores: e.scores,
        })),
      },
    };

    return crypto.createHash('sha256').update(JSON.stringify(hashInput)).digest('hex');
  }

  /**
   * Calculate run integrity hash
   */
  private calculateRunIntegrityHash(run: ExperimentRun, config: ExperimentConfig): string {
    // This would include all trial hashes in real implementation
    const hashInput = {
      experimentConfig: {
        name: config.name,
        randomSeed: run.randomSeed,
      },
      run: {
        id: run.id,
        totalTrials: run.totalTrials,
        completedTrials: run.completedTrials,
        failedTrials: run.failedTrials,
      },
    };

    return crypto.createHash('sha256').update(JSON.stringify(hashInput)).digest('hex');
  }

  /**
   * Setup message handlers for different agent roles
   */
  private setupMessageHandlers(): void {
    // Variant handler
    this.bus.subscribe("VARIANT", async (message: AgentMessage) => {
      // Handle trial requests and generate responses
      console.log(`Variant received: ${message.type}`);
    });

    // Evaluator handler
    this.bus.subscribe("EVALUATOR", async (message: AgentMessage) => {
      // Handle evaluation requests
      console.log(`Evaluator received: ${message.type}`);
    });

    // Overseer handler
    this.bus.subscribe("OVERSEER", async (message: AgentMessage) => {
      // Handle experiment lifecycle events
      console.log(`Overseer received: ${message.type}`);
    });
  }

  /**
   * Simulate variant response (for v1 development)
   */
  private async simulateVariantResponse(variant: any, task: any): Promise<string> {
    // Simulate different response styles based on variant configuration
    const responses = [
      `Based on my analysis of "${task.content}", I would recommend a comprehensive approach that considers all stakeholders.`,
      `Here's a concise solution for "${task.content}": Focus on the core issue and implement step-by-step.`,
      `Let me break down "${task.content}" into manageable components and address each systematically.`,
    ];

    // Simple deterministic selection based on variant ID
    const index = parseInt(variant.id.replace(/\D/g, '')) % responses.length;
    return responses[index];
  }

  /**
   * Simulate evaluation (for v1 development)
   */
  private async simulateEvaluation(trial: Trial, config: any, outputs: Record<string, string>): Promise<any> {
    const slots = Object.keys(outputs);
    const winnerIndex = Math.floor(Math.random() * slots.length);
    const winnerSlot = slots[winnerIndex];

    return {
      id: uuidv4(),
      trialId: trial.id,
      evaluatorType: "AI",
      winnerSlot,
      scores: {
        A: Math.random() * 10,
        B: Math.random() * 10,
      },
      evaluatedAt: new Date().toISOString(),
      confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
    };
  }

  /**
   * Get active runs
   */
  getActiveRuns(): ExperimentRun[] {
    return Array.from(this.activeRuns.values());
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): ExperimentRun | undefined {
    return this.activeRuns.get(runId);
  }

  /**
   * Cancel a running experiment
   */
  async cancelRun(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new ExperimentError("Run not found", "RUN_NOT_FOUND", undefined, runId);
    }

    if (run.status === "RUNNING") {
      run.status = "CANCELLED";
      run.completedAt = new Date().toISOString();
      
      // Notify overseer
      const cancelMessage = new MessageBuilder("CONDUCTOR")
        .to("OVERSEER")
        .type(MessageTypes.EXPERIMENT_END)
        .payload({ run, reason: "CANCELLED" })
        .experiment(run.experimentId)
        .run(runId)
        .build();

      await this.bus.publish(cancelMessage);
    }
  }
}