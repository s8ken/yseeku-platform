import {
  remember,
  recall,
  recallMany,
  recallByTags,
  forget,
  forgetByTags,
  hasMemory,
  countMemories,
} from '../../services/brain/memory';
import { BrainMemory } from '../../models/brain-memory.model';

// Mock the BrainMemory model
jest.mock('../../models/brain-memory.model', () => ({
  BrainMemory: {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('Brain Memory Service', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('remember()', () => {
    it('should create a new memory with required fields', async () => {
      const mockMemory = {
        _id: 'mem-1',
        tenantId: mockTenantId,
        kind: 'test-kind',
        payload: { data: 'test' },
        tags: ['tag1'],
      };
      (BrainMemory.create as jest.Mock).mockResolvedValue(mockMemory);

      const result = await remember(mockTenantId, 'test-kind', { data: 'test' }, ['tag1']);

      expect(BrainMemory.create).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        kind: 'test-kind',
        payload: { data: 'test' },
        tags: ['tag1'],
        expiresAt: undefined,
        acl: undefined,
      });
      expect(result).toEqual(mockMemory);
    });

    it('should create memory with optional expiresAt and acl', async () => {
      const expiresAt = new Date('2025-12-31');
      const acl = { read: ['admin'] };
      const mockMemory = { _id: 'mem-2' };

      (BrainMemory.create as jest.Mock).mockResolvedValue(mockMemory);

      await remember(mockTenantId, 'test-kind', { value: 42 }, ['tag1'], { expiresAt, acl });

      expect(BrainMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt, acl })
      );
    });

    it('should use empty array as default for tags', async () => {
      (BrainMemory.create as jest.Mock).mockResolvedValue({});

      await remember(mockTenantId, 'test-kind', { data: 'test' });

      expect(BrainMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [] })
      );
    });
  });

  describe('recall()', () => {
    it('should return the latest memory of a kind', async () => {
      const mockMemory = { kind: 'test', payload: { value: 42 } };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMemory),
      };
      (BrainMemory.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await recall(mockTenantId, 'test');

      expect(BrainMemory.findOne).toHaveBeenCalledWith({ tenantId: mockTenantId, kind: 'test' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(mockMemory);
    });

    it('should return null when no memory found', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (BrainMemory.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await recall(mockTenantId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('recallMany()', () => {
    it('should return multiple memories with default limit', async () => {
      const mockMemories = [{ kind: 'test', payload: { n: 1 } }, { kind: 'test', payload: { n: 2 } }];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockMemories),
      };
      (BrainMemory.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await recallMany(mockTenantId, 'test');

      expect(BrainMemory.find).toHaveBeenCalledWith({ tenantId: mockTenantId, kind: 'test' });
      expect(mockQuery.limit).toHaveBeenCalledWith(10); // Default limit
      expect(result).toEqual(mockMemories);
    });

    it('should respect custom limit', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (BrainMemory.find as jest.Mock).mockReturnValue(mockQuery);

      await recallMany(mockTenantId, 'test', 5);

      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('recallByTags()', () => {
    it('should search by ANY tag by default', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (BrainMemory.find as jest.Mock).mockReturnValue(mockQuery);

      await recallByTags(mockTenantId, ['tag1', 'tag2']);

      expect(BrainMemory.find).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        tags: { $in: ['tag1', 'tag2'] },
      });
    });

    it('should search by ALL tags when matchAll is true', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (BrainMemory.find as jest.Mock).mockReturnValue(mockQuery);

      await recallByTags(mockTenantId, ['tag1', 'tag2'], { matchAll: true });

      expect(BrainMemory.find).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        tags: { $all: ['tag1', 'tag2'] },
      });
    });

    it('should respect custom limit option', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (BrainMemory.find as jest.Mock).mockReturnValue(mockQuery);

      await recallByTags(mockTenantId, ['tag1'], { limit: 25 });

      expect(mockQuery.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('forget()', () => {
    it('should delete oldest memory by default', async () => {
      const mockMemory = { _id: 'mem-1' };
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockMemory),
      };
      (BrainMemory.findOne as jest.Mock).mockReturnValue(mockQuery);
      (BrainMemory.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await forget(mockTenantId, 'test-kind');

      expect(BrainMemory.findOne).toHaveBeenCalledWith({ tenantId: mockTenantId, kind: 'test-kind' });
      expect(BrainMemory.deleteOne).toHaveBeenCalledWith({ _id: 'mem-1' });
      expect(result).toEqual({ deletedCount: 1 });
    });

    it('should delete all memories when all option is true', async () => {
      (BrainMemory.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });

      const result = await forget(mockTenantId, 'test-kind', { all: true });

      expect(BrainMemory.deleteMany).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        kind: 'test-kind',
      });
      expect(result).toEqual({ deletedCount: 5 });
    });

    it('should filter by olderThan when specified', async () => {
      const olderThan = new Date('2025-01-01');
      (BrainMemory.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

      await forget(mockTenantId, 'test-kind', { olderThan, all: true });

      expect(BrainMemory.deleteMany).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        kind: 'test-kind',
        createdAt: { $lt: olderThan },
      });
    });

    it('should return 0 deletedCount when no memory found', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(null),
      };
      (BrainMemory.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await forget(mockTenantId, 'test-kind');

      expect(result).toEqual({ deletedCount: 0 });
    });
  });

  describe('forgetByTags()', () => {
    it('should delete memories matching any tag', async () => {
      (BrainMemory.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

      const result = await forgetByTags(mockTenantId, ['obsolete', 'temp']);

      expect(BrainMemory.deleteMany).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        tags: { $in: ['obsolete', 'temp'] },
      });
      expect(result).toEqual({ deletedCount: 3 });
    });
  });

  describe('hasMemory()', () => {
    it('should return true when memory exists', async () => {
      (BrainMemory.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await hasMemory(mockTenantId, 'test-kind');

      expect(BrainMemory.countDocuments).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        kind: 'test-kind',
      });
      expect(result).toBe(true);
    });

    it('should return false when memory does not exist', async () => {
      (BrainMemory.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await hasMemory(mockTenantId, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('countMemories()', () => {
    it('should count all memories for tenant when kind not specified', async () => {
      (BrainMemory.countDocuments as jest.Mock).mockResolvedValue(42);

      const result = await countMemories(mockTenantId);

      expect(BrainMemory.countDocuments).toHaveBeenCalledWith({ tenantId: mockTenantId });
      expect(result).toBe(42);
    });

    it('should count memories by kind when specified', async () => {
      (BrainMemory.countDocuments as jest.Mock).mockResolvedValue(10);

      const result = await countMemories(mockTenantId, 'specific-kind');

      expect(BrainMemory.countDocuments).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        kind: 'specific-kind',
      });
      expect(result).toBe(10);
    });
  });
});
