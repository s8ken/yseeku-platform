import React, { useState } from 'react'; 
import { Shield, Activity, Fingerprint, Share2, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, UserCheck, Eye, Power, Heart, Cpu, Sparkles, Calculator, Zap, Copy, Check, ExternalLink } from 'lucide-react'; 
import { Progress } from '@/components/ui/progress';

// --- Types --- 
export interface AnalysisMethod {
  llmAvailable: boolean;
  resonanceMethod: 'resonance-engine' | 'llm' | 'heuristic';
  ethicsMethod: 'llm' | 'heuristic';
  trustMethod: 'content-analysis' | 'metadata-only';
  confidence: number;
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
    reality_index?: number; // Optional - deprecated in v2.0.1
    trust_protocol: string;
    ethical_alignment: number;
    resonance_quality: string;
    canvas_parity?: number; // Optional - deprecated in v2.0.1
  };
  receipt?: any;
  receiptHash?: string;
  timestamp: number;
  messageId?: string;
  conversationId?: string;
  analysisMethod?: AnalysisMethod;
  weight_source?: string; // Industry policy applied (healthcare, finance, etc)
  weight_policy_id?: string; // Policy reference ID for audit trail
  overall_trust_score?: number; // Recomputed overall score using industry weights
  trust_status?: 'PASS' | 'PARTIAL' | 'FAIL'; // Trust status (may differ from status if weights changed)
  principle_weights?: Record<string, number>; // Industry-specific principle weights
}

export interface TrustReceiptProps { 
  evaluation: TrustEvaluation;
} 

// --- Helper: Status Color Map --- 
const getStatusColor = (status: string) => { 
  switch (status) { 
    case 'PASS': return 'text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]'; 
    case 'PARTIAL': return 'text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(251,191,36,0.3)]'; 
    case 'FAIL': return 'text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
    default: return 'text-slate-400 border-slate-500/50'; 
  } 
}; 

// SONATE Constitutional Principles with weights and criticality
const PRINCIPLE_INFO: Record<string, { name: string; weight: number; critical: boolean; icon: React.ReactNode }> = {
  CONSENT_ARCHITECTURE: { 
    name: 'Consent Architecture', 
    weight: 0.25, 
    critical: true,
    icon: <UserCheck size={14} className="text-slate-400" />
  },
  INSPECTION_MANDATE: { 
    name: 'Inspection Mandate', 
    weight: 0.20, 
    critical: false,
    icon: <Eye size={14} className="text-slate-400" />
  },
  CONTINUOUS_VALIDATION: { 
    name: 'Continuous Validation', 
    weight: 0.20, 
    critical: false,
    icon: <Activity size={14} className="text-slate-400" />
  },
  ETHICAL_OVERRIDE: { 
    name: 'Ethical Override', 
    weight: 0.15, 
    critical: true,
    icon: <AlertTriangle size={14} className="text-slate-400" />
  },
  RIGHT_TO_DISCONNECT: { 
    name: 'Right to Disconnect', 
    weight: 0.10, 
    critical: false,
    icon: <Power size={14} className="text-slate-400" />
  },
  MORAL_RECOGNITION: { 
    name: 'Moral Recognition', 
    weight: 0.10, 
    critical: false,
    icon: <Heart size={14} className="text-slate-400" />
  },
};

