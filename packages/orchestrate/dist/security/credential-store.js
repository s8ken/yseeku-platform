"use strict";
/**
 * Credential Store for SONATE Protocol
 * Provides secure storage and retrieval of authentication credentials
 */
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
exports.SonateVaultStorageBackend = exports.MemoryStorageBackend = exports.CredentialEncryption = exports.CredentialType = void 0;
const crypto = __importStar(require("crypto"));
const logger_1 = require("../observability/logger");
var CredentialType;
(function (CredentialType) {
    CredentialType["API_KEY"] = "api_key";
    CredentialType["PASSWORD"] = "password";
    CredentialType["ACCESS_TOKEN"] = "access_token";
    CredentialType["REFRESH_TOKEN"] = "refresh_token";
    CredentialType["SECRET_KEY"] = "secret_key";
    CredentialType["CERTIFICATE"] = "certificate";
    CredentialType["DATABASE_CREDENTIALS"] = "database_credentials";
})(CredentialType || (exports.CredentialType = CredentialType = {}));
/**
 * Encryption utilities for credential storage
 */
class CredentialEncryption {
    /**
     * Encrypt a credential value
     */
    static encrypt(value, encryptionKey) {
        // Generate a random salt and IV
        const salt = crypto.randomBytes(16).toString('hex');
        const iv = crypto.randomBytes(this.IV_LENGTH);
        // Derive key from master key and salt using HKDF-like approach
        const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 10000, this.KEY_LENGTH, 'sha256');
        // Create cipher - use createCipheriv for GCM mode
        const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
        cipher.setAAD(Buffer.from(salt)); // Additional authenticated data
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            salt,
        };
    }
    /**
     * Decrypt a credential value
     */
    static decrypt(encrypted, iv, tag, salt, encryptionKey) {
        // Derive the same key
        const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 10000, this.KEY_LENGTH, 'sha256');
        // Create decipher - use createDecipheriv for GCM mode
        const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, Buffer.from(iv, 'hex'));
        decipher.setAAD(Buffer.from(salt));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Generate a secure encryption key
     */
    static generateKey() {
        return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    }
    /**
     * Validate encryption key format
     */
    static validateKey(key) {
        return /^[a-f0-9]{64}$/i.test(key) && key.length === 64;
    }
}
exports.CredentialEncryption = CredentialEncryption;
CredentialEncryption.ALGORITHM = 'aes-256-gcm';
CredentialEncryption.KEY_LENGTH = 32; // 256 bits
CredentialEncryption.IV_LENGTH = 16; // 128 bits for GCM
CredentialEncryption.TAG_LENGTH = 16; // 128 bits auth tag
/**
 * In-memory storage backend for development/testing
 */
class MemoryStorageBackend {
    constructor() {
        this.credentials = new Map();
        this.userIndex = new Map(); // userId -> credentialIds
    }
    async store(credential) {
        this.credentials.set(credential.id, credential);
        // Update user index
        if (!this.userIndex.has(credential.userId)) {
            this.userIndex.set(credential.userId, new Set());
        }
        this.userIndex.get(credential.userId).add(credential.id);
    }
    async retrieve(id) {
        return this.credentials.get(id) || null;
    }
    async list(userId) {
        const credentialIds = this.userIndex.get(userId);
        if (!credentialIds) {
            return [];
        }
        return Array.from(credentialIds)
            .map((id) => this.credentials.get(id))
            .filter((cred) => cred !== undefined);
    }
    async delete(id) {
        const credential = this.credentials.get(id);
        if (!credential) {
            return false;
        }
        this.credentials.delete(id);
        // Update user index
        const userCredentials = this.userIndex.get(credential.userId);
        if (userCredentials) {
            userCredentials.delete(id);
            if (userCredentials.size === 0) {
                this.userIndex.delete(credential.userId);
            }
        }
        return true;
    }
    async update(id, updates) {
        const credential = this.credentials.get(id);
        if (!credential) {
            return false;
        }
        this.credentials.set(id, { ...credential, ...updates });
        return true;
    }
    async healthCheck() {
        return true; // In-memory is always healthy
    }
}
exports.MemoryStorageBackend = MemoryStorageBackend;
/**
 * SONATE-Vault storage backend for enterprise deployments
 */
class SonateVaultStorageBackend {
    constructor(vaultUrl, authToken) {
        this.logger = new logger_1.Logger('SonateVaultStorageBackend');
        this.vaultUrl = vaultUrl;
        this.authToken = authToken;
    }
    async store(credential) {
        // Implementation would integrate with SONATE-Vault API
        // This is a placeholder for the actual implementation
        throw new Error('SONATE-Vault integration not implemented yet');
    }
    async retrieve(id) {
        // Implementation would integrate with SONATE-Vault API
        throw new Error('SONATE-Vault integration not implemented yet');
    }
    async list(userId) {
        // Implementation would integrate with SONATE-Vault API
        throw new Error('SONATE-Vault integration not implemented yet');
    }
    async delete(id) {
        // Implementation would integrate with SONATE-Vault API
        throw new Error('SONATE-Vault integration not implemented yet');
    }
    async update(id, updates) {
        // Implementation would integrate with SONATE-Vault API
        throw new Error('SONATE-Vault integration not implemented yet');
    }
    async healthCheck() {
        // Implementation would check SONATE-Vault health
        throw new Error('SONATE-Vault integration not implemented yet');
    }
}
exports.SonateVaultStorageBackend = SonateVaultStorageBackend;
