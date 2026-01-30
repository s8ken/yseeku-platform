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
}
export declare function analyzeWithLLM(interaction: AIInteraction, type: 'resonance' | 'ethics' | 'comprehensive'): Promise<LLMAnalysisResult | null>;
