'use client';
import React, { useState } from 'react';
import { Shield, Activity, Zap, CheckCircle, Waves, ChevronDown, ChevronUp } from 'lucide-react';
import { TrustReceiptCard } from './TrustReceiptCard';
import type { TrustEvaluation } from './TrustReceiptCard';

function statusClasses(status: string) {
  if (status === 'PASS') return 'text-emerald-400';
  if (status === 'PARTIAL') return 'text-amber-400';
  return 'text-red-400';
}

export interface TrustReceiptCompactProps {
  evaluation: TrustEvaluation;
}

export const TrustReceiptCompact: React.FC<TrustReceiptCompactProps> = ({ evaluation }) => {
  const [expanded, setExpanded] = useState(false);
  const statusClass = statusClasses(evaluation.status);

  return (
    <div className="w-full rounded-lg border border-slate-700 bg-slate-900 text-slate-200">
      <button
        className="w-full px-3 py-2 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Shield size={14} className={statusClass} />
            <span className="text-xs font-semibold">
              {evaluation.trustScore.overall.toFixed(1)}
            </span>
          </div>
          <span className={`text-[10px] font-bold ${statusClass}`}>
            {evaluation.status}
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <Activity size={12} className="text-slate-400" />
              {evaluation.detection.reality_index.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Zap size={12} className="text-slate-400" />
              {evaluation.detection.canvas_parity.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-slate-400" />
              {evaluation.detection.ethical_alignment.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Waves size={12} className="text-slate-400" />
              {evaluation.detection.resonance_quality}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-slate-500" />
        ) : (
          <ChevronDown size={14} className="text-slate-500" />
        )}
      </button>
      {expanded && (
        <div className="p-3">
          <TrustReceiptCard evaluation={evaluation} />
        </div>
      )}
    </div>
  );
};
