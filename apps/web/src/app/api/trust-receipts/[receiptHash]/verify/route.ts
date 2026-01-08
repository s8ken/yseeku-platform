import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { receiptHash: string } }
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';
  const authorization = request.headers.get('authorization') || '';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const upstream = await fetch(
    `${backendUrl}/api/trust/receipts/${encodeURIComponent(params.receiptHash)}/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(body),
    }
  );

  const text = await upstream.text();
  try {
    const json = text ? JSON.parse(text) : null;
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }
}
