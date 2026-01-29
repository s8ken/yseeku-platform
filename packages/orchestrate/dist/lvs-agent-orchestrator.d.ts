/**
 * LVS-Enabled Agent Orchestrator
 * Extends agent orchestration with Linguistic Vector Steering capabilities
 */
import { LVSConfig, LVSScaffolding } from '@sonate/core';
export interface LVSAgent {
    id: string;
    name: string;
    type: 'customer-support' | 'creative-assistant' | 'technical-advisor' | 'educational-tutor' | 'custom';
    capabilities: string[];
    lvsConfig: LVSConfig;
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        version: string;
        owner: string;
    };
    performance: {
        averageR_m: number;
        totalInteractions: number;
        alertDistribution: Record<string, number>;
    };
    status: 'active' | 'inactive' | 'suspended';
}
export interface AgentRegistrationConfig {
    name: string;
    type: LVSAgent['type'];
    capabilities: string[];
    lvsScaffolding?: LVSScaffolding;
    customScaffolding?: {
        identity: string;
        principles: string[];
        constraints: string[];
        objectives: string[];
        resonanceGuidance?: string;
    };
    owner: string;
}
export interface WorkflowRoutingConfig {
    routingStrategy: 'round-robin' | 'resonance-based' | 'capability-based' | 'load-balanced';
    resonanceThreshold?: number;
    fallbackAgent?: string;
}
export interface AgentPerformanceReport {
    agentId: string;
    agentName: string;
    period: {
        start: Date;
        end: Date;
    };
    metrics: {
        totalInteractions: number;
        averageR_m: number;
        medianR_m: number;
        minR_m: number;
        maxR_m: number;
        alertDistribution: Record<string, number>;
        improvementTrend: 'improving' | 'stable' | 'declining';
    };
    topInteractions: Array<{
        timestamp: Date;
        R_m: number;
        userInput: string;
        aiResponse: string;
    }>;
    recommendations: string[];
}
export declare class LVSAgentOrchestrator {
    private agents;
    private agentCounter;
    private interactionHistory;
    /**
     * Register new LVS-enabled agent
     */
    registerAgent(config: AgentRegistrationConfig): Promise<LVSAgent>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): LVSAgent | undefined;
    /**
     * Get all agents
     */
    getAllAgents(): LVSAgent[];
    /**
     * Get agents by type
     */
    getAgentsByType(type: LVSAgent['type']): LVSAgent[];
    /**
     * Update agent LVS configuration
     */
    updateAgentLVS(agentId: string, lvsConfig: Partial<LVSConfig>): boolean;
    /**
     * Record interaction for agent
     */
    recordInteraction(agentId: string, R_m: number, alertLevel: string): void;
    /**
     * Route workflow to best agent based on strategy
     */
    routeWorkflow(requiredCapabilities: string[], routingConfig: WorkflowRoutingConfig): LVSAgent | null;
    /**
     * Route by highest resonance score
     */
    private routeByResonance;
    /**
     * Route by most specific capabilities
     */
    private routeByCapability;
    /**
     * Route by lowest load (fewest interactions)
     */
    private routeByLoad;
    /**
     * Generate performance report for agent
     */
    generatePerformanceReport(agentId: string, periodDays?: number): AgentPerformanceReport | null;
    /**
     * Generate recommendations based on performance
     */
    private generateRecommendations;
    /**
     * Deactivate agent
     */
    deactivateAgent(agentId: string): boolean;
    /**
     * Reactivate agent
     */
    reactivateAgent(agentId: string): boolean;
    /**
     * Export agent configuration
     */
    exportAgentConfig(agentId: string): string;
    /**
     * Get orchestrator statistics
     */
    getStatistics(): {
        totalAgents: number;
        activeAgents: number;
        totalInteractions: number;
        averageR_m: number;
        agentsByType: Record<string, number>;
    };
}
//# sourceMappingURL=lvs-agent-orchestrator.d.ts.map