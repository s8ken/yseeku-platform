/**
 * Performance Monitor
 * 
 * Collects and analyzes performance metrics
 */

import { EventEmitter } from 'events';
import { PerformanceMetrics, PerformanceThresholds, PerformanceReport } from './types';

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    super();
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: {
        latency: { warning: 100, critical: 500 },
        iops: { warning: 1000, critical: 500 }
      },
      responseTime: {
        p50: { warning: 200, critical: 1000 },
        p95: { warning: 500, critical: 2000 },
        p99: { warning: 1000, critical: 5000 }
      },
      errorRate: { warning: 1, critical: 5 },
      ...thresholds
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    this.emit('monitoring:started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring:stopped');
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    const metrics = await this.gatherSystemMetrics();
    
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds and emit alerts
    this.checkThresholds(metrics);
    
    this.emit('metrics:collected', metrics);
    return metrics;
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    return limit ? this.metrics.slice(-limit) : [...this.metrics];
  }

  /**
   * Generate performance report
   */
  generateReport(periodMs: number = 3600000): PerformanceReport {
    const now = Date.now();
    const start = now - periodMs;
    
    const periodMetrics = this.metrics.filter(m => {
      // This would need timestamp in metrics - assuming we have it
      return true; // Placeholder
    });

    const summary = this.calculateSummary(periodMetrics);
    const recommendations = this.generateRecommendations(summary);

    return {
      reportId: `report_${now}`,
      timestamp: now,
      period: { start, end: now },
      summary,
      metrics: periodMetrics,
      thresholds: this.thresholds,
      appliedOptimizations: [], // Would be populated by optimizer
      recommendations
    };
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.emit('thresholds:updated', this.thresholds);
  }

  private async gatherSystemMetrics(): Promise<PerformanceMetrics> {
    // Simulate metric collection - in real implementation would use system APIs
    const now = Date.now();
    
    return {
      system: {
        cpu: {
          usage: Math.random() * 100,
          load: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
          cores: 8,
          frequency: 2400
        },
        memory: {
          usage: Math.random() * 100,
          fragmentation: Math.random() * 20,
          swap: Math.random() * 50,
          cache: Math.random() * 30
        },
        disk: {
          readSpeed: 500 + Math.random() * 500,
          writeSpeed: 400 + Math.random() * 400,
          iops: 1000 + Math.random() * 2000,
          latency: 5 + Math.random() * 20
        },
        network: {
          bandwidth: {
            inbound: Math.random() * 1000,
            outbound: Math.random() * 1000
          },
          latency: 10 + Math.random() * 50,
          packetLoss: Math.random() * 2
        }
      },
      application: {
        responseTime: {
          p50: 100 + Math.random() * 400,
          p95: 200 + Math.random() * 800,
          p99: 500 + Math.random() * 1500
        },
        throughput: {
          requests: 1000 + Math.random() * 9000,
          bytes: 1000000 + Math.random() * 9000000
        },
        errorRate: Math.random() * 5,
        cacheHitRate: 70 + Math.random() * 30,
        databaseQueries: {
          avgExecutionTime: 50 + Math.random() * 200,
          slowQueries: Math.floor(Math.random() * 10),
          connectionPool: {
            active: Math.floor(Math.random() * 20),
            idle: Math.floor(Math.random() * 30),
            total: 50
          }
        },
        queueDepth: Math.floor(Math.random() * 100),
        activeConnections: Math.floor(Math.random() * 1000)
      },
      business: {
        transactionRate: 100 + Math.random() * 900,
        conversionRate: 2 + Math.random() * 8,
        userSatisfaction: 3 + Math.random() * 2,
        revenue: 1000 + Math.random() * 9000
      }
    };
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: string[] = [];

    // CPU checks
    if (metrics.system.cpu.usage >= this.thresholds.cpu.critical) {
      alerts.push('CPU usage critical');
      this.emit('alert:critical', { type: 'cpu', value: metrics.system.cpu.usage });
    } else if (metrics.system.cpu.usage >= this.thresholds.cpu.warning) {
      alerts.push('CPU usage warning');
      this.emit('alert:warning', { type: 'cpu', value: metrics.system.cpu.usage });
    }

    // Memory checks
    if (metrics.system.memory.usage >= this.thresholds.memory.critical) {
      alerts.push('Memory usage critical');
      this.emit('alert:critical', { type: 'memory', value: metrics.system.memory.usage });
    } else if (metrics.system.memory.usage >= this.thresholds.memory.warning) {
      alerts.push('Memory usage warning');
      this.emit('alert:warning', { type: 'memory', value: metrics.system.memory.usage });
    }

    // Response time checks
    if (metrics.application.responseTime.p95 >= this.thresholds.responseTime.p95.critical) {
      alerts.push('Response time critical');
      this.emit('alert:critical', { type: 'response_time', value: metrics.application.responseTime.p95 });
    } else if (metrics.application.responseTime.p95 >= this.thresholds.responseTime.p95.warning) {
      alerts.push('Response time warning');
      this.emit('alert:warning', { type: 'response_time', value: metrics.application.responseTime.p95 });
    }

    // Error rate checks
    if (metrics.application.errorRate >= this.thresholds.errorRate.critical) {
      alerts.push('Error rate critical');
      this.emit('alert:critical', { type: 'error_rate', value: metrics.application.errorRate });
    } else if (metrics.application.errorRate >= this.thresholds.errorRate.warning) {
      alerts.push('Error rate warning');
      this.emit('alert:warning', { type: 'error_rate', value: metrics.application.errorRate });
    }

    if (alerts.length > 0) {
      this.emit('alerts', alerts);
    }
  }

  private calculateSummary(metrics: PerformanceMetrics[]): any {
    if (metrics.length === 0) {
      return {
        overallScore: 0,
        criticalIssues: 0,
        warnings: 0,
        optimizationsApplied: 0,
        performanceImprovement: 0
      };
    }

    const latest = metrics[metrics.length - 1];
    const criticalIssues = this.countCriticalIssues(latest);
    const warnings = this.countWarnings(latest);
    
    // Calculate overall score (0-100)
    const cpuScore = Math.max(0, 100 - latest.system.cpu.usage);
    const memoryScore = Math.max(0, 100 - latest.system.memory.usage);
    const responseScore = Math.max(0, 100 - (latest.application.responseTime.p95 / 20));
    const errorScore = Math.max(0, 100 - (latest.application.errorRate * 20));
    
    const overallScore = (cpuScore + memoryScore + responseScore + errorScore) / 4;

    return {
      overallScore,
      criticalIssues,
      warnings,
      optimizationsApplied: 0, // Would be tracked by optimizer
      performanceImprovement: 0 // Would be calculated by optimizer
    };
  }

  private countCriticalIssues(metrics: PerformanceMetrics): number {
    let count = 0;
    
    if (metrics.system.cpu.usage >= this.thresholds.cpu.critical) count++;
    if (metrics.system.memory.usage >= this.thresholds.memory.critical) count++;
    if (metrics.application.responseTime.p95 >= this.thresholds.responseTime.p95.critical) count++;
    if (metrics.application.errorRate >= this.thresholds.errorRate.critical) count++;
    
    return count;
  }

  private countWarnings(metrics: PerformanceMetrics): number {
    let count = 0;
    
    if (metrics.system.cpu.usage >= this.thresholds.cpu.warning && metrics.system.cpu.usage < this.thresholds.cpu.critical) count++;
    if (metrics.system.memory.usage >= this.thresholds.memory.warning && metrics.system.memory.usage < this.thresholds.memory.critical) count++;
    if (metrics.application.responseTime.p95 >= this.thresholds.responseTime.p95.warning && metrics.application.responseTime.p95 < this.thresholds.responseTime.p95.critical) count++;
    if (metrics.application.errorRate >= this.thresholds.errorRate.warning && metrics.application.errorRate < this.thresholds.errorRate.critical) count++;
    
    return count;
  }

  private generateRecommendations(summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.criticalIssues > 0) {
      recommendations.push('Address critical performance issues immediately');
    }

    if (summary.warnings > 2) {
      recommendations.push('Monitor warning thresholds closely - consider preventive optimization');
    }

    if (summary.overallScore < 70) {
      recommendations.push('Overall performance score below optimal - consider comprehensive optimization');
    }

    recommendations.push('Continue monitoring and adjust thresholds based on patterns');
    
    return recommendations;
  }
}
