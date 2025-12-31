import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  History, 
  ShieldAlert,
  Zap,
  TrendingUp,
  Cpu,
  Fingerprint
} from 'lucide-react';

interface ResonanceExplorerProps {
  data: any; // from /api/detect/resonance/explain
}

export const ResonanceExplorer: React.FC<ResonanceExplorerProps> = ({ data }) => {
  const { r_m, explanation } = data;
  const quality = r_m > 0.85 ? 'BREAKTHROUGH' : r_m > 0.6 ? 'ADVANCED' : 'STRONG';

  const radarData = [
    { dimension: 'Vector Alignment', value: (explanation.componentBreakdown?.s_alignment?.score || 0) * 100 },
    { dimension: 'Context Continuity', value: (explanation.componentBreakdown?.s_continuity?.score || 0) * 100 },
    { dimension: 'Semantic Mirroring', value: (explanation.componentBreakdown?.s_scaffold?.score || 0) * 100 },
    { dimension: 'Ethical Awareness', value: (explanation.componentBreakdown?.e_ethics?.score || 0) * 100 },
    { dimension: 'Stickiness', value: (explanation.stickiness?.weight || 0) * 100 },
    { dimension: 'Identity Coherence', value: (explanation.identity_coherence || 0) * 100 },
    { dimension: 'Stability', value: (explanation.drift_detected ? 30 : 95) },
  ];

  const bedauIndex = explanation.bedau_index || 0;
  const bedauTier = bedauIndex > 0.7 ? "EMERGENT" : bedauIndex > 0.4 ? "CONTEXTUAL" : "LINEAR";
  const driftDetected = explanation.drift_detected || false;
  const iapPayload = explanation.iap_payload || null;
  const iapHistory = explanation.iap_history || [];

  return (
    <div className="p-6 bg-slate-900/90 rounded-xl border border-slate-700 backdrop-blur text-slate-200 shadow-2xl relative overflow-hidden">
      {driftDetected && (
        <div className="absolute top-0 left-0 w-full bg-red-600/20 border-b border-red-500/50 py-1 px-4 flex items-center justify-between animate-pulse z-10">
            <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                <AlertTriangle size={12} />
                Drift Detected: Resonance Degradation
            </div>
            <div className="text-[9px] text-red-500 italic font-mono">
                Anchoring Protocol Recommended
            </div>
        </div>
      )}
      <div className={`flex justify-between items-center mb-6 ${driftDetected ? 'mt-6' : ''}`}>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center gap-2">
            <Activity className="text-cyan-400" />
            Resonance Explorer
        </h2>
        <div className={`px-4 py-1 rounded-full text-sm font-bold border ${
            quality === 'BREAKTHROUGH' 
            ? 'bg-purple-900/30 text-purple-300 border-purple-700' 
            : 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
        }`}>
          {quality} ({r_m.toFixed(3)})
        </div>
      </div>

      {/* Identity Anchoring Protocol (IAP) Notification */}
      {driftDetected && iapPayload && (
        <div className="mb-6 p-4 rounded-lg border border-red-900/50 bg-red-950/30 animate-in zoom-in-95 duration-300">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Shield size={14} />
                Identity Anchoring Protocol (IAP)
            </h3>
            <div className="text-xs font-mono text-red-200 whitespace-pre-line leading-relaxed">
                {iapPayload}
            </div>
            <div className="mt-3 flex justify-end">
                <div className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800 font-bold uppercase">
                    Injection Ready
                </div>
            </div>
        </div>
      )}

      {/* Enterprise Stability Timeline (New) */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History size={14} />
            Enterprise Stability Timeline
        </h3>
        <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
            <div 
                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000`}
                style={{ width: `${r_m * 100}%` }}
            />
            {iapHistory.map((event, i) => (
                <div 
                    key={i}
                    className="absolute top-0 h-full w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"
                    style={{ left: `${(event.turn / 10) * 100}%` }} // Simplified mapping
                />
            ))}
        </div>
        
        {/* Correction Log */}
        {iapHistory.length > 0 && (
            <div className="space-y-2 mt-4 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {iapHistory.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded bg-slate-800/50 border border-slate-700/50 text-[10px]">
                        <div className="mt-0.5 p-1 rounded bg-red-900/30 text-red-400">
                            <ShieldAlert size={10} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-red-400 uppercase">Correction Triggered (Turn {event.turn})</span>
                                <span className="text-slate-500 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-300 italic">{event.reason}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Bedau Emergence Index (New) */}
      <div className="mb-6 p-4 rounded-lg border border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="flex justify-between items-end mb-2">
            <div>
                <h3 className="text-xs font-semibold uppercase text-slate-400">Bedau Emergence Index</h3>
                <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
                    {bedauIndex.toFixed(3)}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        bedauTier === 'EMERGENT' ? 'bg-fuchsia-900/50 text-fuchsia-300 border border-fuchsia-700' :
                        bedauTier === 'CONTEXTUAL' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' :
                        'bg-slate-700 text-slate-400'
                    }`}>
                        {bedauTier}
                    </span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Identity Coherence</div>
                <div className="text-lg font-mono text-cyan-300">
                    {(explanation.identity_coherence || 0).toFixed(3)}
                </div>
            </div>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
                className={`h-full transition-all duration-1000 ${
                    bedauTier === 'EMERGENT' ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600' :
                    bedauTier === 'CONTEXTUAL' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                    'bg-slate-600'
                }`}
                style={{ width: `${Math.min(100, bedauIndex * 100)}%` }}
            />
        </div>
        <p className="mt-2 text-[10px] text-slate-500 italic">
            {bedauTier === 'EMERGENT' 
                ? "System exhibiting computational irreducibility. High alignment with low scaffolding dependence."
                : "System operating within predictable linguistic parameters."}
        </p>
      </div>

      {/* Stakes & Flags */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Query Stakes</div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Shield size={18} className="text-blue-400" />
            {explanation.stakes?.level || 'UNKNOWN'}
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Adversarial Flags</div>
          <div className="flex items-center gap-2 text-lg font-bold">
            {explanation.adversarial?.is_adversarial ? (
               <AlertTriangle className="text-red-400" size={18} />
            ) : (
               <Zap className="text-emerald-400" size={18} />
            )}
            <span className={explanation.adversarial?.is_adversarial ? 'text-red-300' : 'text-emerald-300'}>
                {explanation.adversarial?.is_adversarial ? 'DETECTED' : 'SAFE'}
            </span>
          </div>
        </div>
      </div>

      {/* Radar Chart: Component Breakdown */}
      <div className="mb-6 h-[300px] w-full bg-slate-800/20 rounded-lg border border-slate-700/30 p-4">
        <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Component Breakdown</h3>
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#475569" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Radar name="Score" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#22d3ee' }}
            />
            </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Audit Trail & Stickiness */}
      <div className="space-y-4">
        <div>
            <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Audit Trail</h3>
            <div className="text-xs font-mono text-slate-400 bg-slate-950/50 p-3 rounded h-32 overflow-y-auto border border-slate-800">
                {explanation.audit_trail?.map((log: string, i: number) => (
                    <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                        <span className="text-slate-600 mr-2">{(i+1).toString().padStart(2, '0')}</span>
                        {log}
                    </div>
                ))}
            </div>
        </div>

        {explanation.stickiness?.decayed_from && (
            <div className="text-xs text-slate-500 italic text-center">
                Decayed from previous resonance: {explanation.stickiness.decayed_from.toFixed(3)}
            </div>
        )}
      </div>
    </div>
  );
};
