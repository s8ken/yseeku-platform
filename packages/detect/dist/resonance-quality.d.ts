/**
 * Resonance Quality Measurer (STRONG/ADVANCED/BREAKTHROUGH)
 *
 * Dimension 4 of SONATE Framework
 * Evaluates: Creativity, synthesis quality, innovation markers
 *
 * ENHANCED: Now integrates with the Python-based Resonance Engine
 * for deep semantic analysis and vector alignment.
 */
import { AIInteraction } from './index';
export declare class ResonanceQualityMeasurer {
    private client;
    constructor(baseUrl?: string);
    measure(interaction: AIInteraction): Promise<'STRONG' | 'ADVANCED' | 'BREAKTHROUGH'>;
    private mapResonanceToLevel;
    private scoreCreativity;
    private scoreSynthesis;
    private scoreInnovation;
}
