"use strict";
/**
 * Double-Blind Protocol - Prevents experimenter bias
 *
 * Ensures that neither the AI models nor the evaluators know
 * which variant they are testing until experiment completion.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoubleBlindProtocol = void 0;
class DoubleBlindProtocol {
    constructor() {
        this.blinded = new Map();
    }
    async initialize(experiment_id, config) {
        // Anonymize variants
        const anonymized_variants = config.variants.map((v, i) => ({
            ...v,
            blind_id: `variant_${String.fromCharCode(65 + i)}`, // A, B, C, etc.
            original_id: v.id,
        }));
        this.blinded.set(experiment_id, {
            config: {
                ...config,
                variants: anonymized_variants.map((v) => ({
                    ...v,
                    id: v.blind_id, // Replace with blind ID
                })),
            },
            mapping: new Map(anonymized_variants.map((v) => [v.blind_id, v.original_id])),
            is_blinded: true,
        });
    }
    async getConfig(experiment_id) {
        const blinded = this.blinded.get(experiment_id);
        if (!blinded) {
            throw new Error(`Experiment ${experiment_id} not found`);
        }
        return blinded.config;
    }
    async unblind(experiment_id) {
        const blinded = this.blinded.get(experiment_id);
        if (!blinded) {
            throw new Error(`Experiment ${experiment_id} not found`);
        }
        // Restore original IDs
        blinded.config.variants = blinded.config.variants.map((v) => ({
            ...v,
            id: blinded.mapping.get(v.id) || v.id,
        }));
        blinded.is_blinded = false;
        console.log(`[Experiment ${experiment_id}] Unblinded successfully`);
    }
    isBlinded(experiment_id) {
        return this.blinded.get(experiment_id)?.is_blinded ?? false;
    }
}
exports.DoubleBlindProtocol = DoubleBlindProtocol;
