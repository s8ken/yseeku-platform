const { spawn } = require('child_process')

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
  const server = spawn('npx', ['next', 'start', '-p', port], { cwd: __dirname.replace('/scripts',''), stdio: 'inherit' })

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
    assert('dbConfigured' in hj, 'health missing dbConfigured')

    // Receipt save
    const receipt = {
      version: '1.0',
      session_id: 'e2e-session',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 },
      previous_hash: null,
      signature: ''
    }
    const r = await fetch(`${base}/api/receipts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(receipt) })
    assert(r.status === 200 || r.status === 503, `receipts status ${r.status}`)
    const headers = r.headers
    assert(headers.get('x-ratelimit-limit') !== null, 'missing rate limit headers')

    // Policy evaluate
    const pe = await fetch(`${base}/api/policy/evaluate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scores: { CONSENT_ARCHITECTURE: 10, ETHICAL_OVERRIDE: 9, INSPECTION_MANDATE: 8, CONTINUOUS_VALIDATION: 8, RIGHT_TO_DISCONNECT: 7, MORAL_RECOGNITION: 7 } }) })
    assert(pe.status === 200, `policy status ${pe.status}`)
    const pej = await pe.json()
    assert(typeof pej.overallPass === 'boolean', 'policy missing overallPass')

    // Auth
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'e2e', password: 'x', roles: ['viewer'], tenant_id: 'default' }) })
    assert(login.status === 200, `login status ${login.status}`)
    const lj = await login.json()
    assert(typeof lj.token === 'string', 'login missing token')
    const me = await fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${lj.token}` } })
    assert(me.status === 200, `me status ${me.status}`)

    // Rate limit
    let lastStatus = 200
    for (let i = 0; i < 35; i++) {
      const ri = await fetch(`${base}/api/receipts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(receipt) })
      lastStatus = ri.status
    }
    assert(lastStatus === 429 || lastStatus === 503, `rate limit final status ${lastStatus}`)

    if (failures === 0) {
      console.log('E2E PASS: health, receipts, rate limit')
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
