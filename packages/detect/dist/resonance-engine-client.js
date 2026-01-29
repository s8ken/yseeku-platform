"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceEngineClient = void 0;
class ResonanceEngineClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000';
    }
    async calculateResonance(userInput, aiResponse, conversationHistory = [], interactionId = 'unknown') {
        try {
            const response = await fetch(`${this.baseUrl}/calculate_resonance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_input: userInput,
                    ai_response: aiResponse,
                    conversation_history: conversationHistory,
                    interaction_id: interactionId,
                }),
            });
            if (!response.ok) {
                return null;
            }
            return (await response.json());
        }
        catch (error) {
            return null;
        }
    }
    async detectDrift(conversationScores) {
        try {
            const response = await fetch(`${this.baseUrl}/detect_drift`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation_scores: conversationScores,
                }),
            });
            if (!response.ok) {
                return false;
            }
            const data = (await response.json());
            return data.drift_detected;
        }
        catch (error) {
            return false;
        }
    }
    // Convert Python resonance result to TypeScript ResonanceQuality type
    static toResonanceQuality(result) {
        const score = result.resonance_metrics.R_m;
        let level = 'STRONG';
        if (score >= 0.85) {
            level = 'BREAKTHROUGH';
        }
        else if (score >= 0.7) {
            level = 'ADVANCED';
        }
        return {
            level,
            creativityScore: result.resonance_metrics.components.semantic_mirroring * 10,
            synthesisQuality: result.resonance_metrics.components.context_continuity * 10,
            innovationMarkers: result.resonance_metrics.components.vector_alignment * 10,
        };
    }
}
exports.ResonanceEngineClient = ResonanceEngineClient;
