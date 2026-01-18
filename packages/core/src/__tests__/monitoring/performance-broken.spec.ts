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
  PerformanceBenchmark,
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
        observe: jest.fn(),
      };

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 5) {
        // Wait for at least 5ms
      }

      const duration = timer.endWithMetric(mockHistogram);

      expect(duration).toBeGreaterThan(0);
      expect(mockHistogram.observe).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test-operation',
        }),
        duration
      );
    });

    it('should handle labels in metric recording', () => {
      const labels = { workflow_id: 'test-123', step: 'validation' };
      const timer = new PerformanceTimer('test-operation', labels);
      const mockHistogram = {
        observe: jest.fn(),
      };

      const duration = timer.endWithMetric(mockHistogram);

      expect(mockHistogram.observe).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test-operation',
          workflow_id: 'test-123',
          step: 'validation',
        }),
        duration
      );
    });
  });

  describe('Performance Measurement Functions', () => {
    it('should measure synchronous function performance', () => {
      const result = measureSync('test-operation', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result.value).toBe(499500); // Sum of 0 to 999
      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should measure asynchronous function performance', async () => {
      const result = await measureAsync('test-operation', async () => {
        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'async-result';
      });

      expect(result.value).toBe('async-result');
      expect(result.duration).toBeGreaterThan(0.01); // At least 10ms
      expect(typeof result.duration).toBe('number');
    });

    it('should handle errors in synchronous measurement', () => {
      expect(() => {
        measureSync('test-operation', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });

    it('should handle errors in asynchronous measurement', async () => {
      await expect(
        measureAsync('test-operation', async () => {
          throw new Error('Async test error');
        })
      ).rejects.toThrow('Async test error');
    });

    it('should create performance timer with factory function', () => {
      const timer = createPerformanceTimer('factory-test', { type: 'test' });

      expect(timer).toBeInstanceOf(PerformanceTimer);

      const duration = timer.end();
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Workflow Performance Tracking', () => {
    it('should track workflow performance', () => {
      const result = trackWorkflowPerformance('test-workflow', () => {
        // Simulate workflow work
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result.value).toBe(4950); // Sum of 0 to 99
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track workflow performance with steps', () => {
      const result = trackWorkflowPerformance('test-workflow', { step: 'validation' }, () => {
        // Simulate validation work
        return 'validated';
      });

      expect(result.value).toBe('validated');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track async workflow performance', async () => {
      const result = await trackWorkflowPerformance('async-workflow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return 'workflow-complete';
      });

      expect(result.value).toBe('workflow-complete');
      expect(result.duration).toBeGreaterThan(0.005);
    });
  });

  describe('Agent Performance Tracking', () => {
    it('should track agent performance', () => {
      const result = trackAgentPerformance('agent-123', 'process', () => {
        // Simulate agent processing
        return 'processed-data';
      });

      expect(result.value).toBe('processed-data');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track agent performance with additional labels', () => {
      const result = trackAgentPerformance(
        'agent-123',
        'analyze',
        {
          task_type: 'sentiment',
          complexity: 'medium',
        },
        () => {
          return { sentiment: 'positive', confidence: 0.85 };
        }
      );

      expect(result.value).toEqual({ sentiment: 'positive', confidence: 0.85 });
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track async agent performance', async () => {
      const result = await trackAgentPerformance('agent-456', 'respond', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { response: 'Hello!', tokens: 2 };
      });

      expect(result.value).toEqual({ response: 'Hello!', tokens: 2 });
      expect(result.duration).toBeGreaterThan(0.01);
    });
  });

  describe('Database Performance Tracking', () => {
    it('should track database query performance', () => {
      const result = trackDatabasePerformance('find', 'users', () => {
        // Simulate database query
        return [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ];
      });

      expect(result.value).toHaveLength(2);
      expect(result.value[0]).toEqual({ id: 1, name: 'John' });
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track database operation with parameters', () => {
      const result = trackDatabasePerformance(
        'aggregate',
        'orders',
        {
          pipeline: 'monthly-sales',
          collection_size: 10000,
        },
        () => {
          return { total: 50000, average: 125.5 };
        }
      );

      expect(result.value).toEqual({ total: 50000, average: 125.5 });
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track async database operation', async () => {
      const result = await trackDatabasePerformance('insert', 'logs', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { insertedId: 'log-123', acknowledged: true };
      });

      expect(result.value).toEqual({ insertedId: 'log-123', acknowledged: true });
      expect(result.duration).toBeGreaterThan(0.005);
    });
  });

  describe('External API Performance Tracking', () => {
    it('should track external API call performance', () => {
      const result = trackExternalApiPerformance('openai', '/chat/completions', () => {
        // Simulate API call
        return { id: 'chat-123', choices: [{ message: { content: 'Hello!' } }] };
      });

      expect(result.value.id).toBe('chat-123');
      expect(result.value.choices).toHaveLength(1);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track API call with additional context', () => {
      const result = trackExternalApiPerformance(
        'stripe',
        '/charges',
        {
          method: 'POST',
          status_code: '200',
          request_size: '1024',
        },
        () => {
          return { id: 'ch_123', amount: 2000, currency: 'usd' };
        }
      );

      expect(result.value.amount).toBe(2000);
      expect(result.value.currency).toBe('usd');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should track async external API call', async () => {
      const result = await trackExternalApiPerformance('github', '/user/repos', async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        return [
          { name: 'repo1', stars: 100 },
          { name: 'repo2', stars: 50 },
        ];
      });

      expect(result.value).toHaveLength(2);
      expect(result.value[0].stars).toBe(100);
      expect(result.duration).toBeGreaterThan(0.015);
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

      const result = measureSync('inner-operation', () => {
        const innerTimer = new PerformanceTimer('nested-operation');
        // Simulate nested work
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        innerTimer.end();
        return sum;
      });

      const outerDuration = outerTimer.end();

      expect(result.value).toBe(4950);
      expect(result.duration).toBeGreaterThan(0);
      expect(outerDuration).toBeGreaterThan(result.duration);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          measureAsync(`concurrent-${i}`, async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `result-${i}`;
          })
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.value).toBe(`result-${index}`);
        expect(result.duration).toBeGreaterThan(0.005);
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
        }),
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
    it('should work with complete workflow scenario', async () => {
      // Track overall workflow
      const workflowResult = await trackWorkflowPerformance('complete-workflow', async () => {
        // Track database operation
        const dbResult = await trackDatabasePerformance('find', 'users', async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return [{ id: 1, name: 'Test User' }];
        });

        // Track agent processing
        const agentResult = await trackAgentPerformance('agent-1', 'process', async () => {
          await new Promise((resolve) => setTimeout(resolve, 3));
          return { processed: true, confidence: 0.95 };
        });

        // Track external API call
        const apiResult = await trackExternalApiPerformance('openai', '/chat', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { response: 'API response successful' };
        });

        return {
          users: dbResult.value,
          processing: agentResult.value,
          api: apiResult.value,
          timings: {
            db: dbResult.duration,
            agent: agentResult.duration,
            api: apiResult.duration,
          },
        };
      });

      expect(workflowResult.value.users).toHaveLength(1);
      expect(workflowResult.value.processing.processed).toBe(true);
      expect(workflowResult.value.api.response).toBe('API response successful');
      expect(workflowResult.duration).toBeGreaterThan(0.018); // Sum of all delays
      expect(workflowResult.value.timings.db).toBeGreaterThan(0.005);
      expect(workflowResult.value.timings.agent).toBeGreaterThan(0.003);
      expect(workflowResult.value.timings.api).toBeGreaterThan(0.01);
    });
  });
});
