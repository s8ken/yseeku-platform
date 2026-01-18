import React, { useState } from 'react'; 
import { Shield, Activity, Fingerprint, Share2, CheckCircle, Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'; 
import { Progress } from '@/components/ui/progress';

// --- Types --- 
export interface TrustEvaluation {
  trustScore: {
    overall: number;
    principles: Record<string, number>;
    violations: string[];
    timestamp: number;
  };
  status: 'PASS' | 'PARTIAL' | 'FAIL';
  detection: {
    reality_index: number;
    trust_protocol: string;
    ethical_alignment: number;
    resonance_quality: string;
    canvas_parity: number;
  };
  receipt?: any;
  receiptHash?: string;
  timestamp: number;
  messageId?: string;
  conversationId?: string;
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

const PRINCIPLE_NAMES: Record<string, string> = {
  CONSENT_ARCHITECTURE: 'Consent Architecture',
  INSPECTION_MANDATE: 'Inspection Mandate',
  CONTINUOUS_VALIDATION: 'Continuous Validation',
  ETHICAL_OVERRIDE: 'Ethical Override',
  RIGHT_TO_DISCONNECT: 'Right to Disconnect',
  MORAL_RECOGNITION: 'Moral Recognition',
};

export const TrustReceiptCard: React.FC<TrustReceiptProps> = ({ 
  evaluation
}) => { 
  const [showPrinciples, setShowPrinciples] = useState(false);
  const { trustScore, status, detection, receiptHash, timestamp } = evaluation;
  const statusStyle = getStatusColor(status); 

  return ( 
    <div className="relative w-full max-w-md bg-slate-900/90 text-slate-200 rounded-xl border border-slate-700 overflow-hidden font-mono shadow-2xl backdrop-blur-xl transition-all duration-300"> 
      
      {/* --- Header: The Trust Seal --- */} 
      <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent`}> 
        <div className="flex items-center gap-3"> 
          <Shield className={`w-5 h-5 ${status === 'PASS' ? 'text-emerald-400' : status === 'PARTIAL' ? 'text-amber-400' : 'text-red-500'}`} /> 
          <span className="text-xs tracking-widest uppercase opacity-70">Symbi Trust Receipt</span> 
        </div> 
        <div className={`px-3 py-1 text-xs font-bold border rounded-full ${statusStyle}`}> 
          {status} 
        </div> 
      </div> 

      <div className="p-6 space-y-6"> 
        
        {/* --- Section 1: The Score --- */} 
        <div className="flex items-end justify-between"> 
          <div> 
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Trust Score</div> 
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400"> 
              {trustScore.overall.toFixed(1)}
            </div> 
          </div> 
          
          {/* Micro Radar Chart Visualization */} 
          <div className="relative w-16 h-16"> 
             <RadarIcon detection={detection} /> 
          </div> 
        </div> 

        {/* --- Section 2: 5D Dimensions Grid --- */} 
        <div className="grid grid-cols-2 gap-3 text-xs"> 
          <MetricBox label="Reality Index" value={detection.reality_index.toFixed(1)} max={10} icon={<Activity size={14} />} /> 
          <MetricBox label="Canvas Parity" value={detection.canvas_parity.toFixed(1) + '%'} max={100} icon={<Zap size={14} />} /> 
          <MetricBox label="Ethical Align" value={detection.ethical_alignment.toFixed(1)} max={5} icon={<CheckCircle size={14} />} /> 
          <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-between"> 
            <span className="text-slate-500">Protocol</span> 
            <span className={`font-bold ${detection.trust_protocol === 'PASS' ? 'text-emerald-400' : detection.trust_protocol === 'PARTIAL' ? 'text-amber-400' : 'text-red-400'}`}> 
              {detection.trust_protocol} 
            </span> 
          </div> 
        </div> 

        {/* --- Section 3: Principles Breakdown Toggle --- */}
        <div>
          <button 
            onClick={() => setShowPrinciples(!showPrinciples)}
            className="flex items-center justify-between w-full text-[10px] uppercase text-slate-500 hover:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity size={10} /> 6 Constitutional Principles
            </div>
            {showPrinciples ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {showPrinciples && (
            <div className="mt-3 space-y-3 pt-3 border-t border-slate-700/30">
              {Object.entries(trustScore.principles).map(([key, score]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">{PRINCIPLE_NAMES[key] || key}</span>
                    <span className={score >= 8 ? 'text-emerald-400' : score >= 5 ? 'text-amber-400' : 'text-red-400'}>
                      {score.toFixed(1)}/10
                    </span>
                  </div>
                  <Progress value={score * 10} className="h-1 bg-slate-800" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Section 4: Violations --- */}
        {trustScore.violations.length > 0 && (
          <div className="p-3 rounded bg-red-900/20 border border-red-700/50 text-red-200 text-[10px]">
            <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider">
              <AlertTriangle size={12} /> Violations Detected
            </div>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              {trustScore.violations.map((violation, idx) => (
                <li key={idx}>{violation}</li>
              ))}
            </ul>
          </div>
        )}
 
        {/* --- Resonance Quality Monitor --- */} 
        <div> 
          <div className="text-[10px] uppercase text-slate-500 mb-2 flex justify-between items-center"> 
            <div className="flex items-center gap-2"> 
              <Activity size={10} /> Resonance Quality 
            </div> 
            <span className={`font-bold ${
              detection.resonance_quality === 'BREAKTHROUGH' ? 'text-purple-400' : 
              detection.resonance_quality === 'ADVANCED' ? 'text-cyan-400' : 'text-slate-400'
            }`}> 
              {detection.resonance_quality} 
            </span> 
          </div> 
          
          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700"> 
            <div 
              className={`h-full transition-all duration-1000 ${
                detection.resonance_quality === 'BREAKTHROUGH' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-400' : 
                detection.resonance_quality === 'ADVANCED' ? 'bg-cyan-500' : 'bg-slate-600'
              }`} 
              style={{ width: detection.resonance_quality === 'BREAKTHROUGH' ? '100%' : detection.resonance_quality === 'ADVANCED' ? '75%' : '50%' }} 
            /> 
          </div> 
        </div> 
 
        {/* --- Footer: Signature Hash --- */} 
        <div className="pt-4 mt-2 border-t border-slate-700/50"> 
          <div className="flex items-center gap-2 text-[10px] text-slate-500 break-all"> 
            <Fingerprint size={12} className="shrink-0" /> 
            <span className="font-mono opacity-60">{receiptHash || 'PENDING_SIGNATURE'}</span> 
          </div> 
          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-600"> 
             <span>{new Date(timestamp).toUTCString()}</span> 
             <div className="flex items-center gap-1 text-purple-400/80"> 
               <Share2 size={10} /> 
               <span>VERIFIED ON-CHAIN</span> 
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

const MetricBox = ({ label, value, icon, max }: any) => ( 
  <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between"> 
    <div className="flex items-center gap-2 text-slate-500 mb-1"> 
      {icon} <span>{label}</span> 
    </div> 
    <div className="text-right font-bold text-slate-200">{value}</div> 
  </div> 
); 

// A simple SVG visualization of the 5 Dimensions 
const RadarIcon = ({ detection }: { detection: TrustEvaluation['detection'] }) => { 
  // Normalize metrics to 0-1 range for plotting 
  const r_idx = detection.reality_index / 10; 
  const c_par = detection.canvas_parity / 100; 
  const e_ali = detection.ethical_alignment / 5; 
  const res_q = detection.resonance_quality === 'BREAKTHROUGH' ? 1.0 : detection.resonance_quality === 'ADVANCED' ? 0.8 : 0.6;
  
  const top = 32 - (r_idx * 28); 
  const right = 32 + (c_par * 28); 
  const bottom = 32 + (e_ali * 28); 
  const left = 32 - (res_q * 28); 

  const points = `32,${top} ${right},32 32,${bottom} ${left},32`; 

  return ( 
    <svg viewBox="0 0 64 64" className="w-full h-full opacity-80"> 
      {/* Background Grid */} 
      <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="1" /> 
      <circle cx="32" cy="32" r="14" fill="none" stroke="#334155" strokeWidth="1" /> 
      {/* Data Shape */} 
      <polygon points={points} fill="rgba(168, 85, 247, 0.3)" stroke="#a855f7" strokeWidth="2" /> 
    </svg> 
  ); 
};
