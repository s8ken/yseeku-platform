import { BrainMemory, IBrainMemory } from '../../models/brain-memory.model';

export interface MemoryOptions {
  expiresAt?: Date;
  acl?: Record<string, any>;
}

export interface RecallByTagsOptions {
  limit?: number;
  matchAll?: boolean;
}

export interface ForgetOptions {
  olderThan?: Date;
  all?: boolean;
}

// Lean document type for queries (without mongoose document methods)
export type LeanBrainMemory = {
  _id: any;
  tenantId: string;
  kind: string;
  payload: Record<string, any>;
  tags: string[];
  acl?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
};

/**
 * Store a memory in the brain's persistent storage
 */
export async function remember(
  tenantId: string,
  kind: string,
  payload: Record<string, any>,
  tags: string[] = [],
  options?: MemoryOptions
): Promise<IBrainMemory> {
  const memory = await BrainMemory.create({
    tenantId,
    kind,
    payload,
    tags,
    expiresAt: options?.expiresAt,
    acl: options?.acl,
  });
  return memory;
}

/**
 * Recall the latest memory of a specific kind
 */
export async function recall(
  tenantId: string,
  kind: string
): Promise<LeanBrainMemory | null> {
  return BrainMemory.findOne({ tenantId, kind })
    .sort({ createdAt: -1 })
    .lean() as Promise<LeanBrainMemory | null>;
}

/**
 * Recall multiple memories of a specific kind
 */
export async function recallMany(
  tenantId: string,
  kind: string,
  limit: number = 10
): Promise<LeanBrainMemory[]> {
  return BrainMemory.find({ tenantId, kind })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean() as Promise<LeanBrainMemory[]>;
}

/**
 * Search memories by tags
 * @param matchAll - if true, matches memories that have ALL tags; if false, matches ANY tag
 */
export async function recallByTags(
  tenantId: string,
  tags: string[],
  options?: RecallByTagsOptions
): Promise<LeanBrainMemory[]> {
  const query = options?.matchAll
    ? { tenantId, tags: { $all: tags } }  // Match ALL tags
    : { tenantId, tags: { $in: tags } };  // Match ANY tag

  return BrainMemory.find(query)
    .sort({ createdAt: -1 })
    .limit(options?.limit || 50)
    .lean() as Promise<LeanBrainMemory[]>;
}

/**
 * Recall memories by kind pattern (supports regex)
 */
export async function recallByKindPattern(
  tenantId: string,
  kindPattern: string | RegExp,
  limit: number = 50
): Promise<LeanBrainMemory[]> {
  const pattern = typeof kindPattern === 'string'
    ? new RegExp(kindPattern)
    : kindPattern;

  return BrainMemory.find({ tenantId, kind: pattern })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean() as Promise<LeanBrainMemory[]>;
}

/**
 * Forget (delete) memories of a specific kind
 * By default, only deletes the oldest memory; use options.all to delete all
 */
export async function forget(
  tenantId: string,
  kind: string,
  options?: ForgetOptions
): Promise<{ deletedCount: number }> {
  const query: Record<string, any> = { tenantId, kind };

  if (options?.olderThan) {
    query.createdAt = { $lt: options.olderThan };
  }

  if (options?.all) {
    const result = await BrainMemory.deleteMany(query);
    return { deletedCount: result.deletedCount || 0 };
  }

  // By default, only delete the oldest one
  const oldest = await BrainMemory.findOne(query).sort({ createdAt: 1 });
  if (oldest) {
    await BrainMemory.deleteOne({ _id: oldest._id });
    return { deletedCount: 1 };
  }
  return { deletedCount: 0 };
}

/**
 * Forget memories matching any of the provided tags
 */
export async function forgetByTags(
  tenantId: string,
  tags: string[]
): Promise<{ deletedCount: number }> {
  const result = await BrainMemory.deleteMany({
    tenantId,
    tags: { $in: tags },
  });
  return { deletedCount: result.deletedCount || 0 };
}

/**
 * Update an existing memory's payload (creates new if not found)
 */
export async function updateMemory(
  tenantId: string,
  kind: string,
  payload: Record<string, any>,
  tags?: string[]
): Promise<IBrainMemory> {
  const existing = await BrainMemory.findOne({ tenantId, kind }).sort({ createdAt: -1 });

  if (existing) {
    existing.payload = { ...existing.payload, ...payload };
    if (tags) {
      existing.tags = tags;
    }
    await existing.save();
    return existing;
  }

  // Create new if not found
  return remember(tenantId, kind, payload, tags || []);
}

/**
 * Check if a memory of a specific kind exists
 */
export async function hasMemory(
  tenantId: string,
  kind: string
): Promise<boolean> {
  const count = await BrainMemory.countDocuments({ tenantId, kind });
  return count > 0;
}

/**
 * Get count of memories by kind
 */
export async function countMemories(
  tenantId: string,
  kind?: string
): Promise<number> {
  const query: Record<string, any> = { tenantId };
  if (kind) {
    query.kind = kind;
  }
  return BrainMemory.countDocuments(query);
}
