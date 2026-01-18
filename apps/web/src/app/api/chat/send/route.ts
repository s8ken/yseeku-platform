import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content, threadId, attachments } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'content is required' },
        { status: 400 }
      );
    }

    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');

    // Proxy to backend conversation messages endpoint
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          content: content.trim(),
          threadId,
          attachments,
          generateResponse: true,
        }),
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || 'Failed to send message',
          details: data
        },
        { status: backendResponse.status }
      );
    }

    // Transform response to match expected format
    // The backend returns { success, data: { conversation } } with messages array
    const conversation = data.data?.conversation;
    const messages = conversation?.messages || [];
    const lastMessage = messages[messages.length - 1];

    // Return the AI response message in the expected format
    return NextResponse.json({
      success: true,
      message: lastMessage ? {
        id: lastMessage._id || `msg-${Date.now()}`,
        conversationId,
        threadId,
        role: lastMessage.sender === 'ai' ? 'assistant' : lastMessage.sender,
        content: lastMessage.content,
        timestamp: lastMessage.timestamp || new Date().toISOString(),
        trustReceipt: lastMessage.metadata?.trustReceipt,
        reactions: [],
        attachments: [],
      } : null,
      conversation: data.data?.conversation,
    });
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
