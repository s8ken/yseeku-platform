"use strict";
/**
 * Demo Entity Routes
 * Tenants, agents, experiments, receipts, and risk data for demo dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_model_1 = require("../../models/tenant.model");
const agent_model_1 = require("../../models/agent.model");
const experiment_model_1 = require("../../models/experiment.model");
const trust_receipt_model_1 = require("../../models/trust-receipt.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const error_utils_1 = require("../../utils/error-utils");
const middleware_1 = require("./middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/demo/tenants
 * @desc    Get demo tenants for multi-tenant showcase
 * @access  Public (for demo purposes)
 */
router.get('/tenants', async (req, res) => {
    try {
        const tenants = await tenant_model_1.Tenant.find({}).limit(10).lean();
        // If no tenants, return demo data
        if (tenants.length === 0) {
            res.json({
                success: true,
                data: [
                    {
                        _id: middleware_1.DEMO_TENANT_ID,
                        name: 'Demo Organization',
                        description: 'Showcase tenant for demos',
                        status: 'active',
                        complianceStatus: 'compliant',
                        trustScore: 92,
                        lastActivity: new Date().toISOString(),
                    },
                    {
                        _id: 'acme-corp',
                        name: 'Acme Corp',
                        description: 'Enterprise customer - financial services',
                        status: 'active',
                        complianceStatus: 'compliant',
                        trustScore: 88,
                        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    },
                    {
                        _id: 'techstart',
                        name: 'TechStart Inc',
                        description: 'Startup customer - SaaS platform',
                        status: 'active',
                        complianceStatus: 'warning',
                        trustScore: 76,
                        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    },
                    {
                        _id: 'healthsecure',
                        name: 'HealthSecure',
                        description: 'Healthcare provider - HIPAA compliant',
                        status: 'active',
                        complianceStatus: 'compliant',
                        trustScore: 95,
                        lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    },
                ],
            });
            return;
        }
        res.json({
            success: true,
            data: tenants,
        });
    }
    catch (error) {
        logger_1.default.error('Demo tenants error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo tenants',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/agents
 * @desc    Get demo agents for showcase
 * @access  Public (for demo purposes)
 */
router.get('/agents', async (req, res) => {
    try {
        const agents = await agent_model_1.Agent.find({})
            .limit(10)
            .select('name description provider model traits lastActive isPublic ciModel')
            .lean();
        // If no agents, return demo data
        if (agents.length === 0) {
            res.json({
                success: true,
                data: [
                    {
                        _id: 'demo-atlas',
                        name: 'Atlas - Research Assistant',
                        description: 'Research specialist with high ethical alignment',
                        provider: 'openai',
                        model: 'gpt-4-turbo',
                        ciModel: 'sonate-core',
                        traits: { ethical_alignment: 4.8, creativity: 3.5, precision: 4.9 },
                        lastActive: new Date().toISOString(),
                    },
                    {
                        _id: 'demo-nova',
                        name: 'Nova - Creative Writer',
                        description: 'Creative assistant with balanced safety controls',
                        provider: 'anthropic',
                        model: 'claude-sonnet-4-20250514',
                        ciModel: 'sonate-core',
                        traits: { ethical_alignment: 4.5, creativity: 4.9, precision: 3.2 },
                        lastActive: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    },
                    {
                        _id: 'demo-sentinel',
                        name: 'Sentinel - Security Analyst',
                        description: 'Security-focused with maximum oversight',
                        provider: 'openai',
                        model: 'gpt-4',
                        ciModel: 'overseer',
                        traits: { ethical_alignment: 5.0, creativity: 2.5, precision: 5.0 },
                        lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    },
                ],
            });
            return;
        }
        res.json({
            success: true,
            data: agents.map(agent => ({
                ...agent,
                traits: agent.traits instanceof Map ? Object.fromEntries(agent.traits) : agent.traits,
            })),
        });
    }
    catch (error) {
        logger_1.default.error('Demo agents error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo agents',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/experiments
 * @desc    Get demo experiments for lab showcase
 * @access  Public (for demo purposes)
 */
router.get('/experiments', async (req, res) => {
    try {
        const experiments = await experiment_model_1.Experiment.find({ tenantId: { $in: ['default', middleware_1.DEMO_TENANT_ID] } })
            .limit(10)
            .lean();
        // If no experiments, return demo data
        if (experiments.length === 0) {
            res.json({
                success: true,
                data: [
                    {
                        _id: 'demo-exp-1',
                        name: 'Trust Threshold Calibration',
                        description: 'Testing optimal trust score thresholds',
                        hypothesis: 'Lower threshold improves detection without false positives',
                        status: 'running',
                        type: 'ab_test',
                        currentSampleSize: 2436,
                        targetSampleSize: 5000,
                        metrics: { pValue: 0.0023, effectSize: 0.42, significant: true },
                        tags: ['trust', 'threshold'],
                    },
                    {
                        _id: 'demo-exp-2',
                        name: 'Bedau Window Size Study',
                        description: 'Evaluating optimal temporal window for emergence detection',
                        hypothesis: 'Larger window improves emergence detection',
                        status: 'running',
                        type: 'multivariate',
                        currentSampleSize: 1935,
                        targetSampleSize: 3000,
                        metrics: { pValue: 0.089, effectSize: 0.18, significant: false },
                        tags: ['bedau', 'emergence'],
                    },
                ],
            });
            return;
        }
        res.json({
            success: true,
            data: experiments,
        });
    }
    catch (error) {
        logger_1.default.error('Demo experiments error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo experiments',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/receipts
 * @desc    Get demo trust receipts for verification showcase
 * @access  Public (for demo purposes)
 */
router.get('/receipts', async (req, res) => {
    try {
        const receipts = await trust_receipt_model_1.TrustReceiptModel.find({ tenant_id: middleware_1.DEMO_TENANT_ID })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();
        res.json({
            success: true,
            data: {
                receipts,
                total: receipts.length,
                tenant: middleware_1.DEMO_TENANT_ID,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Demo receipts error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo receipts',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/demo/risk
 * @desc    Get demo risk metrics for showcase
 * @access  Public (for demo purposes)
 */
router.get('/risk', async (req, res) => {
    try {
        const riskData = {
            tenant: middleware_1.DEMO_TENANT_ID,
            overallRiskScore: 12,
            riskLevel: 'low',
            trustPrincipleScores: {
                consent: 94,
                inspection: 91,
                validation: 88,
                ethics: 95,
                disconnect: 87,
                moral: 92,
            },
            complianceReports: [
                { framework: 'EU AI Act', status: 'compliant', score: 95, lastAudit: new Date().toISOString() },
                { framework: 'GDPR', status: 'compliant', score: 94, lastAudit: new Date().toISOString() },
                { framework: 'ISO 27001', status: 'compliant', score: 91, lastAudit: new Date().toISOString() },
                { framework: 'Trust Protocol', status: 'compliant', score: 92, lastAudit: new Date().toISOString() },
            ],
            riskTrends: Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                score: Math.round(10 + Math.random() * 5),
            })),
            trustPrinciples: [
                { name: 'Consent Architecture', weight: 25, score: 94, critical: true },
                { name: 'Inspection Mandate', weight: 20, score: 91, critical: false },
                { name: 'Continuous Validation', weight: 20, score: 88, critical: false },
                { name: 'Ethical Override', weight: 15, score: 95, critical: true },
                { name: 'Right to Disconnect', weight: 10, score: 87, critical: false },
                { name: 'Moral Recognition', weight: 10, score: 92, critical: false },
            ],
        };
        res.json({
            success: true,
            data: riskData,
        });
    }
    catch (error) {
        logger_1.default.error('Demo risk error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch demo risk data',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
