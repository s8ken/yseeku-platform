/**
 * Dashboard & KPI API
 */

import { fetchAPI } from './client';

export interface KPIData {
  tenant: string;
  timestamp: string;
  trustScore: number;
  principleScores: Record<string, number>;
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
  severity: string;
  status?: string;
  details?: Record<string, unknown>;
}

export interface AlertsResponse {
  success: boolean;
  data: {
    alerts: Alert[];
    summary: {
      critical: number;
      error: number;
      warning: number;
      total: number;
    };
  };
  tenant: string;
}

export interface AlertsManagementResponse {
  success: boolean;
  data: {
    alerts: Alert[];
    total: number;
    stats: {
      critical: number;
      warning: number;
      info: number;
    };
  };
}

export const dashboardApi = {
  async getKPIs(tenant?: string): Promise<KPIData> {
    const params = tenant ? `?tenant=${tenant}` : '';
    const res = await fetchAPI<{ success: boolean; data: KPIData }>(`/api/dashboard/kpis${params}`);
    return res.data;
  },

  async getAlerts(tenant?: string): Promise<AlertsResponse> {
    const params = tenant ? `?tenant=${tenant}` : '';
    return fetchAPI<AlertsResponse>(`/api/dashboard/alerts${params}`);
  },

  async getAlertsManagement(filters?: { 
    status?: string; 
    severity?: string; 
    search?: string 
  }): Promise<AlertsManagementResponse> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.severity && filters.severity !== 'all') params.set('severity', filters.severity);
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<AlertsManagementResponse>(`/api/dashboard/alerts/management${query}`);
  },

  async updateAlertStatus(alertId: string, status: string): Promise<void> {
    await fetchAPI(`/api/dashboard/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async dismissAlert(alertId: string): Promise<void> {
    await fetchAPI(`/api/dashboard/alerts/${alertId}`, {
      method: 'DELETE',
    });
  },
};

export default dashboardApi;
