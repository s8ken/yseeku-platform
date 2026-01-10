import { systemBrain } from '../system-brain.service';
import { Tenant } from '../../models/tenant.model';

let intervalHandle: NodeJS.Timeout | null = null;

export async function startOverseerScheduler(): Promise<void> {
  const enabled = (process.env.OVERSEER_SCHEDULE_ENABLED || 'false').toLowerCase() === 'true';
  if (!enabled) return;
  const periodMs = Number(process.env.OVERSEER_INTERVAL_MS || 60000);
  const mode = (process.env.OVERSEER_MODE || 'advisory') as 'advisory' | 'enforced';
  if (intervalHandle) return;
  intervalHandle = setInterval(async () => {
    try {
      const tenants = await Tenant.find({ status: 'active' }).select('_id name').lean();
      const tenantIds = tenants.length > 0 ? tenants.map(t => t._id.toString()) : ['default'];
      for (const t of tenantIds) {
        await systemBrain.think(t, mode);
      }
    } catch (_) { /* no-op */ }
  }, periodMs);
}
