/**
 * Policies Routes
 * 
 * Lists available policies and their rules via @sonate/policy
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { sonatePrinciples, sonateRules, getAllPrincipleIds, getPrinciple } from '@sonate/policy';

const router = Router();

/**
 * GET /api/policies
 * List all registered SONATE policy principles
 */
router.get('/', protect, (_req: Request, res: Response): void => {
  const principles = sonatePrinciples.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    ruleCount: p.rules.length,
  }));

  res.json({
    success: true,
    data: {
      principles,
      totalRules: sonateRules.length,
    },
  });
});

/**
 * GET /api/policies/:principleId/rules
 * Get rules for a specific principle
 */
router.get('/:principleId/rules', protect, (req: Request, res: Response): void => {
  const principleId = req.params.principleId as string;
  const principle = getPrinciple(principleId);

  if (!principle) {
    res.status(404).json({ success: false, error: `Principle not found: ${principleId}` });
    return;
  }

  // Rules are stored as IDs in principles; return the IDs with metadata from sonateRules
  const ruleDetails = principle.rules.map(ruleId => {
    const rule = sonateRules.find(r => r.id === ruleId);
    return rule
      ? { id: rule.id, name: rule.name, description: rule.description, severity: rule.severity, enabled: rule.enabled }
      : { id: ruleId, name: ruleId, description: 'Unknown rule', severity: 'medium', enabled: true };
  });

  res.json({
    success: true,
    data: ruleDetails,
  });
});

export default router;
