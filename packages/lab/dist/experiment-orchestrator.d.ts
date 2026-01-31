/**
 * ExperimentOrchestrator - Manages double-blind experiments
 *
 * This is the main entry point for SONATE Lab. It orchestrates
 * multi-variant experiments with statistical validation.
 *
 * HARD ISOLATION: Experiments run in isolated sandbox with synthetic data only.
 */
import { ExperimentConfig, ExperimentResult } from './index';
export declare class ExperimentOrchestrator {
    private doubleBlind;
    private statsEngine;
    private agentSystem;
    constructor();
    /**
     * Create and run a double-blind experiment
     *
     * Use case: "Does constitutional AI perform better than directive AI?"
     *
     * @param config - Experiment configuration
     * @returns Full experiment results with statistical analysis
     */
    createExperiment(config: ExperimentConfig): Promise<string>;
    /**
     * Run experiment and collect results
     */
    runExperiment(experiment_id: string): Promise<ExperimentResult>;
    /**
     * Export experiment data for publication
     */
    exportData(experiment_id: string, format: 'csv' | 'json' | 'jsonl'): Promise<string>;
    private getResults;
    private toCSV;
    private toJSONL;
}
