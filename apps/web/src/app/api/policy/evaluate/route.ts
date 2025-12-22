import { NextResponse } from 'next/server';
import { evaluatePolicy, defaultPolicy } from '../../../../lib/policy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const scores = body?.scores || {};
    const policy = body?.policy || defaultPolicy;
    const result = evaluatePolicy(scores, policy);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload', message: (err as Error).message }, { status: 400 });
  }
}
