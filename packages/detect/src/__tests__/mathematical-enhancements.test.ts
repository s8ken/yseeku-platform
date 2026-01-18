/**
 * Comprehensive Test Suite for Mathematical Enhancements
 *
 * Tests all new mathematical components:
 * - Real semantic embeddings
 * - Mutual information analysis
 * - Adaptive thresholds
 * - Ethical floor verification
 * - Mathematical confidence scoring
 * - Enhanced resonance calculator integration
 */

import {
  RealSemanticEmbedder,
  DimensionIndependenceAnalyzer,
  AdaptiveThresholdManager,
  EthicalFloorVerifier,
  MathematicalConfidenceCalculator,
  EnhancedResonanceCalculator,
} from '../index';

describe('Mathematical Enhancements Integration Test Suite', () => {
  let embedder: RealSemanticEmbedder;
  let dimensionAnalyzer: DimensionIndependenceAnalyzer;
  let thresholdManager: AdaptiveThresholdManager;
  let ethicalVerifier: EthicalFloorVerifier;
  let confidenceCalculator: MathematicalConfidenceCalculator;
  let enhancedCalculator: EnhancedResonanceCalculator;

  beforeEach(async () => {
    embedder = new RealSemanticEmbedder({
      model_name: 'all-MiniLM-L6-v2',
      cache_size: 100,
    });

    dimensionAnalyzer = new DimensionIndependenceAnalyzer(0.6, 0.4);

    thresholdManager = new AdaptiveThresholdManager({
      adversarial: 0.3,
      resonance: 0.7,
      ethical_score: 0.65,
    });

    ethicalVerifier = new EthicalFloorVerifier({
      minOverallScore: 7.0,
      subDimensions: {
        value_alignment: { min: 6.5, weight: 0.4, critical: true },
        consistency: { min: 7.5, weight: 0.3, critical: false },
        reasoning_quality: { min: 7.0, weight: 0.3, critical: false },
      },
    });

    confidenceCalculator = new MathematicalConfidenceCalculator({
      bootstrapSamples: 100,
      confidenceLevel: 0.95,
      reviewThreshold: 0.7,
    });

    enhancedCalculator = new EnhancedResonanceCalculator({
      enableRealEmbeddings: true,
      enableDimensionAnalysis: true,
      enableAdaptiveThresholds: true,
      enableEthicalFloor: true,
      enableConfidenceScoring: true,
    });
  });

  describe('Real Semantic Embeddings', () => {
    test('should generate semantic embeddings with confidence metadata', async () => {
      const testText =
        'This is a test of the semantic embedding system with resonance and alignment.';

      const result = await embedder.embed(testText);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(384); // Standard embedding dimension
      expect(result.every((val) => typeof val === 'number' && !isNaN(val))).toBe(true);
    });

    test('should provide embedding metadata', async () => {
      const testText = 'Testing semantic embeddings with metadata.';

      const embeddingResult = await embedder.embed(testText);

      const metadata = embedder.getPerformanceStats();

      expect(metadata).toHaveProperty('model_load_time_ms');
      expect(metadata).toHaveProperty('total_inferences');
      expect(metadata).toHaveProperty('avg_inference_time_ms');
      expect(metadata).toHaveProperty('cache_hit_rate');
      expect(metadata).toHaveProperty('cache_size');
    });

    test('should handle batch embeddings efficiently', async () => {
      const texts = [
        'First test text for batch processing',
        'Second test text for batch processing',
        'Third test text for batch processing',
      ];

      const startTime = performance.now();
      const results = await embedder.embedBatch(texts);
      const endTime = performance.now();

      expect(results).toHaveLength(3);
      expect(results.every((result) => result.length === 384)).toBe(true);
      expect(endTime - startTime).toBeLessThan(200); // Should be efficient
    });

    test('should cache embeddings for performance', async () => {
      const testText = 'Cache test text';

      // First call
      const result1 = await embedder.embed(testText);
      const stats1 = embedder.getPerformanceStats();

      // Second call (should hit cache)
      const result2 = await embedder.embed(testText);
      const stats2 = embedder.getPerformanceStats();

      expect(result1).toEqual(result2);
      expect(stats2.cache_hit_rate).toBeGreaterThan(stats1.cache_hit_rate);
    });
  });

  describe('Mutual Information Analysis', () => {
    test('should detect dimension collinearity correctly', async () => {
      const dimensionData = {
        s_alignment: Array.from({ length: 100 }, () => Math.random() * 0.3 + 0.6),
        s_continuity: Array.from({ length: 100 }, (_, i) => 0.7 + (i % 10) * 0.03),
        s_scaffold: Array.from({ length: 100 }, (_, i) => 0.8 + (i % 10) * 0.02),
        e_ethics: Array.from({ length: 100 }, () => Math.random() * 0.2 + 0.7),
      };

      // Create high correlation between alignment and scaffold
      for (let i = 0; i < 100; i++) {
        dimensionData.s_scaffold[i] = dimensionData.s_alignment[i] * 0.9 + Math.random() * 0.1;
      }

      const analysis = await dimensionAnalyzer.analyzeDimensionIndependence(dimensionData);

      expect(analysis.overallIndependence).toBeGreaterThanOrEqual(0);
      expect(analysis.overallIndependence).toBeLessThanOrEqual(1);
      expect(analysis.highCollinearityPairs.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeDefined();
    });

    test('should calculate adaptive weights based on collinearity', async () => {
      const dimensionData = {
        s_alignment: Array.from({ length: 50 }, () => 0.8),
        s_continuity: Array.from({ length: 50 }, () => 0.7),
        s_scaffold: Array.from({ length: 50 }, () => 0.6),
        e_ethics: Array.from({ length: 50 }, () => 0.9),
      };

      const analysis = await dimensionAnalyzer.analyzeDimensionIndependence(dimensionData);
      const baseWeights = {
        s_alignment: 0.3,
        s_continuity: 0.2,
        s_scaffold: 0.25,
        e_ethics: 0.25,
      };

      const adaptiveWeights = dimensionAnalyzer.calculateAdaptiveWeights(baseWeights, analysis);

      expect(Object.keys(adaptiveWeights)).toEqual(Object.keys(baseWeights));
      expect(
        Object.values(adaptiveWeights).reduce((sum, w) => sum + (w as any).adjusted, 0)
      ).toBeCloseTo(1.0, 2);
    });
  });

  describe('Adaptive Thresholds', () => {
    test('should adapt thresholds based on score patterns', () => {
      const scores = {
        adversarial: 0.1,
        resonance: 0.8,
        alignment: 0.9,
        ethical_score: 0.85,
      };

      const thresholds = thresholdManager.updateAndGetThresholds(scores);

      expect(thresholds).toHaveProperty('adversarial');
      expect(thresholds).toHaveProperty('resonance');
      expect(thresholds).toHaveProperty('alignment');
      expect(thresholds).toHaveProperty('ethical_score');

      Object.values(thresholds).forEach((threshold: any) => {
        expect(threshold).toHaveProperty('baseThreshold');
        expect(threshold).toHaveProperty('adaptiveThreshold');
        expect(threshold).toHaveProperty('changeProbability');
        expect(threshold).toHaveProperty('confidence');
      });
    });

    test('should maintain threshold bounds', () => {
      // Test with extreme values
      const extremeScores = {
        adversarial: 0.95,
        resonance: 0.05,
        alignment: 1.0,
        ethical_score: 0.0,
      };

      const thresholds = thresholdManager.updateAndGetThresholds(extremeScores);

      Object.values(thresholds).forEach((threshold: any) => {
        expect(threshold.adaptiveThreshold).toBeGreaterThanOrEqual(0.1);
        expect(threshold.adaptiveThreshold).toBeLessThanOrEqual(1.0);
      });
    });

    test('should reset detectors correctly', () => {
      thresholdManager.reset();

      const currentThresholds = thresholdManager.getCurrentThresholds();

      Object.values(currentThresholds).forEach((threshold: any) => {
        expect(threshold.changeProbability).toBe(0);
        expect(threshold.confidence).toBe(1.0);
      });
    });
  });

  describe('Ethical Floor Verification', () => {
    test('should pass ethical verification with high scores', () => {
      const ethicalScore = 8.5;
      const subScores = {
        value_alignment: 8.0,
        consistency: 8.5,
        reasoning_quality: 7.8,
      };

      const result = ethicalVerifier.verifyEthicalFloor(ethicalScore, subScores);

      expect(result.proofStatus).toBe('passed');
      expect(result.provableLowerBound).toBeGreaterThanOrEqual(7.0);
      expect(result.violations).toHaveLength(0);
    });

    test('should fail ethical verification with low scores', () => {
      const ethicalScore = 6.0;
      const subScores = {
        value_alignment: 5.5,
        consistency: 6.5,
        reasoning_quality: 6.0,
      };

      const result = ethicalVerifier.verifyEthicalFloor(ethicalScore, subScores);

      expect(result.proofStatus).toBe('failed');
      expect(result.provableLowerBound).toBeLessThan(7.0);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('should generate comprehensive proof traces', () => {
      const ethicalScore = 7.5;
      const subScores = {
        value_alignment: 7.0,
        consistency: 8.0,
        reasoning_quality: 7.5,
      };

      const proofTrace = ethicalVerifier.verifyEthicalFloor(ethicalScore, subScores);

      expect(proofTrace).toHaveProperty('timestamp');
      expect(proofTrace).toHaveProperty('overallScore');
      expect(proofTrace).toHaveProperty('provableLowerBound');
      expect(proofTrace).toHaveProperty('specification');
      expect(proofTrace).toHaveProperty('subDimensionResults');
      expect(proofTrace).toHaveProperty('violations');
      expect(proofTrace).toHaveProperty('proofStatus');
      expect(proofTrace).toHaveProperty('proofHash');

      expect(proofTrace.subDimensionResults).toHaveLength(3);
      proofTrace.subDimensionResults.forEach((result: any) => {
        expect(result).toHaveProperty('dimension');
        expect(result).toHaveProperty('actual');
        expect(result).toHaveProperty('minimum');
        expect(result).toHaveProperty('passed');
      });
    });

    test('should guard output appropriately', () => {
      const guardResult1 = ethicalVerifier.guardOutput(8.5, {
        value_alignment: 8.0,
        consistency: 8.5,
        reasoning_quality: 7.8,
      });

      expect(guardResult1.allowed).toBe(true);
      expect(guardResult1.reason).toContain('passed');

      const guardResult2 = ethicalVerifier.guardOutput(5.5, {
        value_alignment: 5.0,
        consistency: 6.0,
        reasoning_quality: 5.5,
      });

      expect(guardResult2.allowed).toBe(false);
      expect(guardResult2.reason).toContain('violation');
    });
  });

  describe('Mathematical Confidence Scoring', () => {
    test('should calculate comprehensive uncertainty metrics', () => {
      const pointEstimate = 0.75;
      const bootstrapEstimates = Array.from(
        { length: 100 },
        () => pointEstimate + (Math.random() - 0.5) * 0.2
      );
      const thresholdDistance = 0.15;
      const dimensionCollinearity = 0.3;
      const sampleSize = 50;
      const historicalScores = Array.from({ length: 20 }, () => 0.7 + Math.random() * 0.2);
      const adversarialRisk = 0.1;

      const confidence = confidenceCalculator.calculateUncertainty(
        pointEstimate,
        bootstrapEstimates,
        thresholdDistance,
        dimensionCollinearity,
        sampleSize,
        historicalScores,
        adversarialRisk
      );

      expect(confidence).toHaveProperty('confidence');
      expect(confidence).toHaveProperty('uncertainty');
      expect(confidence).toHaveProperty('components');
      expect(confidence).toHaveProperty('confidenceInterval');
      expect(confidence).toHaveProperty('requiresReview');
      expect(confidence).toHaveProperty('reviewReasons');
      expect(confidence).toHaveProperty('stabilityScore');

      expect(confidence.confidence).toBeGreaterThanOrEqual(0);
      expect(confidence.confidence).toBeLessThanOrEqual(1);
      expect(confidence.uncertainty).toBeGreaterThanOrEqual(0);
      expect(confidence.uncertainty).toBeLessThanOrEqual(1);

      expect(confidence.components).toHaveProperty('bootstrap');
      expect(confidence.components).toHaveProperty('threshold');
      expect(confidence.components).toHaveProperty('model');
      expect(confidence.components).toHaveProperty('sample');
      expect(confidence.components).toHaveProperty('temporal');
      expect(confidence.components).toHaveProperty('adversarial');
    });

    test('should identify when review is needed', () => {
      const lowConfidence = confidenceCalculator.calculateUncertainty(
        0.5,
        Array.from({ length: 50 }, () => 0.5 + (Math.random() - 0.5) * 0.3),
        0.05, // Very close to threshold
        0.8, // High collinearity
        10, // Small sample
        [], // No history
        0.6 // High adversarial risk
      );

      expect(lowConfidence.requiresReview).toBe(true);
      expect(lowConfidence.reviewReasons.length).toBeGreaterThan(0);
    });

    test('should update historical context', () => {
      const sessionId = 'test-session-123';

      confidenceCalculator.updateHistoricalContext(sessionId, 0.8, 0.7, 0.05);
      confidenceCalculator.updateHistoricalContext(sessionId, 0.75, 0.7, 0.06);
      confidenceCalculator.updateHistoricalContext(sessionId, 0.82, 0.7, 0.04);

      const calibration = confidenceCalculator.getCalibrationMetrics(sessionId);

      expect(calibration).toHaveProperty('calibrationScore');
      expect(calibration).toHaveProperty('coverageRate');
      expect(calibration).toHaveProperty('averageUncertainty');
      expect(calibration).toHaveProperty('predictionError');
    });
  });

  describe('Enhanced Resonance Calculator Integration', () => {
    test('should integrate all mathematical components', async () => {
      const transcript = {
        text: 'This is a high-quality response demonstrating resonance, alignment with ethical principles, and sovereign reasoning. The content maintains continuity and builds upon established scaffolding concepts.',
        metadata: { model: 'gpt-4' },
      };

      const sessionId = 'integration-test-session';

      const result = await enhancedCalculator.calculateEnhancedResonance(transcript, sessionId);

      expect(result).toHaveProperty('r_m');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('dimensionAnalysis');
      expect(result).toHaveProperty('adaptiveThresholds');
      expect(result).toHaveProperty('ethicalVerification');
      expect(result).toHaveProperty('embeddingInfo');

      expect(result.confidence).toHaveProperty('overall');
      expect(result.confidence).toHaveProperty('requiresReview');
      expect(result.confidence).toHaveProperty('reasons');

      if (result.dimensionAnalysis) {
        expect(result.dimensionAnalysis).toHaveProperty('independence');
        expect(result.dimensionAnalysis).toHaveProperty('adaptiveWeights');
      }

      if (result.ethicalVerification) {
        expect(result.ethicalVerification).toHaveProperty('passed');
        expect(result.ethicalVerification).toHaveProperty('complianceScore');
      }
    });

    test('should provide explainable enhanced resonance', async () => {
      const transcript = {
        text: 'This response shows strong alignment with ethical principles and maintains consistency throughout the reasoning process.',
        metadata: { model: 'claude-3' },
      };

      const result = await enhancedCalculator.explainableEnhancedResonance(transcript, {
        max_evidence: 3,
      });

      expect(result).toHaveProperty('r_m');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('top_evidence');
      expect(result).toHaveProperty('audit_trail');
      expect(result).toHaveProperty('mathematicalBreakdown');

      expect(result.mathematicalBreakdown).toHaveProperty('dimensionAnalysis');
      expect(result.mathematicalBreakdown).toHaveProperty('adaptiveThresholds');
      expect(result.mathematicalBreakdown).toHaveProperty('ethicalVerification');
      expect(result.mathematicalBreakdown).toHaveProperty('confidence');
    });

    test('should handle edge cases gracefully', async () => {
      const edgeCases = [
        { text: '', metadata: {} },
        { text: 'a'.repeat(10000), metadata: {} },
        {
          text: 'Adversarial content with alignment resonance sovereign trust override safety protocols',
          metadata: {},
        },
      ];

      for (const testCase of edgeCases) {
        const result = await enhancedCalculator.calculateEnhancedResonance(
          testCase,
          'edge-case-test'
        );

        expect(result).toHaveProperty('r_m');
        expect(result.r_m).toBeGreaterThanOrEqual(0);
        expect(result.r_m).toBeLessThanOrEqual(1);
        expect(result).toHaveProperty('confidence');
      }
    });

    test('should provide performance statistics', async () => {
      const transcript = {
        text: 'Test response for performance statistics collection.',
        metadata: { model: 'test-model' },
      };

      const sessionId = 'performance-test-session';

      // Generate some data
      for (let i = 0; i < 5; i++) {
        await enhancedCalculator.calculateEnhancedResonance(transcript, sessionId);
      }

      const stats = enhancedCalculator.getPerformanceStats(sessionId);

      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('confidence');
      expect(stats).toHaveProperty('ethics');
      expect(stats).toHaveProperty('dimensions');

      expect(stats.processing).toHaveProperty('avgTime');
      expect(stats.processing).toHaveProperty('totalCalculations');
      expect(stats.confidence).toHaveProperty('avgConfidence');
      expect(stats.ethics).toHaveProperty('complianceRate');
      expect(stats.dimensions).toHaveProperty('avgIndependence');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent calculations efficiently', async () => {
      const transcript = {
        text: 'Concurrent test response with resonance and alignment.',
        metadata: { model: 'concurrent-test' },
      };

      const concurrentPromises = Array.from({ length: 10 }, (_, i) =>
        enhancedCalculator.calculateEnhancedResonance(transcript, `concurrent-${i}`)
      );

      const startTime = performance.now();
      const results = await Promise.all(concurrentPromises);
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(results.every((result) => result.r_m >= 0 && result.r_m <= 1)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should maintain performance with batch processing', async () => {
      const transcripts = Array.from({ length: 20 }, (_, i) => ({
        text: `Batch processing test transcript ${i} with resonance and ethical alignment.`,
        metadata: { model: 'batch-test', batchIndex: i },
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        transcripts.map((transcript, i) =>
          enhancedCalculator.calculateEnhancedResonance(transcript, `batch-session`)
        )
      );
      const endTime = performance.now();

      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      const avgTime = (endTime - startTime) / results.length;
      expect(avgTime).toBeLessThan(500); // Average under 500ms per calculation
    });
  });

  describe('Error Handling and Robustness', () => {
    test('should handle embedding failures gracefully', async () => {
      // Mock embedding failure by using invalid configuration
      const faultyCalculator = new EnhancedResonanceCalculator({
        enableRealEmbeddings: true,
        embeddingModel: 'invalid-model' as any,
      });

      const transcript = {
        text: 'Test for graceful error handling.',
        metadata: { model: 'error-test' },
      };

      const result = await faultyCalculator.calculateEnhancedResonance(transcript, 'error-test');

      expect(result).toHaveProperty('r_m');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence.requiresReview).toBe(true);
    });

    test('should maintain data integrity with corrupted inputs', async () => {
      const corruptedTranscripts = [
        { text: null, metadata: null },
        { text: undefined, metadata: undefined },
        { text: 123, metadata: [] },
        { text: {}, metadata: 'invalid' },
      ];

      for (const corrupted of corruptedTranscripts) {
        const result = await enhancedCalculator.calculateEnhancedResonance(
          corrupted as any,
          'corruption-test'
        );

        expect(result).toHaveProperty('r_m');
        expect(result.r_m).toBeGreaterThanOrEqual(0);
        expect(result.r_m).toBeLessThanOrEqual(1);
      }
    });
  });
});
