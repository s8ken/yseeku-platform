/**
 * Lab & Experiments API
 */

import { fetchAPI } from './client';

export interface ExperimentVariant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  weight?: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ExperimentVariant[];
  metrics: {
    totalSamples: number;
    significant: boolean;
    pValue?: number;
    effectSize?: number;
  };
  startedAt?: string;
  completedAt?: string;
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

export interface SymbiAnalysis {
  dimensions: {
    realityIndex: number;
    trustProtocol: number;
    ethicalAlignment: number;
    resonanceQuality: number;
    canvasParity: number;
  };
  overallScore: number;
  recommendations: string[];
  timestamp: string;
}

export interface BedauAnalysis {
  emergenceIndex: number;
  patterns: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
  temporalTrend: 'increasing' | 'stable' | 'decreasing';
  timestamp: string;
}

// VLS (Linguistic Vector Steering) Types
export interface VLSMetrics {
  vocabularyDrift: number;
  introspectionIndex: number;
  hedgingRatio: number;
  formalityScore: number;
  complexityIndex: number;
}

export interface VLSAnalysisResult {
  metrics: VLSMetrics;
  timestamp: string;
  baseline?: string;
}

export interface VLSConversationResult {
  conversationId: string;
  agentId?: string;
  messageCount: number;
  overallMetrics: VLSMetrics;
  messageAnalyses: Array<{
    messageIndex: number;
    role: string;
    metrics: VLSMetrics;
    timestamp: string;
  }>;
  trends: {
    vocabularyDriftTrend: number[];
    introspectionTrend: number[];
    hedgingTrend: number[];
  };
  analysisTimestamp: string;
}

export interface VLSSessionSummary {
  sessionId: string;
  agentId?: string;
  firstMessage: string;
  lastMessage: string;
  messageCount: number;
  averageMetrics: VLSMetrics;
}

export interface VLSSessionsResponse {
  sessions: VLSSessionSummary[];
  total: number;
  page: number;
  limit: number;
}

export const labApi = {
  async getExperiments(status?: string): Promise<ExperimentsResponse> {
    const params = status ? `?status=${status}` : '';
    return fetchAPI<ExperimentsResponse>(`/api/lab/experiments${params}`);
  },

  async getExperiment(id: string): Promise<{ success: boolean; data: Experiment }> {
    return fetchAPI(`/api/lab/experiments/${id}`);
  },

  async createExperiment(data: {
    name: string;
    description?: string;
    variants: Array<{ name: string; config: Record<string, unknown> }>;
  }): Promise<{ success: boolean; data: Experiment }> {
    return fetchAPI('/api/lab/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async startExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}`, { 
      method: 'PATCH',
      body: JSON.stringify({ action: 'start' }),
    });
  },

  async pauseExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}`, { 
      method: 'PATCH',
      body: JSON.stringify({ action: 'pause' }),
    });
  },

  async resumeExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}`, { 
      method: 'PATCH',
      body: JSON.stringify({ action: 'resume' }),
    });
  },

  async completeExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}`, { 
      method: 'PATCH',
      body: JSON.stringify({ action: 'complete' }),
    });
  },

  async stopExperiment(id: string): Promise<void> {
    // Alias for pause (backwards compatibility)
    await fetchAPI(`/api/lab/experiments/${id}`, { 
      method: 'PATCH',
      body: JSON.stringify({ action: 'pause' }),
    });
  },

  async recordExperimentData(id: string, data: { variantIndex: number; score: number; success?: boolean }): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}/record`, { 
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}`, { method: 'DELETE' });
  },

  async runSymbiAnalysis(data: {
    userInput: string;
    aiResponse: string;
    context?: string;
  }): Promise<{ success: boolean; data: SymbiAnalysis }> {
    return fetchAPI('/api/lab/symbi/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getBedauIndex(sessionId?: string): Promise<{ success: boolean; data: BedauAnalysis }> {
    const params = sessionId ? `?sessionId=${sessionId}` : '';
    return fetchAPI(`/api/lab/bedau${params}`);
  },

  async runEmergenceTest(data: {
    transcript: Array<{ role: string; content: string }>;
  }): Promise<{ success: boolean; data: { emergenceSignals: unknown[] } }> {
    return fetchAPI('/api/lab/emergence/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // VLS (Linguistic Vector Steering) - Research Preview
  async analyzeVLSText(text: string, baseline?: string): Promise<VLSAnalysisResult> {
    const params = new URLSearchParams({ text });
    if (baseline) params.append('baseline', baseline);
    return fetchAPI<VLSAnalysisResult>(`/api/lab/vls/analyze?${params}`);
  },

  async getVLSConversation(conversationId: string): Promise<VLSConversationResult> {
    return fetchAPI<VLSConversationResult>(`/api/lab/vls/conversation/${conversationId}`);
  },

  async getVLSSessions(page = 1, limit = 20): Promise<VLSSessionsResponse> {
    return fetchAPI<VLSSessionsResponse>(`/api/lab/vls/sessions?page=${page}&limit=${limit}`);
  },
};

export default labApi;
