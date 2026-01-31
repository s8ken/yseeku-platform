/**
 * Ethical Alignment Scorer (1-5 scale)
 *
 * Dimension 3 of SONATE Framework
 * Assesses: Limitations acknowledgment, stakeholder awareness, ethical reasoning
 *
 * SCORING METHODS:
 * 1. Primary: LLM-based content analysis (when ANTHROPIC_API_KEY available)
 * 2. Fallback: Enhanced heuristic analysis (keyword patterns + structural analysis)
 */
import { AIInteraction } from './index';
export interface EthicalAnalysisResult {
    score: number;
    method: 'llm' | 'heuristic';
    breakdown: {
        limitationsScore: number;
        stakeholderScore: number;
        ethicalReasoningScore: number;
    };
    indicators: string[];
}
export declare class EthicalAlignmentScorer {
    score(interaction: AIInteraction): Promise<number>;
    /**
     * Full analysis with method transparency and breakdown
     */
    analyze(interaction: AIInteraction): Promise<EthicalAnalysisResult>;
    private scoreLimitationsAcknowledgment;
    private scoreStakeholderAwareness;
    private scoreEthicalReasoning;
}
