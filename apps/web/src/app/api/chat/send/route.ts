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

    const responseText = await backendResponse.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Backend response is not JSON:', responseText.substring(0, 500));
      return NextResponse.json(
        {
          success: false,
          error: 'Backend returned invalid response',
          details: { status: backendResponse.status, responsePreview: responseText.substring(0, 200) }
        },
        { status: 502 }
      );
    }

    if (!backendResponse.ok) {
      // Special handling for AI generation failure where user message was saved
      if (backendResponse.status === 500 && data.error?.includes('OpenAI API key not configured')) {
        // The user message was actually saved, extract it from the conversation data
        const conversation = data.data?.conversation;
        const lastMessage = conversation?.messages?.[conversation.messages.length - 1];
        
        if (lastMessage && lastMessage.sender === 'user') {
          // Return success with the user message, but include a warning about AI response
          return NextResponse.json({
            success: true,
            message: {
              id: lastMessage._id || `msg-${Date.now()}`,
              conversationId,
              role: 'user',
              content: lastMessage.content,
              timestamp: lastMessage.timestamp || new Date().toISOString(),
              trustReceipt: lastMessage.metadata?.trustEvaluation,
              reactions: [],
              attachments: [],
            },
            warning: 'AI response not available - API key not configured',
            conversation: data.data?.conversation,
          });
        }
      }
      
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
