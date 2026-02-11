/**
 * Trust Receipt Minting API
 * 
 * Generates cryptographically signed trust receipts through the backend.
 * Receipts are verifiable via the public verification endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL ?? process.env.BACKEND_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { transcript, session_id, resonance_data } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'transcript is required' },
        { status: 400 }
      );
    }

    // Build the receipt request for the backend
    const receiptRequest = {
      interaction: {
        prompt: transcript.turns?.[0]?.content || transcript.metadata?.userInput || '',
        response: transcript.text || transcript.turns?.[transcript.turns.length - 1]?.content || '',
      },
      session_id: session_id || `resonance-${Date.now()}`,
      mode: 'resonance-lab',
      // Include resonance metrics if available
      ...(resonance_data && {
        ciq_metrics: {
          clarity: resonance_data.breakdown?.s_alignment?.score || 0.8,
          integrity: resonance_data.breakdown?.s_continuity?.score || 0.8,
          quality: resonance_data.breakdown?.e_ethics?.score || 0.8,
        },
        trust_score: Math.round((resonance_data.r_m || 0.8) * 100),
      }),
    };

    // Call backend to generate signed receipt
    const response = await fetch(`${BACKEND_URL}/api/trust/receipts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use demo auth for lab features
        'Authorization': `Bearer ${process.env.DEMO_TOKEN || 'demo-token'}`,
      },
      body: JSON.stringify(receiptRequest),
    });

    if (!response.ok) {
      // If backend auth fails, try the public demo endpoint
      const demoResponse = await fetch(`${BACKEND_URL}/api/public-demo/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: receiptRequest.interaction.prompt,
          response: receiptRequest.interaction.response,
          session_id: receiptRequest.session_id,
        }),
      });

      if (!demoResponse.ok) {
        const errorText = await demoResponse.text();
        console.error('Backend receipt generation failed:', errorText);
        return NextResponse.json(
          { error: 'Failed to generate receipt', details: errorText },
          { status: 500 }
        );
      }

      const demoData = await demoResponse.json();
      return NextResponse.json({
        success: true,
        receipt_id: demoData.data?.receipt?.self_hash || demoData.data?.self_hash || `receipt-${Date.now()}`,
        ...demoData.data?.receipt || demoData.data || demoData,
        verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/dashboard/verify?hash=${demoData.data?.receipt?.self_hash || demoData.data?.self_hash}`,
      });
    }

    const data = await response.json();
    const receipt = data.data?.receipt || data.data || data;

    return NextResponse.json({
      success: true,
      receipt_id: receipt.self_hash || receipt._id || `receipt-${Date.now()}`,
      ...receipt,
      verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/dashboard/verify?hash=${receipt.self_hash}`,
    });
  } catch (error) {
    console.error('Receipt minting error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
