/**
 * Performance Benchmark Tests
 *
 * Validates sub-50ms performance requirements for detection pipeline
 */

import { SonateFrameworkDetector } from '../framework-detector';
import { OptimizedFrameworkDetector } from '../optimized-framework-detector';
import { AIInteraction } from '../index';

describe('Performance Benchmarks', () => {
  let originalDetector: SonateFrameworkDetector;
  let optimizedDetector: OptimizedFrameworkDetector;
  let testInteractions: AIInteraction[];

  beforeEach(() => {
    originalDetector = new SonateFrameworkDetector();
    optimizedDetector = new OptimizedFrameworkDetector();

    // Generate test interactions of varying complexity
    testInteractions = [
      {
        content: 'Hello',
        context: 'Greeting',
        metadata: { session_id: 'test-1' },
      },
      {
        content:
          'I understand your question about machine learning. Let me provide a comprehensive explanation that covers the key concepts including supervised learning, unsupervised learning, and reinforcement learning paradigms.',
        context: 'User asking about ML fundamentals',
        metadata: { session_id: 'test-2', purpose: 'education' },
      },
      {
        content:
          'This is a very long response that contains multiple paragraphs and detailed explanations about complex topics. It includes various technical terms, examples, and comprehensive analysis to demonstrate how the system handles substantial content while maintaining accuracy and coherence throughout the extended explanation.',
        context: 'Complex technical discussion',
        metadata: { session_id: 'test-3', complexity: 'high' },
      },
    ];
  });

  describe('Sub-50ms Performance Target', () => {
    it('should achieve sub-50ms performance with optimized detector', async () => {
      const results: number[] = [];

      for (const interaction of testInteractions) {
        const startTime = performance.now();
        await optimizedDetector.detect(interaction);
        const endTime = performance.now();

        const duration = endTime - startTime;
        results.push(duration);

        // Each detection should be under 50ms
        expect(duration).toBeLessThan(50);
      }

      // Average should be well under 50ms
      const averageDuration = results.reduce((sum, time) => sum + time, 0) / results.length;
      expect(averageDuration).toBeLessThan(30); // Target average < 30ms

      console.log(
        `Optimized detector performance: ${results.map((t) => t.toFixed(2)).join('ms, ')}ms`
      );
      console.log(`Average: ${averageDuration.toFixed(2)}ms`);
    });

    it('should handle concurrent detections efficiently', async () => {
      const concurrentCount = 20;
      const interactions = Array.from({ length: concurrentCount }, (_, i) => ({
        content: `Concurrent test interaction ${i}`,
        context: `Context ${i}`,
        metadata: { session_id: `concurrent-${i}` },
      }));

      const startTime = performance.now();

      const results = await Promise.all(
        interactions.map((interaction) => optimizedDetector.detect(interaction))
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / concurrentCount;

      expect(results).toHaveLength(concurrentCount);
      expect(averageDuration).toBeLessThan(25); // Should handle concurrency efficiently
      expect(totalDuration).toBeLessThan(200); // Total time should be reasonable

      console.log(
        `Concurrent detection: ${concurrentCount} interactions in ${totalDuration.toFixed(2)}ms`
      );
      console.log(`Average per interaction: ${averageDuration.toFixed(2)}ms`);
    });

    it('should maintain performance under load', async () => {
      const batchSize = 50;
      const results: number[] = [];

      // Process multiple batches
      for (let batch = 0; batch < 5; batch++) {
        const batchInteractions = Array.from({ length: batchSize }, (_, i) => ({
          content: `Load test interaction ${batch}-${i}`,
          context: `Load test context ${batch}`,
          metadata: { session_id: `load-${batch}-${i}` },
        }));

        const startTime = performance.now();

        await Promise.all(
          batchInteractions.map((interaction) => optimizedDetector.detect(interaction))
        );

        const endTime = performance.now();
        const batchDuration = endTime - startTime;
        const avgPerInteraction = batchDuration / batchSize;

        results.push(avgPerInteraction);

        // Performance should not degrade significantly
        expect(avgPerInteraction).toBeLessThan(35);
      }

      // Check for performance degradation
      const firstBatch = results[0];
      const lastBatch = results[results.length - 1];
      const degradation = (lastBatch - firstBatch) / firstBatch;

      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation

      console.log(
        `Load test performance per batch: ${results.map((t) => t.toFixed(2)).join('ms, ')}ms`
      );
      console.log(`Performance degradation: ${(degradation * 100).toFixed(1)}%`);
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance with caching', async () => {
      const interaction = testInteractions[1]; // Use medium complexity interaction

      // First run (cache miss)
      const startTime1 = performance.now();
      await optimizedDetector.detect(interaction);
      const endTime1 = performance.now();
      const firstRun = endTime1 - startTime1;

      // Second run (cache hit)
      const startTime2 = performance.now();
      await optimizedDetector.detect(interaction);
      const endTime2 = performance.now();
      const secondRun = endTime2 - startTime2;

      // Cache hit should be significantly faster
      expect(secondRun).toBeLessThan(firstRun * 0.5); // At least 50% faster

      console.log(`Cache miss: ${firstRun.toFixed(2)}ms, Cache hit: ${secondRun.toFixed(2)}ms`);
      console.log(`Cache speedup: ${(firstRun / secondRun).toFixed(1)}x`);
    });

    it('should handle cache size limits', async () => {
      const cacheSize = 1000; // From detector implementation
      const interactions = Array.from({ length: cacheSize + 100 }, (_, i) => ({
        content: `Cache test interaction ${i}`,
        context: `Cache test context ${i}`,
        metadata: { session_id: `cache-${i}` },
      }));

      // Fill cache beyond limit
      for (const interaction of interactions) {
        await optimizedDetector.detect(interaction);
      }

      const cacheStats = optimizedDetector.getCacheStats();

      // Cache should not exceed size limit
      expect(cacheStats.size).toBeLessThanOrEqual(cacheSize);

      console.log(`Cache size after overflow test: ${cacheStats.size}`);
    });
  });

  describe('Comparison with Original Implementation', () => {
    it('should outperform original detector', async () => {
      const interaction = testInteractions[1]; // Medium complexity

      // Test original detector
      const startTime1 = performance.now();
      const originalResult = await originalDetector.detect(interaction);
      const endTime1 = performance.now();
      const originalTime = endTime1 - startTime1;

      // Test optimized detector
      const startTime2 = performance.now();
      const optimizedResult = await optimizedDetector.detect(interaction);
      const endTime2 = performance.now();
      const optimizedTime = endTime2 - startTime2;

      // Optimized should be faster
      expect(optimizedTime).toBeLessThan(originalTime);

      // Results should be reasonably similar (within acceptable range)
      expect(Math.abs(originalResult.reality_index - optimizedResult.reality_index)).toBeLessThan(
        2.0
      );
      expect(originalResult.trust_protocol).toBe(optimizedResult.trust_protocol);

      const speedup = originalTime / optimizedTime;
      console.log(
        `Original: ${originalTime.toFixed(2)}ms, Optimized: ${optimizedTime.toFixed(2)}ms`
      );
      console.log(`Speedup: ${speedup.toFixed(1)}x`);

      // Should achieve meaningful speedup
      expect(speedup).toBeGreaterThan(1.2); // At least 20% faster
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory during extended operation', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Run many detections
      for (let i = 0; i < 1000; i++) {
        const interaction = {
          content: `Memory test interaction ${i}`,
          context: `Memory test context ${i}`,
          metadata: { session_id: `memory-${i}` },
        };

        await optimizedDetector.detect(interaction);

        // Clean cache periodically
        if (i % 100 === 0) {
          optimizedDetector.cleanCache();
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncreaseMB).toBeLessThan(10);

      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty content efficiently', async () => {
      const interaction = {
        content: '',
        context: 'Empty content test',
        metadata: { session_id: 'empty-test' },
      };

      const startTime = performance.now();
      await optimizedDetector.detect(interaction);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(20); // Should be very fast for empty content

      console.log(`Empty content detection: ${duration.toFixed(2)}ms`);
    });

    it('should handle very long content efficiently', async () => {
      const longContent = 'This is a test. '.repeat(1000);
      const interaction = {
        content: longContent,
        context: 'Long content test',
        metadata: { session_id: 'long-test' },
      };

      const startTime = performance.now();
      await optimizedDetector.detect(interaction);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // Should still meet target

      console.log(`Long content detection (${longContent.length} chars): ${duration.toFixed(2)}ms`);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance over time', async () => {
      const durations: number[] = [];
      const interaction = testInteractions[1];

      // Run multiple times to check consistency
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        await optimizedDetector.detect(interaction);
        const endTime = performance.now();

        durations.push(endTime - startTime);
      }

      // Calculate statistics
      const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Performance should be consistent (CV < 0.3)
      expect(coefficientOfVariation).toBeLessThan(0.3);
      expect(mean).toBeLessThan(30); // Mean should be under 30ms

      console.log(
        `Performance consistency - Mean: ${mean.toFixed(2)}ms, SD: ${stdDev.toFixed(2)}ms, CV: ${(
          coefficientOfVariation * 100
        ).toFixed(1)}%`
      );
    });
  });
});
