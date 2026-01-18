/**
 * Lab Experiment Routes
 * A/B testing and experimental features for platform optimization
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { Experiment, IExperiment, IVariant } from '../models/experiment.model';
import { twoSampleTTest, stdDev, mean } from '../utils/statistics';
import { bedauService } from '../services/bedau.service';
import { logSuccess, logFailure } from '../utils/audit-logger';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/lab/bedau-metrics
 * Get real-time Bedau Index metrics for weak emergence detection
 */
router.get('/bedau-metrics', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const metrics = await bedauService.getMetrics(userTenant);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    logger.error('Get Bedau metrics error', {
      error: error.message,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to calculate Bedau metrics',
      error: error.message,
    });
  }
});

/**
 * GET /api/lab/experiments
 * Get all experiments for the user's tenant
 *
 * Query params:
 * - status: 'draft' | 'running' | 'paused' | 'completed' | 'archived'
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
router.get('/experiments', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const userTenant = req.userTenant || 'default';
    const { status, limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offsetNum = Math.max(0, parseInt(offset as string));

    // Build filter
    const filter: any = { tenantId: userTenant };
    if (status && ['draft', 'running', 'paused', 'completed', 'archived'].includes(status as string)) {
      filter.status = status;
    }

    // Execute queries
    const [experiments, total] = await Promise.all([
      Experiment.find(filter)
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .lean(),
      Experiment.countDocuments(filter),
    ]);

    // Calculate summary statistics
    const summary = {
      total,
      running: await Experiment.countDocuments({ tenantId: userTenant, status: 'running' }),
      completed: await Experiment.countDocuments({ tenantId: userTenant, status: 'completed' }),
      significant: await Experiment.countDocuments({
        tenantId: userTenant,
        'metrics.significant': true,
      }),
    };

    logger.info('Lab experiments retrieved', {
      userId: req.userId,
      tenant: userTenant,
      total,
      status,
    });

    res.json({
      success: true,
      data: {
        experiments: experiments.map(exp => ({
          id: exp._id.toString(),
          name: exp.name,
          description: exp.description,
          hypothesis: exp.hypothesis,
          status: exp.status,
          type: exp.type,
          progress: exp.progress,
          metrics: exp.metrics,
          startedAt: exp.startedAt,
          completedAt: exp.completedAt,
          createdAt: exp.createdAt,
          updatedAt: exp.updatedAt,
        })),
        summary,
      },
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error: any) {
    logger.error('Get experiments error', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experiments',
      error: error.message,
    });
  }
});

/**
 * GET /api/lab/experiments/:id
 * Get a single experiment with full details
 */
router.get('/experiments/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userTenant = req.userTenant || 'default';

    const experiment = await Experiment.findOne({
      _id: id,
      tenantId: userTenant,
    }).lean();

    if (!experiment) {
      res.status(404).json({
        success: false,
        message: 'Experiment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        experiment: {
          id: experiment._id.toString(),
          name: experiment.name,
          description: experiment.description,
          hypothesis: experiment.hypothesis,
          status: experiment.status,
          type: experiment.type,
          variants: experiment.variants,
          targetSampleSize: experiment.targetSampleSize,
          currentSampleSize: experiment.currentSampleSize,
          progress: experiment.progress,
          metrics: experiment.metrics,
          startedAt: experiment.startedAt,
          completedAt: experiment.completedAt,
          pausedAt: experiment.pausedAt,
          tags: experiment.tags,
          notes: experiment.notes,
          metadata: experiment.metadata,
          createdAt: experiment.createdAt,
          updatedAt: experiment.updatedAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get experiment error', {
      error: error.message,
      stack: error.stack,
      experimentId: req.params.id,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experiment',
      error: error.message,
    });
  }
});

/**
 * POST /api/lab/experiments
 * Create a new experiment
 *
 * Body:
 * - name: string (required)
 * - description: string
 * - hypothesis: string (required)
 * - type: 'ab_test' | 'multivariate' | 'sequential' | 'bayesian'
 * - variants: Array<{ name, description, parameters }> (min 2)
 * - targetSampleSize: number (default: 1000)
 * - tags: string[]
 */
