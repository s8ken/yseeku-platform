/**
 * Resonance Quality Measurer (STRONG/ADVANCED/BREAKTHROUGH)
 *
 * Dimension 4 of SONATE Framework
 * Evaluates: Creativity, synthesis quality, innovation markers
 *
 * SCORING METHODS (in priority order):
 * 1. Python Resonance Engine (deep semantic analysis via ML)
 * 2. LLM Analysis (Claude-based content evaluation)
 * 3. Enhanced Heuristics (structural + keyword analysis)
 *
 * ENHANCED: Proper fallback chain with transparent method reporting
 */
import { AIInteraction } from './index';
export type ResonanceLevel = 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
export interface ResonanceAnalysisResult {
    level: ResonanceLevel;
    method: 'resonance-engine' | 'llm' | 'heuristic';
    scores: {
        creativity: number;
        synthesis: number;
        innovation: number;
        total: number;
    };
    indicators: string[];
    confidence: number;
}
export declare class ResonanceQualityMeasurer {
    private client;
    constructor(baseUrl?: string);
    measure(interaction: AIInteraction): Promise<ResonanceLevel>;
    /**
     * Full analysis with method transparency and score breakdown
     */
    analyze(interaction: AIInteraction): Promise<ResonanceAnalysisResult>;
    private mapResonanceToLevel;
    private scoreCreativity;
    private scoreSynthesis;
    private scoreInnovation;
}
