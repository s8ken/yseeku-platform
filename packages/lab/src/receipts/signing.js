const crypto = require('crypto')

function getKeyPair() {
  const pub = process.env.SONATE_PUBLIC_KEY
  const priv = process.env.SONATE_PRIVATE_KEY
  if (pub && priv) {
    return {
      publicKey: Buffer.from(pub, 'base64'),
      privateKey: Buffer.from(priv, 'base64')
    }
  }
  // Demo dev keys (generated per run for local use only)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  return { publicKey, privateKey }
}

function sha256String(s) {
  return 'sha256:' + crypto.createHash('sha256').update(s).digest('hex')
}

function signContent(contentStr) {
  const { privateKey, publicKey } = getKeyPair()
  const hashHex = sha256String(contentStr)
  const sig = crypto.sign(null, Buffer.from(hashHex), privateKey)
  return { contentHash: hashHex, signature: sig.toString('base64'), publicKey: toBase64(publicKey) }
}

function verifySignature(contentStr, signatureB64, publicKeyB64) {
  try {
    const contentHash = sha256String(contentStr)
    const sig = Buffer.from(signatureB64 || '', 'base64')
    const pub = Buffer.from(publicKeyB64 || '', 'base64')
    const ok = crypto.verify(null, Buffer.from(contentHash), pub, sig)
    return { hashOk: true, signatureOk: ok, computedHash: contentHash }
  } catch (e) {
    return { hashOk: false, signatureOk: false, error: e?.message || 'verify_failed' }
  }
}

function toBase64(key) {
  if (Buffer.isBuffer(key)) return key.toString('base64')
  try { return key.export({ type: 'spki', format: 'der' }).toString('base64') } catch { return '' }
}

module.exports = { sha256String, signContent, verifySignature }