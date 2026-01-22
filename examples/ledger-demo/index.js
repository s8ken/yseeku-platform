const { SONATECollaborationLedger, writeSymbiFile } = require('../../packages/collaboration-ledger/dist')

async function run() {
  const ledger = new SONATECollaborationLedger('project-001')

  const claudeId = ledger.registerAgent({
    agentId: 'claude-3.7-sonnet',
    provider: 'anthropic',
    version: '3.7',
    timestamp: Date.now(),
    verification: { method: 'provider_signed', proof: 'anthropic_sig_abc123' }
  })

  const gptId = ledger.registerAgent({
    agentId: 'gpt-5',
    provider: 'openai',
    version: '5.0',
    timestamp: Date.now(),
    verification: { method: 'provider_signed', proof: 'openai_sig_xyz789' }
  })

  const w1 = ledger.logWorkUnit(
    claudeId,
    'Design a portable collaboration ledger for multi-agent systems',
    'Here is a design for SONATE Collaboration Ledger...',
    { branchId: 'main', metadata: { summary: 'initial design' } }
  )
  const w2 = ledger.logWorkUnit(
    gptId,
    'Critique this design for security vulnerabilities',
    'The design has 3 potential vulnerabilities...',
    { branchId: 'experiment-a', parentWorkId: w1.workId, metadata: { summary: 'security critique' } }
  )

  ledger.logDecision(
    '0xYourWalletAddress',
    'signed_message_here',
    'accept',
    w2.workId,
    'Security feedback is valid and actionable',
    [w1.workId, w2.workId]
  )

  const { manifest } = ledger.exportToPortable()
  writeSymbiFile('./examples/ledger-demo/project-001.symbi', manifest)
  console.log('Merkle Root:', manifest.merkleRoot)
  console.log('Wrote examples/ledger-demo/project-001.symbi')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
