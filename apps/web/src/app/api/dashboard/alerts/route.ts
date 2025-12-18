import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenant = url.searchParams.get('tenant') || 'default';
  const alerts = [
    {
      id: 'a-1',
      timestamp: new Date().toISOString(),
      type: 'system',
      title: 'Policy violation detected',
      description: 'Ethical override engaged during agent operation',
      severity: 'error',
      details: { component: 'orchestrator', code: 'ETH_OVERRIDE' },
    },
    {
      id: 'a-2',
      timestamp: new Date(Date.now() - 3600_000).toISOString(),
      type: 'security',
      title: 'Unauthorized access attempt',
      description: 'Blocked access to trust protocol data',
      severity: 'critical',
      details: { ip: '10.0.0.5' },
    },
    {
      id: 'a-3',
      timestamp: new Date(Date.now() - 7200_000).toISOString(),
      type: 'monitoring',
      title: 'Low trust score trend',
      description: 'Overall trust score decreased by 2% week-over-week',
      severity: 'warning',
      details: { delta: -2 },
    },
  ];
  const summary = alerts.reduce(
    (acc, a) => {
      const key = a.severity as 'critical' | 'error' | 'warning';
      if (key in acc) acc[key] += 1;
      acc.total += 1;
      return acc;
    },
    { critical: 0, error: 0, warning: 0, total: 0 }
  );
  return NextResponse.json({ success: true, data: { tenant, summary, alerts } });
}

