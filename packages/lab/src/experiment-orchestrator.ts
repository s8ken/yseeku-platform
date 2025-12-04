/**
 * ExperimentOrchestrator - Manages double-blind experiments
 * 
 * This is the main entry point for SONATE Lab. It orchestrates
 * multi-variant experiments with statistical validation.
 * 
 * HARD ISOLATION: Experiments run in isolated sandbox with synthetic data only.
 */

import { ExperimentConfig, ExperimentResult, VariantResult } from './index';
import { DoubleBlindProtocol } from './double-blind-protocol';
import { StatisticalEngine } from './statistical-engine';
import { MultiAgentSystem } from './multi-agent-system';

export class ExperimentOrchestrator {
  private doubleBlind: DoubleBlindProtocol;
  private statsEngine: StatisticalEngine;
  private agentSystem: MultiAgentSystem;

  constructor() {
    this.doubleBlind = new DoubleBlindProtocol();
    this.statsEngine = new StatisticalEngine();
    this.agentSystem = new MultiAgentSystem();
  }

  /**
   * Create and run a double-blind experiment
   * 
   * Use case: "Does constitutional AI perform better than directive AI?"
   * 
   * @param config - Experiment configuration
   * @returns Full experiment results with statistical analysis
   */
  async createExperiment(config: ExperimentConfig): Promise<string> {
    // Generate unique experiment ID
    const experiment_id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize double-blind protocol
    await this.doubleBlind.initialize(experiment_id, config);

    console.log(`[Experiment ${experiment_id}] Initialized with ${config.variants.length} variants`);
    return experiment_id;
  }

  /**
   * Run experiment and collect results
   */
  async runExperiment(experiment_id: string): Promise<ExperimentResult> {
    console.log(`[Experiment ${experiment_id}] Starting execution...`);

    // Get experiment config
    const config = await this.doubleBlind.getConfig(experiment_id);

    // Run all variants (double-blind)
    const variantResults: VariantResult[] = [];

    for (const variant of config.variants) {
      console.log(`[Experiment ${experiment_id}] Running variant: ${variant.name}`);
      
      const result = await this.agentSystem.runVariant(variant, config.test_cases);
      variantResults.push(result);
    }

    // Statistical analysis
    console.log(`[Experiment ${experiment_id}] Performing statistical analysis...`);
    const statistical_analysis = await this.statsEngine.analyze(variantResults);

    // Unblind experiment
    await this.doubleBlind.unblind(experiment_id);

    return {
      experiment_id,
      variant_results: variantResults,
      statistical_analysis,
      timestamp: Date.now(),
    };
  }

  /**
   * Export experiment data for publication
   */
  async exportData(experiment_id: string, format: 'csv' | 'json' | 'jsonl'): Promise<string> {
    const results = await this.getResults(experiment_id);

    switch (format) {
      case 'csv':
        return this.toCSV(results);
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'jsonl':
        return this.toJSONL(results);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async getResults(experiment_id: string): Promise<ExperimentResult> {
    // Retrieve from storage (implement based on your storage solution)
    throw new Error('Not implemented: Storage integration needed');
  }

  private toCSV(results: ExperimentResult): string {
    // Convert to CSV format for spreadsheet analysis
    const rows: string[] = [
      'experiment_id,variant_id,test_case_id,reality_index,trust_protocol,ethical_alignment,canvas_parity',
    ];

    for (const variantResult of results.variant_results) {
      for (const tcResult of variantResult.test_case_results) {
        const dr = tcResult.detection_result;
        rows.push([
          results.experiment_id,
          variantResult.variant_id,
          tcResult.test_case_id,
          dr.reality_index,
          dr.trust_protocol,
          dr.ethical_alignment,
          dr.canvas_parity,
        ].join(','));
      }
    }

    return rows.join('\n');
  }

  private toJSONL(results: ExperimentResult): string {
    // JSONL format (one JSON object per line) for ML pipelines
    const lines: string[] = [];

    for (const variantResult of results.variant_results) {
      for (const tcResult of variantResult.test_case_results) {
        lines.push(JSON.stringify({
          experiment_id: results.experiment_id,
          variant_id: variantResult.variant_id,
          test_case_id: tcResult.test_case_id,
          ...tcResult.detection_result,
        }));
      }
    }

    return lines.join('\n');
  }
}
