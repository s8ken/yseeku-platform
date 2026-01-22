const { SONATECollaborationLedger } = require('../dist/index.js');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

(function main() {
  const ledger = new SONATECollaborationLedger('project-001');
  const agentId = ledger.registerAgent({
    agentId: 'gpt-5',
    provider: 'openai',
    version: '5.0',
    timestamp: Date.now(),
    verification: { method: 'provider_signed', proof: 'sig' }
  });

  const w1 = ledger.logWorkUnit(agentId, 'input A', 'output A');
  const w2 = ledger.logWorkUnit(agentId, 'input B', 'output B');
  assert(ledger.verifyWorkUnit(w1.workId), 'Work unit w1 verification failed');
  assert(ledger.verifyWorkUnit(w2.workId), 'Work unit w2 verification failed');

  const manifest = ledger.generateManifest();
  console.log('Merkle Root:', manifest.merkleRoot);
  assert(typeof manifest.merkleRoot === 'string' && manifest.merkleRoot.length > 0, 'Invalid merkle root');
  console.log('All tests passed');
})();
