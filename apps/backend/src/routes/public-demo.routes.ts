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

// ── Helper: build a signed receipt ──────────────────────────────────────────
interface BuildReceiptParams {
  prompt: string;
  response: string;
  model: string;
  previousHash: string;
  chainLength: number;
  sessionId: string;
  includeContent?: boolean;
  trustScore?: number;
}

async function buildSignedReceipt(params: BuildReceiptParams) {
  const {
    prompt,
    response,
    model,
    previousHash,
    chainLength,
    sessionId,
    includeContent = false,
    trustScore,
  } = params;

  const publicKeyHex = await keysService.getPublicKeyHex();
  const timestamp = new Date().toISOString();

  const rawPrompt = prompt.substring(0, 1000);
  const promptHash = crypto.createHash('sha256').update(rawPrompt).digest('hex');
  const responseHash = crypto.createHash('sha256').update(response).digest('hex');

  const interaction: any = includeContent
    ? { prompt: rawPrompt, response, prompt_hash: promptHash, response_hash: responseHash, model }
    : { prompt_hash: promptHash, response_hash: responseHash, model };

  const resonanceScore = trustScore ?? 0.85 + Math.random() * 0.1;

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
      resonance_score: resonanceScore,
      coherence_score: 0.80 + Math.random() * 0.15,
      truth_debt: Math.random() * 0.1,
    },
    chain: {
      previous_hash: previousHash,
      chain_hash: '',
      chain_length: chainLength,
    },
  };

  // Compute receipt ID
  const contentForId = canonicalize(receiptContent);
  receiptContent.id = crypto.createHash('sha256').update(contentForId).digest('hex');

  // Compute chain hash
  const receiptForChain = { ...receiptContent };
  receiptForChain.chain = { ...receiptContent.chain, chain_hash: '' };
  const contentForChain = canonicalize(receiptForChain);
  const chainContent = contentForChain + receiptContent.chain.previous_hash;
  receiptContent.chain.chain_hash = crypto.createHash('sha256').update(chainContent).digest('hex');

  // Sign the receipt
  const canonicalReceipt = canonicalize(receiptContent);
  const signature = await keysService.sign(canonicalReceipt);

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

  return { signedReceipt, publicKeyHex, response };
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

    await keysService.initialize();

    const aiResponse = `This is a demo response for: "${prompt.substring(0, 100)}". In a production environment, this would be a real AI-generated response that gets evaluated for trust compliance.`;
    const sessionId = `demo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const { signedReceipt, publicKeyHex } = await buildSignedReceipt({
      prompt,
      response: aiResponse,
      model,
      previousHash: 'GENESIS',
      chainLength: 1,
      sessionId,
      includeContent,
    });

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

// ── Enterprise-themed chain scenarios ───────────────────────────────────────
const CHAIN_SCENARIOS = [
  {
    prompt: 'What are our data governance policies for customer PII in the EU market?',
    response: 'Based on your organization\'s data governance framework, EU customer PII is subject to GDPR Article 6 lawful basis requirements. Your current policy mandates: (1) explicit consent for marketing data, (2) legitimate interest assessment for operational data, (3) 90-day retention limits for session data, and (4) mandatory DPIAs for any new processing activity involving special category data.',
    model: 'gpt-4o',
    trustScore: 0.94,
  },
  {
    prompt: 'Analyze Q3 revenue projections against our compliance budget allocation',
    response: 'Q3 revenue projections show $12.4M against a compliance budget of $1.8M (14.5% ratio). This is within the 10-20% benchmark for regulated financial services. Key allocations: SOX audit preparation ($420K), ongoing monitoring tools ($380K), staff training ($290K), and incident response readiness ($710K). Recommendation: reallocate $150K from training to automated monitoring given the 23% increase in regulatory inquiries.',
    model: 'gpt-4o',
    trustScore: 0.91,
  },
  {
    prompt: 'Review the latest internal audit findings and flag any critical compliance gaps',
    response: 'Internal audit completed 2024-Q3 identified 3 findings: (1) CRITICAL — Access control logs show 12 instances of privilege escalation without documented approval, violating SOX Section 404. Remediation deadline: 30 days. (2) MEDIUM — Third-party vendor risk assessments overdue for 4 of 28 critical vendors. (3) LOW — Employee security awareness training completion at 87%, below 95% target. Overall compliance posture: SATISFACTORY with exceptions.',
    model: 'gpt-4o',
    trustScore: 0.88,
  },
];

/**
 * POST /api/public-demo/generate-chain
 * Generate a chain of 3 linked trust receipts (no auth required)
 */
router.post('/generate-chain', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a minute.'
      });
    }

    await keysService.initialize();

    const sessionId = `chain-demo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const receipts: any[] = [];
    let previousHash = 'GENESIS';

    for (let i = 0; i < CHAIN_SCENARIOS.length; i++) {
      const scenario = CHAIN_SCENARIOS[i];
      const { signedReceipt } = await buildSignedReceipt({
        prompt: scenario.prompt,
        response: scenario.response,
        model: scenario.model,
        previousHash,
        chainLength: i + 1,
        sessionId,
        includeContent: true,
        trustScore: scenario.trustScore,
      });

      // Next receipt chains to this one's chain_hash
      previousHash = signedReceipt.chain.chain_hash;
      receipts.push(signedReceipt);
    }

    const publicKeyHex = await keysService.getPublicKeyHex();

    logger.info('Demo chain generated', {
      sessionId,
      chainLength: receipts.length,
      ip: clientIp,
    });

    res.json({
      success: true,
      data: {
        receipts,
        chain_length: receipts.length,
        session_id: sessionId,
        verification: {
          publicKey: publicKeyHex,
          verifyUrl: '/.well-known/sonate-pubkey',
          didDocument: '/.well-known/did.json',
        },
      },
    });
  } catch (error) {
    logger.error('Demo chain generation failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Chain generation failed',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/public-demo/verify-chain
 * Verify a chain of receipts — signatures + chain hash linkage (no auth required)
 */
router.post('/verify-chain', async (req: Request, res: Response) => {
  try {
    const { receipts } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'receipts array is required',
      });
    }

    await keysService.initialize();
    const publicKeyHex = await keysService.getPublicKeyHex();

    const results: any[] = [];
    let chainIntegrity = true;

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      const checks: Record<string, { status: string; message: string }> = {};

      // 1. Signature verification
      if (receipt.signature?.value) {
        try {
          const receiptWithoutSig = { ...receipt };
          delete receiptWithoutSig.signature;
          const canonicalContent = canonicalize(receiptWithoutSig);
          const isValid = await keysService.verify(canonicalContent, receipt.signature.value);
          checks.signature = {
            status: isValid ? 'PASS' : 'FAIL',
            message: isValid ? 'Ed25519 signature verified' : 'Signature verification failed',
          };
          if (!isValid) chainIntegrity = false;
        } catch {
          checks.signature = { status: 'FAIL', message: 'Signature verification error' };
          chainIntegrity = false;
        }
      } else {
        checks.signature = { status: 'FAIL', message: 'No signature present' };
        chainIntegrity = false;
      }

      // 2. Chain hash verification
      if (receipt.chain?.chain_hash && receipt.chain?.previous_hash) {
        const receiptForChain = { ...receipt };
        delete receiptForChain.signature;
        receiptForChain.chain = { ...receipt.chain, chain_hash: '' };
        const contentForChain = canonicalize(receiptForChain);
        const chainContent = contentForChain + receipt.chain.previous_hash;
        const expectedChainHash = crypto.createHash('sha256').update(chainContent).digest('hex');
        const valid = receipt.chain.chain_hash === expectedChainHash;
        checks.chain_hash = {
          status: valid ? 'PASS' : 'FAIL',
          message: valid ? 'Chain hash verified' : 'Chain hash mismatch',
        };
        if (!valid) chainIntegrity = false;
      } else {
        checks.chain_hash = { status: 'FAIL', message: 'Missing chain data' };
        chainIntegrity = false;
      }

      // 3. Chain link verification (receipt N references receipt N-1)
      if (i === 0) {
        const isGenesis = receipt.chain?.previous_hash === 'GENESIS';
        checks.chain_link = {
          status: isGenesis ? 'PASS' : 'FAIL',
          message: isGenesis ? 'Genesis receipt (chain start)' : 'First receipt should reference GENESIS',
        };
        if (!isGenesis) chainIntegrity = false;
      } else {
        const prevReceipt = receipts[i - 1];
        const linksCorrectly = receipt.chain?.previous_hash === prevReceipt.chain?.chain_hash;
        checks.chain_link = {
          status: linksCorrectly ? 'PASS' : 'FAIL',
          message: linksCorrectly
            ? `Links to receipt ${i} (${prevReceipt.id?.substring(0, 8)}...)`
            : 'Chain link broken — previous_hash does not match prior receipt',
        };
        if (!linksCorrectly) chainIntegrity = false;
      }

      results.push({
        index: i,
        receipt_id: receipt.id,
        timestamp: receipt.timestamp,
        checks,
      });
    }

    res.json({
      success: true,
      data: {
        chain_integrity: chainIntegrity,
        overall_status: chainIntegrity ? 'VERIFIED' : 'FAILED',
        chain_length: receipts.length,
        results,
        publicKey: publicKeyHex,
      },
    });
  } catch (error) {
    logger.error('Demo chain verification failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Chain verification failed',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/public-demo/export
 * Export receipts in JSON or CSV format (no auth required)
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { receipts, format = 'json' } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'receipts array is required',
      });
    }

    if (format === 'csv') {
      const headers = [
        'receipt_id', 'timestamp', 'session_id', 'agent_did', 'human_did',
        'mode', 'model', 'resonance_score', 'coherence_score', 'truth_debt',
        'chain_hash', 'previous_hash', 'chain_length', 'signature_algorithm',
        'signature_value',
      ];

      const escapeCsv = (value: any): string => {
        const s = String(value ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const rows = receipts.map(r => [
        r.id,
        r.timestamp,
        r.session_id,
        r.agent_did,
        r.human_did,
        r.mode,
        r.interaction?.model,
        r.telemetry?.resonance_score,
        r.telemetry?.coherence_score,
        r.telemetry?.truth_debt,
        r.chain?.chain_hash,
        r.chain?.previous_hash,
        r.chain?.chain_length,
        r.signature?.algorithm,
        r.signature?.value,
      ].map(escapeCsv).join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trust-receipts.csv"');
      return res.send(csv);
    }

    // Default: JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="trust-receipts.json"');
    res.json({
      export_metadata: {
        exported_at: new Date().toISOString(),
        format: 'json',
        count: receipts.length,
        version: '2.0.0',
      },
      receipts,
    });
  } catch (error) {
    logger.error('Demo export failed', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: getErrorMessage(error),
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
