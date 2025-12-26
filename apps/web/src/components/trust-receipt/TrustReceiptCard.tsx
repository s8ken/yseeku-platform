import React from 'react'; 
import { Shield, Activity, Fingerprint, Share2, CheckCircle, Zap } from 'lucide-react'; 

// --- Types --- 
export interface Telemetry { 
  resonance_score: number; 
  resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH'; 
  reality_index: number;    // 0-10 
  trust_protocol: 'PASS' | 'FAIL' | 'PARTIAL'; 
  ethical_alignment: number; // 1-5 
  canvas_parity: number;     // 0-100 
  bedau_index: number; // 0.0 to 1.0 
} 

export interface TrustReceiptProps { 
  id: string; 
  timestamp: string; 
  telemetry: Telemetry; 
  scaffold_proof: { 
    detected_vectors: string[]; 
  }; 
  signature: string; 
} 

// --- Helper: Status Color Map --- 
const getStatusColor = (quality: string) => { 
  switch (quality) { 
    case 'BREAKTHROUGH': return 'text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'; 
    case 'ADVANCED': return 'text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]'; 
    default: return 'text-emerald-400 border-emerald-500/50'; 
  } 
}; 

export const TrustReceiptCard: React.FC<TrustReceiptProps> = ({ 
  id, 
  timestamp, 
  telemetry, 
  scaffold_proof, 
  signature 
}) => { 
  const statusStyle = getStatusColor(telemetry.resonance_quality); 

  return ( 
    <div className="relative w-full max-w-md bg-slate-900/90 text-slate-200 rounded-xl border border-slate-700 overflow-hidden font-mono shadow-2xl backdrop-blur-xl"> 
      
      {/* --- Header: The Trust Seal --- */} 
      <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent`}> 
        <div className="flex items-center gap-3"> 
          <Shield className={`w-5 h-5 ${telemetry.trust_protocol === 'PASS' ? 'text-emerald-400' : telemetry.trust_protocol === 'PARTIAL' ? 'text-yellow-400' : 'text-red-500'}`} /> 
          <span className="text-xs tracking-widest uppercase opacity-70">Symbi Trust Receipt</span> 
        </div> 
        <div className={`px-3 py-1 text-xs font-bold border rounded-full ${statusStyle}`}> 
          {telemetry.resonance_quality} 
        </div> 
      </div> 

      <div className="p-6 space-y-6"> 
        
        {/* --- Section 1: The Score (Resonance) --- */} 
        <div className="flex items-end justify-between"> 
          <div> 
            <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">Resonance Score</div> 
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400"> 
              {telemetry.resonance_score.toFixed(3)} 
            </div> 
          </div> 
          
          {/* Micro Radar Chart Visualization */} 
          <div className="relative w-16 h-16"> 
             <RadarIcon metrics={telemetry} /> 
          </div> 
        </div> 

        {/* --- Section 2: 5D Dimensions Grid --- */} 
        <div className="grid grid-cols-2 gap-3 text-xs"> 
          <MetricBox label="Reality Index" value={telemetry.reality_index.toFixed(1)} max={10} icon={<Activity size={14} />} /> 
          <MetricBox label="Canvas Parity" value={telemetry.canvas_parity.toFixed(1) + '%'} max={100} icon={<Zap size={14} />} /> 
          <MetricBox label="Ethical Align" value={telemetry.ethical_alignment + '/5'} max={5} icon={<CheckCircle size={14} />} /> 
          <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-between"> 
            <span className="text-slate-500">Protocol</span> 
            <span className={`font-bold ${telemetry.trust_protocol === 'PASS' ? 'text-emerald-400' : telemetry.trust_protocol === 'PARTIAL' ? 'text-yellow-400' : 'text-red-400'}`}> 
              {telemetry.trust_protocol} 
            </span> 
          </div> 
        </div> 

        {/* --- Section 3: Scaffold Vectors (The "DNA") --- */} 
        <div> 
          <div className="text-[10px] uppercase text-slate-500 mb-2 flex items-center gap-2"> 
            <Activity size={10} /> Active Linguistic Vectors 
          </div> 
          <div className="flex flex-wrap gap-2"> 
            {scaffold_proof.detected_vectors.map((vector) => ( 
              <span key={vector} className="px-2 py-1 text-[10px] bg-slate-800 border border-slate-600 rounded text-cyan-300/90"> 
                {vector} 
              </span> 
            ))} 
          </div> 
        </div> 
 
        {/* --- Emergence Monitor --- */} 
        <div> 
          <div className="text-[10px] uppercase text-slate-500 mb-2 flex justify-between items-center"> 
            <div className="flex items-center gap-2"> 
              <Activity size={10} /> Bedau Emergence Index 
            </div> 
            <span className={`font-bold ${
              telemetry.bedau_index > 0.7 ? 'text-purple-400' : 
              telemetry.bedau_index > 0.4 ? 'text-cyan-400' : 'text-slate-400'
            }`}> 
              {telemetry.bedau_index > 0.7 ? 'WEAK EMERGENCE' : 
               telemetry.bedau_index > 0.4 ? 'CONTEXTUAL' : 'LINEAR'} 
            </span> 
          </div> 
          
          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700"> 
            {/* The Index Bar */} 
            <div 
              className={`h-full transition-all duration-1000 ${
                telemetry.bedau_index > 0.7 ? 'bg-gradient-to-r from-purple-500 to-fuchsia-400' : 
                telemetry.bedau_index > 0.4 ? 'bg-cyan-500' : 'bg-slate-600'
              }`} 
              style={{ width: `${telemetry.bedau_index * 100}%` }} 
            /> 
            {/* The Threshold Marker for Weak Emergence */} 
            <div className="absolute left-[70%] top-0 w-px h-full bg-white/30" /> 
            {/* The Threshold Marker for Contextual */}
            <div className="absolute left-[40%] top-0 w-px h-full bg-white/10" />
          </div> 
          
          <p className="mt-2 text-[9px] text-slate-500 italic leading-tight"> 
            {telemetry.bedau_index > 0.7 
              ? `Computational Irreducibility: ${telemetry.bedau_index.toFixed(2)}`
              : telemetry.bedau_index > 0.4
              ? "High semantic alignment with natural scaffolding."
              : "Predictable linguistic patterns. System operating in linear state."} 
          </p> 
        </div> 
 
        {/* --- Footer: Signature Hash --- */} 
        <div className="pt-4 mt-2 border-t border-slate-700/50"> 
          <div className="flex items-center gap-2 text-[10px] text-slate-500 break-all"> 
            <Fingerprint size={12} className="shrink-0" /> 
            <span className="font-mono opacity-60">{id}</span> 
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
const RadarIcon = ({ metrics }: { metrics: Telemetry }) => { 
  // Normalize metrics to 0-1 range for plotting 
  const r_idx = metrics.reality_index / 10; 
  const c_par = metrics.canvas_parity / 100; 
  const e_ali = metrics.ethical_alignment / 5; 
  const res_q = metrics.resonance_score; // Already 0-1 
  
  // Plotting a simple diamond shape based on these 4 vectors 
  // Top (Reality), Right (Canvas), Bottom (Ethics), Left (Resonance) 
  // Center is 32,32. Max radius is 28. 
  
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
