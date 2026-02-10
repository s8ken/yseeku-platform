'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Compass, ExternalLink, RefreshCw } from 'lucide-react';
import { formatMinutes } from './utils';

export function TopBar(props: {
  isDemo: boolean;
  isLoaded: boolean;
  currentTenantId: string;
  timeRemaining: number | null;
  showExpiryWarning: boolean;
  isRefreshing: boolean;
  onToggleDemo: () => void;
  onRefresh: () => void;
}): JSX.Element {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0B1020]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/80 to-indigo-400/80">
            <Compass className="h-5 w-5 text-[#0B1020]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">Tactical Command v2</div>
            <div className="text-xs text-white/60">Standalone operational console</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs md:flex">
            <span className="text-white/60">Tenant</span>
            <span className="font-medium">{props.isLoaded ? props.currentTenantId : '—'}</span>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <span className={`text-xs ${props.isDemo ? 'text-cyan-200' : 'text-white/60'}`}>Demo</span>
            <Switch checked={props.isDemo} onCheckedChange={props.onToggleDemo} disabled={!props.isLoaded} />
            <span className={`text-xs ${!props.isDemo ? 'text-emerald-200' : 'text-white/60'}`}>Live</span>
          </div>

          {props.isDemo && typeof props.timeRemaining === 'number' && (
            <Badge className={`${props.showExpiryWarning ? 'bg-amber-500/20 text-amber-100' : 'bg-cyan-500/15 text-cyan-100'} border border-white/10`}>
              Expires in {formatMinutes(props.timeRemaining)}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={props.onRefresh}
            disabled={props.isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${props.isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/dashboard/tactical-command" target="_blank" rel="noreferrer" className="hidden md:block">
            <Button variant="outline" size="sm" className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10">
              Dashboard
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

