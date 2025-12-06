import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function resolveReportsDir(){
  return path.resolve(process.cwd(), '..', '..', 'packages', 'lab', 'reports')
}

function parseCSV(content: string){
  const lines = content.split(/\r?\n/).filter(l=>l.trim().length>0)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(h=>h.trim())
  const rows = [] as any[]
  for (let i=1;i<lines.length;i++){
    const raw = lines[i]
    const cols = [] as string[]
    let buf = ''
    let inQuotes = false
    for (let j=0;j<raw.length;j++){
      const ch = raw[j]
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { cols.push(buf); buf=''; continue }
      buf += ch
    }
    cols.push(buf)
    const obj: any = {}
    header.forEach((h,idx)=>{ obj[h] = (cols[idx]||'').replace(/^"|"$/g,'') })
    rows.push(obj)
  }
  return rows
}

export async function GET(){
  try{
    const dir = resolveReportsDir()
    const csvPath = path.join(dir, 'overseer-manual-index.csv')
    const jsonPath = path.join(dir, 'archive-analysis-report.json')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const entries = parseCSV(csv)

    const totals = {
      conversations: entries.length,
      critical: entries.filter(e=>String(e.priority).toLowerCase()==='critical').length,
      high: entries.filter(e=>String(e.priority).toLowerCase()==='high').length,
      medium: entries.filter(e=>String(e.priority).toLowerCase()==='medium').length,
      low: entries.filter(e=>String(e.priority).toLowerCase()==='low').length,
      golden: entries.filter(e=>String(e.golden).toLowerCase()==='yes').length,
    }

    const bySystem: Record<string, number> = {}
    for(const e of entries){
      const sys = e.system || 'Unknown'
      bySystem[sys] = (bySystem[sys]||0)+1
    }

    const topRed = entries.filter(e=>String(e.priority).toLowerCase()==='critical').slice(0,15)
    const topGolden = entries.filter(e=>String(e.golden).toLowerCase()==='yes').slice(0,8)

    return NextResponse.json({ totals, bySystem, topRed, topGolden, entries, json })
  } catch (e:any){
    return NextResponse.json({ error: e?.message || 'Failed to load reports' }, { status: 500 })
  }
}