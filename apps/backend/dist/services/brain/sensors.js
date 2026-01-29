"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatherSensors = gatherSensors;
const bedau_service_1 = require("../bedau.service");
const trust_receipt_model_1 = require("../../models/trust-receipt.model");
const agent_model_1 = require("../../models/agent.model");
const conversation_model_1 = require("../../models/conversation.model");
const alerts_service_1 = require("../alerts.service");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Gather comprehensive sensor data for the Overseer brain
 */
async function gatherSensors(tenantId) {
    const timestamp = new Date();
    // 1. Core metrics (existing)
    const bedau = await bedau_service_1.bedauService.getMetrics(tenantId);
    const receipts = await trust_receipt_model_1.TrustReceiptModel.find({ tenant_id: tenantId })
        .sort({ timestamp: -1 })
        .limit(100) // Increased for trend analysis
        .select('ciq_metrics timestamp')
        .lean();
    // 2. Calculate trust metrics with history
    const trustScores = receipts.map((r) => {
        const ciq = r.ciq_metrics || {};
        return ((ciq.quality || 0) + (ciq.integrity || 0) + (ciq.clarity || 0)) / 3;
    });
    const avgTrust = trustScores.length > 0
        ? Math.round(trustScores.reduce((s, v) => s + v, 0) / trustScores.length)
        : 85;
    // 3. Historical statistics
    const historicalMean = calculateMean(trustScores);
    const historicalStd = calculateStd(trustScores, historicalMean);
    // 4. Trend analysis
    const trustTrend = analyzeTrend(trustScores);
    // 5. Agent health
    const agentHealth = await gatherAgentHealth(tenantId);
    // 6. Active alerts
    const activeAlerts = await gatherAlertSummary(tenantId);
    // 7. Temporal context
    const hourOfDay = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5;
    return {
        bedau,
        avgTrust,
        receipts: receipts.slice(0, 50), // Return recent 50 for context
        trustTrend,
        trustHistory: trustScores.slice(0, 20),
        historicalMean,
        historicalStd,
        agentHealth,
        activeAlerts,
        timestamp,
        hourOfDay,
        isBusinessHours,
    };
}
/**
 * Gather agent health summary
 */
async function gatherAgentHealth(tenantId) {
    try {
        const agents = await agent_model_1.Agent.find({}).lean();
        // Filter by tenant if multi-tenant
        const tenantAgents = agents; // TODO: Add tenant filtering when agent model supports it
        const banned = tenantAgents.filter((a) => a.banStatus?.isBanned);
        const restricted = tenantAgents.filter((a) => a.banStatus?.restrictions && a.banStatus.restrictions.length > 0 && !a.banStatus?.isBanned);
        const quarantined = tenantAgents.filter((a) => a.banStatus?.severity === 'critical' && a.banStatus?.isBanned);
        // Calculate average agent trust from recent conversations
        let avgAgentTrust = 85; // Default baseline
        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const agentIds = tenantAgents.map((a) => a._id);
            if (agentIds.length > 0) {
                const trustAggregation = await conversation_model_1.Conversation.aggregate([
                    {
                        $match: {
                            agents: { $in: agentIds },
                            lastActivity: { $gte: oneWeekAgo }
                        }
                    },
                    { $unwind: '$messages' },
                    {
                        $group: {
                            _id: null,
                            avgTrust: { $avg: '$messages.trustScore' },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                if (trustAggregation.length > 0 && trustAggregation[0].count > 0) {
                    // Convert 0-5 scale to 0-100 scale (multiply by 20)
                    avgAgentTrust = Math.round(trustAggregation[0].avgTrust * 20);
                }
            }
        }
        catch (trustError) {
            logger_1.default.warn('Failed to calculate avg agent trust, using baseline', { error: trustError });
        }
        return {
            total: tenantAgents.length,
            active: tenantAgents.length - banned.length,
            banned: banned.length,
            restricted: restricted.length,
            quarantined: quarantined.length,
            avgAgentTrust,
        };
    }
    catch (error) {
        logger_1.default.warn('Failed to gather agent health', { error });
        return {
            total: 0,
            active: 0,
            banned: 0,
            restricted: 0,
            quarantined: 0,
            avgAgentTrust: 85,
        };
    }
}
/**
 * Gather alert summary
 */
async function gatherAlertSummary(tenantId) {
    try {
        const alerts = await alerts_service_1.alertsService.list(tenantId, {
            status: 'active',
            limit: 100,
        });
        const alertList = Array.isArray(alerts) ? alerts : alerts?.data || [];
        return {
            total: alertList.length,
            critical: alertList.filter((a) => a.severity === 'critical').length,
            warning: alertList.filter((a) => a.severity === 'warning').length,
            unacknowledged: alertList.filter((a) => !a.acknowledged).length,
        };
    }
    catch (error) {
        logger_1.default.warn('Failed to gather alert summary', { error });
        return {
            total: 0,
            critical: 0,
            warning: 0,
            unacknowledged: 0,
        };
    }
}
/**
 * Analyze trend in trust scores
 */
function analyzeTrend(scores) {
    if (scores.length < 3) {
        return { direction: 'stable', slope: 0, volatility: 0, recentChange: 0 };
    }
    // Calculate slope using simple linear regression
    const n = Math.min(scores.length, 20);
    const recentScores = scores.slice(0, n);
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += recentScores[i];
        sumXY += i * recentScores[i];
        sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    // Calculate volatility (standard deviation of differences)
    const diffs = [];
    for (let i = 1; i < recentScores.length; i++) {
        diffs.push(Math.abs(recentScores[i] - recentScores[i - 1]));
    }
    const volatility = diffs.length > 0
        ? Math.sqrt(diffs.reduce((s, d) => s + d * d, 0) / diffs.length)
        : 0;
    // Recent change (last 5 vs previous 5)
    const recent5 = recentScores.slice(0, 5);
    const prev5 = recentScores.slice(5, 10);
    const recentAvg = recent5.length > 0 ? recent5.reduce((s, v) => s + v, 0) / recent5.length : 0;
    const prevAvg = prev5.length > 0 ? prev5.reduce((s, v) => s + v, 0) / prev5.length : recentAvg;
    const recentChange = recentAvg - prevAvg;
    // Determine direction
    let direction;
    if (slope > 0.5) {
        direction = 'improving';
    }
    else if (slope < -0.5) {
        direction = 'declining';
    }
    else {
        direction = 'stable';
    }
    return { direction, slope, volatility, recentChange };
}
/**
 * Calculate mean of array
 */
function calculateMean(arr) {
    if (arr.length === 0)
        return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}
/**
 * Calculate standard deviation
 */
function calculateStd(arr, mean) {
    if (arr.length < 2)
        return 0;
    const squaredDiffs = arr.map(v => (v - mean) ** 2);
    return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / arr.length);
}
