/**
 * Transmission Log Service
 *
 * Records and queries logs of data transmissions between AI agents,
 * the platform, and external systems. Supports GDPR Article 30 audit
 * trail requirements and SOC2 logging standards.
 *
 * Privacy note: payload content is NEVER stored — only a SHA-256 hash
 * of the payload and its byte size are recorded.
 */

import crypto from 'crypto';
import { TransmissionLog, ITransmissionLog } from '../models/transmission-log.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

export interface TransmissionEntry {
  source: string;
  destination: string;
  dataType: string;
  tenantId: string;
  sessionId?: string;
  agentId?: string;
  userId?: string;
  payload?: string | object;   // Will be hashed, never stored raw
  direction?: 'inbound' | 'outbound' | 'internal';
  status?: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface TransmissionSummary {
  total: number;
  byDataType: Record<string, number>;
  byStatus: { success: number; failure: number; partial: number };
  byDirection: { inbound: number; outbound: number; internal: number };
  period: { from: string; to: string };
}

export class TransmissionLogService {
  /**
   * Record a transmission event.
   * Payload content is hashed (SHA-256) — raw content is never persisted.
   */
  async record(entry: TransmissionEntry): Promise<void> {
    try {
      let payloadHash: string | undefined;
      let sizeBytes: number | undefined;

      if (entry.payload) {
        const raw =
          typeof entry.payload === 'string'
            ? entry.payload
            : JSON.stringify(entry.payload);
        payloadHash = crypto.createHash('sha256').update(raw).digest('hex');
        sizeBytes = Buffer.byteLength(raw, 'utf8');
      }

      await TransmissionLog.create({
        source: entry.source,
        destination: entry.destination,
        dataType: entry.dataType,
        tenantId: entry.tenantId,
        sessionId: entry.sessionId,
        agentId: entry.agentId,
        userId: entry.userId,
        payloadHash,
        sizeBytes,
        direction: entry.direction ?? 'internal',
        status: entry.status ?? 'success',
        errorMessage: entry.errorMessage,
        metadata: entry.metadata ?? {},
        recordedAt: new Date(),
      });

      logger.debug('Transmission log recorded', {
        source: entry.source,
        destination: entry.destination,
        dataType: entry.dataType,
        tenantId: entry.tenantId,
        status: entry.status ?? 'success',
      });
    } catch (error) {
      // Log but never throw — transmission logging must not break the main flow
      logger.error('Failed to record transmission log', {
        error: getErrorMessage(error),
        source: entry.source,
        destination: entry.destination,
      });
    }
  }

  /**
   * Retrieve transmission logs for a tenant with optional filters.
   */
  async query(options: {
    tenantId: string;
    dataType?: string;
    source?: string;
    destination?: string;
    status?: string;
    direction?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ITransmissionLog[]; total: number }> {
    const {
      tenantId,
      dataType,
      source,
      destination,
      status,
      direction,
      from,
      to,
      limit = 50,
      offset = 0,
    } = options;

    const filter: Record<string, any> = { tenantId };
    if (dataType) filter.dataType = dataType;
    if (source) filter.source = source;
    if (destination) filter.destination = destination;
    if (status) filter.status = status;
    if (direction) filter.direction = direction;
    if (from || to) {
      filter.recordedAt = {};
      if (from) filter.recordedAt.$gte = from;
      if (to) filter.recordedAt.$lte = to;
    }

    const [logs, total] = await Promise.all([
      TransmissionLog.find(filter)
        .sort({ recordedAt: -1 })
        .skip(offset)
        .limit(Math.min(limit, 200))
        .lean(),
      TransmissionLog.countDocuments(filter),
    ]);

    return { logs: logs as ITransmissionLog[], total };
  }

  /**
   * Generate a summary of transmission activity for a tenant.
   * Used in compliance reports and audit dashboards.
   */
  async summarise(tenantId: string, days = 30): Promise<TransmissionSummary> {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const to = new Date();

    const logs = await TransmissionLog.find({
      tenantId,
      recordedAt: { $gte: from, $lte: to },
    }).lean();

    const byDataType: Record<string, number> = {};
    const byStatus = { success: 0, failure: 0, partial: 0 };
    const byDirection = { inbound: 0, outbound: 0, internal: 0 };

    for (const log of logs) {
      byDataType[log.dataType] = (byDataType[log.dataType] ?? 0) + 1;
      if (log.status in byStatus) byStatus[log.status as keyof typeof byStatus]++;
      if (log.direction in byDirection) byDirection[log.direction as keyof typeof byDirection]++;
    }

    return {
      total: logs.length,
      byDataType,
      byStatus,
      byDirection,
      period: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  /**
   * Delete logs older than the specified number of days.
   * Supports GDPR right to erasure and data minimisation policies.
   */
  async purgeOlderThan(days: number, tenantId?: string): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter: Record<string, any> = { recordedAt: { $lt: cutoff } };
    if (tenantId) filter.tenantId = tenantId;

    const result = await TransmissionLog.deleteMany(filter);
    logger.info('Transmission logs purged', {
      deleted: result.deletedCount,
      olderThanDays: days,
      tenantId: tenantId ?? 'all',
    });
    return result.deletedCount;
  }
}

export const transmissionLogService = new TransmissionLogService();
