import { writeAuditLog, queryAuditLogs } from '../audit';

// Mock the pool
const mockPool = {
  query: jest.fn(),
};

jest.mock('../db', () => ({
  ...jest.requireActual('../db'),
  getPool: () => mockPool,
}));

describe('Tenant Isolation', () => {
  const originalEnv = process.env.TENANT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.TENANT_ID;
  });

  afterAll(() => {
    if (originalEnv) {
      process.env.TENANT_ID = originalEnv;
    } else {
      delete process.env.TENANT_ID;
    }
  });

  it('should use tenantId from environment when not provided explicitly', async () => {
    const tenantId = 'test-tenant-123';
    process.env.TENANT_ID = tenantId;

    await writeAuditLog({
      id: 'log-1',
      event: 'test-event',
      status: 'success',
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_logs'),
      expect.arrayContaining([tenantId])
    );
  });

  it('should use explicitly provided tenantId instead of environment', async () => {
    const envTenantId = 'env-tenant';
    const explicitTenantId = 'explicit-tenant';
    process.env.TENANT_ID = envTenantId;

    await writeAuditLog(
      {
        id: 'log-2',
        event: 'test-event',
        status: 'success',
      },
      explicitTenantId
    );

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_logs'),
      expect.arrayContaining([explicitTenantId])
    );
  });

  it('should filter query results by tenantId from environment', async () => {
    const tenantId = 'query-tenant';
    process.env.TENANT_ID = tenantId;

    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await queryAuditLogs();

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (tenant_id = $1 OR $1 IS NULL)'),
      expect.arrayContaining([tenantId])
    );
  });

  it('should allow querying all tenants if no environment is set (admin case)', async () => {
    delete process.env.TENANT_ID;
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await queryAuditLogs();

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (tenant_id = $1 OR $1 IS NULL)'),
      expect.arrayContaining([null])
    );
  });
});
