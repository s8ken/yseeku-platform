'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

export function WorkflowsPanel(props: { loading: boolean; workflows: any[] }): JSX.Element {
  const list = Array.isArray(props.workflows) ? props.workflows.slice(0, 8) : [];

  return (
    <Card className="border-white/10 bg-white/5 text-white lg:col-span-7">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-5 w-5 text-white/70" />
            Workflows
          </CardTitle>
          <CardDescription className="text-white/60">Multi-agent workflows and recent execution posture</CardDescription>
        </div>
        <Link href="/dashboard/orchestrate" target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
            Open orchestration
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {props.loading ? (
          <div className="text-sm text-white/60">Loading workflows…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-white/60">No workflows yet</div>
        ) : (
          <div className="space-y-2">
            {list.map((wf: any, idx: number) => (
              <div key={wf._id || wf.id || idx} className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-[#070B18]/30 p-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{wf.name || 'Unnamed workflow'}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-white/60">{wf.description || 'No description'}</div>
                </div>
                <div className="shrink-0">
                  {wf.status ? (
                    <Badge className="border border-white/10 bg-white/5 text-white">{wf.status}</Badge>
                  ) : (
                    <Badge className="border border-white/10 bg-white/5 text-white/70">unknown</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

