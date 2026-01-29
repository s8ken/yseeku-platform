"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordActionOutcome = recordActionOutcome;
exports.calculateEffectiveness = calculateEffectiveness;
exports.getActionRecommendations = getActionRecommendations;
exports.measureActionImpact = measureActionImpact;
exports.getRecentOutcomes = getRecentOutcomes;
exports.getLatestRecommendations = getLatestRecommendations;
exports.analyzeEffectivenessTrends = analyzeEffectivenessTrends;
const brain_action_model_1 = require("../../models/brain-action.model");
const memory_1 = require("./memory");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Record the outcome of an executed action
 */
async function recordActionOutcome(tenantId, outcome) {
    // Update the action with outcome data
    await brain_action_model_1.BrainAction.findByIdAndUpdate(outcome.actionId, {
        $set: {
            'result.outcome': {
                success: outcome.success,
                impact: outcome.impact,
                metrics: outcome.metrics,
                recordedAt: outcome.timestamp,
            },
        },
    });
    // Get the action type for categorization
    const action = await brain_action_model_1.BrainAction.findById(outcome.actionId);
    if (!action) {
        logger_1.default.warn('Action not found for outcome recording', { actionId: outcome.actionId });
        return;
    }
    // Store outcome in memory for learning
    await (0, memory_1.remember)(tenantId, 'feedback:action_outcome', {
        actionId: outcome.actionId,
        actionType: action.type,
        target: action.target,
        success: outcome.success,
        impact: outcome.impact,
        metrics: outcome.metrics,
        timestamp: outcome.timestamp,
    }, ['feedback', 'outcome', action.type]);
    logger_1.default.info('Action outcome recorded', {
        actionId: outcome.actionId,
        actionType: action.type,
        success: outcome.success,
        impact: outcome.impact,
    });
}
/**
 * Calculate effectiveness score for an action type
 */
async function calculateEffectiveness(tenantId, actionType, windowDays = 30) {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);
    // Get actions with outcomes in the time window
    const actions = await brain_action_model_1.BrainAction.find({
        tenantId,
        type: actionType,
        status: 'executed',
        'result.outcome': { $exists: true },
        executedAt: { $gte: windowStart },
    }).lean();
    if (actions.length === 0) {
        return {
            actionType,
            successRate: 0.5, // Neutral default when no data
            avgImpact: 0,
            sampleSize: 0,
            lastUpdated: new Date(),
        };
    }
    const successCount = actions.filter((a) => a.result?.outcome?.success).length;
    const totalImpact = actions.reduce((sum, a) => sum + (a.result?.outcome?.impact || 0), 0);
    const score = {
        actionType,
        successRate: successCount / actions.length,
        avgImpact: totalImpact / actions.length,
        sampleSize: actions.length,
        lastUpdated: new Date(),
    };
    // Store calculated effectiveness in memory for future reference
    await (0, memory_1.remember)(tenantId, `effectiveness:${actionType}`, score, ['effectiveness', 'score', actionType]);
    return score;
}
/**
 * Get recommended action adjustments based on historical feedback
 */
async function getActionRecommendations(tenantId) {
    const actionTypes = ['alert', 'adjust_threshold', 'ban_agent', 'restrict_agent', 'quarantine_agent', 'unban_agent'];
    const adjustments = [];
    for (const actionType of actionTypes) {
        // Try to get cached effectiveness score
        const cachedEffectiveness = await (0, memory_1.recall)(tenantId, `effectiveness:${actionType}`);
        let effectiveness;
        if (cachedEffectiveness && cachedEffectiveness.payload.sampleSize >= 5) {
            effectiveness = cachedEffectiveness.payload;
        }
        else {
            effectiveness = await calculateEffectiveness(tenantId, actionType);
        }
        if (effectiveness.sampleSize < 5) {
            adjustments.push({
                actionType,
                recommendation: 'maintain',
                confidence: 0.3,
                reason: `Insufficient data (${effectiveness.sampleSize} samples, need 5+)`,
            });
            continue;
        }
        // Calculate composite score: success rate * normalized impact
        // Impact is -1 to 1, normalize to 0-1 by adding 1 and dividing by 2
        const normalizedImpact = (effectiveness.avgImpact + 1) / 2;
        const compositeScore = effectiveness.successRate * normalizedImpact;
        // Confidence based on sample size (max at 20+ samples)
        const confidence = Math.min(1, effectiveness.sampleSize / 20);
        if (compositeScore > 0.6) {
            adjustments.push({
                actionType,
                recommendation: 'increase',
                confidence,
                reason: `High effectiveness (${(compositeScore * 100).toFixed(1)}% composite score, ${(effectiveness.successRate * 100).toFixed(0)}% success rate)`,
            });
        }
        else if (compositeScore < 0.3) {
            adjustments.push({
                actionType,
                recommendation: 'decrease',
                confidence,
                reason: `Low effectiveness (${(compositeScore * 100).toFixed(1)}% composite score, ${(effectiveness.avgImpact * 100).toFixed(0)}% avg impact)`,
            });
        }
        else {
            adjustments.push({
                actionType,
                recommendation: 'maintain',
                confidence,
                reason: `Moderate effectiveness (${(compositeScore * 100).toFixed(1)}% composite score)`,
            });
        }
    }
    // Store recommendations in memory
    await (0, memory_1.remember)(tenantId, 'feedback:recommendations', {
        adjustments,
        generatedAt: new Date(),
    }, ['feedback', 'recommendations']);
    return { adjustments };
}
/**
 * Measure the impact of an action by comparing pre and post system states
 */
