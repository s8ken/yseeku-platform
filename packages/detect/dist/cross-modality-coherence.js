"use strict";
/**
 * Cross-Modality Coherence Validation
 *
 * Validates coherence across different cognitive modalities:
 * - Linguistic reasoning
 * - Logical deduction
 * - Creative synthesis
 * - Ethical judgment
 * - Procedural execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossModalityCoherenceValidator = void 0;
exports.createCrossModalityCoherenceValidator = createCrossModalityCoherenceValidator;
exports.analyzeCrossModalityCoherence = analyzeCrossModalityCoherence;
exports.validateCrossModalityCoherence = validateCrossModalityCoherence;
/**
 * Cross-Modality Coherence Validator
 *
 * Analyzes and validates coherence across different AI cognitive modalities
 */
class CrossModalityCoherenceValidator {
    constructor() {
        this.DEFAULT_THRESHOLD = 0.7;
        this.CRITICAL_THRESHOLD = 0.5;
    }
    /**
     * Analyze cross-modality coherence
     */
    analyzeCoherence(modalityMetrics) {
        // Calculate individual modality scores
        const modalityScores = this.calculateModalityScores(modalityMetrics);
        // Calculate coherence matrix (pairwise coherence)
        const coherenceMatrix = this.calculateCoherenceMatrix(modalityMetrics);
        // Calculate overall coherence
        const overallCoherence = this.calculateOverallCoherence(modalityScores, coherenceMatrix);
        // Determine modality weights based on performance and context
        const modalityWeights = this.calculateModalityWeights(modalityScores);
        // Calculate integration score
        const integrationScore = this.calculateIntegrationScore(coherenceMatrix, modalityWeights);
        // Identify conflicts and synergies
        const conflicts = this.identifyConflicts(modalityMetrics, coherenceMatrix);
        const synergies = this.identifySynergies(modalityMetrics, coherenceMatrix);
        return {
            overall_coherence: overallCoherence,
            modality_weights: modalityWeights,
            coherence_matrix: coherenceMatrix,
            integration_score: integrationScore,
            conflict_indicators: conflicts,
            synergy_indicators: synergies,
        };
    }
    /**
     * Validate coherence against thresholds
     */
    validateCoherence(analysis, threshold = this.DEFAULT_THRESHOLD) {
        const passesThreshold = analysis.overall_coherence >= threshold;
        const passesCriticalThreshold = analysis.overall_coherence >= this.CRITICAL_THRESHOLD;
        // Identify issues
        const issues = this.identifyCoherenceIssues(analysis);
        // Generate recommendations
        const recommendations = this.generateRecommendations(analysis, issues);
        // Calculate confidence based on consistency and lack of conflicts
        const confidence = this.calculateValidationConfidence(analysis);
        return {
            is_valid: passesThreshold,
            confidence,
            issues,
            recommendations,
            threshold_analysis: {
                min_threshold: threshold,
                actual_value: analysis.overall_coherence,
                passed: passesThreshold,
            },
        };
    }
    /**
     * Detect coherence patterns over time
     */
    detectCoherencePatterns(historicalAnalyses, windowSize = 10) {
        if (historicalAnalyses.length < 3) {
            return {
                trend_direction: 'stable',
                stability_score: 0.5,
                cyclical_patterns: [],
                anomaly_indicators: [],
            };
        }
        const coherenceHistory = historicalAnalyses.map((a) => a.overall_coherence);
        const recentWindow = coherenceHistory.slice(-windowSize);
        // Calculate trend
        const trend = this.calculateTrend(recentWindow);
        // Calculate stability
        const stability = this.calculateStability(recentWindow);
        // Detect cyclical patterns
        const cyclicalPatterns = this.detectCyclicalPatterns(recentWindow);
        // Detect anomalies
        const anomalies = this.detectAnomalies(recentWindow);
        return {
            trend_direction: trend,
            stability_score: stability,
            cyclical_patterns: cyclicalPatterns,
            anomaly_indicators: anomalies,
        };
    }
    // Private helper methods
    calculateModalityScores(modalityMetrics) {
        return {
            linguistic: this.calculateLinguisticScore(modalityMetrics.linguistic),
            reasoning: this.calculateReasoningScore(modalityMetrics.reasoning),
            creative: this.calculateCreativeScore(modalityMetrics.creative),
            ethical: this.calculateEthicalScore(modalityMetrics.ethical),
            procedural: this.calculateProceduralScore(modalityMetrics.procedural),
        };
    }
    calculateLinguisticScore(linguistic) {
        return linguistic.coherence * 0.4 + linguistic.complexity * 0.3 + linguistic.consistency * 0.3;
    }
    calculateReasoningScore(reasoning) {
        return (reasoning.logical_validity * 0.4 +
            reasoning.inference_quality * 0.35 +
            reasoning.argument_structure * 0.25);
    }
    calculateCreativeScore(creative) {
        return (creative.originality * 0.4 +
            creative.synthesis_quality * 0.35 +
            creative.aesthetic_coherence * 0.25);
    }
    calculateEthicalScore(ethical) {
        return (ethical.value_alignment * 0.4 + ethical.consistency * 0.35 + ethical.reasoning_quality * 0.25);
    }
    calculateProceduralScore(procedural) {
        return (procedural.execution_accuracy * 0.4 +
            procedural.efficiency * 0.3 +
            procedural.robustness * 0.3);
    }
    calculateCoherenceMatrix(modalityMetrics) {
        const modalities = ['linguistic', 'reasoning', 'creative', 'ethical', 'procedural'];
        const matrix = [];
        for (let i = 0; i < modalities.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < modalities.length; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0; // Perfect coherence with self
                }
                else {
                    matrix[i][j] = this.calculatePairwiseCoherence(modalities[i], modalities[j], modalityMetrics);
                }
            }
        }
        return matrix;
    }
    calculatePairwiseCoherence(modality1, modality2, metrics) {
        // Simplified pairwise coherence calculation
        // In practice, this would analyze actual cross-modality interactions
        const score1 = this.getModalityScore(modality1, metrics);
        const score2 = this.getModalityScore(modality2, metrics);
        // Base coherence on similarity of performance levels
        const performanceSimilarity = 1 - Math.abs(score1 - score2);
        // Adjust for specific modality interactions
        let interactionBonus = 0;
        // Linguistic-Reasoning synergy
        if ((modality1 === 'linguistic' && modality2 === 'reasoning') ||
            (modality1 === 'reasoning' && modality2 === 'linguistic')) {
            interactionBonus = 0.1;
        }
        // Ethical-Reasoning synergy
        if ((modality1 === 'ethical' && modality2 === 'reasoning') ||
            (modality1 === 'reasoning' && modality2 === 'ethical')) {
            interactionBonus = 0.1;
        }
        // Creative-Procedural complementarity
        if ((modality1 === 'creative' && modality2 === 'procedural') ||
            (modality1 === 'procedural' && modality2 === 'creative')) {
            interactionBonus = 0.05; // Complementary but not synergistic
        }
        return Math.min(1, Math.max(0, performanceSimilarity + interactionBonus));
    }
    getModalityScore(modality, metrics) {
        switch (modality) {
            case 'linguistic':
                return this.calculateLinguisticScore(metrics.linguistic);
            case 'reasoning':
                return this.calculateReasoningScore(metrics.reasoning);
            case 'creative':
                return this.calculateCreativeScore(metrics.creative);
            case 'ethical':
                return this.calculateEthicalScore(metrics.ethical);
            case 'procedural':
                return this.calculateProceduralScore(metrics.procedural);
            default:
                return 0;
        }
    }
    calculateOverallCoherence(modalityScores, coherenceMatrix) {
        // Overall coherence is a combination of:
        // 1. Average individual modality performance
        // 2. Average pairwise coherence
        // 3. Integration factor
        const individualPerformance = Object.values(modalityScores).reduce((sum, score) => sum + score, 0) /
            Object.keys(modalityScores).length;
        // Calculate average off-diagonal coherence
        let totalCoherence = 0;
        let count = 0;
        for (let i = 0; i < coherenceMatrix.length; i++) {
            for (let j = 0; j < coherenceMatrix[i].length; j++) {
                if (i !== j) {
                    totalCoherence += coherenceMatrix[i][j];
                    count++;
                }
            }
        }
        const averageCoherence = count > 0 ? totalCoherence / count : 0;
        // Combine with weights
        const overallCoherence = individualPerformance * 0.5 + averageCoherence * 0.5;
        return Math.min(1, Math.max(0, overallCoherence));
    }
    calculateModalityWeights(modalityScores) {
        // Calculate weights based on relative performance and importance
        const scores = Object.entries(modalityScores);
        const totalScore = scores.reduce((sum, [, score]) => sum + score, 0);
        if (totalScore === 0) {
            // Equal weights if all scores are zero
            const modalities = Object.keys(modalityScores);
            return modalities.reduce((weights, modality) => {
                weights[modality] = 1 / modalities.length;
                return weights;
            }, {});
        }
        // Normalize scores to create weights
        const weights = {};
        for (const [modality, score] of scores) {
            weights[modality] = score / totalScore;
        }
        return weights;
    }
    calculateIntegrationScore(coherenceMatrix, modalityWeights) {
        // Integration score measures how well modalities work together
        // based on the weighted average of pairwise coherence
        const modalities = Object.keys(modalityWeights);
        let weightedCoherence = 0;
        let totalWeight = 0;
        for (let i = 0; i < modalities.length; i++) {
            for (let j = i + 1; j < modalities.length; j++) {
                const modality1 = modalities[i];
                const modality2 = modalities[j];
                const weight = (modalityWeights[modality1] + modalityWeights[modality2]) / 2;
                weightedCoherence += coherenceMatrix[i][j] * weight;
                totalWeight += weight;
            }
        }
        return totalWeight > 0 ? weightedCoherence / totalWeight : 0;
    }
    identifyConflicts(metrics, coherenceMatrix) {
        const conflicts = [];
        // Check for low pairwise coherence
        const modalities = ['linguistic', 'reasoning', 'creative', 'ethical', 'procedural'];
        for (let i = 0; i < modalities.length; i++) {
            for (let j = i + 1; j < modalities.length; j++) {
                if (coherenceMatrix[i][j] < 0.4) {
                    conflicts.push(`Low coherence between ${modalities[i]} and ${modalities[j]} modalities`);
                }
            }
        }
        // Check for internal inconsistencies within modalities
        if (metrics.linguistic.consistency < 0.5) {
            conflicts.push('Internal inconsistency in linguistic modality');
        }
        if (metrics.ethical.consistency < 0.5) {
            conflicts.push('Internal inconsistency in ethical modality');
        }
        if (metrics.reasoning.logical_validity < 0.5 && metrics.reasoning.inference_quality > 0.7) {
            conflicts.push('High inference quality despite low logical validity');
        }
        return conflicts;
    }
    identifySynergies(metrics, coherenceMatrix) {
        const synergies = [];
        // Check for high pairwise coherence
        const modalities = ['linguistic', 'reasoning', 'creative', 'ethical', 'procedural'];
        for (let i = 0; i < modalities.length; i++) {
            for (let j = i + 1; j < modalities.length; j++) {
                if (coherenceMatrix[i][j] > 0.8) {
                    synergies.push(`Strong synergy between ${modalities[i]} and ${modalities[j]} modalities`);
                }
            }
        }
        // Check for complementary strengths
        if (metrics.creative.originality > 0.8 && metrics.procedural.execution_accuracy > 0.8) {
            synergies.push('Complementary strength in creativity and execution');
        }
        if (metrics.ethical.value_alignment > 0.8 && metrics.reasoning.logical_validity > 0.8) {
            synergies.push('Strong ethical and logical reasoning alignment');
        }
        return synergies;
    }
    identifyCoherenceIssues(analysis) {
        const issues = [];
        if (analysis.overall_coherence < this.CRITICAL_THRESHOLD) {
            issues.push('Overall coherence below critical threshold');
        }
        if (analysis.integration_score < 0.5) {
            issues.push('Poor integration between modalities');
        }
        if (analysis.conflict_indicators.length > 2) {
            issues.push('Multiple modality conflicts detected');
        }
        // Check for imbalanced modality weights
        const weights = Object.values(analysis.modality_weights);
        const maxWeight = Math.max(...weights);
        const minWeight = Math.min(...weights);
        if (maxWeight - minWeight > 0.5) {
            issues.push('Severe imbalance in modality contributions');
        }
        return issues;
    }
    generateRecommendations(analysis, issues) {
        const recommendations = [];
        for (const issue of issues) {
            if (issue.includes('critical threshold')) {
                recommendations.push('Immediate attention required to improve overall coherence');
            }
            if (issue.includes('integration')) {
                recommendations.push('Focus on improving cross-modality integration techniques');
            }
            if (issue.includes('conflicts')) {
                recommendations.push('Investigate and resolve modality conflicts');
            }
            if (issue.includes('imbalance')) {
                recommendations.push('Balance modality contributions for more harmonious performance');
            }
        }
        // General recommendations based on analysis
        if (analysis.synergy_indicators.length > 0) {
            recommendations.push('Leverage identified synergies to enhance overall performance');
        }
        if (analysis.overall_coherence > 0.8) {
            recommendations.push('Maintain current coherence levels through consistent monitoring');
        }
        return recommendations;
    }
    calculateValidationConfidence(analysis) {
        // Confidence based on:
        // 1. Lack of conflicts
        // 2. High integration score
        // 3. Consistent modality weights
        let confidence = 0.5; // Base confidence
        // Adjust based on conflicts
        const conflictPenalty = Math.min(0.4, analysis.conflict_indicators.length * 0.1);
        confidence -= conflictPenalty;
        // Adjust based on integration
        const integrationBonus = analysis.integration_score * 0.3;
        confidence += integrationBonus;
        // Adjust based on weight balance
        const weights = Object.values(analysis.modality_weights);
        const balance = 1 - (Math.max(...weights) - Math.min(...weights));
        const balanceBonus = balance * 0.2;
        confidence += balanceBonus;
        return Math.min(1, Math.max(0, confidence));
    }
    calculateTrend(coherenceHistory) {
        if (coherenceHistory.length < 2) {
            return 'stable';
        }
        const recent = coherenceHistory.slice(-3);
        const older = coherenceHistory.slice(-6, -3);
        if (older.length === 0) {
            return 'stable';
        }
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        const difference = recentAvg - olderAvg;
        if (difference > 0.05) {
            return 'improving';
        }
        if (difference < -0.05) {
            return 'declining';
        }
        return 'stable';
    }
    calculateStability(coherenceHistory) {
        if (coherenceHistory.length < 2) {
            return 0.5;
        }
        const mean = coherenceHistory.reduce((sum, val) => sum + val, 0) / coherenceHistory.length;
        const variance = coherenceHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            coherenceHistory.length;
        // Convert variance to stability (inverse of variance, normalized)
        return Math.max(0, 1 - variance * 4);
    }
    detectCyclicalPatterns(coherenceHistory) {
        const periods = [];
        const maxPeriod = Math.min(8, Math.floor(coherenceHistory.length / 3));
        for (let period = 2; period <= maxPeriod; period++) {
            const correlation = this.calculateAutocorrelation(coherenceHistory, period);
            if (correlation > 0.6) {
                periods.push(period);
            }
        }
        return periods;
    }
    detectAnomalies(coherenceHistory) {
        const anomalies = [];
        if (coherenceHistory.length < 3) {
            return anomalies;
        }
        const mean = coherenceHistory.reduce((sum, val) => sum + val, 0) / coherenceHistory.length;
        const stdDev = Math.sqrt(coherenceHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            coherenceHistory.length);
        if (stdDev === 0) {
            return anomalies;
        }
        // Mark points more than 2 standard deviations from mean as anomalies
        for (let i = 0; i < coherenceHistory.length; i++) {
            const zScore = Math.abs(coherenceHistory[i] - mean) / stdDev;
            if (zScore > 2) {
                anomalies.push(i);
            }
        }
        return anomalies;
    }
    calculateAutocorrelation(series, lag) {
        if (lag >= series.length) {
            return 0;
        }
        const n = series.length - lag;
        const mean = series.reduce((sum, val) => sum + val, 0) / series.length;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            const xDiff = series[i] - mean;
            const yDiff = series[i + lag] - mean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        }
        if (denominator === 0) {
            return 0;
        }
        return numerator / denominator;
    }
}
exports.CrossModalityCoherenceValidator = CrossModalityCoherenceValidator;
/**
 * Factory function for creating cross-modality coherence validators
 */
function createCrossModalityCoherenceValidator() {
    return new CrossModalityCoherenceValidator();
}
/**
 * Quick coherence analysis function
 */
function analyzeCrossModalityCoherence(modalityMetrics) {
    const validator = new CrossModalityCoherenceValidator();
    return validator.analyzeCoherence(modalityMetrics);
}
/**
 * Quick coherence validation function
 */
function validateCrossModalityCoherence(modalityMetrics, threshold) {
    const validator = new CrossModalityCoherenceValidator();
    const analysis = validator.analyzeCoherence(modalityMetrics);
    return validator.validateCoherence(analysis, threshold);
}
