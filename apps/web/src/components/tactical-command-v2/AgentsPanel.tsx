'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { TacticalAgent } from './types';
import { normalizeTrustScore } from './utils';

export function AgentsPanel(props: {
  loading: boolean;
  agents: TacticalAgent[];
}): JSX.Element {
  const sorted = props.agents
    .slice()
    .sort((a: any, b: any) => normalizeTrustScore(b.trustScore) - normalizeTrustScore(a.trustScore))
    .slice(0, 8);

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getTrustIcon = (score: number) => {
    if (score >= 70) return <ShieldCheck className="h-3 w-3 text-emerald-400" />;
    return <ShieldAlert className="h-3 w-3 text-rose-400" />;
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white lg:col-span-5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-white/70" />
            Agents
          </CardTitle>
          <CardDescription className="text-white/60">Fleet overview (trust + activity)</CardDescription>
        </div>
        <Link href="/dashboard/agents" target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <div className="text-sm text-white/60">Loading agents…</div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-white/60">No agents found</div>
        ) : (
          <div className="space-y-2">
            {sorted.map((agent: any) => {
              const trustScore = normalizeTrustScore(agent.trustScore);
              return (
                <div key={agent.id || agent._id} className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-[#070B18]/30 p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {agent.name}
                      {getTrustIcon(trustScore)}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      {agent.lastInteraction
                        ? `Last: ${new Date(agent.lastInteraction).toLocaleString()}`
                        : agent.lastActive
                          ? `Last: ${new Date(agent.lastActive).toLocaleString()}`
                          : 'Last: N/A'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-semibold ${getTrustColor(trustScore)}`}>{trustScore}</div>
                    <div className="text-[11px] text-white/50">Trust</div>
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

