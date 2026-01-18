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

import { Router, Request, Response } from 'express';
import { Agent } from '../models/agent.model';
import didService from '../services/did.service';
import { keysService } from '../services/keys.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /.well-known/did.json
 * Returns the platform's DID Document
 *
 * This is the root DID for the YSEEKU platform, used to sign
 * trust receipts and as the controller for agent DIDs.
 */
router.get('/did.json', async (req: Request, res: Response) => {
  try {
    // Ensure keys are initialized
    await keysService.initialize();

    const didDocument = await didService.getPlatformDIDDocument();

    // Set appropriate headers for DID resolution
    res.setHeader('Content-Type', 'application/did+ld+json');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    logger.info('Platform DID Document resolved', {
      did: didDocument.id,
      ip: req.ip
    });

    return res.json(didDocument);

  } catch (error: any) {
    logger.error('Failed to generate platform DID Document', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to generate DID Document',
      message: error.message
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
router.get('/did/agents/:agentId/did.json', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    // Find the agent in the database
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: `No agent found with ID: ${agentId}`
      });
    }

    // Ensure keys are initialized
    await keysService.initialize();

    // Generate DID Document with agent metadata
    const didDocument = await didService.getAgentDIDDocument(
      agentId,
      agent.name,
      undefined, // Use platform key for now (agents don't have their own keys yet)
      {
        trustScore: (agent as any).trustScore,
        banStatus: agent.banStatus,
        provider: agent.provider,
        model: agent.model,
        createdAt: agent.createdAt?.toISOString(),
      }
    );

    // Set appropriate headers for DID resolution
    res.setHeader('Content-Type', 'application/did+ld+json');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

    logger.info('Agent DID Document resolved', {
      did: didDocument.id,
      agentId,
      agentName: agent.name,
      ip: req.ip
    });

    return res.json(didDocument);

  } catch (error: any) {
    logger.error('Failed to generate agent DID Document', {
      agentId: req.params.agentId,
      error: error.message
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to generate DID Document',
      message: error.message
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
router.get('/did-configuration.json', async (req: Request, res: Response) => {
  try {
    await keysService.initialize();

    const platformDID = didService.getPlatformDID();
    const publicKeyHex = await keysService.getPublicKeyHex();

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
        origin: `https://${didService.PLATFORM_DOMAIN}`
      }
    };

    // Sign the credential
    const credentialHash = Buffer.from(JSON.stringify(credential)).toString('hex');
    const proof = await didService.createProof(credentialHash, `${platformDID}#key-1`);

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

  } catch (error: any) {
    logger.error('Failed to generate DID configuration', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to generate DID configuration',
      message: error.message
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
router.get('/resolve/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    // Decode the DID (might be URL encoded)
    const decodedDID = decodeURIComponent(did);

    const didDocument = await didService.resolveDID(decodedDID);

    if (!didDocument) {
      return res.status(404).json({
        success: false,
        error: 'DID not found',
        message: `Could not resolve DID: ${decodedDID}`
      });
    }

    res.setHeader('Content-Type', 'application/did+ld+json');

    logger.info('DID resolved via API', { did: decodedDID, ip: req.ip });

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

  } catch (error: any) {
    logger.error('DID resolution failed', {
      did: req.params.did,
      error: error.message
    });
    return res.status(500).json({
      success: false,
      error: 'DID resolution failed',
      message: error.message
    });
  }
});

/**
 * GET /api/did/info
 * Returns information about this DID resolver
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    await keysService.initialize();

    const platformDID = didService.getPlatformDID();
    const publicKeyHex = await keysService.getPublicKeyHex();

    return res.json({
      success: true,
      data: {
        resolver: {
          name: 'YSEEKU DID Resolver',
          version: '1.0.0',
          supportedMethods: ['did:web'],
          domain: didService.PLATFORM_DOMAIN
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

  } catch (error: any) {
    logger.error('Failed to get DID info', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to get DID info',
      message: error.message
    });
  }
});

export default router;
