/**
 * Double-Blind Protocol - Prevents experimenter bias
 *
 * Ensures that neither the AI models nor the evaluators know
 * which variant they are testing until experiment completion.
 */
import { ExperimentConfig } from './index';
export declare class DoubleBlindProtocol {
    private blinded;
    initialize(experiment_id: string, config: ExperimentConfig): Promise<void>;
    getConfig(experiment_id: string): Promise<ExperimentConfig>;
    unblind(experiment_id: string): Promise<void>;
    isBlinded(experiment_id: string): boolean;
}
//# sourceMappingURL=double-blind-protocol.d.ts.map