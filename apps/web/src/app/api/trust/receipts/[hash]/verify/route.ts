import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3001';

export async function GET(
    request: NextRequest,
    { params }: { params: { hash: string } }
): Promise<NextResponse> {
    const hash = params.hash;

    try {
        // Get auth token from request headers
        const authHeader = request.headers.get('Authorization');

        const backendResponse = await fetch(
            `${BACKEND_URL}/api/trust/receipts/${hash}/verify`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
            }
        );

        const data = await backendResponse.json();

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error: any) {
        console.error('Verify receipt error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}
