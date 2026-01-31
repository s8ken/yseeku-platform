export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'suspended';
    trust_score: number;
    sonate_dimensions: {
        /** @deprecated v2.0.1 - RealityIndex calculator was removed (always 0) */
        reality_index: number;
        trust_protocol: string;
        ethical_alignment: number;
        resonance_quality: string;
        /** @deprecated v2.0.1 - CanvasParity calculator was removed (always 0) */
        canvas_parity: number;
    };
    last_interaction: Date;
    interaction_count: number;
    tenant_id: string | null;
    created_at: Date;
}
export interface CreateAgentInput {
    name: string;
    type?: string;
    tenant_id?: string;
}
export declare function createAgent(input: CreateAgentInput): Promise<Agent | null>;
export declare function getAgents(tenantId?: string): Promise<Agent[]>;
export declare function getAgentById(id: string): Promise<Agent | null>;
export declare function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null>;
export declare function deleteAgent(id: string): Promise<boolean>;
export declare function recordInteraction(agentId: string, sonateDimensions?: Agent['sonate_dimensions']): Promise<void>;
