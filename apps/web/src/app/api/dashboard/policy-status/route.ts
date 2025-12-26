import { NextResponse } from 'next/server'
import { evaluatePolicy, defaultPolicy } from '../../../../lib/policy'

export async function GET() {
  const scores = { CONSENT_ARCHITECTURE: 10, ETHICAL_OVERRIDE: 9, INSPECTION_MANDATE: 8, CONTINUOUS_VALIDATION: 8, RIGHT_TO_DISCONNECT: 7, MORAL_RECOGNITION: 7 } as any
  const result = evaluatePolicy(scores, defaultPolicy)
  return NextResponse.json({ overallPass: result.overallPass, violations: result.violations })
}
