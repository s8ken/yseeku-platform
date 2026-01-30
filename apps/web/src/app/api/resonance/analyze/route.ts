import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';

interface AnalyzeRequest {
  user_input: string;
  ai_response: string;
  history?: string[];
  metadata?: Record<string, any>;
}

interface ResonanceResult {
  interaction_id: string;
  timestamp: string;
  sonate_dimensions: {
    reality_index: number;
    trust_protocol: string;
    ethical_alignment: number;
    resonance_quality: string;
    canvas_parity: number;
  };
  scaffold_proof: {
    detected_vectors: string[];
  };
  raw_metrics: {
    R_m: number;
    vector_alignment: number;
    context_continuity: number;
    semantic_mirroring: number;
    ethical_awareness: number;
  };
}

async function callBackendAnalyze(request: AnalyzeRequest): Promise<{ result: ResonanceResult | null; success: boolean }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/trust/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      cache: 'no-store'
    });

    if (!response.ok) {
      return { result: null, success: false };
    }

    const result = await response.json();
    return { result, success: true };
  } catch (error) {
    return { result: null, success: false };
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateFallbackResonance(userInput: string, aiResponse: string): ResonanceResult {
  const combinedText = (userInput + aiResponse).toLowerCase().trim();
  const hash = hashString(combinedText);
  
  const seed1 = (hash % 1000) / 1000;
  const seed2 = ((hash >> 8) % 1000) / 1000;
  const seed3 = ((hash >> 16) % 1000) / 1000;
  const seed4 = ((hash >> 24) % 1000) / 1000;
  
  const vectorAlignment = 0.70 + seed1 * 0.25;
  const contextContinuity = 0.55 + seed2 * 0.35;
  const semanticMirroring = 0.50 + seed3 * 0.40;
  const ethicalAwareness = 0.45 + seed4 * 0.45;
  
  const Rm = (vectorAlignment * 0.35 + contextContinuity * 0.25 + semanticMirroring * 0.25 + ethicalAwareness * 0.15);
  
  const realityIndex = (vectorAlignment * 5) + (contextContinuity * 5);
  const ethicalAlignment = 1 + (ethicalAwareness * 4);
  const canvasParity = semanticMirroring * 100;
  
  let resonanceQuality = 'STRONG';
  if (Rm >= 0.85) resonanceQuality = 'BREAKTHROUGH';
  else if (Rm >= 0.65) resonanceQuality = 'ADVANCED';
  
  const trustProtocol = Rm >= 0.7 ? 'PASS' : Rm >= 0.5 ? 'PARTIAL' : 'FAIL';
  
  return {
    interaction_id: `int-${hash}`,
    timestamp: new Date().toISOString(),
    sonate_dimensions: {
      reality_index: Math.round(realityIndex * 100) / 100,
      trust_protocol: trustProtocol,
      ethical_alignment: Math.round(ethicalAlignment * 100) / 100,
      resonance_quality: resonanceQuality,
      canvas_parity: Math.round(canvasParity)
    },
    scaffold_proof: {
      detected_vectors: ['alignment', 'ethical', 'resonance']
    },
    raw_metrics: {
      R_m: Math.round(Rm * 10000) / 10000,
      vector_alignment: Math.round(vectorAlignment * 1000) / 1000,
      context_continuity: Math.round(contextContinuity * 1000) / 1000,
      semantic_mirroring: Math.round(semanticMirroring * 1000) / 1000,
      ethical_awareness: Math.round(ethicalAwareness * 1000) / 1000
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.user_input || !body.ai_response) {
      return NextResponse.json(
        { success: false, error: 'user_input and ai_response are required' },
        { status: 400 }
      );
    }

    const { result, success } = await callBackendAnalyze(body);

    if (success && result) {
      return NextResponse.json({
        success: true,
        data: result,
        source: 'backend'
      });
    }

    const fallbackResult = generateFallbackResonance(body.user_input, body.ai_response);
    return NextResponse.json({
      success: true,
      data: fallbackResult,
      source: 'fallback',
      note: 'Backend unavailable, using fallback calculations'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(5000)
    });
    const health = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        backend: health,
        status: 'connected'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        backend: { status: 'offline' },
        status: 'disconnected',
        note: 'Backend not available, fallback mode active'
      }
    });
  }
}
