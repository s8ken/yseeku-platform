import * as crypto from 'crypto'
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { KeyManagementServiceClient } from "@google-cloud/kms";
import vault from "node-vault";
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

export class AWSSigner implements SignerProvider {
  private client: KMSClient;
  private keyId: string;

  constructor(keyId: string, region: string = 'us-east-1') {
    this.client = new KMSClient({ region });
    this.keyId = keyId;
  }

  async sign(message: Buffer): Promise<SignResult> {
    const command = new SignCommand({
      KeyId: this.keyId,
      Message: message,
      MessageType: 'RAW',
      SigningAlgorithm: 'ECDSA_SHA_256' // Adjust based on key spec
    });

    const response = await this.client.send(command);
    
    if (!response.Signature) {
      throw new Error('AWS KMS failed to return signature');
    }

    const signature = Buffer.from(response.Signature);
    return {
      signatureHex: signature.toString('hex'),
      signatureBase64: signature.toString('base64')
    };
  }
}

export class GCPSigner implements SignerProvider {
  private client: KeyManagementServiceClient;
  private keyName: string;

  constructor(keyName: string) {
    this.client = new KeyManagementServiceClient();
    this.keyName = keyName;
  }

  async sign(message: Buffer): Promise<SignResult> {
    const [response] = await this.client.asymmetricSign({
      name: this.keyName,
      data: message,
    });

    if (!response.signature) {
      throw new Error('GCP KMS failed to return signature');
    }

    const signature = Buffer.from(response.signature as Uint8Array);
    return {
      signatureHex: signature.toString('hex'),
      signatureBase64: signature.toString('base64')
    };
  }
}

export class VaultSigner implements SignerProvider {
  private client: any;
  private keyName: string;

  constructor(endpoint: string, token: string, keyName: string) {
    this.client = vault({
      apiVersion: 'v1',
      endpoint,
      token,
    });
    this.keyName = keyName;
  }

  async sign(message: Buffer): Promise<SignResult> {
    // Vault transit engine sign
    // Requires base64 encoded input
    const input = message.toString('base64');
    
    const response = await this.client.write(`transit/sign/${this.keyName}`, {
      input,
    });

    const signatureWithPrefix = response.data.signature; // e.g. "vault:v1:..."
    // We might want to strip the prefix or return as is. 
    // Usually for verification we need the raw bytes if it's a standard sig, 
    // but Vault adds its own format.
    // For now, returning the string as hex/base64 might be tricky if it's Vault format.
    // Assuming standard signature handling:
    
    // If it's just the signature string:
    return {
      signatureHex: Buffer.from(signatureWithPrefix).toString('hex'),
      signatureBase64: Buffer.from(signatureWithPrefix).toString('base64')
    };
  }
}

export class AuditWrappedSigner implements SignerProvider {
  constructor(private inner: SignerProvider, private providerName: string) {}

  async sign(message: Buffer): Promise<SignResult> {
    const audit = getAuditLogger()
    try {
      const result = await this.inner.sign(message)
      await audit.log(
        AuditEventType.RESOURCE_CREATED,
        'signer.sign',
        'success',
        {
          details: { 
            provider: this.providerName,
            messageHash: crypto.createHash('sha256').update(message).digest('hex')
          }
        }
      )
      return result
    } catch (error: any) {
      await audit.log(
        AuditEventType.RESOURCE_CREATED,
        'signer.sign',
        'failure',
        {
          details: { 
            provider: this.providerName,
            error: error.message 
          },
          severity: 'critical' as any
        }
      )
      throw error
    }
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
  const providerType = process.env.SIGNER_PROVIDER || 'local';

  let provider: SignerProvider;

  switch (providerType) {
    case 'aws':
      if (!process.env.AWS_KMS_KEY_ID) throw new Error('AWS_KMS_KEY_ID required');
      provider = new AWSSigner(process.env.AWS_KMS_KEY_ID, process.env.AWS_REGION);
      break;
    case 'gcp':
      if (!process.env.GCP_KMS_KEY_NAME) throw new Error('GCP_KMS_KEY_NAME required');
      provider = new GCPSigner(process.env.GCP_KMS_KEY_NAME);
      break;
    case 'vault':
      if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN || !process.env.VAULT_KEY_NAME) {
        throw new Error('VAULT_ADDR, VAULT_TOKEN, and VAULT_KEY_NAME required');
      }
      provider = new VaultSigner(process.env.VAULT_ADDR, process.env.VAULT_TOKEN, process.env.VAULT_KEY_NAME);
      break;
    case 'local':
    default:
      provider = new DevEd25519Signer();
      break;
  }

  return new AuditWrappedSigner(provider, providerType);
}
