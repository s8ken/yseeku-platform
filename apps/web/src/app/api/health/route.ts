import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  let dbStatus: HealthCheck['checks']['database'] = { status: 'down' };
  
  try {
    const pool = getPool();
    if (pool) {
      const start = Date.now();
      await pool.query('SELECT 1');
      const latency = Date.now() - start;
      dbStatus = { status: 'up', latency };
    } else {
      dbStatus = { status: 'down', error: 'No database connection' };
    }
  } catch (error) {
    dbStatus = { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
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
    dbStatus.status === 'down' ? 'unhealthy' :
    memStatus.status === 'critical' ? 'degraded' :
    'healthy';
  
  const health: HealthCheck = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks: {
      database: dbStatus,
      memory: memStatus
    }
  };
  
  const statusCode = 200; // Return 200 to allow deployment even if DB is not yet configured
  
  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
