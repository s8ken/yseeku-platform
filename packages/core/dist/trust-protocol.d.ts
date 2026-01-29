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
import { TrustScore, PrincipleScores } from './index';
export declare class TrustProtocol {
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
    calculateTrustScore(principleScores: PrincipleScores): TrustScore;
    /**
     * Validate that a trust score meets minimum threshold
     *
     * @param score - Trust score to validate
     * @param threshold - Minimum acceptable score (default: 7.0)
     * @returns true if score meets threshold
     */
    validateTrustScore(score: TrustScore, threshold?: number): boolean;
    /**
     * Get human-readable trust status
     */
    getTrustStatus(score: TrustScore): 'PASS' | 'PARTIAL' | 'FAIL';
}
