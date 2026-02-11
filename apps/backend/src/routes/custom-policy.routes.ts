/**
 * Custom Policy Rules API Routes
 * 
 * CRUD endpoints for tenant-specific policy rules:
 * - Create, read, update, delete rules
 * - Evaluate interactions against rules
 * - Import/export rule sets
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { customPolicyService } from '../services/custom-policy.service';
import { protect, requireRole } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

// Validation schemas
const RuleConditionSchema = z.object({
  type: z.enum(['contains', 'not_contains', 'regex', 'sentiment', 'length_min', 'length_max', 'keyword_density', 'custom_function']),
  field: z.enum(['prompt', 'response', 'combined']),
  value: z.union([z.string(), z.number()]),
  caseSensitive: z.boolean().optional(),
});

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  enabled: z.boolean().default(true),
  conditions: z.array(RuleConditionSchema).min(1),
  logic: z.enum(['AND', 'OR']).default('AND'),
  action: z.enum(['block', 'warn', 'log']).default('warn'),
  message: z.string().min(1).max(200),
  tags: z.array(z.string()).default([]),
});

const UpdateRuleSchema = CreateRuleSchema.partial();

const EvaluateSchema = z.object({
  prompt: z.string(),
  response: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/policy-rules
 * Create a new custom policy rule
 */
router.post('/', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const validated = CreateRuleSchema.parse(req.body);
    const tenantId = (req as any).userTenant || (req as any).tenant || 'default';
    const userId = (req as any).user?.id || (req as any).user?.email || 'unknown';

    const rule = await customPolicyService.createRule(tenantId, validated, userId);

    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
      return;
    }
    logger.error('Failed to create policy rule', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to create policy rule',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/policy-rules
 * List all custom policy rules for tenant
 */
router.get('/', protect, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).userTenant || (req as any).tenant || 'default';
    const { enabled, tags, severity, limit, offset } = req.query;

    const result = await customPolicyService.listRules(tenantId, {
      enabled: enabled !== undefined ? String(enabled) === 'true' : undefined,
      tags: tags ? String(tags).split(',') : undefined,
      severity: severity ? String(severity) as any : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
      offset: offset ? parseInt(String(offset)) : undefined,
    });

    res.json({
      success: true,
      data: result.rules,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(String(limit)) : 100,
        offset: offset ? parseInt(String(offset)) : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to list policy rules', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to list policy rules',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/policy-rules/:ruleId
 * Get a specific rule
 */
router.get('/:ruleId', protect, async (req: Request, res: Response) => {
  try {
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');
    const ruleId = String(req.params.ruleId);

    const rule = await customPolicyService.getRule(tenantId, ruleId);

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
      return;
    }

    res.json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get policy rule', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to get policy rule',
      message: getErrorMessage(error),
    });
  }
});

/**
 * PUT /api/policy-rules/:ruleId
 * Update a rule
 */
router.put('/:ruleId', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const validated = UpdateRuleSchema.parse(req.body);
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');
    const userId = String((req as any).user?.id || (req as any).user?.email || 'unknown');
    const ruleId = String(req.params.ruleId);

    const rule = await customPolicyService.updateRule(tenantId, ruleId, validated, userId);

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
      return;
    }

    res.json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
      return;
    }
    logger.error('Failed to update policy rule', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to update policy rule',
      message: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/policy-rules/:ruleId
 * Delete a rule
 */
router.delete('/:ruleId', protect, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');
    const ruleId = String(req.params.ruleId);

    const deleted = await customPolicyService.deleteRule(tenantId, ruleId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Rule deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to delete policy rule', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to delete policy rule',
      message: getErrorMessage(error),
    });
  }
});

/**
 * PATCH /api/policy-rules/:ruleId/toggle
 * Toggle rule enabled status
 */
router.patch('/:ruleId/toggle', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');
    const ruleId = String(req.params.ruleId);
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'enabled must be a boolean',
      });
      return;
    }

    const updated = await customPolicyService.toggleRule(tenantId, ruleId, enabled);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
      return;
    }

    res.json({
      success: true,
      message: `Rule ${enabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to toggle policy rule', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle policy rule',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/policy-rules/:ruleId/clone
 * Clone a rule
 */
router.post('/:ruleId/clone', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');
    const userId = String((req as any).user?.id || (req as any).user?.email || 'unknown');
    const ruleId = String(req.params.ruleId);
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'name is required for cloning',
      });
      return;
    }

    const rule = await customPolicyService.cloneRule(tenantId, ruleId, name, userId);

    if (!rule) {
      res.status(404).json({
        success: false,
        error: 'Source rule not found',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: rule,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to clone policy rule', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to clone policy rule',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/policy-rules/evaluate
 * Evaluate an interaction against all enabled rules
 */
router.post('/evaluate', protect, async (req: Request, res: Response) => {
  try {
    const validated = EvaluateSchema.parse(req.body);
    const tenantId = (req as any).userTenant || (req as any).tenant || 'default';

    const result = await customPolicyService.evaluate(tenantId, validated);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues,
      });
      return;
    }
    logger.error('Failed to evaluate policy rules', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate policy rules',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/policy-rules/import
 * Import rules from JSON
 */
router.post('/import', protect, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { rules } = req.body;
    const tenantId = (req as any).userTenant || (req as any).tenant || 'default';
    const userId = (req as any).user?.id || (req as any).user?.email || 'unknown';

    if (!Array.isArray(rules)) {
      res.status(400).json({
        success: false,
        error: 'rules must be an array',
      });
      return;
    }

    const result = await customPolicyService.importRules(tenantId, rules, userId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to import policy rules', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to import policy rules',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/policy-rules/export
 * Export all rules as JSON
 */
router.get('/export', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).userTenant || (req as any).tenant || 'default';

    const rules = await customPolicyService.exportRules(tenantId);

    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        tenantId,
        ruleCount: rules.length,
        rules,
      },
    });
  } catch (error) {
    logger.error('Failed to export policy rules', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to export policy rules',
      message: getErrorMessage(error),
    });
  }
});

export default router;
