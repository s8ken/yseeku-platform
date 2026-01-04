import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
// import { Vault } from 'hashi-vault-js'; // TODO: Fix Vault API integration
import { getLogger } from '../observability/logger';

const logger = getLogger('SecretsManager');

export interface SecretsManager {
  encrypt(data: string, keyId?: string): Promise<string>;
  decrypt(encryptedData: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}

export class AWSKMSSecretsManager implements SecretsManager {
  private kmsClient: KMSClient;
  private keyId: string;

  constructor(keyId: string, region: string = 'us-east-1') {
    this.keyId = keyId;
    this.kmsClient = new KMSClient({ region });
  }

  async encrypt(data: string, keyId?: string): Promise<string> {
    try {
      const command = new EncryptCommand({
        KeyId: keyId || this.keyId,
        Plaintext: Buffer.from(data, 'utf-8'),
      });

      const response = await this.kmsClient.send(command);
      return Buffer.from(response.CiphertextBlob || new Uint8Array()).toString('base64');
    } catch (error) {
      logger.error('KMS encryption failed', { error: (error as Error).message });
      throw error;
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, 'base64'),
      });

      const response = await this.kmsClient.send(command);
      return Buffer.from(response.Plaintext || new Uint8Array()).toString('utf-8');
    } catch (error) {
      logger.error('KMS decryption failed', { error: (error as Error).message });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to describe the key
      await this.kmsClient.send(new (await import('@aws-sdk/client-kms')).DescribeKeyCommand({
        KeyId: this.keyId,
      }));
      return true;
    } catch (error) {
      logger.error('KMS health check failed', { error: (error as Error).message });
      return false;
    }
  }
}

export class HashiCorpVaultSecretsManager implements SecretsManager {
  // TODO: Implement Vault integration with correct API
  // The hashi-vault-js library API needs to be verified
  constructor(endpoint: string, token: string, mountPath: string = 'secret') {
    throw new Error('HashiCorpVaultSecretsManager not yet implemented - use AWS KMS or Local provider');
  }

  async encrypt(data: string, keyId?: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async decrypt(encryptedData: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}

export class LocalSecretsManager implements SecretsManager {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  async encrypt(data: string): Promise<string> {
    // Simple AES encryption for local development
    const crypto = await import('crypto');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  async decrypt(encryptedData: string): Promise<string> {
    const crypto = await import('crypto');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async healthCheck(): Promise<boolean> {
    return true; // Local encryption is always healthy
  }
}

export function createSecretsManager(): SecretsManager {
  const provider = process.env.SECRETS_PROVIDER || 'local';

  switch (provider) {
    case 'aws-kms':
      const kmsKeyId = process.env.AWS_KMS_KEY_ID;
      const awsRegion = process.env.AWS_REGION || 'us-east-1';
      if (!kmsKeyId) {
        throw new Error('AWS_KMS_KEY_ID environment variable is required for AWS KMS provider');
      }
      return new AWSKMSSecretsManager(kmsKeyId, awsRegion);

    case 'vault':
      const vaultEndpoint = process.env.VAULT_ENDPOINT;
      const vaultToken = process.env.VAULT_TOKEN;
      const vaultMountPath = process.env.VAULT_MOUNT_PATH || 'secret';
      if (!vaultEndpoint || !vaultToken) {
        throw new Error('VAULT_ENDPOINT and VAULT_TOKEN environment variables are required for Vault provider');
      }
      return new HashiCorpVaultSecretsManager(vaultEndpoint, vaultToken, vaultMountPath);

    case 'local':
    default:
      const localKey = process.env.SECRETS_ENCRYPTION_KEY || 'default-local-key-change-in-production';
      return new LocalSecretsManager(localKey);
  }
}