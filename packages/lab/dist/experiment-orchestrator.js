"use strict";
/**
 * ExperimentOrchestrator - Manages double-blind experiments
 *
 * This is the main entry point for SONATE Lab. It orchestrates
 * multi-variant experiments with statistical validation.
 *
 * HARD ISOLATION: Experiments run in isolated sandbox with synthetic data only.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentOrchestrator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const double_blind_protocol_1 = require("./double-blind-protocol");
const multi_agent_system_1 = require("./multi-agent-system");
const statistical_engine_1 = require("./statistical-engine");
class ExperimentOrchestrator {
    constructor(storageDir) {
        this.doubleBlind = new double_blind_protocol_1.DoubleBlindProtocol();
        this.statsEngine = new statistical_engine_1.StatisticalEngine();
        this.agentSystem = new multi_agent_system_1.MultiAgentSystem();
        // Default to a local .sonate-lab directory if not specified
        this.storageDir = storageDir || path.join(process.cwd(), '.sonate-lab', 'results');
        this.ensureStorageDir();
    }
    ensureStorageDir() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
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
        const experiment_id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
        const result = {
            experiment_id,
            variant_results: variantResults,
            statistical_analysis,
            timestamp: Date.now(),
        };
        // Persist results
        await this.saveResults(result);
        return result;
    }
    /**
     * Save experiment results to storage
     */
    async saveResults(result) {
        const filePath = path.join(this.storageDir, `${result.experiment_id}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`[Experiment ${result.experiment_id}] Results saved to ${filePath}`);
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
        const filePath = path.join(this.storageDir, `${experiment_id}.json`);
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Results for experiment ${experiment_id} not found`);
            }
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Results for experiment ${experiment_id} not found`);
            }
            throw error;
        }
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
