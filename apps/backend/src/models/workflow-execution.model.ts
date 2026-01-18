import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkflowTaskResult {
  stepId: string;
  agentId?: Types.ObjectId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input: any;
  output: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  trustScore?: number; // Score of the output if validated
}

export interface IWorkflowExecution extends Document {
  workflowId: Types.ObjectId;
  tenantId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input: any; // Initial input for the workflow
  results: IWorkflowTaskResult[]; // Results for each step
  currentStepId?: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

const WorkflowTaskResultSchema = new Schema({
  stepId: { type: String, required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
  input: { type: Schema.Types.Mixed },
  output: { type: Schema.Types.Mixed },
  error: { type: String },
  startTime: { type: Date },
  endTime: { type: Date },
  trustScore: { type: Number }
});

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>({
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  tenantId: { type: String, required: true, index: true },
  status: { type: String, enum: ['running', 'completed', 'failed', 'cancelled'], default: 'running' },
  input: { type: Schema.Types.Mixed },
  results: [WorkflowTaskResultSchema],
  currentStepId: { type: String },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  error: { type: String }
});

export const WorkflowExecution = mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);
