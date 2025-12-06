import { NextResponse } from 'next/server'
import { loadReports } from '@/lib/reports'

export async function GET(req: Request){
  const url = new URL(req.url)
  const priority = url.searchParams.get('priority')?.toLowerCase()
  const system = url.searchParams.get('system')
  const { conversations } = loadReports()
  const filtered = conversations.filter(c => {
    const p = c.flags?.priority || 'low'
    const okP = priority ? p.toLowerCase() === priority : (p==='critical' || p==='high')
    const okS = system ? c.aiSystem === system : true
    return okP && okS
  })
  const lines = filtered.map(c => JSON.stringify({
    file: c.originalFileName,
    system: c.aiSystem,
    priority: c.flags.priority,
    reasons: c.flags.reasons,
    max_phase: c.maxPhaseShiftVelocity,
    max_intra: c.maxIntraVelocity,
    quotes: c.directQuotes||[],
  }))
  const body = lines.join('\n')
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } })
}