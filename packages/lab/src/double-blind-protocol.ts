/**
 * Double-Blind Protocol - Prevents experimenter bias
 *
 * Ensures that neither the AI models nor the evaluators know
 * which variant they are testing until experiment completion.
 */

import { ExperimentConfig } from './index';

export class DoubleBlindProtocol {
  private blinded: Map<string, BlindedExperiment> = new Map();

  async initialize(experiment_id: string, config: ExperimentConfig): Promise<void> {
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

  async getConfig(experiment_id: string): Promise<ExperimentConfig> {
    const blinded = this.blinded.get(experiment_id);
    if (!blinded) {
      throw new Error(`Experiment ${experiment_id} not found`);
    }
    return blinded.config;
  }

  async unblind(experiment_id: string): Promise<void> {
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

  isBlinded(experiment_id: string): boolean {
    return this.blinded.get(experiment_id)?.is_blinded ?? false;
  }
}

interface BlindedExperiment {
  config: ExperimentConfig;
  mapping: Map<string, string>; // blind_id -> original_id
  is_blinded: boolean;
}
