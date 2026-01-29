"use strict";
/**
 * SonateFrameworkDetector - Core 5-dimension detection engine
 *
 * This is the production-grade detector that scores AI interactions
 * in real-time across all 5 SONATE Framework dimensions.
 *
 * Use case: Live production monitoring (< 100ms latency requirement)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonateFrameworkDetector = void 0;
const core_1 = require("@sonate/core");
const canvas_parity_1 = require("./canvas-parity");
const ethical_alignment_1 = require("./ethical-alignment");
const reality_index_1 = require("./reality-index");
const resonance_quality_1 = require("./resonance-quality");
const trust_protocol_validator_1 = require("./trust-protocol-validator");
class SonateFrameworkDetector {
    constructor() {
        this.realityCalc = new reality_index_1.RealityIndexCalculator();
        this.trustValidator = new trust_protocol_validator_1.TrustProtocolValidator();
        this.ethicalScorer = new ethical_alignment_1.EthicalAlignmentScorer();
        this.resonanceMeasurer = new resonance_quality_1.ResonanceQualityMeasurer();
        this.canvasCalc = new canvas_parity_1.CanvasParityCalculator();
    }
    /**
     * Detect and score an AI interaction across all 5 dimensions
     *
     * This is the main entry point for SONATE Detect module.
     * Call this for every AI interaction in production.
     */
    async detect(interaction) {
        // Run all 5 dimensions in parallel for speed
        const [reality_index, trust_protocol, ethical_alignment, resonance_quality, canvas_parity] = await Promise.all([
            this.realityCalc.calculate(interaction),
            this.trustValidator.validate(interaction),
            this.ethicalScorer.score(interaction),
            this.resonanceMeasurer.measure(interaction),
            this.canvasCalc.calculate(interaction),
        ]);
        // Generate Trust Receipt
        const receipt = this.generateReceipt(interaction, {
            clarity: this.calculateClarity(interaction),
            integrity: trust_protocol === 'PASS' ? 0.9 : 0.5,
            quality: reality_index / 10,
        });
        return {
            reality_index,
            trust_protocol,
            ethical_alignment,
            resonance_quality,
            canvas_parity,
            timestamp: Date.now(),
            receipt_hash: receipt.self_hash,
        };
    }
    /**
     * Generate Trust Receipt for this detection
     */
    generateReceipt(interaction, ciq) {
        return new core_1.TrustReceipt({
            version: '1.0.0',
            session_id: interaction.metadata.session_id || 'unknown',
            timestamp: Date.now(),
            mode: 'constitutional',
            ciq_metrics: ciq,
        });
    }
    /**
     * Calculate clarity score (0-1)
     */
    calculateClarity(interaction) {
        // Simple heuristic: shorter, clearer messages score higher
        const wordCount = interaction.content.split(/\s+/).length;
        const hasStructure = interaction.content.includes('\n') || interaction.content.includes('-');
        let score = 0.5;
        if (wordCount < 100) {
            score += 0.2;
        }
        if (hasStructure) {
            score += 0.3;
        }
        return Math.min(score, 1.0);
    }
}
exports.SonateFrameworkDetector = SonateFrameworkDetector;
