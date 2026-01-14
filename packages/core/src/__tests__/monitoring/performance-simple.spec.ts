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

    it('should handle labels in metric recording', () => {
      const labels = { workflow_id: 'test-123', step: 'validation' };
      const timer = new PerformanceTimer('test-operation', labels);
      const mockHistogram = {
        observe: jest.fn()
      };
      
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
      expect(typeof benchmark.measure).toBe('function');
      expect(typeof benchmark.getStats).toBe('function');
      expect(typeof benchmark.reset).toBe('function');
    });

    it('should measure operations', () => {
      const benchmark = new PerformanceBenchmark();
      
      // Measure some operations
      benchmark.measure('operation-1', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      
      benchmark.measure('operation-2', () => {
        let product = 1;
        for (let i = 1; i <= 10; i++) {
          product *= i;
        }
        return product;
      });
      
      const stats = benchmark.getStats();
      
      expect(stats).toBeDefined();
      expect(stats['operation-1']).toBeDefined();
      expect(stats['operation-2']).toBeDefined();
      expect(stats['operation-1'].count).toBe(1);
      expect(stats['operation-2'].count).toBe(1);
      expect(stats['operation-1'].mean).toBeGreaterThan(0);
      expect(stats['operation-2'].mean).toBeGreaterThan(0);
    });

    it('should handle multiple measurements', () => {
      const benchmark = new PerformanceBenchmark();
      
      // Measure same operation multiple times
      for (let i = 0; i < 5; i++) {
        benchmark.measure('repeated-operation', () => {
          return Math.random() * 100;
        });
      }
      
      const stats = benchmark.getStats();
      const operationStats = stats['repeated-operation'];
      
      expect(operationStats.count).toBe(5);
      expect(operationStats.mean).toBeGreaterThan(0);
      expect(operationStats.min).toBeGreaterThanOrEqual(0);
      expect(operationStats.max).toBeGreaterThanOrEqual(0);
      expect(operationStats.min).toBeLessThanOrEqual(operationStats.max);
    });

    it('should reset benchmark measurements', () => {
      const benchmark = new PerformanceBenchmark();
      
      benchmark.measure('test-operation', () => 42);
      
      let stats = benchmark.getStats();
      expect(stats['test-operation']).toBeDefined();
      
      benchmark.reset();
      
      stats = benchmark.getStats();
      expect(stats['test-operation']).toBeUndefined();
    });

    it('should calculate percentiles correctly', () => {
      const benchmark = new PerformanceBenchmark();
      
      // Add measurements with known values
      const values = [10, 20, 30, 40, 50];
      values.forEach(value => {
        benchmark.measure('percentile-test', () => value);
      });
      
      const stats = benchmark.getStats();
      const operationStats = stats['percentile-test'];
      
      expect(operationStats.p50).toBe(30);
      expect(operationStats.p95).toBe(50);
      expect(operationStats.p99).toBe(50);
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

    it('should measure nested operations correctly', () => {
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
      
      // Multiple end calls should not crash
      const duration1 = timer.end();
      const duration2 = timer.end();
      
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBe(0); // Second call should return 0
    });

    it('should handle metric recording errors', () => {
      const timer = new PerformanceTimer('test-operation');
      const mockHistogram = {
        observe: jest.fn().mockImplementation(() => {
          throw new Error('Metric recording failed');
        })
      };
      
      expect(() => {
        timer.endWithMetric(mockHistogram);
      }).not.toThrow();
    });

    it('should handle invalid metric histograms', () => {
      const timer = new PerformanceTimer('test-operation');
      
      expect(() => {
        timer.endWithMetric(null as any);
      }).not.toThrow();
      
      expect(() => {
        timer.endWithMetric(undefined as any);
      }).not.toThrow();
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
      benchmark.measure('database-operation', async () => {
        return await timeDbQuery('find', 'users', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return [{ id: 1, name: 'Test' }];
        });
      });
      
      benchmark.measure('api-operation', async () => {
        return await timeExternalApi('openai', '/chat', async () => {
          await new Promise(resolve => setTimeout(resolve, 8));
          return { response: 'Hello!' };
        });
      });
      
      benchmark.measure('computation', () => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += Math.sqrt(i);
        }
        return sum;
      });
      
      const stats = benchmark.getStats();
      
      expect(stats['database-operation']).toBeDefined();
      expect(stats['api-operation']).toBeDefined();
      expect(stats['computation']).toBeDefined();
      
      // All operations should have been measured
      Object.values(stats).forEach(stat => {
        expect(stat.count).toBe(1);
        expect(stat.mean).toBeGreaterThan(0);
      });
    });
  });
});
