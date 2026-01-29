"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancedSonateDetector = void 0;
const detector_enhanced_1 = require("./detector-enhanced");
/**
 * BalancedSonateDetector
 * Applies conservative weighting and penalty smoothing to reduce false positives
 */
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
        const realityIndex = this.smoothReality(a.realityIndex);
        const trustProtocol = this.conservativeTrust(a.trustProtocol);
        const ethicalAlignment = this.smoothEthics(a.ethicalAlignment);
        const resonanceQuality = this.capResonance(a.resonanceQuality);
        const canvasParity = this.normalizeCanvas(a.canvasParity);
        const overall = this.weightedOverall({
            realityIndex,
            trustProtocol,
            ethicalAlignment,
            resonanceQuality,
            canvasParity,
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
    normalizeCanvas(c) {
        return { ...c, score: Math.min(100, Math.max(0, c.score)) };
    }
    weightedOverall({ realityIndex, trustProtocol, ethicalAlignment, resonanceQuality, canvasParity, }) {
        const realityScore = realityIndex.score * 10;
        const trustScore = trustProtocol.status === 'PASS' ? 95 : trustProtocol.status === 'PARTIAL' ? 50 : 0;
        const ethicalScore = (ethicalAlignment.score - 1) * 25;
        const resonanceScore = resonanceQuality.level === 'BREAKTHROUGH'
            ? 95
            : resonanceQuality.level === 'ADVANCED'
                ? 80
                : 60;
        const canvasScore = canvasParity.score;
        const weighted = realityScore * 0.25 +
            trustScore * 0.25 +
            ethicalScore * 0.2 +
            resonanceScore * 0.15 +
            canvasScore * 0.15;
        return Math.round(weighted);
    }
    rewriteInsights(ins) {
        // Favor actionable recommendations, remove hype
        const recommendations = ins.recommendations.map((r) => r.replace(/exceptional|breakthrough/gi, 'measurable'));
        return { strengths: ins.strengths, weaknesses: ins.weaknesses, recommendations };
    }
}
exports.BalancedSonateDetector = BalancedSonateDetector;
