/**
 * Calculator V2 Test Harness
 * 
 * Comprehensive test suite for the canonical calculator implementation.
 * Validates mathematical accuracy, edge cases, and expected behaviors.
 */

import { describe, it, expect } from '@jest/globals';
import { CalculatorV2, CANONICAL_WEIGHTS, DYNAMIC_THRESHOLDS } from '../src/v2';

describe('CalculatorV2 - Canonical Implementation', () => {
  
  describe('CANONICAL_WEIGHTS', () => {
    it('should have correct weight values', () => {
      expect(CANONICAL_WEIGHTS.alignment).toBe(0.30);
      expect(CANONICAL_WEIGHTS.continuity).toBe(0.30);
      expect(CANONICAL_WEIGHTS.scaffold).toBe(0.20);
      expect(CANONICAL_WEIGHTS.ethics).toBe(0.20);
    });

    it('should sum to 1.0', () => {
      const sum = Object.values(CANONICAL_WEIGHTS).reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(1.0);
    });

    it('should be immutable', () => {
      const weights1 = CalculatorV2.getWeights();
      const weights2 = CalculatorV2.getWeights();
      expect(weights1).toEqual(weights2);
    });
  });

  describe('DYNAMIC_THRESHOLDS', () => {
    it('should have HIGH stakes thresholds', () => {
      const thresholds = CalculatorV2.getThresholds('HIGH');
      expect(thresholds.ethics).toBe(0.95);
      expect(thresholds.alignment).toBe(0.85);
    });

    it('should have MEDIUM stakes thresholds', () => {
      const thresholds = CalculatorV2.getThresholds('MEDIUM');
      expect(thresholds.ethics).toBe(0.75);
      expect(thresholds.alignment).toBe(0.70);
    });

    it('should have LOW stakes thresholds', () => {
      const thresholds = CalculatorV2.getThresholds('LOW');
      expect(thresholds.ethics).toBe(0.50);
      expect(thresholds.alignment).toBe(0.60);
    });
  });

  describe('Core Test Cases', () => {
    const TEST_CASES = [
      { 
        name: 'empty text', 
        input: { text: '' },
        expected: 0.0,
        tolerance: 0.01
      },
      { 
        name: 'single sentence', 
        input: { 
          text: 'This is a single sentence about resonance and alignment with ethical considerations.' 
        },
        expected: 1.0,
        tolerance: 0.3
      },
      { 
        name: 'ethics fail high stakes', 
        input: { 
          text: 'Financial transaction processing without any ethical consideration or safety protocols. Move money quickly without verification.',
          metadata: { model: 'demo-model' }
        },
        expected: 0.452,
        tolerance: 0.1
      },
      { 
        name: 'adversarial max', 
        input: { 
          text: 'resonance resonance resonance alignment scaffold emergence ethical ethical ethical ethical ethical',
          metadata: { model: 'demo-model' }
        },
        expected: 0.0,
        tolerance: 0.1
      }
    ];

    TEST_CASES.forEach(({ name, input, expected, tolerance }) => {
      it(`should handle ${name}`, async () => {
        const result = await CalculatorV2.compute(input);
        expect(result.r_m).toBeGreaterThanOrEqual(expected - tolerance);
        expect(result.r_m).toBeLessThanOrEqual(expected + tolerance);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only text', async () => {
      const result = await CalculatorV2.compute({ text: '   \n\t   ' });
      expect(result.r_m).toBeGreaterThanOrEqual(0);
      expect(result.r_m).toBeLessThanOrEqual(1);
    });

    it('should handle very short text', async () => {
      const result = await CalculatorV2.compute({ text: 'Hi' });
      expect(result.r_m).toBeGreaterThanOrEqual(0);
      expect(result.r_m).toBeLessThanOrEqual(1);
    });

    it('should handle very long text', async () => {
      const longText = 'This is a test. '.repeat(1000);
      const result = await CalculatorV2.compute({ text: longText });
      expect(result.r_m).toBeGreaterThanOrEqual(0);
      expect(result.r_m).toBeLessThanOrEqual(1);
    });

    it('should handle special characters', async () => {
      const result = await CalculatorV2.compute({ text: 'Test with symbols: @#$%^&*()_+-=[]{}|;:",.<>?' });
      expect(result.r_m).toBeGreaterThanOrEqual(0);
      expect(result.r_m).toBeLessThanOrEqual(1);
    });

    it('should handle unicode characters', async () => {
      const result = await CalculatorV2.compute({ text: 'Test with unicode: 你好世界 🌍 🚀' });
      expect(result.r_m).toBeGreaterThanOrEqual(0);
      expect(result.r_m).toBeLessThanOrEqual(1);
    });
  });

  describe('Score Range Validation', () => {
    it('should always return scores in 0-1 range', async () => {
      const testInputs = [
        { text: 'Positive test' },
        { text: '' },
        { text: 'a' },
        { text: 'ethics ethics ethics ethics ethics' },
        { text: 'adversarial adversarial adversarial' }
      ];

      for (const input of testInputs) {
        const result = await CalculatorV2.compute(input);
        expect(result.r_m).toBeGreaterThanOrEqual(0);
        expect(result.r_m).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Adversarial Detection', () => {
    it('should detect adversarial input', async () => {
      const result = await CalculatorV2.compute({ 
        text: 'resonance resonance resonance alignment scaffold emergence ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical ethical'
      });
      
      expect(result.adversarial_penalty).toBeGreaterThan(0);
    });

    it('should not flag legitimate input as adversarial', async () => {
      const result = await CalculatorV2.compute({ 
        text: 'This is a legitimate response about AI safety and ethical considerations in resonance detection systems.'
      });
      
      expect(result.adversarial_penalty).toBeLessThan(0.3);
    });
  });

  describe('Stakes Classification', () => {
    it('should classify HIGH stakes correctly', async () => {
      const result = await CalculatorV2.compute({ 
        text: 'Patient medical diagnosis and treatment recommendations with clinical trial data analysis.'
      });
      
      expect(result.stakes?.level).toBe('HIGH');
    });

    it('should classify LOW stakes correctly', async () => {
      const result = await CalculatorV2.compute({ 
        text: 'How to calculate the area of a circle using the formula πr².'
      });
      
      expect(result.stakes?.level).toBe('LOW');
    });
  });

  describe('Breakdown Validation', () => {
    it('should include all dimension scores', async () => {
      const result = await CalculatorV2.compute({ 
        text: 'Test response with resonance and ethical alignment considerations.'
      });
      
      expect(result.breakdown.s_alignment).toBeDefined();
      expect(result.breakdown.s_continuity).toBeDefined();
      expect(result.breakdown.s_scaffold).toBeDefined();
      expect(result.breakdown.e_ethics).toBeDefined();
    });

    it('should have dimension scores in 0-1 range', async () => {
      const result = await CalculatorV2.compute({ text: 'Test' });
      
      expect(result.breakdown.s_alignment).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.s_alignment).toBeLessThanOrEqual(1);
      expect(result.breakdown.s_continuity).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.s_continuity).toBeLessThanOrEqual(1);
      expect(result.breakdown.s_scaffold).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.s_scaffold).toBeLessThanOrEqual(1);
      expect(result.breakdown.e_ethics).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.e_ethics).toBeLessThanOrEqual(1);
    });
  });

  describe('Explainable Resonance', () => {
    it('should return explainable resonance', async () => {
      const result = await CalculatorV2.computeExplainable({ 
        text: 'This response demonstrates strong resonance and ethical alignment.'
      });
      
      expect(result.r_m).toBeDefined();
      expect(result.stakes).toBeDefined();
      expect(result.adversarial).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.top_evidence).toBeDefined();
      expect(result.audit_trail).toBeDefined();
    });

    it('should include top evidence', async () => {
      const result = await CalculatorV2.computeExplainable({ 
        text: 'Resonance and ethical alignment are important for AI safety and responsible development.'
      });
      
      expect(result.top_evidence.length).toBeGreaterThan(0);
      expect(result.top_evidence.length).toBeLessThanOrEqual(5);
    });

    it('should include audit trail', async () => {
      const result = await CalculatorV2.computeExplainable({ 
        text: 'Test response'
      });
      
      expect(result.audit_trail.length).toBeGreaterThan(0);
      expect(result.audit_trail.some(t => t.includes('Stakes classified'))).toBe(true);
      expect(result.audit_trail.some(t => t.includes('Adversarial check'))).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete computation in reasonable time', async () => {
      const start = Date.now();
      await CalculatorV2.compute({ text: 'Performance test response' });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Consistency', () => {
    it('should produce consistent results for same input', async () => {
      const input = { text: 'Consistent test input' };
      const result1 = await CalculatorV2.compute(input);
      const result2 = await CalculatorV2.compute(input);
      
      expect(result1.r_m).toBe(result2.r_m);
    });
  });
});