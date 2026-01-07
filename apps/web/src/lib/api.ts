const API_BASE = '';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || null;
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
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
  metrics: {
    pValue: number;
    effectSize: number;
    sampleSize: number;
    controlMean: number;
    treatmentMean: number;
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
      overallScore: number;
      complianceRate: number;
      principleAverages: Record<string, number>;
      violationCounts: Record<string, number>;
      statusDistribution: Record<string, number>;
      trend: Array<{ date: string; score: number }>;
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

  async getAgents(tenant?: string, status?: string): Promise<AgentsResponse> {
    const params = new URLSearchParams();
    if (tenant) params.set('tenant', tenant);
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<AgentsResponse>(`/api/agents${query}`);
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

  async getTrustReceipts(conversationId?: string, sessionId?: string, limit = 50, offset = 0): Promise<any> {
    const params = new URLSearchParams();
    if (conversationId) params.set('conversationId', conversationId);
    if (sessionId) params.set('sessionId', sessionId);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return fetchAPI<any>(`/api/trust/receipts?${params.toString()}`);
  },

  async verifyTrustReceipt(receiptHash: string, receipt: any): Promise<any> {
    return fetchAPI<any>(`/api/trust/receipts/${receiptHash}/verify`, {
      method: 'POST',
      body: JSON.stringify({ receipt }),
    });
  },

  async getTrustPrinciples(): Promise<TrustPrinciplesResponse> {
    return fetchAPI<TrustPrinciplesResponse>('/api/trust/principles');
  },

  async getTrustHealth(): Promise<TrustHealthResponse> {
    return fetchAPI<TrustHealthResponse>('/api/trust/health');
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
};

export default api;
