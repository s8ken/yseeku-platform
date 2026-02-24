'use client';

/**
 * Policy Dashboard Component
 * 
 * Main dashboard for real-time policy monitoring
 * Displays metrics, alerts, and agent performance
 */

import React, { useState } from 'react';
import { MetricsCards } from './MetricsCards';
import { AlertFeed } from './AlertFeed';
import { AgentPerformanceCards } from './AgentPerformanceCards';
import { ViolationTimeline } from './ViolationTimeline';
import { OperatorIncidentManager } from './OperatorIncidentManager';
import { AlertSettings } from './AlertSettings';
import { useWebSocketAlerts } from './hooks/useWebSocketAlerts';
import { useMetricsData } from './hooks/useMetricsData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PolicyDashboardProps {
  agentDid?: string;
  autoConnect?: boolean;
  refreshInterval?: number;
}

export const PolicyDashboard: React.FC<PolicyDashboardProps> = ({
  agentDid,
  autoConnect = true,
  refreshInterval = 5000,
}) => {
  const [selectedAgentDid, setSelectedAgentDid] = useState<string | undefined>(agentDid);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [showIncidents, setShowIncidents] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // WebSocket alerts hook
  const { alerts, isConnected, subscribe, unsubscribe } = useWebSocketAlerts(autoConnect);

  // Metrics data hook
  const { metrics, loading: metricsLoading, error: metricsError } = useMetricsData(
    selectedAgentDid,
    refreshInterval
  );

  const handleAgentSelect = (agentDid: string) => {
    setSelectedAgentDid(agentDid);
  };

  const handleSubscribe = (agentDid: string) => {
    subscribe([agentDid], [
      'policy_violation',
      'anomaly_detected',
      'coherence_change',
      'resonance_update',
    ]);
  };

  const handleUnsubscribe = (agentDid: string) => {
    unsubscribe([agentDid]);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Governance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of SONATE policy enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Alert Settings"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['1h', '24h', '7d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              timeRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className="ml-auto px-3 py-1 rounded text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition"
        >
          {showIncidents ? 'Hide' : 'Show'} Incidents
        </button>
      </div>

      {/* Metrics Cards */}
      {!metricsLoading && metrics && (
        <MetricsCards metrics={metrics} agentDid={selectedAgentDid} />
      )}

      {metricsError && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{metricsError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agent Performance & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Performance */}
          <AgentPerformanceCards
            agents={metrics?.agents || []}
            selectedAgentDid={selectedAgentDid}
            onSelectAgent={handleAgentSelect}
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
          />

          {/* Alert Feed */}
          <AlertFeed
            alerts={alerts.filter((a) => !selectedAgentDid || a.agentDid === selectedAgentDid)}
            timeRange={timeRange}
          />

          {/* Violation Timeline */}
          <ViolationTimeline
            alerts={alerts.filter(
              (a) =>
                a.type === 'policy_violation' &&
                (!selectedAgentDid || a.agentDid === selectedAgentDid)
            )}
            timeRange={timeRange}
          />
        </div>

        {/* Right: Incidents & Overview */}
        <div className="space-y-6">
          {showIncidents && <OperatorIncidentManager alerts={alerts} />}
        </div>
      </div>

      {/* Alert Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alert Configuration</DialogTitle>
            <DialogDescription>
              Adjust alert sensitivity thresholds to fine-tune your monitoring preferences.
            </DialogDescription>
          </DialogHeader>
          <AlertSettings onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
