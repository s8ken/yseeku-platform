import { TrustProtocol, TRUST_PRINCIPLES, SymbiScorer, hashChain, generateKeyPair, signPayload, verifySignature, TrustReceipt, canonicalizeJSON, verifySecp256k1Signature, verifyRSASignature, verifyEd25519Signature, timingSafeEqual, generateSecureRandom, verifyCredentialProof } from '../index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testTrustProtocolCriticalCap() {
  const protocol = new TrustProtocol();
  const scores: Record<keyof typeof TRUST_PRINCIPLES, number> = {
    CONSENT_ARCHITECTURE: 0,
    INSPECTION_MANDATE: 10,
    CONTINUOUS_VALIDATION: 10,
    ETHICAL_OVERRIDE: 10,
    RIGHT_TO_DISCONNECT: 10,
    MORAL_RECOGNITION: 10,
  };

  const result = protocol.calculateTrustScore(scores);
  assert(result.overall === 0, 'Critical cap failed: overall should be 0');
  assert(result.violations.includes('CONSENT_ARCHITECTURE'), 'Violation list missing CONSENT_ARCHITECTURE');
}

async function testTrustProtocolWeightedSum() {
  const protocol = new TrustProtocol();
  const scores: Record<keyof typeof TRUST_PRINCIPLES, number> = {
    CONSENT_ARCHITECTURE: 10,
    INSPECTION_MANDATE: 10,
    CONTINUOUS_VALIDATION: 10,
    ETHICAL_OVERRIDE: 10,
    RIGHT_TO_DISCONNECT: 10,
    MORAL_RECOGNITION: 10,
  };
  const result = protocol.calculateTrustScore(scores);
  assert(result.overall === 10, `Weighted sum incorrect: expected 10, got ${result.overall}`);
}

async function testSymbiScorerEndToEnd() {
  const scorer = new SymbiScorer();
  const score = scorer.scoreInteraction({
    user_consent: true,
    ai_explanation_provided: true,
    decision_auditability: true,
    human_override_available: true,
    disconnect_option_available: true,
    moral_agency_respected: true,
    reasoning_transparency: 9,
    ethical_considerations: ['privacy', 'fairness']
  });
  assert(score.overall >= 8, `End-to-end scoring too low: ${score.overall}`);
}

async function testHashChain() {
  const prev = 'a'.repeat(64);
  const payload = JSON.stringify({ id: '123', action: 'test' });
  const timestamp = Date.now();
  const signature = 'b'.repeat(128);
  const h = hashChain(prev, payload, timestamp, signature);
  assert(/^[a-f0-9]{64}$/.test(h), 'HashChain must produce 64-char hex sha256');
}

async function testSignAndVerify() {
  const { privateKey, publicKey } = await generateKeyPair();
  const payload = 'test-payload';
  const sig = await signPayload(payload, privateKey);
  const valid = await verifySignature(sig, payload, publicKey);
  assert(valid, 'Ed25519 signature verification failed');
}

async function testTrustReceiptChainAndVerify() {
  const { privateKey, publicKey } = await generateKeyPair();
  const r1 = new TrustReceipt({
    version: '1.0',
    session_id: 's1',
    timestamp: Date.now(),
    mode: 'constitutional',
    ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 },
  });
  await r1.sign(privateKey);
  assert(await r1.verify(publicKey), 'Receipt 1 signature verification failed');

  const r2 = new TrustReceipt({
    version: '1.0',
    session_id: 's1',
    timestamp: Date.now() + 1,
    mode: 'directive',
    ciq_metrics: { clarity: 0.8, integrity: 0.8, quality: 0.8 },
    previous_hash: r1.self_hash,
  });
  await r2.sign(privateKey);
  assert(r2.verifyChain(r1), 'Hash chain integrity failed');

  const json = r2.toJSON();
  const r2copy = TrustReceipt.fromJSON(json);
  assert(r2copy.self_hash === r2.self_hash, 'fromJSON/toJSON mismatch');
}

async function testCanonicalizeJSON() {
  const a = { b: 2, a: 1 };
  const b = { a: 1, b: 2 };
  const ca = canonicalizeJSON(a);
  const cb = canonicalizeJSON(b);
  assert(ca === cb, 'JCS canonicalization should be deterministic');
  let threw = false;
  try { canonicalizeJSON(a, { method: 'URDNA2015' }); } catch { threw = true; }
  assert(threw, 'URDNA2015 should throw (not implemented)');
}

