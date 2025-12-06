import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { headers } from 'next/headers'

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
  // Basic server-side filter/search via query params
  const hdrs = headers()
  const url = new URL(hdrs.get('x-url') || 'http://localhost')
  const qPriority = url.searchParams.get('priority')?.toLowerCase()
  const qSystem = url.searchParams.get('system')
  const qSearch = url.searchParams.get('q')?.toLowerCase()
  const filtered = entries.filter((e:any)=>{
    const okP = qPriority ? String(e.priority).toLowerCase()===qPriority : true
    const okS = qSystem ? String(e.system)===qSystem : true
    const okQ = qSearch ? (String(e.file).toLowerCase().includes(qSearch) || String(e.reasons).toLowerCase().includes(qSearch)) : true
    return okP && okS && okQ
  })
  const totals = {
    conversations: filtered.length,
    critical: filtered.filter((e:any)=>String(e.priority).toLowerCase()==='critical').length,
    high: filtered.filter((e:any)=>String(e.priority).toLowerCase()==='high').length,
    medium: filtered.filter((e:any)=>String(e.priority).toLowerCase()==='medium').length,
    low: filtered.filter((e:any)=>String(e.priority).toLowerCase()==='low').length,
    golden: filtered.filter((e:any)=>String(e.golden).toLowerCase()==='yes').length,
  }
  const bySystem: Record<string, number> = {}
  for(const e of filtered){
    const sys = (e as any).system || 'Unknown'
    bySystem[sys] = (bySystem[sys]||0)+1
  }
  const topRed = filtered.filter((e:any)=>String(e.priority).toLowerCase()==='critical').slice(0,15)
  const topGolden = filtered.filter((e:any)=>String(e.golden).toLowerCase()==='yes').slice(0,8)

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
      <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-4 flex gap-4 items-end">
        <form action="/overseer" method="get" className="contents">
          <div>
            <label className="text-sm text-[#bbb]">Priority</label>
            <select name="priority" className="bg-[#111] border border-[#333] rounded p-2 text-white">
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[#bbb]">System</label>
            <select name="system" className="bg-[#111] border border-[#333] rounded p-2 text-white">
              <option value="">All</option>
              {Object.keys(bySystem).map((s)=> (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm text-[#bbb]">Search</label>
            <input type="text" name="q" className="w-full bg-[#111] border border-[#333] rounded p-2 text-white" placeholder="file or reason" />
          </div>
          <button className="bg-cyan text-black rounded px-4 py-2">Apply</button>
        </form>
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