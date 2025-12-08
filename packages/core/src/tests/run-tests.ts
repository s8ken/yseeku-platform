import { TrustProtocol, TRUST_PRINCIPLES, SymbiScorer, hashChain, generateKeyPair, signPayload, verifySignature } from '../index';

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

async function main() {
  const tests = [
    ['TrustProtocol critical cap', testTrustProtocolCriticalCap],
    ['TrustProtocol weighted sum', testTrustProtocolWeightedSum],
    ['SymbiScorer end-to-end', testSymbiScorerEndToEnd],
    ['HashChain output format', testHashChain],
    ['Ed25519 sign/verify', testSignAndVerify],
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