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
};

export default api;
