"use strict";
/**
 * Compliance Report Routes
 * API endpoints for generating and downloading compliance reports
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middleware/auth.middleware");
const compliance_report_service_1 = require("../services/compliance-report.service");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
// Validation schemas
const generateReportSchema = zod_1.z.object({
    type: zod_1.z.enum(['trust_summary', 'symbi_compliance', 'incident_report', 'agent_audit', 'full_audit']),
    format: zod_1.z.enum(['json', 'html', 'csv']).optional().default('json'),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    includeDetails: zod_1.z.boolean().optional().default(true),
    agentIds: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * POST /api/reports/generate
 * Generate a compliance report
 */
router.post('/generate', auth_middleware_1.protect, async (req, res) => {
    try {
        const body = generateReportSchema.parse(req.body);
        const tenantId = req.tenant || 'default';
        // Default to last 30 days if not specified
        const endDate = body.endDate ? new Date(body.endDate) : new Date();
        const startDate = body.startDate
            ? new Date(body.startDate)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const report = await compliance_report_service_1.complianceReportService.generateReport({
            type: body.type,
            format: body.format,
            tenantId,
            startDate,
            endDate,
            includeDetails: body.includeDetails,
            agentIds: body.agentIds,
        });
        // Set appropriate content type
        if (body.format === 'html') {
            res.setHeader('Content-Type', 'text/html');
            res.send(report);
        }
        else if (body.format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${body.type}-${Date.now()}.csv"`);
            res.send(report);
        }
        else {
            res.json({ success: true, data: report });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.issues,
            });
            return;
        }
        logger_1.default.error('Report generation failed', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Report generation failed' });
    }
});
/**
 * GET /api/reports/types
 * Get available report types
 */
router.get('/types', auth_middleware_1.protect, (req, res) => {
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
                id: 'symbi_compliance',
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
router.get('/presets', auth_middleware_1.protect, (req, res) => {
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
 * Get previously generated reports (placeholder for future implementation)
 */
router.get('/history', auth_middleware_1.protect, async (req, res) => {
    // In production, this would query stored reports
    res.json({
        success: true,
        data: [],
        message: 'Report history will be available in a future release',
    });
});
/**
 * GET /api/reports/schedule
 * Get scheduled reports (placeholder for future implementation)
 */
router.get('/schedule', auth_middleware_1.protect, async (req, res) => {
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
router.get('/demo/:type', auth_middleware_1.protect, async (req, res) => {
    try {
        const type = req.params.type;
        const validTypes = ['trust_summary', 'symbi_compliance', 'incident_report', 'agent_audit', 'full_audit'];
        if (!validTypes.includes(type)) {
            res.status(400).json({ success: false, error: 'Invalid report type' });
            return;
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const report = await compliance_report_service_1.complianceReportService.generateReport({
            type,
            format: 'json',
            tenantId: 'demo',
            startDate,
            endDate,
            includeDetails: true,
        });
        res.json({ success: true, data: report });
    }
    catch (error) {
        logger_1.default.error('Demo report generation failed', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, error: 'Demo report generation failed' });
    }
});
exports.default = router;
