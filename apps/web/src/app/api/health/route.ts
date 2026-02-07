import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

const startTime = Date.now();
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  let backendHealth: HealthCheck | null = null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }
    });
    if (res.ok) {
      backendHealth = (await res.json()) as HealthCheck;
    }
  } catch (error) {
    backendHealth = null;
  }

  const health: HealthCheck = backendHealth ?? {
    status: 'unhealthy',
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks: {
      database: { status: 'down', error: 'Backend health unavailable' },
      memory: { status: 'critical', used: 0, total: 0, percentage: 0 },
    },
  };
  
  return NextResponse.json(health, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
