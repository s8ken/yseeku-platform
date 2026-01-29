"use strict";
/**
 * DID Resolution Routes
 *
 * Implements W3C did:web method resolution endpoints.
 * These routes serve DID Documents at standard /.well-known paths.
 *
 * Routes:
 * - GET /.well-known/did.json - Platform DID Document
 * - GET /.well-known/did/agents/:agentId/did.json - Agent DID Documents
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_model_1 = require("../models/agent.model");
const did_service_1 = __importDefault(require("../services/did.service"));
const keys_service_1 = require("../services/keys.service");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * GET /.well-known/did.json
 * Returns the platform's DID Document
 *
 * This is the root DID for the YSEEKU platform, used to sign
 * trust receipts and as the controller for agent DIDs.
 */
router.get('/did.json', async (req, res) => {
    try {
        // Ensure keys are initialized
        await keys_service_1.keysService.initialize();
        const didDocument = await did_service_1.default.getPlatformDIDDocument();
        // Set appropriate headers for DID resolution
        res.setHeader('Content-Type', 'application/did+ld+json');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        logger_1.default.info('Platform DID Document resolved', {
            did: didDocument.id,
            ip: req.ip
        });
        return res.json(didDocument);
    }
    catch (error) {
        logger_1.default.error('Failed to generate platform DID Document', { error: (0, error_utils_1.getErrorMessage)(error) });
        return res.status(500).json({
            success: false,
            error: 'Failed to generate DID Document',
            message: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * GET /.well-known/did/agents/:agentId/did.json
 * Returns an agent's DID Document
 *
 * Each agent has its own DID derived from the platform DID.
 * The platform acts as the controller for agent DIDs.
 */
router.get('/did/agents/:agentId/did.json', async (req, res) => {
    try {
        const agentId = String(req.params.agentId);
        // Find the agent in the database
        const agent = await agent_model_1.Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found',
                message: `No agent found with ID: ${agentId}`
            });
        }
        // Ensure keys are initialized
        await keys_service_1.keysService.initialize();
        // Generate DID Document with agent metadata
        const didDocument = await did_service_1.default.getAgentDIDDocument(agentId, agent.name, undefined, // Use platform key for now (agents don't have their own keys yet)
        {
            trustScore: agent.trustScore,
            banStatus: agent.banStatus,
            provider: agent.provider,
            model: agent.model,
            createdAt: agent.createdAt?.toISOString(),
        });
        // Set appropriate headers for DID resolution
        res.setHeader('Content-Type', 'application/did+ld+json');
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
        logger_1.default.info('Agent DID Document resolved', {
            did: didDocument.id,
            agentId,
            agentName: agent.name,
            ip: req.ip
        });
        return res.json(didDocument);
    }
    catch (error) {
        logger_1.default.error('Failed to generate agent DID Document', {
            agentId: req.params.agentId,
            error: (0, error_utils_1.getErrorMessage)(error)
        });
        return res.status(500).json({
            success: false,
            error: 'Failed to generate DID Document',
            message: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * GET /.well-known/did-configuration.json
 * Returns DID Configuration for domain linkage verification
 *
 * This proves the platform controls the DIDs it claims.
 * See: https://identity.foundation/.well-known/resources/did-configuration/
 */
router.get('/did-configuration.json', async (req, res) => {
    try {
        await keys_service_1.keysService.initialize();
        const platformDID = did_service_1.default.getPlatformDID();
        const publicKeyHex = await keys_service_1.keysService.getPublicKeyHex();
        // Create domain linkage credential
        const credential = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://identity.foundation/.well-known/did-configuration/v1'
            ],
            issuer: platformDID,
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            type: ['VerifiableCredential', 'DomainLinkageCredential'],
            credentialSubject: {
                id: platformDID,
                origin: `https://${did_service_1.default.PLATFORM_DOMAIN}`
            }
        };
        // Sign the credential
        const credentialHash = Buffer.from(JSON.stringify(credential)).toString('hex');
        const proof = await did_service_1.default.createProof(credentialHash, `${platformDID}#key-1`);
        const signedCredential = {
            ...credential,
            proof
        };
        const configuration = {
            '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
            linked_dids: [signedCredential]
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.json(configuration);
    }
    catch (error) {
        logger_1.default.error('Failed to generate DID configuration', { error: (0, error_utils_1.getErrorMessage)(error) });
        return res.status(500).json({
            success: false,
            error: 'Failed to generate DID configuration',
            message: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * GET /api/did/resolve/:did
 * Universal DID resolver endpoint
 *
 * Resolves any did:web DID for our domain.
 * Returns 404 for external domains or unsupported methods.
 */
router.get('/resolve/:did', async (req, res) => {
    try {
        const { did } = req.params;
        // Decode the DID (might be URL encoded)
        const decodedDID = decodeURIComponent(String(did));
        const didDocument = await did_service_1.default.resolveDID(decodedDID);
        if (!didDocument) {
            return res.status(404).json({
                success: false,
                error: 'DID not found',
                message: `Could not resolve DID: ${decodedDID}`
            });
        }
        res.setHeader('Content-Type', 'application/did+ld+json');
        logger_1.default.info('DID resolved via API', { did: decodedDID, ip: req.ip });
        return res.json({
            success: true,
            data: {
                didDocument,
                didResolutionMetadata: {
                    contentType: 'application/did+ld+json',
                    retrieved: new Date().toISOString()
                },
                didDocumentMetadata: {
                    created: didDocument.created,
                    updated: didDocument.updated
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('DID resolution failed', {
            did: req.params.did,
            error: (0, error_utils_1.getErrorMessage)(error)
        });
        return res.status(500).json({
            success: false,
            error: 'DID resolution failed',
            message: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
/**
 * GET /api/did/info
 * Returns information about this DID resolver
 */
router.get('/info', async (req, res) => {
    try {
        await keys_service_1.keysService.initialize();
        const platformDID = did_service_1.default.getPlatformDID();
        const publicKeyHex = await keys_service_1.keysService.getPublicKeyHex();
        return res.json({
            success: true,
            data: {
                resolver: {
                    name: 'YSEEKU DID Resolver',
                    version: '1.0.0',
                    supportedMethods: ['did:web'],
                    domain: did_service_1.default.PLATFORM_DOMAIN
                },
                platform: {
                    did: platformDID,
                    publicKey: publicKeyHex,
                    endpoints: {
                        didDocument: `/.well-known/did.json`,
                        agentDID: `/.well-known/did/agents/{agentId}/did.json`,
                        didConfiguration: `/.well-known/did-configuration.json`,
                        resolve: `/api/did/resolve/{did}`
                    }
                },
                specification: {
                    didCore: 'https://www.w3.org/TR/did-core/',
                    didWeb: 'https://w3c-ccg.github.io/did-method-web/',
                    ed25519Signature2020: 'https://w3c.github.io/vc-di-eddsa/'
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get DID info', { error: (0, error_utils_1.getErrorMessage)(error) });
        return res.status(500).json({
            success: false,
            error: 'Failed to get DID info',
            message: (0, error_utils_1.getErrorMessage)(error)
        });
    }
});
exports.default = router;
