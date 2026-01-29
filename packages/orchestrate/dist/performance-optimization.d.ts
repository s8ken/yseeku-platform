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
                lcp: number;
                fid: number;
                cls: number;
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
        duration: number;
    };
    action: OptimizationAction;
    priority: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldown: number;
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
        cpu: Array<{
            timestamp: Date;
            value: number;
        }>;
        memory: Array<{
            timestamp: Date;
            value: number;
        }>;
        responseTime: Array<{
            timestamp: Date;
            value: number;
        }>;
        throughput: Array<{
            timestamp: Date;
            value: number;
        }>;
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
export declare class PerformanceOptimization extends EventEmitter {
    private metrics;
    private thresholds;
    private rules;
    private optimizations;
    private monitoring;
    private optimizationActive;
    private lastOptimization;
    constructor(monitoring: ProductionMonitoring);
    private initializeMetrics;
    private setupDefaultThresholds;
    private setupDefaultRules;
    startOptimization(): Promise<void>;
    private startMetricsCollection;
    private startRuleEvaluation;
    private startOptimizationExecution;
    private startPerformanceReporting;
    private collectMetrics;
    private evaluateThresholds;
    private getMetricValue;
    private evaluateRules;
    private queueOptimization;
    private executePendingOptimizations;
    private executeOptimization;
    private mockOptimizationExecution;
    private getRuleById;
    generatePerformanceReport(): Promise<PerformanceReport>;
    private calculatePerformanceSummary;
    private calculateOverallScore;
    private generateRecommendations;
    private generatePerformanceTrends;
    stopOptimization(): Promise<void>;
    getMetrics(): PerformanceMetrics;
    getThresholds(): PerformanceThreshold[];
    getRules(): OptimizationRule[];
    getOptimizations(filter?: {
        status?: OptimizationResult['status'];
        ruleId?: string;
    }): OptimizationResult[];
    updateThreshold(metric: string, threshold: Partial<PerformanceThreshold>): void;
    addRule(rule: OptimizationRule): void;
    updateRule(ruleId: string, updates: Partial<OptimizationRule>): void;
}
export default PerformanceOptimization;
//# sourceMappingURL=performance-optimization.d.ts.map