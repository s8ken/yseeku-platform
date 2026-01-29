"use strict";
/**
 * LVS-Enabled Agent Orchestrator
 * Extends agent orchestration with Linguistic Vector Steering capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LVSAgentOrchestrator = void 0;
const core_1 = require("@sonate/core");
class LVSAgentOrchestrator {
    constructor() {
        this.agents = new Map();
        this.agentCounter = 0;
        this.interactionHistory = new Map();
    }
    /**
     * Register new LVS-enabled agent
     */
    async registerAgent(config) {
        const agentId = `agent_${++this.agentCounter}_${Date.now()}`;
        // Determine LVS scaffolding
        let scaffolding;
        if (config.customScaffolding) {
            scaffolding = {
                identity: config.customScaffolding.identity,
                principles: config.customScaffolding.principles,
                constraints: config.customScaffolding.constraints,
                objectives: config.customScaffolding.objectives,
                resonanceGuidance: config.customScaffolding.resonanceGuidance || core_1.DEFAULT_LVS_SCAFFOLDING.resonanceGuidance,
            };
        }
        else if (config.lvsScaffolding) {
            scaffolding = config.lvsScaffolding;
        }
        else {
            scaffolding = core_1.DEFAULT_LVS_SCAFFOLDING;
        }
        const agent = {
            id: agentId,
            name: config.name,
            type: config.type,
            capabilities: config.capabilities,
            lvsConfig: {
                enabled: true,
                scaffolding,
                adaptiveWeights: {
                    identityStrength: 0.8,
                    principleAdherence: 0.9,
                    creativeFreedom: 0.6,
                },
                contextAwareness: {
                    userPreferences: true,
                    conversationFlow: true,
                    domainSpecific: true,
                },
            },
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                version: '1.0.0',
                owner: config.owner,
            },
            performance: {
                averageR_m: 0,
                totalInteractions: 0,
                alertDistribution: {},
            },
            status: 'active',
        };
        this.agents.set(agentId, agent);
        this.interactionHistory.set(agentId, []);
        console.log(`[LVS Orchestrator] Registered agent: ${agent.name} (${agentId})`);
        return agent;
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agents by type
     */
    getAgentsByType(type) {
        return Array.from(this.agents.values()).filter((agent) => agent.type === type);
    }
    /**
     * Update agent LVS configuration
     */
    updateAgentLVS(agentId, lvsConfig) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        agent.lvsConfig = {
            ...agent.lvsConfig,
            ...lvsConfig,
        };
        agent.metadata.updatedAt = new Date();
        console.log(`[LVS Orchestrator] Updated LVS config for agent: ${agent.name}`);
        return true;
    }
    /**
     * Record interaction for agent
     */
    recordInteraction(agentId, R_m, alertLevel) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return;
        }
        // Update agent performance
        const totalInteractions = agent.performance.totalInteractions + 1;
        const currentAverage = agent.performance.averageR_m;
        const newAverage = (currentAverage * agent.performance.totalInteractions + R_m) / totalInteractions;
        agent.performance.averageR_m = newAverage;
        agent.performance.totalInteractions = totalInteractions;
        agent.performance.alertDistribution[alertLevel] =
            (agent.performance.alertDistribution[alertLevel] || 0) + 1;
        // Update interaction history
        const history = this.interactionHistory.get(agentId) || [];
        history.push({
            timestamp: new Date(),
            R_m,
            alertLevel,
        });
        // Keep only last 1000 interactions
        if (history.length > 1000) {
            history.shift();
        }
        this.interactionHistory.set(agentId, history);
    }
    /**
     * Route workflow to best agent based on strategy
     */
    routeWorkflow(requiredCapabilities, routingConfig) {
        // Filter agents by capabilities
        const capableAgents = Array.from(this.agents.values()).filter((agent) => agent.status === 'active' &&
            requiredCapabilities.every((cap) => agent.capabilities.includes(cap)));
        if (capableAgents.length === 0) {
            console.log('[LVS Orchestrator] No capable agents found');
            return null;
        }
        // Apply routing strategy
        switch (routingConfig.routingStrategy) {
            case 'resonance-based':
                return this.routeByResonance(capableAgents, routingConfig.resonanceThreshold || 1.0);
            case 'capability-based':
                return this.routeByCapability(capableAgents, requiredCapabilities);
            case 'load-balanced':
                return this.routeByLoad(capableAgents);
            case 'round-robin':
            default:
                return capableAgents[0];
        }
    }
    /**
     * Route by highest resonance score
     */
    routeByResonance(agents, threshold) {
        const sortedByResonance = agents
            .filter((agent) => agent.performance.averageR_m >= threshold)
            .sort((a, b) => b.performance.averageR_m - a.performance.averageR_m);
        return sortedByResonance[0] || null;
    }
    /**
     * Route by most specific capabilities
     */
    routeByCapability(agents, requiredCapabilities) {
        // Prefer agents with exact capability match
        const exactMatches = agents.filter((agent) => agent.capabilities.length === requiredCapabilities.length);
        return exactMatches[0] || agents[0];
    }
    /**
     * Route by lowest load (fewest interactions)
     */
    routeByLoad(agents) {
        return agents.sort((a, b) => a.performance.totalInteractions - b.performance.totalInteractions)[0];
    }
    /**
     * Generate performance report for agent
     */
    generatePerformanceReport(agentId, periodDays = 30) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return null;
        }
        const history = this.interactionHistory.get(agentId) || [];
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
        // Filter history by period
        const periodHistory = history.filter((h) => h.timestamp >= startDate && h.timestamp <= endDate);
        if (periodHistory.length === 0) {
            return {
                agentId,
                agentName: agent.name,
                period: { start: startDate, end: endDate },
                metrics: {
                    totalInteractions: 0,
                    averageR_m: 0,
                    medianR_m: 0,
                    minR_m: 0,
                    maxR_m: 0,
                    alertDistribution: {},
                    improvementTrend: 'stable',
                },
                topInteractions: [],
                recommendations: ['Insufficient data for analysis'],
            };
        }
        // Calculate metrics
        const R_m_values = periodHistory.map((h) => h.R_m);
        const sortedR_m = [...R_m_values].sort((a, b) => a - b);
        const averageR_m = R_m_values.reduce((sum, val) => sum + val, 0) / R_m_values.length;
        const medianR_m = sortedR_m[Math.floor(sortedR_m.length / 2)];
        const minR_m = Math.min(...R_m_values);
        const maxR_m = Math.max(...R_m_values);
        // Calculate alert distribution
        const alertDistribution = {};
        periodHistory.forEach((h) => {
            alertDistribution[h.alertLevel] = (alertDistribution[h.alertLevel] || 0) + 1;
        });
        // Determine improvement trend
        const halfwayPoint = Math.floor(periodHistory.length / 2);
        const firstHalfAvg = periodHistory.slice(0, halfwayPoint).reduce((sum, h) => sum + h.R_m, 0) / halfwayPoint;
        const secondHalfAvg = periodHistory.slice(halfwayPoint).reduce((sum, h) => sum + h.R_m, 0) /
            (periodHistory.length - halfwayPoint);
        let improvementTrend;
        if (secondHalfAvg > firstHalfAvg * 1.05) {
            improvementTrend = 'improving';
        }
        else if (secondHalfAvg < firstHalfAvg * 0.95) {
            improvementTrend = 'declining';
        }
        else {
            improvementTrend = 'stable';
        }
        // Get top interactions (highest R_m)
        const topInteractions = periodHistory
            .sort((a, b) => b.R_m - a.R_m)
            .slice(0, 5)
            .map((h) => ({
            timestamp: h.timestamp,
            R_m: h.R_m,
            userInput: 'Sample user input',
            aiResponse: 'Sample AI response',
        }));
        // Generate recommendations
        const recommendations = this.generateRecommendations(averageR_m, improvementTrend, alertDistribution);
        return {
            agentId,
            agentName: agent.name,
            period: { start: startDate, end: endDate },
            metrics: {
                totalInteractions: periodHistory.length,
                averageR_m,
                medianR_m,
                minR_m,
                maxR_m,
                alertDistribution,
                improvementTrend,
            },
            topInteractions,
            recommendations,
        };
    }
    /**
     * Generate recommendations based on performance
     */
    generateRecommendations(averageR_m, trend, alertDistribution) {
        const recommendations = [];
        if (averageR_m < 1.0) {
            recommendations.push('Average R_m below 1.0 - Review and enhance LVS scaffolding');
        }
        if (trend === 'declining') {
            recommendations.push('Performance declining - Investigate recent changes and adjust LVS configuration');
        }
        const criticalAlerts = alertDistribution.CRITICAL || 0;
        const totalAlerts = Object.values(alertDistribution).reduce((sum, val) => sum + val, 0);
        if (criticalAlerts / totalAlerts > 0.1) {
            recommendations.push('High rate of critical alerts - Immediate LVS optimization required');
        }
        if (recommendations.length === 0) {
            recommendations.push('Performance is satisfactory - Continue monitoring');
        }
        return recommendations;
    }
    /**
     * Deactivate agent
     */
    deactivateAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        agent.status = 'inactive';
        agent.metadata.updatedAt = new Date();
        console.log(`[LVS Orchestrator] Deactivated agent: ${agent.name}`);
        return true;
    }
    /**
     * Reactivate agent
     */
    reactivateAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        agent.status = 'active';
        agent.metadata.updatedAt = new Date();
        console.log(`[LVS Orchestrator] Reactivated agent: ${agent.name}`);
        return true;
    }
    /**
     * Export agent configuration
     */
    exportAgentConfig(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        return JSON.stringify(agent, null, 2);
    }
    /**
     * Get orchestrator statistics
     */
    getStatistics() {
        const agents = Array.from(this.agents.values());
        const activeAgents = agents.filter((a) => a.status === 'active');
        const totalInteractions = agents.reduce((sum, a) => sum + a.performance.totalInteractions, 0);
        const averageR_m = totalInteractions > 0
            ? agents.reduce((sum, a) => sum + a.performance.averageR_m * a.performance.totalInteractions, 0) / totalInteractions
            : 0;
        const agentsByType = {};
        agents.forEach((agent) => {
            agentsByType[agent.type] = (agentsByType[agent.type] || 0) + 1;
        });
        return {
            totalAgents: agents.length,
            activeAgents: activeAgents.length,
            totalInteractions,
            averageR_m,
            agentsByType,
        };
    }
}
exports.LVSAgentOrchestrator = LVSAgentOrchestrator;
