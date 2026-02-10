'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TacticalAlert, TacticalAlerts } from './types';
import { severityBadgeClass } from './utils';

export function AlertsPanel(props: {
  loading: boolean;
  alerts: TacticalAlert[];
  summary: TacticalAlerts['summary'];
  onAcknowledge?: (alertId: string) => Promise<void>;
  selectedAlertId?: string | null;
  onSelectAlert?: (alertId: string | null) => void;
}): JSX.Element {
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [ackedIds, setAckedIds] = useState<Set<string>>(new Set());

  const handleAcknowledge = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAckingId(alertId);
    try {
      if (props.onAcknowledge) {
        await props.onAcknowledge(alertId);
      } else {
        // Default: call API directly
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        await fetch(`/api/dashboard/alerts/${alertId}/acknowledge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }
      setAckedIds(prev => new Set([...prev, alertId]));
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge alert');
    } finally {
      setAckingId(null);
    }
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white lg:col-span-7">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            Alerts
            <kbd className="ml-2 hidden sm:inline-flex h-5 items-center rounded border border-white/20 bg-white/5 px-1.5 text-[10px] font-medium text-white/50">
              A
            </kbd>
          </CardTitle>
          <CardDescription className="text-white/60">Active alerts requiring triage</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={severityBadgeClass('critical')}>Critical: {props.summary.critical}</Badge>
          <Badge className={severityBadgeClass('error')}>Error: {props.summary.error}</Badge>
          <Badge className={severityBadgeClass('warning')}>Warning: {props.summary.warning}</Badge>
          <Link href="/dashboard/alerts" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              Open
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <div className="text-sm text-white/60">Loading alerts…</div>
        ) : props.alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle2 className="h-4 w-4" />
            No active alerts
          </div>
        ) : (
          <div className="space-y-2">
            {props.alerts.slice(0, 8).map((a) => {
              const isAcked = ackedIds.has(a.id) || a.status === 'acknowledged';
              const isSelected = props.selectedAlertId === a.id;
              
              return (
                <div 
                  key={a.id} 
                  className={`flex items-start justify-between gap-4 rounded-md border p-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-cyan-500/50 bg-cyan-500/10' 
                      : 'border-white/10 bg-[#070B18]/30 hover:border-white/20'
                  } ${isAcked ? 'opacity-50' : ''}`}
                  onClick={() => props.onSelectAlert?.(isSelected ? null : a.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={severityBadgeClass(a.severity)}>{String(a.severity || 'unknown')}</Badge>
                      <div className="font-medium truncate">{a.title}</div>
                      {isAcked && <Check className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-white/60">{a.description}</div>
                    <div className="mt-2 text-[11px] text-white/40">
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                      {a.type ? ` • ${a.type}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-1">
                    {!isAcked && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        onClick={(e) => handleAcknowledge(a.id, e)}
                        disabled={ackingId === a.id}
                      >
                        {ackingId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Ack'
                        )}
                      </Button>
                    )}
                    <Link href="/dashboard/alerts" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

