import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkflowStep {
  id: string;
  name: string;
  type: 'llm' | 'function' | 'human_review';
  agentId?: Types.ObjectId;
  role?: 'coordinator' | 'executor' | 'validator' | 'observer';
  inputTemplate: string; // e.g., "Analyze the following: {{input}}"
  dependencies: string[]; // IDs of steps that must complete first
  requiredCapabilities?: string[];
  retryCount?: number;
}

export interface IWorkflow extends Document {
  name: string;
  description: string;
  tenantId: string;
  steps: IWorkflowStep[];
  status: 'active' | 'draft' | 'archived';
  triggers: {
    type: 'manual' | 'webhook' | 'schedule';
    config?: any;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['llm', 'function', 'human_review'], default: 'llm' },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  role: { type: String, enum: ['coordinator', 'executor', 'validator', 'observer'] },
  inputTemplate: { type: String, default: '' },
  dependencies: [{ type: String }],
  requiredCapabilities: [{ type: String }],
  retryCount: { type: Number, default: 0 }
});

const WorkflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true },
  description: { type: String },
  tenantId: { type: String, required: true, index: true },
  steps: [WorkflowStepSchema],
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft' },
  triggers: [{
    type: { type: String, enum: ['manual', 'webhook', 'schedule'], default: 'manual' },
    config: { type: Schema.Types.Mixed }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

WorkflowSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
