"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalSecretsManager = exports.HashiCorpVaultSecretsManager = exports.AWSKMSSecretsManager = void 0;
exports.createSecretsManager = createSecretsManager;
const client_kms_1 = require("@aws-sdk/client-kms");
// import { Vault } from 'hashi-vault-js'; // TODO: Fix Vault API integration
const logger_1 = require("../observability/logger");
const logger = (0, logger_1.getLogger)('SecretsManager');
class AWSKMSSecretsManager {
    constructor(keyId, region = 'us-east-1') {
        this.keyId = keyId;
        this.kmsClient = new client_kms_1.KMSClient({ region });
    }
    async encrypt(data, keyId) {
        try {
            const command = new client_kms_1.EncryptCommand({
                KeyId: keyId || this.keyId,
                Plaintext: Buffer.from(data, 'utf-8'),
            });
            const response = await this.kmsClient.send(command);
            return Buffer.from(response.CiphertextBlob || new Uint8Array()).toString('base64');
        }
        catch (error) {
            logger.error('KMS encryption failed', { error: error.message });
            throw error;
        }
    }
    async decrypt(encryptedData) {
        try {
            const command = new client_kms_1.DecryptCommand({
                CiphertextBlob: Buffer.from(encryptedData, 'base64'),
            });
            const response = await this.kmsClient.send(command);
            return Buffer.from(response.Plaintext || new Uint8Array()).toString('utf-8');
        }
        catch (error) {
            logger.error('KMS decryption failed', { error: error.message });
            throw error;
        }
    }
    async healthCheck() {
        try {
            // Try to describe the key
            await this.kmsClient.send(new (await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-kms')))).DescribeKeyCommand({
                KeyId: this.keyId,
            }));
            return true;
        }
        catch (error) {
            logger.error('KMS health check failed', { error: error.message });
            return false;
        }
    }
}
exports.AWSKMSSecretsManager = AWSKMSSecretsManager;
class HashiCorpVaultSecretsManager {
    // TODO: Implement Vault integration with correct API
    // The hashi-vault-js library API needs to be verified
    constructor(endpoint, token, mountPath = 'secret') {
        throw new Error('HashiCorpVaultSecretsManager not yet implemented - use AWS KMS or Local provider');
    }
    async encrypt(data, keyId) {
        throw new Error('Not implemented');
    }
    async decrypt(encryptedData) {
        throw new Error('Not implemented');
    }
    async healthCheck() {
        return false;
    }
}
exports.HashiCorpVaultSecretsManager = HashiCorpVaultSecretsManager;
class LocalSecretsManager {
    constructor(encryptionKey) {
        this.encryptionKey = encryptionKey;
    }
    async encrypt(data) {
        // Simple AES encryption for local development
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }
    async decrypt(encryptedData) {
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const [ivHex, encrypted] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async healthCheck() {
        return true; // Local encryption is always healthy
    }
}
exports.LocalSecretsManager = LocalSecretsManager;
function createSecretsManager() {
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
