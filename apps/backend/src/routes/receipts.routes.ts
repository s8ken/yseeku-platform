/**
 * Receipts API Routes
 * 
 * HTTP endpoints for receipt generation, verification, and export
 * 
 * Endpoints:
 * - POST   /api/v1/receipts/generate    Generate new receipt
 * - GET    /api/v1/receipts/:id         Fetch receipt by ID
 * - POST   /api/v1/receipts/verify      Verify receipt
 * - POST   /api/v1/receipts/export      Export receipts (batch)
 * - GET    /api/v1/receipts/list        List receipts with filters
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  ReceiptGeneratorService,
  ReceiptValidatorService,
  ReceiptExporterService,
  type ExportFormat,
  type ExportFilter,
} from '../services/receipts';
import { TrustReceipt, CreateReceiptInput } from '@sonate/schemas';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import logger from '../utils/logger';

const router = Router();

// Initialize services
const generator = new ReceiptGeneratorService();
const validator = new ReceiptValidatorService();
const exporter = new ReceiptExporterService();

/**
 * Zod schemas for request validation
 */
const CreateReceiptSchema = z.object({
  session_id: z.string().min(1),
  agent_did: z.string().regex(/^did:sonate:[a-zA-Z0-9]{40}$/),
  human_did: z.string().regex(/^did:sonate:[a-zA-Z0-9]{40}$/),
  policy_version: z.string(),
  mode: z.enum(['constitutional', 'directive']),
  interaction: z.object({
    prompt: z.string(),
    response: z.string(),
    model: z.string(),
    provider: z.enum(['openai', 'anthropic', 'aws-bedrock', 'local']).optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().optional(),
  }),
  telemetry: z.object({
    resonance_score: z.number().min(0).max(1).optional(),
    resonance_quality: z.enum(['STRONG', 'ADVANCED', 'BREAKTHROUGH']).optional(),
    bedau_index: z.number().min(0).max(1).optional(),
    coherence_score: z.number().min(0).max(1).optional(),
    truth_debt: z.number().min(0).max(1).optional(),
    volatility: z.number().min(0).max(1).optional(),
  }).optional(),
  policy_state: z.object({
    constraints_applied: z.array(z.string()).optional(),
    consent_verified: z.boolean().optional(),
    override_available: z.boolean().optional(),
  }).optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    context: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

const VerifyReceiptSchema = z.object({
  receipt: z.unknown(),
  publicKey: z.string().optional(),
  previousChainHash: z.string().optional(),
});

const ExportReceiptsSchema = z.object({
  format: z.enum(['json', 'jsonl', 'csv', 'splunk', 'datadog', 'elastic']),
  filter: z.object({
    sessionId: z.string().optional(),
    agentDid: z.string().optional(),
    humanDid: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    minResonanceScore: z.number().min(0).max(1).optional(),
    maxTruthDebt: z.number().min(0).max(1).optional(),
    policyViolationsOnly: z.boolean().optional(),
    consentVerifiedOnly: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  pagination: z.object({
    limit: z.number().int().positive().optional(),
    offset: z.number().int().min(0).optional(),
  }).optional(),
});

/**
 * POST /api/v1/receipts/generate
 * Generate a new trust receipt
 */
router.post(
  '/generate',
  protect,
  validateBody(CreateReceiptSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input: CreateReceiptInput = req.body;

      // In production, retrieve agent's private key from secure store (HSM, KMS)
      // For demo/dev, use environment variable
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY || '';

      if (!agentPrivateKey) {
        res.status(500).json({
          success: false,
          error: 'Agent private key not configured',
        });
        return;
      }

      // Generate receipt
      const receipt = await generator.createReceipt(input, agentPrivateKey);

      // Persist receipt to database
      try {
        await TrustReceiptModel.create({
          self_hash: receipt.id,
          session_id: receipt.session_id,
          version: receipt.version,
          timestamp: new Date(receipt.timestamp).getTime(),
          mode: receipt.mode,
          ciq_metrics: receipt.telemetry?.ciq_metrics || {
            clarity: 0,
            integrity: 0,
            quality: 0,
          },
          previous_hash: receipt.chain?.previous_hash,
          chain_hash: receipt.chain?.chain_hash,
          chain_length: receipt.chain?.chain_length,
          signature: receipt.signature?.value,
          tenant_id: (req as any).tenant || 'default',
          issuer: receipt.agent_did,
          subject: receipt.human_did,
        });
        logger.info('Receipt persisted to database', { id: receipt.id });
      } catch (dbErr: unknown) {
        // Log but don't fail the request — the receipt was generated successfully
        logger.warn('Failed to persist receipt to database', {
          error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          receipt_id: receipt.id,
        });
      }

      res.status(201).json({
        success: true,
        data: receipt,
      });
    } catch (err) {
      logger.error('Receipt generation failed', {
        error: err instanceof Error ? err.message : String(err),
        path: req.path,
      });
      next(err);
    }
  }
);

/**
 * GET /api/v1/receipts/:id
 * Fetch receipt by ID (SHA-256 hash)
 */
router.get(
  '/:id',
  protect,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate receipt ID format (SHA-256)
      if (!/^[a-f0-9]{64}$/.test(id as string)) {
        res.status(400).json({
          success: false,
          error: 'Invalid receipt ID format',
        });
        return;
      }

      // Fetch from database by self_hash (which maps to the receipt id)
      const receipt = await TrustReceiptModel.findOne({ self_hash: id });

      if (!receipt) {
        res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
        return;
      }

      res.json({
        success: true,
        data: (receipt as any)._receipt_data || receipt.toJSON(),
      });
    } catch (err) {
      logger.error('Receipt fetch failed', {
        error: err instanceof Error ? err.message : String(err),
        path: req.path,
      });
      next(err);
    }
  }
);

/**
 * POST /api/v1/receipts/verify
 * Verify receipt signature and chain integrity
 */
router.post(
  '/verify',
  validateBody(VerifyReceiptSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { receipt, publicKey, previousChainHash } = req.body;

      // Verify receipt
      const result = await validator.verifyReceipt(receipt, publicKey, previousChainHash);

      // Return detailed verification result
      res.status(result.valid ? 200 : 400).json({
        success: result.valid,
        data: {
          valid: result.valid,
          checks: result.checks,
          errors: result.errors,
          warnings: result.warnings,
          receipt_id: (result.receipt as any)?.id,
        },
      });
    } catch (err) {
      logger.error('Receipt verification failed', {
        error: err instanceof Error ? err.message : String(err),
        path: req.path,
      });
      next(err);
    }
  }
);