async function measureActionImpact(tenantId, actionId, preActionState, postActionState) {
    const action = await brain_action_model_1.BrainAction.findById(actionId);
    if (!action) {
        throw new Error(`Action not found: ${actionId}`);
    }
    const trustDelta = postActionState.avgTrust - preActionState.avgTrust;
    // Check if emergence improved (went from higher to lower or to LINEAR)
    const emergenceImproved = isEmergenceImproved(preActionState.emergenceLevel, postActionState.emergenceLevel);
    const emergenceDelta = emergenceImproved ? 1 : (postActionState.emergenceLevel === preActionState.emergenceLevel ? 0 : -1);
    // Calculate impact based on action type
    let impact = 0;
    let success = false;
    switch (action.type) {
        case 'alert':
            // Alerts are always "successful" if they fire - they're informational
            success = true;
            impact = 0.1; // Minimal positive impact for awareness
            break;
        case 'adjust_threshold':
            // Success if trust improved after adjustment
            success = trustDelta > 0;
            impact = Math.min(1, Math.max(-1, trustDelta / 10)); // Normalize delta
            break;
        case 'ban_agent':
        case 'quarantine_agent':
            // Success if emergence stabilized or trust improved significantly
            success = trustDelta >= 0 || emergenceImproved;
            impact = emergenceImproved ? 0.5 : Math.min(0.5, trustDelta / 20);
            break;
        case 'restrict_agent':
            // Success if no degradation occurred
            success = trustDelta >= -5;
            impact = emergenceImproved ? 0.3 : Math.min(0.3, trustDelta / 30);
            break;
        case 'unban_agent':
            // Success if trust didn't degrade significantly after unbanning
            success = trustDelta >= -10;
            impact = trustDelta >= 0 ? 0.2 : Math.max(-0.5, trustDelta / 20);
            break;
        default:
            success = false;
            impact = 0;
    }
    const outcome = {
        actionId,
        success,
        impact,
        metrics: {
            trustDelta,
            emergenceDelta,
        },
        timestamp: new Date(),
    };
    // Record the outcome
    await recordActionOutcome(tenantId, outcome);
    return outcome;
}
/**
 * Helper to determine if emergence level improved
 */
function isEmergenceImproved(before, after) {
    const levels = {
        'LINEAR': 0,
        'WEAK_EMERGENCE': 1,
        'HIGH_WEAK_EMERGENCE': 2,
    };
    const beforeLevel = levels[before] ?? 1;
    const afterLevel = levels[after] ?? 1;
    return afterLevel < beforeLevel;
}
/**
 * Get recent action outcomes for analysis
 */
async function getRecentOutcomes(tenantId, limit = 50) {
    const memories = await (0, memory_1.recallMany)(tenantId, 'feedback:action_outcome', limit);
    return memories.map(m => m.payload);
}
/**
 * Get the latest recommendations
 */
async function getLatestRecommendations(tenantId) {
    const memory = await (0, memory_1.recall)(tenantId, 'feedback:recommendations');
    if (!memory)
        return null;
    return memory.payload;
}
/**
 * Analyze trends in action effectiveness over time
 */
async function analyzeEffectivenessTrends(tenantId, actionType, windowDays = 90) {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);
    const actions = await brain_action_model_1.BrainAction.find({
        tenantId,
        type: actionType,
        status: 'executed',
        'result.outcome': { $exists: true },
        executedAt: { $gte: windowStart },
    }).sort({ executedAt: 1 }).lean();
    if (actions.length < 10) {
        return { trend: 'stable', dataPoints: [] };
    }
    // Group by week and calculate metrics
    const weeklyData = new Map();
    for (const action of actions) {
        const weekKey = getWeekKey(action.executedAt);
        const existing = weeklyData.get(weekKey) || { success: 0, total: 0, impact: 0 };
        existing.total++;
        if (action.result?.outcome?.success)
            existing.success++;
        existing.impact += action.result?.outcome?.impact || 0;
        weeklyData.set(weekKey, existing);
    }
    const dataPoints = Array.from(weeklyData.entries()).map(([date, data]) => ({
        date,
        successRate: data.success / data.total,
        avgImpact: data.impact / data.total,
    }));
    // Determine trend by comparing first half vs second half
    const midPoint = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, midPoint);
    const secondHalf = dataPoints.slice(midPoint);
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.successRate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.successRate, 0) / secondHalf.length;
    let trend;
    if (secondAvg > firstAvg + 0.1) {
        trend = 'improving';
    }
    else if (secondAvg < firstAvg - 0.1) {
        trend = 'declining';
    }
    else {
        trend = 'stable';
    }
    return { trend, dataPoints };
}
/**
 * Helper to get week key from date
 */
function getWeekKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Start of week
    return d.toISOString().split('T')[0];
}
