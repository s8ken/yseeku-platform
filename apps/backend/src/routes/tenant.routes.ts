import { Router, Request, Response } from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware';
import { Tenant } from '../models/tenant.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

const router = Router();

/**
 * GET /api/tenants
 * List all tenants (paginated)
 */
router.get('/', protect, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Tenant.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Tenant.countDocuments(),
    ]);

    res.json({
      success: true,
      data: tenants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      source: 'database',
    });
  } catch (error: unknown) {
    logger.error('Get tenants error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/tenants/:id
 * Get a single tenant by ID
 */
router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
      return;
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error: unknown) {
    logger.error('Get tenant error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/tenants
 * Create a new tenant
 */
router.post('/', protect, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Tenant name is required',
      });
      return;
    }

    const tenant = await Tenant.create({
      name,
      description,
      status: 'active',
      complianceStatus: 'compliant',
      trustScore: 85,
    });

    logger.info('Tenant created', { tenantId: tenant._id, userId: req.userId });

    res.status(201).json({
      success: true,
      data: tenant,
      source: 'database',
    });
  } catch (error: unknown) {
    logger.error('Create tenant error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: getErrorMessage(error),
    });
  }
});

/**
 * PUT /api/tenants/:id
 * Update a tenant
 */
router.put('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, status, complianceStatus, trustScore } = req.body;

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
      return;
    }

    if (name) tenant.name = name;
    if (description !== undefined) tenant.description = description;
    if (status) tenant.status = status;
    if (complianceStatus) tenant.complianceStatus = complianceStatus;
    if (trustScore !== undefined) tenant.trustScore = trustScore;

    tenant.lastActivity = new Date();
    await tenant.save();

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error: unknown) {
    logger.error('Update tenant error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/tenants/:id
 * Delete a tenant
 */
router.delete('/:id', protect, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);

    if (!tenant) {
      res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
      return;
    }

    logger.info('Tenant deleted', { tenantId: req.params.id, userId: req.userId });

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Delete tenant error', { error: getErrorMessage(error) });
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: getErrorMessage(error),
    });
  }
});

export default router;
