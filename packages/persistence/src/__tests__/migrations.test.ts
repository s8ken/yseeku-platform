import { runMigrations, getMigrationStatus } from '../migrations';

jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
  basename: jest.fn(),
}));

jest.mock('../db', () => ({
  getPool: jest.fn(),
}));

const mockPool = {
  query: jest.fn(),
};

const mockGetPool = require('../db').getPool;
const mockFs = require('fs');
const mockPath = require('path');

describe('Migrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPool.mockReturnValue(mockPool);
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.basename.mockImplementation((file: string) => file.split('.')[0]);
  });

  describe('runMigrations', () => {
    it('should throw if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      await expect(runMigrations()).rejects.toThrow('Database pool not available');
    });

    it('should run pending migrations', async () => {
      mockFs.readdirSync.mockReturnValue(['001_initial.sql', '002_update.sql']);
      mockFs.readFileSync.mockReturnValue('CREATE TABLE test;');
      mockPool.query
        .mockResolvedValueOnce({}) // create migrations table
        .mockResolvedValueOnce({ rows: [{ version: '001' }] }) // applied migrations
        .mockResolvedValueOnce({}) // run migration
        .mockResolvedValueOnce({}); // insert migration record

      await runMigrations();

      expect(mockPool.query).toHaveBeenCalledWith(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT version FROM schema_migrations ORDER BY version'
      );
      expect(mockPool.query).toHaveBeenCalledWith('CREATE TABLE test;');
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        ['002']
      );
    });
  });

  describe('getMigrationStatus', () => {
    it('should return empty array if no pool', async () => {
      mockGetPool.mockReturnValue(null);
      const result = await getMigrationStatus();
      expect(result).toEqual([]);
    });

    it('should return migration status', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ version: '001', applied_at: new Date() }],
      });
      const result = await getMigrationStatus();
      expect(result).toEqual([{ version: '001', applied_at: expect.any(Date) }]);
    });
  });
});
