import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield, Activity, Zap, AlertTriangle, History, ShieldAlert, Cpu } from 'lucide-react';
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

      {/* Main Trust Score & Resonance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-8">
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

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 flex flex-col justify-center items-center text-center">
          <div className="mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-400 uppercase tracking-wider">Resonance Stability</span>
          </div>
          <div className={`text-5xl font-bold ${metrics.resonance.currentResonance > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {(metrics.resonance.currentResonance * 100).toFixed(1)}%
          </div>
          <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${metrics.resonance.currentResonance * 100}%` }}
            />
          </div>
          <div className="mt-4 text-sm flex items-center gap-2 text-emerald-400">
            <Shield className="w-4 h-4" />
            Stability Index: {metrics.resonance.stabilityIndex.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Identity Anchoring Protocol (IAP) Alert */}
      {metrics.resonance.iapActive && (
        <div className="p-6 rounded-xl border border-red-900/50 bg-red-950/20 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-900/30 rounded-lg text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest mb-1">
                Identity Anchoring Protocol (IAP) Activated
              </h3>
              <p className="text-sm text-red-200 font-mono whitespace-pre-line leading-relaxed">
                {metrics.resonance.iapPayload}
              </p>
              <div className="mt-4 flex gap-3">
                <div className="px-3 py-1 bg-red-900/50 border border-red-800 text-red-300 text-[10px] font-bold rounded uppercase">
                  Drift Correction in Progress
                </div>
                <div className="px-3 py-1 bg-slate-900/50 border border-slate-700 text-slate-400 text-[10px] font-bold rounded uppercase">
                  Source turn: {metrics.resonance.iapHistory[0].turn}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stability Timeline & Correction Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Enterprise Stability Timeline
          </h3>
          <div className="relative h-24 flex items-end gap-1 px-2">
            {[...Array(20)].map((_, i) => {
              const val = 0.7 + Math.random() * 0.3;
              const isDrift = i === 12 || i === 7;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t transition-all duration-500 ${isDrift ? 'bg-red-500 animate-pulse h-12' : 'bg-cyan-500/40 h-16 hover:bg-cyan-400'}`}
                  title={`Turn ${i}: ${val.toFixed(2)}`}
                />
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-[10px] text-gray-500 font-mono uppercase">
            <span>Session Start</span>
            <span>Current Turn (20)</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Governance Correction Log
          </h3>
          <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {metrics.resonance.iapHistory.map((event, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded bg-slate-800/50 border border-slate-700/50">
                <div className={`mt-1 p-1.5 rounded ${event.impact === 'RECOVERED' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                  <Shield size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-200">Turn {event.turn} Intervention</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 italic truncate">{event.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      event.impact === 'RECOVERED' ? 'bg-emerald-900/50 border-emerald-800 text-emerald-400' : 'bg-red-900/50 border-red-800 text-red-400'
                    }`}>
                      {event.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
