import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenant = url.searchParams.get('tenant') || 'default';
  const experiments = [
    {
      id: 'exp-1',
      name: 'Trust scoring calibration',
      status: 'running',
      progress: 62,
      results: {
        variants: [
          { variantName: 'baseline', averageScore: 85 },
          { variantName: 'weighted', averageScore: 88 },
        ],
        statisticalAnalysis: {
          significantDifference: true,
          effectSize: 0.42,
          confidenceInterval: [0.21, 0.63],
          pValue: 0.012,
        },
      },
    },
    {
      id: 'exp-2',
      name: 'Alert sensitivity tuning',
      status: 'completed',
      progress: 100,
      results: {
        variants: [
          { variantName: 'strict', averageScore: 90 },
          { variantName: 'balanced', averageScore: 92 },
        ],
        statisticalAnalysis: {
          significantDifference: false,
          effectSize: 0.11,
          confidenceInterval: [-0.05, 0.27],
          pValue: 0.19,
        },
      },
    },
  ];
  const summary = {
    total: experiments.length,
    running: experiments.filter(e => e.status === 'running').length,
    completed: experiments.filter(e => e.status === 'completed').length,
  };
  return NextResponse.json({ success: true, data: { tenant, experiments, summary } });
}

