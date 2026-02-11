// apps/web/src/components/ExplainableReceiptCard.tsx
import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Fingerprint } from 'lucide-react';

// Types imported/duplicated from explainable.ts (assuming frontend consumes shared types)
interface EvidenceChunk { 
  type: string;
  text: string;
  score_contrib: number;
}
interface ExplainedResonance { 
  r_m?: number; 
  receipt_id?: string;
  self_hash?: string;
  stakes?: { level: string; confidence: number }; 
  adversarial?: { penalty: number; keyword_density: number }; 
  breakdown?: Record<string, { contrib: number; score: number }>; 
  top_evidence?: EvidenceChunk[];
  // Trust receipt fields
  ciq_metrics?: { clarity: number; integrity: number; quality: number };
  trust_score?: number;
  signature?: string | { value: string; algorithm?: string };
  timestamp?: number | string;
  session_id?: string;
}

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' }) => {
  const colors = {
    default: 'bg-slate-700 text-slate-200',
    success: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    warning: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[variant]}`}>{children}</span>;
};

const Progress = ({ value }: { value: number }) => (
  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
    <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

const Alert = ({ variant, children }: { variant: 'warning', children: React.ReactNode }) => (
  <div className="p-3 rounded bg-yellow-900/20 border border-yellow-700/50 text-yellow-200 text-sm flex items-center gap-2">
    <AlertTriangle size={16} />
    <div>{children}</div>
  </div>
);

export function ExplainableReceiptCard({ receipt }: { receipt: ExplainedResonance }) {
  // Normalize receipt data - handle both resonance and trust receipt formats
  const receiptId = receipt.receipt_id || receipt.self_hash || 'unknown';
  const hasResonance = typeof receipt.r_m === 'number';
  const hasCIQ = receipt.ciq_metrics && (receipt.ciq_metrics.clarity || receipt.ciq_metrics.integrity || receipt.ciq_metrics.quality);
  
  // Calculate score from either format
  const score = receipt.r_m ?? (receipt.trust_score ? receipt.trust_score / 100 : 
    hasCIQ ? (receipt.ciq_metrics!.clarity + receipt.ciq_metrics!.integrity + receipt.ciq_metrics!.quality) / 3 : 0);
  
  const signature = typeof receipt.signature === 'string' ? receipt.signature : receipt.signature?.value;
  const isVerified = !!signature;

  return (
    <div className="w-full max-w-md bg-slate-900/95 text-slate-200 rounded-xl border border-slate-700 overflow-hidden font-mono shadow-2xl backdrop-blur-xl p-6 space-y-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            {hasResonance ? 'Resonance Score' : 'Trust Score'}
          </div>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            {hasResonance ? score.toFixed(3) : `${Math.round(score * 100)}%`}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {isVerified ? <CheckCircle size={12} className="text-emerald-400" /> : <Fingerprint size={12} />}
            {receiptId.slice(0, 8)}...
          </div>
          <div className="mt-1 flex gap-1">
            {receipt.stakes?.level && <Badge>{receipt.stakes.level} STAKES</Badge>}
            {isVerified && <Badge variant="success">SIGNED</Badge>}
          </div>
        </div>
      </div>
      
      {/* CIQ METRICS (Trust Receipt format) */}
      {hasCIQ && (
        <div className="space-y-2 text-xs">
          <div className="uppercase text-slate-500 text-[10px]">CIQ Metrics</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Clarity</span>
              <span className="opacity-70">{(receipt.ciq_metrics!.clarity * 100).toFixed(0)}%</span>
            </div>
            <Progress value={receipt.ciq_metrics!.clarity * 100} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Integrity</span>
              <span className="opacity-70">{(receipt.ciq_metrics!.integrity * 100).toFixed(0)}%</span>
            </div>
            <Progress value={receipt.ciq_metrics!.integrity * 100} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Quality</span>
              <span className="opacity-70">{(receipt.ciq_metrics!.quality * 100).toFixed(0)}%</span>
            </div>
            <Progress value={receipt.ciq_metrics!.quality * 100} />
          </div>
        </div>
      )}

      {/* BREAKDOWN CHART (Resonance format) */}
      {receipt.breakdown && Object.keys(receipt.breakdown).length > 0 && (
        <div className="space-y-2 text-xs">
          <div className="uppercase text-slate-500 text-[10px]">Dimension Breakdown</div>
          {Object.entries(receipt.breakdown).map(([dim, evidence]) => (
            <div key={dim} className="space-y-1">
              <div className="flex justify-between">
                <span>{dim.replace(/^[se]_/, '')}</span>
                <span className="opacity-70">+{evidence.contrib.toFixed(3)}</span>
              </div>
              <Progress value={evidence.score * 100} />
            </div>
          ))}
        </div>
      )}

      {/* TOP EVIDENCE */}
      {receipt.top_evidence && receipt.top_evidence.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
            <span>Show Top Evidence ({receipt.top_evidence.length})</span>
            <span className="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 space-y-2 pl-2 border-l border-slate-700">
            {receipt.top_evidence.map((e, i) => (
              <div key={i} className="text-xs">
                <strong className="text-slate-400 uppercase text-[10px]">{e.type}:</strong> 
                <span className="italic opacity-80"> "{e.text}"</span> 
                <span className="ml-2 text-emerald-400">+{e.score_contrib.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* SIGNATURE INFO */}
      {signature && (
        <div className="text-xs border-t border-slate-700/50 pt-3 mt-3">
          <div className="uppercase text-slate-500 text-[10px] mb-1">Digital Signature</div>
          <code className="text-emerald-400 text-[10px] break-all">{signature.slice(0, 32)}...</code>
        </div>
      )}

      {/* ADVERSARIAL FLAGS */}
      {receipt.adversarial && receipt.adversarial.penalty > 0.1 && (
        <Alert variant="warning">
          Adversarial penalty: {receipt.adversarial.penalty.toFixed(3)}
          {receipt.adversarial.keyword_density > 0.3 && ' (High keyword density)'}
        </Alert>
      )}
    </div>
  );
}
