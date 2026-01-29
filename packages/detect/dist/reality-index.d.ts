/**
 * Reality Index Calculator (0-10 scale)
 *
 * Dimension 1 of SONATE Framework
 * Measures: Mission alignment, contextual coherence, technical accuracy, authenticity
 */
import { AIInteraction } from './index';
export declare class RealityIndexCalculator {
    calculate(interaction: AIInteraction): Promise<number>;
    private scoreMissionAlignment;
    private scoreContextualCoherence;
    private scoreTechnicalAccuracy;
    private scoreAuthenticity;
}
//# sourceMappingURL=reality-index.d.ts.map