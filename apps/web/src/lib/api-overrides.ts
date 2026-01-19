import { api } from './api';
import { fetchAPI } from './api/client';

export interface OverrideQueueItem {
  id: string;
  type: string;
  target: string;
  reason?: string;
  status: string;
  createdAt: string;
  requestedBy?: string;
  severity?: string;
  canOverride: boolean;
}

export interface OverrideHistoryItem {
  id: string;
  actionId: string;
  decision: 'approve' | 'reject';
  reason: string;
  emergency: boolean;
  impact?: Record<string, any>;
  createdAt: string;
  userId: string;
  actionType: string;
  actionTarget: string;
  actionStatus: string;
}

export interface OverrideStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  approvalRate: number;
}

export interface OverrideDecisionRequest {
  actionId: string;
  decision: 'approve' | 'reject';
  reason: string;
  emergency?: boolean;
}

export interface OverrideQueueResponse {
  success: boolean;
  data: {
    items: OverrideQueueItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface OverrideHistoryResponse {
  success: boolean;
  data: {
    items: OverrideHistoryItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface OverrideDecisionResponse {
  success: boolean;
  data: {
    success: boolean;
    reverted: boolean;
    details: Record<string, any>;
    message?: string;
  };
}

export interface OverrideStatsResponse {
  success: boolean;
  data: OverrideStats;
}

export interface BulkOverrideRequest {
  actionIds: string[];
  decision: 'approve' | 'reject';
  reason: string;
}

export interface BulkOverrideResponse {
  success: boolean;
  data: {
    processed: number;
    failed: number;
    results: Array<{ actionId: string; success: boolean; reverted: boolean; details: Record<string, any> }>;
    errors: Array<{ actionId: string; error: string }>;
  };
}

export const overridesAPI = {
  async getOverrideQueue(filters?: {
    status?: string[];
    type?: string[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }, options?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.type?.length) {
      filters.type.forEach(type => params.append('type', type));
    }
    if (filters?.startDate) {
      params.set('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.set('endDate', filters.endDate.toISOString());
    }
    if (filters?.search) {
      params.set('search', filters.search);
    }
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      params.set('offset', options.offset.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<OverrideQueueResponse>(`/api/overrides/queue${query}`);
  },

  async getOverrideHistory(filters?: {
    decision?: ('approve' | 'reject')[];
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    emergency?: boolean;
  }, options?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams();

    if (filters?.decision?.length) {
      filters.decision.forEach(decision => params.append('decision', decision));
    }
    if (filters?.userId) {
      params.set('userId', filters.userId);
    }
    if (filters?.startDate) {
      params.set('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.set('endDate', filters.endDate.toISOString());
    }
    if (filters?.emergency !== undefined) {
      params.set('emergency', filters.emergency.toString());
    }
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      params.set('offset', options.offset.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<OverrideHistoryResponse>(`/api/overrides/history${query}`);
  },

  async processOverride(data: OverrideDecisionRequest) {
    return fetchAPI<OverrideDecisionResponse>('/api/overrides/decide', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getOverrideStats() {
    return fetchAPI<OverrideStatsResponse>('/api/overrides/stats');
  },

  async processBulkOverrides(data: BulkOverrideRequest) {
    return fetchAPI<BulkOverrideResponse>('/api/overrides/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};