router.post('/experiments', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      hypothesis,
      type = 'ab_test',
      variants,
      targetSampleSize = 1000,
      tags,
      notes,
      metadata,
    } = req.body;

    // Validation
    if (!name || !hypothesis) {
      res.status(400).json({
        success: false,
        message: 'Name and hypothesis are required',
      });
      return;
    }

    if (!variants || !Array.isArray(variants) || variants.length < 2) {
      res.status(400).json({
        success: false,
        message: 'At least 2 variants are required (control + treatment)',
      });
      return;
    }

    const userTenant = req.userTenant || 'default';
    const userId = req.userId || 'system';

    // Create experiment
    const experiment = await Experiment.create({
      name,
      description,
      hypothesis,
      type,
      variants: variants.map((v: any) => ({
        name: v.name,
        description: v.description || '',
        parameters: v.parameters || {},
        sampleSize: 0,
        successCount: 0,
        failureCount: 0,
        avgScore: 0,
        sumScores: 0,
        sumSquaredScores: 0,
      })),
      targetSampleSize: Math.max(100, targetSampleSize),
      currentSampleSize: 0,
      progress: 0,
      metrics: {
        significant: false,
      },
      tenantId: userTenant,
      createdBy: userId,
      tags: tags || [],
      notes: notes || '',
      metadata: metadata || {},
      status: 'draft',
    });

    // Log audit
    await logSuccess(req, 'experiment_create', 'experiment', experiment._id.toString(), {
      name: experiment.name,
      type: experiment.type,
      variantCount: experiment.variants.length,
    });

    logger.info('Experiment created', {
      experimentId: experiment._id.toString(),
      name: experiment.name,
      userId,
      tenant: userTenant,
    });

    res.status(201).json({
      success: true,
      message: 'Experiment created successfully',
      data: {
        experiment: {
          id: experiment._id.toString(),
          name: experiment.name,
          status: experiment.status,
          type: experiment.type,
          createdAt: experiment.createdAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Create experiment error', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
    });
    await logFailure(req, 'experiment_create', 'experiment', 'unknown', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create experiment',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/lab/experiments/:id
 * Update experiment (start, pause, resume, complete)
 *
 * Body:
 * - action: 'start' | 'pause' | 'resume' | 'complete' | 'archive'
 * - OR update fields: name, description, notes, tags
 */
router.patch('/experiments/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userTenant = req.userTenant || 'default';
    const { action, name, description, notes, tags } = req.body;

    const experiment = await Experiment.findOne({
      _id: id,
      tenantId: userTenant,
    });

    if (!experiment) {
      res.status(404).json({
        success: false,
        message: 'Experiment not found',
      });
      return;
    }

    // Handle actions
    if (action) {
      switch (action) {
        case 'start':
          if (experiment.status !== 'draft' && experiment.status !== 'paused') {
            res.status(400).json({
              success: false,
              message: 'Can only start experiments in draft or paused state',
            });
            return;
          }
          experiment.status = 'running';
          if (!experiment.startedAt) {
            experiment.startedAt = new Date();
          }
          experiment.pausedAt = undefined;
          break;

        case 'pause':
          if (experiment.status !== 'running') {
            res.status(400).json({
              success: false,
              message: 'Can only pause running experiments',
            });
            return;
          }
          experiment.status = 'paused';
          experiment.pausedAt = new Date();
          break;

        case 'resume':
          if (experiment.status !== 'paused') {
            res.status(400).json({
              success: false,
              message: 'Can only resume paused experiments',
            });
            return;
          }
          experiment.status = 'running';
          experiment.pausedAt = undefined;
          break;

        case 'complete':
          if (experiment.status !== 'running' && experiment.status !== 'paused') {
            res.status(400).json({
              success: false,
              message: 'Can only complete running or paused experiments',
            });
            return;
          }
          experiment.status = 'completed';
          experiment.completedAt = new Date();
          break;

        case 'archive':
          experiment.status = 'archived';
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid action. Must be: start, pause, resume, complete, or archive',
          });
          return;
      }
    }

    // Handle field updates
    if (name !== undefined) experiment.name = name;
    if (description !== undefined) experiment.description = description;
    if (notes !== undefined) experiment.notes = notes;
    if (tags !== undefined) experiment.tags = tags;

    await experiment.save();

    // Log audit
    await logSuccess(req, 'experiment_update', 'experiment', experiment._id.toString(), {
      action,
      name: experiment.name,
      status: experiment.status,
    });

    logger.info('Experiment updated', {
      experimentId: experiment._id.toString(),
      action,
      status: experiment.status,
      userId: req.userId,
    });

    res.json({
      success: true,
      message: `Experiment ${action || 'updated'} successfully`,
      data: {
        experiment: {
          id: experiment._id.toString(),
          name: experiment.name,
          status: experiment.status,
          updatedAt: experiment.updatedAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Update experiment error', {
      error: error.message,
      stack: error.stack,
      experimentId: req.params.id,
      userId: req.userId,
    });
    await logFailure(req, 'experiment_update', 'experiment', req.params.id, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update experiment',
      error: error.message,
    });
  }
});

/**
 * POST /api/lab/experiments/:id/record
 * Record a data point for an experiment variant
 *
 * Body:
 * - variantIndex: number (index of variant in variants array)
 * - score: number
 * - success: boolean (optional)
 */
