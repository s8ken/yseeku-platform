/**
 * @sonate/core - Health Check Infrastructure
 *
 * Provides health check endpoints and system status monitoring.
 */

import { log } from '../logger';

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Health check result for a component
 */
export interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  latency_ms?: number;
  details?: Record<string, any>;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  uptime_seconds: number;
  version: string;
  components: Record<string, ComponentHealth>;
}

/**
 * Health check function type
 */
export type HealthCheckFunction = () => Promise<ComponentHealth>;

/**
 * Health check manager
 */
export class HealthCheckManager {
  private checks: Map<string, HealthCheckFunction> = new Map();
  private startTime: number = Date.now();
  private version: string;

  constructor(version: string = '1.4.0') {
    this.version = version;

    // Register default system checks
    this.registerCheck('memory', this.checkMemory.bind(this));
    this.registerCheck('cpu', this.checkCPU.bind(this));
  }

  /**
   * Register a health check
   */
  registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
    log.info('Health check registered', {
      check: name,
      module: 'HealthCheckManager',
    });
  }

  /**
   * Run all health checks
   */
  async check(): Promise<SystemHealth> {
    const components: Record<string, ComponentHealth> = {};
    let overallStatus: HealthStatus = 'healthy';

    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, checkFn]) => {
        const startTime = Date.now();

        try {
          const result = await Promise.race([
            checkFn(),
            this.timeout(5000), // 5 second timeout
          ]);

          components[name] = {
            ...result,
            latency_ms: Date.now() - startTime,
          };

          // Determine overall status
          if (result.status === 'unhealthy') {
            overallStatus = 'unhealthy';
          } else if (result.status === 'degraded' && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        } catch (error) {
          components[name] = {
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Check failed',
            latency_ms: Date.now() - startTime,
          };
          overallStatus = 'unhealthy';
        }
      }
    );

    await Promise.all(checkPromises);

    const uptime = (Date.now() - this.startTime) / 1000;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_seconds: uptime,
      version: this.version,
      components,
    };
  }

  /**
   * Timeout helper
   */
  private async timeout(ms: number): Promise<ComponentHealth> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), ms)
    );
  }

  /**
   * Memory health check
   */
  private async checkMemory(): Promise<ComponentHealth> {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
      return {
        status: 'unhealthy',
        message: 'Memory usage critical',
        details: {
          heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
          heap_used_percent: Math.round(heapUsedPercent),
        },
      };
    } else if (heapUsedPercent > 75) {
      return {
        status: 'degraded',
        message: 'Memory usage high',
        details: {
          heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
          heap_used_percent: Math.round(heapUsedPercent),
        },
      };
    }

    return {
      status: 'healthy',
      details: {
        heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
        heap_used_percent: Math.round(heapUsedPercent),
      },
    };
  }

  /**
   * CPU health check (simplified)
   */
  private async checkCPU(): Promise<ComponentHealth> {
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;

    // Convert to percentage (simplified - actual CPU monitoring would need more logic)
    const usagePercent = (totalUsage / 1000000) * 100; // Rough estimate

    if (usagePercent > 90) {
      return {
        status: 'degraded',
        message: 'CPU usage high',
        details: {
          user_ms: Math.round(cpuUsage.user / 1000),
          system_ms: Math.round(cpuUsage.system / 1000),
        },
      };
    }

    return {
      status: 'healthy',
      details: {
        user_ms: Math.round(cpuUsage.user / 1000),
        system_ms: Math.round(cpuUsage.system / 1000),
      },
    };
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Reset start time (useful for testing)
   */
  resetUptime(): void {
    this.startTime = Date.now();
  }
}

/**
 * Default health check manager instance
 */
export const healthCheckManager = new HealthCheckManager();

/**
 * Readiness check - indicates if the service is ready to accept traffic
 */
export async function readinessCheck(): Promise<boolean> {
  const health = await healthCheckManager.check();
  return health.status !== 'unhealthy';
}

/**
 * Liveness check - indicates if the service is alive (not deadlocked)
 */
export async function livenessCheck(): Promise<boolean> {
  // Simple check - if we can respond, we're alive
  return true;
}

/**
 * Startup check - indicates if the service has completed initialization
 */
export async function startupCheck(): Promise<boolean> {
  const uptime = healthCheckManager.getUptime();
  // Service is considered started after 5 seconds
  return uptime > 5;
}
