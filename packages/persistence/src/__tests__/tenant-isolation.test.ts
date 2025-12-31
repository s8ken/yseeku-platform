import { tenantContext } from '@sonate/core';
import { writeAuditLog, queryAuditLogs } from '../audit';
import * as db from '../db';

// Mock the pool
const mockPool = {
  query: jest.fn(),
};

jest.mock('../db', () => ({
  ...jest.requireActual('../db'),
  getPool: () => mockPool,
}));

describe('Tenant Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use tenantId from context when not provided explicitly', async () => {
    const tenantId = 'test-tenant-123';
    
    await tenantContext.run({ tenantId }, async () => {
      await writeAuditLog({
        id: 'log-1',
        event: 'test-event',
        status: 'success'
      });
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_logs'),
      expect.arrayContaining([tenantId])
    );
  });

  it('should use explicitly provided tenantId instead of context', async () => {
    const contextTenantId = 'context-tenant';
    const explicitTenantId = 'explicit-tenant';
    
    await tenantContext.run({ tenantId: contextTenantId }, async () => {
      await writeAuditLog({
        id: 'log-2',
        event: 'test-event',
        status: 'success'
      }, explicitTenantId);
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_logs'),
      expect.arrayContaining([explicitTenantId])
    );
  });

  it('should filter query results by tenantId from context', async () => {
    const tenantId = 'query-tenant';
    
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await tenantContext.run({ tenantId }, async () => {
      await queryAuditLogs();
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (tenant_id = $1 OR $1 IS NULL)'),
      expect.arrayContaining([tenantId])
    );
  });

  it('should allow querying all tenants if no context is set (admin case)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await queryAuditLogs();

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (tenant_id = $1 OR $1 IS NULL)'),
      expect.arrayContaining([null])
    );
  });
});
