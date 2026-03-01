/**
 * Overseer / System Brain API
 */

import { fetchAPI } from './client';

export interface BrainMemory {
  id: string;
  tenantId: string;
  kind: string;
  content: string;
  tags: string[];
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ActionEffectiveness {
  actionType: string;
  totalActions: number;
  successCount: number;
  failureCount: number;
  effectivenessScore: number;
  avgImpact: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface BrainRecommendation {
  id: string;
  actionType: string;
  target?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  suggestedAt: string;
}

export interface BrainCycleAction {
  type: string;
  target: string;
  reason: string;
  status: 'pending' | 'executed' | 'failed';
  executedAt?: string;
}

export interface BrainCycle {
  id: string;
  timestamp: string;
  mode: 'advisory' | 'enforced';
  status: 'completed' | 'failed' | 'running';
  thought: string;
  metrics: {
    agentCount: number;
    avgTrust: number;
    alertsProcessed: number;
    actionsPlanned: number;
  };
  actions: BrainCycleAction[];
}

export interface OverseerStatus {
  status: string;
  message: string;
  lastThought: string;
  mode: 'advisory' | 'enforced';
  cycles: number;
}

export const overseerApi = {
  async getStatus(): Promise<OverseerStatus> {
    const res = await fetchAPI<{ success: boolean; data: OverseerStatus }>('/api/overseer/status');
    return res.data;
  },

  async triggerThink(mode?: 'advisory' | 'enforced'): Promise<void> {
    await fetchAPI('/api/overseer/think', { 
      method: 'POST',
      body: mode ? JSON.stringify({ mode }) : undefined,
    });
  },

  async getMemories(kind?: string): Promise<BrainMemory[]> {
    const params = kind ? `?kind=${kind}` : '';
    const res = await fetchAPI<{ success: boolean; data: BrainMemory[] }>(`/api/overseer/memories${params}`);
    return res.data;
  },

  async addMemory(memory: { kind: string; content: string; tags?: string[] }): Promise<BrainMemory> {
    const res = await fetchAPI<{ success: boolean; data: BrainMemory }>('/api/overseer/memories', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
    return res.data;
  },

  async getCycles(limit?: number): Promise<BrainCycle[]> {
    const params = limit ? `?limit=${limit}` : '';
    const res = await fetchAPI<{ success: boolean; data: BrainCycle[] }>(`/api/overseer/cycles${params}`);
    return res.data;
  },

  async getEffectiveness(): Promise<ActionEffectiveness[]> {
    const res = await fetchAPI<{ success: boolean; data: ActionEffectiveness[] }>('/api/overseer/effectiveness');
    return res.data;
  },

  async getRecommendations(): Promise<BrainRecommendation[]> {
    const res = await fetchAPI<{ success: boolean; data: BrainRecommendation[] }>('/api/overseer/recommendations');
    return res.data;
  },

  async setMode(mode: 'advisory' | 'enforced'): Promise<void> {
    await fetchAPI('/api/overseer/mode', {
      method: 'PUT',
      body: JSON.stringify({ mode }),
    });
  },

  async getArchiveReport(): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: any }>('/api/overseer/archive-report');
    return res.data;
  },
};

export default overseerApi;

export interface ExecuteActionParams {
  actionType: string;
  target: string;
  recommendationId?: string;
  reason?: string;
}

export interface ExecuteActionResult {
  actionId: string;
  actionType: string;
  target: string;
  executedAt: string;
  result: Record<string, any>;
}

export async function executeAction(params: ExecuteActionParams): Promise<ExecuteActionResult> {
  const res = await fetchAPI<{ success: boolean; data: ExecuteActionResult }>(
    '/api/actions/execute',
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );
  return res.data;
}

export async function getActionLog(limit = 10): Promise<any[]> {
  const res = await fetchAPI<{ success: boolean; data: { log: any[]; count: number } }>(
    `/api/actions/log?limit=${limit}`
  );
  return res.data?.log ?? [];
}
