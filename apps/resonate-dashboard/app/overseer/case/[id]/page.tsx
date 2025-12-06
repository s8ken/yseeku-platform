import { findConversationById } from '@/lib/reports'
import RadarChart from '@/components/RadarChart'
import VelocitySparkline from '@/components/VelocitySparkline'
import Link from 'next/link'

function resonanceNumeric(counts: Record<string, number>){
  const map: Record<string, number> = { STRONG: 8, ADVANCED: 9, BREAKTHROUGH: 10 }
  let total = 0, sum = 0
  for(const k of Object.keys(counts||{})){
    const v = counts[k]||0
    total += v
    sum += v * (map[k]||8)
  }
  if (total === 0) return 8
  return +(sum/total).toFixed(2)
}

export default async function Page({ params }: { params: { id: string } }){
  const conv = findConversationById(params.id)
  if (!conv) {
    return (
      <main className="min-h-screen p-12">
        <Link href="/overseer" className="text-cyan underline">Back</Link>
        <h1 className="text-4xl mt-6">Case not found</h1>
      </main>
    )
  }
  const fiveDData = {
    reality: conv.fiveD.realityIndexAvg,
    trust: Math.min(10, conv.fiveD.trustProtocolRates.PASS > 0 ? 9.5 : 8.0),
    ethical: conv.fiveD.ethicalAlignmentAvg,
    resonance: resonanceNumeric(conv.fiveD.resonanceQualityCounts),
    canvas: conv.fiveD.canvasParityAvg/10
  }
  const velocities = (conv.velocitySeries||[]).length>0 ? conv.velocitySeries : (conv.velocitySpikes||[]).map(s=>s.velocity)
  if (velocities.length === 0) velocities.push(conv.maxPhaseShiftVelocity, conv.maxIntraVelocity)
  const identities = conv.identityStabilitySeries||[]
  const quotes = conv.directQuotes||[]
  const firstReceipt = conv.receipts?.firstReceipt
  const lastReceipt = conv.receipts?.lastReceipt
  return (
    <main className="min-h-screen p-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{conv.originalFileName}</h1>
          <p className="text-[#bbb]">{conv.aiSystem}</p>
        </div>
        <Link href="/overseer" className="text-cyan underline">Back</Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">5D Profile</div>
          <RadarChart data={fiveDData} />
        </div>
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Velocity</div>
          <div className="space-y-2">
            <div className="text-sm text-[#bbb]">Max Phase: {conv.maxPhaseShiftVelocity.toFixed(2)}</div>
            <div className="text-sm text-[#bbb]">Max Intra: {conv.maxIntraVelocity.toFixed(2)}</div>
          </div>
          <div className="mt-4">
            <VelocitySparkline points={velocities} />
          </div>
        </div>
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Identity Stability</div>
          <div className="space-y-2">
            <div className="text-sm text-[#bbb]">Points: {identities.length}</div>
          </div>
          <div className="mt-4">
            <VelocitySparkline points={identities} />
          </div>
        </div>
        <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
          <div className="text-white text-lg mb-4">Flags</div>
          <div className="space-y-2 text-sm text-[#ddd]">
            <div>Priority: {conv.flags.priority.toUpperCase()}</div>
            <div>Reasons: {conv.flags.reasons.join('; ')}</div>
            <div>Trust: PASS {conv.fiveD.trustProtocolRates.PASS} • PARTIAL {conv.fiveD.trustProtocolRates.PARTIAL} • FAIL {conv.fiveD.trustProtocolRates.FAIL}</div>
            <div>Golden: {conv.golden ? 'Yes' : 'No'}</div>
            <div>Emergence: {conv.emergence ? 'Yes' : 'No'}</div>
            {firstReceipt && (
              <div className="mt-2">
                <div className="text-white">Trust Receipt</div>
                <pre className="text-xs text-[#aaa] bg-[#111] p-2 rounded overflow-auto">{JSON.stringify(firstReceipt, null, 2)}</pre>
                <form method="post" action="/api/receipts/verify">
                  <input type="hidden" name="receipt" value={JSON.stringify(firstReceipt)} />
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[#333] bg-[#0b0b0b] p-6">
        <div className="text-white text-lg mb-4">Direct Quotes</div>
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <div className="text-[#888]">No direct quotes captured</div>
          ) : quotes.map((q, i)=> (
            <div key={i} className="text-sm text-[#ddd]">“{q}”</div>
          ))}
        </div>
      </div>
    </main>
  )
}