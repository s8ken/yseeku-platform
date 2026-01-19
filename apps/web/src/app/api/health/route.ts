import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    backend: {
      status: 'up' | 'down' | 'unknown';
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
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  let backendStatus: HealthCheck['checks']['backend'] = { status: 'unknown' };
  
  try {
    const start = Date.now();
    const res = await fetch(`${BACKEND_URL}/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }
    });
    const latency = Date.now() - start;
    
    if (res.ok) {
      backendStatus = { status: 'up', latency };
    } else {
      backendStatus = { status: 'down', error: `Status ${res.status}` };
    }
  } catch (error) {
    backendStatus = { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
  
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memPercentage = Math.round((usedMem / totalMem) * 100);
  
  const memStatus: HealthCheck['checks']['memory'] = {
    status: memPercentage > 90 ? 'critical' : memPercentage > 75 ? 'warning' : 'ok',
    used: Math.round(usedMem / 1024 / 1024),
    total: Math.round(totalMem / 1024 / 1024),
    percentage: memPercentage
  };
  
  const overallStatus: HealthCheck['status'] = 
    backendStatus.status === 'down' ? 'degraded' :
    memStatus.status === 'critical' ? 'degraded' :
    'healthy';
  
  const health: HealthCheck = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks: {
      backend: backendStatus,
      memory: memStatus
    }
  };
  
  return NextResponse.json(health, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
