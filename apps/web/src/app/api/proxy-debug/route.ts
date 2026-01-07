
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';
  
  const debugInfo = {
    configuredBackendUrl: backendUrl,
    nodeEnv: process.env.NODE_ENV,
    steps: [] as string[]
  };

  try {
    debugInfo.steps.push(`Attempting to fetch ${backendUrl}/api/auth/ping`);
    const start = Date.now();
    
    // Set a short timeout to fail fast
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
        const res = await fetch(`${backendUrl}/api/auth/ping`, { 
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        const duration = Date.now() - start;
        debugInfo.steps.push(`Fetch completed in ${duration}ms with status ${res.status}`);
        
        const text = await res.text();
        debugInfo.steps.push(`Response body: ${text.substring(0, 200)}`);
        
        return NextResponse.json({
          success: res.ok,
          debug: debugInfo
        });
    } catch (fetchError: any) {
        clearTimeout(timeout);
        throw fetchError;
    }
  } catch (error: any) {
    debugInfo.steps.push(`Fetch failed: ${error.message}`);
    if (error.cause) {
        debugInfo.steps.push(`Cause: ${JSON.stringify(error.cause)}`);
    }
    return NextResponse.json({
      success: false,
      debug: debugInfo
    }, { status: 500 });
  }
}
