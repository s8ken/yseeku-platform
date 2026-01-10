import { bedauService } from '../bedau.service';
import { TrustReceiptModel } from '../../models/trust-receipt.model';

export async function gatherSensors(tenantId: string) {
  const bedau = await bedauService.getMetrics(tenantId);
  const receipts = await TrustReceiptModel.find({ tenant_id: tenantId }).sort({ timestamp: -1 }).limit(50).select('ciq_metrics timestamp').lean();
  const avgTrust = receipts.length > 0 ? Math.round(receipts.reduce((s: number, r: any) => s + ((r.ciq_metrics?.quality || 0) + (r.ciq_metrics?.integrity || 0) + (r.ciq_metrics?.clarity || 0)) / 3, 0) / receipts.length) : 85;
  return { bedau, receipts, avgTrust };
}
