"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const orchestration_service_1 = require("../services/orchestration.service");
const logger_1 = __importDefault(require("../utils/logger"));
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
/**
 * GET /api/orchestrate/workflows
 * List all workflows
 */
router.get('/workflows', auth_middleware_1.protect, async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const workflows = await orchestration_service_1.orchestrationService.listWorkflows(userTenant);
        res.json({
            success: true,
            data: workflows
        });
    }
    catch (error) {
        logger_1.default.error('List workflows error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to list workflows' });
    }
});
/**
 * POST /api/orchestrate/workflows
 * Create a new workflow
 */
router.post('/workflows', auth_middleware_1.protect, async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const workflow = await orchestration_service_1.orchestrationService.createWorkflow({
            ...req.body,
            tenantId: userTenant
        });
        res.status(201).json({
            success: true,
            data: workflow
        });
    }
    catch (error) {
        logger_1.default.error('Create workflow error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to create workflow' });
    }
});
/**
 * POST /api/orchestrate/workflows/template/cev
 * Create a standard CEV workflow template
 */
router.post('/workflows/template/cev', auth_middleware_1.protect, async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const { coordinatorId, executorId, validatorId } = req.body;
        if (!coordinatorId || !executorId || !validatorId) {
            res.status(400).json({ success: false, message: 'Missing agent IDs' });
            return;
        }
        const workflow = await orchestration_service_1.orchestrationService.createCEVTemplate(userTenant, {
            coordinator: coordinatorId,
            executor: executorId,
            validator: validatorId
        });
        res.status(201).json({
            success: true,
            data: workflow
        });
    }
    catch (error) {
        logger_1.default.error('Create CEV template error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to create template' });
    }
});
/**
 * POST /api/orchestrate/workflows/:id/execute
 * Execute a workflow
 */
router.post('/workflows/:id/execute', auth_middleware_1.protect, async (req, res) => {
    try {
        const userTenant = req.userTenant || 'default';
        const { input } = req.body;
        if (!input) {
            res.status(400).json({ success: false, message: 'Missing input' });
            return;
        }
        const execution = await orchestration_service_1.orchestrationService.executeWorkflow(String(req.params.id), input, userTenant);
        res.status(201).json({
            success: true,
            data: execution
        });
    }
    catch (error) {
        logger_1.default.error('Execute workflow error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to start execution' });
    }
});
/**
 * GET /api/orchestrate/executions/:id
 * Get execution status
 */
router.get('/executions/:id', auth_middleware_1.protect, async (req, res) => {
    try {
        // We haven't exposed a getExecution method in service yet, let's just query model directly or add it
        // For expediency, I'll add a quick find here or assume service will handle
        // Ideally service should handle. But model import is available.
        const { WorkflowExecution } = await Promise.resolve().then(() => __importStar(require('../models/workflow-execution.model')));
        const execution = await WorkflowExecution.findById(String(req.params.id));
        if (!execution) {
            res.status(404).json({ success: false, message: 'Execution not found' });
            return;
        }
        res.json({
            success: true,
            data: execution
        });
    }
    catch (error) {
        logger_1.default.error('Get execution error', { error: (0, error_utils_1.getErrorMessage)(error) });
        res.status(500).json({ success: false, message: 'Failed to get execution' });
    }
});
exports.default = router;
