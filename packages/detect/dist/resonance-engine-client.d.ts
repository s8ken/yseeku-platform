import { ResonanceQuality } from './sonate-types';
export interface ResonanceMetrics {
    R_m: number;
    status: string;
    components: {
        vector_alignment: number;
        context_continuity: number;
        semantic_mirroring: number;
        ethical_awareness: number;
        entropy_penalty: number;
    };
    linguistic_vectors_active: string[];
    dominant_persona: string;
    persona_confidence: number;
}
export interface ResonanceResult {
    interaction_id: string;
    timestamp: string;
    resonance_metrics: ResonanceMetrics;
    user_input_hash: string;
    ai_response_hash: string;
    signature: string;
}
export declare class ResonanceEngineClient {
    private baseUrl;
    constructor(baseUrl?: string);
    calculateResonance(userInput: string, aiResponse: string, conversationHistory?: string[], interactionId?: string): Promise<ResonanceResult | null>;
    detectDrift(conversationScores: number[]): Promise<boolean>;
    static toResonanceQuality(result: ResonanceResult): ResonanceQuality;
}
