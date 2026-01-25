const { spawn } = require('child_process');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitFor(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    await wait(1000);
  }
  return false;
}

async function run() {
  const compose = spawn('docker', ['compose', 'up', '-d', 'mongo', 'backend'], { stdio: 'inherit' });
  await new Promise((resolve, reject) => {
    compose.on('exit', (code) => code === 0 ? resolve() : reject(new Error('docker compose up failed')));
  });

  const base = process.env.BACKEND_URL || 'http://localhost:3001';
  const healthy = await waitFor(`${base}/health`, 90000);
  if (!healthy) {
    console.error('Backend health not ready');
    process.exitCode = 1;
  }

  let failures = 0;
  function assert(cond, msg) { if (!cond) { console.error('E2E ASSERT FAIL:', msg); failures++; } }

  try {
    // DID document
    const did = await fetch(`${base}/.well-known/did.json`);
    assert(did.status === 200, `did.json status ${did.status}`);
    const didj = await did.json();
    assert(typeof didj.id === 'string', 'did.json missing id');

    // Guest token
    const guest = await fetch(`${base}/api/auth/guest`, { method: 'POST' });
    assert(guest.status === 201, `guest status ${guest.status}`);
    const gj = await guest.json();
    const token = gj?.data?.tokens?.accessToken || gj?.data?.tokens?.access_token;
    assert(typeof token === 'string', 'guest missing token');

    // Save trust receipt (protected)
    const receipt = {
      self_hash: `e2e_hash_${Date.now()}_${Math.random().toString(36).slice(2)}`.padEnd(18, 'x'),
      session_id: 'e2e-session',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 }
    };
    const save = await fetch(`${base}/api/trust/receipts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(receipt)
    });
    assert(save.status === 201 || save.status === 200, `save receipt status ${save.status}`);
    const savej = await save.json();
    const saved = savej?.data || savej?.receipt || {};

    // Verify receipt
    const verify = await fetch(`${base}/api/trust/receipts/${receipt.self_hash}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ receipt })
    });
    assert(verify.status === 200, `verify status ${verify.status}`);
    const vj = await verify.json();
    assert(vj?.success === true, 'verify did not return success');

    // Trust principles
    const principles = await fetch(`${base}/api/trust/principles`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert(principles.status === 200, `principles status ${principles.status}`);

    if (failures === 0) {
      console.log('Backend E2E PASS: did.json, guest, receipt save & verify, principles');
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Backend E2E ERROR:', err && err.message || err);
    process.exitCode = 1;
  }

  const down = spawn('docker', ['compose', 'down'], { stdio: 'inherit' });
  await new Promise((resolve) => down.on('exit', () => resolve()));
}

run();
