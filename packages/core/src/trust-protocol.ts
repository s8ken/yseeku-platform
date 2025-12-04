/**
 * TrustProtocol - Core constitutional trust enforcement
 * 
 * Implements: https://gammatria.com/whitepapers/governance-protocol
 * 
 * This class enforces the 6 Trust Principles defined in the SYMBI
 * constitutional framework. It calculates trust scores and identifies
 * violations based on weighted principle scoring.
 * 
 * Critical Rule: If ANY critical principle scores 0, overall trust = 0
 */

import { TRUST_PRINCIPLES, TrustScore, TrustPrincipleKey } from './index';

export class TrustProtocol {
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
  calculateTrustScore(principleScores: Record<TrustPrincipleKey, number>): TrustScore {
    let weightedSum = 0;
    const violations: TrustPrincipleKey[] = [];
    let hasCriticalViolation = false;

    // Calculate weighted sum
    for (const [key, principle] of Object.entries(TRUST_PRINCIPLES)) {
      const principleKey = key as TrustPrincipleKey;
      const score = principleScores[principleKey] || 0;

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
  validateTrustScore(score: TrustScore, threshold: number = 7.0): boolean {
    return score.overall >= threshold && score.violations.length === 0;
  }

  /**
   * Get human-readable trust status
   */
  getTrustStatus(score: TrustScore): 'PASS' | 'PARTIAL' | 'FAIL' {
    if (score.overall >= 8.0 && score.violations.length === 0) {
      return 'PASS';
    } else if (score.overall >= 5.0) {
      return 'PARTIAL';
    } else {
      return 'FAIL';
    }
  }
}
