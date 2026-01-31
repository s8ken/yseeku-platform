import { AIInteraction } from './index';
export interface LLMAnalysisResult {
    resonance_score?: number;
    creativity_score?: number;
    synthesis_score?: number;
    innovation_score?: number;
    ethical_score?: number;
    limitations_acknowledged?: boolean;
    stakeholder_awareness?: boolean;
    ethical_reasoning?: boolean;
    is_adversarial?: boolean;
    analysis_method: 'llm' | 'heuristic';
    confidence?: number;
}
/**
 * Check if LLM analysis is available (API key configured)
 */
export declare function isLLMAvailable(): boolean;
/**
 * Get the LLM API status for debugging/transparency
 */
export declare function getLLMStatus(): {
    available: boolean;
    reason?: string;
};
/**
 * Analyze content with LLM for trust scoring
 * Returns structured analysis with clear indication of method used
 */
export declare function analyzeWithLLM(interaction: AIInteraction, type: 'resonance' | 'ethics' | 'comprehensive'): Promise<LLMAnalysisResult | null>;
