"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeContext = analyzeContext;
exports.analyzeContextLegacy = analyzeContextLegacy;
/**
 * Analyze the current system context with comprehensive metrics
 */
function analyzeContext(input) {
    const observations = [];
    const anomalies = [];
    let riskScore = 0;
    const trust = input.avgTrust;
    const emergence = input.bedau?.emergence_type || 'LINEAR';
    const trend = input.trustTrend;
    // 1. Trust Level Analysis
    if (trust < 50) {
        observations.push('critical_trust_level');
        riskScore += 30;
        anomalies.push({
            type: 'trust_critical',
            severity: 'high',
            value: trust,
            threshold: 50,
            description: `Trust score critically low at ${trust}%`,
        });
    }
    else if (trust < 70) {
        observations.push('low_trust');
        riskScore += 15;
    }
    else if (trust < 80) {
        observations.push('moderate_trust');
        riskScore += 5;
    }
    // 2. Statistical Anomaly Detection (Z-Score)
    const trustZScore = input.historicalStd > 0
        ? (trust - input.historicalMean) / input.historicalStd
        : 0;
    if (trustZScore < -2) {
        observations.push('statistical_anomaly');
        riskScore += 20;
        anomalies.push({
            type: 'zscore_anomaly',
            severity: 'high',
            value: trustZScore,
            threshold: -2,
            description: `Trust ${Math.abs(trustZScore).toFixed(1)} std devs below mean`,
        });
    }
    else if (trustZScore < -1.5) {
        observations.push('trust_below_normal');
        riskScore += 10;
    }
    // 3. Emergence Analysis
    if (emergence === 'HIGH_WEAK_EMERGENCE') {
        observations.push('high_emergence_detected');
        riskScore += 25;
        anomalies.push({
            type: 'emergence_high',
            severity: 'high',
            value: 1,
            threshold: 0,
            description: 'High weak emergence detected - system behavior diverging',
        });
    }
    else if (emergence === 'WEAK_EMERGENCE') {
        observations.push('emergence_detected');
        riskScore += 10;
    }
    // 4. Trend Analysis
    if (trend.direction === 'declining') {
        observations.push('declining_trend');
        riskScore += 15;
        if (trend.slope < -1) {
            observations.push('rapid_decline');
            riskScore += 10;
            anomalies.push({
                type: 'rapid_decline',
                severity: 'medium',
                value: trend.slope,
                threshold: -1,
                description: `Trust declining rapidly (slope: ${trend.slope.toFixed(2)})`,
            });
        }
    }
    else if (trend.direction === 'improving') {
        observations.push('improving_trend');
        riskScore -= 5; // Reduce risk for positive trend
    }
    // 5. Volatility Analysis
    if (trend.volatility > 10) {
        observations.push('high_volatility');
        riskScore += 10;
        anomalies.push({
            type: 'volatility',
            severity: 'medium',
            value: trend.volatility,
            threshold: 10,
            description: `High trust volatility: ${trend.volatility.toFixed(1)}`,
        });
    }
    // 6. Agent Health Analysis
    if (input.agentHealth.banned > 0) {
        observations.push('agents_banned');
        riskScore += 5 * input.agentHealth.banned;
    }
    if (input.agentHealth.quarantined > 0) {
        observations.push('agents_quarantined');
        riskScore += 10 * input.agentHealth.quarantined;
    }
    if (input.agentHealth.total > 0 && input.agentHealth.banned / input.agentHealth.total > 0.2) {
        observations.push('high_ban_ratio');
        riskScore += 15;
    }
    // 7. Alert Analysis
    if (input.activeAlerts.critical > 0) {
        observations.push('critical_alerts_active');
        riskScore += 15 * input.activeAlerts.critical;
    }
    if (input.activeAlerts.unacknowledged > 5) {
        observations.push('many_unacknowledged_alerts');
        riskScore += 10;
    }
    // 8. Temporal Context (reduce sensitivity during off-hours)
    if (!input.isBusinessHours && riskScore > 0) {
        riskScore = Math.round(riskScore * 0.8); // 20% reduction during off-hours
    }
    // Clamp risk score
    riskScore = Math.max(0, Math.min(100, riskScore));
    // Determine overall status
    let status;
    if (riskScore >= 50 || anomalies.some(a => a.severity === 'high')) {
        status = 'critical';
    }
    else if (riskScore >= 25 || anomalies.length > 0) {
        status = 'warning';
    }
    else {
        status = 'healthy';
    }
    // Determine urgency
    let urgency;
    if (riskScore >= 70 || anomalies.filter(a => a.severity === 'high').length >= 2) {
        urgency = 'immediate';
    }
    else if (riskScore >= 50) {
        urgency = 'high';
    }
    else if (riskScore >= 25) {
        urgency = 'medium';
    }
    else {
        urgency = 'low';
    }
    return {
        status,
        observations,
        riskScore,
        anomalies,
        urgency,
        context: {
            trustZScore,
            emergenceLevel: emergence,
            trendDirection: trend.direction,
            hasActiveAlerts: input.activeAlerts.total > 0,
            hasBannedAgents: input.agentHealth.banned > 0,
        },
    };
}
/**
 * Legacy function for backward compatibility
 * @deprecated Use analyzeContext with full SensorData instead
 */
function analyzeContextLegacy(input) {
    const observations = [];
    const trust = input.avgTrust;
    const emergence = input.bedau?.emergence_type || 'LINEAR';
    if (trust < 70)
        observations.push('low_trust');
    if (emergence !== 'LINEAR')
        observations.push('emergence_detected');
    const status = trust < 60 || emergence === 'HIGH_WEAK_EMERGENCE' ? 'critical' : trust < 75 || emergence === 'WEAK_EMERGENCE' ? 'warning' : 'healthy';
    return { status, observations };
}
