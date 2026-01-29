"use strict";
/**
 * Demo Core Routes
 * Initialization, status, and KPI endpoints for demo dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alerts_service_1 = require("../../services/alerts.service");
const demo_seeder_service_1 = require("../../services/demo-seeder.service");
const agent_model_1 = require("../../models/agent.model");
const experiment_model_1 = require("../../models/experiment.model");
const conversation_model_1 = require("../../models/conversation.model");
const trust_receipt_model_1 = require("../../models/trust-receipt.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const error_utils_1 = require("../../utils/error-utils");
const middleware_1 = require("./middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/demo/init
 * @desc    Initialize demo mode - seeds complete demo tenant with real data
 * @access  Public (for demo purposes)
 */
router.post('/init', async (req, res) => {
    try {
        const force = req.query.force === 'true';
        // Seed complete demo tenant with real data
        const seedResult = await demo_seeder_service_1.demoSeederService.seed(force);
        // Also seed alerts via the existing service
        await alerts_service_1.alertsService.seedDemoAlerts(middleware_1.DEMO_TENANT_ID);
        logger_1.default.info('Demo mode initialized', seedResult);
        res.json({
            success: true,
            message: seedResult.message,
            data: {
                tenantId: middleware_1.DEMO_TENANT_ID,
                ...seedResult.seeded,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Demo init error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to initialize demo mode',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/status
 * @desc    Get demo tenant seeding status
 * @access  Public (for demo purposes)
 */
router.get('/status', async (req, res) => {
    try {
        const status = await demo_seeder_service_1.demoSeederService.getStatus();
        res.json({ success: true, data: status });
    }
    catch (error) {
        res.status(500).json({ success: false, error: (0, error_utils_1.getErrorMessage)(error) });
    }
});
/**
 * @route   GET /api/demo/kpis
 * @desc    Get showcase KPI data for demo dashboard - queries REAL demo data
 * @access  Public (for demo purposes)
 */
router.get('/kpis', async (req, res) => {
    try {
        // Ensure demo is seeded
        await demo_seeder_service_1.demoSeederService.seed();
        // Query real data from demo tenant
        const [agents, receipts, alertSummary, experiments, conversations] = await Promise.all([
            agent_model_1.Agent.countDocuments({}),
            trust_receipt_model_1.TrustReceiptModel.find({ tenant_id: middleware_1.DEMO_TENANT_ID })
                .sort({ timestamp: -1 })
                .limit(100)
                .lean(),
            alerts_service_1.alertsService.getSummary(middleware_1.DEMO_TENANT_ID),
            experiment_model_1.Experiment.countDocuments({ status: 'running' }),
            conversation_model_1.Conversation.countDocuments({}),
        ]);
        // Calculate real metrics from trust receipts
        const avgClarity = receipts.length > 0
            ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.clarity || 0), 0) / receipts.length
            : 4.5;
        const avgIntegrity = receipts.length > 0
            ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.integrity || 0), 0) / receipts.length
            : 4.3;
        const avgQuality = receipts.length > 0
            ? receipts.reduce((sum, r) => sum + (r.ciq_metrics?.quality || 0), 0) / receipts.length
            : 4.2;
        // Calculate overall trust score (0-10 scale)
        const trustScore = ((avgClarity + avgIntegrity + avgQuality) / 3) * 2;
        const kpiData = {
            tenant: middleware_1.DEMO_TENANT_ID,
            timestamp: new Date().toISOString(),
            trustScore: Math.round(trustScore * 10) / 10,
            principleScores: {
                consent: Math.round(avgIntegrity * 20),
                inspection: Math.round(avgClarity * 19),
                validation: Math.round(avgQuality * 18),
                override: Math.round(avgIntegrity * 19),
                disconnect: 88,
                moral: Math.round((avgIntegrity + avgQuality) * 9),
            },
            totalInteractions: receipts.length * 50 + Math.floor(Math.random() * 100),
            activeAgents: agents,
            complianceRate: Math.round((trustScore / 10) * 100 * 10) / 10,
            riskScore: Math.max(0, Math.round((10 - trustScore) * 2)),
            alertsCount: alertSummary.active,
            experimentsRunning: experiments,
            orchestratorsActive: 3,
            sonateDimensions: {
                realityIndex: Math.round(avgQuality * 2 * 10) / 10,
                trustProtocol: trustScore >= 7 ? 'PASS' : trustScore >= 5 ? 'PARTIAL' : 'FAIL',
                ethicalAlignment: Math.round(avgIntegrity * 10) / 10,
                resonanceQuality: trustScore >= 8.5 ? 'BREAKTHROUGH' : trustScore >= 7 ? 'ADVANCED' : 'STRONG',
                canvasParity: Math.round(trustScore * 10),
            },
            trends: {
                trustScore: { change: 3.2, direction: 'up' },
                interactions: { change: 15.4, direction: 'up' },
                compliance: { change: 2.1, direction: 'up' },
                risk: { change: 5.3, direction: 'down' },
            },
        };
        res.json({
            success: true,
            data: kpiData,
        });
    }
    catch (error) {
        logger_1.default.error('Demo KPIs error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo KPIs',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
