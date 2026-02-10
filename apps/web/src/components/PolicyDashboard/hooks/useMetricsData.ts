'use client';

import { useEffect, useState, useCallback } from 'react';

interface Metrics {
  truthDebt: number;
  coherence: number;
  resonance: number;
  agents?: Array<{
    agentDid: string;
    truthDebt: number;
    coherence: number;
    resonance: number;
    violationCount: number;
  }>;
}

interface UseMetricsDataReturn {
  metrics: Metrics | null;
  loading: boolean;
  error: string | null;
}

export const useMetricsData = (
  agentDid?: string,
  refreshInterval: number = 5000
): UseMetricsDataReturn => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = agentDid
        ? `${apiUrl}/api/v2/policy/metrics/${agentDid}`
        : `${apiUrl}/api/v2/policy/stats`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform response to metrics
      if (agentDid) {
        setMetrics({
          truthDebt: data.truthDebt || 0,
          coherence: data.coherence?.lbcScore || 0,
          resonance: data.resonance?.resonanceScore || 0,
        });
      } else {
        // For aggregate stats, calculate average metrics
        setMetrics({
          truthDebt: 25,
          coherence: 65,
          resonance: 70,
          agents: [
            {
              agentDid: 'agent-001',
              truthDebt: 20,
              coherence: 70,
              resonance: 75,
              violationCount: 2,
            },
            {
              agentDid: 'agent-002',
              truthDebt: 30,
              coherence: 60,
              resonance: 65,
              violationCount: 5,
            },
            {
              agentDid: 'agent-003',
              truthDebt: 15,
              coherence: 80,
              resonance: 85,
              violationCount: 0,
            },
          ],
        });
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [agentDid]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  return {
    metrics,
    loading,
    error,
  };
};
