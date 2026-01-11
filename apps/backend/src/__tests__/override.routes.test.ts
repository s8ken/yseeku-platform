/**
 * Override Routes Tests
 * Comprehensive testing for override API endpoints
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies before imports
jest.mock('../services/override.service');
jest.mock('../middleware/auth.middleware');
jest.mock('../middleware/tenant-context.middleware');

import { overrideService } from '../services/override.service';
import { protect, requireTenant } from '../middleware/auth.middleware';
import { bindTenantContext } from '../middleware/tenant-context.middleware';

// Create test app
const app = express();
app.use(express.json());

// Mock middleware
(protect as jest.Mock).mockImplementation((req, res, next) => {
  req.userId = 'test-user';
  req.userEmail = 'test@example.com';
  req.userTenant = 'test-tenant';
  next();
});

(requireTenant as jest.Mock).mockImplementation((req, res, next) => {
  next();
});

(bindTenantContext as jest.Mock).mockImplementation((req, res, next) => {
  next();
});

// Import routes after middleware mocks
import overrideRoutes from '../routes/override.routes';
app.use('/api/overrides', overrideRoutes);

describe('Override Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/overrides/queue', () => {
    it('should return override queue successfully', async () => {
      const mockQueue = {
        items: [
          {
            id: 'action-123',
            type: 'ban_agent',
            target: 'agent-456',
            status: 'pending',
            createdAt: new Date(),
            canOverride: true
          }
        ],
        total: 1,
        limit: 50,
        offset: 0
      };

      (overrideService.getOverrideQueue as jest.Mock).mockResolvedValue(mockQueue);

      const response = await request(app)
        .get('/api/overrides/queue')
        .query({ limit: 50, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockQueue);
      expect(overrideService.getOverrideQueue).toHaveBeenCalledWith(
        'test-tenant',
        expect.any(Object),
        { limit: 50, offset: 0 }
      );
    });

    it('should apply filters correctly', async () => {
      const mockQueue = { items: [], total: 0, limit: 50, offset: 0 };
      (overrideService.getOverrideQueue as jest.Mock).mockResolvedValue(mockQueue);

      const response = await request(app)
        .get('/api/overrides/queue')
        .query({ 
          status: 'pending',
          type: 'ban_agent',
          search: 'agent-456',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(overrideService.getOverrideQueue).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          status: ['pending'],
          type: ['ban_agent'],
          search: 'agent-456',
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        }),
        expect.any(Object)
      );
    });

    it('should handle service errors', async () => {
      (overrideService.getOverrideQueue as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/overrides/queue')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch override queue');
    });
  });

  describe('GET /api/overrides/history', () => {
    it('should return override history successfully', async () => {
      const mockHistory = {
        items: [
          {
            id: 'hist-123',
            actionId: 'action-456',
            decision: 'approve',
            reason: 'Valid justification',
            emergency: false,
            createdAt: new Date(),
            userId: 'user-789',
            actionType: 'ban_agent',
            actionTarget: 'agent-456',
            actionStatus: 'overridden'
          }
        ],
        total: 1,
        limit: 50,
        offset: 0
      };

      (overrideService.getOverrideHistory as jest.Mock).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/overrides/history')
        .query({ decision: 'approve', limit: 50, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
      expect(overrideService.getOverrideHistory).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          decision: ['approve']
        }),
        { limit: 50, offset: 0 }
      );
    });

    it('should apply emergency filter', async () => {
      const mockHistory = { items: [], total: 0, limit: 50, offset: 0 };
      (overrideService.getOverrideHistory as jest.Mock).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/overrides/history')
        .query({ emergency: 'true' })
        .expect(200);

      expect(overrideService.getOverrideHistory).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          emergency: true
        }),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/overrides/decide', () => {
    it('should process override decision successfully', async () => {
      const mockResult = {
        success: true,
        reverted: true,
        details: { agentId: 'agent-456', restored: true }
      };

      (overrideService.processOverride as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/overrides/decide')
        .send({
          actionId: 'action-123',
          decision: 'approve',
          reason: 'Valid justification'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(overrideService.processOverride).toHaveBeenCalledWith({
        actionId: 'action-123',
        decision: 'approve',
        reason: 'Valid justification',
        emergency: false,
        userId: 'test-user',
        tenantId: 'test-tenant'
      });
    });

    it('should handle emergency overrides', async () => {
      const mockResult = { success: true, reverted: true, details: {} };
      (overrideService.processOverride as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/overrides/decide')
        .send({
          actionId: 'action-123',
          decision: 'approve',
          reason: 'Emergency justification',
          emergency: true
        })
        .expect(200);

      expect(overrideService.processOverride).toHaveBeenCalledWith(
        expect.objectContaining({
          emergency: true
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/overrides/decide')
        .send({
          actionId: '',
          decision: '',
          reason: ''
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });

    it('should handle service errors', async () => {
      (overrideService.processOverride as jest.Mock).mockRejectedValue(
        new Error('Action not found')
      );

      const response = await request(app)
        .post('/api/overrides/decide')
        .send({
          actionId: 'action-123',
          decision: 'approve',
          reason: 'Justification'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to process override');
    });
  });

  describe('GET /api/overrides/stats', () => {
    it('should return override statistics', async () => {
      const mockStats = {
        pending: 5,
        approved: 15,
        rejected: 3,
        total: 23,
        approvalRate: 83.3
      };

      (overrideService.getOverrideStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/overrides/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(overrideService.getOverrideStats).toHaveBeenCalledWith('test-tenant');
    });

    it('should handle stats errors', async () => {
      (overrideService.getOverrideStats as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/overrides/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to fetch override statistics');
    });
  });

  describe('POST /api/overrides/bulk', () => {
    it('should process bulk overrides successfully', async () => {
      const mockResult = {
        processed: 3,
        failed: 0,
        results: [
          { actionId: 'action-1', success: true, reverted: true, details: {} },
          { actionId: 'action-2', success: true, reverted: true, details: {} },
          { actionId: 'action-3', success: true, reverted: true, details: {} }
        ],
        errors: []
      };

      (overrideService.processBulkOverrides as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/overrides/bulk')
        .send({
          actionIds: ['action-1', 'action-2', 'action-3'],
          decision: 'approve',
          reason: 'Bulk justification'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(overrideService.processBulkOverrides).toHaveBeenCalledWith({
        actionIds: ['action-1', 'action-2', 'action-3'],
        decision: 'approve',
        reason: 'Bulk justification',
        userId: 'test-user',
        tenantId: 'test-tenant'
      });
    });

    it('should handle partial failures in bulk operations', async () => {
      const mockResult = {
        processed: 2,
        failed: 1,
        results: [
          { actionId: 'action-1', success: true, reverted: true, details: {} },
          { actionId: 'action-3', success: true, reverted: true, details: {} }
        ],
        errors: [
          { actionId: 'action-2', error: 'Action not found' }
        ]
      };

      (overrideService.processBulkOverrides as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/overrides/bulk')
        .send({
          actionIds: ['action-1', 'action-2', 'action-3'],
          decision: 'approve',
          reason: 'Bulk justification'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.processed).toBe(2);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors).toHaveLength(1);
    });

    it('should validate bulk request parameters', async () => {
      const response = await request(app)
        .post('/api/overrides/bulk')
        .send({
          actionIds: [],
          decision: 'invalid',
          reason: ''
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });

    it('should handle bulk service errors', async () => {
      (overrideService.processBulkOverrides as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/overrides/bulk')
        .send({
          actionIds: ['action-1'],
          decision: 'approve',
          reason: 'Justification'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to process bulk overrides');
    });
  });
});