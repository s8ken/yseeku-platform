import { NextResponse } from 'next/server';
import { getMetrics } from '@sonate/orchestrate/src/observability/metrics';

export async function GET() {
  try {
    const metrics = await getMetrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}