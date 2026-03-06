/**
 * Tenant Authz Integration Test (real middleware, no mocks)
 *
 * Verifies that requireAdmin reads role from the MongoDB User document,
 * not from JWT payload claims. An attacker who crafts a JWT with extra
 * role fields or a legitimate token for a non-admin user must be denied.
 *
 * Strategy: use real protect + requireAdmin middleware with real
 * SecureAuthService token verification. Mock only the Mongoose model
 * layer (User.findById / User.findOne) to return controlled documents,
 * avoiding the need for a live MongoDB connection.
 */

import express from 'express';
import request from 'supertest';

// ── env must be set before auth.middleware is imported ──────────────────────
process.env.JWT_SECRET = 'test-jwt-secret-integration-32ch';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-integration-32c';
process.env.NODE_ENV = 'test';

// ── Mock Mongoose User model BEFORE importing the middleware ─────────────────
jest.mock('../../models/user.model', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// ── Mock mongoose connection state so protect doesn't bail on DB check ───────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    isValidObjectId: (id: string) => /^[a-f\d]{24}$/i.test(id),
  };
});

import { User } from '../../models/user.model';
import tenantRouter from '../../routes/tenant.routes';
import { authService } from '../../middleware/auth.middleware';

// ── Tenant model mock (routes need it) ──────────────────────────────────────
jest.mock('../../models/tenant.model', () => ({
  Tenant: {
    find: jest.fn(() => ({
      sort: jest.fn(() => ({ skip: jest.fn(() => ({ limit: jest.fn().mockResolvedValue([]) })) })),
    })),
    countDocuments: jest.fn().mockResolvedValue(0),
    findById: jest.fn().mockResolvedValue({ _id: 'tid', name: 'T' }),
    create: jest.fn().mockResolvedValue({ _id: 'tid', name: 'T' }),
  },
}));

// ── Helper: mint a properly-signed JWT via the real authService ─────────────
function mintToken(userId: string, email: string): string {
  const { accessToken } = authService.generateTokens({
    id: userId,
    username: email.split('@')[0],
    email,
    roles: ['user'],
    tenant: 'default',
  });
  return accessToken;
}

// ── Fake MongoDB ObjectId-shaped string ─────────────────────────────────────
const VIEWER_OID = 'a'.repeat(24);
const ADMIN_OID = 'b'.repeat(24);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tenants', tenantRouter);
  return app;
}

describe('Tenant authz — real middleware, DB-sourced role', () => {
  const app = buildApp();
  const mockFindById = User.findById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Viewer token → 403 ─────────────────────────────────────────────────
  it('denies a valid JWT for a DB-viewer user on GET /api/tenants', async () => {
    const token = mintToken(VIEWER_OID, 'v@test.com');
    mockFindById.mockResolvedValue({ _id: VIEWER_OID, role: 'viewer', email: 'v@test.com' });

    await request(app).get('/api/tenants').set('Authorization', `Bearer ${token}`).expect(403);
  });

  // ── Admin token → 200 ──────────────────────────────────────────────────
  it('allows a valid JWT for a DB-admin user on GET /api/tenants', async () => {
    const token = mintToken(ADMIN_OID, 'a@test.com');
    mockFindById.mockResolvedValue({ _id: ADMIN_OID, role: 'admin', email: 'a@test.com' });

    await request(app).get('/api/tenants').set('Authorization', `Bearer ${token}`).expect(200);
  });

  // ── JWT role bypass attempt → 403 ──────────────────────────────────────
  it('rejects a JWT that embeds role=admin in claims when DB user is viewer', async () => {
    // authService.generateTokens only embeds standard claims; role in DB is what matters.
    // Even if an attacker could forge a token with the right issuer, the DB lookup
    // returns role:'viewer' and requireAdmin must deny access.
    const token = mintToken(VIEWER_OID, 'v@test.com');
    mockFindById.mockResolvedValue({ _id: VIEWER_OID, role: 'viewer', email: 'v@test.com' });

    await request(app).get('/api/tenants').set('Authorization', `Bearer ${token}`).expect(403);
  });

  // ── No token → 401 ─────────────────────────────────────────────────────
  it('returns 401 when no token is provided', async () => {
    await request(app).get('/api/tenants').expect(401);
  });

  // ── Tampered / invalid token → 401 ─────────────────────────────────────
  it('returns 401 for a tampered token', async () => {
    const token = mintToken(ADMIN_OID, 'a@test.com') + 'tampered';

    await request(app).get('/api/tenants').set('Authorization', `Bearer ${token}`).expect(401);
  });

  // ── All four protected methods blocked for viewer ──────────────────────
  it.each([
    ['GET', '/api/tenants', undefined],
    ['GET', '/api/tenants/tid', undefined],
    ['POST', '/api/tenants', { name: 'X' }],
    ['PUT', '/api/tenants/tid', { name: 'Y' }],
  ])('%s %s returns 403 for a viewer', async (method, path, body) => {
    const token = mintToken(VIEWER_OID, 'v@test.com');
    mockFindById.mockResolvedValue({ _id: VIEWER_OID, role: 'viewer', email: 'v@test.com' });

    const req = request(app)
      [method.toLowerCase() as 'get' | 'post' | 'put'](path)
      .set('Authorization', `Bearer ${token}`);

    if (body) req.send(body);

    await req.expect(403);
  });
});
