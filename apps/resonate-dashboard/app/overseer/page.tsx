import fs from 'fs'
import path from 'path'
import Link from 'next/link'

function parseCSV(content: string){
  const lines = content.split(/\r?\n/).filter(l=>l.trim().length>0)
  if (lines.length === 0) return [] as any[]
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

export default async function Overseer() {
  const reportsDir = path.resolve(process.cwd(), '..', '..', 'packages', 'lab', 'reports')
  const csv = fs.readFileSync(path.join(reportsDir, 'overseer-manual-index.csv'), 'utf-8')
  const entries = parseCSV(csv)
  const totals = {
    conversations: entries.length,
    critical: entries.filter((e:any)=>String(e.priority).toLowerCase()==='critical').length,
    high: entries.filter((e:any)=>String(e.priority).toLowerCase()==='high').length,
    medium: entries.filter((e:any)=>String(e.priority).toLowerCase()==='medium').length,
    low: entries.filter((e:any)=>String(e.priority).toLowerCase()==='low').length,
    golden: entries.filter((e:any)=>String(e.golden).toLowerCase()==='yes').length,
  }
  const bySystem: Record<string, number> = {}
  for(const e of entries){
    const sys = (e as any).system || 'Unknown'
    bySystem[sys] = (bySystem[sys]||0)+1
  }
  const topRed = entries.filter((e:any)=>String(e.priority).toLowerCase()==='critical').slice(0,15)
  const topGolden = entries.filter((e:any)=>String(e.golden).toLowerCase()==='yes').slice(0,8)

  return (
    <main className="min-h-screen p-12 space-y-8">
      <h1 className="text-6xl font-bold">Resonate Overseer</h1>
      <p className="text-2xl text-cyan">{totals.conversations} conversations • critical {totals.critical} • high {totals.high} • golden {totals.golden}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(totals).map(([k,v])=> (
          <div key={k} className="rounded-xl border border-[#333] bg-[#111] p-4">
            <div className="text-sm text-[#aaa]">{k}</div>
            <div className="text-2xl font-semibold text-white">{v as any}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
        <div className="text-white text-lg mb-4">By System</div>
        <div className="space-y-3">
          {Object.entries(bySystem).map(([label, value])=> (
            <div key={label} className="flex items-center gap-3">
              <div className="w-32 text-sm text-[#bbb]">{label}</div>
              <div className="flex-1 h-3 rounded bg-[#222]">
                <div className="h-3 rounded bg-[#4ade80]" style={{ width: `${Math.round(((value as number)/entries.length)*100)}%` }} />
              </div>
              <div className="w-12 text-right text-sm text-white">{value as number}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Top 15 Critical</div>
          <div className="space-y-4">
            {topRed.map((r:any, idx:number)=> (
              <Link key={idx} href={`/overseer/case/${encodeURIComponent(r.file)}`} className="rounded border border-[#333] p-4 block hover:bg-[#111]">
                <div className="text-white font-medium">{r.file}</div>
                <div className="text-[#bbb] text-sm">{r.system}</div>
                <div className="mt-2 text-[#ddd] text-sm">{r.reasons}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Top 8 Golden</div>
          <div className="space-y-4">
            {topGolden.map((r:any, idx:number)=> (
              <Link key={idx} href={`/overseer/case/${encodeURIComponent(r.file)}`} className="rounded border border-[#333] p-4 block hover:bg-[#111]">
                <div className="text-white font-medium">{r.file}</div>
                <div className="text-[#bbb] text-sm">{r.system}</div>
                <div className="mt-2 text-[#ddd] text-sm">{r.reasons}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
