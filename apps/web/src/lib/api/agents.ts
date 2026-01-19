/**
 * Agents API
 */

import { fetchAPI } from './client';

export type BanSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BanStatus = 'active' | 'unbanned' | 'expired' | 'none';

export interface BanDetails {
  bannedAt: string;
  bannedBy: string;
  reason: string;
  severity: BanSeverity;
  expiresAt?: string;
  restrictions?: string[];
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  trustScore: number;
  symbiDimensions: {
    realityIndex: number;
    trustProtocol: number;
    ethicalAlignment: number;
    resonanceQuality: number;
    canvasParity: number;
  };
  lastInteraction: string;
  interactionCount: number;
  tenantId: string;
  createdAt: string;
  banStatus?: BanStatus;
  banReason?: string;
  banDetails?: BanDetails;
  restrictedFeatures?: string[];
  did?: string;
  didDocument?: string;
}

export interface AgentsResponse {
  success: boolean;
  data: {
    agents: Agent[];
    summary: {
      total: number;
      active: number;
      inactive: number;
      avgTrustScore: number;
    };
  };
  source: string;
}

export const agentsApi = {
  async getAgents(tenant?: string, status?: string): Promise<AgentsResponse> {
    const params = new URLSearchParams();
    if (tenant) params.set('tenant', tenant);
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<AgentsResponse>(`/api/agents${query}`);
  },

  async getAgent(id: string): Promise<Agent> {
    const res = await fetchAPI<{ success: boolean; data: { agent: Agent } }>(`/api/agents/${id}`);
    return res.data.agent;
  },

  async createAgent(data: {
    name: string;
    description?: string;
    provider: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    isPublic?: boolean;
    apiKeyId?: string;
  }): Promise<Agent> {
    const res = await fetchAPI<{ success: boolean; data: { agent: Agent } }>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data.agent;
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const res = await fetchAPI<{ success: boolean; data: { agent: Agent } }>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data.agent;
  },

  async deleteAgent(id: string): Promise<void> {
    await fetchAPI(`/api/agents/${id}`, { method: 'DELETE' });
  },

  async banAgent(agentId: string, reason: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${agentId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async unbanAgent(agentId: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${agentId}/unban`, {
      method: 'POST',
    });
  },

  async getAgentDID(agentId: string): Promise<{ did: string; document: unknown }> {
    const res = await fetchAPI<{ success: boolean; data: { did: string; document: unknown } }>(
      `/api/agents/${agentId}/did`
    );
    return res.data;
  },

  async provisionAgentDID(agentId: string): Promise<{ did: string }> {
    const res = await fetchAPI<{ success: boolean; data: { did: string } }>(
      `/api/agents/${agentId}/did`,
      { method: 'POST' }
    );
    return res.data;
  },
};

export default agentsApi;
