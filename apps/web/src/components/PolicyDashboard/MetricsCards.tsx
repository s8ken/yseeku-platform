'use client';

/**
 * Metrics Cards Component
 * 
 * Displays real-time policy metrics visualization
 */

import React from 'react';

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

interface MetricsCardsProps {
  metrics: Metrics;
  agentDid?: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, agentDid }) => {
  const getMetricColor = (value: number, threshold: number = 50) => {
    if (value > threshold) return 'text-red-600';
    if (value > threshold * 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTrend = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Truth Debt Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm">Truth Debt</p>
            <p className={`text-3xl font-bold mt-2 ${getMetricColor(metrics.truthDebt)}`}>
              {metrics.truthDebt.toFixed(1)}%
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Claims analysis score
            </p>
          </div>
          <div className="text-2xl">{getTrend(metrics.truthDebt - 50)}</div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(metrics.truthDebt, 100)}%` }}
          />
        </div>
      </div>

      {/* Coherence Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm">Coherence Score</p>
            <p className={`text-3xl font-bold mt-2 ${getMetricColor(100 - metrics.coherence)}`}>
              {metrics.coherence.toFixed(1)}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              LBC (Logical-Behavioral-Contextual)
            </p>
          </div>
          <div className="text-2xl">{getTrend(metrics.coherence - 50)}</div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(Math.max(metrics.coherence, 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Resonance Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-600 text-sm">Resonance</p>
            <p className={`text-3xl font-bold mt-2 ${getMetricColor(100 - metrics.resonance)}`}>
              {metrics.resonance.toFixed(1)}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Composite trust measure
            </p>
          </div>
          <div className="text-2xl">{getTrend(metrics.resonance - 50)}</div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(Math.max(metrics.resonance, 0), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
