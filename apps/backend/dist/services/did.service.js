"use strict";
/**
 * W3C DID (Decentralized Identifier) Service
 *
 * Implements did:web method for platform and agent identifiers.
 * Follows W3C DID Core specification: https://www.w3.org/TR/did-core/
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.didService = void 0;
exports.getPlatformDID = getPlatformDID;
exports.getAgentDID = getAgentDID;
exports.publicKeyToDIDKey = publicKeyToDIDKey;
exports.publicKeyToMultibase = publicKeyToMultibase;
exports.getPlatformDIDDocument = getPlatformDIDDocument;
exports.getAgentDIDDocument = getAgentDIDDocument;
exports.resolveDID = resolveDID;
exports.createProof = createProof;
const keys_service_1 = require("./keys.service");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
// Platform domain - configurable via environment
const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'yseeku.com';
/**
 * Generate a did:web identifier for the platform
 */
function getPlatformDID() {
    return `did:web:${PLATFORM_DOMAIN}`;
}
/**
 * Generate a did:web identifier for an agent
 */
function getAgentDID(agentId) {
    return `did:web:${PLATFORM_DOMAIN}:agents:${agentId}`;
}
/**
 * Generate a did:key identifier from a public key
 * Uses multibase encoding (z = base58btc)
 */
function publicKeyToDIDKey(publicKeyHex) {
    // Multicodec prefix for Ed25519 public key is 0xed01
    const multicodecPrefix = Buffer.from([0xed, 0x01]);
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    const multicodecKey = Buffer.concat([multicodecPrefix, publicKeyBytes]);
    // Base58btc encode (simplified - in production use proper base58 library)
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + multicodecKey.toString('hex'));
    let encoded = '';
    while (num > 0) {
        encoded = base58Chars[Number(num % 58n)] + encoded;
        num = num / 58n;
    }
    return `did:key:z${encoded}`;
}
/**
 * Convert public key hex to multibase format (z prefix = base58btc)
 */
function publicKeyToMultibase(publicKeyHex) {
    // Multicodec prefix for Ed25519 public key
    const multicodecPrefix = Buffer.from([0xed, 0x01]);
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    const multicodecKey = Buffer.concat([multicodecPrefix, publicKeyBytes]);
    // Base58btc encode
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + multicodecKey.toString('hex'));
    let encoded = '';
    while (num > 0) {
        encoded = base58Chars[Number(num % 58n)] + encoded;
        num = num / 58n;
    }
    return `z${encoded}`;
}
/**
 * Generate DID Document for the platform
 */
async function getPlatformDIDDocument() {
    const platformDID = getPlatformDID();
    const publicKeyHex = await keys_service_1.keysService.getPublicKeyHex();
    return {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        id: platformDID,
        verificationMethod: [
            {
                id: `${platformDID}#key-1`,
                type: 'Ed25519VerificationKey2020',
                controller: platformDID,
                publicKeyMultibase: publicKeyToMultibase(publicKeyHex),
                publicKeyHex: publicKeyHex, // Include hex for easier verification
            }
        ],
        authentication: [`${platformDID}#key-1`],
        assertionMethod: [`${platformDID}#key-1`],
        service: [
            {
                id: `${platformDID}#trust-protocol`,
                type: 'TrustProtocolService',
                serviceEndpoint: `https://api.${PLATFORM_DOMAIN}/api/trust`,
                description: 'SONATE Trust Protocol API endpoint'
            },
            {
                id: `${platformDID}#agents`,
                type: 'AgentRegistryService',
                serviceEndpoint: `https://api.${PLATFORM_DOMAIN}/api/agents`,
                description: 'AI Agent Registry endpoint'
            },
            {
                id: `${platformDID}#overseer`,
                type: 'SystemBrainService',
                serviceEndpoint: `https://api.${PLATFORM_DOMAIN}/api/overseer`,
                description: 'System Brain / Overseer endpoint'
            }
        ],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    };
}
/**
 * Generate DID Document for an agent
 */
