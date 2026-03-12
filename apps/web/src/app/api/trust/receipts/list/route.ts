/**
 * Trust Receipts List API
 *
 * Proxy route to backend /api/trust/receipts/list endpoint.
 * Returns paginated list of trust receipts for the current tenant.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_URL ??
  'http://localhost:3001';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Forward query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // Forward auth header
    const authHeader = request.headers.get('authorization');
    const tenantHeader = request.headers.get('x-tenant-id');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (tenantHeader) {
      headers['X-Tenant-ID'] = tenantHeader;
    }

    const backendUrl = `${BACKEND_URL}/api/trust/receipts/list?limit=${limit}&offset=${offset}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[receipts/list] Backend error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch receipts', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[receipts/list] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
