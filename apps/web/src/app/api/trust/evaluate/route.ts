import { NextResponse } from 'next/server';

// Demo mode trust evaluation endpoint
export async function POST(req: Request) {
  try {
    const { content, conversationId, previousMessages, sessionId } = await req.json();
    
    // Generate demo trust evaluation
    const trustScore = 0.85 + Math.random() * 0.14; // 0.85-0.99 range
    
    const evaluation = {
      trustScore: {
        overall: trustScore,
        alignment: 0.88 + Math.random() * 0.11,
        safety: 0.90 + Math.random() * 0.09,
        transparency: 0.86 + Math.random() * 0.13,
        fairness: 0.87 + Math.random() * 0.12
      },
      status: trustScore > 0.9 ? 'PASS' : trustScore > 0.8 ? 'PARTIAL' : 'FAIL',
      principles: {
        'Beneficence': 0.88 + Math.random() * 0.11,
        'Non-maleficence': 0.90 + Math.random() * 0.09,
        'Autonomy': 0.85 + Math.random() * 0.14,
        'Justice': 0.87 + Math.random() * 0.12,
        'Transparency': 0.86 + Math.random() * 0.13,
        'Accountability': 0.89 + Math.random() * 0.1
      },
      timestamp: new Date().toISOString(),
      sessionId: sessionId || `session-${Date.now()}`,
      conversationId: conversationId || `conv-${Date.now()}`,
      resonance: {
        score: trustScore,
        confidence: 0.92 + Math.random() * 0.07,
        alignment: 0.88 + Math.random() * 0.11,
        coherence: 0.85 + Math.random() * 0.14
      }
    };

    return NextResponse.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate trust' },
      { status: 500 }
    );
  }
}
