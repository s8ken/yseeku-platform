/**
 * Policy Audit Routes
 * 
 * Audit trail and compliance reporting using @sonate/policy
 */

import { Router, Request, Response } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware';
import { getErrorMessage } from '../utils/error-utils';
import logger from '../utils/logger';
import { createAuditLogger } from '@sonate/policy';

// Shared audit logger instance
const auditLogger = createAuditLogger();

const router = Router();

/**
 * GET /api/policy-audit
 * List recent audit entries
 */
router.get('/', protect, (req: Request, res: Response): void => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
  const entries = auditLogger.query({ limit });

  res.json({
    success: true,
    data: entries,
  });
});

/**
 * POST /api/policy-audit/compliance-report
 * Generate a compliance report for a time period
 */
router.post('/compliance-report', protect, requireRole(['admin', 'operator']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate required' });
      return;
    }

    const report = auditLogger.generateReport(new Date(startDate), new Date(endDate));

    logger.info('Compliance report generated', {
      period: `${startDate} → ${endDate}`,
      evaluations: report.summary.totalEvaluations,
    });

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Compliance report generation failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

export { auditLogger };
export default router;
