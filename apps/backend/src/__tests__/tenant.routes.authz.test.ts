import express from 'express';
import request from 'supertest';
import { NextFunction, Request, Response } from 'express';

jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: Request, _res: Response, next: NextFunction) => {
    const role = req.headers['x-test-role'] === 'admin' ? 'admin' : 'viewer';
    (req as any).user = { _id: 'u1', role };
    (req as any).userId = 'u1';
    next();
  },
  requireAdmin: (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized as admin' });
      return;
    }
    next();
  },
}));

jest.mock('../models/tenant.model', () => ({
  Tenant: {
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        skip: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue([]),
        })),
      })),
    })),
    countDocuments: jest.fn().mockResolvedValue(0),
    findById: jest.fn().mockResolvedValue({ _id: 'tenant-1', name: 'Tenant One' }),
    create: jest.fn().mockResolvedValue({ _id: 'tenant-1', name: 'Tenant One' }),
  },
}));

describe('Tenant routes authz regression', () => {
  const app = express();
  app.use(express.json());

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const tenantRoutes = require('../routes/tenant.routes').default;
  app.use('/api/tenants', tenantRoutes);

  it('denies non-admin access to list tenants', async () => {
    await request(app).get('/api/tenants').expect(403);
  });

  it('denies non-admin access to get tenant by id', async () => {
    await request(app).get('/api/tenants/tenant-1').expect(403);
  });

  it('denies non-admin access to create tenant', async () => {
    await request(app).post('/api/tenants').send({ name: 'X' }).expect(403);
  });

  it('denies non-admin access to update tenant', async () => {
    await request(app).put('/api/tenants/tenant-1').send({ name: 'X2' }).expect(403);
  });

  it('allows admin access to list tenants', async () => {
    await request(app).get('/api/tenants').set('x-test-role', 'admin').expect(200);
  });
});
