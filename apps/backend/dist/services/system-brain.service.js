"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemBrain = exports.SystemBrainService = void 0;
const agent_model_1 = require("../models/agent.model");
const llm_service_1 = require("./llm.service");
const logger_1 = __importDefault(require("../utils/logger"));
const brain_cycle_model_1 = require("../models/brain-cycle.model");
const sensors_1 = require("./brain/sensors");
const analyzer_1 = require("./brain/analyzer");
const planner_1 = require("./brain/planner");
const executor_1 = require("./brain/executor");
const metrics_1 = require("../observability/metrics");
const feedback_1 = require("./brain/feedback");
const memory_1 = require("./brain/memory");
const error_utils_1 = require("../utils/error-utils");
class SystemBrainService {
    constructor() {
        this.brainAgentId = null;
        this.isThinking = false;
        this.lastRecommendationUpdate = null;
    }
    static getInstance() {
        if (!SystemBrainService.instance) {
            SystemBrainService.instance = new SystemBrainService();
        }
        return SystemBrainService.instance;
    }
    /**
     * Initialize or retrieve the System Brain agent
     */
    async initialize(tenantId, userId) {
        const existingBrain = await agent_model_1.Agent.findOne({
            'metadata.role': 'system-brain',
            ciModel: 'system-brain'
        });
        if (existingBrain) {
            this.brainAgentId = existingBrain._id.toString();
            return existingBrain;
        }
        // Use provided userId or fallback to a placeholder (though system should always provide one)
        const ownerId = userId || '000000000000000000000000';
        // Create new Brain Agent with enhanced system prompt
        const brain = await agent_model_1.Agent.create({
            name: 'YSEEKU Overseer',
            description: 'Autonomous System Governance Agent',
            user: ownerId,
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            apiKeyId: ownerId,
            systemPrompt: this.getSystemPrompt(),
            temperature: 0.1, // High precision
            ciModel: 'system-brain',
            metadata: {
                role: 'system-brain',
                permissions: ['read_logs', 'manage_agents', 'system_alert']
            }
        });
        this.brainAgentId = brain._id.toString();
        logger_1.default.info('System Brain Agent initialized', { agentId: this.brainAgentId });
        return brain;
    }
    /**
     * Get the system prompt for the Overseer
     */
    getSystemPrompt() {
        return `You are the Overseer of the YSEEKU Platform - an autonomous AI governance system.

Your role is to analyze system health, trust metrics, emergence patterns, and agent behavior to maintain platform safety.

## Input Context
You will receive:
1. Trust metrics (current score, historical mean, standard deviation, trends)
2. Bedau Index (emergence detection: LINEAR, WEAK_EMERGENCE, HIGH_WEAK_EMERGENCE)
3. Agent health (total, active, banned, restricted, quarantined counts)
4. Active alerts (critical, warning, unacknowledged counts)
5. Risk analysis (risk score 0-100, anomalies detected, urgency level)
6. Action recommendations (historical effectiveness of action types)

## Your Analysis
Consider:
- Is the current state normal or anomalous?
- Are there patterns requiring intervention?
- What is the predicted trajectory if no action is taken?
- Which actions have been effective historically?

## Output Format
Respond with valid JSON only:
{
  "status": "healthy" | "warning" | "critical",
  "reasoning": "Brief explanation of your analysis",
  "observations": ["key observation 1", "key observation 2"],
  "actions": [
    {
      "type": "alert" | "adjust_threshold" | "ban_agent" | "restrict_agent" | "quarantine_agent" | "unban_agent",
      "target": "system" | "agent_id" | "trust",
      "reason": "Why this action is needed",
      "severity": "low" | "medium" | "high" | "critical",
      "priority": "low" | "medium" | "high" | "critical"
    }
  ],
  "confidence": 0.0-1.0
}

## Action Guidelines
- "alert": Notify operators of conditions requiring attention
- "adjust_threshold": Modify trust thresholds (use sparingly, check historical effectiveness)
- "ban_agent": Completely disable an agent (requires strong justification)
- "restrict_agent": Limit agent capabilities without full ban
- "quarantine_agent": Isolate agent for review (critical severity)
- "unban_agent": Restore a previously banned agent

## Safety Constraints
- Never recommend banning without specific evidence and reason
- Prefer alerts over enforcement actions when uncertain
- Consider historical action effectiveness before recommending
- If system is healthy with stable trends, recommend no actions`;
    }
    /**
     * Run a "Thinking Cycle" - The Brain reviews the system state
     */
    async think(tenantId, mode = 'advisory') {
        if (this.isThinking || !this.brainAgentId)
            return;
        this.isThinking = true;
        try {
            const start = Date.now();
            // 1. Gather comprehensive sensor data
            const sensors = await (0, sensors_1.gatherSensors)(tenantId);
            const preActionState = {
                avgTrust: sensors.avgTrust,
                emergenceLevel: sensors.bedau?.emergence_type || 'LINEAR',
            };
            // 2. Analyze context with enhanced analyzer
            const analysis = (0, analyzer_1.analyzeContext)(sensors);
            // 3. Get historical recommendations
            const recommendations = await (0, feedback_1.getLatestRecommendations)(tenantId);
            // 4. Plan initial actions based on analysis
            const planningContext = {
                analysis,
                sensors,
                recommendations: recommendations?.adjustments,
            };
            const plannedActions = await (0, planner_1.planActions)(planningContext);
            // 5. Create cycle record
            const cycle = await brain_cycle_model_1.BrainCycle.create({
                tenantId,
                mode,
                status: 'started',
                observations: analysis.observations,
                actions: plannedActions.map(a => ({
                    type: a.type,
                    target: a.target,
                    reason: a.reason,
                    status: 'planned'
                })),
                inputContext: {
                    avgTrust: sensors.avgTrust,
                    riskScore: analysis.riskScore,
                    urgency: analysis.urgency,
                    anomalyCount: analysis.anomalies.length,
                    agentHealth: sensors.agentHealth,
                    activeAlerts: sensors.activeAlerts,
                },
                metrics: {
                    avgTrust: sensors.avgTrust,
                },
                startedAt: new Date()
            });
            // 6. Get LLM analysis for enhanced decision making
            const brainAgent = await agent_model_1.Agent.findById(this.brainAgentId);
            if (!brainAgent)
                throw new Error('Brain agent not found');
            const llmContext = this.buildLLMContext(sensors, analysis, recommendations);
            let llmResponse = null;
            let finalActions = plannedActions;
            try {
                const response = await llm_service_1.llmService.generate({
                    provider: brainAgent.provider,
                    model: brainAgent.model,
                    messages: [
                        { role: 'system', content: brainAgent.systemPrompt },
                        { role: 'user', content: `Analyze current system state:\n${JSON.stringify(llmContext, null, 2)}` }
                    ],
                    temperature: brainAgent.temperature,
                    userId: brainAgent.user.toString()
                });
                // Parse LLM response
                llmResponse = this.parseLLMResponse(response.content);
                if (llmResponse) {
                    // Merge LLM actions with planned actions
                    finalActions = this.mergeActions(plannedActions, llmResponse.actions, analysis);
                    // Store LLM reasoning in memory for learning
                    await (0, memory_1.remember)(tenantId, 'llm:reasoning', {
                        cycleId: cycle._id.toString(),
                        reasoning: llmResponse.reasoning,
                        confidence: llmResponse.confidence,
                        status: llmResponse.status,
                        timestamp: new Date(),
                    }, ['llm', 'reasoning', llmResponse.status]);
                }
            }
            catch (llmError) {
                logger_1.default.warn('LLM analysis failed, using rule-based actions', {
                    error: (0, error_utils_1.getErrorMessage)(llmError),
                });
                // Continue with rule-based planned actions
            }
            // 7. Execute actions
            const execResults = await (0, executor_1.executeActions)(tenantId, cycle._id.toString(), finalActions.map(a => ({
                type: a.type,
                target: a.target,
                reason: a.reason,
                severity: a.severity,
            })), mode);
            // 8. Measure action impact (for enforced mode with executed actions)
            if (mode === 'enforced' && execResults.length > 0) {
                await this.measureAndRecordImpact(tenantId, execResults, preActionState);
                await this.maybeUpdateRecommendations(tenantId);
            }
            // 9. Complete the cycle
            const durationSeconds = (Date.now() - start) / 1000;
            await brain_cycle_model_1.BrainCycle.findByIdAndUpdate(cycle._id, {
                status: 'completed',
                llmOutput: llmResponse ? JSON.stringify(llmResponse) : undefined,
                thought: llmResponse?.reasoning,
                metrics: {
                    durationMs: durationSeconds * 1000,
                    avgTrust: sensors.avgTrust,
                    alertsProcessed: sensors.activeAlerts.total,
                    actionsPlanned: finalActions.length,
                    agentCount: sensors.agentHealth.total,
                },
                completedAt: new Date()
            });
            metrics_1.brainCyclesTotal.inc({ status: 'completed' });
            metrics_1.brainCycleDurationSeconds.observe(durationSeconds);
            logger_1.default.info('Brain thinking cycle completed', {
                tenantId,
                mode,
                riskScore: analysis.riskScore,
                urgency: analysis.urgency,
                actionsPlanned: finalActions.length,
                actionsExecuted: execResults.filter(r => r.status === 'executed').length,
                llmUsed: !!llmResponse,
                durationMs: durationSeconds * 1000,
            });
        }
        catch (error) {
            logger_1.default.error('System Brain thinking error', { error: (0, error_utils_1.getErrorMessage)(error) });
            metrics_1.brainCyclesTotal.inc({ status: 'failed' });
        }
        finally {
            this.isThinking = false;
        }
    }
    /**
     * Build context object for LLM analysis
     */
    buildLLMContext(sensors, analysis, recommendations) {
        return {
            // Trust metrics
            trust: {
                current: sensors.avgTrust,
                historicalMean: Math.round(sensors.historicalMean * 10) / 10,
                historicalStd: Math.round(sensors.historicalStd * 10) / 10,
                zScore: Math.round(analysis.context.trustZScore * 100) / 100,
                trend: sensors.trustTrend,
            },
            // Emergence
            emergence: {
                level: sensors.bedau?.emergence_type || 'LINEAR',
                bedauScore: sensors.bedau?.bedau_score,
            },
            // Risk analysis
            risk: {
                score: analysis.riskScore,
                status: analysis.status,
                urgency: analysis.urgency,
                anomalies: analysis.anomalies.map(a => ({
                    type: a.type,
                    severity: a.severity,
                    description: a.description,
                })),
            },
            // Agent health
            agents: sensors.agentHealth,
            // Alerts
            alerts: sensors.activeAlerts,
            // Historical effectiveness
            recommendations: recommendations?.adjustments?.slice(0, 5) || [],
            // Temporal context
            temporal: {
                timestamp: sensors.timestamp.toISOString(),
                isBusinessHours: sensors.isBusinessHours,
                hourOfDay: sensors.hourOfDay,
            },
        };
    }
    /**
     * Parse LLM response into structured format
     */
    parseLLMResponse(content) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger_1.default.warn('No JSON found in LLM response');
                return null;
            }
            const parsed = JSON.parse(jsonMatch[0]);
            // Validate required fields
            if (!parsed.status || !Array.isArray(parsed.actions)) {
                logger_1.default.warn('Invalid LLM response structure');
                return null;
            }
            return {
                status: parsed.status,
                reasoning: parsed.reasoning || '',
                observations: parsed.observations || [],
                actions: parsed.actions.map((a) => ({
                    type: a.type || 'alert',
                    target: a.target || 'system',
                    reason: a.reason || 'LLM recommended',
                    severity: a.severity || 'medium',
                    priority: a.priority || 'medium',
                })),
                confidence: parsed.confidence || 0.7,
            };
        }
        catch (error) {
            logger_1.default.warn('Failed to parse LLM response', { error: (0, error_utils_1.getErrorMessage)(error) });
            return null;
        }
    }
    /**
     * Merge rule-based planned actions with LLM recommendations
     */
    mergeActions(planned, llmActions, analysis) {
        const merged = [...planned];
        // Add LLM actions that don't duplicate planned ones
        for (const llmAction of llmActions) {
            const isDuplicate = planned.some(p => p.type === llmAction.type && p.target === llmAction.target);
            if (!isDuplicate) {
                // Validate LLM action type
                const validTypes = ['alert', 'adjust_threshold', 'ban_agent', 'restrict_agent', 'quarantine_agent', 'unban_agent'];
                if (!validTypes.includes(llmAction.type)) {
                    logger_1.default.warn('Invalid LLM action type', { type: llmAction.type });
                    continue;
                }
                // Don't add enforcement actions in low-risk situations
                const isEnforcementAction = ['ban_agent', 'restrict_agent', 'quarantine_agent'].includes(llmAction.type);
                if (isEnforcementAction && analysis.riskScore < 50) {
                    logger_1.default.info('Skipping LLM enforcement action due to low risk', {
                        type: llmAction.type,
                        riskScore: analysis.riskScore,
                    });
                    continue;
                }
                merged.push({
                    type: llmAction.type,
                    target: llmAction.target,
                    reason: `[LLM] ${llmAction.reason}`,
                    priority: (llmAction.priority || 'medium'),
                    confidence: 0.7, // LLM actions get moderate confidence
                    severity: llmAction.severity,
                });
            }
        }
        // Sort by priority and limit
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        merged.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        return merged.slice(0, 5); // Max 5 actions per cycle
    }
    /**
     * Measure and record the impact of executed actions
     */
    async measureAndRecordImpact(tenantId, execResults, preActionState) {
        try {
            // Re-gather sensors to get post-action state
            const postSensors = await (0, sensors_1.gatherSensors)(tenantId);
            const postActionState = {
                avgTrust: postSensors.avgTrust,
                emergenceLevel: postSensors.bedau?.emergence_type || 'LINEAR',
            };
            // Measure impact for each executed action
            for (const result of execResults) {
                if (result.status === 'executed') {
                    try {
                        await (0, feedback_1.measureActionImpact)(tenantId, result.id, preActionState, postActionState);
                    }
                    catch (impactError) {
                        logger_1.default.warn('Failed to measure action impact', {
                            actionId: result.id,
                            error: impactError.message,
                        });
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('Failed to measure action impacts', { error: (0, error_utils_1.getErrorMessage)(error) });
        }
    }
    /**
     * Update action recommendations periodically
     */
    async maybeUpdateRecommendations(tenantId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (!this.lastRecommendationUpdate || this.lastRecommendationUpdate < oneHourAgo) {
            try {
                await (0, feedback_1.getActionRecommendations)(tenantId);
                this.lastRecommendationUpdate = new Date();
                logger_1.default.info('Action recommendations updated', { tenantId });
            }
            catch (error) {
                logger_1.default.warn('Failed to update recommendations', { error: (0, error_utils_1.getErrorMessage)(error) });
            }
        }
    }
    /**
     * Get the current brain agent ID
     */
    getBrainAgentId() {
        return this.brainAgentId;
    }
    /**
     * Check if the brain is currently thinking
     */
    isCurrentlyThinking() {
        return this.isThinking;
    }
}
exports.SystemBrainService = SystemBrainService;
exports.systemBrain = SystemBrainService.getInstance();
