/**
 * Public Demo Routes
 * 
 * Unauthenticated endpoints for demonstrating trust receipt functionality.
 * These endpoints generate REAL signed receipts but are rate-limited.
 * 
 * No auth required - designed for website demo integration.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { keysService } from '../services/keys.service';
import didService from '../services/did.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

// Simple in-memory rate limiting for demo
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Canonicalize for consistent hashing/signing
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => JSON.stringify(key) + ':' + canonicalize(obj[key]));
  return '{' + pairs.join(',') + '}';
}

/**
 * POST /api/public-demo/generate
 * Generate a real signed trust receipt (no auth required)
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a minute.'
      });
    }

    const { prompt, model = 'demo-model', includeContent = false } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'prompt is required'
      });
    }

    // Initialize keys
    await keysService.initialize();
    const publicKeyHex = await keysService.getPublicKeyHex();

    // Generate mock AI response (since this is a demo)
    const aiResponse = `This is a demo response for: "${prompt.substring(0, 100)}". In a production environment, this would be a real AI-generated response that gets evaluated for trust compliance.`;

    // Build receipt content
    const timestamp = new Date().toISOString();
    const sessionId = `demo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Build interaction: hash content by default for privacy
    const rawPrompt = prompt.substring(0, 1000); // Limit size
    const promptHash = crypto.createHash('sha256').update(rawPrompt).digest('hex');
    const responseHash = crypto.createHash('sha256').update(aiResponse).digest('hex');

    const interaction: any = includeContent
      ? { prompt: rawPrompt, response: aiResponse, prompt_hash: promptHash, response_hash: responseHash, model }
      : { prompt_hash: promptHash, response_hash: responseHash, model };

    const receiptContent: any = {
      version: '2.0.0',
      timestamp,
      session_id: sessionId,
      agent_did: didService.getAgentDID('demo-agent'),
      human_did: `did:web:${didService.PLATFORM_DOMAIN}:users:demo`,
      policy_version: '1.0.0',
      mode: 'constitutional',
      interaction,
      telemetry: {
        resonance_score: 0.85 + Math.random() * 0.1, // 0.85-0.95
        coherence_score: 0.80 + Math.random() * 0.15,
        truth_debt: Math.random() * 0.1, // Low truth debt
      },
      chain: {
        previous_hash: 'GENESIS',
        chain_hash: '', // Will be computed
        chain_length: 1,
      },
    };

    // Compute receipt ID (SHA-256 of content without id, with empty chain_hash)
    const contentForId = canonicalize(receiptContent);
    receiptContent.id = crypto.createHash('sha256').update(contentForId).digest('hex');

    // Compute chain hash: hash of (content with id but WITHOUT chain_hash) + previous_hash
    // This allows verification to reproduce by removing chain_hash before hashing
    const receiptForChain = { ...receiptContent };
    receiptForChain.chain = { ...receiptContent.chain, chain_hash: '' };
    const contentForChain = canonicalize(receiptForChain);
    const chainContent = contentForChain + receiptContent.chain.previous_hash;
    receiptContent.chain.chain_hash = crypto.createHash('sha256').update(chainContent).digest('hex');

    // Sign the receipt with Ed25519
    const canonicalReceipt = canonicalize(receiptContent);
    const signature = await keysService.sign(canonicalReceipt);

    // Build final signed receipt
    const signedReceipt = {
      ...receiptContent,
      signature: {
        algorithm: 'Ed25519',
        value: signature,
        key_version: 'v1',
        timestamp_signed: new Date().toISOString(),
        public_key: publicKeyHex,
      },
    };

    logger.info('Demo receipt generated', { 
      receiptId: signedReceipt.id.substring(0, 16),
      sessionId,
      ip: clientIp
    });

    res.json({
      success: true,
      data: {
        response: aiResponse,
        receipt: signedReceipt,
        verification: {
          publicKey: publicKeyHex,
          verifyUrl: `/.well-known/sonate-pubkey`,
          didDocument: `/.well-known/did.json`,
        }
      }
    });

  } catch (error) {
    logger.error('Demo receipt generation failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Generation failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * POST /api/public-demo/verify
 * Verify a receipt (no auth required)
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { receipt } = req.body;

    if (!receipt || typeof receipt !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'receipt object is required'
      });
    }

    await keysService.initialize();
    const publicKeyHex = await keysService.getPublicKeyHex();

    const checks: Record<string, { status: string; message: string }> = {};

    // Accept V1 receipts by normalizing self_hash → id
    if (receipt.self_hash && !receipt.id) {
      receipt.id = receipt.self_hash;
    }

    // 1. Structure check (require receipt.id)
    const hasId = !!receipt.id;
    const hasTimestamp = !!receipt.timestamp;
    // Normalize signature: V1 uses plain string, V2 uses { value, algorithm, ... }
    const signatureValue = typeof receipt.signature === 'string'
      ? receipt.signature
      : receipt.signature?.value;
    const hasSignature = !!signatureValue;

    checks.structure = {
      status: hasId && hasTimestamp && hasSignature ? 'PASS' : 'FAIL',
      message: hasId && hasTimestamp && hasSignature
        ? 'Required fields present (id, timestamp, signature)'
        : `Missing required fields: ${[!hasId && 'id', !hasTimestamp && 'timestamp', !hasSignature && 'signature'].filter(Boolean).join(', ')}`
    };

    // 2. Verify Ed25519 signature
    if (hasSignature) {
      try {
        let isValid = false;

        if (typeof receipt.signature === 'object' && receipt.signature?.value) {
          // V2: signature over canonical receipt content (without signature field)
          const receiptWithoutSig = { ...receipt };
          delete receiptWithoutSig.signature;
          const canonicalContent = canonicalize(receiptWithoutSig);
          isValid = await keysService.verify(canonicalContent, receipt.signature.value);
        } else if (typeof receipt.signature === 'string' && receipt.id) {
          // V1: signature over self_hash bytes
          isValid = await keysService.verify(Buffer.from(receipt.id, 'hex'), receipt.signature);
        }

        checks.signature = {
          status: isValid ? 'PASS' : 'FAIL',
          message: isValid ? 'Ed25519 signature verified' : 'Signature verification failed - content may be tampered'
        };
      } catch (e) {
        checks.signature = {
          status: 'FAIL',
          message: 'Signature verification error'
        };
      }
    } else {
      checks.signature = {
        status: 'FAIL',
        message: 'No signature present'
      };
    }

    // 3. Check chain hash
    if (receipt.chain?.chain_hash && receipt.chain?.previous_hash) {
      const receiptForChain = { ...receipt };
      delete receiptForChain.signature;
      receiptForChain.chain = { ...receipt.chain, chain_hash: '' };
      const contentForChain = canonicalize(receiptForChain);
      const chainContent = contentForChain + receipt.chain.previous_hash;
      const expectedChainHash = crypto.createHash('sha256').update(chainContent).digest('hex');

      const chainValid = receipt.chain.chain_hash === expectedChainHash;
      checks.chain = {
        status: chainValid ? 'PASS' : 'FAIL',
        message: chainValid ? 'Chain hash verified' : 'Chain hash mismatch - receipt may be tampered'
      };
    } else {
      checks.chain = {
        status: 'WARN',
        message: 'No chain data present'
      };
    }

    // 4. Check timestamp
    if (hasTimestamp) {
      const receiptTime = new Date(receipt.timestamp);
      const now = new Date();
      const isFuture = receiptTime > now;

      checks.timestamp = {
        status: isFuture ? 'FAIL' : 'PASS',
        message: isFuture ? 'Timestamp is in the future' : `Issued ${receiptTime.toISOString()}`
      };
    } else {
      checks.timestamp = {
        status: 'FAIL',
        message: 'No timestamp present'
      };
    }

    // Determine overall status
    const allChecks = Object.values(checks);
    const hasFail = allChecks.some(c => c.status === 'FAIL');
    const allPass = allChecks.every(c => c.status === 'PASS');

    res.json({
      success: true,
      data: {
        valid: !hasFail,
        overallStatus: hasFail ? 'FAILED' : (allPass ? 'VERIFIED' : 'PARTIAL'),
        checks,
        receipt: {
          id: receipt.id,
          version: receipt.version,
          timestamp: receipt.timestamp,
          session_id: receipt.session_id,
          agent_did: receipt.agent_did,
        },
        publicKey: publicKeyHex,
      }
    });

  } catch (error) {
    logger.error('Demo receipt verification failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: getErrorMessage(error)
    });
  }
});

/**
 * GET /api/public-demo/public-key
 * Get the public key (no auth required)
 */
router.get('/public-key', async (req: Request, res: Response) => {
  try {
    await keysService.initialize();
    const publicKeyHex = await keysService.getPublicKeyHex();

    res.json({
      success: true,
      data: {
        publicKey: publicKeyHex,
        algorithm: 'Ed25519',
        format: 'hex',
        endpoints: {
          didDocument: '/.well-known/did.json',
          pubkeyJson: '/.well-known/sonate-pubkey.json',
          pubkeyRaw: '/.well-known/sonate-pubkey',
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get public key', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve public key'
    });
  }
});

export default router;
