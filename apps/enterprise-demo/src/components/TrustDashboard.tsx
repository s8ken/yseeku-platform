import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield, Activity, Zap } from 'lucide-react';
import { TrustDashboardProps } from '../types';
import { mockApi } from '../services/mockApi';

export const TrustDashboard: React.FC<TrustDashboardProps> = ({ 
  onRefresh 
}) => {
  const [trustScore, setTrustScore] = useState<TrustDashboardProps['trustScore'] | null>(null);
  const [metrics, setMetrics] = useState<TrustDashboardProps['metrics'] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await mockApi.getRealTimeUpdates();
      setTrustScore(data.trustScore);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Set up real-time updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await loadData();
    onRefresh?.();
  };

  const getTrustTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH': return 'text-emerald-400 bg-emerald-400/10';
      case 'MEDIUM': return 'text-cyan-400 bg-cyan-400/10';
      case 'LOW': return 'text-amber-400 bg-amber-400/10';
      case 'CRITICAL': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (!trustScore || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Trust Scoring Matrix
          </h2>
          <p className="text-gray-400 mt-1">
            Real-time SYMBI governance monitoring and compliance metrics
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Trust Score */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Overall Trust Tier</span>
          </div>
          <div className={`inline-flex px-6 py-3 rounded-full text-2xl font-bold ${getTrustTierColor(trustScore.tier)}`}>
            {trustScore.tier}
          </div>
          <div className="mt-4">
            <div className="text-5xl font-bold text-gray-100">{trustScore.total}</div>
            <div className="text-sm text-gray-400 mt-1">Trust Score (0-100)</div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400">Receipt: </span>
              <span className="font-mono text-cyan-400">{trustScore.receiptHash.substring(0, 16)}...</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-400">Updated: </span>
              <span className="text-gray-300">{new Date(trustScore.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Throughput */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Throughput</h3>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-gray-100">
                {metrics.throughput.requestsPerSecond.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">requests/second</div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Sessions:</span>
              <span className="font-mono text-cyan-400">{metrics.throughput.activeSessions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Data:</span>
              <span className="font-mono text-cyan-400">{metrics.throughput.dataProcessed}</span>
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Latency</h3>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-gray-100">{metrics.latency.current}ms</div>
              <div className="text-xs text-gray-500">current</div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Average:</span>
              <span className="font-mono text-emerald-400">{metrics.latency.average}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">P99:</span>
              <span className="font-mono text-gray-400">{metrics.latency.p99}ms</span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Compliance</h3>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">EU AI Act:</span>
              <span className="font-mono text-emerald-400">{metrics.compliance.euAiAct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">SOC 2:</span>
              <span className="font-mono text-emerald-400">{metrics.compliance.soc2}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">GDPR:</span>
              <span className="font-mono text-emerald-400">{metrics.compliance.gdpr}%</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400">Security</h3>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Encryption:</span>
              <span className="font-mono text-cyan-400">{metrics.security.encryption}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Hashing:</span>
              <span className="font-mono text-cyan-400">{metrics.security.hashing}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Signatures:</span>
              <span className="font-mono text-cyan-400">{metrics.security.signatures}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">DID:</span>
              <span className={`font-mono ${metrics.security.didVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                {metrics.security.didVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
