import { BrainMemory } from '../../models/brain-memory.model';

export async function remember(tenantId: string, kind: string, payload: Record<string, any>, tags: string[]) {
  await BrainMemory.create({ tenantId, kind, payload, tags });
}
