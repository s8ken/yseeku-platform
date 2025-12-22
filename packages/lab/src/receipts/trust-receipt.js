const { signContent } = require('./signing')
const { scorePrinciples } = require('./principles')

function createReceipt(turn, principleScores, extra={}){
  const contentStr = JSON.stringify({ speaker: turn.speaker, content: turn.content || '' })
  const sig = signContent(contentStr)
  const trustScore = scorePrinciples(principleScores)
  const receipt = {
    receiptId: `tr_${Date.now()}_${Math.random().toString(16).slice(2,8)}`,
    timestamp: new Date(turn.timestamp || Date.now()).toISOString(),
    eventType: 'ai_generation',
    content: { speaker: turn.speaker, model: extra.model || 'unknown' },
    trustScore,
    cryptography: {
      contentHash: sig.contentHash,
      signature: sig.signature,
      publicKey: sig.publicKey,
      verifiable: true
    }
  }
  return receipt
}

module.exports = { createReceipt }