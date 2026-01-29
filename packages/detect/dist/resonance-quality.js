"use strict";
/**
 * Resonance Quality Measurer (STRONG/ADVANCED/BREAKTHROUGH)
 *
 * Dimension 4 of SONATE Framework
 * Evaluates: Creativity, synthesis quality, innovation markers
 *
 * ENHANCED: Now integrates with the Python-based Resonance Engine
 * for deep semantic analysis and vector alignment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResonanceQualityMeasurer = void 0;
const resonance_engine_client_1 = require("./resonance-engine-client");
const llm_client_1 = require("./llm-client");
class ResonanceQualityMeasurer {
    constructor(baseUrl) {
        this.client = new resonance_engine_client_1.ResonanceEngineClient(baseUrl || process.env.RESONANCE_ENGINE_URL || 'http://localhost:8000');
    }
    async measure(interaction) {
        // Try to use the advanced Python engine first
        try {
            // Extract conversation history if available in metadata
            const history = Array.isArray(interaction.metadata?.history)
                ? interaction.metadata.history
                : [];
            // Extract user input if available (context often contains the prompt)
            const userInput = interaction.context || 'unknown query';
            const result = await this.client.calculateResonance(userInput, interaction.content, history, interaction.metadata?.interaction_id);
            if (result) {
                return this.mapResonanceToLevel(result);
            }
        }
        catch (error) {
            // Fallback to basic logic if engine is unavailable
            // console.warn("Resonance Engine unavailable, using fallback logic");
        }
        // Try LLM Analysis (Enterprise Grade)
        try {
            const llmResult = await (0, llm_client_1.analyzeWithLLM)(interaction, 'resonance');
            if (llmResult) {
                const total = (llmResult.creativity_score || 0) + (llmResult.synthesis_score || 0) + (llmResult.innovation_score || 0);
                // Scores are 0-10 each, total 0-30.
                if (total >= 24)
                    return 'BREAKTHROUGH';
                if (total >= 18)
                    return 'ADVANCED';
                return 'STRONG';
            }
        }
        catch (e) {
            // Ignore and proceed to heuristic fallback
        }
        // FALLBACK LOGIC (Heuristic)
        const scores = {
            creativity: await this.scoreCreativity(interaction),
            synthesis: await this.scoreSynthesis(interaction),
            innovation: await this.scoreInnovation(interaction),
        };
        const totalScore = scores.creativity + scores.synthesis + scores.innovation;
        // Thresholds
        if (totalScore >= 24) {
            return 'BREAKTHROUGH';
        }
        if (totalScore >= 18) {
            return 'ADVANCED';
        }
        return 'STRONG';
    }
    mapResonanceToLevel(result) {
        const score = result.resonance_metrics.R_m;
        if (score >= 0.85) {
            return 'BREAKTHROUGH';
        }
        if (score >= 0.7) {
            return 'ADVANCED';
        }
        return 'STRONG';
    }
    async scoreCreativity(interaction) {
        // Measure creative elements (metaphors, novel connections)
        const hasCreativeMarkers = interaction.content.includes('imagine') ||
            interaction.content.includes('like') ||
            interaction.content.includes('consider');
        return hasCreativeMarkers ? 8 : 5;
    }
    async scoreSynthesis(interaction) {
        // Measure synthesis of multiple concepts
        const paragraphCount = interaction.content.split('\n\n').length;
        return Math.min(paragraphCount * 2, 10);
    }
    async scoreInnovation(interaction) {
        // Measure innovative thinking
        const hasInnovativeMarkers = interaction.content.toLowerCase().includes('novel') ||
            interaction.content.toLowerCase().includes('unique') ||
            interaction.content.toLowerCase().includes('innovative');
        return hasInnovativeMarkers ? 9 : 6;
    }
}
exports.ResonanceQualityMeasurer = ResonanceQualityMeasurer;
