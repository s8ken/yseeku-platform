"use strict";
/**
 * Canvas Parity Calculator (0-100 scale)
 *
 * Dimension 5 of SONATE Framework
 * Assesses: Human agency, AI contribution, transparency, collaboration quality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasParityCalculator = void 0;
class CanvasParityCalculator {
    async calculate(interaction) {
        const scores = await Promise.all([
            this.scoreHumanAgency(interaction),
            this.scoreAIContribution(interaction),
            this.scoreTransparency(interaction),
            this.scoreCollaborationQuality(interaction),
        ]);
        // Average of 4 components, scaled to 0-100
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return Math.round(avg);
    }
    async scoreHumanAgency(interaction) {
        // Does human retain decision-making power?
        const humanInControl = interaction.metadata.human_override_available === true;
        return humanInControl ? 90 : 60;
    }
    async scoreAIContribution(interaction) {
        // Is AI adding value (not just parroting)?
        const contentLength = interaction.content.length;
        const hasSubstance = contentLength > 100;
        return hasSubstance ? 85 : 50;
    }
    async scoreTransparency(interaction) {
        // Is AI transparent about its process?
        const hasExplanation = interaction.metadata.explanation_provided === true;
        return hasExplanation ? 95 : 65;
    }
    async scoreCollaborationQuality(interaction) {
        // Quality of human-AI collaboration
        const isCollaborative = interaction.metadata.collaborative_mode === true;
        return isCollaborative ? 88 : 70;
    }
}
exports.CanvasParityCalculator = CanvasParityCalculator;
