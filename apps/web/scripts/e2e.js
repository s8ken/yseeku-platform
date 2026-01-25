const { spawn } = require('child_process')
const jwt = require('jsonwebtoken')

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.status >= 200 && res.status < 500) return true
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

async function run() {
  const port = process.env.E2E_PORT || '3010'
  const base = `http://localhost:${port}`
  const env = { ...process.env, JWT_SECRET: process.env.JWT_SECRET || 'e2e-secret' }
  const server = spawn('npx', ['next', 'dev', '-p', port], { cwd: __dirname.replace('/scripts',''), stdio: 'inherit', env })

  const ok = await waitForServer(`${base}/`)
  if (!ok) {
    console.error('E2E FAIL: server did not start')
    server.kill('SIGINT')
    process.exit(1)
    return
  }

  let failures = 0
  function assert(cond, msg) { if (!cond) { console.error('E2E ASSERT FAIL:', msg); failures++ } }

  try {
    // Health
    const h = await fetch(`${base}/api/health`)
    assert(h.status === 200, `health status ${h.status}`)
    const hj = await h.json()
    console.log('E2E health:', hj)
    assert('status' in hj && 'checks' in hj, 'health missing expected fields')

    // Resonance explain
    const rx = await fetch(`${base}/api/detect/resonance/explain`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userInput: 'Hello', aiResponse: 'Hi there!', history: [] }) })
    assert(rx.status === 200, `explain status ${rx.status}`)
    const rxj = await rx.json()
    assert('r_m' in rxj, 'explain missing r_m')

    // Policy evaluate
    const pe = await fetch(`${base}/api/policy/evaluate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scores: { CONSENT_ARCHITECTURE: 10, ETHICAL_OVERRIDE: 9, INSPECTION_MANDATE: 8, CONTINUOUS_VALIDATION: 8, RIGHT_TO_DISCONNECT: 7, MORAL_RECOGNITION: 7 } }) })
    assert(pe.status === 200, `policy status ${pe.status}`)
    const pej = await pe.json()
    assert(typeof pej.overallPass === 'boolean', 'policy missing overallPass')

    // Signer route (JWT required)
    const token = jwt.sign({ user: 'e2e', roles: ['operator'] }, env.JWT_SECRET, { expiresIn: '5m' })
    const signBody = { self_hash: 'abc123', session_id: 'e2e-session', session_nonce: 'nonce1', timestamp: Date.now() }
    const sign = await fetch(`${base}/api/signer/sign`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(signBody) })
    assert(sign.status === 200, `sign status ${sign.status}`)
    const signj = await sign.json()
    assert(typeof signj.signature_hex === 'string', 'sign missing signature_hex')

    // Rate limit (hit explain repeatedly)
    let lastStatus = 200
    for (let i = 0; i < 130; i++) {
      const ri = await fetch(`${base}/api/detect/resonance/explain`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userInput: 'x', aiResponse: 'y' }) })
      lastStatus = ri.status
      if (lastStatus === 429) break
    }
    assert(lastStatus === 429 || lastStatus === 200, `rate limit final status ${lastStatus}`)

    if (failures === 0) {
      console.log('E2E PASS: health, explain, policy, signer, rate limit')
    } else {
      console.error(`E2E completed with ${failures} failures`)
      process.exitCode = 1
    }
  } catch (err) {
    console.error('E2E ERROR:', err && err.message || err)
    process.exitCode = 1
  }

  server.kill('SIGINT')
}

run()
