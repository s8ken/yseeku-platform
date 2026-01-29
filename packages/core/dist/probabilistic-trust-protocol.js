"use strict";
/**
 * Probabilistic Trust Protocol
 *
 * Enhances the deterministic trust scoring with probabilistic reasoning,
 * confidence intervals, and uncertainty quantification for enterprise-grade trust evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.probabilisticTrustProtocol = exports.ProbabilisticTrustProtocol = void 0;
exports.createProbabilisticTrustProtocol = createProbabilisticTrustProtocol;
const errors_1 = require("./errors");
/**
 * Probabilistic Trust Protocol
 *
 * Adds Bayesian inference and uncertainty quantification to trust scoring
 */
class ProbabilisticTrustProtocol {
    constructor() {
        this.calibrationHistory = new Map();
        this.CONFIDENCE_LEVEL = 0.95; // 95% confidence interval
        this.MIN_SAMPLE_SIZE = 5;
    }
    /**
     * Calculate trust score with probabilistic reasoning
     *
     * Uses Bayesian inference to estimate the posterior distribution
     * of trust scores given observed principle scores
     */
    calculateProbabilisticTrustScore(principleScores, historicalData) {
        // Validate input
        this.validatePrincipleScores(principleScores);
        // Calculate deterministic score as baseline
        const baseScore = this.calculateDeterministicScore(principleScores);
        // Calculate uncertainty for each principle
        const uncertainties = this.calculateUncertainties(principleScores, historicalData);
        // Perform Bayesian inference
        const posteriorDistribution = this.performBayesianInference(principleScores, historicalData);
        // Calculate confidence interval
        const confidenceInterval = this.calculateConfidenceInterval(posteriorDistribution, this.CONFIDENCE_LEVEL);
        // Calculate uncertainty metrics
        const uncertainty = this.calculateUncertaintyMetrics(posteriorDistribution);
        // Perform sensitivity analysis
        const sensitivity = this.performSensitivityAnalysis(principleScores);
        // Determine confidence level
        const confidenceLevel = this.determineConfidenceLevel(confidenceInterval, uncertainty);
        return {
            ...baseScore,
            confidence: {
                level: confidenceLevel,
                interval: confidenceInterval,
                standardError: this.calculateStandardError(posteriorDistribution),
                sampleSize: historicalData?.length || 1,
            },
            uncertainty,
            distribution: posteriorDistribution,
            sensitivity,
        };
    }
    /**
     * Calculate deterministic trust score (baseline)
     */
    calculateDeterministicScore(principleScores) {
        const TRUST_PRINCIPLES = {
            CONSENT_ARCHITECTURE: { weight: 0.25, critical: true },
            INSPECTION_MANDATE: { weight: 0.2, critical: false },
            CONTINUOUS_VALIDATION: { weight: 0.2, critical: false },
            ETHICAL_OVERRIDE: { weight: 0.15, critical: true },
            RIGHT_TO_DISCONNECT: { weight: 0.1, critical: false },
            MORAL_RECOGNITION: { weight: 0.1, critical: false },
        };
        let weightedSum = 0;
        const violations = [];
        let hasCriticalViolation = false;
        for (const [key, principle] of Object.entries(TRUST_PRINCIPLES)) {
            const principleKey = key;
            const score = principleScores[principleKey] || 0;
            if (score < 5) {
                violations.push(principleKey);
                if (principle.critical && score === 0) {
                    hasCriticalViolation = true;
                }
            }
            weightedSum += score * principle.weight;
        }
        const overall = hasCriticalViolation ? 0 : weightedSum;
        return {
            overall,
            principles: principleScores,
            violations,
            timestamp: Date.now(),
        };
    }
    /**
     * Validate principle scores
     */
    validatePrincipleScores(scores) {
        for (const [key, value] of Object.entries(scores)) {
            if (typeof value !== 'number' || isNaN(value)) {
                throw new errors_1.BusinessLogicError(`Invalid score for principle ${key}: must be a number`, {
                    timestamp: Date.now(),
                    metadata: { principle: key, value },
                });
            }
            if (value < 0 || value > 10) {
                throw new errors_1.BusinessLogicError(`Score for principle ${key} must be between 0 and 10`, {
                    timestamp: Date.now(),
                    metadata: { principle: key, value },
                });
            }
        }
    }
    /**
     * Calculate uncertainties for each principle
     */
    calculateUncertainties(scores, historicalData) {
        const uncertainties = [];
        for (const [principle, score] of Object.entries(scores)) {
            let uncertainty = 0;
            let source = 'model';
            if (historicalData && historicalData.length > 0) {
                // Calculate variance from historical data
                const historicalScores = historicalData.map((d) => d[principle]);
                const mean = historicalScores.reduce((sum, s) => sum + s, 0) / historicalScores.length;
                const variance = historicalScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
                    historicalScores.length;
                uncertainty = Math.min(Math.sqrt(variance) / 10, 1); // Normalize to 0-1
                source = 'data';
            }
            else {
                // Default uncertainty based on score
                uncertainty = 1 - score / 10; // Lower scores have higher uncertainty
                source = 'model';
            }
            // Calculate impact (weighted by principle importance)
            const weights = {
                CONSENT_ARCHITECTURE: 0.25,
                INSPECTION_MANDATE: 0.2,
                CONTINUOUS_VALIDATION: 0.2,
                ETHICAL_OVERRIDE: 0.15,
                RIGHT_TO_DISCONNECT: 0.1,
                MORAL_RECOGNITION: 0.1,
            };
            const impact = uncertainty * weights[principle];
            uncertainties.push({
                principle: principle,
                uncertainty,
                source,
                impact,
            });
        }
        return uncertainties;
    }
    /**
     * Perform Bayesian inference on trust score
     */
    performBayesianInference(scores, historicalData) {
        if (historicalData && historicalData.length >= this.MIN_SAMPLE_SIZE) {
            // Use empirical Bayes with historical data
            return this.empiricalBayesInference(scores, historicalData);
        }
        // Use conjugate prior (Beta distribution for scores normalized to 0-1)
        return this.conjugatePriorInference(scores);
    }
    /**
     * Empirical Bayes inference
     */
    empiricalBayesInference(scores, historicalData) {
        // Calculate posterior using historical data as prior
        const priorMeans = {};
        const priorVariances = {};
        for (const principle of Object.keys(scores)) {
            const historicalScores = historicalData.map((d) => d[principle]);
            const mean = historicalScores.reduce((sum, s) => sum + s, 0) / historicalScores.length;
            const variance = historicalScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
                historicalScores.length;
            priorMeans[principle] = mean;
            priorVariances[principle] = variance;
        }
        // Update posterior with current observation
        const posteriorMean = {};
        const posteriorVariance = {};
        for (const [principle, score] of Object.entries(scores)) {
            const priorMean = priorMeans[principle];
            const priorVar = priorVariances[principle];
            const obsVar = 1; // Assume observation variance of 1
            // Bayesian update
            const postVar = (priorVar * obsVar) / (priorVar + obsVar);
            const postMean = (postVar / obsVar) * score + (postVar / priorVar) * priorMean;
            posteriorMean[principle] = postMean;
            posteriorVariance[principle] = postVar;
        }
        // Calculate weighted posterior for overall score
        const weights = {
            CONSENT_ARCHITECTURE: 0.25,
            INSPECTION_MANDATE: 0.2,
            CONTINUOUS_VALIDATION: 0.2,
            ETHICAL_OVERRIDE: 0.15,
            RIGHT_TO_DISCONNECT: 0.1,
            MORAL_RECOGNITION: 0.1,
        };
        let overallMean = 0;
        let overallVariance = 0;
        for (const [principle, mean] of Object.entries(posteriorMean)) {
            const weight = weights[principle];
            const variance = posteriorVariance[principle];
            overallMean += mean * weight;
            overallVariance += Math.pow(weight, 2) * variance;
        }
        return {
            type: 'normal',
            parameters: {
                mean: overallMean,
                variance: overallVariance,
                stdDev: Math.sqrt(overallVariance),
            },
        };
    }
    /**
     * Conjugate prior inference (Beta distribution)
     */
    conjugatePriorInference(scores) {
        // Use Beta(2, 2) as uninformative prior (uniform distribution)
        const priorAlpha = 2;
        const priorBeta = 2;
        // Update posterior with normalized scores (0-1)
        let sumAlpha = priorAlpha;
        let sumBeta = priorBeta;
        for (const score of Object.values(scores)) {
            const normalizedScore = score / 10;
            sumAlpha += normalizedScore * 10; // Add pseudo-counts
            sumBeta += (1 - normalizedScore) * 10;
        }
        // Posterior mean and variance
        const posteriorMean = sumAlpha / (sumAlpha + sumBeta);
        const posteriorVariance = (sumAlpha * sumBeta) / (Math.pow(sumAlpha + sumBeta, 2) * (sumAlpha + sumBeta + 1));
        return {
            type: 'beta',
            parameters: {
                alpha: sumAlpha,
                beta: sumBeta,
                mean: posteriorMean,
                variance: posteriorVariance,
            },
        };
    }
    /**
     * Calculate confidence interval
     */
    calculateConfidenceInterval(distribution, confidenceLevel) {
        const zScore = this.getZScore(confidenceLevel);
        if (distribution.type === 'normal') {
            const mean = distribution.parameters.mean;
            const stdDev = distribution.parameters.stdDev;
            const margin = zScore * stdDev;
            return [Math.max(0, mean - margin), Math.min(10, mean + margin)];
        }
        else if (distribution.type === 'beta') {
            // Approximate normal for Beta distribution
            const mean = distribution.parameters.mean;
            const stdDev = Math.sqrt(distribution.parameters.variance);
            const margin = zScore * stdDev;
            return [Math.max(0, mean * 10 - margin), Math.min(10, mean * 10 + margin)];
        }
        // Fallback to deterministic score
        return [distribution.parameters.mean, distribution.parameters.mean];
    }
    /**
     * Get z-score for confidence level
     */
    getZScore(confidenceLevel) {
        // Standard normal distribution z-scores
        const zScores = {
            0.9: 1.645,
            0.95: 1.96,
            0.99: 2.576,
        };
        return zScores[confidenceLevel] || 1.96;
    }
    /**
     * Calculate uncertainty metrics
     */
    calculateUncertaintyMetrics(distribution) {
        const variance = distribution.parameters.variance || 0;
        const mean = distribution.parameters.mean || 0;
        const stdDev = Math.sqrt(variance);
        // Shannon entropy (approximation for continuous distribution)
        const entropy = 0.5 * Math.log(2 * Math.PI * Math.E * variance);
        // Coefficient of variation
        const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
        return {
            entropy: Math.max(0, entropy),
            variance,
            coefficientOfVariation: Math.min(coefficientOfVariation, 1),
        };
    }
    /**
     * Calculate standard error
     */
    calculateStandardError(distribution) {
        return Math.sqrt(distribution.parameters.variance || 0);
    }
    /**
     * Perform sensitivity analysis
     */
    performSensitivityAnalysis(scores) {
        const sensitivityScores = {
            CONSENT_ARCHITECTURE: 0,
            INSPECTION_MANDATE: 0,
            CONTINUOUS_VALIDATION: 0,
            ETHICAL_OVERRIDE: 0,
            RIGHT_TO_DISCONNECT: 0,
            MORAL_RECOGNITION: 0,
        };
        const weights = {
            CONSENT_ARCHITECTURE: 0.25,
            INSPECTION_MANDATE: 0.2,
            CONTINUOUS_VALIDATION: 0.2,
            ETHICAL_OVERRIDE: 0.15,
            RIGHT_TO_DISCONNECT: 0.1,
            MORAL_RECOGNITION: 0.1,
        };
        // Calculate sensitivity for each principle
        for (const [principle, score] of Object.entries(scores)) {
            // Calculate partial derivative (sensitivity)
            const delta = 0.1;
            const scorePlus = score + delta;
            const scoreMinus = Math.max(0, score - delta);
            const baseScore = this.calculateDeterministicScore(scores);
            const scoresPlus = { ...scores, [principle]: scorePlus };
            const scoresMinus = { ...scores, [principle]: scoreMinus };
            const scorePlusResult = this.calculateDeterministicScore(scoresPlus);
            const scoreMinusResult = this.calculateDeterministicScore(scoresMinus);
            const sensitivity = (scorePlusResult.overall - scoreMinusResult.overall) / (scorePlus - scoreMinus);
            // Weight by principle importance
            sensitivityScores[principle] =
                Math.abs(sensitivity) * weights[principle];
        }
        // Find most sensitive principle
        let mostSensitive = 'CONSENT_ARCHITECTURE';
        let maxSensitivity = 0;
        for (const [principle, sensitivity] of Object.entries(sensitivityScores)) {
            if (sensitivity > maxSensitivity) {
                maxSensitivity = sensitivity;
                mostSensitive = principle;
            }
        }
        return {
            mostSensitivePrinciple: mostSensitive,
            sensitivityScores,
        };
    }
    /**
     * Determine confidence level
     */
    determineConfidenceLevel(confidenceInterval, uncertainty) {
        const intervalWidth = confidenceInterval[1] - confidenceInterval[0];
        // High confidence: narrow interval, low uncertainty
        if (intervalWidth < 1 && uncertainty.coefficientOfVariation < 0.1) {
            return 'HIGH';
        }
        // Medium confidence: moderate interval and uncertainty
        if (intervalWidth < 3 && uncertainty.coefficientOfVariation < 0.3) {
            return 'MEDIUM';
        }
        // Low confidence: wide interval or high uncertainty
        return 'LOW';
    }
    /**
     * Calibrate confidence based on historical accuracy
     */
    calibrateConfidence(sessionId, predictedScore, actualScore) {
        const existing = this.calibrationHistory.get(sessionId);
        // Calculate accuracy
        const accuracy = 1 - Math.abs(predictedScore.overall - actualScore) / 10;
        // Update calibration
        if (existing) {
            const newAccuracy = (existing.observedAccuracy * existing.sampleSize + accuracy) / (existing.sampleSize + 1);
            existing.observedAccuracy = newAccuracy;
            existing.sampleSize += 1;
            existing.lastCalibrated = Date.now();
            // Adjust calibration factor
            if (newAccuracy < 0.9) {
                existing.calibrationFactor *= 0.95; // Reduce confidence
            }
            else if (newAccuracy > 0.95) {
                existing.calibrationFactor *= 1.02; // Increase confidence
            }
        }
        else {
            this.calibrationHistory.set(sessionId, {
                observedAccuracy: accuracy,
                calibrationFactor: 1.0,
                sampleSize: 1,
                lastCalibrated: Date.now(),
            });
        }
    }
    /**
     * Get calibration data
     */
    getCalibration(sessionId) {
        return this.calibrationHistory.get(sessionId);
    }
    /**
     * Clear calibration history
     */
    clearCalibration() {
        this.calibrationHistory.clear();
    }
}
exports.ProbabilisticTrustProtocol = ProbabilisticTrustProtocol;
/**
 * Create probabilistic trust protocol instance
 */
function createProbabilisticTrustProtocol() {
    return new ProbabilisticTrustProtocol();
}
/**
 * Global instance
 */
exports.probabilisticTrustProtocol = createProbabilisticTrustProtocol();
