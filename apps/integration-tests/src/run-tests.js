function assert(c, m){ if(!c) throw new Error(m) }

async function testReceiptFlow(){
  const core = require('@sonate/core')
  const detect = require('@sonate/detect')

  const detector = new detect.EnhancedDetector()
  const { assessment } = await detector.analyzeContent({ content: 'We verify and validate with secure boundaries and ethical clarity. Innovation 2025, 42% evidence.' })

  assert(assessment.overallScore >= 40, 'overallScore too low')

  const { privateKey, publicKey } = await core.generateKeyPair()
  const payload = JSON.stringify({ id: assessment.id, overall: assessment.overallScore })
  const sig = await core.signPayload(payload, privateKey)
  const ok = await core.verifySignature(sig, payload, publicKey)
  assert(ok, 'signature verify failed')

  const prev = require('crypto').createHash('sha256').update('genesis_session-xyz').digest('hex')
  const ts = Date.now()
  const h = core.hashChain(prev, payload, ts, sig)
  assert(/^[a-f0-9]{64}$/.test(h), 'hashChain invalid')

  console.log('PASS: Integration receipt flow')
}

async function main(){
  try{
    await testReceiptFlow()
  }catch(e){
    console.error('FAIL:', e && e.message || e)
    process.exitCode = 1
    return
  }
}

main()