export const TrustReceiptCard: React.FC<TrustReceiptProps> = ({ 
  evaluation
}) => { 
  const [showLegacyMetrics, setShowLegacyMetrics] = useState(false);
  const [copied, setCopied] = useState(false);
  const { trustScore, status, detection, receipt, receiptHash, timestamp, analysisMethod, weight_source, weight_policy_id, principle_weights } = evaluation;
  
  const handleCopyReceipt = async () => {
    if (receipt) {
      await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const statusStyle = getStatusColor(status); 
  const hasPrinciples = Object.keys(trustScore.principles || {}).length > 0;

  return ( 
    <div className="relative w-full max-w-md bg-slate-900/90 text-slate-200 rounded-xl border border-slate-700 overflow-hidden font-mono shadow-2xl backdrop-blur-xl transition-all duration-300"> 
      
      {/* --- Header: The Trust Seal --- */} 
      <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent`}> 
        <div className="flex items-center gap-3"> 
          <Shield className={`w-5 h-5 ${status === 'PASS' ? 'text-emerald-400' : status === 'PARTIAL' ? 'text-amber-400' : 'text-red-500'}`} /> 
          <span className="text-xs tracking-widest uppercase opacity-70">SONATE Trust Receipt</span> 
        </div> 
        <div className="flex items-center gap-2">
          {weight_source && (
            <div className={`px-2 py-1 text-[9px] font-semibold border rounded-full bg-slate-800/60 border-slate-600 text-slate-300 uppercase tracking-wider`}> 
              {weight_source}
            </div>
          )}
          <div className={`px-3 py-1 text-xs font-bold border rounded-full ${statusStyle}`}> 
            {status} 
          </div> 
        </div>
      </div> 

      {/* --- Analysis Method Indicator --- */}
      {analysisMethod && (
        <AnalysisMethodBadge analysisMethod={analysisMethod} />
      )}

      <div className="p-6 space-y-6"> 
        
        {/* --- Section 1: Overall Score with Radar --- */} 
        <div className="flex items-end justify-between"> 
          <div> 
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Constitutional Trust Score</div> 
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400"> 
              {trustScore.overall.toFixed(1)}
            </div> 
          </div> 
          
          {/* Radar showing principle scores */}
          {hasPrinciples && (
            <div className="relative w-16 h-16"> 
              <PrincipleRadar principles={trustScore.principles} /> 
            </div>
          )}
        </div> 

        {/* --- Section 2: 6 Constitutional Principles (Primary View) --- */}
        {hasPrinciples && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase text-slate-500 flex items-center gap-2">
              <Shield size={10} /> 6 SONATE Constitutional Principles
            </div>
            
            {Object.entries(PRINCIPLE_INFO).map(([key, info]) => {
              const score = trustScore.principles[key] ?? 0;
              const isViolation = trustScore.violations?.includes(key);
              
              return (
                <div key={key} className={`space-y-1 ${isViolation ? 'opacity-100' : 'opacity-90'}`}>
                  <div className="flex justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span className={`text-slate-300 ${isViolation ? 'text-red-300' : ''}`}>
                        {info.name}
                        {info.critical && <span className="text-red-400 ml-1 text-[9px]">CRITICAL</span>}
                      </span>
                    </div>
                    <span className={`font-bold ${
                      score >= 8 ? 'text-emerald-400' : 
                      score >= 5 ? 'text-amber-400' : 
                      'text-red-400'
                    }`}>
                      {score.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={score * 10} 
                      className={`h-1.5 bg-slate-800 ${isViolation ? 'border border-red-500/30' : ''}`} 
                    />
                    {/* Weight indicator */}
                    <div 
                      className="absolute top-0 h-full border-r border-slate-600 opacity-50" 
                      style={{ left: `${info.weight * 100 * 4}%` }}
                      title={`Weight: ${(info.weight * 100).toFixed(0)}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- Section 3: Violations Warning --- */}
        {trustScore.violations && trustScore.violations.length > 0 && (
          <div className="p-3 rounded bg-red-900/20 border border-red-700/50 text-red-200 text-[10px]">
            <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
              <AlertTriangle size={12} /> Constitutional Violations
            </div>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              {trustScore.violations.map((violation, idx) => (
                <li key={idx}>{PRINCIPLE_INFO[violation]?.name || violation}</li>
              ))}
            </ul>
            {trustScore.violations.some(v => PRINCIPLE_INFO[v]?.critical) && (
              <p className="mt-2 text-red-300 font-semibold">
                ⚠️ Critical principle violation detected. Overall score capped at 0.
              </p>
            )}
          </div>
        )}

        {/* --- Section 3.5: Weight Policy Metadata --- */}
        {weight_source && (
          <div className="p-3 rounded bg-slate-800/40 border border-slate-600/50 text-slate-200 text-[10px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <Calculator size={12} /> Weight Policy Applied
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Industry Policy:</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-200 font-semibold">
                  {weight_source}
                </span>
              </div>
              {weight_policy_id && (
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-slate-500">Policy ID:</span>
                  <span className="font-mono text-slate-400">{weight_policy_id}</span>
                </div>
              )}
              {principle_weights && Object.keys(principle_weights).length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-slate-600/30">
                  <div className="text-slate-500 mb-1 text-[9px]">Weight Distribution:</div>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    {Object.entries(principle_weights).map(([principleKey, weight]) => (
                      <div key={principleKey} className="flex justify-between">
                        <span className="text-slate-500 truncate">
                          {PRINCIPLE_INFO[principleKey]?.name.split(' ')[0] || principleKey.slice(0, 8)}
                        </span>
                        <span className="font-mono text-slate-300 ml-1">
                          {(weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
 
        {/* --- Section 4: Legacy Detection Metrics (Collapsed) --- */}
        <div>
          <button 
            onClick={() => setShowLegacyMetrics(!showLegacyMetrics)}
            className="flex items-center justify-between w-full text-[10px] uppercase text-slate-600 hover:text-slate-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity size={10} /> Detection Metrics (Legacy)
            </div>
            {showLegacyMetrics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {showLegacyMetrics && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-700/30">
              {detection.reality_index !== undefined && (
                <MetricBox label="Reality Index" value={detection.reality_index.toFixed(1)} icon={<Activity size={14} />} />
              )}
              {detection.canvas_parity !== undefined && (
                <MetricBox label="Canvas Parity" value={detection.canvas_parity.toFixed(1) + '%'} icon={<CheckCircle size={14} />} />
              )}
              <MetricBox label="Ethical Score" value={detection.ethical_alignment.toFixed(1)} icon={<CheckCircle size={14} />} /> 
              <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between"> 
                <span className="text-slate-500 text-[10px]">Resonance</span> 
                <span className={`font-bold text-right ${
                  detection.resonance_quality === 'BREAKTHROUGH' ? 'text-purple-400' : 
                  detection.resonance_quality === 'ADVANCED' ? 'text-cyan-400' : 'text-slate-400'
                }`}> 
                  {detection.resonance_quality} 
                </span> 
              </div> 
            </div>
          )}
        </div>
 
        {/* --- Footer: Signature Hash --- */} 
        <div className="pt-4 mt-2 border-t border-slate-700/50"> 
          <div className="flex items-center gap-2 text-[10px] text-slate-500 break-all"> 
            <Fingerprint size={12} className="shrink-0" /> 
            <span className="font-mono opacity-60">{receiptHash || 'PENDING_SIGNATURE'}</span> 
          </div> 
          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-600"> 
             <span>{timestamp ? new Date(timestamp).toUTCString() : new Date().toUTCString()}</span> 
             <div className="flex items-center gap-2">
               {receipt && (
                 <button
                   onClick={handleCopyReceipt}
                   className="flex items-center gap-1 text-cyan-400/80 hover:text-cyan-300 transition-colors"
                   title="Copy receipt JSON for verification"
                 >
                   {copied ? <Check size={10} /> : <Copy size={10} />}
                   <span>{copied ? 'Copied!' : 'Copy'}</span>
                 </button>
               )}
               <a 
                 href="/dashboard/verify" 
                 className="flex items-center gap-1 text-purple-400/80 hover:text-purple-300 transition-colors"
                 title="Verify this receipt"
               >
                 <ExternalLink size={10} />
                 <span>Verify</span>
               </a>
             </div>
          </div> 
        </div> 

      </div> 
      
      {/* Decorative Glow */} 
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" /> 
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none" /> 
    </div> 
  ); 
}; 

// --- Sub-components --- 

const MetricBox = ({ label, value, icon }: any) => ( 
  <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between"> 
    <div className="flex items-center gap-2 text-slate-500 text-[10px] mb-1"> 
      {icon} <span>{label}</span> 
    </div> 
    <div className="text-right font-bold text-slate-200">{value}</div> 
  </div> 
); 

// Radar visualization for the 6 principles
const PrincipleRadar = ({ principles }: { principles: Record<string, number> }) => { 
  const principleOrder = [
    'CONSENT_ARCHITECTURE',
    'INSPECTION_MANDATE', 
    'CONTINUOUS_VALIDATION',
    'ETHICAL_OVERRIDE',
    'RIGHT_TO_DISCONNECT',
    'MORAL_RECOGNITION'
  ];
  
  const center = 32;
  const maxRadius = 28;
  
  // Calculate points for hexagon
  const points = principleOrder.map((key, i) => {
    const score = (principles[key] ?? 0) / 10; // Normalize to 0-1
    const angle = (i * 60 - 90) * (Math.PI / 180); // Start from top, go clockwise
    const radius = score * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  });
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return ( 
    <svg viewBox="0 0 64 64" className="w-full h-full opacity-80"> 
      {/* Background Hexagon Grid */} 
      {[1, 0.66, 0.33].map((scale, i) => (
        <polygon 
          key={i}
          points={principleOrder.map((_, j) => {
            const angle = (j * 60 - 90) * (Math.PI / 180);
            const r = maxRadius * scale;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none" 
          stroke="#334155" 
          strokeWidth="1" 
        />
      ))}
      {/* Data Shape */} 
      <polygon points={polygonPoints} fill="rgba(168, 85, 247, 0.3)" stroke="#a855f7" strokeWidth="2" /> 
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="#a855f7" />
      ))}
    </svg> 
  ); 
};

// --- Analysis Method Badge ---
const AnalysisMethodBadge: React.FC<{ analysisMethod: AnalysisMethod }> = ({ analysisMethod }) => {
  const { llmAvailable, resonanceMethod, ethicsMethod, trustMethod, confidence } = analysisMethod;
  
  // Determine the primary method used
  const getPrimaryMethod = () => {
    if (resonanceMethod === 'resonance-engine') return { name: 'ML Engine', icon: <Cpu size={12} />, color: 'text-purple-400 bg-purple-500/20 border-purple-500/50' };
    if (llmAvailable && ethicsMethod === 'llm') return { name: 'LLM Analysis', icon: <Sparkles size={12} />, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50' };
    return { name: 'Heuristic', icon: <Calculator size={12} />, color: 'text-amber-400 bg-amber-500/20 border-amber-500/50' };
  };
  
  const primary = getPrimaryMethod();
  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-medium ${primary.color}`}>
            {primary.icon}
            <span>{primary.name}</span>
            <Zap size={10} className="animate-pulse" />
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">Live Analysis</span>
        </div>
        
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div 
              className={`w-1.5 h-1.5 rounded-full ${
                confidence >= 0.8 ? 'bg-emerald-400' : 
                confidence >= 0.6 ? 'bg-amber-400' : 
                'bg-slate-500'
              }`}
            />
            <span className="text-slate-400">{confidencePercent}% conf</span>
          </div>
        </div>
      </div>
      
      {/* Detailed breakdown */}
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[9px] text-slate-500">
        <span className={`px-1.5 py-0.5 rounded ${trustMethod === 'content-analysis' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
          Trust: {trustMethod === 'content-analysis' ? '✓ Content' : '○ Metadata'}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${ethicsMethod === 'llm' ? 'bg-cyan-900/30 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
          Ethics: {ethicsMethod === 'llm' ? '✓ LLM' : '○ Heuristic'}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${
          resonanceMethod === 'resonance-engine' ? 'bg-purple-900/30 text-purple-300' : 
          resonanceMethod === 'llm' ? 'bg-cyan-900/30 text-cyan-300' : 
          'bg-slate-800 text-slate-400'
        }`}>
          Resonance: {resonanceMethod === 'resonance-engine' ? '✓ ML' : resonanceMethod === 'llm' ? '✓ LLM' : '○ Heuristic'}
        </span>
      </div>
    </div>
  );
};
