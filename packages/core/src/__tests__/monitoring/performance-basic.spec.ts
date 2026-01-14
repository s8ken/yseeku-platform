/**
 * Performance Monitoring Utilities Tests
 * 
 * Tests the performance tracking and timing infrastructure
 */

import { 
  PerformanceTimer,
  timeworkflow,
  timeAgentOperation,
  timeAsync,
  timeDbQuery,
  timeExternalApi,
  getMemoryUsage,
  logMemoryUsage,
  getCPUUsage,
  PerformanceBenchmark
} from '../../monitoring/performance';

describe('Performance Monitoring', () => {
  describe('PerformanceTimer', () => {
    it('should create a timer with operation name', () => {
      const timer = new PerformanceTimer('test-operation');
      
      expect(timer).toBeInstanceOf(PerformanceTimer);
      expect(typeof timer.end).toBe('function');
      expect(typeof timer.endWithMetric).toBe('function');
    });

    it('should create a timer with labels', () => {
      const labels = { workflow_id: 'test-123', step: 'validation' };
      const timer = new PerformanceTimer('test-operation', labels);
      
      expect(timer).toBeInstanceOf(PerformanceTimer);
    });

    it('should measure duration correctly', () => {
      const timer = new PerformanceTimer('test-operation');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait for at least 10ms
      }
      
      const duration = timer.end();
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1); // Should be less than 1 second
    });

    it('should record duration with metric histogram', () => {
      const timer = new PerformanceTimer('test-operation');
      const mockHistogram = {
        observe: jest.fn()
      };
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 5) {
        // Wait for at least 5ms
      }
      
      const duration = timer.endWithMetric(mockHistogram);
      
      expect(duration).toBeGreaterThan(0);
      expect(mockHistogram.observe).toHaveBeenCalled();
    });
  });

  describe('Performance Measurement Functions', () => {
    it('should measure asynchronous function performance', async () => {
      const result = await timeAsync('test-operation', async () => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });
      
      expect(result).toBe('async-result');
    });

    it('should measure async function with labels', async () => {
      const labels = { workflow_id: 'test-123', step: 'validation' };
      const result = await timeAsync('test-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'labeled-result';
      }, labels);
      
      expect(result).toBe('labeled-result');
    });

    it('should handle errors in async measurement', async () => {
      await expect(
        timeAsync('test-operation', async () => {
          throw new Error('Async test error');
        })
      ).rejects.toThrow('Async test error');
    });

    it('should measure database query performance', async () => {
      const result = await timeDbQuery('find', 'users', async () => {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 5));
        return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, name: 'John' });
    });

    it('should measure external API call performance', async () => {
      const result = await timeExternalApi('openai', '/chat/completions', async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: 'chat-123', choices: [{ message: { content: 'Hello!' } }] };
      });
      
      expect(result.id).toBe('chat-123');
      expect(result.choices).toHaveLength(1);
    });
  });

  describe('Decorators', () => {
    it('should create workflow timing decorator', () => {
      const decorator = timeworkflow('test-workflow');
      expect(typeof decorator).toBe('function');
    });

    it('should create agent operation timing decorator', () => {
      const decorator = timeAgentOperation('agent-123', 'process');
      expect(typeof decorator).toBe('function');
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should get current memory usage', () => {
      const memoryUsage = getMemoryUsage();
      
      expect(memoryUsage).toBeDefined();
      expect(memoryUsage.rss).toBeGreaterThan(0);
      expect(memoryUsage.heapTotal).toBeGreaterThan(0);
      expect(memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(memoryUsage.heapUsed).toBeLessThanOrEqual(memoryUsage.heapTotal);
      expect(memoryUsage.external).toBeGreaterThanOrEqual(0);
    });

    it('should log memory usage', () => {
      expect(() => {
        logMemoryUsage('test-context');
      }).not.toThrow();
    });

    it('should log memory usage with default context', () => {
      expect(() => {
        logMemoryUsage();
      }).not.toThrow();
    });
  });

  describe('CPU Usage Tracking', () => {
    it('should get CPU usage', () => {
      const cpuUsage = getCPUUsage();
      
      expect(cpuUsage).toBeDefined();
      expect(cpuUsage.user).toBeGreaterThanOrEqual(0);
      expect(cpuUsage.system).toBeGreaterThanOrEqual(0);
    });

    it('should track CPU usage over time', () => {
      const cpuUsage1 = getCPUUsage();
      
      // Simulate some CPU work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Some computation
        Math.random() * Math.random();
      }
      
      const cpuUsage2 = getCPUUsage();
      
      expect(cpuUsage1.user).toBeGreaterThanOrEqual(0);
      expect(cpuUsage2.user).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Benchmark', () => {
    it('should create performance benchmark', () => {
      const benchmark = new PerformanceBenchmark();
      
      expect(benchmark).toBeInstanceOf(PerformanceBenchmark);
      expect(typeof benchmark.record).toBe('function');
      expect(typeof benchmark.getStats).toBe('function');
      expect(typeof benchmark.getAllStats).toBe('function');
      expect(typeof benchmark.reset).toBe('function');
      expect(typeof benchmark.logStats).toBe('function');
    });

    it('should record and retrieve measurements', () => {
      const benchmark = new PerformanceBenchmark();
      
      // Record some measurements
      benchmark.record('operation-1', 100);
      benchmark.record('operation-1', 150);
      benchmark.record('operation-2', 200);
      
      // Get stats for specific operation
      const stats1 = benchmark.getStats('operation-1');
      const stats2 = benchmark.getStats('operation-2');
      
      expect(stats1).not.toBeNull();
      expect(stats2).not.toBeNull();
      
      if (stats1) {
        expect(stats1.count).toBe(2);
        expect(stats1.min).toBe(100);
        expect(stats1.max).toBe(150);
        expect(stats1.avg).toBe(125);
      }
      
      if (stats2) {
        expect(stats2.count).toBe(1);
        expect(stats2.min).toBe(200);
        expect(stats2.max).toBe(200);
        expect(stats2.avg).toBe(200);
      }
    });

    it('should handle non-existent measurements', () => {
      const benchmark = new PerformanceBenchmark();
      
      const stats = benchmark.getStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should get all statistics', () => {
      const benchmark = new PerformanceBenchmark();
      
      benchmark.record('test-1', 50);
      benchmark.record('test-2', 75);
      
      const allStats = benchmark.getAllStats();
      
      expect(allStats).toBeDefined();
      expect(typeof allStats).toBe('object');
      expect(allStats['test-1']).toBeDefined();
      expect(allStats['test-2']).toBeDefined();
    });

    it('should reset measurements', () => {
      const benchmark = new PerformanceBenchmark();
      
      benchmark.record('test-operation', 100);
      
      let stats = benchmark.getStats('test-operation');
      expect(stats).not.toBeNull();
      
      benchmark.reset();
      
      stats = benchmark.getStats('test-operation');
      expect(stats).toBeNull();
    });

    it('should log statistics', () => {
      const benchmark = new PerformanceBenchmark();
      
      benchmark.record('log-test', 42);
      
      expect(() => {
        benchmark.logStats();
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle high-frequency operations efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const timer = new PerformanceTimer(`operation-${i}`);
        timer.end();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should measure nested operations correctly', async () => {
      const outerTimer = new PerformanceTimer('outer-operation');
      
      const result = await timeAsync('inner-operation', async () => {
        const innerTimer = new PerformanceTimer('nested-operation');
        // Simulate nested work
        await new Promise(resolve => setTimeout(resolve, 5));
        innerTimer.end();
        return 'nested-result';
      });
      
      const outerDuration = outerTimer.end();
      
      expect(result).toBe('nested-result');
      expect(outerDuration).toBeGreaterThan(0);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          timeAsync(`concurrent-${i}`, async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
            return `result-${i}`;
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(`result-${index}`);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle timer operations gracefully', () => {
      const timer = new PerformanceTimer('test-operation');
      
      // Simulate some work to ensure first duration > 0
      const start = Date.now();
      while (Date.now() - start < 5) {
        // Wait for at least 5ms
      }
      
      // Multiple end calls should not crash
      const duration1 = timer.end();
      const duration2 = timer.end();
      
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBeGreaterThan(0); // Both calls calculate duration from start time
    });

    it('should handle metric recording errors', () => {
      const timer = new PerformanceTimer('test-operation');
      const mockHistogram = {
        observe: jest.fn().mockImplementation(() => {
          throw new Error('Metric recording failed');
        })
      };
      
      // The error should be thrown, not caught
      expect(() => {
        timer.endWithMetric(mockHistogram);
      }).toThrow('Metric recording failed');
    });

    it('should handle invalid metric histograms', () => {
      const timer = new PerformanceTimer('test-operation');
      
      // Should throw TypeError for null histogram
      expect(() => {
        timer.endWithMetric(null as any);
      }).toThrow(TypeError);
      
      // Should throw TypeError for undefined histogram
      expect(() => {
        timer.endWithMetric(undefined as any);
      }).toThrow(TypeError);
    });
  });

  describe('Integration Tests', () => {
    it('should work with complete performance monitoring scenario', async () => {
      // Track memory usage
      const initialMemory = getMemoryUsage();
      
      // Track CPU usage
      const initialCPU = getCPUUsage();
      
      // Use performance timer
      const timer = new PerformanceTimer('integration-test');
      
      // Measure async operation
      const result = await timeAsync('database-query', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { data: 'test-data', timestamp: Date.now() };
      });
      
      // Measure external API call
      const apiResult = await timeExternalApi('test-service', '/api/test', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return { status: 'success', response: 'API response' };
      });
      
      // End timer
      const duration = timer.end();
      
      // Get final memory and CPU
      const finalMemory = getMemoryUsage();
      const finalCPU = getCPUUsage();
      
      // Verify results
      expect(result.data).toBe('test-data');
      expect(apiResult.status).toBe('success');
      expect(duration).toBeGreaterThan(0.015); // At least 15ms total
      expect(initialMemory.heapUsed).toBeGreaterThan(0);
      expect(finalMemory.heapUsed).toBeGreaterThan(0);
      expect(initialCPU.user).toBeGreaterThanOrEqual(0);
      expect(finalCPU.user).toBeGreaterThanOrEqual(0);
    });

    it('should work with performance benchmark integration', async () => {
      const benchmark = new PerformanceBenchmark();
      
      // Benchmark different operations
      const dbResult = await timeDbQuery('find', 'users', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return [{ id: 1, name: 'Test' }];
      });
      
      const apiResult = await timeExternalApi('openai', '/chat', async () => {
        await new Promise(resolve => setTimeout(resolve, 8));
        return { response: 'Hello!' };
      });
      
      // Record timing data
      benchmark.record('database-operation', 50);
      benchmark.record('api-operation', 80);
      benchmark.record('computation', 25);
      
      const stats = benchmark.getAllStats();
      
      expect(stats['database-operation']).toBeDefined();
      expect(stats['api-operation']).toBeDefined();
      expect(stats['computation']).toBeDefined();
      
      expect(dbResult).toHaveLength(1);
      expect(apiResult.response).toBe('Hello!');
    });
  });
});
