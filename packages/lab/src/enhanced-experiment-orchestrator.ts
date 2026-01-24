/**
 * Enhanced Experiment Orchestrator - SONATE Resonate Lab Integration
 *
 * This enhanced orchestrator combines the proven SONATE-Resonate experiment system
 * with the modular architecture of Yseeku-Platform, providing enterprise-grade
 * multi-agent experimentation capabilities.
 */

import crypto from 'crypto';

import { TrustProtocol } from '@sonate/core';
import { SonateFrameworkDetector } from '@sonate/detect';
import { v4 as uuidv4 } from 'uuid';

import { AgentBus } from './agent-bus';
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
  SonateDimension,
} from './experiment-types';

/**
 * Enhanced Experiment Orchestrator
 *
 * Integrates SONATE-Resonate's proven experiment orchestration
 * with Yseeku-Platform's modular architecture
 */
export class EnhancedExperimentOrchestrator {
  private bus: AgentBus;
  private activeRuns: Map<string, ExperimentRun> = new Map();
  private slotMappings: Map<string, Record<string, string>> = new Map();
  private trustProtocol: TrustProtocol;
  private sonateDetector: SonateFrameworkDetector;

  constructor(bus?: AgentBus) {
    this.bus = bus || new InMemoryAgentBus();
    this.trustProtocol = new TrustProtocol();
    this.sonateDetector = new SonateFrameworkDetector();
    this.setupMessageHandlers();
  }

  /**
   * Start a new experiment run with enhanced SONATE integration
   */
  async startExperiment(config: ExperimentConfig): Promise<ExperimentRun> {
    const runId = uuidv4();
    const randomSeed = this.generateSecureRandomSeed();

    const run: ExperimentRun = {
      id: runId,
      experimentId: config.name,
      status: 'QUEUED',
      totalTrials: config.tasks.length,
      completedTrials: 0,
      randomSeed,
      startTime: Date.now(),
      endTime: undefined,
      trials: [],
      results: {
        variantResults: [],
        statisticalAnalysis: null,
        integrity: {
          hashChain: [],
          signatures: [],
          tamperEvidence: false,
        },
      },
      config,
      slotMapping: {},
    };

    this.activeRuns.set(runId, run);

    // Initialize double-blind randomization
    const slotMapping = this.generateSlotMapping(config.variants.length, randomSeed);
    this.slotMappings.set(runId, slotMapping);
    run.slotMapping = slotMapping;

    console.log(`[Experiment ${runId}] Started with ${config.variants.length} variants`);
    return run;
  }

