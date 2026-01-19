/**
 * Tenants, Audit & Admin API
 */

import { fetchAPI } from './client';

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

export interface RiskEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  description: string;
  agentId?: string;
  details?: Record<string, unknown>;
  resolved: boolean;
}

export interface RiskEventsResponse {
  success: boolean;
  data: {
    events: RiskEvent[];
    summary: {
      total: number;
      bySeverity: Record<string, number>;
      unresolved: number;
    };
  };
}

export const adminApi = {
  // Tenants
  async getTenants(): Promise<TenantsResponse> {
    return fetchAPI<TenantsResponse>('/api/tenants');
  },

  async createTenant(data: { name: string; config?: Record<string, unknown> }): Promise<{ success: boolean; data: Tenant }> {
    return fetchAPI('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<{ success: boolean; data: Tenant }> {
    return fetchAPI(`/api/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTenant(id: string): Promise<void> {
    await fetchAPI(`/api/tenants/${id}`, { method: 'DELETE' });
  },

  // Audit
  async getAuditTrails(filters?: {
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditTrailsResponse> {
    const params = new URLSearchParams();
    if (filters?.action) params.set('action', filters.action);
    if (filters?.resource) params.set('resource', filters.resource);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<AuditTrailsResponse>(`/api/audit${query}`);
  },

  // Risk Events
  async getRiskEvents(filters?: {
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): Promise<RiskEventsResponse> {
    const params = new URLSearchParams();
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.resolved !== undefined) params.set('resolved', String(filters.resolved));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<RiskEventsResponse>(`/api/risk-events${query}`);
  },

  async resolveRiskEvent(id: string): Promise<void> {
    await fetchAPI(`/api/risk-events/${id}/resolve`, { method: 'POST' });
  },

  // Secrets
  async getSecrets(): Promise<{ success: boolean; data: Array<{ key: string; masked: string }> }> {
    return fetchAPI('/api/secrets');
  },

  async setSecret(key: string, value: string): Promise<void> {
    await fetchAPI('/api/secrets', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  },

  async deleteSecret(key: string): Promise<void> {
    await fetchAPI(`/api/secrets/${key}`, { method: 'DELETE' });
  },
};

export default adminApi;
