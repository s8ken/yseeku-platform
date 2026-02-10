/**
 * @sonate/core - Performance Monitoring Utilities
 *
 * Provides utilities for tracking performance metrics and timing operations.
 */

import { performanceLogger } from '../utils/logger';

import {
  workflowDurationHistogram,
  workflowStepDurationHistogram,
  agentResponseTimeHistogram,
  dbQueryDurationHistogram,
  externalApiDurationHistogram,
} from './metrics';

/**
 * Performance timer for tracking operation duration
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private labels: Record<string, string>;

  constructor(operation: string, labels: Record<string, string> = {}) {
    this.operation = operation;
    this.labels = labels;
    this.startTime = Date.now();
  }

  /**
   * End the timer and record the duration
   */
  end(): number {
    const duration = (Date.now() - this.startTime) / 1000; // Convert to seconds

    performanceLogger.info(`${this.operation} completed`, {
      duration_seconds: duration,
      duration_ms: duration * 1000,
      ...this.labels,
    });

    return duration;
  }

  /**
   * End the timer and record to Prometheus histogram
   */
  endWithMetric(histogram: any): number {
    const duration = this.end();

    // Record to Prometheus histogram
    const labelValues = Object.values(this.labels);
    histogram.observe(...labelValues, duration);

    return duration;
  }
}

/**
 * Decorator for timing workflow operations
 */
export function timeworkflow(workflowName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer('workflow_execution', {
        workflow_name: workflowName,
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = timer.endWithMetric(workflowDurationHistogram);

        // Record success
        workflowDurationHistogram.observe(
          { workflow_name: workflowName, status: 'success' },
          duration
        );

        return result;
      } catch (error) {
        const duration = timer.end();

        // Record failure
        workflowDurationHistogram.observe(
          { workflow_name: workflowName, status: 'failure' },
          duration
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for timing agent operations
 */
export function timeAgentOperation(agentId: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer('agent_operation', {
        agent_id: agentId,
        action,
      });

      try {
        const result = await originalMethod.apply(this, args);
        timer.endWithMetric(agentResponseTimeHistogram);
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper to time async operations
 */
export async function timeAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  labels: Record<string, string> = {}
): Promise<T> {
  const timer = new PerformanceTimer(operation, labels);

  try {
    const result = await fn();
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * Helper to time database queries
 */
export async function timeDbQuery<T>(
  operation: string,
  collection: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = (Date.now() - startTime) / 1000;

    dbQueryDurationHistogram.observe({ operation, collection }, duration);

    performanceLogger.debug('Database query completed', {
      operation,
      collection,
      duration_seconds: duration,
    });

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    dbQueryDurationHistogram.observe({ operation, collection }, duration);

    performanceLogger.error('Database query failed', {
      operation,
      collection,
      duration_seconds: duration,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Helper to time external API calls
 */
export async function timeExternalApi<T>(
  service: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = (Date.now() - startTime) / 1000;

    externalApiDurationHistogram.observe({ service, endpoint }, duration);

    performanceLogger.debug('External API call completed', {
      service,
      endpoint,
      duration_seconds: duration,
    });

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    externalApiDurationHistogram.observe({ service, endpoint }, duration);

    performanceLogger.error('External API call failed', {
      service,
      endpoint,
      duration_seconds: duration,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

/**
 * Get current memory usage
 */
export function getMemoryUsage(): MemorySnapshot {
  const usage = process.memoryUsage();

  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // MB
  };
}

/**
 * Log memory usage
 */
export function logMemoryUsage(context: string = 'system'): void {
  const usage = getMemoryUsage();

  performanceLogger.info('Memory usage snapshot', {
    context,
    ...usage,
  });
}

/**
 * CPU usage tracking (simplified)
 */
export interface CPUUsage {
  user: number;
  system: number;
}

/**
 * Get CPU usage since last call
 */
let lastCpuUsage = process.cpuUsage();

export function getCPUUsage(): CPUUsage {
  const current = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();

  return {
    user: Math.round(current.user / 1000), // Convert to milliseconds
    system: Math.round(current.system / 1000), // Convert to milliseconds
  };
}

/**
 * Performance benchmark helper
 */
export class PerformanceBenchmark {
  private measurements: Map<string, number[]> = new Map();

  /**
   * Record a measurement
   */
  record(name: string, value: number): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(value);
  }

  /**
   * Get statistics for a measurement
   */
  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    median: number;
  } | null {
    const values = this.measurements.get(name);
    if (!values || values.length === 0) {return null;}

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [name, _] of this.measurements) {
      stats[name] = this.getStats(name);
    }

    return stats;
  }

  /**
   * Reset all measurements
   */
  reset(): void {
    this.measurements.clear();
  }

  /**
   * Log all statistics
   */
  logStats(): void {
    const stats = this.getAllStats();

    performanceLogger.info('Performance benchmark results', {
      benchmarks: stats,
    });
  }
}
