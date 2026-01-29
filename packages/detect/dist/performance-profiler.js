"use strict";
/**
 * Performance Profiler for Detection Pipeline
 *
 * Real-time performance monitoring and optimization recommendations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceProfiler = void 0;
class PerformanceProfiler {
    constructor() {
        this.profiles = [];
        this.metrics = [];
        this.startTime = Date.now();
        this.detectionCount = 0;
        this.errorCount = 0;
        this.cacheHits = 0;
    }
    /**
     * Record a detection profile
     */
    recordProfile(profile) {
        this.profiles.push(profile);
        this.detectionCount++;
        if (profile.cacheHit) {
            this.cacheHits++;
        }
        // Keep only recent profiles (last 1000)
        if (this.profiles.length > 1000) {
            this.profiles = this.profiles.slice(-1000);
        }
        // Update metrics
        this.updateMetrics();
    }
    /**
     * Record an error
     */
    recordError() {
        this.errorCount++;
        this.updateMetrics();
    }
    /**
     * Get current performance metrics
     */
    getCurrentMetrics() {
        const now = Date.now();
        const timeElapsed = (now - this.startTime) / 1000; // seconds
        return {
            detectionTime: this.getAverageDetectionTime(),
            cacheHitRate: this.cacheHits / Math.max(this.detectionCount, 1),
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            throughput: this.detectionCount / Math.max(timeElapsed, 1),
            errorRate: this.errorCount / Math.max(this.detectionCount, 1),
        };
    }
    /**
     * Generate performance report
     */
    generateReport() {
        const metrics = this.getCurrentMetrics();
        const bottlenecks = this.identifyBottlenecks(metrics);
        const recommendations = this.generateRecommendations(metrics, bottlenecks);
        const grade = this.calculateGrade(metrics);
        return {
            timestamp: Date.now(),
            metrics,
            bottlenecks,
            recommendations,
            grade,
        };
    }
    /**
     * Get detailed analytics
     */
    getAnalytics() {
        const byComplexity = {
            low: this.profiles.filter((p) => p.complexity === 'low'),
            medium: this.profiles.filter((p) => p.complexity === 'medium'),
            high: this.profiles.filter((p) => p.complexity === 'high'),
        };
        const byContentLength = {
            short: this.profiles.filter((p) => p.contentLength < 100),
            medium: this.profiles.filter((p) => p.contentLength >= 100 && p.contentLength < 500),
            long: this.profiles.filter((p) => p.contentLength >= 500),
        };
        const dimensionPerformance = {
            reality: this.calculateDimensionStats('reality'),
            trust: this.calculateDimensionStats('trust'),
            ethical: this.calculateDimensionStats('ethical'),
            resonance: this.calculateDimensionStats('resonance'),
            canvas: this.calculateDimensionStats('canvas'),
        };
        const trends = {
            detectionTime: this.profiles.slice(-50).map((p) => p.duration),
            cacheHitRate: this.calculateCacheHitTrends(),
        };
        return {
            byComplexity,
            byContentLength,
            dimensionPerformance,
            trends,
        };
    }
    /**
     * Reset profiler
     */
    reset() {
        this.profiles = [];
        this.metrics = [];
        this.startTime = Date.now();
        this.detectionCount = 0;
        this.errorCount = 0;
        this.cacheHits = 0;
    }
    updateMetrics() {
        this.metrics.push(this.getCurrentMetrics());
        // Keep only recent metrics (last 100)
        if (this.metrics.length > 100) {
            this.metrics = this.metrics.slice(-100);
        }
    }
    getAverageDetectionTime() {
        if (this.profiles.length === 0) {
            return 0;
        }
        const totalTime = this.profiles.reduce((sum, profile) => sum + profile.duration, 0);
        return totalTime / this.profiles.length;
    }
    identifyBottlenecks(metrics) {
        const bottlenecks = [];
        if (metrics.detectionTime > 50) {
            bottlenecks.push('Detection time exceeds 50ms target');
        }
        if (metrics.cacheHitRate < 0.3) {
            bottlenecks.push('Low cache hit rate');
        }
        if (metrics.memoryUsage > 100) {
            bottlenecks.push('High memory usage');
        }
        if (metrics.throughput < 20) {
            bottlenecks.push('Low throughput');
        }
        if (metrics.errorRate > 0.05) {
            bottlenecks.push('High error rate');
        }
        return bottlenecks;
    }
    generateRecommendations(metrics, bottlenecks) {
        const recommendations = [];
        if (metrics.detectionTime > 50) {
            recommendations.push('Optimize dimension calculations with caching');
            recommendations.push('Consider parallel processing for independent operations');
        }
        if (metrics.cacheHitRate < 0.3) {
            recommendations.push('Increase cache size or TTL');
            recommendations.push('Optimize cache key generation');
        }
        if (metrics.memoryUsage > 100) {
            recommendations.push('Implement more aggressive cache cleanup');
            recommendations.push('Review memory allocation patterns');
        }
        if (metrics.throughput < 20) {
            recommendations.push('Enable connection pooling for external services');
            recommendations.push('Implement request batching');
        }
        if (metrics.errorRate > 0.05) {
            recommendations.push('Add better error handling and retry logic');
            recommendations.push('Implement circuit breaker pattern');
        }
        // General recommendations
        if (recommendations.length === 0) {
            recommendations.push('Performance is optimal - continue monitoring');
        }
        return recommendations;
    }
    calculateGrade(metrics) {
        let score = 100;
        // Detection time scoring (40% weight)
        if (metrics.detectionTime > 50) {
            score -= 40;
        }
        else if (metrics.detectionTime > 30) {
            score -= 20;
        }
        else if (metrics.detectionTime > 20) {
            score -= 10;
        }
        // Cache hit rate scoring (20% weight)
        if (metrics.cacheHitRate < 0.3) {
            score -= 20;
        }
        else if (metrics.cacheHitRate < 0.5) {
            score -= 10;
        }
        else if (metrics.cacheHitRate < 0.7) {
            score -= 5;
        }
        // Throughput scoring (20% weight)
        if (metrics.throughput < 20) {
            score -= 20;
        }
        else if (metrics.throughput < 30) {
            score -= 10;
        }
        else if (metrics.throughput < 40) {
            score -= 5;
        }
        // Error rate scoring (10% weight)
        if (metrics.errorRate > 0.05) {
            score -= 10;
        }
        else if (metrics.errorRate > 0.02) {
            score -= 5;
        }
        // Memory usage scoring (10% weight)
        if (metrics.memoryUsage > 100) {
            score -= 10;
        }
        else if (metrics.memoryUsage > 50) {
            score -= 5;
        }
        if (score >= 90) {
            return 'A';
        }
        if (score >= 80) {
            return 'B';
        }
        if (score >= 70) {
            return 'C';
        }
        if (score >= 60) {
            return 'D';
        }
        return 'F';
    }
    calculateDimensionStats(dimension) {
        const values = this.profiles.map((p) => p.dimensions[dimension]);
        return {
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }
    calculateCacheHitTrends() {
        const windowSize = 20;
        const trends = [];
        for (let i = windowSize; i < this.profiles.length; i++) {
            const window = this.profiles.slice(i - windowSize, i);
            const hitRate = window.filter((p) => p.cacheHit).length / windowSize;
            trends.push(hitRate);
        }
        return trends;
    }
    /**
     * Export performance data for analysis
     */
    exportData() {
        return {
            profiles: [...this.profiles],
            metrics: [...this.metrics],
            summary: this.generateReport(),
        };
    }
    /**
     * Get real-time performance alerts
     */
    getAlerts() {
        const metrics = this.getCurrentMetrics();
        const alerts = [];
        // Critical alerts
        if (metrics.detectionTime > 100) {
            alerts.push({
                level: 'critical',
                message: 'Detection time critically high',
                metric: 'detectionTime',
                value: metrics.detectionTime,
                threshold: 100,
            });
        }
        if (metrics.errorRate > 0.1) {
            alerts.push({
                level: 'critical',
                message: 'Error rate critically high',
                metric: 'errorRate',
                value: metrics.errorRate,
                threshold: 0.1,
            });
        }
        // Warning alerts
        if (metrics.detectionTime > 50) {
            alerts.push({
                level: 'warning',
                message: 'Detection time exceeds target',
                metric: 'detectionTime',
                value: metrics.detectionTime,
                threshold: 50,
            });
        }
        if (metrics.cacheHitRate < 0.2) {
            alerts.push({
                level: 'warning',
                message: 'Cache hit rate very low',
                metric: 'cacheHitRate',
                value: metrics.cacheHitRate,
                threshold: 0.2,
            });
        }
        // Info alerts
        if (metrics.throughput < 10) {
            alerts.push({
                level: 'info',
                message: 'Throughput could be improved',
                metric: 'throughput',
                value: metrics.throughput,
                threshold: 10,
            });
        }
        return alerts;
    }
}
exports.PerformanceProfiler = PerformanceProfiler;
