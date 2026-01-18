import { saveTrustReceipt, getReceiptsBySession } from '../receipts';

jest.mock('../db', () => ({
  getPool: jest.fn(),
  resolveTenantId: jest.fn((tenantId?: string) => tenantId ?? null),
}));

jest.mock('@sonate/core', () => ({
  TrustReceipt: {
    fromJSON: jest.fn(),
  },
}));

const mockPool = {
  query: jest.fn(),
};

const mockGetPool = require('../db').getPool;
const mockTrustReceipt = require('@sonate/core').TrustReceipt;

describe('Receipts', () => {
  const sessionId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPool.mockReturnValue(mockPool);
  });

  describe('saveTrustReceipt', () => {
    it('should return false if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await saveTrustReceipt({} as any);
      expect(result).toBe(false);
    });

    it('should save receipt and return true', async () => {
      mockPool.query.mockResolvedValue({});
      const receipt = {
        self_hash: 'hash',
        session_id: 'session',
        version: '1.0',
        timestamp: 123456,
        mode: 'test',
        ciq_metrics: { clarity: 0.8 },
        previous_hash: 'prev',
        signature: 'sig',
        session_nonce: 'nonce',
      };
      const result = await saveTrustReceipt(receipt as any, 'tenant');
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        `INSERT INTO trust_receipts(self_hash, session_id, version, timestamp, mode, ciq, previous_hash, signature, session_nonce, tenant_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (self_hash) DO NOTHING`,
        [
          'hash',
          'session',
          '1.0',
          123456,
          'test',
          '{"clarity":0.8}',
          'prev',
          'sig',
          'nonce',
          'tenant',
        ]
      );
    });
  });

  describe('getReceiptsBySession', () => {
    it('should return empty array if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await getReceiptsBySession(sessionId);
      expect(result).toEqual([]);
    });

    it('should return receipts for session', async () => {
      const mockReceipt = { self_hash: 'hash' };
      mockTrustReceipt.fromJSON.mockReturnValue(mockReceipt);
      mockPool.query.mockResolvedValue({
        rows: [
          {
            version: '1.0',
            session_id: sessionId,
            timestamp: '123456',
            mode: 'test',
            ciq: { clarity: 0.8 },
            previous_hash: 'prev',
            self_hash: 'hash',
            signature: 'sig',
            session_nonce: 'nonce',
          },
        ],
      });
      const result = await getReceiptsBySession(sessionId, 'tenant');
      expect(result).toEqual([mockReceipt]);
      expect(mockTrustReceipt.fromJSON).toHaveBeenCalledWith({
        version: '1.0',
        session_id: sessionId,
        timestamp: 123456,
        mode: 'test',
        ciq_metrics: { clarity: 0.8 },
        previous_hash: 'prev',
        signature: 'sig',
        self_hash: 'hash',
        session_nonce: 'nonce',
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT version, session_id, timestamp, mode, ciq, previous_hash, self_hash, signature, session_nonce FROM trust_receipts WHERE session_id = $1 AND (tenant_id = $2 OR $2 IS NULL) ORDER BY timestamp ASC`,
        [sessionId, 'tenant']
      );
    });
  });
});
