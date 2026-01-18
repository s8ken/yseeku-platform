import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { success: false, error: 'emoji is required' },
        { status: 400 }
      );
    }

    // For now, return a mock reaction response
    // In production, this would persist to database
    const reaction = {
      id: `reaction-${Date.now()}`,
      messageId,
      emoji,
      userId: 'current-user',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      reaction,
    });
  } catch (error: any) {
    console.error('Reaction error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
