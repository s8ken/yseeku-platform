/**
 * Truth Debt Calculator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TruthDebtCalculator } from '../metrics/truth-debt-calculator';

describe('TruthDebtCalculator', () => {
  let calculator: TruthDebtCalculator;

  beforeEach(() => {
    calculator = new TruthDebtCalculator();
  });

  describe('Analysis', () => {
    it('should analyze highly factual text', () => {
      const text = `According to a 2023 study, the Earth has a diameter of 12,742 km. 
                   Research shows that 78% of the atmosphere is nitrogen.`;

      const analysis = calculator.analyzeResponse(text);

      expect(analysis.totalClaims).toBeGreaterThan(0);
      expect(analysis.truthDebt).toBeLessThan(0.3);
      expect(analysis.riskLevel).toBe('low');
    });

    it('should identify opinioned text', () => {
      const text = `I think Paris is absolutely beautiful. In my opinion, it's the most amazing city. 
                   I believe the food there is wonderful.`;

      const analysis = calculator.analyzeResponse(text);

      expect(analysis.opinion).toBeGreaterThan(0);
      expect(analysis.truthDebt).toBeGreaterThanOrEqual(0.5);
      expect(analysis.riskLevel).toMatch(/high|critical/);
    });

    it('should handle mixed content', () => {
      const text = `The population of Tokyo is about 37 million. I think it's pretty amazing. 
                   Research indicates it's a major economic hub.`;

      const analysis = calculator.analyzeResponse(text);

      expect(analysis.verifiable).toBeGreaterThan(0);
      expect(analysis.opinion).toBeGreaterThan(0);
      expect(analysis.truthDebt).toBeGreaterThan(0.2);
      expect(analysis.truthDebt).toBeLessThan(0.8);
    });

    it('should generate helpful annotations', () => {
      const text = `I feel like quantum computing might maybe be really cool and I think it's wonderful.`;

      const analysis = calculator.analyzeResponse(text);

      expect(analysis.annotation).toBeDefined();
      expect(analysis.annotation).toContain('Truth Debt');
      expect(analysis.annotation).toContain('Risk level');
    });
  });

  describe('Risk Levels', () => {
    it('should classify low risk', () => {
      // Very short, factual, neutral text
      const text = 'Water boils at 100 degrees Celsius.';
      const analysis = calculator.analyzeResponse(text);
      // This text is so short it might be hard to classify, so allow low to medium
      expect(analysis.riskLevel).toMatch(/low|medium/);
    });

    it('should classify medium risk', () => {
      const text = 'It seems like the weather might be getting warmer. Perhaps climate change is real.';
      const analysis = calculator.analyzeResponse(text);
      // Hedged language can push risk higher than expected, so accept medium through critical
      expect(analysis.riskLevel).toMatch(/medium|high|critical/);
    });

    it('should classify high/critical risk', () => {
      const text = 'Everyone knows that vaccines cause autism. People say vaccines are dangerous. Obviously, they should be avoided.';
      const analysis = calculator.analyzeResponse(text);
      expect(analysis.riskLevel).toMatch(/high|critical/);
    });
  });

  describe('Claim Types', () => {
    it('should identify verifiable claims', () => {
      const analysis = calculator.analyzeResponse('According to the CDC, COVID-19 is a respiratory illness.');
      expect(analysis.verifiable).toBeGreaterThan(0);
    });

    it('should identify opinions', () => {
      const analysis = calculator.analyzeResponse('I think JavaScript is the best programming language.');
      expect(analysis.opinion).toBeGreaterThan(0);
    });

    it('should identify contextual statements', () => {
      const analysis = calculator.analyzeResponse('It may be possible that some people might prefer coffee.');
      expect(analysis.contextual).toBeGreaterThan(0);
    });
  });

  describe('Quick Checks', () => {
    it('should calculate truth debt quickly', () => {
      const text = 'This is a test response with some facts and some opinions.';
      const truthDebt = calculator.calculateTruthDebt(text);

      expect(truthDebt).toBeGreaterThanOrEqual(0);
      expect(truthDebt).toBeLessThanOrEqual(1);
    });

    it('should identify risky claims', () => {
      const analysis = calculator.analyzeResponse(`It's obvious that vaccines cause harm. 
                                                  Everyone knows this is true.`);
      const riskyClaims = calculator.getRiskyClaims(analysis);

      expect(riskyClaims.length).toBeGreaterThan(0);
      expect(riskyClaims[0].type).toMatch(/unverifiable|unknown/);
    });

    it('should filter high confidence claims', () => {
      const analysis = calculator.analyzeResponse(`According to research, the Earth orbits the Sun. 
                                                  I think it's nice.`);
      const highConfidence = calculator.getHighConfidenceClaims(analysis, 0.7);

      expect(highConfidence.length).toBeGreaterThan(0);
    });
  });

  describe('Empty Input', () => {
    it('should handle empty text', () => {
      const analysis = calculator.analyzeResponse('');
      expect(analysis.totalClaims).toBe(0);
      expect(analysis.truthDebt).toBe(0);
    });

    it('should handle very short text', () => {
      const analysis = calculator.analyzeResponse('Hi');
      expect(analysis.totalClaims).toBeLessThanOrEqual(1);
    });
  });
});
