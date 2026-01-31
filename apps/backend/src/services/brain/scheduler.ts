import { systemBrain } from '../system-brain.service';
import { Tenant } from '../../models/tenant.model';
import logger from '../../utils/logger';

let intervalHandle: NodeJS.Timeout | null = null;

export async function startOverseerScheduler(): Promise<void> {
  const enabled = (process.env.OVERSEER_SCHEDULE_ENABLED || 'false').toLowerCase() === 'true';
  
  if (!enabled) {
    logger.info('Overseer scheduler disabled (OVERSEER_SCHEDULE_ENABLED != true)');
    return;
  }
  
  const periodMs = Number(process.env.OVERSEER_INTERVAL_MS || 60000);
  const mode = (process.env.OVERSEER_MODE || 'advisory') as 'advisory' | 'enforced';
  
  if (intervalHandle) {
    logger.warn('Overseer scheduler already running, skipping duplicate start');
    return;
  }
  
  logger.info('🧠 Overseer scheduler starting', {
    intervalMs: periodMs,
    mode,
    realtimeEnabled: process.env.OVERSEER_REALTIME_ENABLED !== 'false',
  });
  
  // Run first cycle immediately after a short delay (let DB connect first)
  setTimeout(async () => {
    try {
      logger.info('Overseer: Running initial think cycle');
      await runThinkCycle(mode);
    } catch (err: any) {
      logger.error('Overseer: Initial cycle failed', { error: err?.message || err });
    }
  }, 5000);
  
  intervalHandle = setInterval(async () => {
    await runThinkCycle(mode);
  }, periodMs);
}

async function runThinkCycle(mode: 'advisory' | 'enforced'): Promise<void> {
  try {
    const tenants = await Tenant.find({ status: 'active' }).select('_id name').lean();
    const tenantIds = tenants.length > 0 ? tenants.map(t => t._id.toString()) : ['default'];
    
    logger.debug('Overseer: Running think cycle', { tenantCount: tenantIds.length, mode });
    
    for (const t of tenantIds) {
      await systemBrain.think(t, mode);
    }
  } catch (err: any) {
    logger.error('Overseer: Think cycle error', { error: err?.message || err });
  }
}