async function getAgentDIDDocument(agentId, agentName, agentPublicKey, metadata) {
    const agentDID = getAgentDID(agentId);
    const platformDID = getPlatformDID();
    // Use agent's own key if provided, otherwise use platform key as controller
    const publicKeyHex = agentPublicKey || await keys_service_1.keysService.getPublicKeyHex();
    const document = {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/ed25519-2020/v1',
            {
                'trustScore': 'https://yseeku.com/ns/trust#trustScore',
                'banStatus': 'https://yseeku.com/ns/trust#banStatus',
                'provider': 'https://yseeku.com/ns/agent#provider',
                'model': 'https://yseeku.com/ns/agent#model',
            }
        ],
        id: agentDID,
        controller: platformDID, // Platform controls agent DIDs
        verificationMethod: [
            {
                id: `${agentDID}#key-1`,
                type: 'Ed25519VerificationKey2020',
                controller: agentPublicKey ? agentDID : platformDID,
                publicKeyMultibase: publicKeyToMultibase(publicKeyHex),
                publicKeyHex: publicKeyHex,
            }
        ],
        authentication: [`${agentDID}#key-1`],
        assertionMethod: [`${agentDID}#key-1`],
        service: [
            {
                id: `${agentDID}#conversation`,
                type: 'ConversationService',
                serviceEndpoint: `https://api.${PLATFORM_DOMAIN}/api/conversations?agent=${agentId}`,
                description: 'Agent conversation endpoint'
            },
            {
                id: `${agentDID}#trust-receipts`,
                type: 'TrustReceiptService',
                serviceEndpoint: `https://api.${PLATFORM_DOMAIN}/api/trust/receipts?agent=${agentId}`,
                description: 'Trust receipts for this agent'
            }
        ],
        created: metadata?.createdAt || new Date().toISOString(),
        updated: new Date().toISOString(),
    };
    // Add metadata as additional properties if provided
    if (metadata) {
        document.trustScore = metadata.trustScore;
        document.banStatus = metadata.banStatus;
        document.provider = metadata.provider;
        document.model = metadata.model;
    }
    return document;
}
/**
 * Resolve a DID to its DID Document
 * Currently only supports did:web for our domain
 */
async function resolveDID(did) {
    try {
        // Parse the DID
        const parts = did.split(':');
        if (parts.length < 3) {
            logger_1.default.warn('Invalid DID format', { did });
            return null;
        }
        const method = parts[1];
        if (method !== 'web') {
            logger_1.default.warn('Unsupported DID method', { method, did });
            return null;
        }
        const domain = parts[2];
        // Only resolve DIDs for our domain
        if (domain !== PLATFORM_DOMAIN) {
            logger_1.default.warn('Cannot resolve DID for external domain', { domain, did });
            return null;
        }
        // Platform DID
        if (parts.length === 3) {
            return getPlatformDIDDocument();
        }
        // Agent DID
        if (parts.length === 5 && parts[3] === 'agents') {
            const agentId = parts[4];
            // Note: In a real implementation, we'd look up the agent from the database
            // For now, return a basic document - the route will populate with real data
            return getAgentDIDDocument(agentId, 'Agent');
        }
        logger_1.default.warn('Unknown DID path structure', { did, parts });
        return null;
    }
    catch (error) {
        logger_1.default.error('Failed to resolve DID', { did, error: (0, error_utils_1.getErrorMessage)(error) });
        return null;
    }
}
/**
 * Create a Verifiable Credential proof structure
 */
async function createProof(documentHash, verificationMethod) {
    const signature = await keys_service_1.keysService.sign(documentHash);
    return {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: verificationMethod,
        proofPurpose: 'assertionMethod',
        proofValue: signature,
    };
}
/**
 * Export service as singleton
 */
exports.didService = {
    getPlatformDID,
    getAgentDID,
    publicKeyToDIDKey,
    publicKeyToMultibase,
    getPlatformDIDDocument,
    getAgentDIDDocument,
    resolveDID,
    createProof,
    PLATFORM_DOMAIN,
};
exports.default = exports.didService;