async function testSecp256k1Verification() {
  const secp = await import('@noble/secp256k1');
  const priv = secp.utils.randomPrivateKey();
  const pub = secp.getPublicKey(priv);
  const data = { x: 1 };
  const canonical = canonicalizeJSON(data);
  const pubHex = Buffer.from(pub as any).toString('hex');
  // Use an invalid random signature to exercise the code path
  const invalidSigHex = Buffer.from(secp.utils.randomPrivateKey()).toString('hex');
  const res = await verifySecp256k1Signature(data, invalidSigHex, pubHex);
  assert(res.valid === false, 'secp256k1 invalid signature should fail');
}

async function testRSASignatureVerification() {
  const crypto = await import('crypto');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const data = { demo: true };
  const canonical = canonicalizeJSON(data);
  const message = Buffer.from(canonical, 'utf8');
  const sig = crypto.sign('sha256', message, { key: privateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST });
  const res = await verifyRSASignature(data, sig.toString('base64'), publicKey.export({ type: 'pkcs1', format: 'pem' }).toString());
  assert(res.valid, 'RSA verification failed');
}

async function testEd25519MultibaseInvalid() {
  const data = { hello: 'world' };
  const res = await verifyEd25519Signature(data, 'xInvalid', 'xInvalid');
  assert(!res.valid, 'Invalid multibase should fail');
}

async function testTrustReceiptVerifyWithoutSignature() {
  const r = new TrustReceipt({
    version: '1.0',
    session_id: 's2',
    timestamp: Date.now(),
    mode: 'directive',
    ciq_metrics: { clarity: 0.5, integrity: 0.5, quality: 0.5 },
  });
  const { publicKey } = await generateKeyPair();
  const ok = await r.verify(publicKey);
  assert(!ok, 'Verify should fail when no signature present');
}

async function testTimingSafeEqualMismatch() {
  const a = 'abcd';
  const b = 'abc';
  assert(!timingSafeEqual(a, b), 'Timing-safe equal should return false on length mismatch');
}

async function testGenerateSecureRandomLength() {
  const bytes = generateSecureRandom(32);
  assert(bytes.length === 32, 'generateSecureRandom should return requested length');
}

async function testVerifyCredentialProofUnsupported() {
  const credential = {
    id: 'cred-1',
    subject: { foo: 'bar' },
    proof: { type: 'UnknownSignature2025', proofValue: 'abc', verificationMethod: 'xyz' }
  };
  const res = await verifyCredentialProof(credential);
  assert(!res.valid && (res.error || '').includes('Unsupported'), 'verifyCredentialProof should fail for unsupported type');
}

async function main() {
  const tests = [
    ['TrustProtocol critical cap', testTrustProtocolCriticalCap],
    ['TrustProtocol weighted sum', testTrustProtocolWeightedSum],
    ['SymbiScorer end-to-end', testSymbiScorerEndToEnd],
    ['HashChain output format', testHashChain],
    ['Ed25519 sign/verify', testSignAndVerify],
    ['TrustReceipt chain/sign/verify', testTrustReceiptChainAndVerify],
    ['Canonicalize JSON JCS and URDNA error', testCanonicalizeJSON],
    ['secp256k1 signature verify', testSecp256k1Verification],
    ['RSA signature verify', testRSASignatureVerification],
    ['Ed25519 multibase invalid', testEd25519MultibaseInvalid],
    ['TrustReceipt verify without signature', testTrustReceiptVerifyWithoutSignature],
    ['Timing-safe equal mismatch', testTimingSafeEqualMismatch],
    ['Secure random length', testGenerateSecureRandomLength],
    ['Credential proof unsupported', testVerifyCredentialProofUnsupported],
  ] as const;

  const results: string[] = [];
  for (const [name, fn] of tests) {
    try {
      await fn();
      results.push(`PASS: ${name}`);
    } catch (e: any) {
      results.push(`FAIL: ${name} -> ${e?.message || e}`);
      console.error(results.join('\n'));
      process.exitCode = 1;
      return;
    }
  }
  console.log(results.join('\n'));
}

main();
