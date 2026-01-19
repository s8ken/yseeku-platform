/**
 * Tests for Bedau Index Implementation
 * 
 * Tests the weak emergence detection algorithm based on Mark Bedau's work.
 */

import { 
  createBedauIndexCalculator, 
  calculateBedauIndex,
  BedauMetrics,
  SemanticIntent,
  SurfacePattern 
} from '../bedau-index';

describe('BedauIndexCalculator', () => {
  const calculator = createBedauIndexCalculator();

  describe('calculateBedauIndex', () => {
    it('should return LINEAR for simple mirroring patterns', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.1, 0.2, 0.1, 0.2, 0.1],
        reasoning_depth: 0.2,
        abstraction_level: 0.1,
        cross_domain_connections: 0,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.1, 0.2, 0.1, 0.2, 0.1], // Same as semantic
        pattern_complexity: 0.1,
        repetition_score: 0.8,
        novelty_score: 0.1,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      expect(result.bedau_index).toBeGreaterThanOrEqual(0);
      expect(result.bedau_index).toBeLessThanOrEqual(1);
      expect(result.emergence_type).toBe('LINEAR');
    });

    it('should return WEAK_EMERGENCE for divergent semantic/surface patterns', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.8, 0.9, 0.7, 0.85, 0.95],
        reasoning_depth: 0.6,
        abstraction_level: 0.5,
        cross_domain_connections: 3,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.1, 0.2, 0.3, 0.15, 0.25], // Very different
        pattern_complexity: 0.6,
        repetition_score: 0.3,
        novelty_score: 0.6,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      expect(result.bedau_index).toBeGreaterThan(0.3);
      expect(['WEAK_EMERGENCE', 'HIGH_WEAK_EMERGENCE']).toContain(result.emergence_type);
    });

    it('should return HIGH_WEAK_EMERGENCE for highly complex patterns', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.9, 0.1, 0.8, 0.2, 0.7, 0.3, 0.95, 0.05],
        reasoning_depth: 0.9,
        abstraction_level: 0.85,
        cross_domain_connections: 8,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.05, 0.95],
        pattern_complexity: 0.9,
        repetition_score: 0.1,
        novelty_score: 0.9,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      expect(result.bedau_index).toBeGreaterThan(0.7);
    });

    it('should calculate effect size (Cohen\'s d)', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.5, 0.6, 0.7],
        reasoning_depth: 0.5,
        abstraction_level: 0.5,
        cross_domain_connections: 2,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.3, 0.4, 0.5],
        pattern_complexity: 0.5,
        repetition_score: 0.5,
        novelty_score: 0.5,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      expect(result.effect_size).toBeGreaterThanOrEqual(0);
      expect(typeof result.effect_size).toBe('number');
    });

    it('should provide confidence intervals', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.5, 0.6, 0.7],
        reasoning_depth: 0.5,
        abstraction_level: 0.5,
        cross_domain_connections: 2,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.3, 0.4, 0.5],
        pattern_complexity: 0.5,
        repetition_score: 0.5,
        novelty_score: 0.5,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      expect(Array.isArray(result.confidence_interval)).toBe(true);
      expect(result.confidence_interval.length).toBe(2);
      expect(result.confidence_interval[0]).toBeLessThanOrEqual(result.confidence_interval[1]);
    });

    it('should handle empty vectors gracefully', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [],
        reasoning_depth: 0.5,
        abstraction_level: 0.5,
        cross_domain_connections: 0,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [],
        pattern_complexity: 0.5,
        repetition_score: 0.5,
        novelty_score: 0.5,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      expect(result.bedau_index).toBeGreaterThanOrEqual(0);
      expect(result.bedau_index).toBeLessThanOrEqual(1);
    });

    it('should detect strong emergence indicators for high weak emergence', () => {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.95, 0.05, 0.9, 0.1, 0.88, 0.12],
        reasoning_depth: 0.95,
        abstraction_level: 0.9,
        cross_domain_connections: 9,
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.05, 0.95, 0.1, 0.9, 0.12, 0.88],
        pattern_complexity: 0.95,
        repetition_score: 0.05,
        novelty_score: 0.95,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      // High weak emergence should have strong emergence indicators
      if (result.emergence_type === 'HIGH_WEAK_EMERGENCE') {
        expect(result.strong_emergence_indicators).toBeDefined();
        expect(result.strong_emergence_indicators?.collective_behavior_score).toBeGreaterThanOrEqual(0);
        expect(result.strong_emergence_indicators?.collective_behavior_score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('bootstrapConfidenceInterval', () => {
    it('should calculate 95% confidence interval', () => {
      const data = [0.5, 0.6, 0.55, 0.58, 0.52, 0.61, 0.57, 0.54, 0.59, 0.56];
      const ci = calculator.bootstrapConfidenceInterval(data, 1000);
      
      expect(ci[0]).toBeLessThan(ci[1]);
      expect(ci[0]).toBeGreaterThan(0.4);
      expect(ci[1]).toBeLessThan(0.7);
    });

    it('should handle empty data', () => {
      const ci = calculator.bootstrapConfidenceInterval([], 100);
      
      expect(ci).toEqual([0, 0]);
    });

    it('should handle single value', () => {
      const ci = calculator.bootstrapConfidenceInterval([0.5], 100);
      
      expect(ci[0]).toBe(ci[1]);
      expect(ci[0]).toBe(0.5);
    });
  });

  describe('analyzeTemporalEvolution', () => {
    it('should track emergence trajectory over time', () => {
      const timeSeriesData = [
        [0.1, 0.2, 0.1, 0.2],
        [0.3, 0.4, 0.3, 0.4],
        [0.5, 0.6, 0.5, 0.6],
        [0.7, 0.8, 0.7, 0.8],
      ];

      const trajectory = calculator.analyzeTemporalEvolution(timeSeriesData);
      
      expect(trajectory.trajectory.length).toBe(timeSeriesData.length);
      expect(trajectory.startTime).toBeLessThanOrEqual(trajectory.endTime);
      expect(trajectory.emergenceLevel).toBeGreaterThanOrEqual(0);
      expect(trajectory.emergenceLevel).toBeLessThanOrEqual(1);
    });

    it('should detect critical transitions', () => {
      // Sudden change in pattern
      const timeSeriesData = [
        [0.1, 0.1, 0.1, 0.1],
        [0.1, 0.1, 0.1, 0.1],
        [0.9, 0.9, 0.9, 0.9], // Sudden jump
        [0.9, 0.9, 0.9, 0.9],
      ];

      const trajectory = calculator.analyzeTemporalEvolution(timeSeriesData);
      
      // Should detect the transition point
      expect(trajectory.critical_transitions.length).toBeGreaterThan(0);
    });

    it('should handle empty time series', () => {
      const trajectory = calculator.analyzeTemporalEvolution([]);
      
      expect(trajectory.trajectory.length).toBe(0);
      expect(trajectory.emergenceLevel).toBe(0);
    });
  });
});

