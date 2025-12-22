import { writeAuditLog, queryAuditLogs } from '../audit';

jest.mock('../db', () => ({
  getPool: jest.fn(),
}));

const mockPool = {
  query: jest.fn(),
};

const mockGetPool = require('../db').getPool;

describe('Audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPool.mockReturnValue(mockPool);
  });

  describe('writeAuditLog', () => {
    it('should return false if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await writeAuditLog({ id: 'test', event: 'test', status: 'success' });
      expect(result).toBe(false);
    });

    it('should write audit log and return true', async () => {
      mockPool.query.mockResolvedValue({});
      const entry = {
        id: 'test',
        user_id: 'user',
        event: 'login',
        status: 'success' as const,
        details: { ip: '127.0.0.1' },
      };
      const result = await writeAuditLog(entry, 'tenant');
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        `INSERT INTO audit_logs(id, user_id, event, status, details, tenant_id)
     VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO NOTHING`,
        ['test', 'user', 'login', 'success', '{"ip":"127.0.0.1"}', 'tenant']
      );
    });
  });

  describe('queryAuditLogs', () => {
    it('should return empty array if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await queryAuditLogs();
      expect(result).toEqual([]);
    });

    it('should return audit logs', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          id: 'test',
          user_id: 'user',
          event: 'login',
          status: 'success',
          details: { ip: '127.0.0.1' },
          tenant_id: 'tenant',
          created_at: new Date(),
        }],
      });
      const result = await queryAuditLogs('tenant', 10);
      expect(result).toEqual([{
        id: 'test',
        user_id: 'user',
        event: 'login',
        status: 'success',
        details: { ip: '127.0.0.1' },
        tenant_id: 'tenant',
        created_at: expect.any(Date),
      }]);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT id, user_id, event, status, details, tenant_id, created_at FROM audit_logs WHERE (tenant_id = $1 OR $1 IS NULL) ORDER BY created_at DESC LIMIT $2`,
        ['tenant', 10]
      );
    });
  });
});