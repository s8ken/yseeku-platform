/**
 * Shared receipt persistence helper.
 *
 * Every code path that generates a TrustReceipt (receipts.routes, trust.service,
 * llm-trust-evaluator) should call this so the chain tip is always persisted.
 * Without this, restarting the server would lose track of the chain.
 */

import { TrustReceipt } from '@sonate/schemas';
import { TrustReceiptModel } from '../../models/trust-receipt.model';
import logger from '../../utils/logger';

/**
 * Persist a TrustReceipt to MongoDB.
 *
 * Fire-and-forget safe — logs warnings on failure but never throws,
 * so callers can still return the receipt to the client.
 */
export async function persistReceipt(
  receipt: TrustReceipt,
  tenantId: string = 'default',
  extra?: {
    evaluated_by?: 'llm' | 'heuristic' | 'hybrid';
    sonate_principles?: Record<string, number>;
    overall_trust_score?: number;
    trust_status?: 'PASS' | 'PARTIAL' | 'FAIL';
    principle_weights?: Record<string, number>;
    weight_source?: string;
    weight_policy_id?: string;
  },
): Promise<void> {
  // Unsigned stubs should not be persisted — they would corrupt the chain.
  if (receipt.id === 'unsigned') return;

  try {
    await TrustReceiptModel.create({
      self_hash: receipt.id,
      session_id: receipt.session_id,
      version: receipt.version,
      timestamp: new Date(receipt.timestamp).getTime(),
      mode: receipt.mode,
      ciq_metrics: receipt.telemetry?.ciq_metrics || {
        clarity: 0,
        integrity: 0,
        quality: 0,
      },
      previous_hash: receipt.chain?.previous_hash,
      chain_hash: receipt.chain?.chain_hash,
      chain_length: receipt.chain?.chain_length,
      signature: receipt.signature?.value,
      tenant_id: tenantId,
      issuer: receipt.agent_did,
      subject: receipt.human_did,
      // Optional enrichment
      ...(extra?.evaluated_by && { evaluated_by: extra.evaluated_by }),
      ...(extra?.sonate_principles && { sonate_principles: extra.sonate_principles }),
      ...(extra?.overall_trust_score != null && { overall_trust_score: extra.overall_trust_score }),
      ...(extra?.trust_status && { trust_status: extra.trust_status }),
      ...(extra?.principle_weights && { principle_weights: extra.principle_weights }),
      ...(extra?.weight_source && { weight_source: extra.weight_source }),
      ...(extra?.weight_policy_id && { weight_policy_id: extra.weight_policy_id }),
    });
    logger.info('Receipt persisted to database', {
      id: receipt.id,
      chain_length: receipt.chain?.chain_length,
    });
  } catch (err: unknown) {
    // Log but never throw — the receipt was generated successfully
    logger.warn('Failed to persist receipt to database', {
      error: err instanceof Error ? err.message : String(err),
      receipt_id: receipt.id,
    });
  }
}
