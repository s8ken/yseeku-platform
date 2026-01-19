/**
 * API Module Index
 * 
 * Unified API client with modular organization.
 * Import individual modules for tree-shaking, or use the unified `api` object.
 */

// Re-export all modules
export * from './client';
export * from './auth';
export * from './dashboard';
export * from './agents';
export * from './trust';
export * from './overseer';
export * from './conversations';
export * from './lab';
export * from './admin';

// Import modules for unified API
import { authApi } from './auth';
import { dashboardApi } from './dashboard';
import { agentsApi } from './agents';
import { trustApi } from './trust';
import { overseerApi } from './overseer';
import { conversationsApi } from './conversations';
import { labApi } from './lab';
import { adminApi } from './admin';
import { API_BASE } from './client';

/**
 * Unified API object for backward compatibility
 * 
 * Combines all domain APIs into a single object.
 * For new code, prefer importing specific modules directly.
 */
export const api = {
  // Auth
  login: authApi.login,
  register: authApi.register,
  guestLogin: authApi.guestLogin,
  getProfile: authApi.getProfile,
  updateProfile: authApi.updateProfile,
  refreshToken: authApi.refreshToken,
  logout: authApi.logout,

  // Dashboard
  getKPIs: dashboardApi.getKPIs,
  getAlerts: dashboardApi.getAlerts,
  getAlertsManagement: dashboardApi.getAlertsManagement,
  updateAlertStatus: dashboardApi.updateAlertStatus,
  dismissAlert: dashboardApi.dismissAlert,

  // Agents
  getAgents: agentsApi.getAgents,
  getAgent: agentsApi.getAgent,
  createAgent: agentsApi.createAgent,
  updateAgent: agentsApi.updateAgent,
  deleteAgent: agentsApi.deleteAgent,
  banAgent: agentsApi.banAgent,
  unbanAgent: agentsApi.unbanAgent,
  restrictAgent: agentsApi.restrictAgent,
  quarantineAgent: agentsApi.quarantineAgent,
  getAgentDID: agentsApi.getAgentDID,
  provisionAgentDID: agentsApi.provisionAgentDID,

  // Trust
  getTrustAnalytics: trustApi.getTrustAnalytics,
  getTrustHealth: trustApi.getTrustHealth,
  getTrustPrinciples: trustApi.getTrustPrinciples,
  getReceipts: trustApi.getReceipts,
  getReceipt: trustApi.getReceipt,
  verifyReceipt: trustApi.verifyReceipt,
  evaluateInteraction: trustApi.evaluateInteraction,

  // Overseer
  getOverseerStatus: overseerApi.getStatus,
  triggerOverseerThink: overseerApi.triggerThink,
  getOverseerMemories: overseerApi.getMemories,
  addOverseerMemory: overseerApi.addMemory,
  getOverseerCycles: overseerApi.getCycles,
  getOverseerEffectiveness: overseerApi.getEffectiveness,
  getOverseerRecommendations: overseerApi.getRecommendations,
  setOverseerMode: overseerApi.setMode,

  // Conversations
  createConversation: conversationsApi.createConversation,
  getConversation: conversationsApi.getConversation,
  sendMessage: conversationsApi.sendMessage,
  streamMessage: conversationsApi.streamMessage,
  listConversations: conversationsApi.listConversations,
  deleteConversation: conversationsApi.deleteConversation,

  // Lab
  getExperiments: labApi.getExperiments,
  getExperiment: labApi.getExperiment,
  createExperiment: labApi.createExperiment,
  startExperiment: labApi.startExperiment,
  stopExperiment: labApi.stopExperiment,
  deleteExperiment: labApi.deleteExperiment,
  runSymbiAnalysis: labApi.runSymbiAnalysis,
  getBedauIndex: labApi.getBedauIndex,
  runEmergenceTest: labApi.runEmergenceTest,

  // Admin
  getTenants: adminApi.getTenants,
  createTenant: adminApi.createTenant,
  updateTenant: adminApi.updateTenant,
  deleteTenant: adminApi.deleteTenant,
  getAuditTrails: adminApi.getAuditTrails,
  getRiskEvents: adminApi.getRiskEvents,
  resolveRiskEvent: adminApi.resolveRiskEvent,
  getSecrets: adminApi.getSecrets,
  setSecret: adminApi.setSecret,
  deleteSecret: adminApi.deleteSecret,

  // Demo Mode APIs (no auth required)
  async initDemo(): Promise<void> {
    await fetch(`${API_BASE}/api/demo/init`, { method: 'POST' });
  },

  async getDemoKpis(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/kpis`);
    return res.json();
  },

  async getDemoAlerts(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/alerts`);
    return res.json();
  },

  async getDemoTenants(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/tenants`);
    return res.json();
  },

  async getDemoAgents(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/agents`);
    return res.json();
  },

  async getDemoExperiments(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/experiments`);
    return res.json();
  },

  async getDemoReceipts(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/receipts`);
    return res.json();
  },

  async getDemoRisk(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/risk`);
    return res.json();
  },

  async getDemoOverseer(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/overseer`);
    return res.json();
  },

  async getDemoLiveMetrics(): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/live-metrics`);
    return res.json();
  },

  async getDemoLiveEvents(limit = 10): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/demo/live-events?limit=${limit}`);
    return res.json();
  },

  // Orchestration / Workflows
  async getWorkflows(): Promise<unknown[]> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: unknown[] }>('/api/orchestrate/workflows');
    return res.data || [];
  },

  async createWorkflow(data: { name: string; description?: string; steps: unknown[] }): Promise<unknown> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: unknown }>('/api/orchestrate/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async executeWorkflow(workflowId: string, input: string): Promise<unknown> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: unknown }>(`/api/orchestrate/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
    return res.data;
  },

  // Platform API Keys
  async getPlatformApiKeys(): Promise<Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsed?: string; status: string }>> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { keys: Array<{ id: string; name: string; prefix: string; createdAt: string; lastUsed?: string; status: string }> } }>('/api/platform/api-keys');
    return res.data?.keys || [];
  },

  async createPlatformApiKey(name: string): Promise<{ id: string; name: string; fullKey: string; prefix: string }> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { id: string; name: string; fullKey: string; prefix: string } }>('/api/platform/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return res.data;
  },

  async revokePlatformApiKey(id: string): Promise<void> {
    const { fetchAPI } = await import('./client');
    await fetchAPI(`/api/platform/api-keys/${id}`, { method: 'DELETE' });
  },

  // Audit Logs
  async getAuditLogs(params: URLSearchParams | Record<string, string>): Promise<{ success: boolean; data: { logs: Array<any>; total: number; page: number; limit: number } }> {
    const { fetchAPI } = await import('./client');
    const queryString = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
    return fetchAPI(`/api/audit/logs?${queryString}`);
  },

  // LLM Keys Management
  async getLLMKeys(): Promise<Array<{ id: string; name: string; provider: string; createdAt: string }>> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { apiKeys: Array<any> } }>('/api/auth/me');
    return (res.data?.apiKeys || []).map((k: any) => ({
      id: k.provider,
      name: k.name,
      provider: k.provider,
      createdAt: k.createdAt,
    }));
  },

  async addApiKey(data: { name: string; provider: string; apiKey: string }): Promise<{ success: boolean; data: { apiKeys: any[] } }> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { apiKeys: any[] } }>('/api/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        provider: data.provider,
        key: data.apiKey,
        name: data.name,
      }),
    });
    return res;
  },

  async deleteApiKey(provider: string): Promise<void> {
    const { fetchAPI } = await import('./client');
    await fetchAPI(`/api/auth/api-keys/${provider}`, { method: 'DELETE' });
  },

  // Brain / Memory Features
  async getBrainMemories(tenant?: string, kind?: string, limit?: number): Promise<Array<any>> {
    const { fetchAPI } = await import('./client');
    const params = new URLSearchParams();
    if (tenant) params.set('tenant', tenant);
    if (kind) params.set('kind', kind);
    if (limit) params.set('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI<{ success: boolean; data: { memories: Array<any> } }>(`/api/brain/memories${query}`);
    return res.data?.memories || [];
  },

  async getBrainCycles(tenant?: string, limit?: number): Promise<Array<any>> {
    const { fetchAPI } = await import('./client');
    const params = new URLSearchParams();
    if (tenant) params.set('tenant', tenant);
    if (limit) params.set('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI<{ success: boolean; data: { cycles: Array<any> } }>(`/api/brain/cycles${query}`);
    return res.data?.cycles || [];
  },

  async deleteBrainMemory(id: string): Promise<void> {
    const { fetchAPI } = await import('./client');
    await fetchAPI(`/api/brain/memories/${id}`, { method: 'DELETE' });
  },

  async clearBrainMemories(tenant?: string, kind?: string): Promise<void> {
    const { fetchAPI } = await import('./client');
    const params = new URLSearchParams();
    if (tenant) params.set('tenant', tenant);
    if (kind) params.set('kind', kind);
    const query = params.toString() ? `?${params.toString()}` : '';
    await fetchAPI(`/api/brain/memories${query}`, { method: 'DELETE' });
  },

  // LLM Generation
  async generateLLMResponse(data: { prompt: string; model?: string; maxTokens?: number }): Promise<{ response: string }> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { response: string } }>('/api/llm/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // Action Features
  async getActionRecommendations(tenant?: string): Promise<Array<any>> {
    const { fetchAPI } = await import('./client');
    const query = tenant ? `?tenant=${tenant}` : '';
    const res = await fetchAPI<{ success: boolean; data: { recommendations: Array<any> } }>(`/api/actions/recommendations${query}`);
    return res.data?.recommendations || [];
  },

  async getActionEffectiveness(tenant?: string, actionType?: string): Promise<Record<string, any>> {
    const { fetchAPI } = await import('./client');
    const params = new URLSearchParams();
    if (tenant) params.set('tenant', tenant);
    if (actionType) params.set('actionType', actionType);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI<{ success: boolean; data: Record<string, any> }>(`/api/actions/effectiveness${query}`);
    return res.data || {};
  },

  // Bedau Metrics (alias for getBedauIndex)
  async getBedauMetrics(): Promise<Record<string, any>> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: Record<string, any> }>('/api/bedau/metrics');
    return res.data || {};
  },

  // Trust Receipts
  async getTrustReceiptsList(params?: { page?: number; limit?: number }): Promise<{ receipts: Array<any>; total: number }> {
    const { fetchAPI } = await import('./client');
    const query = params ? `?page=${params.page || 1}&limit=${params.limit || 20}` : '';
    const res = await fetchAPI<{ success: boolean; data: { receipts: Array<any>; total: number } }>(`/api/trust/receipts${query}`);
    return res.data || { receipts: [], total: 0 };
  },

  async getTrustReceiptByHash(hash: string): Promise<any> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { receipt: any } }>(`/api/trust/receipts/${hash}`);
    return res.data?.receipt;
  },

  async verifyTrustReceipt(hash: string): Promise<{ valid: boolean; receipt?: any }> {
    const { fetchAPI } = await import('./client');
    const res = await fetchAPI<{ success: boolean; data: { valid: boolean; receipt?: any } }>(`/api/trust/receipts/${hash}/verify`);
    return res.data || { valid: false };
  },

  // Debug
  async debugAuth(): Promise<{ authenticated: boolean; user?: any }> {
    const { fetchAPI } = await import('./client');
    try {
      const res = await fetchAPI<{ success: boolean; data: { authenticated: boolean; user?: any } }>('/api/auth/debug');
      return res.data || { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  },
};

export default api;
