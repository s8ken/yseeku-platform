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

export interface SonateAnalysis {
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
    await fetchAPI(`/api/lab/experiments/${id}/start`, { method: 'POST' });
  },

  async stopExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}/stop`, { method: 'POST' });
  },

  async deleteExperiment(id: string): Promise<void> {
    await fetchAPI(`/api/lab/experiments/${id}`, { method: 'DELETE' });
  },

  async runSonateAnalysis(data: {
    userInput: string;
    aiResponse: string;
    context?: string;
  }): Promise<{ success: boolean; data: SonateAnalysis }> {
    return fetchAPI('/api/lab/sonate/analyze', {
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
};

export default labApi;
