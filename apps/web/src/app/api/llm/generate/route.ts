import { NextResponse } from 'next/server';

// Demo mode LLM response for chat functionality
export async function POST(req: Request) {
  try {
    const { provider, model, messages, ...options } = await req.json();
    
    // Check if we have an Anthropic API key configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (anthropicKey && provider === 'anthropic') {
      // Real Anthropic API call
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model || 'claude-3-haiku-20240307',
            max_tokens: options.max_tokens || 1000,
            messages: messages,
            temperature: options.temperature || 0.7
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Anthropic API error:', error);
          throw new Error(`Anthropic API error: ${response.status} ${error}`);
        }

        const data = await response.json();
        
        return NextResponse.json({
          success: true,
          data: {
            content: data.content[0]?.text || 'I apologize, but I could not generate a response.',
            model: data.model,
            usage: data.usage
          }
        });
      } catch (error) {
        console.error('Anthropic API call failed:', error);
        // Fall back to demo response
      }
    }
    
    // Demo mode response when no API key or API fails
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || '';
    
    // Generate contextual demo responses about SONATE
    let demoResponse = '';
    
    if (userContent.toLowerCase().includes('hello') || userContent.toLowerCase().includes('hi')) {
      demoResponse = 'Hello! I\'m a demo AI assistant powered by the SONATE Trust Protocol. I can help you explore our AI governance and trust monitoring capabilities. How can I assist you today?';
    } else if (userContent.toLowerCase().includes('trust') || userContent.toLowerCase().includes('governance')) {
      demoResponse = 'The SONATE Trust Protocol provides real-time AI monitoring with constitutional governance. Our system evaluates AI interactions using multiple metrics including resonance scoring, ethical alignment, and compliance tracking. Would you like to see a live demonstration of how we monitor AI trustworthiness?';
    } else if (userContent.toLowerCase().includes('demo') || userContent.toLowerCase().includes('show me')) {
      demoResponse = 'I\'d be happy to demonstrate our capabilities! In this demo environment, you can explore: 1) Real-time AI monitoring dashboards, 2) Trust protocol implementation, 3) Resonance scoring metrics, and 4) Compliance audit trails. The dashboard shows live AI interaction monitoring with our SYMBI framework.';
    } else if (userContent.toLowerCase().includes('how') && userContent.toLowerCase().includes('work')) {
      demoResponse = 'SONATE works by implementing a multi-layered trust framework: 1) Real-time AI interaction monitoring, 2) Constitutional AI governance using our 6 trust principles, 3) Quantum-grade cryptographic security with Ed25519 signatures, and 4) Continuous compliance tracking. All interactions are scored for trustworthiness and alignment.';
    } else if (userContent.toLowerCase().includes('resonance') || userContent.toLowerCase().includes('scoring')) {
      demoResponse = 'Resonance scoring is our proprietary metric for measuring AI alignment and trustworthiness. It calculates how well AI responses align with user intent, constitutional principles, and ethical guidelines. The score ranges from 0-1, with higher scores indicating better resonance and trustworthiness.';
    } else if (userContent.toLowerCase().includes('security') || userContent.toLowerCase().includes('cryptographic')) {
      demoResponse = 'SONATE implements quantum-grade security using Ed25519 cryptographic signatures for all trust receipts and audit trails. This ensures tamper-proof records of AI interactions and compliance. Our security framework includes multi-tenant isolation, end-to-end encryption, and comprehensive audit logging.';
    } else {
      demoResponse = 'I\'m your demo AI assistant for the SONATE platform. I can help you understand our AI trust and governance features, explain the trust protocol, demonstrate resonance scoring, or guide you through the dashboard capabilities. What specific aspect of AI trust and governance would you like to explore?';
    }
    
    return NextResponse.json({
      success: true,
      data: {
        content: demoResponse,
        model: 'demo-model',
        usage: {
          input_tokens: lastMessage?.content?.length || 0,
          output_tokens: demoResponse.length
        },
        demo: true,
        note: anthropicKey ? 'Demo response due to API error' : 'Demo mode - no API key configured'
      }
    });
    
  } catch (error) {
    console.error('LLM generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate response',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