router.post('/experiments/:id/record', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { variantIndex, score, success } = req.body;
    const userTenant = req.userTenant || 'default';

    if (variantIndex === undefined || score === undefined) {
      res.status(400).json({
        success: false,
        message: 'variantIndex and score are required',
      });
      return;
    }

    const experiment = await Experiment.findOne({
      _id: id,
      tenantId: userTenant,
    });

    if (!experiment) {
      res.status(404).json({
        success: false,
        message: 'Experiment not found',
      });
      return;
    }

    if (experiment.status !== 'running') {
      res.status(400).json({
        success: false,
        message: 'Can only record data for running experiments',
      });
      return;
    }

    if (variantIndex < 0 || variantIndex >= experiment.variants.length) {
      res.status(400).json({
        success: false,
        message: 'Invalid variant index',
      });
      return;
    }

    // Update variant statistics
    const variant = experiment.variants[variantIndex];
    variant.sampleSize += 1;
    variant.sumScores += score;
    variant.sumSquaredScores += score * score;
    variant.avgScore = variant.sumScores / variant.sampleSize;

    if (success !== undefined) {
      if (success) {
        variant.successCount += 1;
      } else {
        variant.failureCount += 1;
      }
    }

    // Update experiment totals
    experiment.currentSampleSize += 1;

    // Recalculate statistics if we have at least 2 variants with data
    if (experiment.variants.every(v => v.sampleSize >= 30)) {
      const control = experiment.variants[0];
      const treatment = experiment.variants[1];

      // Calculate standard deviations
      const std1 = Math.sqrt(
        (control.sumSquaredScores - (control.sumScores * control.sumScores) / control.sampleSize) /
          (control.sampleSize - 1)
      );
      const std2 = Math.sqrt(
        (treatment.sumSquaredScores - (treatment.sumScores * treatment.sumScores) / treatment.sampleSize) /
          (treatment.sampleSize - 1)
      );

      // Perform t-test
      const testResult = twoSampleTTest(
        { mean: treatment.avgScore, std: std2, n: treatment.sampleSize },
        { mean: control.avgScore, std: std1, n: control.sampleSize }
      );

      experiment.metrics.pValue = testResult.pValue;
      experiment.metrics.effectSize = testResult.effectSize;
      experiment.metrics.confidenceInterval = testResult.confidenceInterval;
      experiment.metrics.significant = testResult.significant;
    }

    await experiment.save();

    res.json({
      success: true,
      message: 'Data point recorded',
      data: {
        currentSampleSize: experiment.currentSampleSize,
        progress: experiment.progress,
        metrics: experiment.metrics,
      },
    });
  } catch (error: any) {
    logger.error('Record experiment data error', {
      error: error.message,
      stack: error.stack,
      experimentId: req.params.id,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to record data point',
      error: error.message,
    });
  }
});

/**
 * GET /api/lab/experiments/:id/results
 * Get detailed statistical results for an experiment
 */
router.get('/experiments/:id/results', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userTenant = req.userTenant || 'default';

    const experiment = await Experiment.findOne({
      _id: id,
      tenantId: userTenant,
    }).lean();

    if (!experiment) {
      res.status(404).json({
        success: false,
        message: 'Experiment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        experimentId: experiment._id.toString(),
        name: experiment.name,
        hypothesis: experiment.hypothesis,
        status: experiment.status,
        currentSampleSize: experiment.currentSampleSize,
        targetSampleSize: experiment.targetSampleSize,
        progress: experiment.progress,
        variants: experiment.variants.map(v => ({
          name: v.name,
          sampleSize: v.sampleSize,
          avgScore: v.avgScore,
          successCount: v.successCount,
          failureCount: v.failureCount,
          successRate: v.sampleSize > 0 ? v.successCount / v.sampleSize : 0,
        })),
        metrics: experiment.metrics,
        startedAt: experiment.startedAt,
        completedAt: experiment.completedAt,
        duration: experiment.startedAt && experiment.completedAt
          ? (new Date(experiment.completedAt).getTime() - new Date(experiment.startedAt).getTime()) / 1000
          : null,
      },
    });
  } catch (error: any) {
    logger.error('Get experiment results error', {
      error: error.message,
      stack: error.stack,
      experimentId: req.params.id,
      userId: req.userId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experiment results',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/lab/experiments/:id
 * Delete an experiment
 */
router.delete('/experiments/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userTenant = req.userTenant || 'default';

    const experiment = await Experiment.findOneAndDelete({
      _id: id,
      tenantId: userTenant,
    });

    if (!experiment) {
      res.status(404).json({
        success: false,
        message: 'Experiment not found',
      });
      return;
    }

    // Log audit
    await logSuccess(req, 'experiment_delete', 'experiment', id, {
      name: experiment.name,
    });

    logger.info('Experiment deleted', {
      experimentId: id,
      name: experiment.name,
      userId: req.userId,
    });

    res.json({
      success: true,
      message: 'Experiment deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete experiment error', {
      error: error.message,
      stack: error.stack,
      experimentId: req.params.id,
      userId: req.userId,
    });
    await logFailure(req, 'experiment_delete', 'experiment', req.params.id, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete experiment',
      error: error.message,
    });
  }
});

export default router;
