/**
 * Receipt Exporter Service
 * 
 * Responsible for exporting receipts in formats suitable for enterprise tools
 * 
 * Supports:
 * - JSON (raw format)
 * - JSONL (line-delimited JSON for streaming)
 * - CSV (for spreadsheets)
 * - SIEM formats (Splunk, Datadog, Elastic)
 */

import { TrustReceipt, SCHEMA_VERSION } from '@sonate/schemas';
import logger from '../../utils/logger';

interface ReceiptExportBatch {
  metadata: {
    exported_at: string;
    count: number;
    time_range?: {
      start: string;
      end: string;
    };
    format_version: string;
  };
  receipts: TrustReceipt[];
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'jsonl' | 'csv' | 'splunk' | 'datadog' | 'elastic';

/**
 * Filter options for exporting subset of receipts
 */
export interface ExportFilter {
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by agent DID */
  agentDid?: string;
  /** Filter by human DID */
  humanDid?: string;
  /** Start timestamp (ISO 8601) */
  startTime?: string;
  /** End timestamp (ISO 8601) */
  endTime?: string;
  /** Minimum resonance score (0-1) */
  minResonanceScore?: number;
  /** Maximum truth debt (0-1) */
  maxTruthDebt?: number;
  /** Include only receipts with policy violations */
  policyViolationsOnly?: boolean;
  /** Include only receipts with consent verified */
  consentVerifiedOnly?: boolean;
  /** Tags to filter by */
  tags?: string[];
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Limit number of receipts */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * ReceiptExporterService
 * 
 * Exports receipts in various formats for different systems
 */
export class ReceiptExporterService {
  /**
   * Apply filters to receipts
   */
  private applyFilters(receipts: TrustReceipt[], filters: ExportFilter): TrustReceipt[] {
    return receipts.filter(receipt => {
      // Session filter
      if (filters.sessionId && receipt.session_id !== filters.sessionId) {
        return false;
      }

      // Agent DID filter
      if (filters.agentDid && receipt.agent_did !== filters.agentDid) {
        return false;
      }

      // Human DID filter
      if (filters.humanDid && receipt.human_did !== filters.humanDid) {
        return false;
      }

      // Time range filters
      if (filters.startTime && receipt.timestamp < filters.startTime) {
        return false;
      }
      if (filters.endTime && receipt.timestamp > filters.endTime) {
        return false;
      }

      // Resonance score filter
      if (filters.minResonanceScore !== undefined) {
        const score = receipt.telemetry?.resonance_score ?? 0;
        if (score < filters.minResonanceScore) {
          return false;
        }
      }

      // Truth debt filter
      if (filters.maxTruthDebt !== undefined) {
        const debt = receipt.telemetry?.truth_debt ?? 0;
        if (debt > filters.maxTruthDebt) {
          return false;
        }
      }

      // Policy violations filter
      if (filters.policyViolationsOnly) {
        const hasViolations = (receipt.policy_state?.violations?.length ?? 0) > 0;
        if (!hasViolations) {
          return false;
        }
      }

      // Consent verified filter
      if (filters.consentVerifiedOnly) {
        if (!receipt.policy_state?.consent_verified) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const receiptTags = receipt.metadata?.tags ?? [];
        const hasMatchingTag = filters.tags.some(tag => receiptTags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply pagination
   */
  private applyPagination(
    receipts: TrustReceipt[],
    options?: PaginationOptions
  ): TrustReceipt[] {
    if (!options) {
      return receipts;
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? receipts.length;

    return receipts.slice(offset, offset + limit);
  }

  /**
   * Export as JSON (single file)
   */
  exportAsJson(
    receipts: TrustReceipt[],
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    try {
      let filtered = receipts;

      if (filters) {
        filtered = this.applyFilters(receipts, filters);
      }

      const paginated = this.applyPagination(filtered, pagination);

      const batch: ReceiptExportBatch = {
        metadata: {
          exported_at: new Date().toISOString(),
          count: paginated.length,
          time_range:
            filters?.startTime || filters?.endTime
              ? {
                  start: filters.startTime ?? new Date(0).toISOString(),
                  end: filters.endTime ?? new Date().toISOString(),
                }
              : undefined,
          format_version: '1.0.0',
        },
        receipts: paginated,
      };

      return JSON.stringify(batch, null, 2);
    } catch (err) {
      logger.error('JSON export failed', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('JSON export failed');
    }
  }

  /**
   * Export as JSONL (one receipt per line)
   */
  exportAsJsonL(
    receipts: TrustReceipt[],
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    try {
      let filtered = receipts;

      if (filters) {
        filtered = this.applyFilters(receipts, filters);
      }

      const paginated = this.applyPagination(filtered, pagination);

      // Add metadata as first line
      const metadata: ReceiptExportBatch['metadata'] = {
        exported_at: new Date().toISOString(),
        count: paginated.length,
        format_version: '1.0.0',
      };

      const lines = [JSON.stringify(metadata), ...paginated.map(r => JSON.stringify(r))];
      return lines.join('\n');
    } catch (err) {
      logger.error('JSONL export failed', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('JSONL export failed');
    }
  }

  /**
   * Export as CSV
   */
  exportAsCsv(
    receipts: TrustReceipt[],
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    try {
      let filtered = receipts;

      if (filters) {
        filtered = this.applyFilters(receipts, filters);
      }

      const paginated = this.applyPagination(filtered, pagination);

      // CSV headers
      const headers = [
        'receipt_id',
        'timestamp',
        'session_id',
        'agent_did',
        'human_did',
        'mode',
        'model',
        'provider',
        'resonance_score',
        'bedau_index',
        'coherence_score',
        'truth_debt',
        'volatility',
        'policy_violations',
        'consent_verified',
        'override_available',
        'tags',
      ];

      // CSV rows
      const rows = paginated.map(receipt => [
        receipt.id,
        receipt.timestamp,
        receipt.session_id,
        receipt.agent_did,
        receipt.human_did,
        receipt.mode,
        receipt.interaction.model,
        receipt.interaction.provider ?? 'unknown',
        receipt.telemetry?.resonance_score ?? '',
        receipt.telemetry?.bedau_index ?? '',
        receipt.telemetry?.coherence_score ?? '',
        receipt.telemetry?.truth_debt ?? '',
        receipt.telemetry?.volatility ?? '',
        (receipt.policy_state?.violations?.length ?? 0).toString(),
        receipt.policy_state?.consent_verified ?? false ? 'true' : 'false',
        receipt.policy_state?.override_available ?? false ? 'true' : 'false',
        (receipt.metadata?.tags ?? []).join(';'),
      ]);

      // Escape CSV values
      const escapeCsvValue = (value: string | number): string => {
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvLines = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(',')),
      ];

      return csvLines.join('\n');
    } catch (err) {
      logger.error('CSV export failed', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('CSV export failed');
    }
  }

  /**
   * Export in Splunk format
   */
  exportAsSplunk(
    receipts: TrustReceipt[],
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    try {
      let filtered = receipts;

      if (filters) {
        filtered = this.applyFilters(receipts, filters);
      }

      const paginated = this.applyPagination(filtered, pagination);

      // Splunk format: key=value pairs, one receipt per line
      const lines = paginated.map(receipt => {
        const pairs = [
          `event_type=trust_receipt`,
          `receipt_id=${receipt.id}`,
          `timestamp=${receipt.timestamp}`,
          `agent_did=${receipt.agent_did}`,
          `human_did=${receipt.human_did}`,
          `model=${receipt.interaction.model}`,
          `resonance_score=${receipt.telemetry?.resonance_score ?? 0}`,
          `truth_debt=${receipt.telemetry?.truth_debt ?? 0}`,
          `policy_violations=${receipt.policy_state?.violations?.length ?? 0}`,
          `consent_verified=${receipt.policy_state?.consent_verified ?? false}`,
          `raw_data=${JSON.stringify(receipt).replace(/=/g, '\\=')}`,
        ];
        return pairs.join(' ');
      });

      return lines.join('\n');
    } catch (err) {
      logger.error('Splunk export failed', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('Splunk export failed');
    }
  }

  /**
   * Export in Datadog format
   */
  exportAsDatadog(
    receipts: TrustReceipt[],
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    try {
      let filtered = receipts;

      if (filters) {
        filtered = this.applyFilters(receipts, filters);
      }

      const paginated = this.applyPagination(filtered, pagination);

      // Datadog format: JSON with tags
      const lines = paginated.map(receipt => ({
        timestamp: new Date(receipt.timestamp).getTime(),
        host: 'sonate-platform',
        service: 'trust-engine',
        ddsource: 'trust-receipt',
        ddtags: [
          `agent:${receipt.agent_did}`,
          `session:${receipt.session_id}`,
          `mode:${receipt.mode}`,
          `model:${receipt.interaction.model}`,
        ].join(','),
        message: JSON.stringify({
          receipt_id: receipt.id,
          resonance_score: receipt.telemetry?.resonance_score,
          truth_debt: receipt.telemetry?.truth_debt,
          policy_violations: receipt.policy_state?.violations?.length ?? 0,
        }),
      }));

      return lines.map(line => JSON.stringify(line)).join('\n');
    } catch (err) {
      logger.error('Datadog export failed', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('Datadog export failed');
    }
  }

  /**
   * Export in Elastic format
   */
  exportAsElastic(
    receipts: TrustReceipt[],
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    try {
      let filtered = receipts;

      if (filters) {
        filtered = this.applyFilters(receipts, filters);
      }

      const paginated = this.applyPagination(filtered, pagination);

      // Elastic format: newline-delimited JSON with index metadata
      const lines: string[] = [];

      paginated.forEach((receipt, index) => {
        // Add index metadata line
        lines.push(
          JSON.stringify({
            index: {
              _index: `trust-receipts-${new Date(receipt.timestamp).toISOString().split('T')[0]}`,
              _id: receipt.id,
            },
          })
        );

        // Add document line
        lines.push(
          JSON.stringify({
            timestamp: receipt.timestamp,
            receipt_id: receipt.id,
            session_id: receipt.session_id,
            agent_did: receipt.agent_did,
            human_did: receipt.human_did,
            mode: receipt.mode,
            interaction: {
              model: receipt.interaction.model,
              provider: receipt.interaction.provider,
              prompt_length: receipt.interaction.prompt.length,
              response_length: receipt.interaction.response.length,
            },
            telemetry: receipt.telemetry,
            policy_state: receipt.policy_state,
            tags: receipt.metadata?.tags ?? [],
          })
        );
      });

      return lines.join('\n');
    } catch (err) {
      logger.error('Elastic export failed', { error: err instanceof Error ? err.message : String(err) });
      throw new Error('Elastic export failed');
    }
  }

  /**
   * Export in requested format
   */
  export(
    receipts: TrustReceipt[],
    format: ExportFormat,
    filters?: ExportFilter,
    pagination?: PaginationOptions
  ): string {
    logger.info('Exporting receipts', {
      format,
      count: receipts.length,
      with_filters: !!filters,
    });

    switch (format) {
      case 'json':
        return this.exportAsJson(receipts, filters, pagination);
      case 'jsonl':
        return this.exportAsJsonL(receipts, filters, pagination);
      case 'csv':
        return this.exportAsCsv(receipts, filters, pagination);
      case 'splunk':
        return this.exportAsSplunk(receipts, filters, pagination);
      case 'datadog':
        return this.exportAsDatadog(receipts, filters, pagination);
      case 'elastic':
        return this.exportAsElastic(receipts, filters, pagination);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get file extension for format
   */
  getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      json: 'json',
      jsonl: 'jsonl',
      csv: 'csv',
      splunk: 'txt',
      datadog: 'jsonl',
      elastic: 'ndjson',
    };
    return extensions[format] || 'txt';
  }

  /**
   * Get MIME type for format
   */
  getMimeType(format: ExportFormat): string {
    const types: Record<ExportFormat, string> = {
      json: 'application/json',
      jsonl: 'application/x-ndjson',
      csv: 'text/csv',
      splunk: 'text/plain',
      datadog: 'application/x-ndjson',
      elastic: 'application/x-ndjson',
    };
    return types[format] || 'text/plain';
  }
}

/**
 * Singleton instance
 */
let singletonInstance: ReceiptExporterService | null = null;

export function getReceiptExporter(): ReceiptExporterService {
  if (!singletonInstance) {
    singletonInstance = new ReceiptExporterService();
  }
  return singletonInstance;
}

export default ReceiptExporterService;
