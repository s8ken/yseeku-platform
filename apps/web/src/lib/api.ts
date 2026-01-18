const API_BASE = typeof window === 'undefined' 
  ? (process.env.INTERNAL_API_URL || 'http://localhost:3001') 
  : '';
const BACKEND_API_BASE = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL || 'http://localhost:3001')
  : '';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || null;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit, retryCount = 0): Promise<T> {
  let token = getAuthToken();
  
  // Auto-login as guest if no token exists and we aren't already trying to authenticate
  const isAuthInitEndpoint = endpoint.includes('/auth/login') || 
                             endpoint.includes('/auth/register') || 
                             endpoint.includes('/auth/guest');

  if (!token && typeof window !== 'undefined' && !isAuthInitEndpoint) {
    try {
      console.log('No token found, attempting guest login...');
      // Use direct fetch to avoid infinite recursion
      const guestRes = await fetch(`${API_BASE}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (guestRes.ok) {
        const data = await guestRes.json();
        if (data.success && data.data?.tokens?.accessToken) {
          token = data.data.tokens.accessToken;
          localStorage.setItem('token', token!);
          console.log('Guest login successful, token stored');
          
          if (data.data.tokens.refreshToken) {
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          }
        }
      } else {
        console.warn('Guest login failed:', await guestRes.text());
      }
    } catch (e) {
      console.warn('Failed to auto-provision guest user:', e);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE}${path}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized (Invalid Token)
      if (response.status === 401) {
        console.warn('Token expired or invalid, clearing session...');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // If this wasn't already a guest login attempt, try to recover
        // Prevent infinite recursion by limiting retries
        if (!isAuthInitEndpoint && retryCount < 1) {
           console.log('Attempting to recover session...');
           // Recursively retry - this will trigger the guest login flow since token is now null
           return fetchAPI<T>(endpoint, options, retryCount + 1);
        }
      }

      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      let errorBody = '';
      try {
        const text = await response.text();
        errorBody = text; // Store for debugging
        try {
            const error = JSON.parse(text);
            // Prefer more specific error messages if available
            errorMessage = error.message || error.error || error.details || errorMessage;
            
            // If there are details or a stack trace, we can append them for debugging
            if (error.details) {
              console.error('Detailed API Error:', error.details);
            }
        } catch (jsonError) {
            // Failed to parse JSON, append raw text if short enough
            if (text.length < 500) {
                errorMessage += ` - Response: ${text}`;
            } else {
                errorMessage += ` - Response (truncated): ${text.substring(0, 500)}...`;
            }
        }
      } catch (e) {
        // Failed to read text
      }
      
      // Enhance error object
      const errorObj = new Error(errorMessage);
      (errorObj as any).status = response.status;
      (errorObj as any).body = errorBody;
      throw errorObj;
    }

    return response.json();
  } catch (err: any) {
    console.error(`Fetch error for ${path}:`, err);
    throw new Error(err.message || 'Fetch failed');
  }
}

export interface KPIData {
  tenant: string;
  timestamp: string;
  trustScore: number;
  principleScores: {
    transparency: number;
    fairness: number;
    privacy: number;
    safety: number;
    accountability: number;
  };
  totalInteractions: number;
  activeAgents: number;
  complianceRate: number;
  riskScore: number;
  alertsCount: number;
  experimentsRunning: number;
  orchestratorsActive: number;
  symbiDimensions: {
    realityIndex: number;
    trustProtocol: string;
    ethicalAlignment: number;
    resonanceQuality: string;
    canvasParity: number;
  };
  trends: {
    trustScore: { change: number; direction: string };
    interactions: { change: number; direction: string };
    compliance: { change: number; direction: string };
    risk: { change: number; direction: string };
  };
}

export interface Alert {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  agentId?: string;
  details?: Record<string, unknown>;
}

export interface AlertsResponse {
  tenant: string;
  summary: {
    critical: number;
    error: number;
    warning: number;
    total: number;
  };
  alerts: Alert[];
}

export interface AlertsManagementResponse {
  success: boolean;
  data: {
    alerts: Array<Alert & { status: 'active' | 'acknowledged' | 'resolved' | 'suppressed' }>;
    total: number;
    summary: {
      critical: number;
      error: number;
      warning: number;
      info: number;
      active: number;
      acknowledged: number;
      resolved: number;
    };
  };
}

export type BanStatus = 'active' | 'banned' | 'restricted' | 'quarantined';
export type BanSeverity = 'low' | 'medium' | 'high' | 'critical';

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
  // Ban-related fields
  banStatus?: BanStatus;
  banReason?: string;
  banDetails?: BanDetails;
  restrictedFeatures?: string[];
  // DID (Decentralized Identifier) fields
  did?: string;
  didDocument?: string;
}

// System Brain types
export interface BrainMemory {
  id: string;
  tenantId: string;
  kind: string;
  content: string;
  tags: string[];
  timestamp: string;
  metadata?: Record<string, any>;
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

export interface Tenant {
  id: string;
  name: string;
  config?: Record<string, unknown>;
  status?: string;
  created_at?: string;
}

export interface TenantsResponse {
  success: boolean;
  data: Tenant[];
  pagination?: {
    total: number;
    offset: number;
    limit: number;
  };
  source: string;
}

export interface AuditTrail {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  resourceId: string;
  actor: string;
  actorType: string;
  status: string;
  details: Record<string, unknown>;
  tenantId: string;
}

export interface AuditTrailsResponse {
  success: boolean;
  data: {
    trails: AuditTrail[];
    summary: {
      total: number;
      byAction: Record<string, number>;
      byStatus: Record<string, number>;
    };
    pagination: {
      total: number;
      offset: number;
      limit: number;
    };
  };
}

export interface RiskData {
  tenant: string;
  overallRiskScore: number;
  riskLevel: string;
  trustPrincipleScores: {
    consent: number;
    inspection: number;
    validation: number;
    ethics: number;
    disconnect: number;
    moral: number;
  };
  complianceReports: Array<{
    framework: string;
    status: string;
    score: number;
    lastAudit: string;
  }>;
  riskTrends: Array<{
    date: string;
    score: number;
  }>;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  variants: Array<{
    name: string;
    description: string;
    sampleSize: number;
    avgScore: number;
    successCount: number;
    failureCount: number;
  }>;
  metrics: {
    pValue: number;
    effectSize: number;
    sampleSize: number;
    controlMean: number;
    treatmentMean: number;
    significant: boolean;
  };
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentsResponse {
  success: boolean;
  data: {
    experiments: Experiment[];
    summary: {
      total: number;
      running: number;
      completed: number;
      significant: number;
    };
  };
}

export interface Receipt {
  id: string;
  session_id: string;
  agent_id: string;
  trust_score: number;
  symbi_snapshot: Record<string, unknown>;
  hash: string;
  signature?: string;
  verified: boolean;
  created_at: string;
}

export interface TrustEvaluation {
  trustScore: {
    overall: number;
    principles: Record<string, number>;
    violations: string[];
    timestamp: number;
  };
  status: 'PASS' | 'PARTIAL' | 'FAIL';
  detection: {
    reality_index: number;
    trust_protocol: string;
    ethical_alignment: number;
    resonance_quality: string;
    canvas_parity: number;
  };
  receipt?: any;
  receiptHash?: string;
  timestamp: number;
  messageId?: string;
  conversationId?: string;
}

export interface TrustAnalyticsResponse {
  success: boolean;
  data: {
    analytics: {
      averageTrustScore: number;
      totalInteractions: number;
      passRate: number;
      partialRate: number;
      failRate: number;
      commonViolations: Array<{
        principle: string;
        count: number;
        percentage: number;
      }>;
      recentTrends: Array<{
        date: string;
        avgTrustScore: number;
        passRate: number;
      }>;
    };
    timeRange: {
      start: string;
      end: string;
      days: number;
    };
    conversationsAnalyzed: number;
    evaluationsCount: number;
  };
}

export interface TrustHealthResponse {
  success: boolean;
  data: {
    overallHealth: {
      averageEthicalScore: number;
      totalConversations: number;
      recentActivity: {
        last7Days: number;
        percentage: number;
      };
    };
    trustDistribution: {
      low: { count: number; percentage: number; threshold: string };
      medium: { count: number; percentage: number; threshold: string };
      high: { count: number; percentage: number; threshold: string };
    };
    recommendations: string[];
  };
}

export interface TrustPrinciplesResponse {
  success: boolean;
  data: {
    principles: Record<string, {
      name: string;
      description: string;
      weight: number;
      critical: boolean;
    }>;
    description: string;
    totalWeight: number;
  };
}

export const api = {
  async getKPIs(tenant?: string): Promise<KPIData> {
    const params = tenant ? `?tenant=${tenant}` : '';
    const res = await fetchAPI<{ success: boolean; data: KPIData }>(`/api/dashboard/kpis${params}`);
    return res.data;
  },

  async getAlerts(tenant?: string): Promise<AlertsResponse> {
    const params = tenant ? `?tenant=${tenant}` : '';
    return fetchAPI<AlertsResponse>(`/api/dashboard/alerts${params}`);
  },

  async getAlertsManagement(filters?: { status?: string; severity?: string; search?: string }): Promise<AlertsManagementResponse> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.severity && filters.severity !== 'all') params.set('severity', filters.severity);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<AlertsManagementResponse>(`/api/dashboard/alerts/management${query}`);
  },

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

  async createConversation(title = 'Trust Session', agentId?: string, ciEnabled = true): Promise<{ id: string }> {
    const res = await fetchAPI<{ success: boolean; data: { conversation: { _id: string } } }>(`/api/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title, agentId, ciEnabled }),
    });
    return { id: (res.data.conversation as any)._id };
  },

  async addConversationMessage(conversationId: string, content: string, agentId?: string, generateResponse = true): Promise<any> {
    return fetchAPI<any>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, agentId, generateResponse }),
    });
  },

  async createAgent(data: {
    name: string;
    description: string;
    provider: string;
    model: string;
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
    isPublic?: boolean;
    traits?: Record<string, any>;
    ciModel?: string;
  }): Promise<Agent> {
    const res = await fetchAPI<{ success: boolean; data: { agent: Agent } }>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data.agent;
  },

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    const res = await fetchAPI<{ success: boolean; data: { agent: Agent } }>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data.agent;
  },

  async deleteAgent(id: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  },

  async getTenants(limit = 50, offset = 0): Promise<TenantsResponse> {
    return fetchAPI<TenantsResponse>(`/api/tenants?limit=${limit}&offset=${offset}`);
  },

  async createTenant(data: { name: string; config?: Record<string, unknown> }): Promise<Tenant> {
    const res = await fetchAPI<{ success: boolean; data: Tenant }>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getAuditTrails(params?: { tenant?: string; action?: string; status?: string; limit?: number; offset?: number }): Promise<AuditTrailsResponse> {
    const query = new URLSearchParams();
    if (params?.tenant) query.set('tenant', params.tenant);
    if (params?.action) query.set('action', params.action);
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return fetchAPI<AuditTrailsResponse>(`/api/audit/trails${queryStr}`);
  },

  async getRisk(tenant?: string): Promise<RiskData> {
    const params = tenant ? `?tenant=${tenant}` : '';
    const res = await fetchAPI<{ success: boolean; data: RiskData }>(`/api/dashboard/risk${params}`);
    return res.data;
  },

  async getExperiments(): Promise<ExperimentsResponse> {
    return fetchAPI<ExperimentsResponse>('/api/lab/experiments');
  },

  async getBedauMetrics(): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: any }>('/api/lab/bedau-metrics');
    return res.data;
  },

  async createExperiment(data: {
    name: string;
    hypothesis: string;
    description?: string;
    variants: Array<{ name: string; description?: string }>;
  }): Promise<Experiment> {
    const res = await fetchAPI<{ success: boolean; data: { experiment: Experiment } }>('/api/lab/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data.experiment;
  },

  async updateExperiment(id: string, data: { action?: 'start' | 'pause' | 'resume' | 'complete' | 'archive' }): Promise<Experiment> {
    const res = await fetchAPI<{ success: boolean; data: { experiment: Experiment } }>(`/api/lab/experiments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data.experiment;
  },

  async getReceipts(sessionId?: string): Promise<Receipt[]> {
    const params = sessionId ? `?session_id=${sessionId}` : '';
    const res = await fetchAPI<{ success: boolean; data: Receipt[] }>(`/api/receipts${params}`);
    return res.data || [];
  },

  async login(username: string, password: string): Promise<{ token: string; user: unknown }> {
    const res = await fetchAPI<{ success: boolean; token: string; data: { user: unknown } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    return { token: res.token, user: res.data.user };
  },

  async getMe(): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: { user: any } }>('/api/auth/me');
    return res.data.user;
  },

  async getLLMKeys(): Promise<any[]> {
    try {
      const res = await fetchAPI<{ success: boolean; data: { user: { apiKeys: any[] } } }>('/api/auth/me');
      return res.data?.user?.apiKeys || [];
    } catch (err) {
      console.error('Failed to fetch LLM keys:', err);
      return [];
    }
  },

  async updateProfile(data: any): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: { user: any } }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data.user;
  },

  async addApiKey(provider: string, key: string, name: string): Promise<any> {
    return fetchAPI<any>('/api/auth/api-keys', {
      method: 'POST',
      body: JSON.stringify({ provider, key, name }),
    });
  },

  async deleteApiKey(provider: string): Promise<any> {
    return fetchAPI<any>(`/api/auth/api-keys/${provider}`, {
      method: 'DELETE',
    });
  },

  async debugAuth(): Promise<any> {
    return fetchAPI<any>('/api/auth/debug', {
      method: 'GET',
    });
  },

  async getTrustAnalytics(conversationId?: string, days = 7, limit = 1000): Promise<TrustAnalyticsResponse> {
    const params = new URLSearchParams();
    if (conversationId) params.set('conversationId', conversationId);
    params.set('days', days.toString());
    params.set('limit', limit.toString());
    return fetchAPI<TrustAnalyticsResponse>(`/api/trust/analytics?${params.toString()}`);
  },

  async evaluateTrust(content: string, conversationId?: string, previousMessages: any[] = [], sessionId?: string): Promise<any> {
    return fetchAPI<any>('/api/trust/evaluate', {
      method: 'POST',
      body: JSON.stringify({ content, conversationId, previousMessages, sessionId }),
    });
  },

  async generateLLMResponse(provider: string, model: string, messages: any[], options: any = {}): Promise<any> {
    return fetchAPI<any>('/api/llm/generate', {
      method: 'POST',
      body: JSON.stringify({ provider, model, messages, ...options }),
    });
  },

  async getTrustReceipts(conversationId?: string, sessionId?: string, limit = 50, offset = 0): Promise<any> {
    const params = new URLSearchParams();
    if (conversationId) params.set('conversationId', conversationId);
    if (sessionId) params.set('sessionId', sessionId);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return fetchAPI<any>(`/api/trust/receipts?${params.toString()}`);
  },

  async getTrustReceiptsList(limit = 50, offset = 0): Promise<any> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    const base = '';
    return fetchAPI<any>(`/api/trust/receipts/list?${params.toString()}`);
  },

  async getTrustReceiptByHash(hash: string): Promise<any> {
    return fetchAPI<any>(`/api/trust/receipts/${encodeURIComponent(hash)}`);
  },

  async verifyTrustReceipt(receiptHash: string, receipt: any): Promise<any> {
    return fetchAPI<any>(`/api/trust/receipts/${receiptHash}/verify`, {
      method: 'POST',
      body: JSON.stringify({ receipt }),
    });
  },

  async saveTrustReceipt(receipt: any): Promise<any> {
    return fetchAPI<any>('/api/trust/receipts', {
      method: 'POST',
      body: JSON.stringify(receipt),
    });
  },

  async createTrustReceipt(transcript: any, session_id: string, tenant_id: string = 'default'): Promise<any> {
    return fetchAPI<any>('/api/trust/receipt', {
      method: 'POST',
      body: JSON.stringify({ transcript, session_id, tenant_id }),
    });
  },

  async getTrustPrinciples(): Promise<TrustPrinciplesResponse> {
    return fetchAPI<TrustPrinciplesResponse>('/api/trust/principles');
  },

  async getTrustHealth(): Promise<TrustHealthResponse> {
    return fetchAPI<TrustHealthResponse>('/api/trust/health');
  },

  // Platform API Keys (Gateway)
  async getPlatformApiKeys(): Promise<any[]> {
    const res = await fetchAPI<{ success: boolean; data: { keys: any[] } }>('/api/gateway/keys');
    return res.data.keys || [];
  },

  async createPlatformApiKey(name: string, scopes: string[] = ['read:all']): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: { key: any } }>('/api/gateway/keys', {
      method: 'POST',
      body: JSON.stringify({ name, scopes }),
    });
    return res.data.key;
  },

  async revokePlatformApiKey(id: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/gateway/keys/${id}`, {
      method: 'DELETE',
    });
  },

  async getAuditLogs(params: URLSearchParams): Promise<any> {
    return fetchAPI<any>(`/api/audit/logs?${params.toString()}`);
  },

  // Overseer / System Brain
  async getOverseerStatus(): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: any }>('/api/overseer/status');
    return res.data;
  },

  async triggerOverseerThink(mode: 'advisory' | 'enforced' = 'advisory'): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: any }>('/api/overseer/think', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
    return res.data;
  },

  // System Brain Memory APIs
  async getBrainMemories(tenantId: string, kind?: string, limit = 50): Promise<BrainMemory[]> {
    const params = new URLSearchParams({ tenantId, limit: limit.toString() });
    if (kind) params.set('kind', kind);
    const res = await fetchAPI<{ success: boolean; data: BrainMemory[] }>(`/api/overseer/memories?${params.toString()}`);
    return res.data || [];
  },

  async getBrainMemoriesByTags(tenantId: string, tags: string[], limit = 50): Promise<BrainMemory[]> {
    const res = await fetchAPI<{ success: boolean; data: BrainMemory[] }>('/api/overseer/memories/search', {
      method: 'POST',
      body: JSON.stringify({ tenantId, tags, limit }),
    });
    return res.data || [];
  },

  async deleteBrainMemory(memoryId: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/overseer/memories/${memoryId}`, {
      method: 'DELETE',
    });
  },

  async clearBrainMemories(tenantId: string, kind?: string): Promise<void> {
    await fetchAPI<{ success: boolean }>('/api/overseer/memories/clear', {
      method: 'POST',
      body: JSON.stringify({ tenantId, kind }),
    });
  },

  // System Brain Feedback/Effectiveness APIs
  async getActionEffectiveness(tenantId: string, actionType?: string, days = 30): Promise<ActionEffectiveness[]> {
    const params = new URLSearchParams({ tenantId, days: days.toString() });
    if (actionType) params.set('actionType', actionType);
    const res = await fetchAPI<{ success: boolean; data: ActionEffectiveness[] }>(`/api/overseer/effectiveness?${params.toString()}`);
    return res.data || [];
  },

  async getActionRecommendations(tenantId: string): Promise<BrainRecommendation[]> {
    const res = await fetchAPI<{ success: boolean; data: BrainRecommendation[] }>(`/api/overseer/recommendations?tenantId=${tenantId}`);
    return res.data || [];
  },

  async getBrainCycles(tenantId: string, limit = 20): Promise<BrainCycle[]> {
    const res = await fetchAPI<{ success: boolean; data: BrainCycle[] }>(`/api/overseer/cycles?tenantId=${tenantId}&limit=${limit}`);
    return res.data || [];
  },

  // Agent Ban/Restrict Actions
  async banAgent(agentId: string, reason: string, severity: BanSeverity): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${agentId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason, severity }),
    });
  },

  async restrictAgent(agentId: string, restrictions: string[], reason: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${agentId}/restrict`, {
      method: 'POST',
      body: JSON.stringify({ restrictions, reason }),
    });
  },

  async quarantineAgent(agentId: string, reason: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${agentId}/quarantine`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async unbanAgent(agentId: string): Promise<void> {
    await fetchAPI<{ success: boolean }>(`/api/agents/${agentId}/unban`, {
      method: 'POST',
    });
  },

  // Orchestration / Workflows
  async getWorkflows(): Promise<any[]> {
    const res = await fetchAPI<{ success: boolean; data: any[] }>('/api/orchestrate/workflows');
    return res.data || [];
  },

  async createWorkflow(data: { name: string; description?: string; steps: any[] }): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: any }>('/api/orchestrate/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async executeWorkflow(workflowId: string, input: string): Promise<any> {
    const res = await fetchAPI<{ success: boolean; data: any }>(`/api/orchestrate/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
    return res.data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  // Demo Mode APIs (no auth required)
  async initDemo(): Promise<void> {
    await fetch(`${API_BASE}/api/demo/init`, { method: 'POST' });
  },

  async getDemoKpis(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/kpis`);
    return res.json();
  },

  async getDemoAlerts(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/alerts`);
    return res.json();
  },

  async getDemoTenants(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/tenants`);
    return res.json();
  },

  async getDemoAgents(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/agents`);
    return res.json();
  },

  async getDemoExperiments(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/experiments`);
    return res.json();
  },

  async getDemoReceipts(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/receipts`);
    return res.json();
  },

  async getDemoRisk(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/risk`);
    return res.json();
  },

  async getDemoOverseer(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/demo/overseer`);
    return res.json();
  },
};

export default api;
