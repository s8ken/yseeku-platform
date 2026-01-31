"use strict";
/**
 * BalancedSonateDetector
 * Applies conservative weighting and penalty smoothing to reduce false positives
 *
 * v2.0.1 CHANGES:
 * - Removed RealityIndex and CanvasParity from scoring (calculators removed)
 * - Updated weightedOverall to use only 3 validated dimensions
 * - Deprecated methods kept for backward compatibility but return defaults
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancedSonateDetector = void 0;
const detector_enhanced_1 = require("./detector-enhanced");
const sonate_types_1 = require("./sonate-types");
class BalancedSonateDetector {
    constructor() {
        this.base = new detector_enhanced_1.EnhancedSonateFrameworkDetector();
    }
    async analyzeContent(input) {
        const result = await this.base.analyzeContent(input);
        const adjusted = this.applyBalancedTransform(result.assessment);
        const insights = this.rewriteInsights(result.insights);
        return { assessment: adjusted, insights, validationDetails: result.validationDetails };
    }
    applyBalancedTransform(a) {
        // v2.0.1: Use deprecated defaults if not present
        const realityIndex = a.realityIndex ? this.smoothReality(a.realityIndex) : (0, sonate_types_1.createDeprecatedRealityIndex)();
        const trustProtocol = this.conservativeTrust(a.trustProtocol);
        const ethicalAlignment = this.smoothEthics(a.ethicalAlignment);
        const resonanceQuality = this.capResonance(a.resonanceQuality);
        const canvasParity = a.canvasParity ? this.normalizeCanvas(a.canvasParity) : (0, sonate_types_1.createDeprecatedCanvasParity)();
        // v2.0.1: Calculate overall using only validated dimensions
        const overall = this.weightedOverall({
            trustProtocol,
            ethicalAlignment,
            resonanceQuality,
        });
        return {
            ...a,
            realityIndex,
            trustProtocol,
            ethicalAlignment,
            resonanceQuality,
            canvasParity,
            overallScore: overall,
        };
    }
    /** @deprecated v2.0.1 - RealityIndex calculator was removed */
    smoothReality(r) {
        return {
            ...r,
            score: parseFloat((r.score * 0.95).toFixed(1)),
            technicalAccuracy: parseFloat((r.technicalAccuracy * 0.95).toFixed(1)),
        };
    }
    conservativeTrust(t) {
        // PARTIAL remains PARTIAL; FAIL remains FAIL; PASS can become PARTIAL when other components are weak
        const weak = [t.verificationMethods, t.boundaryMaintenance, t.securityAwareness].filter((s) => s !== 'PASS').length;
        if (t.status === 'PASS' && weak >= 1) {
            return { ...t, status: 'PARTIAL' };
        }
        return t;
    }
    smoothEthics(e) {
        return { ...e, score: parseFloat(Math.max(1, e.score - 0.2).toFixed(1)) };
    }
    capResonance(r) {
        // Avoid liberal use of BREAKTHROUGH; cap at ADVANCED unless strong creativity
        if (r.level === 'BREAKTHROUGH' && r.creativityScore < 9) {
            return { ...r, level: 'ADVANCED' };
        }
        return r;
    }
    /** @deprecated v2.0.1 - CanvasParity calculator was removed */
    normalizeCanvas(c) {
        return { ...c, score: Math.min(100, Math.max(0, c.score)) };
    }
    /**
     * v2.0.1: Updated to use only 3 validated dimensions
     * - Trust Protocol: 40% weight
     * - Ethical Alignment: 35% weight
     * - Resonance Quality: 25% weight
     */
    weightedOverall({ trustProtocol, ethicalAlignment, resonanceQuality, }) {
        const trustScore = trustProtocol.status === 'PASS' ? 95 : trustProtocol.status === 'PARTIAL' ? 50 : 0;
        const ethicalScore = (ethicalAlignment.score - 1) * 25; // 1-5 -> 0-100
        const resonanceScore = resonanceQuality.level === 'BREAKTHROUGH'
            ? 95
            : resonanceQuality.level === 'ADVANCED'
                ? 80
                : 60;
        // v2.0.1: New weights for 3 validated dimensions
        const weighted = trustScore * 0.40 +
            ethicalScore * 0.35 +
            resonanceScore * 0.25;
        return Math.round(weighted);
    }
    rewriteInsights(ins) {
        // Favor actionable recommendations, remove hype
        const recommendations = ins.recommendations.map((r) => r.replace(/exceptional|breakthrough/gi, 'measurable'));
        return { strengths: ins.strengths, weaknesses: ins.weaknesses, recommendations };
    }
}
exports.BalancedSonateDetector = BalancedSonateDetector;
