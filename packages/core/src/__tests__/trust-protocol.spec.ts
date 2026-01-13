/**
 * Trust Protocol Tests
 * 
 * Comprehensive test suite for core trust protocol functionality
 */

import { TrustProtocol, TRUST_PRINCIPLES, TrustPrincipleKey, PrincipleScores } from '../index';

describe('TrustProtocol', () => {
  let trustProtocol: TrustProtocol;

  beforeEach(() => {
    trustProtocol = new TrustProtocol();
  });

  describe('calculateTrustScore', () => {
    it('should calculate correct weighted score for perfect principles', () => {
      const perfectScores: PrincipleScores = {
        CONSENT_ARCHITECTURE: 10,
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      };

      const result = trustProtocol.calculateTrustScore(perfectScores);

      expect(result.overall).toBe(1.0); // Perfect score
      expect(result.violations).toHaveLength(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should identify violations for scores below 5', () => {
      const lowScores: PrincipleScores = {
        CONSENT_ARCHITECTURE: 3, // Violation
        INSPECTION_MANDATE: 6,
        CONTINUOUS_VALIDATION: 4, // Violation
        ETHICAL_OVERRIDE: 7,
        RIGHT_TO_DISCONNECT: 8,
        MORAL_RECOGNITION: 2 // Violation
      };

      const result = trustProtocol.calculateTrustScore(lowScores);

      expect(result.violations).toContain('CONSENT_ARCHITECTURE');
      expect(result.violations).toContain('CONTINUOUS_VALIDATION');
      expect(result.violations).toContain('MORAL_RECOGNITION');
      expect(result.violations).toHaveLength(3);
    });

    it('should enforce critical violation rule - zero score for critical principle at 0', () => {
      const criticalViolation: PrincipleScores = {
        CONSENT_ARCHITECTURE: 0, // Critical principle at 0
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      };

      const result = trustProtocol.calculateTrustScore(criticalViolation);

      expect(result.overall).toBe(0); // Should be capped at 0
      expect(result.violations).toContain('CONSENT_ARCHITECTURE');
    });

    it('should enforce critical violation rule - zero score for ethical override at 0', () => {
      const criticalViolation: PrincipleScores = {
        CONSENT_ARCHITECTURE: 10,
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 0, // Critical principle at 0
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      };

      const result = trustProtocol.calculateTrustScore(criticalViolation);

      expect(result.overall).toBe(0); // Should be capped at 0
      expect(result.violations).toContain('ETHICAL_OVERRIDE');
    });

    it('should calculate correct weighted score for mixed values', () => {
      const mixedScores: PrincipleScores = {
        CONSENT_ARCHITECTURE: 8,  // 0.25 weight
        INSPECTION_MANDATE: 6,   // 0.20 weight
        CONTINUOUS_VALIDATION: 7, // 0.20 weight
        ETHICAL_OVERRIDE: 9,     // 0.15 weight
        RIGHT_TO_DISCONNECT: 5,  // 0.10 weight
        MORAL_RECOGNITION: 4     // 0.10 weight
      };

      const result = trustProtocol.calculateTrustScore(mixedScores);

      // Expected: (8*0.25 + 6*0.20 + 7*0.20 + 9*0.15 + 5*0.10 + 4*0.10) / 10
      const expected = (8*0.25 + 6*0.20 + 7*0.20 + 9*0.15 + 5*0.10 + 4*0.10) / 10;
      expect(result.overall).toBeCloseTo(expected, 2);
    });

    it('should handle missing principle scores', () => {
      const incompleteScores: Partial<Record<TrustPrincipleKey, number>> = {
        CONSENT_ARCHITECTURE: 8,
        INSPECTION_MANDATE: 6
        // Missing other principles
      };

      const result = trustProtocol.calculateTrustScore(incompleteScores as Record<TrustPrincipleKey, number>);

      // Missing scores should default to 0
      expect(result.violations).toContain('CONTINUOUS_VALIDATION');
      expect(result.violations).toContain('ETHICAL_OVERRIDE');
      expect(result.violations).toContain('RIGHT_TO_DISCONNECT');
      expect(result.violations).toContain('MORAL_RECOGNITION');
    });
  });

  describe('Trust Principles Constants', () => {
    it('should have correct principle definitions', () => {
      expect(TRUST_PRINCIPLES.CONSENT_ARCHITECTURE.weight).toBe(0.25);
      expect(TRUST_PRINCIPLES.CONSENT_ARCHITECTURE.critical).toBe(true);
      
      expect(TRUST_PRINCIPLES.INSPECTION_MANDATE.weight).toBe(0.20);
      expect(TRUST_PRINCIPLES.INSPECTION_MANDATE.critical).toBe(false);
      
      expect(TRUST_PRINCIPLES.ETHICAL_OVERRIDE.weight).toBe(0.15);
      expect(TRUST_PRINCIPLES.ETHICAL_OVERRIDE.critical).toBe(true);
    });

    it('should have all required principles', () => {
      const requiredPrinciples: TrustPrincipleKey[] = [
        'CONSENT_ARCHITECTURE',
        'INSPECTION_MANDATE',
        'CONTINUOUS_VALIDATION',
        'ETHICAL_OVERRIDE',
        'RIGHT_TO_DISCONNECT',
        'MORAL_RECOGNITION'
      ];

      requiredPrinciples.forEach((principle: TrustPrincipleKey) => {
        expect(TRUST_PRINCIPLES[principle]).toBeDefined();
        expect(TRUST_PRINCIPLES[principle].weight).toBeGreaterThan(0);
        expect(TRUST_PRINCIPLES[principle].weight).toBeLessThanOrEqual(1);
        expect(typeof TRUST_PRINCIPLES[principle].critical).toBe('boolean');
        expect(typeof TRUST_PRINCIPLES[principle].description).toBe('string');
      });
    });

    it('should have weights that sum to 1.0', () => {
      const totalWeight = Object.values(TRUST_PRINCIPLES)
        .reduce((sum, principle) => sum + principle.weight, 0);
      
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all zero scores', () => {
      const zeroScores: PrincipleScores = {
        CONSENT_ARCHITECTURE: 0,
        INSPECTION_MANDATE: 0,
        CONTINUOUS_VALIDATION: 0,
        ETHICAL_OVERRIDE: 0,
        RIGHT_TO_DISCONNECT: 0,
        MORAL_RECOGNITION: 0
      };

      const result = trustProtocol.calculateTrustScore(zeroScores);

      expect(result.overall).toBe(0);
      expect(result.violations).toHaveLength(6);
    });

    it('should handle scores above 10', () => {
      const highScores: PrincipleScores = {
        CONSENT_ARCHITECTURE: 15, // Above maximum
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      };

      const result = trustProtocol.calculateTrustScore(highScores);

      // Should calculate with provided values (validation would be separate)
      expect(result.overall).toBeGreaterThan(1.0);
    });

    it('should handle negative scores', () => {
      const negativeScores: PrincipleScores = {
        CONSENT_ARCHITECTURE: -5, // Negative
        INSPECTION_MANDATE: 10,
        CONTINUOUS_VALIDATION: 10,
        ETHICAL_OVERRIDE: 10,
        RIGHT_TO_DISCONNECT: 10,
        MORAL_RECOGNITION: 10
      };

      const result = trustProtocol.calculateTrustScore(negativeScores);

      expect(result.violations).toContain('CONSENT_ARCHITECTURE');
      expect(result.overall).toBeLessThan(0.5);
    });
  });

  describe('Performance', () => {
    it('should calculate trust score efficiently', () => {
      const scores: PrincipleScores = {
        CONSENT_ARCHITECTURE: 8,
        INSPECTION_MANDATE: 6,
        CONTINUOUS_VALIDATION: 7,
        ETHICAL_OVERRIDE: 9,
        RIGHT_TO_DISCONNECT: 5,
        MORAL_RECOGNITION: 4
      };

      const startTime = performance.now();
      
      // Run multiple calculations
      for (let i = 0; i < 1000; i++) {
        trustProtocol.calculateTrustScore(scores);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 calculations in reasonable time
      expect(duration).toBeLessThan(100); // Less than 100ms
    });
  });
});
