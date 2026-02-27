/**
 * Compliance Report Routes
 * API endpoints for generating and downloading compliance reports
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.middleware';
import { complianceReportService, ReportType, ReportFormat } from '../services/compliance-report.service';
import { GeneratedReport } from '../models/generated-report.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

// Validation schemas
const generateReportSchema = z.object({
  type: z.enum(['trust_summary', 'sonate_compliance', 'incident_report', 'agent_audit', 'full_audit']),
  format: z.enum(['json', 'html', 'csv']).optional().default('json'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeDetails: z.boolean().optional().default(true),
  agentIds: z.array(z.string()).optional(),
});

/**
 * POST /api/reports/generate
 * Generate a compliance report
 */
router.post('/generate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = generateReportSchema.parse(req.body);
    const tenantId = (req as any).tenant || 'default';
    
    // Default to last 30 days if not specified
    const endDate = body.endDate ? new Date(body.endDate) : new Date();
    const startDate = body.startDate 
      ? new Date(body.startDate) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const report = await complianceReportService.generateReport({
      type: body.type as ReportType,
      format: body.format as ReportFormat,
      tenantId,
      startDate,
      endDate,
      includeDetails: body.includeDetails,
      agentIds: body.agentIds,
    });

    // Persist the generated report to history (JSON format only — HTML/CSV too large)
    if (body.format === 'json' && report && typeof report === 'object') {
      const reportPayload = report as any;
      const payloadStr = JSON.stringify(report);
      const reportId = reportPayload?.meta?.reportId
        || reportPayload?.reportId
        || `${body.type}-${Date.now()}`;

      // Extract a summary for the history list view
      const summary: Record<string, any> = {};
      if (reportPayload?.summary?.totalConversations !== undefined)
        summary.totalConversations = reportPayload.summary.totalConversations;
      if (reportPayload?.summary?.avgTrustScore !== undefined)
        summary.avgTrustScore = reportPayload.summary.avgTrustScore;
      if (reportPayload?.summary?.complianceRate !== undefined)
        summary.complianceRate = reportPayload.summary.complianceRate;
      if (reportPayload?.status !== undefined)
        summary.status = reportPayload.status;
      if (reportPayload?.overallScore !== undefined)
        summary.avgTrustScore = reportPayload.overallScore;

      try {
        await GeneratedReport.create({
          reportId,
          type: body.type,
          format: body.format,
          tenantId,
          generatedBy: (req as any).userId,
          startDate,
          endDate,
          summary,
          payload: report,
          sizeBytes: Buffer.byteLength(payloadStr, 'utf8'),
          generatedAt: new Date(),
        });
        logger.info('Report persisted to history', { reportId, type: body.type, tenantId });
      } catch (persistError) {
        // Never block report delivery because of history persistence failure
        logger.warn('Failed to persist report to history', {
          error: getErrorMessage(persistError),
          reportId,
        });
      }
    }

    // Set appropriate content type
    if (body.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(report);
    } else if (body.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${body.type}-${Date.now()}.csv"`);
      res.send(report);
    } else {
      res.json({ success: true, data: report });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
      return;
    }
    logger.error('Report generation failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Report generation failed' });
  }
});

/**
 * GET /api/reports/types
 * Get available report types
 */
router.get('/types', protect, (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: [
      {
        id: 'trust_summary',
        name: 'Trust Summary Report',
        description: 'Overview of trust scores, compliance rates, and agent performance',
        formats: ['json', 'html', 'csv'],
      },
      {
        id: 'sonate_compliance',
        name: 'SONATE Compliance Report',
        description: 'Detailed SONATE principle compliance analysis with certification readiness',
        formats: ['json', 'html'],
      },
      {
        id: 'incident_report',
        name: 'Incident Report',
        description: 'Security incidents, alerts, and resolution tracking',
        formats: ['json', 'html', 'csv'],
      },
      {
        id: 'agent_audit',
        name: 'Agent Audit Report',
        description: 'Per-agent performance and compliance audit',
        formats: ['json', 'html', 'csv'],
      },
      {
        id: 'full_audit',
        name: 'Full Audit Report',
        description: 'Comprehensive report combining all audit types',
        formats: ['json', 'html'],
      },
    ],
  });
});

/**
 * GET /api/reports/presets
 * Get predefined report configurations
 */
router.get('/presets', protect, (req: Request, res: Response): void => {
  const now = new Date();
  
  res.json({
    success: true,
    data: [
      {
        id: 'last-7-days',
        name: 'Last 7 Days',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      },
      {
        id: 'last-30-days',
        name: 'Last 30 Days',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      },
      {
        id: 'last-quarter',
        name: 'Last Quarter',
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      },
      {
        id: 'year-to-date',
        name: 'Year to Date',
        startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
        endDate: now.toISOString(),
      },
    ],
  });
});

/**
 * GET /api/reports/history
 * Get previously generated reports for this tenant.
 */
router.get('/history', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenant || 'default';
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const offset = Number(req.query.offset ?? 0);
    const type = req.query.type as string | undefined;

    const filter: Record<string, any> = { tenantId };
    if (type) filter.type = type;

    const [reports, total] = await Promise.all([
      GeneratedReport.find(filter)
        .sort({ generatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('-payload')   // Exclude large payload from list view
        .lean(),
      GeneratedReport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reports.map(r => ({
        reportId: r.reportId,
        type: r.type,
        format: r.format,
        tenantId: r.tenantId,
        generatedBy: r.generatedBy,
        startDate: r.startDate,
        endDate: r.endDate,
        summary: r.summary,
        sizeBytes: r.sizeBytes,
        generatedAt: r.generatedAt,
      })),
      meta: { total, limit, offset, hasMore: (offset + limit) < total },
    });
  } catch (error) {
    logger.error('Failed to fetch report history', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to fetch report history' });
  }
});

/**
 * GET /api/reports/history/:reportId
 * Retrieve the full payload of a previously generated report.
 */
router.get('/history/:reportId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const tenantId = (req as any).tenant || 'default';

    const report = await GeneratedReport.findOne({ reportId, tenantId }).lean();

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Failed to fetch report by ID', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

/**
 * GET /api/reports/schedule
 * Scheduled reports — planned feature, returns empty list with metadata.
 */
router.get('/schedule', protect, async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: [],
    message: 'Scheduled reports will be available in a future release',
  });
});

/**
 * GET /api/reports/demo/:type
 * Generate a demo report for preview
 */
router.get('/demo/:type', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.params.type as ReportType;
    const validTypes = ['trust_summary', 'sonate_compliance', 'incident_report', 'agent_audit', 'full_audit'];
    
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid report type' });
      return;
    }
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const report = await complianceReportService.generateReport({
      type,
      format: 'json',
      tenantId: 'demo',
      startDate,
      endDate,
      includeDetails: true,
    });
    
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Demo report generation failed', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, error: 'Demo report generation failed' });
  }
});

export default router;
