async function run() {
  const base = process.env.BASE_URL || 'http://localhost:3000'
  const receipt = {
    version: '1.0',
    session_id: 'example-session',
    timestamp: Date.now(),
    mode: 'constitutional',
    ciq_metrics: { clarity: 0.92, integrity: 0.91, quality: 0.93 },
    previous_hash: null,
    signature: ''
  }
  const r = await fetch(`${base}/api/receipts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(receipt) })
  const j = await r.json()
  console.log('POST /api/receipts =>', r.status, j)
}

run().catch(e => { console.error(e); process.exitCode = 1 })
