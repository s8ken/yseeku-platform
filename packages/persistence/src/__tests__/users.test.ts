import { upsertUser, getUserByUsername, hashPassword, verifyPassword } from '../users';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../db', () => ({
  getPool: jest.fn(),
}));

const mockPool = {
  query: jest.fn(),
};

const mockGetPool = require('../db').getPool;

describe('Users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPool.mockReturnValue(mockPool);
  });

  describe('upsertUser', () => {
    it('should return false if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await upsertUser({ id: 'test' });
      expect(result).toBe(false);
    });

    it('should upsert user and return true', async () => {
      mockPool.query.mockResolvedValue({});
      const user = {
        id: 'test',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hash',
      };
      const result = await upsertUser(user);
      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        `INSERT INTO users(id, email, name, password_hash)
     VALUES($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
        ['test', 'test@example.com', 'Test User', 'hash']
      );
    });
  });

  describe('getUserByUsername', () => {
    it('should return null if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await getUserByUsername('test');
      expect(result).toBeNull();
    });

    it('should return user if found', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'test', email: 'test@example.com', name: 'Test', password_hash: 'hash' }],
      });
      const result = await getUserByUsername('test');
      expect(result).toEqual({
        id: 'test',
        email: 'test@example.com',
        name: 'Test',
        passwordHash: 'hash',
      });
    });

    it('should return null if not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      const result = await getUserByUsername('test');
      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should hash password with salt rounds 12', async () => {
      const mockHash = require('bcryptjs').hash;
      mockHash.mockResolvedValue('hashed');
      const result = await hashPassword('password');
      expect(result).toBe('hashed');
      expect(mockHash).toHaveBeenCalledWith('password', 12);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password', async () => {
      const mockCompare = require('bcryptjs').compare;
      mockCompare.mockResolvedValue(true);
      const result = await verifyPassword('password', 'hash');
      expect(result).toBe(true);
      expect(mockCompare).toHaveBeenCalledWith('password', 'hash');
    });
  });
});
