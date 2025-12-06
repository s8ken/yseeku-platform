import React from 'react'

async function load(){
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL||''}/api/reports/overview`, { cache: 'no-store' })
  const data = await res.json()
  return data
}

function StatCard({ title, value }: { title: string, value: string | number }){
  return (
    <div className="rounded-xl border border-[#333] bg-[#111] p-4 text-white">
      <div className="text-sm text-[#aaa]">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function Bar({ label, value, max }: { label: string, value: number, max: number }){
  const pct = max ? Math.round((value/max)*100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-sm text-[#bbb]">{label}</div>
      <div className="flex-1 h-3 rounded bg-[#222]">
        <div className="h-3 rounded bg-[#4ade80]" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-12 text-right text-sm text-white">{value}</div>
    </div>
  )
}

export default async function Page(){
  const { totals, bySystem, topRed, topGolden } = await load()
  const max = Math.max(...Object.values(bySystem))
  return (
    <div className="px-6 py-6 space-y-8">
      <h1 className="text-2xl font-semibold text-white">Archive Oversight Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Conversations" value={totals.conversations} />
        <StatCard title="Critical" value={totals.critical} />
        <StatCard title="High" value={totals.high} />
        <StatCard title="Medium" value={totals.medium} />
        <StatCard title="Low" value={totals.low} />
        <StatCard title="Golden" value={totals.golden} />
      </div>
      <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
        <div className="text-white text-lg mb-4">By System</div>
        <div className="space-y-3">
          {Object.entries(bySystem).map(([label, value])=> (
            <Bar key={label} label={label} value={value as number} max={max} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Top 15 Critical</div>
          <div className="space-y-4">
            {topRed.map((r:any, idx:number)=> (
              <div key={idx} className="rounded border border-[#333] p-4">
                <div className="text-white font-medium">{r.file}</div>
                <div className="text-[#bbb] text-sm">{r.system}</div>
                <div className="mt-2 text-[#ddd] text-sm">{r.reasons}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Top 8 Golden</div>
          <div className="space-y-4">
            {topGolden.map((r:any, idx:number)=> (
              <div key={idx} className="rounded border border-[#333] p-4">
                <div className="text-white font-medium">{r.file}</div>
                <div className="text-[#bbb] text-sm">{r.system}</div>
                <div className="mt-2 text-[#ddd] text-sm">{r.reasons}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}