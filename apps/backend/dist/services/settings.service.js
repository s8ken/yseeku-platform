"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
const brain_memory_model_1 = require("../models/brain-memory.model");
exports.settingsService = {
    async setTrustThreshold(tenantId, value) {
        await brain_memory_model_1.BrainMemory.create({ tenantId, kind: 'setting:trustThreshold', payload: { value }, tags: ['setting', 'trust'] });
        return value;
    },
    async getTrustThreshold(tenantId) {
        const doc = await brain_memory_model_1.BrainMemory.findOne({ tenantId, kind: 'setting:trustThreshold' }).sort({ createdAt: -1 });
        return doc?.payload?.value ?? null;
    }
};
