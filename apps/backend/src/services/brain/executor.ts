import { BrainAction } from '../../models/brain-action.model';
import { brainActionsTotal } from '../../observability/metrics';
import { alertsService } from '../alerts.service';
import { settingsService } from '../settings.service';

export async function executeActions(tenantId: string, cycleId: string, actions: { type: string; target: string; reason?: string }[], mode: 'advisory' | 'enforced' = 'advisory') {
  const results: any[] = [];
  for (const a of actions) {
    const status = mode === 'enforced' ? 'executed' : 'planned';
    const doc = await BrainAction.create({
      cycleId,
      tenantId,
      type: a.type,
      target: a.target,
      reason: a.reason,
      status,
      executedAt: new Date()
    });
    brainActionsTotal.inc({ type: a.type, status });
    results.push({ id: doc._id.toString(), status });

    // Adapters (MVP): record memory for threshold adjustments, and emit audit-like logs for alerts
    if (mode === 'enforced') {
      switch (a.type) {
        case 'alert':
          alertsService.create({ type: 'system', title: a.reason || 'System Alert', description: `Overseer: ${a.reason || ''}`, severity: 'warning', details: { target: a.target, tenantId } });
          doc.result = { routed: true, channel: 'system' };
          await doc.save();
          break;
        case 'adjust_threshold':
          const current = await settingsService.getTrustThreshold(tenantId);
          const next = (current ?? 75) - 5;
          await settingsService.setTrustThreshold(tenantId, next);
          doc.result = { adjusted: true, target: a.target, value: next };
          await doc.save();
          break;
      }
    }
  }
  return results;
}
