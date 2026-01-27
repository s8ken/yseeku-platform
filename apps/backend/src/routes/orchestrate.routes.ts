import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { orchestrationService } from '../services/orchestration.service';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/orchestrate/workflows
 * List all workflows
 */
router.get('/workflows', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const workflows = await orchestrationService.listWorkflows(userTenant);
    res.json({
      success: true,
      data: workflows
    });
  } catch (error: unknown) {
    logger.error('List workflows error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to list workflows' });
  }
});

/**
 * POST /api/orchestrate/workflows
 * Create a new workflow
 */
router.post('/workflows', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const workflow = await orchestrationService.createWorkflow({
      ...req.body,
      tenantId: userTenant
    });
    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error: unknown) {
    logger.error('Create workflow error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to create workflow' });
  }
});

/**
 * POST /api/orchestrate/workflows/template/cev
 * Create a standard CEV workflow template
 */
router.post('/workflows/template/cev', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const { coordinatorId, executorId, validatorId } = req.body;
    
    if (!coordinatorId || !executorId || !validatorId) {
      res.status(400).json({ success: false, message: 'Missing agent IDs' });
      return;
    }

    const workflow = await orchestrationService.createCEVTemplate(userTenant, {
      coordinator: coordinatorId,
      executor: executorId,
      validator: validatorId
    });

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error: unknown) {
    logger.error('Create CEV template error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to create template' });
  }
});

/**
 * POST /api/orchestrate/workflows/:id/execute
 * Execute a workflow
 */
router.post('/workflows/:id/execute', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const { input } = req.body;
    
    if (!input) {
      res.status(400).json({ success: false, message: 'Missing input' });
      return;
    }

    const execution = await orchestrationService.executeWorkflow(
      String(req.params.id),
      input,
      userTenant
    );

    res.status(201).json({
      success: true,
      data: execution
    });
  } catch (error: unknown) {
    logger.error('Execute workflow error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to start execution' });
  }
});

/**
 * GET /api/orchestrate/executions/:id
 * Get execution status
 */
router.get('/executions/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    // We haven't exposed a getExecution method in service yet, let's just query model directly or add it
    // For expediency, I'll add a quick find here or assume service will handle
    // Ideally service should handle. But model import is available.
    const { WorkflowExecution } = await import('../models/workflow-execution.model');
    const execution = await WorkflowExecution.findById(String(req.params.id));
    
    if (!execution) {
      res.status(404).json({ success: false, message: 'Execution not found' });
      return;
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error: unknown) {
    logger.error('Get execution error', { error: getErrorMessage(error) });
    res.status(500).json({ success: false, message: 'Failed to get execution' });
  }
});

export default router;
