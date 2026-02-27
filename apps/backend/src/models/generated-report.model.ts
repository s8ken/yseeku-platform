/**
 * Generated Report Model
 *
 * Persists compliance reports so they can be retrieved, compared over time,
 * and downloaded on demand — backing the report history and scheduled
 * report features.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneratedReport extends Document {
  reportId: string;           // Unique identifier (also used as filename reference)
  type: string;               // 'trust_summary' | 'sonate_compliance' | etc.
  format: string;             // 'json' | 'html' | 'csv'
  tenantId: string;
  generatedBy?: string;       // userId of requestor (undefined = system/scheduled)
  startDate: Date;
  endDate: Date;
  summary: {
    totalConversations?: number;
    avgTrustScore?: number;
    complianceRate?: number;
    status?: string;          // e.g. 'compliant' | 'partial' | 'non-compliant'
  };
  // Full report payload stored as JSON for retrieval (HTML/CSV stored as string)
  payload: any;
  sizeBytes: number;
  generatedAt: Date;
}

const GeneratedReportSchema = new Schema<IGeneratedReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    format: { type: String, required: true, default: 'json' },
    tenantId: { type: String, required: true, index: true },
    generatedBy: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    summary: {
      totalConversations: Number,
      avgTrustScore: Number,
      complianceRate: Number,
      status: String,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    sizeBytes: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    collection: 'generated_reports',
  }
);

// Compound index for tenant history queries
GeneratedReportSchema.index({ tenantId: 1, generatedAt: -1 });
GeneratedReportSchema.index({ tenantId: 1, type: 1, generatedAt: -1 });

// TTL — auto-purge reports older than 1 year to manage storage
GeneratedReportSchema.index(
  { generatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 }
);

export const GeneratedReport = mongoose.model<IGeneratedReport>(
  'GeneratedReport',
  GeneratedReportSchema
);
