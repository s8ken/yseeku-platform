import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function ledgerPath(){
  const dir = path.resolve(process.cwd(), '..', '..', 'packages', 'lab', 'reports')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'calibration-ledger.json')
}

export async function POST(req: Request){
  try{
    const body = await req.json()
    const { caseId, action, reason, user } = body || {}
    if (!caseId || !action) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    const entry = {
      caseId,
      action,
      reason: reason || '',
      user: user || 'operator',
      timestamp: new Date().toISOString()
    }
    const p = ledgerPath()
    let arr: any[] = []
    if (fs.existsSync(p)){
      try { arr = JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { arr = [] }
    }
    arr.push(entry)
    fs.writeFileSync(p, JSON.stringify(arr, null, 2))
    return NextResponse.json({ ok: true, entry })
  } catch (e: any){
    return NextResponse.json({ error: e?.message || 'calibration_failed' }, { status: 500 })
  }
}