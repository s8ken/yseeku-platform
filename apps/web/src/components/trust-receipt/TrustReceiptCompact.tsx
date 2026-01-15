'use client';
import React, { useMemo, useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrustReceiptCard } from './TrustReceiptCard';
import type { TrustEvaluation } from './TrustReceiptCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';

const PRINCIPLE_NAMES: Record<string, string> = {
  CONSENT_ARCHITECTURE: 'Consent',
  INSPECTION_MANDATE: 'Inspection',
  CONTINUOUS_VALIDATION: 'Validation',
  ETHICAL_OVERRIDE: 'Ethical',
  RIGHT_TO_DISCONNECT: 'Disconnect',
  MORAL_RECOGNITION: 'Moral',
};

function statusColor(status: string) {
  if (status === 'PASS') return '#10b981';
  if (status === 'PARTIAL') return '#f59e0b';
  return '#ef4444';
}

export interface TrustReceiptCompactProps {
  evaluation: TrustEvaluation;
}

export const TrustReceiptCompact: React.FC<TrustReceiptCompactProps> = ({ evaluation }) => {
  const [open, setOpen] = useState(false);
  const data = useMemo(() => {
    const entries = Object.entries(evaluation.trustScore.principles || {});
    return entries.map(([key, score]) => ({
      name: PRINCIPLE_NAMES[key] || key,
      score: Number(score) || 0,
    }));
  }, [evaluation]);

  const barColor = statusColor(evaluation.status);

  return (
    <>
      <button
        className="w-full rounded-lg border bg-card p-3 text-left hover:bg-muted transition-colors"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-slate-500" />
            <span className="text-xs font-semibold">
              Trust {evaluation.status} · {evaluation.trustScore.overall.toFixed(1)}
            </span>
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}/10`, 'Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {data.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={barColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={16} />
              Trust Receipt Details
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <TrustReceiptCard evaluation={evaluation} />
          </div>
          <button
            className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            onClick={() => setOpen(false)}
          >
            <ChevronUp size={12} />
            Collapse
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};

