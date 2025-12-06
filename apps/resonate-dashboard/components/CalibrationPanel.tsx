"use client"
import { useState } from 'react'

export default function CalibrationPanel({ caseId }: { caseId: string }){
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<string>('')
  async function send(action: string){
    setStatus('')
    const res = await fetch('/api/calibration/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, action, reason })
    })
    const data = await res.json()
    setStatus(res.ok ? 'Saved' : `Error: ${data.error||'unknown'}`)
  }
  return (
    <div className="space-y-3">
      <div className="text-white text-lg">Calibration</div>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2 text-white" placeholder="Annotation / reason" />
      <div className="flex gap-2">
        <button onClick={()=>send('approve_flag')} className="bg-cyan text-black rounded px-3 py-2">Approve Flag</button>
        <button onClick={()=>send('downgrade_flag')} className="bg-yellow-500 text-black rounded px-3 py-2">Downgrade</button>
        <button onClick={()=>send('promote_golden')} className="bg-green-500 text-black rounded px-3 py-2">Promote to Golden</button>
      </div>
      {status && <div className="text-sm text-[#bbb]">{status}</div>}
    </div>
  )
}