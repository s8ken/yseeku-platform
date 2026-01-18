const { createHash, generateKeyPairSync, sign, verify } = require('crypto');

function calculateHash(payload) {
  const json = JSON.stringify({
    version: payload.version,
    session_id: payload.session_id,
    timestamp: payload.timestamp,
    mode: payload.mode,
    ciq_metrics: payload.ciq_metrics,
    previous_hash: payload.previous_hash || null,
  });
  return createHash('sha256').update(json).digest('hex');
}

function main() {
  const now = Date.now();
  const receipt = {
    version: '1.0',
    session_id: `sess_${now}`,
    timestamp: now,
    mode: 'constitutional',
    ciq_metrics: { clarity: 0.92, integrity: 0.97, quality: 0.94 },
    previous_hash: null,
  };

  const self_hash = calculateHash(receipt);
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  const message = Buffer.from(self_hash, 'hex');
  const signature = sign(null, message, privateKey);

  const signature_hex = signature.toString('hex');
  const signature_base64 = signature.toString('base64');

  const isValid = verify(null, message, publicKey, signature);

  const public_key_pem = publicKey.export({ type: 'spki', format: 'pem' });
  const output = {
    ...receipt,
    self_hash,
    signature_hex,
    signature_base64,
    public_key_pem,
    signature_valid: isValid,
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
