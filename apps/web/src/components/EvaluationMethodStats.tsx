'use client';

import React from 'react';
import { Cpu, Calculator, Sparkles, Zap, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface EvaluationMethodStats {
  llm: {
    count: number;
    percentage: number;
    avgConfidence: number;
  };
  heuristic: {
    count: number;
    percentage: number;
    avgConfidence: number;
  };
  hybrid: {
    count: number;
    percentage: number;
    avgConfidence: number;
  };
  totalCount: number;
  breakdown: Array<{
    method: string;
    count: number;
    avgConfidence: number;
  }>;
}

interface EvaluationMethodStatsProps {
  tenantId?: string;
  className?: string;
}

// Demo data for demo mode
const DEMO_DATA: EvaluationMethodStats = {
  llm: {
    count: 157,
    percentage: 34,
    avgConfidence: 0.85,
  },
  heuristic: {
    count: 304,
    percentage: 66,
    avgConfidence: 0.62,
  },
  hybrid: {
    count: 0,
    percentage: 0,
    avgConfidence: 0,
  },
  totalCount: 461,
  breakdown: [
    { method: 'llm', count: 157, avgConfidence: 0.85 },
    { method: 'heuristic', count: 304, avgConfidence: 0.62 },
  ],
};

const ConfidenceIndicator: React.FC<{ confidence: number }> = ({ confidence }) => {
  const percent = Math.round(confidence * 100);
  
  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          confidence >= 0.8 ? 'bg-emerald-400' :
          confidence >= 0.6 ? 'bg-amber-400' :
          'bg-slate-500'
        )}
      />
      <span className="text-[9px] text-slate-500">{percent}% conf</span>
    </div>
  );
};

export const EvaluationMethodStats: React.FC<EvaluationMethodStatsProps> = ({
  tenantId,
  className,
}) => {
  // Check if in demo mode (no tenantId means demo)
  const isDemoMode = !tenantId || tenantId === 'demo-tenant';

  // Fetch data from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['evaluation-method-stats', tenantId],
    queryFn: async () => {
      const url = tenantId
        ? `/api/evaluation-method/stats?tenantId=${tenantId}`
        : '/api/evaluation-method/stats';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch evaluation method stats');
      const result = await response.json();
      return result.data as EvaluationMethodStats;
    },
    enabled: !isDemoMode, // Only fetch if not in demo mode
    refetchInterval: 60000, // Refetch every minute
  });

  // Use demo data in demo mode, otherwise use fetched data
  const stats = isDemoMode ? DEMO_DATA : data;

  if (isLoading && !isDemoMode) {
    return (
      <div className={cn('p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4" />
          <div className="space-y-3">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !isDemoMode) {
    return (
      <div className={cn('p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800', className)}>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <Info size={14} />
          <span>Failed to load evaluation method statistics</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={cn('p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Evaluation Methods
        </h3>
        <div className="flex items-center gap-1 text-[9px] text-slate-500">
          <Zap size={10} className="animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* LLM Powered */}
        {stats.llm.count > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  LLM Powered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceIndicator confidence={stats.llm.avgConfidence} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {stats.llm.percentage}% ({stats.llm.count})
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.llm.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Heuristic */}
        {stats.heuristic.count > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Calculator size={14} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Heuristic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceIndicator confidence={stats.heuristic.avgConfidence} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {stats.heuristic.percentage}% ({stats.heuristic.count})
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.heuristic.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Hybrid */}
        {stats.hybrid.count > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Hybrid (ML + LLM)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceIndicator confidence={stats.hybrid.avgConfidence} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {stats.hybrid.percentage}% ({stats.hybrid.count})
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.hybrid.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Total */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Evaluations</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{stats.totalCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
