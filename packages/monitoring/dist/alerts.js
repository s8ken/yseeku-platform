"use strict";
/**
 * Alerting System for SONATE Monitoring
 * Configurable alerts for system health and performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertManager = exports.AlertManager = exports.defaultAlertRules = void 0;
/**
 * Pre-configured alert rules for SONATE
 */
exports.defaultAlertRules = [
    {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'API error rate exceeds 5%',
        condition: {
            metric: 'sonate_errors_total',
            operator: 'gt',
            threshold: 0.05,
            duration: 300, // 5 minutes
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 15,
        channels: [],
    },
    {
        id: 'redis-disconnected',
        name: 'Redis Disconnected',
        description: 'Redis cache is not available',
        condition: {
            metric: 'sonate_redis_connection_status',
            operator: 'eq',
            threshold: 0,
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 5,
        channels: [],
    },
    {
        id: 'low-cache-hit-rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate below 70%',
        condition: {
            metric: 'sonate_cache_hit_rate',
            operator: 'lt',
            threshold: 0.7,
            duration: 600, // 10 minutes
        },
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 30,
        channels: [],
    },
    {
        id: 'high-detection-latency',
        name: 'High Detection Latency',
        description: 'Average detection latency exceeds 2 seconds',
        condition: {
            metric: 'sonate_detection_duration_seconds',
            operator: 'gt',
            threshold: 2.0,
            duration: 300,
        },
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
        channels: [],
    },
    {
        id: 'security-events',
        name: 'Security Events Detected',
        description: 'Security events exceeding normal threshold',
        condition: {
            metric: 'sonate_security_events_total',
            operator: 'gt',
            threshold: 10,
            duration: 3600, // 1 hour
        },
        severity: 'high',
        enabled: true,
        cooldownMinutes: 60,
        channels: [],
    },
];
/**
 * Alert Manager Class
 */
class AlertManager {
    constructor() {
        this.rules = new Map();
        this.activeAlerts = new Map();
        this.alertHistory = [];
        // Load default rules
        exports.defaultAlertRules.forEach((rule) => this.addRule(rule));
    }
    /**
     * Add or update an alert rule
     */
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    /**
     * Remove an alert rule
     */
    removeRule(ruleId) {
        this.rules.delete(ruleId);
    }
    /**
     * Enable/disable a rule
     */
    setRuleEnabled(ruleId, enabled) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.enabled = enabled;
        }
    }
    /**
     * Evaluate all alert rules against current metrics
     */
    async evaluateAlerts(metricsData) {
        const newAlerts = [];
        for (const rule of this.rules.values()) {
            if (!rule.enabled) {
                continue;
            }
            // Check cooldown
            if (rule.lastTriggered) {
                const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000);
                if (new Date() < cooldownEnd) {
                    continue;
                }
            }
            // Evaluate condition
            if (this.evaluateCondition(rule.condition, metricsData)) {
                const alert = this.createAlert(rule);
                newAlerts.push(alert);
                this.activeAlerts.set(alert.id, alert);
                rule.lastTriggered = new Date();
            }
        }
        // Add new alerts to history
        this.alertHistory.push(...newAlerts);
        return newAlerts;
    }
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId, userId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert && !alert.acknowledged) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            return true;
        }
        return false;
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).filter((alert) => !alert.resolved);
    }
    /**
     * Get alert history
     */
    getAlertHistory(hoursBack = 24) {
        const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        return this.alertHistory.filter((alert) => alert.timestamp >= cutoff);
    }
    /**
     * Get all rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }
    // Private methods
    evaluateCondition(condition, metricsData) {
        // Find the relevant metric
        const metric = metricsData.find((m) => m.name === condition.metric && this.matchLabels(m, condition.labels));
        if (!metric) {
            return false;
        }
        // Get current value (simplified - would need more sophisticated aggregation)
        const currentValue = metric.values?.[0]?.value || 0;
        // Evaluate condition
        switch (condition.operator) {
            case 'gt':
                return currentValue > condition.threshold;
            case 'lt':
                return currentValue < condition.threshold;
            case 'eq':
                return currentValue === condition.threshold;
            case 'ne':
                return currentValue !== condition.threshold;
            case 'gte':
                return currentValue >= condition.threshold;
            case 'lte':
                return currentValue <= condition.threshold;
            default:
                return false;
        }
    }
    matchLabels(metric, labels) {
        if (!labels) {
            return true;
        }
        // Simplified label matching
        for (const [key, value] of Object.entries(labels)) {
            if (metric.labels?.[key] !== value) {
                return false;
            }
        }
        return true;
    }
    createAlert(rule) {
        return {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            timestamp: new Date(),
            severity: rule.severity,
            title: rule.name,
            description: rule.description,
            metric: rule.condition.metric,
            value: 0, // Would be populated from actual metric value
            threshold: rule.condition.threshold,
            acknowledged: false,
            resolved: false,
        };
    }
}
exports.AlertManager = AlertManager;
/**
 * Global alert manager instance
 */
exports.alertManager = new AlertManager();
//# sourceMappingURL=alerts.js.map