/**
 * Experiment Model
 * A/B testing experiments for platform optimization and trust protocol tuning
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IVariant {
  name: string;
  description: string;
  parameters: Record<string, any>;
  sampleSize: number;
  successCount: number;
  failureCount: number;
  avgScore: number;
  sumScores: number;
  sumSquaredScores: number;
}

export interface IExperiment extends Document {
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  type: 'ab_test' | 'multivariate' | 'sequential' | 'bayesian';
  variants: IVariant[];
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  targetSampleSize: number;
  currentSampleSize: number;
  progress: number;
  metrics: {
    pValue?: number;
    effectSize?: number;
    confidenceInterval?: { lower: number; upper: number };
    significant: boolean;
    minimumDetectableEffect?: number;
  };
  tenantId: string;
  createdBy: string;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  parameters: {
    type: Schema.Types.Mixed,
    default: {},
  },
  sampleSize: {
    type: Number,
    default: 0,
  },
  successCount: {
    type: Number,
    default: 0,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
  avgScore: {
    type: Number,
    default: 0,
  },
  sumScores: {
    type: Number,
    default: 0,
  },
  sumSquaredScores: {
    type: Number,
    default: 0,
  },
});

const ExperimentSchema = new Schema<IExperiment>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  hypothesis: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'archived'],
    default: 'draft',
    index: true,
  },
  type: {
    type: String,
    enum: ['ab_test', 'multivariate', 'sequential', 'bayesian'],
    default: 'ab_test',
  },
  variants: {
    type: [VariantSchema],
    required: true,
    validate: {
      validator: function(v: IVariant[]) {
        return v.length >= 2;
      },
      message: 'Experiment must have at least 2 variants (control + treatment)',
    },
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  pausedAt: {
    type: Date,
  },
  targetSampleSize: {
    type: Number,
    required: true,
    min: 100,
    default: 1000,
  },
  currentSampleSize: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  metrics: {
    pValue: { type: Number },
    effectSize: { type: Number },
    confidenceInterval: {
      lower: { type: Number },
      upper: { type: Number },
    },
    significant: { type: Boolean, default: false },
    minimumDetectableEffect: { type: Number },
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  notes: {
    type: String,
    default: '',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  collection: 'experiments',
});

// Compound indexes for common queries
ExperimentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
ExperimentSchema.index({ tenantId: 1, createdBy: 1, createdAt: -1 });
ExperimentSchema.index({ tenantId: 1, tags: 1 });

// Update progress when sample size changes
ExperimentSchema.pre('save', function(next) {
  if (this.targetSampleSize > 0) {
    this.progress = Math.min(100, Math.round((this.currentSampleSize / this.targetSampleSize) * 100));
  }
  next();
});

export const Experiment = mongoose.model<IExperiment>('Experiment', ExperimentSchema);
