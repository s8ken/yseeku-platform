/**
 * Performance Optimization System
 * Automated performance monitoring and optimization
 */

import { EventEmitter } from 'events';
import { ProductionMonitoring } from './production-monitoring';

export interface PerformanceMetrics {
  system: {
    cpu: {
      usage: number;
      load: number[];
      cores: number;
      frequency: number;
    };
    memory: {
      usage: number;
      fragmentation: number;
      swap: number;
      cache: number;
    };
    disk: {
      readSpeed: number;
      writeSpeed: number;
      iops: number;
      latency: number;
    };
    network: {
      bandwidth: {
        inbound: number;
        outbound: number;
      };
      latency: number;
      packetLoss: number;
    };
  };
  application: {
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requests: number;
      bytes: number;
    };
    errorRate: number;
    cacheHitRate: number;
    databaseQueries: {
      avgTime: number;
      slowQueries: number;
      connections: number;
    };
    memoryUsage: {
      heap: number;
      external: number;
      rss: number;
    };
  };
  business: {
    userExperience: {
      pageLoadTime: number;
      timeToInteractive: number;
      coreWebVitals: {
        lcp: number; // Largest Contentful Paint
        fid: number; // First Input Delay
        cls: number; // Cumulative Layout Shift
      };
    };
    conversion: {
      rate: number;
      abandonment: number;
      funnelCompletion: number;
    };
    engagement: {
      sessionDuration: number;
      bounceRate: number;
      pagesPerSession: number;
    };
  };
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
  direction: 'higher-is-better' | 'lower-is-better';
  enabled: boolean;
}

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'memory' | 'cpu' | 'network' | 'database' | 'cache' | 'cdn';
  condition: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
    duration: number; // seconds
  };
  action: OptimizationAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // seconds
  lastExecuted?: Date;
}

export interface OptimizationAction {
  type: 'scale' | 'restart' | 'cache-clear' | 'config-change' | 'alert' | 'script' | 'traffic-shift';
  target: string;
  parameters: Record<string, any>;
  rollback: {
    enabled: boolean;
    conditions: string[];
    timeout: number;
  };
}

export interface OptimizationResult {
  id: string;
  ruleId: string;
  ruleName: string;
  action: OptimizationAction;
  status: 'executing' | 'completed' | 'failed' | 'rolled-back';
  triggeredAt: Date;
  completedAt?: Date;
  metrics: {
    before: number;
    after: number;
    improvement: number;
    unit: string;
  };
  details: {
    message: string;
    logs: string[];
    errors: string[];
  };
  rollbackData?: any;
}

export interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    overallScore: number;
    improvements: number;
    degradations: number;
    optimizations: number;
  };
  metrics: PerformanceMetrics;
  thresholds: PerformanceThreshold[];
  optimizations: OptimizationResult[];
  recommendations: PerformanceRecommendation[];
  trends: {
    cpu: Array<{ timestamp: Date; value: number }>;
    memory: Array<{ timestamp: Date; value: number }>;
    responseTime: Array<{ timestamp: Date; value: number }>;
    throughput: Array<{ timestamp: Date; value: number }>;
  };
  generatedAt: Date;
}

export interface PerformanceRecommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    expectedImprovement: number;
    confidence: number;
    effort: 'low' | 'medium' | 'high';
  };
  actions: string[];
  metrics: string[];
}

export class PerformanceOptimization extends EventEmitter {
  private metrics: PerformanceMetrics;
  private thresholds = new Map<string, PerformanceThreshold>();
  private rules: OptimizationRule[] = [];
  private optimizations: OptimizationResult[] = [];
  private monitoring: ProductionMonitoring;
  private optimizationActive = false;
  private lastOptimization = new Map<string, Date>();

