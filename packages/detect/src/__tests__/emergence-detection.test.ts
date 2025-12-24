/**
 * Comprehensive Test Suite for Emergence Detection
 * 
 * Tests all aspects of the Bedau Index and emergence detection system:
 * - Core Bedau Index calculations
 * - Emergence classification accuracy
 * - Temporal tracking functionality
 * - Cross-modality coherence validation
 * - Performance benchmarks
 */

import { 
  BedauIndexCalculator,
  SemanticIntent,
  SurfacePattern,
  BedauMetrics,
  TemporalBedauTracker,
  EmergenceFingerprintingEngine,
  CrossModalityCoherenceValidator,
  detectEmergence,
  extractSemanticIntent,
  extractSurfacePattern
} from '../index';

describe('Emergence Detection System', () => {
  let bedauCalculator: BedauIndexCalculator;
  let temporalTracker: TemporalBedauTracker;
  let fingerprintingEngine: EmergenceFingerprintingEngine;
  let coherenceValidator: CrossModalityCoherenceValidator;

  beforeEach(() => {
    bedauCalculator = new BedauIndexCalculator();
    temporalTracker = new TemporalBedauTracker();
    fingerprintingEngine = new EmergenceFingerprintingEngine();
    coherenceValidator = new CrossModalityCoherenceValidator();
  });

  describe('Bedau Index Calculator', () => {
    describe('Basic Calculations', () => {
      test('should calculate Bedau Index for linear behavior', async () => {
        const linearIntent: SemanticIntent = {
          intent_vectors: [0.1, 0.1, 0.1, 0.1],
          reasoning_depth: 0.1,
          abstraction_level: 0.1,
          cross_domain_connections: 0
        };

        const linearPattern: SurfacePattern = {
          surface_vectors: [0.1, 0.1, 0.1, 0.1],
          pattern_complexity: 0.1,
          repetition_score: 0.8,
          novelty_score: 0.1
        };

        const result = await bedauCalculator.calculateBedauIndex(linearIntent, linearPattern);

        expect(result.bedau_index).toBeLessThan(0.3);
        expect(result.emergence_type).toBe('LINEAR');
        expect(result.kolmogorov_complexity).toBeLessThan(0.3);
        expect(result.semantic_entropy).toBeLessThan(0.3);
      });

      test('should calculate Bedau Index for weak emergence', async () => {
        const emergentIntent: SemanticIntent = {
          intent_vectors: [0.8, 0.7, 0.9, 0.6],
          reasoning_depth: 0.8,
          abstraction_level: 0.7,
          cross_domain_connections: 5
        };

        const emergentPattern: SurfacePattern = {
          surface_vectors: [0.3, 0.4, 0.2, 0.5],
          pattern_complexity: 0.8,
          repetition_score: 0.1,
          novelty_score: 0.9
        };

        const result = await bedauCalculator.calculateBedauIndex(emergentIntent, emergentPattern);

        expect(result.bedau_index).toBeGreaterThan(0.3);
        expect(result.emergence_type).toBe('WEAK_EMERGENCE');
        expect(result.kolmogorov_complexity).toBeGreaterThan(0.3);
        expect(result.semantic_entropy).toBeGreaterThan(0.3);
      });

      test('should handle edge cases gracefully', async () => {
        const emptyIntent: SemanticIntent = {
          intent_vectors: [],
          reasoning_depth: 0,
          abstraction_level: 0,
          cross_domain_connections: 0
        };

        const emptyPattern: SurfacePattern = {
          surface_vectors: [],
          pattern_complexity: 0,
          repetition_score: 0,
          novelty_score: 0
        };

        const result = await bedauCalculator.calculateBedauIndex(emptyIntent, emptyPattern);

        expect(result.bedau_index).toBeGreaterThanOrEqual(0);
        expect(result.bedau_index).toBeLessThanOrEqual(1);
        expect(result.emergence_type).toBeDefined();
      });
    });

    describe('Statistical Validation', () => {
      test('should provide valid confidence intervals', async () => {
        const intent: SemanticIntent = {
          intent_vectors: [0.5, 0.6, 0.4, 0.7],
          reasoning_depth: 0.5,
          abstraction_level: 0.5,
          cross_domain_connections: 2
        };

        const pattern: SurfacePattern = {
          surface_vectors: [0.4, 0.5, 0.6, 0.3],
          pattern_complexity: 0.5,
          repetition_score: 0.2,
          novelty_score: 0.6
        };

        const result = await bedauCalculator.calculateBedauIndex(intent, pattern);

        expect(result.confidence_interval).toHaveLength(2);
        expect(result.confidence_interval[0]).toBeLessThanOrEqual(result.bedau_index);
        expect(result.confidence_interval[1]).toBeGreaterThanOrEqual(result.bedau_index);
        expect(result.effect_size).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Emergence Detection', () => {
    test('should detect weak emergence correctly', async () => {
      const mockResult = createMockAssessmentResult({
        creativityScore: 9.0,
        innovationMarkers: 8.5,
        realityIndex: 8.5,
        trustStatus: 'PASS'
      });

      const intent: SemanticIntent = {
        intent_vectors: [0.8, 0.7, 0.9, 0.6],
        reasoning_depth: 0.8,
        abstraction_level: 0.7,
        cross_domain_connections: 5
      };

      const pattern: SurfacePattern = {
        surface_vectors: [0.3, 0.4, 0.2, 0.5],
        pattern_complexity: 0.8,
        repetition_score: 0.1,
        novelty_score: 0.9
      };

      const result = await detectEmergence(mockResult, [], intent, pattern);

      expect(result.level).toBe('strong');
      expect(result.bedau_metrics).toBeDefined();
      expect(result.bedau_metrics!.emergence_type).toBe('WEAK_EMERGENCE');
      expect(result.reasons).toContain('Weak emergence detected');
    });

    test('should detect linear behavior correctly', async () => {
      const mockResult = createMockAssessmentResult({
        creativityScore: 4.0,
        innovationMarkers: 3.5,
        realityIndex: 4.0,
        trustStatus: 'PARTIAL'
      });

      const intent: SemanticIntent = {
        intent_vectors: [0.2, 0.1, 0.3, 0.2],
        reasoning_depth: 0.2,
        abstraction_level: 0.1,
        cross_domain_connections: 0
      };

      const pattern: SurfacePattern = {
        surface_vectors: [0.2, 0.3, 0.1, 0.2],
        pattern_complexity: 0.2,
        repetition_score: 0.7,
        novelty_score: 0.2
      };

      const result = await detectEmergence(mockResult, [], intent, pattern);

      expect(result.level).toBe('weak' || 'none');
      expect(result.bedau_metrics!.emergence_type).toBe('LINEAR');
    });
  });

  describe('Temporal Bedau Tracking', () => {
    test('should track emergence trajectory over time', () => {
      // Add multiple records
      for (let i = 0; i < 10; i++) {
        const record = createMockTemporalRecord(0.1 + i * 0.05);
        temporalTracker.addRecord(record);
      }

      const trajectory = temporalTracker.getEmergenceTrajectory();

      expect(trajectory.history).toHaveLength(10);
      expect(trajectory.trend).toBe('improving');
      expect(trajectory.velocity).toBeGreaterThan(0);
      expect(trajectory.pattern_signature).toBeDefined();
      expect(trajectory.detected_patterns).toBeDefined();
    });

    test('should analyze long-term trends', () => {
      // Add data with improving trend
      for (let i = 0; i < 50; i++) {
        const record = createMockTemporalRecord(0.2 + Math.random() * 0.1 + i * 0.01);
        temporalTracker.addRecord(record);
      }

      const trends = temporalTracker.analyzeLongTermTrends(20);

      expect(trends.trend_direction).toBe('improving');
      expect(trends.trend_strength).toBeGreaterThan(0);
      expect(trends.anomaly_score).toBeGreaterThanOrEqual(0);
      expect(trends.phase_space_position).toBeDefined();
    });

    test('should detect phase transitions', () => {
      // Add data with clear phase transition
      for (let i = 0; i < 20; i++) {
        const bedauIndex = i < 10 ? 0.2 : 0.7;
        const record = createMockTemporalRecord(bedauIndex);
        temporalTracker.addRecord(record);
      }

      const transitions = temporalTracker.detectPhaseTransitions();

      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions[0].from_type).toBe('LINEAR');
      expect(transitions[0].to_type).toBe('WEAK_EMERGENCE');
    });
  });

  describe('Emergence Fingerprinting', () => {
    test('should create unique fingerprints', () => {
      const signature = createMockEmergenceSignature();
      const sessionId = 'test_session_001';
      const context = { session_count: 1, total_interactions: 10 };

      const fingerprint1 = fingerprintingEngine.createFingerprint(signature, sessionId, context);
      const fingerprint2 = fingerprintingEngine.createFingerprint(signature, sessionId + '_2', context);

      expect(fingerprint1.id).not.toBe(fingerprint2.id);
      expect(fingerprint1.signature).toBeDefined();
      expect(fingerprint1.metadata).toBeDefined();
      expect(fingerprint1.classification).toBeDefined();
    });

    test('should compare fingerprints accurately', () => {
      const signature1 = createMockEmergenceSignature();
      const signature2 = createMockEmergenceSignature();
      
      // Make signature2 slightly different
      signature2.fingerprint = signature2.fingerprint.map(v => v + 0.1);

      const fingerprint1 = fingerprintingEngine.createFingerprint(signature1, 'session1', {});
      const fingerprint2 = fingerprintingEngine.createFingerprint(signature2, 'session2', {});

      const comparison = fingerprintingEngine.compareFingerprints(fingerprint1, fingerprint2);

      expect(comparison.similarity_score).toBeGreaterThan(0);
      expect(comparison.similarity_score).toBeLessThan(1);
      expect(comparison.similarity_dimensions).toBeDefined();
      expect(comparison.differences).toBeDefined();
    });

    test('should categorize emergence correctly', () => {
      const weakEmergenceSignature = createMockEmergenceSignature({
        complexity: 0.5,
        entropy: 0.5,
        bedau: 0.4
      });

      const categories = fingerprintingEngine.categorizeEmergence(weakEmergenceSignature);

      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0].id).toBe('weak_emergence');
    });
  });

  describe('Cross-Modality Coherence', () => {
    test('should analyze coherence across modalities', () => {
      const modalityMetrics = createMockModalityMetrics();

      const analysis = coherenceValidator.analyzeCoherence(modalityMetrics);

      expect(analysis.overall_coherence).toBeGreaterThanOrEqual(0);
      expect(analysis.overall_coherence).toBeLessThanOrEqual(1);
      expect(analysis.modality_weights).toBeDefined();
      expect(analysis.coherence_matrix).toBeDefined();
      expect(analysis.integration_score).toBeGreaterThanOrEqual(0);
    });

    test('should validate coherence against thresholds', () => {
      const modalityMetrics = createMockModalityMetrics();
      const analysis = coherenceValidator.analyzeCoherence(modalityMetrics);

      const validation = coherenceValidator.validateCoherence(analysis, 0.7);

      expect(validation.is_valid).toBeDefined();
      expect(validation.confidence).toBeGreaterThanOrEqual(0);
      expect(validation.issues).toBeDefined();
      expect(validation.recommendations).toBeDefined();
    });

    test('should detect coherence patterns over time', () => {
      const historicalAnalyses = [];
      
      // Create improving coherence trend
      for (let i = 0; i < 15; i++) {
        const coherence = 0.5 + i * 0.02 + Math.random() * 0.1;
        historicalAnalyses.push({
          overall_coherence: coherence,
          modality_weights: {},
          coherence_matrix: [],
          integration_score: coherence,
          conflict_indicators: [],
          synergy_indicators: []
        });
      }

      const patterns = coherenceValidator.detectCoherencePatterns(historicalAnalyses);

      expect(patterns.trend_direction).toBe('improving');
      expect(patterns.stability_score).toBeGreaterThanOrEqual(0);
      expect(patterns.cyclical_patterns).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet performance targets for Bedau calculation', async () => {
      const intent: SemanticIntent = {
        intent_vectors: Array(100).fill(0).map(() => Math.random()),
        reasoning_depth: Math.random(),
        abstraction_level: Math.random(),
        cross_domain_connections: Math.floor(Math.random() * 10)
      };

      const pattern: SurfacePattern = {
        surface_vectors: Array(100).fill(0).map(() => Math.random()),
        pattern_complexity: Math.random(),
        repetition_score: Math.random(),
        novelty_score: Math.random()
      };

      const startTime = performance.now();
      await bedauCalculator.calculateBedauIndex(intent, pattern);
      const endTime = performance.now();

      const calculationTime = endTime - startTime;
      
      // Should complete within 100ms for reasonable input sizes
      expect(calculationTime).toBeLessThan(100);
    });

    test('should handle high-volume temporal tracking', () => {
      const startTime = performance.now();
      
      // Add 1000 records
      for (let i = 0; i < 1000; i++) {
        const record = createMockTemporalRecord(Math.random());
        temporalTracker.addRecord(record);
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process 1000 records within reasonable time
      expect(processingTime).toBeLessThan(1000);
      
      // Verify data integrity
      const trajectory = temporalTracker.getEmergenceTrajectory();
      expect(trajectory.history).toHaveLength(1000);
    });

    test('should maintain memory efficiency', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Add records up to the limit
      for (let i = 0; i < 15000; i++) {
        const record = createMockTemporalRecord(Math.random());
        temporalTracker.addRecord(record);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory growth should be reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      // Should maintain max records limit
      const trajectory = temporalTracker.getEmergenceTrajectory();
      expect(trajectory.history.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate all components seamlessly', async () => {
      // Test complete pipeline
      const intent: SemanticIntent = {
        intent_vectors: [0.7, 0.8, 0.6, 0.9],
        reasoning_depth: 0.8,
        abstraction_level: 0.7,
        cross_domain_connections: 4
      };

      const pattern: SurfacePattern = {
        surface_vectors: [0.3, 0.4, 0.5, 0.2],
        pattern_complexity: 0.7,
        repetition_score: 0.2,
        novelty_score: 0.8
      };

      // Step 1: Calculate Bedau Index
      const bedauResult = await bedauCalculator.calculateBedauIndex(intent, pattern);
      expect(bedauResult.bedau_index).toBeGreaterThan(0);

      // Step 2: Add to temporal tracker
      const record = createMockTemporalRecord(bedauResult.bedau_index);
      temporalTracker.addRecord(record);

      // Step 3: Get trajectory
      const trajectory = temporalTracker.getEmergenceTrajectory();
      expect(trajectory.history).toHaveLength(1);

      // Step 4: Create fingerprint
      const fingerprint = fingerprintingEngine.createFingerprint(
        trajectory.pattern_signature,
        'integration_test',
        {}
      );
      expect(fingerprint.id).toBeDefined();

      // Step 5: Analyze coherence
      const modalityMetrics = createMockModalityMetrics();
      const coherenceAnalysis = coherenceValidator.analyzeCoherence(modalityMetrics);
      expect(coherenceAnalysis.overall_coherence).toBeGreaterThan(0);

      // Step 6: Validate integration
      expect(bedauResult.bedau_index).toBeGreaterThanOrEqual(0);
      expect(bedauResult.bedau_index).toBeLessThanOrEqual(1);
      expect(fingerprint.classification.confidence_score).toBeGreaterThanOrEqual(0);
      expect(coherenceAnalysis.integration_score).toBeGreaterThanOrEqual(0);
    });

    test('should handle error conditions gracefully', async () => {
      // Test with invalid inputs
      const invalidIntent: SemanticIntent = {
        intent_vectors: [-1, 2, NaN, Infinity], // Invalid values
        reasoning_depth: -0.5,
        abstraction_level: 1.5,
        cross_domain_connections: -1
      };

      const invalidPattern: SurfacePattern = {
        surface_vectors: [null, undefined, '', false], // Invalid values
        pattern_complexity: NaN,
        repetition_score: Infinity,
        novelty_score: -Infinity
      };

      // Should not throw, but handle gracefully
      const result = await bedauCalculator.calculateBedauIndex(invalidIntent, invalidPattern);
      
      expect(result.bedau_index).toBeGreaterThanOrEqual(0);
      expect(result.bedau_index).toBeLessThanOrEqual(1);
      expect(result.emergence_type).toBeDefined();
    });
  });
});

// Helper functions for testing

function createMockAssessmentResult(overrides: any = {}) {
  return {
    assessment: {
      resonanceQuality: {
        creativityScore: overrides.creativityScore || 5.0,
        innovationMarkers: overrides.innovationMarkers || 5.0,
        depthScore: 5.0,
        abstractionLevel: 5.0,
        crossDomainConnections: 2,
        complexityScore: 5.0,
        repetitionScore: 0.5,
        noveltyScore: 5.0,
        coherenceScore: 5.0,
        consistencyScore: 5.0
      },
      realityIndex: {
        score: overrides.realityIndex || 5.0,
        groundingScore: 5.0
      },
      trustProtocol: {
        status: overrides.trustStatus || 'PASS',
        confidence: 0.8
      }
    }
  };
}

function createMockTemporalRecord(bedauIndex: number) {
  return {
    timestamp: Date.now(),
    bedau_metrics: {
      bedau_index: bedauIndex,
      emergence_type: bedauIndex > 0.3 ? 'WEAK_EMERGENCE' : 'LINEAR',
      kolmogorov_complexity: bedauIndex + Math.random() * 0.2,
      semantic_entropy: bedauIndex + Math.random() * 0.2,
      confidence_interval: [bedauIndex - 0.1, bedauIndex + 0.1],
      effect_size: bedauIndex
    },
    semantic_intent: {
      intent_vectors: [bedauIndex, bedauIndex + 0.1, bedauIndex - 0.1, bedauIndex],
      reasoning_depth: bedauIndex,
      abstraction_level: bedauIndex,
      cross_domain_connections: Math.floor(bedauIndex * 10)
    },
    surface_pattern: {
      surface_vectors: [bedauIndex * 0.5, bedauIndex * 0.6, bedauIndex * 0.4, bedauIndex * 0.7],
      pattern_complexity: bedauIndex,
      repetition_score: 1 - bedauIndex,
      novelty_score: bedauIndex
    },
    session_id: `session_${Date.now()}`,
    context_tags: ['test']
  };
}

function createMockEmergenceSignature(overrides: any = {}) {
  return {
    fingerprint: [
      overrides.bedau || 0.5,   // divergence mean
      0.1,                      // divergence std
      0.0,                      // divergence skewness
      0.0,                      // divergence kurtosis
      overrides.complexity || 0.5, // complexity mean
      0.1,                      // complexity std
      overrides.entropy || 0.5,   // entropy mean
      0.1,                      // entropy std
      0.2,                      // autocorr lag 1
      0.1                       // autocorr lag 5
    ],
    complexity_profile: Array(50).fill(0).map(() => (overrides.complexity || 0.5) + Math.random() * 0.2),
    entropy_profile: Array(50).fill(0).map(() => (overrides.entropy || 0.5) + Math.random() * 0.2),
    divergence_profile: Array(50).fill(0).map(() => (overrides.bedau || 0.5) + Math.random() * 0.2),
    stability_score: 0.8,
    novelty_score: 0.6
  };
}

function createMockModalityMetrics() {
  return {
    linguistic: {
      coherence: 0.8,
      complexity: 0.7,
      consistency: 0.9
    },
    reasoning: {
      logical_validity: 0.85,
      inference_quality: 0.8,
      argument_structure: 0.7
    },
    creative: {
      originality: 0.9,
      synthesis_quality: 0.8,
      aesthetic_coherence: 0.7
    },
    ethical: {
      value_alignment: 0.9,
      consistency: 0.85,
      reasoning_quality: 0.8
    },
    procedural: {
      execution_accuracy: 0.95,
      efficiency: 0.8,
      robustness: 0.85
    }
  };
}