/**
 * POST /api/v1/receipts/export
 * Export receipts in requested format
 */
router.post(
  '/export',
  protect,
  validateBody(ExportReceiptsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { format, filter, pagination } = req.body;

      // Build MongoDB query from filters
      const query: Record<string, any> = {};
      if (filter) {
        if (filter.sessionId) query.session_id = filter.sessionId;
        if (filter.agentDid) query.issuer = filter.agentDid;
        if (filter.humanDid) query.subject = filter.humanDid;
        if (filter.startTime || filter.endTime) {
          query.timestamp = {};
          if (filter.startTime) query.timestamp.$gte = new Date(filter.startTime).getTime();
          if (filter.endTime) query.timestamp.$lte = new Date(filter.endTime).getTime();
        }
      }

      const limit = pagination?.limit || 100;
      const offset = pagination?.offset || 0;

      // Fetch receipts from database
      const dbReceipts = await TrustReceiptModel.find(query)
        .limit(limit)
        .skip(offset)
        .sort({ timestamp: -1 })
        .lean();

      // Map DB documents to TrustReceipt format for export
      const receipts: TrustReceipt[] = dbReceipts.map((doc: any) =>
        doc._receipt_data || doc
      );

      // Export in requested format
      const exported = exporter.export(
        receipts,
        format as ExportFormat,
        filter as ExportFilter,
        pagination
      );

      // Set response headers
      res.setHeader('Content-Type', exporter.getMimeType(format as ExportFormat));
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="receipts-export-${Date.now()}.${exporter.getFileExtension(format as ExportFormat)}"`
      );

      res.send(exported);
    } catch (err) {
      logger.error('Receipt export failed', {
        error: err instanceof Error ? err.message : String(err),
        path: req.path,
      });
      next(err);
    }
  }
);

/**
 * GET /api/v1/receipts/list
 * List receipts with optional filters
 */
router.get(
  '/list',
  protect,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        sessionId,
        agentDid,
        startTime,
        endTime,
        limit = 50,
        offset = 0,
      } = req.query;

      // Build MongoDB query with filters
      const query: Record<string, any> = {};
      if (sessionId) query.session_id = sessionId;
      if (agentDid) query.issuer = agentDid;
      if (startTime || endTime) {
        query.timestamp = {};
        if (startTime) query.timestamp.$gte = new Date(startTime as string).getTime();
        if (endTime) query.timestamp.$lte = new Date(endTime as string).getTime();
      }

      const receipts = await TrustReceiptModel.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ timestamp: -1 })
        .lean();

      const total = await TrustReceiptModel.countDocuments(query);

      res.json({
        success: true,
        data: {
          receipts: receipts.map((doc: any) => doc._receipt_data || doc),
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total,
          },
        },
      });
    } catch (err) {
      logger.error('Receipt list failed', {
        error: err instanceof Error ? err.message : String(err),
        path: req.path,
      });
      next(err);
    }
  }
);

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'receipts-api',
    status: 'healthy',
    version: '2.0.0',
  });
});

export default router;