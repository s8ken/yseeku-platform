import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest) {
  const { pathname, search } = new URL(req.url);
  // Extract the part after /api/auth/api-keys
  const subPath = pathname.replace('/api/auth/api-keys', '');
  const targetUrl = `${BACKEND_URL}/api/auth/api-keys${subPath}${search}`;

  console.log(`[Proxy] ${req.method} ${req.url} -> ${targetUrl}`);

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' 
      ? await req.text() 
      : undefined;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Skip host header to avoid issues with proxying
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // @ts-ignore - duplex is required for streaming bodies in some fetch implementations
      duplex: body ? 'half' : undefined,
    });

    const data = await response.text();
    
    console.log(`[Proxy] ${targetUrl} responded with ${response.status}`);

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error(`[Proxy Error] ${targetUrl}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Proxy request failed', 
        error: error.message,
        targetUrl 
      },
      { status: 502 }
    );
  }
}
