/**
 * Enhanced Agent Factory - Production Ready
 * Provides enterprise-grade agent management with W3C DID/VC integration
 */
export interface AgentConfig {
    type: string;
    description?: string;
    maxConcurrentTasks?: number;
    timeoutMs?: number;
    metadata?: Record<string, any>;
}
export interface Agent {
    id: string;
    config: AgentConfig;
    status: 'active' | 'inactive' | 'suspended';
    createdAt: Date;
    lastActivity: Date;
    performance: {
        totalTasks: number;
        averageResponseTime: number;
        successRate: number;
    };
    metadata: {
        trustArticles?: string[];
        [key: string]: any;
    };
}
export interface AgentTemplate {
    type: string;
    description: string;
    defaultCapabilities: string[];
    defaultPermissions: string[];
    requiredConfig: string[];
    trustArticles: string[];
}
/**
 * Enhanced Agent Factory with enterprise features
 */
export declare class EnhancedAgentFactory {
    private agents;
    private templates;
    private logger;
    constructor();
    private initializeTemplates;
    /**
     * Create a new agent with enhanced configuration
     */
    createAgent(config: AgentConfig): Promise<Agent>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Agent | undefined;
    /**
     * List all agents
     */
    listAgents(): Agent[];
    /**
     * List agents by type
     */
    listAgentsByType(typeId: string): Agent[];
    /**
     * Update agent configuration
     */
    updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<Agent>;
    /**
     * Delete agent
     */
    deleteAgent(agentId: string): Promise<void>;
    /**
     * Update agent performance metrics
     */
    updateAgentPerformance(agentId: string, metrics: {
        tasksCompleted?: number;
        responseTime?: number;
        success?: boolean;
    }): Promise<void>;
    /**
     * Generate trust receipt for agent operation
     */
    generateTrustReceipt(agentId: string, operation: string): Promise<void>;
    /**
     * Calculate agent trust score
     */
    private calculateAgentTrustScore;
}
/**
 * Factory function to create enhanced agent factory
 */
export declare function createEnhancedAgentFactory(): EnhancedAgentFactory;
export default EnhancedAgentFactory;
//# sourceMappingURL=enhanced-agent-factory.d.ts.map