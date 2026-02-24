/**
 * Policy API Routes
 * 
 * Core policy engine evaluation endpoints using @sonate/policy
 * Evaluates trust receipts against SONATE constitutional principles
 */

import { Router, Request, Response } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import {
  PolicyEngine,
  PolicyRegistry,
  sonatePrinciples,
  sonateRules,
  getAllPrincipleIds,
} from '@sonate/policy';

// Initialize the policy engine with SONATE rules and principles
const registry = new PolicyRegistry();
registry.registerRules(sonateRules);
registry.registerPrinciples(sonatePrinciples);

const engine = new PolicyEngine(registry, {
  enabledPrinciples: getAllPrincipleIds(),
  maxEvaluationTimeMs: 50,
  strictMode: true,
});

const router = Router();

/**
 * POST /api/policy/evaluate
 * Evaluate a trust receipt against SONATE principles
 */
router.post('/evaluate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { receipt, principleIds } = req.body;

    if (!receipt || typeof receipt !== 'object') {
      res.status(400).json({ success: false, error: 'Missing or invalid receipt' });
      return;
    }

    const result = engine.evaluate(receipt, principleIds);

    logger.info('Policy evaluation completed', {
      receiptId: receipt.id,
      passed: result.passed,
      violations: result.violations.length,
      timeMs: result.metadata.evaluationTimeMs,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Policy evaluation failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Policy evaluation failed' });
  }
});

/**
 * POST /api/policy/evaluate/batch
 * Evaluate multiple receipts in batch
 */
router.post('/evaluate/batch', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { receipts, principleIds } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      res.status(400).json({ success: false, error: 'receipts must be a non-empty array' });
      return;
    }

    if (receipts.length > 100) {
      res.status(400).json({ success: false, error: 'Batch limit is 100 receipts' });
      return;
    }

    const result = engine.evaluateBatch(receipts, principleIds);

    res.json({
      success: true,
      data: {
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        evaluationTimeMs: result.evaluationTimeMs,
      },
    });
  } catch (error) {
    logger.error('Batch policy evaluation failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Batch evaluation failed' });
  }
});

/**
 * GET /api/policy/principles
 * List all registered SONATE principles
 */
router.get('/principles', protect, (_req: Request, res: Response): void => {
  const principleIds = getAllPrincipleIds();
  const principles = principleIds.map(id => {
    const p = sonatePrinciples.find(sp => sp.id === id);
    return p ? { id: p.id, name: p.name, description: p.description, rules: p.rules } : null;
  }).filter(Boolean);

  res.json({ success: true, data: principles });
});

/**
 * GET /api/policy/stats
 * Get policy engine statistics
 */
router.get('/stats', protect, (_req: Request, res: Response): void => {
  const stats = engine.getStats();
  const config = engine.getConfig();

  res.json({
    success: true,
    data: {
      stats,
      config: {
        enabledPrinciples: config.enabledPrinciples,
        maxEvaluationTimeMs: config.maxEvaluationTimeMs,
        strictMode: config.strictMode,
      },
    },
  });
});

/**
 * POST /api/policy/check
 * Quick check if a receipt passes or should be blocked
 */
router.post('/check', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { receipt, principleIds } = req.body;

    if (!receipt || typeof receipt !== 'object') {
      res.status(400).json({ success: false, error: 'Missing or invalid receipt' });
      return;
    }

    const shouldBlock = engine.shouldBlock(receipt, principleIds);

    res.json({
      success: true,
      data: {
        blocked: shouldBlock,
        action: shouldBlock ? 'block' : 'allow',
      },
    });
  } catch (error) {
    logger.error('Policy check failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Policy check failed' });
  }
});

export { engine as policyEngine, registry as policyRegistry };
export default router;
