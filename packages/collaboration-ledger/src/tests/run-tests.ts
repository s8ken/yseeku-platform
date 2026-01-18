import { SYMBICollaborationLedger } from '../index';

function assert(condition: boolean, message?: string) {
  if (!condition) {throw new Error(message || 'Assertion failed');}
}

(function main() {
  const ledger = new SYMBICollaborationLedger('project-001');
  const agentId = ledger.registerAgent({
    agentId: 'gpt-5',
    provider: 'openai',
    version: '5.0',
    timestamp: Date.now(),
    verification: { method: 'provider_signed', proof: 'sig' },
  });

  const w1 = ledger.logWorkUnit(agentId, 'input A', 'output A');
  const w2 = ledger.logWorkUnit(agentId, 'input B', 'output B');
  assert(ledger.verifyWorkUnit(w1.workId), 'Work unit w1 verification failed');
  assert(ledger.verifyWorkUnit(w2.workId), 'Work unit w2 verification failed');

  const manifest = ledger.generateManifest();
  // Basic checks
  console.log('Merkle Root:', manifest.merkleRoot);
  assert(
    typeof manifest.merkleRoot === 'string' && manifest.merkleRoot.length > 0,
    'Invalid merkle root'
  );

  // Human signature verification (Ed25519)
  const crypto = require('crypto');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const humanId = 'human-001';
  const payload = `${humanId}:accept:${w2.workId}`;
  const msgHash = crypto.createHash('sha256').update(payload).digest();
  const signature = crypto.sign(null, msgHash, privateKey).toString('base64');
  const pubDerB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  process.env.SONATE_HUMAN_PUBKEYS_JSON = JSON.stringify({ [humanId]: pubDerB64 });
  const decision = ledger.logDecision(humanId, signature, 'accept', w2.workId, 'Looks good', [
    w2.workId,
  ]);
  assert(decision.humanId === humanId, 'Decision should record human id');
  console.log('All tests passed');
})();
