import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Zap, Activity } from 'lucide-react';

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
  ];

  return (
    <div className="p-6 bg-slate-900/90 rounded-xl border border-slate-700 backdrop-blur text-slate-200 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
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
