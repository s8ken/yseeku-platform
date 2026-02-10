/**
 * Policy Management API Routes
 * 
 * Endpoints for managing and enforcing policies
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { PolicyEvaluator, AIPolicy } from '@sonate/policy-runtime';
import {
  createPolicyFromTemplate,
  PIIProtectionPolicy,
  TruthDebtThresholdPolicy,
  ComplianceBoundaryPolicy,
  CoherenceConsistencyPolicy,
} from '@sonate/policy-runtime';

const router = Router();

// In-memory storage for now (will move to database)
const policyStorage = new Map<string, AIPolicy>();
const reviewQueue: any[] = [];

/**
 * Validation schemas
 */
const CreatePolicySchema = z.object({
  template: z.enum(['pii-protection', 'truth-debt', 'compliance-boundary', 'coherence-consistency']),
  name: z.string().optional(),
  customConfig: z.record(z.any()).optional(),
});

const EvaluatePolicySchema = z.object({
  receipt: z.any(),
  policy_id: z.string(),
});

const BatchEvaluateSchema = z.object({
  receipts: z.array(z.any()),
  policy_ids: z.array(z.string()),
  strict_mode: z.boolean().optional(),
});

/**
 * POST /api/v2/policies/create
 * Create a new policy from template
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const validated = CreatePolicySchema.parse(req.body);

    // Map template name to template
    const templates: Record<string, any> = {
      'pii-protection': PIIProtectionPolicy,
      'truth-debt': TruthDebtThresholdPolicy,
      'compliance-boundary': ComplianceBoundaryPolicy,
      'coherence-consistency': CoherenceConsistencyPolicy,
    };

    const template = templates[validated.template];
    if (!template) {
      return res.status(400).json({
        success: false,
        error: `Unknown template: ${validated.template}`,
      });
    }

    const policy = createPolicyFromTemplate(template);
    if (validated.name) {
      policy.name = validated.name;
    }

    policyStorage.set(policy.id, policy);

    res.status(201).json({
      success: true,
      policy,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v2/policies/predefined
 * List predefined policy templates
 */
router.get('/predefined', (_req: Request, res: Response) => {
  const templates = [
    {
      id: 'pii-protection',
      name: PIIProtectionPolicy.name,
      description: PIIProtectionPolicy.description,
      domain: PIIProtectionPolicy.domain,
      constraints: PIIProtectionPolicy.constraints.length,
    },
    {
      id: 'truth-debt',
      name: TruthDebtThresholdPolicy.name,
      description: TruthDebtThresholdPolicy.description,
      domain: TruthDebtThresholdPolicy.domain,
      constraints: TruthDebtThresholdPolicy.constraints.length,
    },
    {
      id: 'compliance-boundary',
      name: ComplianceBoundaryPolicy.name,
      description: ComplianceBoundaryPolicy.description,
      domain: ComplianceBoundaryPolicy.domain,
      constraints: ComplianceBoundaryPolicy.constraints.length,
    },
    {
      id: 'coherence-consistency',
      name: CoherenceConsistencyPolicy.name,
      description: CoherenceConsistencyPolicy.description,
      domain: CoherenceConsistencyPolicy.domain,
      constraints: CoherenceConsistencyPolicy.constraints.length,
    },
  ];

  res.json({
    success: true,
    templates,
  });
});

/**
 * GET /api/v2/policies/:policy_id
 * Get policy by ID
 */
router.get('/:policy_id', (req: Request, res: Response) => {
  const policy = policyStorage.get(req.params.policy_id);

  if (!policy) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found',
    });
  }

  res.json({
    success: true,
    policy,
  });
});

/**
 * GET /api/v2/policies
 * List all policies
 */
router.get('/', (_req: Request, res: Response) => {
  const policies = Array.from(policyStorage.values());

  res.json({
    success: true,
    policies,
    count: policies.length,
  });
});

/**
 * DELETE /api/v2/policies/:policy_id
 * Delete a policy
 */
router.delete('/:policy_id', (req: Request, res: Response) => {
  if (!policyStorage.has(req.params.policy_id)) {
    return res.status(404).json({
      success: false,
      error: 'Policy not found',
    });
  }

  policyStorage.delete(req.params.policy_id);

  res.json({
    success: true,
    message: 'Policy deleted',
  });
});

/**
 * GET /api/v2/review-queue
 * List flagged receipts requiring human review
 */
router.get('/review/queue', (_req: Request, res: Response) => {
  const pending = reviewQueue.filter((item) => item.status === 'PENDING');

  res.json({
    success: true,
    queue_items: pending,
    count: pending.length,
    total_pending: pending.length,
    requires_attention: pending.filter((item) => item.critical_violation).length,
  });
});

/**
 * POST /api/v2/review-queue/:item_id/review
 * Mark a review queue item as reviewed
 */
router.post('/review/queue/:item_id/review', (req: Request, res: Response) => {
  const { status, notes, resolution } = req.body;

  const queueItem = reviewQueue.find((item) => item.id === req.params.item_id);
  if (!queueItem) {
    return res.status(404).json({
      success: false,
      error: 'Review queue item not found',
    });
  }

  queueItem.status = status || 'APPROVED';
  queueItem.reviewed_at = new Date().toISOString();
  queueItem.reviewed_by = req.headers['x-user-id'] as string;
  queueItem.notes = notes;
  queueItem.resolution = resolution;

  res.json({
    success: true,
    queue_item: queueItem,
  });
});

export default router;
