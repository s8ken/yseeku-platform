/**
 * Trust Portability API Routes
 * 
 * Cross-platform trust exchange endpoints:
 * - Export trust data
 * - Import from other platforms
 * - Aggregate scores
 * - Trust badges
 */

import { Router, Request, Response } from 'express';
import { trustPortabilityService } from '../services/trust-portability.service';
import { protect } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * POST /api/trust-export
 * Export trust data for a subject
 */
router.post('/export', protect, async (req: Request, res: Response) => {
  try {
    const { subjectType, subjectId, includeReceipts, limit, since } = req.body;
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');

    if (!subjectType || !subjectId) {
      res.status(400).json({
        success: false,
        error: 'subjectType and subjectId are required',
      });
      return;
    }

    if (!['agent', 'session', 'tenant'].includes(subjectType)) {
      res.status(400).json({
        success: false,
        error: 'subjectType must be agent, session, or tenant',
      });
      return;
    }

    const exportData = await trustPortabilityService.exportTrust(
      subjectType,
      String(subjectId),
      tenantId,
      {
        includeReceipts,
        limit,
        since: since ? new Date(since) : undefined,
      }
    );

    res.json({
      success: true,
      data: exportData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to export trust data', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to export trust data',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/trust-export/import
 * Import trust data from another platform
 */
router.post('/import', protect, async (req: Request, res: Response) => {
  try {
    const { importData } = req.body;
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');

    if (!importData) {
      res.status(400).json({
        success: false,
        error: 'importData is required',
      });
      return;
    }

    const result = await trustPortabilityService.importTrust(importData, tenantId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to import trust data', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to import trust data',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/trust-export/aggregate
 * Aggregate trust scores from multiple sources
 */
router.post('/aggregate', protect, async (req: Request, res: Response) => {
  try {
    const { subjectId, sources } = req.body;

    if (!subjectId || !sources || !Array.isArray(sources)) {
      res.status(400).json({
        success: false,
        error: 'subjectId and sources array are required',
      });
      return;
    }

    const aggregated = await trustPortabilityService.aggregateTrust(
      String(subjectId),
      sources
    );

    res.json({
      success: true,
      data: aggregated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to aggregate trust', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate trust',
      message: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/trust-export/badge
 * Generate a portable trust badge
 */
router.post('/badge', protect, async (req: Request, res: Response) => {
  try {
    const { subjectType, subjectId } = req.body;
    const tenantId = String((req as any).userTenant || (req as any).tenant || 'default');

    if (!subjectType || !subjectId) {
      res.status(400).json({
        success: false,
        error: 'subjectType and subjectId are required',
      });
      return;
    }

    const badge = await trustPortabilityService.generateTrustBadge(
      subjectType,
      String(subjectId),
      tenantId
    );

    res.json({
      success: true,
      data: badge,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to generate badge', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to generate badge',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust-export/verify-badge
 * Verify a trust badge (public endpoint)
 */
router.get('/verify-badge', async (req: Request, res: Response) => {
  try {
    const { b: badge } = req.query;

    if (!badge) {
      res.status(400).json({
        success: false,
        error: 'Badge (b) parameter is required',
      });
      return;
    }

    const result = await trustPortabilityService.verifyTrustBadge(String(badge));

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to verify badge', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      error: 'Failed to verify badge',
      message: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/trust-export/formats
 * List supported import/export formats
 */
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      export: [
        {
          format: 'sonate-trust-export',
          version: '1.0',
          description: 'SONATE native trust export format',
        },
        {
          format: 'verifiable-credential',
          version: 'W3C VC 1.1',
          description: 'W3C Verifiable Credentials format',
        },
      ],
      import: [
        {
          format: 'sonate-trust-export',
          version: '1.0',
          verified: true,
        },
        {
          format: 'generic-trust-score',
          version: '1.0',
          verified: false,
          description: 'Generic trust score from any platform',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
