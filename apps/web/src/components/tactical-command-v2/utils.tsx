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

// Normalize trust score to 0-100 scale
export function normalizeTrustScore(score: number | undefined): number {
  if (score === undefined || score === null) return 0;
  // If score is 0-10, multiply by 10
  if (score <= 10) return Math.round(score * 10);
  // If already 0-100, return as-is
  return Math.round(score);
}

// Mini sparkline component for trend visualization
export function Sparkline({ data, color = 'cyan' }: { data?: number[]; color?: 'cyan' | 'emerald' | 'amber' | 'rose' }) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const colorMap = {
    cyan: 'stroke-cyan-400',
    emerald: 'stroke-emerald-400',
    amber: 'stroke-amber-400',
    rose: 'stroke-rose-400',
  };
  
  return (
    <svg width={width} height={height} className="inline-block ml-2">
      <polyline
        points={points}
        fill="none"
        className={`${colorMap[color]} opacity-80`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Play alert sound for critical alerts
export function playAlertSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}

// Show browser notification
export async function showNotification(title: string, body?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}
