import { BrainMemory } from '../models/brain-memory.model';

export const settingsService = {
  async setTrustThreshold(tenantId: string, value: number) {
    await BrainMemory.create({ tenantId, kind: 'setting:trustThreshold', payload: { value }, tags: ['setting','trust'] });
    return value;
  },
  async getTrustThreshold(tenantId: string): Promise<number | null> {
    const doc = await BrainMemory.findOne({ tenantId, kind: 'setting:trustThreshold' }).sort({ createdAt: -1 });
    return doc?.payload?.value ?? null;
  }
};
