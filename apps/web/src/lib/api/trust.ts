/**
 * Trust & Receipts API
 */

import { fetchAPI } from './client';

export interface Receipt {
  id: string;
  session_id: string;
  agent_id: string;
  trust_score: number;
  sonate_snapshot: Record<string, unknown>;
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
  receipt?: unknown;
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

export const trustApi = {
  async getTrustAnalytics(): Promise<TrustAnalyticsResponse> {
    return fetchAPI<TrustAnalyticsResponse>('/api/trust/analytics');
  },

  async getTrustHealth(): Promise<TrustHealthResponse> {
    return fetchAPI<TrustHealthResponse>('/api/trust/health');
  },

  async getTrustPrinciples(): Promise<TrustPrinciplesResponse> {
    return fetchAPI<TrustPrinciplesResponse>('/api/trust/principles');
  },

  async getReceipts(filters?: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { receipts: Receipt[] } }> {
    const params = new URLSearchParams();
    if (filters?.agentId) params.set('agentId', filters.agentId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/api/trust/receipts${query}`);
  },

  async getReceipt(hash: string): Promise<{ success: boolean; data: Receipt }> {
    return fetchAPI(`/api/trust/receipts/${hash}`);
  },

  async verifyReceipt(hash: string): Promise<{ 
    success: boolean; 
    data: { 
      valid: boolean; 
      receipt: Receipt;
      verificationDetails: unknown;
    } 
  }> {
    return fetchAPI(`/api/trust/receipts/${hash}/verify`);
  },

  async evaluateInteraction(data: {
    userInput: string;
    aiResponse: string;
    conversationId?: string;
    agentId?: string;
  }): Promise<{ success: boolean; data: TrustEvaluation }> {
    return fetchAPI('/api/trust/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default trustApi;
