"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remember = remember;
exports.recall = recall;
exports.recallMany = recallMany;
exports.recallByTags = recallByTags;
exports.recallByKindPattern = recallByKindPattern;
exports.forget = forget;
exports.forgetByTags = forgetByTags;
exports.updateMemory = updateMemory;
exports.hasMemory = hasMemory;
exports.countMemories = countMemories;
const brain_memory_model_1 = require("../../models/brain-memory.model");
/**
 * Store a memory in the brain's persistent storage
 */
async function remember(tenantId, kind, payload, tags = [], options) {
    const memory = await brain_memory_model_1.BrainMemory.create({
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
async function recall(tenantId, kind) {
    return brain_memory_model_1.BrainMemory.findOne({ tenantId, kind })
        .sort({ createdAt: -1 })
        .lean();
}
/**
 * Recall multiple memories of a specific kind
 */
async function recallMany(tenantId, kind, limit = 10) {
    return brain_memory_model_1.BrainMemory.find({ tenantId, kind })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}
/**
 * Search memories by tags
 * @param matchAll - if true, matches memories that have ALL tags; if false, matches ANY tag
 */
async function recallByTags(tenantId, tags, options) {
    const query = options?.matchAll
        ? { tenantId, tags: { $all: tags } } // Match ALL tags
        : { tenantId, tags: { $in: tags } }; // Match ANY tag
    return brain_memory_model_1.BrainMemory.find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 50)
        .lean();
}
/**
 * Recall memories by kind pattern (supports regex)
 */
async function recallByKindPattern(tenantId, kindPattern, limit = 50) {
    const pattern = typeof kindPattern === 'string'
        ? new RegExp(kindPattern)
        : kindPattern;
    return brain_memory_model_1.BrainMemory.find({ tenantId, kind: pattern })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}
/**
 * Forget (delete) memories of a specific kind
 * By default, only deletes the oldest memory; use options.all to delete all
 */
async function forget(tenantId, kind, options) {
    const query = { tenantId, kind };
    if (options?.olderThan) {
        query.createdAt = { $lt: options.olderThan };
    }
    if (options?.all) {
        const result = await brain_memory_model_1.BrainMemory.deleteMany(query);
        return { deletedCount: result.deletedCount || 0 };
    }
    // By default, only delete the oldest one
    const oldest = await brain_memory_model_1.BrainMemory.findOne(query).sort({ createdAt: 1 });
    if (oldest) {
        await brain_memory_model_1.BrainMemory.deleteOne({ _id: oldest._id });
        return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
}
/**
 * Forget memories matching any of the provided tags
 */
async function forgetByTags(tenantId, tags) {
    const result = await brain_memory_model_1.BrainMemory.deleteMany({
        tenantId,
        tags: { $in: tags },
    });
    return { deletedCount: result.deletedCount || 0 };
}
/**
 * Update an existing memory's payload (creates new if not found)
 */
async function updateMemory(tenantId, kind, payload, tags) {
    const existing = await brain_memory_model_1.BrainMemory.findOne({ tenantId, kind }).sort({ createdAt: -1 });
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
async function hasMemory(tenantId, kind) {
    const count = await brain_memory_model_1.BrainMemory.countDocuments({ tenantId, kind });
    return count > 0;
}
/**
 * Get count of memories by kind
 */
async function countMemories(tenantId, kind) {
    const query = { tenantId };
    if (kind) {
        query.kind = kind;
    }
    return brain_memory_model_1.BrainMemory.countDocuments(query);
}