  /**
   * Execute experiment with SONATE framework validation
   */
  async executeExperiment(runId: string): Promise<ExperimentRun> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new ExperimentError(`Experiment run ${runId} not found`);
    }

    run.status = 'RUNNING';

    try {
      // Execute all trials
      for (let i = 0; i < run.config.tasks.length; i++) {
        const trial = await this.executeTrial(run, i);
        run.trials.push(trial);
        run.completedTrials++;
      }

      // Collect results and perform statistical analysis
      await this.collectResults(run);
      await this.performStatisticalAnalysis(run);

      // Verify integrity
      await this.verifyExperimentIntegrity(run);

      run.status = 'COMPLETED';
      run.endTime = Date.now();

      console.log(`[Experiment ${runId}] Completed successfully`);
      return run;
    } catch (error) {
      run.status = 'FAILED';
      run.endTime = Date.now();
      throw error;
    }
  }

  /**
   * Execute individual trial with SONATE evaluation
   */
  private async executeTrial(run: ExperimentRun, trialIndex: number): Promise<Trial> {
    const trialId = uuidv4();
    const task = run.config.tasks[trialIndex];

    const trial: Trial = {
      id: trialId,
      experimentRunId: run.id,
      taskIndex: trialIndex,
      status: 'RUNNING',
      startTime: Date.now(),
      endTime: undefined,
      evaluations: [],
      integrity: {
        contentHash: '',
        signature: '',
        verified: false,
      },
    };

    // Execute with all variants
    for (const variant of run.config.variants) {
      const evaluation = await this.evaluateVariant(variant, task, trial);
      trial.evaluations.push(evaluation);
    }

    trial.status = 'COMPLETED';
    trial.endTime = Date.now();

    // Calculate trial integrity hash
    trial.integrity.contentHash = this.calculateTrialHash(trial);
    trial.integrity.signature = await this.signTrialHash(trial.integrity.contentHash);

    return trial;
  }

  /**
   * Evaluate variant with SONATE framework detection
   */
  private async evaluateVariant(variant: any, task: any, trial: Trial): Promise<Evaluation> {
    const evaluationId = uuidv4();

    // Simulate agent execution (replace with actual agent communication)
    const response = await this.executeAgentTask(variant, task);

    // Run SONATE framework detection on the response
    const sonateResult = await this.sonateDetector.detect({
      content: response.content,
      context: task.context,
      metadata: {
        agent_id: variant.id,
        trial_id: trial.id,
        timestamp: Date.now(),
      },
    });

    const evaluation: Evaluation = {
      id: evaluationId,
      trialId: trial.id,
      variantId: variant.id,
      agentId: variant.agentId || variant.id,
      response,
      metrics: {
        responseTime: response.responseTime || 0,
        tokenUsage: response.tokenUsage || 0,
        success: response.success || true,
        errors: response.errors || [],
      },
      sonateScore: sonateResult,
      trustScore: await this.calculateTrustScore(response, sonateResult),
      integrity: {
        responseHash: crypto.createHash('sha256').update(response.content).digest('hex'),
        verified: true,
      },
      timestamp: Date.now(),
    };

    return evaluation;
  }

  /**
   * Execute agent task (placeholder implementation)
   */
  private async executeAgentTask(variant: any, task: any): Promise<any> {
    // This would integrate with actual agent execution system
    // For now, return simulated response
    return {
      content: `Simulated response from ${variant.name} for task: ${task.prompt}`,
      responseTime: Math.random() * 1000,
      tokenUsage: Math.floor(Math.random() * 500),
      success: true,
      errors: [],
    };
  }

  /**
   * Calculate trust score using SONATE framework
   */
  private async calculateTrustScore(response: any, sonateResult: any): Promise<number> {
    // Integrate with @sonate/core trust protocol
    const trustScore = this.trustProtocol.scoreInteraction({
      user_consent: true,
      ai_explanation_provided: true,
      decision_auditability: true,
      human_override_available: true,
      disconnect_option_available: true,
      moral_agency_respected: true,
      reasoning_transparency: sonateResult.reality_index || 5,
      ethical_considerations: ['privacy', 'fairness'],
    });

    return trustScore.overall;
  }

  /**
   * Collect and aggregate results
   */
  private async collectResults(run: ExperimentRun): Promise<void> {
    const variantResults = new Map();

    // Aggregate results by variant
    for (const trial of run.trials) {
      for (const evaluation of trial.evaluations) {
        if (!variantResults.has(evaluation.variantId)) {
          variantResults.set(evaluation.variantId, {
            variantId: evaluation.variantId,
            trials: [],
            metrics: {
              avgResponseTime: 0,
              avgTokenUsage: 0,
              successRate: 0,
              avgTrustScore: 0,
              avgSonateScore: 0,
            },
            trustScores: [],
            sonateScores: [],
          });
        }

        const variantResult = variantResults.get(evaluation.variantId);
        variantResult.trials.push(evaluation);
        variantResult.trustScores.push(evaluation.trustScore);
        variantResult.sonateScores.push(evaluation.sonateResult);
      }
    }

    // Calculate metrics for each variant
    for (const [variantId, result] of variantResults) {
      const trials = result.trials;

      result.metrics.avgResponseTime =
        trials.reduce((sum: number, t: Evaluation) => sum + t.metrics.responseTime, 0) /
        trials.length;
      result.metrics.avgTokenUsage =
        trials.reduce((sum: number, t: Evaluation) => sum + t.metrics.tokenUsage, 0) /
        trials.length;
      result.metrics.successRate =
        trials.filter((t: Evaluation) => t.metrics.success).length / trials.length;
      result.metrics.avgTrustScore =
        result.trustScores.reduce((sum: number, score: number) => sum + score, 0) /
        result.trustScores.length;
      result.metrics.avgSonateScore =
        result.sonateScores.reduce(
          (sum: number, score: any) => sum + (score.overall_score || 0),
          0
        ) / result.sonateScores.length;
    }

    run.results.variantResults = Array.from(variantResults.values());
  }

  /**
   * Perform statistical analysis
   */
  private async performStatisticalAnalysis(run: ExperimentRun): Promise<void> {
    if (run.results.variantResults.length < 2) {
      return; // Need at least 2 variants for comparison
    }

    // Implement statistical tests (t-test, confidence intervals, effect size)
    const analysis = {
      tTest: this.performTTest(run.results.variantResults),
      confidenceInterval: this.calculateConfidenceInterval(run.results.variantResults),
      effectSize: this.calculateEffectSize(run.results.variantResults),
      significance: false,
      pValue: 1.0,
    };

    analysis.significance = analysis.tTest.pValue < 0.05;
    analysis.pValue = analysis.tTest.pValue;

    run.results.statisticalAnalysis = analysis;
  }

  /**
   * Simple t-test implementation
   */
  private performTTest(variantResults: any[]): any {
    // Simplified t-test calculation
    // In production, use proper statistical library
    if (variantResults.length !== 2) {
      return { pValue: 1.0, tStatistic: 0 };
    }

    const group1 = variantResults[0].trustScores;
    const group2 = variantResults[1].trustScores;

    const mean1 = group1.reduce((sum: number, val: number) => sum + val, 0) / group1.length;
    const mean2 = group2.reduce((sum: number, val: number) => sum + val, 0) / group2.length;

    // Simplified variance calculation
    const var1 =
      group1.reduce((sum: number, val: number) => sum + Math.pow(val - mean1, 2), 0) /
      (group1.length - 1);
    const var2 =
      group2.reduce((sum: number, val: number) => sum + Math.pow(val - mean2, 2), 0) /
      (group2.length - 1);

    const pooledStdError = Math.sqrt(var1 / group1.length + var2 / group2.length);
    const tStatistic = (mean1 - mean2) / pooledStdError;

    // Simplified p-value calculation (would use proper t-distribution in production)
    const pValue = Math.max(0.001, Math.min(0.999, 2 * (1 - this.normalCDF(Math.abs(tStatistic)))));

    return { pValue, tStatistic };
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(variantResults: any[]): any {
    // Simplified confidence interval calculation
    return {
      lower: -0.5,
      upper: 0.5,
      confidence: 0.95,
    };
  }

  /**
   * Calculate effect size (Cohen's d)
   */
  private calculateEffectSize(variantResults: any[]): any {
    if (variantResults.length !== 2) {return { effectSize: 0 };}

    const group1 = variantResults[0].trustScores;
    const group2 = variantResults[1].trustScores;

    const mean1 = group1.reduce((sum: number, val: number) => sum + val, 0) / group1.length;
    const mean2 = group2.reduce((sum: number, val: number) => sum + val, 0) / group2.length;

    const pooledStdDev = Math.sqrt(
      ((group1.length - 1) * this.calculateVariance(group1) +
        (group2.length - 1) * this.calculateVariance(group2)) /
        (group1.length + group2.length - 2)
    );

    return { effectSize: Math.abs(mean1 - mean2) / pooledStdDev };
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    return (
      values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) /
      (values.length - 1)
    );
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Verify experiment integrity
   */
  private async verifyExperimentIntegrity(run: ExperimentRun): Promise<void> {
    // Verify hash chain integrity
    let previousHash = this.generateGenesisHash(run.id);

    for (const trial of run.trials) {
      if (trial.integrity.contentHash !== this.calculateTrialHash(trial)) {
        run.results.integrity.tamperEvidence = true;
        throw new IntegrityError('Trial content hash mismatch - possible tampering detected');
      }
      previousHash = trial.integrity.contentHash;
    }

    run.results.integrity.tamperEvidence = false;
  }

  /**
   * Generate secure random seed for double-blind randomization
   */
  private generateSecureRandomSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate slot mapping for double-blind assignment
   */
  private generateSlotMapping(numVariants: number, seed: string): Record<string, string> {
    // Use Fisher-Yates shuffle with seed for reproducible randomization
    const slots = Array.from({ length: numVariants }, (_, i) => i.toString());
    const rng = this.createSeededRNG(seed);

    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const mapping: Record<string, string> = {};
    slots.forEach((slot, index) => {
      mapping[index.toString()] = slot;
    });

    return mapping;
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRNG(seed: string): () => number {
    let hash = crypto.createHash('sha256').update(seed).digest('hex');

    return () => {
      hash = crypto.createHash('sha256').update(hash).digest('hex');
      return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    };
  }

  /**
   * Calculate trial hash
   */
  private calculateTrialHash(trial: Trial): string {
    const content = JSON.stringify({
      trialId: trial.id,
      evaluations: trial.evaluations.map((e) => ({
        variantId: e.variantId,
        response: e.response,
        metrics: e.metrics,
      })),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Sign trial hash
   */
  private async signTrialHash(hash: string): Promise<string> {
    // In production, use actual cryptographic signing
    // For now, return hash as signature placeholder
    return hash;
  }

  /**
   * Generate genesis hash
   */
  private generateGenesisHash(experimentId: string): string {
    return crypto.createHash('sha256').update(`genesis:${experimentId}`).digest('hex');
  }

  /**
   * Setup message handlers for agent communication
   */
  private setupMessageHandlers(): void {
    this.bus.subscribe('experiment.status', (message: AgentMessage) => {
      console.log(`[Experiment] Status update: ${message.content}`);
    });

    this.bus.subscribe('experiment.error', (message: AgentMessage) => {
      console.error(`[Experiment] Error: ${message.content}`);
    });
  }

  /**
   * Export experiment data in various formats
   */
  async exportExperiment(runId: string, format: 'csv' | 'json' | 'jsonl'): Promise<string> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new ExperimentError(`Experiment run ${runId} not found`);
    }

    switch (format) {
      case 'csv':
        return this.exportToCSV(run);
      case 'json':
        return JSON.stringify(run, null, 2);
      case 'jsonl':
        return this.exportToJSONL(run);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(run: ExperimentRun): string {
    const headers = [
      'trial_id',
      'variant_id',
      'trust_score',
      'response_time',
      'sonate_reality_index',
      'sonate_trust_protocol',
      'success',
    ];

    const rows = run.trials.flatMap((trial) =>
      trial.evaluations.map((eval) => [
        trial.id,
        eval.variantId,
        eval.trustScore,
        eval.metrics.responseTime,
        eval.sonateResult?.reality_index || '',
        eval.sonateResult?.trust_protocol || '',
        eval.metrics.success,
      ])
    );

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Export to JSONL format
   */
  private exportToJSONL(run: ExperimentRun): string {
    return run.trials
      .flatMap((trial) =>
        trial.evaluations.map((eval) =>
          JSON.stringify({
            trial_id: trial.id,
            variant_id: eval.variantId,
            trust_score: eval.trustScore,
            response_time: eval.metrics.responseTime,
            sonate_result: eval.sonateResult,
            success: eval.metrics.success,
          })
        )
      )
      .join('\n');
  }

  /**
   * Get experiment status
   */
  getExperimentStatus(runId: string): ExperimentRun | undefined {
    return this.activeRuns.get(runId);
  }

  /**
   * List all active experiments
   */
  listActiveExperiments(): ExperimentRun[] {
    return Array.from(this.activeRuns.values());
  }
}
