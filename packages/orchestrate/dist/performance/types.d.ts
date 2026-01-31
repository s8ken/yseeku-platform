/**
 * Performance Optimization Types
 *
 * Type definitions for performance monitoring and optimization
 */
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
            avgExecutionTime: number;
            slowQueries: number;
            connectionPool: {
                active: number;
                idle: number;
                total: number;
            };
        };
        queueDepth: number;
        activeConnections: number;
    };
    business: {
        transactionRate: number;
        conversionRate: number;
        userSatisfaction: number;
        revenue: number;
    };
}
export interface PerformanceThresholds {
    cpu: {
        warning: number;
        critical: number;
    };
    memory: {
        warning: number;
        critical: number;
    };
    disk: {
        latency: {
            warning: number;
            critical: number;
        };
        iops: {
            warning: number;
            critical: number;
        };
    };
    responseTime: {
        p50: {
            warning: number;
            critical: number;
        };
        p95: {
            warning: number;
            critical: number;
        };
        p99: {
            warning: number;
            critical: number;
        };
    };
    errorRate: {
        warning: number;
        critical: number;
    };
}
export interface OptimizationStrategy {
    id: string;
    name: string;
    description: string;
    category: 'scaling' | 'caching' | 'database' | 'network' | 'application';
    conditions: OptimizationCondition[];
    actions: OptimizationAction[];
    priority: number;
    estimatedImpact: {
        performance: number;
        cost: number;
        complexity: number;
    };
    rollbackPlan: string;
}
export interface OptimizationCondition {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    duration: number;
}
export interface OptimizationAction {
    type: 'scale' | 'cache' | 'query' | 'config' | 'restart';
    target: string;
    parameters: Record<string, any>;
    timeout: number;
}
export interface OptimizationResult {
    strategyId: string;
    timestamp: number;
    beforeMetrics: PerformanceMetrics;
    afterMetrics: PerformanceMetrics;
    success: boolean;
    executionTime: number;
    error?: string;
    rollbackRequired: boolean;
}
export interface PerformanceReport {
    reportId: string;
    timestamp: number;
    period: {
        start: number;
        end: number;
    };
    summary: {
        overallScore: number;
        criticalIssues: number;
        warnings: number;
        optimizationsApplied: number;
        performanceImprovement: number;
    };
    metrics: PerformanceMetrics[];
    thresholds: PerformanceThresholds;
    appliedOptimizations: OptimizationResult[];
    recommendations: string[];
}
export interface ScalingDecision {
    action: 'scale_up' | 'scale_down' | 'scale_out' | 'scale_in';
    resource: string;
    targetCount: number;
    reason: string;
    confidence: number;
    estimatedCost: number;
}
