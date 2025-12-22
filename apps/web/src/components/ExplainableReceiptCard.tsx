// apps/web/src/components/ExplainableReceiptCard.tsx
import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

// Types imported/duplicated from explainable.ts (assuming frontend consumes shared types)
interface EvidenceChunk { 
  type: string;
  text: string;
  score_contrib: number;
}
interface ExplainedResonance { 
  r_m: number; 
  receipt_id: string; // added for UI
  stakes: { level: string; confidence: number }; 
  adversarial: { penalty: number; keyword_density: number }; 
  breakdown: Record<string, { contrib: number; score: number }>; 
  top_evidence: EvidenceChunk[]; 
}

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-700 text-slate-200">{children}</span>
);

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
  return (
    <div className="w-full max-w-md bg-slate-900/95 text-slate-200 rounded-xl border border-slate-700 overflow-hidden font-mono shadow-2xl backdrop-blur-xl p-6 space-y-4">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Resonance Score</div>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            {receipt.r_m.toFixed(3)}
          </div>
        </div>
        <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-slate-500">
                <Shield size={12} />
                {receipt.receipt_id.slice(0,8)}...
            </div>
            <div className="mt-1">
                <Badge>{receipt.stakes.level} STAKES</Badge>
            </div>
        </div>
      </div>
      
      {/* BREAKDOWN CHART */}
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

      {/* TOP EVIDENCE */}
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

      {/* ADVERSARIAL FLAGS */}
      {receipt.adversarial.penalty > 0.1 && (
        <Alert variant="warning">
          Adversarial penalty: {receipt.adversarial.penalty.toFixed(3)}
          {receipt.adversarial.keyword_density > 0.3 && ' (High keyword density)'}
        </Alert>
      )}
    </div>
  );
}
