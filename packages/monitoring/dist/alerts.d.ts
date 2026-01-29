/**
 * Alerting System for SONATE Monitoring
 * Configurable alerts for system health and performance
 */
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    condition: AlertCondition;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldownMinutes: number;
    lastTriggered?: Date;
    channels: AlertChannel[];
}
export interface AlertCondition {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    threshold: number;
    duration?: number;
    labels?: Record<string, string>;
}
export interface AlertChannel {
    type: 'email' | 'slack' | 'webhook' | 'pagerduty';
    config: Record<string, any>;
}
export interface Alert {
    id: string;
    ruleId: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    metric: string;
    value: number;
    threshold: number;
    acknowledged: boolean;
    resolved: boolean;
    resolvedAt?: Date;
}
/**
 * Pre-configured alert rules for SONATE
 */
export declare const defaultAlertRules: AlertRule[];
/**
 * Alert Manager Class
 */
export declare class AlertManager {
    private rules;
    private activeAlerts;
    private alertHistory;
    constructor();
    /**
     * Add or update an alert rule
     */
    addRule(rule: AlertRule): void;
    /**
     * Remove an alert rule
     */
    removeRule(ruleId: string): void;
    /**
     * Enable/disable a rule
     */
    setRuleEnabled(ruleId: string, enabled: boolean): void;
    /**
     * Evaluate all alert rules against current metrics
     */
    evaluateAlerts(metricsData: any[]): Promise<Alert[]>;
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string, userId: string): boolean;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): boolean;
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get alert history
     */
    getAlertHistory(hoursBack?: number): Alert[];
    /**
     * Get all rules
     */
    getRules(): AlertRule[];
    private evaluateCondition;
    private matchLabels;
    private createAlert;
}
/**
 * Global alert manager instance
 */
export declare const alertManager: AlertManager;
//# sourceMappingURL=alerts.d.ts.map