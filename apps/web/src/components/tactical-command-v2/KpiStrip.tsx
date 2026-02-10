'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { trendIcon, Sparkline, normalizeTrustScore } from './utils';
import type { KPIData } from '@/lib/api/dashboard';

export function KpiStrip(props: {
  kpis: KPIData | undefined;
  loading: boolean;
  agentsLoading: boolean;
  agentsSummary: { total: number; active: number };
  trendHistory?: {
    trustScore?: number[];
    compliance?: number[];
    risk?: number[];
    interactions?: number[];
  };
}): JSX.Element {
  const kpis = props.kpis;
  const history = props.trendHistory;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card className="border-white/10 bg-white/5 text-white lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trust Index</CardTitle>
          <div className="flex items-center">
            {trendIcon(kpis?.trends?.trustScore)}
            <Sparkline data={history?.trustScore} color="cyan" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{props.loading ? '—' : normalizeTrustScore(kpis?.trustScore)}</div>
          <div className="mt-1 text-xs text-white/60">
            {kpis?.sonateDimensions?.trustProtocol ? `Protocol: ${kpis.sonateDimensions.trustProtocol}` : 'Protocol: N/A'}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          <div className="flex items-center">
            {trendIcon(kpis?.trends?.compliance)}
            <Sparkline data={history?.compliance} color="emerald" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{props.loading ? '—' : `${Math.round(kpis?.complianceRate ?? 0)}%`}</div>
          <div className="mt-1 text-xs text-white/60">Pass rate (tenant scoped)</div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk</CardTitle>
          <div className="flex items-center">
            {trendIcon(kpis?.trends?.risk)}
            <Sparkline data={history?.risk} color="rose" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{props.loading ? '—' : (kpis?.riskScore ?? 0)}</div>
          <div className="mt-1 text-xs text-white/60">Lower is better</div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interactions</CardTitle>
          <div className="flex items-center">
            {trendIcon(kpis?.trends?.interactions)}
            <Sparkline data={history?.interactions} color="amber" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{props.loading ? '—' : (kpis?.totalInteractions ?? 0)}</div>
          <div className="mt-1 text-xs text-white/60">Receipts/messages</div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          <Bot className="h-4 w-4 text-white/60" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{props.agentsLoading ? '—' : props.agentsSummary.active}</div>
          <div className="mt-1 text-xs text-white/60">Total: {props.agentsLoading ? '—' : props.agentsSummary.total}</div>
        </CardContent>
      </Card>
    </div>
  );
}