  constructor(monitoring: ProductionMonitoring) {
    super();
    this.monitoring = monitoring;
    this.metrics = this.initializeMetrics();
    this.setupDefaultThresholds();
    this.setupDefaultRules();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      system: {
        cpu: {
          usage: 0,
          load: [0, 0, 0],
          cores: 16,
          frequency: 2400
        },
        memory: {
          usage: 0,
          fragmentation: 0,
          swap: 0,
          cache: 0
        },
        disk: {
          readSpeed: 0,
          writeSpeed: 0,
          iops: 0,
          latency: 0
        },
        network: {
          bandwidth: {
            inbound: 0,
            outbound: 0
          },
          latency: 0,
          packetLoss: 0
        }
      },
      application: {
        responseTime: {
          p50: 0,
          p95: 0,
          p99: 0
        },
        throughput: {
          requests: 0,
          bytes: 0
        },
        errorRate: 0,
        cacheHitRate: 0,
        databaseQueries: {
          avgTime: 0,
          slowQueries: 0,
          connections: 0
        },
        memoryUsage: {
          heap: 0,
          external: 0,
          rss: 0
        }
      },
      business: {
        userExperience: {
          pageLoadTime: 0,
          timeToInteractive: 0,
          coreWebVitals: {
            lcp: 0,
            fid: 0,
            cls: 0
          }
        },
        conversion: {
          rate: 0,
          abandonment: 0,
          funnelCompletion: 0
        },
        engagement: {
          sessionDuration: 0,
          bounceRate: 0,
          pagesPerSession: 0
        }
      }
    };
  }

  private setupDefaultThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
      // System thresholds
      {
        metric: 'system.cpu.usage',
        warning: 70,
        critical: 90,
        unit: '%',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'system.memory.usage',
        warning: 75,
        critical: 90,
        unit: '%',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'system.disk.latency',
        warning: 10,
        critical: 25,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'system.network.latency',
        warning: 50,
        critical: 100,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },

      // Application thresholds
      {
        metric: 'application.responseTime.p95',
        warning: 500,
        critical: 1000,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'application.responseTime.p99',
        warning: 1000,
        critical: 2000,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'application.errorRate',
        warning: 1,
        critical: 5,
        unit: '%',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'application.cacheHitRate',
        warning: 80,
        critical: 70,
        unit: '%',
        direction: 'higher-is-better',
        enabled: true
      },
      {
        metric: 'application.databaseQueries.avgTime',
        warning: 100,
        critical: 500,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },

      // Business thresholds
      {
        metric: 'business.userExperience.pageLoadTime',
        warning: 2000,
        critical: 4000,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'business.userExperience.coreWebVitals.lcp',
        warning: 2500,
        critical: 4000,
        unit: 'ms',
        direction: 'lower-is-better',
        enabled: true
      },
      {
        metric: 'business.conversion.rate',
        warning: 2,
        critical: 1,
        unit: '%',
        direction: 'higher-is-better',
        enabled: true
      }
    ];

    for (const threshold of defaultThresholds) {
      this.thresholds.set(threshold.metric, threshold);
    }

    console.log('📊 Default performance thresholds configured');
  }

  private setupDefaultRules(): void {
    const defaultRules: OptimizationRule[] = [
      // CPU optimization rules
      {
        id: 'cpu-scale-up',
        name: 'Scale up on high CPU',
        description: 'Automatically scale up resources when CPU usage is high',
        category: 'cpu',
        condition: {
          metric: 'system.cpu.usage',
          operator: '>',
          threshold: 80,
          duration: 300 // 5 minutes
        },
        action: {
          type: 'scale',
          target: 'application',
          parameters: {
            direction: 'up',
            percentage: 25
          },
          rollback: {
            enabled: true,
            conditions: ['cpu_usage < 50'],
            timeout: 600
          }
        },
        priority: 'high',
        enabled: true,
        cooldown: 900 // 15 minutes
      },

      // Memory optimization rules
      {
        id: 'memory-clear-cache',
        name: 'Clear cache on high memory usage',
        description: 'Clear application cache when memory usage is high',
        category: 'cache',
        condition: {
          metric: 'system.memory.usage',
          operator: '>',
          threshold: 85,
          duration: 120 // 2 minutes
        },
        action: {
          type: 'cache-clear',
          target: 'application',
          parameters: {
            type: 'all'
          },
          rollback: {
            enabled: false,
            conditions: [],
            timeout: 0
          }
        },
        priority: 'medium',
        enabled: true,
        cooldown: 300 // 5 minutes
      },

      // Response time optimization
      {
        id: 'response-time-scale',
        name: 'Scale on slow response time',
        description: 'Scale up when response times are slow',
        category: 'performance',
        condition: {
          metric: 'application.responseTime.p95',
          operator: '>',
          threshold: 800,
          duration: 180 // 3 minutes
        },
        action: {
          type: 'scale',
          target: 'application',
          parameters: {
            direction: 'up',
            percentage: 50
          },
          rollback: {
            enabled: true,
            conditions: ['response_time_p95 < 400'],
            timeout: 900
          }
        },
        priority: 'high',
        enabled: true,
        cooldown: 600 // 10 minutes
      },

      // Database optimization
      {
        id: 'database-connection-pool',
        name: 'Increase database connection pool',
        description: 'Increase database connection pool when queries are slow',
        category: 'database',
        condition: {
          metric: 'application.databaseQueries.avgTime',
          operator: '>',
          threshold: 200,
          duration: 240 // 4 minutes
        },
        action: {
          type: 'config-change',
          target: 'database',
          parameters: {
            property: 'connectionPoolSize',
            value: 20
          },
          rollback: {
            enabled: true,
            conditions: ['db_avg_time < 100'],
            timeout: 300
          }
        },
        priority: 'medium',
        enabled: true,
        cooldown: 600 // 10 minutes
      },

      // Cache optimization
      {
        id: 'cache-expiry-extend',
        name: 'Extend cache expiry on low hit rate',
        description: 'Extend cache TTL when hit rate is low',
        category: 'cache',
        condition: {
          metric: 'application.cacheHitRate',
          operator: '<',
          threshold: 75,
          duration: 600 // 10 minutes
        },
        action: {
          type: 'config-change',
          target: 'cache',
          parameters: {
            ttlMultiplier: 2
          },
          rollback: {
            enabled: true,
            conditions: ['cache_hit_rate > 85'],
            timeout: 900
          }
        },
        priority: 'low',
        enabled: true,
        cooldown: 1200 // 20 minutes
      }
    ];

    this.rules = defaultRules;
    console.log('🤖 Default optimization rules configured');
  }

  async startOptimization(): Promise<void> {
    if (this.optimizationActive) {
      return;
    }

    console.log('🚀 Starting performance optimization...');
    this.optimizationActive = true;

    // Start optimization loops
    this.startMetricsCollection();
    this.startRuleEvaluation();
    this.startOptimizationExecution();
    this.startPerformanceReporting();

    this.emit('optimizationStarted');
    console.log('✅ Performance optimization started');
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
      this.evaluateThresholds();
    }, 30000); // Every 30 seconds
  }

  private startRuleEvaluation(): void {
    setInterval(() => {
      this.evaluateRules();
    }, 60000); // Every minute
  }

  private startOptimizationExecution(): void {
    setInterval(() => {
      this.executePendingOptimizations();
    }, 120000); // Every 2 minutes
  }

  private startPerformanceReporting(): void {
    setInterval(() => {
      this.generatePerformanceReport();
    }, 3600000); // Every hour
  }

  private collectMetrics(): void {
    // System metrics
    this.metrics.system.cpu = {
      usage: 20 + Math.random() * 60,
      load: [
        0.5 + Math.random() * 2,
        0.5 + Math.random() * 2,
        0.5 + Math.random() * 2
      ],
      cores: 16,
      frequency: 2400
    };

    this.metrics.system.memory = {
      usage: 30 + Math.random() * 50,
      fragmentation: Math.random() * 20,
      swap: Math.random() * 10,
      cache: 20 + Math.random() * 30
    };

    this.metrics.system.disk = {
      readSpeed: 100 + Math.random() * 400,
      writeSpeed: 80 + Math.random() * 320,
      iops: 1000 + Math.random() * 4000,
      latency: 1 + Math.random() * 9
    };

    this.metrics.system.network = {
      bandwidth: {
        inbound: 100 + Math.random() * 900,
        outbound: 50 + Math.random() * 450
      },
      latency: 5 + Math.random() * 45,
      packetLoss: Math.random() * 0.1
    };

    // Application metrics
    this.metrics.application.responseTime = {
      p50: 50 + Math.random() * 100,
      p95: 100 + Math.random() * 400,
      p99: 200 + Math.random() * 800
    };

    this.metrics.application.throughput = {
      requests: 1000 + Math.random() * 4000,
      bytes: (1000 + Math.random() * 4000) * 1024
    };

    this.metrics.application.errorRate = Math.random() * 5;
    this.metrics.application.cacheHitRate = 70 + Math.random() * 30;

    this.metrics.application.databaseQueries = {
      avgTime: 50 + Math.random() * 150,
      slowQueries: Math.floor(Math.random() * 10),
      connections: 10 + Math.floor(Math.random() * 40)
    };

    this.metrics.application.memoryUsage = {
      heap: 100 + Math.random() * 400,
      external: 50 + Math.random() * 200,
      rss: 200 + Math.random() * 800
    };

    // Business metrics
    this.metrics.business.userExperience = {
      pageLoadTime: 800 + Math.random() * 3200,
      timeToInteractive: 1000 + Math.random() * 2000,
      coreWebVitals: {
        lcp: 1500 + Math.random() * 2500,
        fid: 50 + Math.random() * 150,
        cls: 0.1 + Math.random() * 0.4
      }
    };

    this.metrics.business.conversion = {
      rate: 2 + Math.random() * 4,
      abandonment: 20 + Math.random() * 30,
      funnelCompletion: 60 + Math.random() * 35
    };

    this.metrics.business.engagement = {
      sessionDuration: 120 + Math.random() * 480,
      bounceRate: 20 + Math.random() * 40,
      pagesPerSession: 2 + Math.random() * 4
    };

    this.emit('metricsUpdated', this.metrics);
  }

  private evaluateThresholds(): void {
    for (const [metricName, threshold] of this.thresholds.entries()) {
      if (!threshold.enabled) continue;

      const currentValue = this.getMetricValue(metricName);
      if (currentValue === null) continue;

      let alertTriggered = false;
      
      if (threshold.direction === 'lower-is-better') {
        alertTriggered = currentValue > threshold.critical;
      } else {
        alertTriggered = currentValue < threshold.critical;
      }

      if (alertTriggered) {
        this.emit('thresholdAlert', {
          metric: metricName,
          value: currentValue,
          threshold: threshold.critical,
          severity: 'critical'
        });
      }
    }
  }

  private getMetricValue(metricPath: string): number | null {
    const parts = metricPath.split('.');
    let value: any = this.metrics;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }

    return typeof value === 'number' ? value : null;
  }

  private evaluateRules(): void {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastExecution = this.lastOptimization.get(rule.id);
      if (lastExecution && Date.now() - lastExecution.getTime() < rule.cooldown * 1000) {
        continue;
      }

      // Check condition
      const currentValue = this.getMetricValue(rule.condition.metric);
      if (currentValue === null) continue;

      let conditionMet = false;
      
      switch (rule.condition.operator) {
        case '>':
          conditionMet = currentValue > rule.condition.threshold;
          break;
        case '<':
          conditionMet = currentValue < rule.condition.threshold;
          break;
        case '>=':
          conditionMet = currentValue >= rule.condition.threshold;
          break;
        case '<=':
          conditionMet = currentValue <= rule.condition.threshold;
          break;
        case '=':
          conditionMet = currentValue === rule.condition.threshold;
          break;
      }

      if (conditionMet) {
        this.queueOptimization(rule);
      }
    }
  }

  private queueOptimization(rule: OptimizationRule): void {
    console.log(`🤖 Queueing optimization: ${rule.name}`);
    
    const optimization: OptimizationResult = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.action,
      status: 'executing',
      triggeredAt: new Date(),
      metrics: {
        before: this.getMetricValue(rule.condition.metric) || 0,
        after: 0,
        improvement: 0,
        unit: this.thresholds.get(rule.condition.metric)?.unit || ''
      },
      details: {
        message: `Executing ${rule.name} optimization`,
        logs: [`Optimization triggered at ${new Date().toISOString()}`],
        errors: []
      }
    };

    this.optimizations.push(optimization);
    this.lastOptimization.set(rule.id, new Date());
    
    this.emit('optimizationQueued', optimization);
  }

  private executePendingOptimizations(): void {
    const pendingOptimizations = this.optimizations.filter(o => o.status === 'executing');
    
    for (const optimization of pendingOptimizations) {
      this.executeOptimization(optimization);
    }
  }

  private async executeOptimization(optimization: OptimizationResult): Promise<void> {
    console.log(`⚡ Executing optimization: ${optimization.ruleName}`);

    try {
      // Mock optimization execution
      await this.mockOptimizationExecution(optimization);
      
      optimization.status = 'completed';
      optimization.completedAt = new Date();
      optimization.metrics.after = this.getMetricValue(this.getRuleById(optimization.ruleId)?.condition.metric || '') || 0;
      optimization.metrics.improvement = optimization.metrics.before - optimization.metrics.after;
      
      optimization.details.message = `Optimization completed successfully`;
      optimization.details.logs.push(`Optimization completed at ${new Date().toISOString()}`);

      console.log(`✅ Optimization completed: ${optimization.ruleName}`);
      this.emit('optimizationCompleted', optimization);

    } catch (error) {
      optimization.status = 'failed';
      optimization.completedAt = new Date();
      optimization.details.errors.push((error as Error).message);
      
      console.error(`❌ Optimization failed: ${optimization.ruleName}`, error);
      this.emit('optimizationFailed', { optimization, error: (error as Error).message });
    }
  }

  private async mockOptimizationExecution(optimization: OptimizationResult): Promise<void> {
    const executionTime = 2000 + Math.random() * 8000; // 2-10 seconds
    
    optimization.details.logs.push(`Executing ${optimization.action.type} action...`);
    await new Promise(resolve => setTimeout(resolve, executionTime / 2));
    
    optimization.details.logs.push(`Applying changes to ${optimization.action.target}...`);
    await new Promise(resolve => setTimeout(resolve, executionTime / 2));

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(`Optimization execution failed for ${optimization.action.type}`);
    }
  }

  private getRuleById(ruleId: string): OptimizationRule | undefined {
    return this.rules.find(r => r.id === ruleId);
  }

  async generatePerformanceReport(): Promise<PerformanceReport> {
    console.log('📊 Generating performance report...');

    const report: PerformanceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      period: {
        start: new Date(Date.now() - 3600000), // 1 hour ago
        end: new Date()
      },
      summary: this.calculatePerformanceSummary(),
      metrics: { ...this.metrics },
      thresholds: Array.from(this.thresholds.values()),
      optimizations: this.optimizations.slice(-10), // Last 10 optimizations
      recommendations: this.generateRecommendations(),
      trends: this.generatePerformanceTrends(),
      generatedAt: new Date()
    };

    this.emit('reportGenerated', report);
    return report;
  }

  private calculatePerformanceSummary(): PerformanceReport['summary'] {
    const recentOptimizations = this.optimizations.filter(o => 
      o.status === 'completed' && 
      o.triggeredAt > new Date(Date.now() - 3600000)
    );

    const improvements = recentOptimizations.filter(o => o.metrics.improvement > 0).length;
    const degradations = recentOptimizations.filter(o => o.metrics.improvement < 0).length;

    return {
      overallScore: this.calculateOverallScore(),
      improvements,
      degradations,
      optimizations: recentOptimizations.length
    };
  }

  private calculateOverallScore(): number {
    let totalScore = 0;
    let metricCount = 0;

    // System score (40% weight)
    const systemScore = (100 - this.metrics.system.cpu.usage) * 0.3 +
                       (100 - this.metrics.system.memory.usage) * 0.4 +
                       Math.max(0, 100 - this.metrics.system.disk.latency) * 0.3;
    totalScore += systemScore * 0.4;
    metricCount++;

    // Application score (40% weight)
    const appScore = Math.max(0, 100 - this.metrics.application.responseTime.p95 / 10) * 0.4 +
                    Math.max(0, 100 - this.metrics.application.errorRate * 20) * 0.3 +
                    this.metrics.application.cacheHitRate * 0.3;
    totalScore += appScore * 0.4;
    metricCount++;

    // Business score (20% weight)
    const businessScore = Math.max(0, 100 - this.metrics.business.userExperience.pageLoadTime / 50) * 0.4 +
                         this.metrics.business.conversion.rate * 10 * 0.6;
    totalScore += businessScore * 0.2;
    metricCount++;

    return Math.round(totalScore / metricCount);
  }

  private generateRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // CPU recommendations
    if (this.metrics.system.cpu.usage > 70) {
      recommendations.push({
        id: 'rec-cpu-optimization',
        category: 'cpu',
        priority: 'high',
        title: 'Optimize CPU Usage',
        description: 'CPU usage is above optimal threshold. Consider scaling up or optimizing CPU-intensive processes.',
        impact: {
          expectedImprovement: 25,
          confidence: 80,
          effort: 'medium'
        },
        actions: [
          'Scale up resources',
          'Profile CPU-intensive operations',
          'Implement caching for frequent computations'
        ],
        metrics: ['system.cpu.usage', 'application.responseTime.p95']
      });
    }

    // Memory recommendations
    if (this.metrics.system.memory.usage > 75) {
      recommendations.push({
        id: 'rec-memory-optimization',
        category: 'memory',
        priority: 'medium',
        title: 'Optimize Memory Usage',
        description: 'Memory usage is high. Implement memory optimization strategies.',
        impact: {
          expectedImprovement: 20,
          confidence: 75,
          effort: 'low'
        },
        actions: [
          'Clear unused caches',
          'Optimize data structures',
          'Implement memory pooling'
        ],
        metrics: ['system.memory.usage', 'application.memoryUsage.heap']
      });
    }

    // Response time recommendations
    if (this.metrics.application.responseTime.p95 > 500) {
      recommendations.push({
        id: 'rec-response-optimization',
        category: 'performance',
        priority: 'high',
        title: 'Improve Response Times',
        description: 'Response times are slower than optimal. Investigate bottlenecks.',
        impact: {
          expectedImprovement: 30,
          confidence: 85,
          effort: 'high'
        },
        actions: [
          'Profile slow endpoints',
          'Optimize database queries',
          'Implement response caching'
        ],
        metrics: ['application.responseTime.p95', 'application.databaseQueries.avgTime']
      });
    }

    return recommendations;
  }

  private generatePerformanceTrends(): PerformanceReport['trends'] {
    const generateTrendData = (baseValue: number, variance: number, points: number = 12) => {
      const trends = [];
      const now = Date.now();
      
      for (let i = points - 1; i >= 0; i--) {
        const timestamp = new Date(now - (i * 300000)); // 5-minute intervals
        const value = baseValue + (Math.random() - 0.5) * variance;
        trends.push({ timestamp, value });
      }
      
      return trends;
    };

    return {
      cpu: generateTrendData(this.metrics.system.cpu.usage, 20),
      memory: generateTrendData(this.metrics.system.memory.usage, 15),
      responseTime: generateTrendData(this.metrics.application.responseTime.p95, 200),
      throughput: generateTrendData(this.metrics.application.throughput.requests, 1000)
    };
  }

  async stopOptimization(): Promise<void> {
    this.optimizationActive = false;
    console.log('⏹️ Performance optimization stopped');
    this.emit('optimizationStopped');
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getThresholds(): PerformanceThreshold[] {
    return Array.from(this.thresholds.values());
  }

  getRules(): OptimizationRule[] {
    return this.rules;
  }

  getOptimizations(filter?: {
    status?: OptimizationResult['status'];
    ruleId?: string;
  }): OptimizationResult[] {
    let filtered = [...this.optimizations];

    if (filter?.status) {
      filtered = filtered.filter(o => o.status === filter.status);
    }

    if (filter?.ruleId) {
      filtered = filtered.filter(o => o.ruleId === filter.ruleId);
    }

    return filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  updateThreshold(metric: string, threshold: Partial<PerformanceThreshold>): void {
    const existing = this.thresholds.get(metric);
    if (!existing) {
      throw new Error(`Threshold not found for metric: ${metric}`);
    }

    this.thresholds.set(metric, { ...existing, ...threshold });
    console.log(`📝 Updated threshold for ${metric}`);
    this.emit('thresholdUpdated', { metric, threshold });
  }

  addRule(rule: OptimizationRule): void {
    this.rules.push(rule);
    console.log(`🤖 Added optimization rule: ${rule.name}`);
    this.emit('ruleAdded', rule);
  }

  updateRule(ruleId: string, updates: Partial<OptimizationRule>): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    Object.assign(rule, updates);
    console.log(`📝 Updated optimization rule: ${rule.name}`);
    this.emit('ruleUpdated', { ruleId, updates });
  }
}

export default PerformanceOptimization;