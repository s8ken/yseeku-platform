# Signed Receipt Verification

## Files
- `docs/examples/signed-receipt.json`

## Verify with Node.js (Ed25519)
- Save the snippet below as `scripts/verify_receipt_demo.js` and run `node scripts/verify_receipt_demo.js`
```
const { verify } = require('crypto');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('docs/examples/signed-receipt.json', 'utf8'));
const message = Buffer.from(data.self_hash, 'hex');
const signature = Buffer.from(data.signature_base64, 'base64');
const publicKeyPem = data.public_key_pem;

const isValid = verify(null, message, publicKeyPem, signature);
console.log('signature_valid', isValid);
```

## Verify with @noble/ed25519
- Use `packages/core/src/trust-receipt.ts` `verify(publicKey)` method when integrating in application code
- Convert PEM to raw public key where needed; keep Ed25519 key material in a vault/KMS in production

