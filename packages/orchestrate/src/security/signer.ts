import * as crypto from 'crypto'
import { getAuditLogger, AuditEventType } from './audit'
import { Env } from './env-config'

export interface SignRequest {
  selfHashHex: string
  sessionId: string
  sessionNonce: string
}

export interface SignResult {
  signatureHex: string
  signatureBase64: string
}

export interface SignerProvider {
  sign(message: Buffer): Promise<SignResult>
}

export class DevEd25519Signer implements SignerProvider {
  privateKey: crypto.KeyObject

  constructor() {
    const privB64 = process.env.SONATE_PRIVATE_KEY || ''
    if (privB64) {
      const der = Buffer.from(privB64, 'base64')
      this.privateKey = crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' })
    } else {
      const { privateKey } = crypto.generateKeyPairSync('ed25519')
      this.privateKey = privateKey
    }
  }

  async sign(message: Buffer): Promise<SignResult> {
    const sig = crypto.sign(null, message, this.privateKey)
    return { signatureHex: sig.toString('hex'), signatureBase64: sig.toString('base64') }
  }
}

export class AuditWrappedSigner implements SignerProvider {
  constructor(private inner: SignerProvider) {}

  async sign(message: Buffer): Promise<SignResult> {
    const audit = getAuditLogger()
    const result = await this.inner.sign(message)
    await audit.log(
      AuditEventType.RESOURCE_CREATED,
      'signer.sign',
      'success',
      {
        details: { algorithm: 'ed25519' }
      }
    )
    return result
  }
}

export function bindingMessage(input: SignRequest): Buffer {
  const payload = JSON.stringify({
    self_hash: input.selfHashHex,
    session_id: input.sessionId,
    session_nonce: input.sessionNonce
  })
  const hash = crypto.createHash('sha256').update(payload).digest()
  return hash
}

export function getDefaultSigner(): SignerProvider {
  // Placeholder for KMS/Vault providers based on env
  const provider = new DevEd25519Signer()
  return new AuditWrappedSigner(provider)
}