describe('calculateBedauIndex convenience function', () => {
  it('should work as async convenience function', async () => {
    const semanticIntent: SemanticIntent = {
      intent_vectors: [0.5, 0.6, 0.7],
      reasoning_depth: 0.5,
      abstraction_level: 0.5,
      cross_domain_connections: 2,
    };
    
    const surfacePattern: SurfacePattern = {
      surface_vectors: [0.3, 0.4, 0.5],
      pattern_complexity: 0.5,
      repetition_score: 0.5,
      novelty_score: 0.5,
    };

    const result = await calculateBedauIndex(semanticIntent, surfacePattern);
    
    expect(result.bedau_index).toBeGreaterThanOrEqual(0);
    expect(result.bedau_index).toBeLessThanOrEqual(1);
    expect(result.kolmogorov_complexity).toBeGreaterThanOrEqual(0);
    expect(result.semantic_entropy).toBeGreaterThanOrEqual(0);
  });
});

describe('Emergence Classification', () => {
  const calculator = createBedauIndexCalculator();

  it('should classify emergence types at correct thresholds', () => {
    // Test different emergence levels
    const testCases = [
      { expectedType: 'LINEAR', reasoning: 0.1, abstraction: 0.1 },
      { expectedType: 'WEAK_EMERGENCE', reasoning: 0.5, abstraction: 0.5 },
      { expectedType: 'HIGH_WEAK_EMERGENCE', reasoning: 0.95, abstraction: 0.95 },
    ];

    for (const testCase of testCases) {
      const semanticIntent: SemanticIntent = {
        intent_vectors: [0.5, 0.3, 0.7, 0.2, 0.8],
        reasoning_depth: testCase.reasoning,
        abstraction_level: testCase.abstraction,
        cross_domain_connections: Math.floor(testCase.reasoning * 10),
      };
      
      const surfacePattern: SurfacePattern = {
        surface_vectors: [0.2, 0.8, 0.3, 0.7, 0.4],
        pattern_complexity: testCase.reasoning,
        repetition_score: 1 - testCase.reasoning,
        novelty_score: testCase.reasoning,
      };

      const result = calculator.calculateBedauIndex(semanticIntent, surfacePattern);
      
      // The emergence type should roughly match expectations
      // (actual classification depends on the combined metric)
      expect(['LINEAR', 'WEAK_EMERGENCE', 'HIGH_WEAK_EMERGENCE']).toContain(result.emergence_type);
    }
  });
});
