"use strict";
/**
 * ExperimentOrchestrator - Manages double-blind experiments
 *
 * This is the main entry point for SONATE Lab. It orchestrates
 * multi-variant experiments with statistical validation.
 *
 * HARD ISOLATION: Experiments run in isolated sandbox with synthetic data only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentOrchestrator = void 0;
const double_blind_protocol_1 = require("./double-blind-protocol");
const multi_agent_system_1 = require("./multi-agent-system");
const statistical_engine_1 = require("./statistical-engine");
class ExperimentOrchestrator {
    constructor() {
        this.doubleBlind = new double_blind_protocol_1.DoubleBlindProtocol();
        this.statsEngine = new statistical_engine_1.StatisticalEngine();
        this.agentSystem = new multi_agent_system_1.MultiAgentSystem();
    }
    /**
     * Create and run a double-blind experiment
     *
     * Use case: "Does constitutional AI perform better than directive AI?"
     *
     * @param config - Experiment configuration
     * @returns Full experiment results with statistical analysis
     */
    async createExperiment(config) {
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
    async runExperiment(experiment_id) {
        console.log(`[Experiment ${experiment_id}] Starting execution...`);
        // Get experiment config
        const config = await this.doubleBlind.getConfig(experiment_id);
        // Run all variants (double-blind)
        const variantResults = [];
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
    async exportData(experiment_id, format) {
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
    async getResults(experiment_id) {
        // Retrieve from storage (implement based on your storage solution)
        throw new Error('Not implemented: Storage integration needed');
    }
    toCSV(results) {
        // Convert to CSV format for spreadsheet analysis
        const rows = [
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
    toJSONL(results) {
        // JSONL format (one JSON object per line) for ML pipelines
        const lines = [];
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
exports.ExperimentOrchestrator = ExperimentOrchestrator;
