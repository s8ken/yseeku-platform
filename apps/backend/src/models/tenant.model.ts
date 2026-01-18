import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  trustScore: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  complianceStatus: {
    type: String,
    enum: ['compliant', 'warning', 'non-compliant'],
    default: 'compliant',
  },
  trustScore: {
    type: Number,
    default: 85,
    min: 0,
    max: 100,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Create index for faster lookups
TenantSchema.index({ name: 1 });
TenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);
