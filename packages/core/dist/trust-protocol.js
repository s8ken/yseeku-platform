"use strict";
/**
 * TrustProtocol - Core constitutional trust enforcement
 *
 * Implements: https://gammatria.com/whitepapers/governance-protocol
 *
 * This class enforces the 6 Trust Principles defined in the SONATE
 * constitutional framework. It calculates trust scores and identifies
 * violations based on weighted principle scoring.
 *
 * Critical Rule: If ANY critical principle scores 0, overall trust = 0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustProtocol = void 0;
const math_errors_1 = require("./errors/math-errors");
const schemas_1 = require("./validation/schemas");
const index_1 = require("./index");
class TrustProtocol {
    /**
     * Calculate trust score for an interaction
     *
     * Algorithm (from Master Context):
     * Score = Sum(Principle_Score * Weight)
     * If critical principle = 0, cap total at 0
     *
     * @param principleScores - Scores for each principle (0-10)
     * @returns TrustScore object with overall score and violations
     */
    calculateTrustScore(principleScores) {
        let validated;
        try {
            validated = schemas_1.PrincipleScoresSchema.parse(principleScores);
        }
        catch (e) {
            throw new math_errors_1.MathValidationError('Invalid principle scores', e.message);
        }
        const values = Object.values(validated);
        if (values.some((v) => !isFinite(v))) {
            throw new math_errors_1.CalculationError('Non-finite values in trust scoring', 'calculateTrustScore', {
                principleScores,
            });
        }
        let weightedSum = 0;
        const violations = [];
        let hasCriticalViolation = false;
        // Calculate weighted sum
        for (const [key, principle] of Object.entries(index_1.TRUST_PRINCIPLES)) {
            const principleKey = key;
            const score = validated[principleKey] || 0;
            // Check for violations (score < 5)
            if (score < 5) {
                violations.push(principleKey);
                // Critical violation check
                if (principle.critical && score === 0) {
                    hasCriticalViolation = true;
                }
            }
            weightedSum += score * principle.weight;
        }
        // Apply critical violation rule
        const overall = hasCriticalViolation ? 0 : weightedSum;
        if (!isFinite(overall) || overall < 0 || overall > 10) {
            throw new math_errors_1.CalculationError('Invalid trust score result', 'calculateTrustScore', {
                overall,
                inputs: { principleScores },
            });
        }
        return {
            overall,
            principles: principleScores,
            violations,
            timestamp: Date.now(),
        };
    }
    /**
     * Validate that a trust score meets minimum threshold
     *
     * @param score - Trust score to validate
     * @param threshold - Minimum acceptable score (default: 7.0)
     * @returns true if score meets threshold
     */
    validateTrustScore(score, threshold = 7.0) {
        return score.overall >= threshold && score.violations.length === 0;
    }
    /**
     * Get human-readable trust status
     */
    getTrustStatus(score) {
        if (score.overall >= 8.0 && score.violations.length === 0) {
            return 'PASS';
        }
        else if (score.overall >= 5.0) {
            return 'PARTIAL';
        }
        return 'FAIL';
    }
}
exports.TrustProtocol = TrustProtocol;
