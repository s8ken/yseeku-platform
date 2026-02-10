import { Activity, TrendingDown, TrendingUp } from 'lucide-react';

export type Trend = { change: number; direction: string };

export const trendIcon = (trend?: Trend) => {
  if (!trend) return null;
  if (trend.direction === 'up') return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (trend.direction === 'down') return <TrendingDown className="h-4 w-4 text-rose-400" />;
  return <Activity className="h-4 w-4 text-white/60" />;
};

export const severityBadgeClass = (severity: string) => {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 'bg-rose-500/20 text-rose-200 border border-rose-500/30';
  if (s === 'error' || s === 'high') return 'bg-rose-500/10 text-rose-200 border border-rose-500/20';
  if (s === 'warning' || s === 'medium') return 'bg-amber-500/15 text-amber-200 border border-amber-500/25';
  if (s === 'info' || s === 'low') return 'bg-sky-500/15 text-sky-200 border border-sky-500/25';
  return 'bg-white/5 text-white/70 border border-white/10';
};

export function formatMinutes(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}
