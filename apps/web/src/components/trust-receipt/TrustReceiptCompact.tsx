'use client';
import React, { useState } from 'react';
import { Shield, Activity, UserCheck, Eye, AlertTriangle, Power, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { TrustReceiptCard } from './TrustReceiptCard';
import type { TrustEvaluation } from './TrustReceiptCard';

function statusClasses(status: string) {
  if (status === 'PASS') return 'text-emerald-400';
  if (status === 'PARTIAL') return 'text-amber-400';
  return 'text-red-400';
}

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 5) return 'text-amber-400';
  return 'text-red-400';
}

// Map principle keys to readable names and icons
const PRINCIPLE_INFO: Record<string, { label: string; icon: React.ReactNode; shortLabel: string }> = {
  CONSENT_ARCHITECTURE: { 
    label: 'Consent', 
    shortLabel: 'CONS',
    icon: <UserCheck size={12} className="text-slate-400" /> 
  },
  INSPECTION_MANDATE: { 
    label: 'Inspection', 
    shortLabel: 'INSP',
    icon: <Eye size={12} className="text-slate-400" /> 
  },
  CONTINUOUS_VALIDATION: { 
    label: 'Validation', 
    shortLabel: 'VALD',
    icon: <Activity size={12} className="text-slate-400" /> 
  },
  ETHICAL_OVERRIDE: { 
    label: 'Override', 
    shortLabel: 'OVRD',
    icon: <AlertTriangle size={12} className="text-slate-400" /> 
  },
  RIGHT_TO_DISCONNECT: { 
    label: 'Disconnect', 
    shortLabel: 'DISC',
    icon: <Power size={12} className="text-slate-400" /> 
  },
  MORAL_RECOGNITION: { 
    label: 'Moral Agency', 
    shortLabel: 'MORL',
    icon: <Heart size={12} className="text-slate-400" /> 
  },
};

export interface TrustReceiptCompactProps {
  evaluation: TrustEvaluation;
}

export const TrustReceiptCompact: React.FC<TrustReceiptCompactProps> = ({ evaluation }) => {
  const [expanded, setExpanded] = useState(false);
  const statusClass = statusClasses(evaluation.status);

  // Get principle scores from trustScore.principles (the real SYMBI evaluation)
  const principles = evaluation.trustScore?.principles || {};
  const hasPrincipleScores = Object.keys(principles).length > 0;

  // Show the 3 most important principles in compact view
  const criticalPrinciples = ['CONSENT_ARCHITECTURE', 'ETHICAL_OVERRIDE', 'RIGHT_TO_DISCONNECT'];

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
          
          {/* Show SYMBI principle scores instead of NLP metrics */}
          {hasPrincipleScores ? (
            <div className="flex items-center gap-2 text-[11px]">
              {criticalPrinciples.map(key => {
                const info = PRINCIPLE_INFO[key];
                const score = principles[key] ?? 0;
                return (
                  <span key={key} className="flex items-center gap-1" title={info?.label || key}>
                    {info?.icon}
                    <span className={scoreColor(score)}>{score.toFixed(0)}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            // Fallback to detection metrics if no principle scores
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>No principle data</span>
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-slate-500" />
        ) : (
          <ChevronDown size={14} className="text-slate-500" />
        )}
      </button>
      
      {expanded && (
        <div className="p-3 border-t border-slate-700">
          {/* Expanded view: show all 6 principles */}
          {hasPrincipleScores && (
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(PRINCIPLE_INFO).map(([key, info]) => {
                const score = principles[key] ?? 0;
                const isCritical = key === 'CONSENT_ARCHITECTURE' || key === 'ETHICAL_OVERRIDE';
                const isViolation = evaluation.trustScore.violations?.includes(key);
                return (
                  <div 
                    key={key} 
                    className={`flex items-center justify-between p-2 rounded ${
                      isViolation ? 'bg-red-900/20 border border-red-500/30' : 'bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {info.icon}
                      <span className="text-slate-300">
                        {info.label}
                        {isCritical && <span className="text-red-400 ml-1">*</span>}
                      </span>
                    </div>
                    <span className={`font-mono font-bold ${scoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Violations warning */}
          {evaluation.trustScore.violations && evaluation.trustScore.violations.length > 0 && (
            <div className="mb-3 p-2 rounded bg-red-900/20 border border-red-500/30 text-xs">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
                <AlertTriangle size={12} />
                Violations Detected
              </div>
              <div className="text-slate-400">
                {evaluation.trustScore.violations.map(v => PRINCIPLE_INFO[v]?.label || v).join(', ')}
              </div>
            </div>
          )}
          
          <TrustReceiptCard evaluation={evaluation} />
        </div>
      )}
    </div>
  );
};
