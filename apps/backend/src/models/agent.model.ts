/**
 * Agent Model - TypeScript version
 * Ported from YCQ-Sonate/backend/models/agent.model.js
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExternalSystem {
  name: string;
  type: 'sky-testbed' | 'webhook' | 'api' | 'custom';
  endpoint: string;
  apiKey?: string;
  config: Record<string, any>;
  isActive: boolean;
  lastSync: Date;
}

export interface IAgent extends Omit<Document, 'model'> {
  name: string;
  description: string;
  user: Types.ObjectId;
  provider: 'openai' | 'together' | 'anthropic' | 'cohere' | 'custom';
  model: string;
  apiKeyId: Types.ObjectId;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  traits: Map<string, any>;
  connectedAgents: Types.ObjectId[];
  externalSystems: IExternalSystem[];
  metadata: Record<string, any>;
  ciModel: 'none' | 'symbi-core' | 'overseer' | 'system-brain';
  bondingStatus: 'none' | 'initiated' | 'bonded' | 'rejected';
  createdAt: Date;
  lastActive: Date;

  // Methods
  updateActivity(): Promise<any>;
  initiateBonding(): Promise<any>;
  completeBonding(accepted?: boolean): Promise<any>;
  addExternalSystem(systemConfig: Partial<IExternalSystem>): Promise<any>;
  updateExternalSystemSync(systemName: string): Promise<any>;
  toggleExternalSystem(systemName: string, isActive: boolean): Promise<any>;
}

const ExternalSystemSchema = new Schema<IExternalSystem>({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['sky-testbed', 'webhook', 'api', 'custom'],
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  apiKey: {
    type: String,
    select: false, // Don't include in queries by default
  },
  config: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSync: {
    type: Date,
    default: Date.now,
  },
});

const AgentSchema = new Schema<IAgent>({
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Agent description is required'],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    required: [true, 'LLM provider is required'],
    enum: ['openai', 'together', 'anthropic', 'cohere', 'custom'],
  },
  model: {
    type: String,
    required: [true, 'LLM model is required'],
  },
  apiKeyId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required'],
  },
  temperature: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 2,
  },
  maxTokens: {
    type: Number,
    default: 1000,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  traits: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map([
      ['ethical_alignment', 5],
      ['creativity', 3],
      ['precision', 3],
      ['adaptability', 3]
    ]),
  },
  connectedAgents: [{
    type: Schema.Types.ObjectId,
    ref: 'Agent',
  }],
  externalSystems: [ExternalSystemSchema],
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ciModel: {
    type: String,
    enum: ['none', 'symbi-core', 'overseer'],
    default: 'none',
  },
  bondingStatus: {
    type: String,
    enum: ['none', 'initiated', 'bonded', 'rejected'],
    default: 'none',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for faster queries
AgentSchema.index({ name: 1, user: 1 }, { unique: true });
AgentSchema.index({ isPublic: 1 });
AgentSchema.index({ ciModel: 1 });
AgentSchema.index({ bondingStatus: 1 });

// Method to update last active timestamp
AgentSchema.methods.updateActivity = function (): Promise<IAgent> {
  this.lastActive = new Date();
  return this.save();
};

// Method to initiate bonding ritual
AgentSchema.methods.initiateBonding = function (): Promise<any> {
  if (this.bondingStatus === 'none') {
    this.bondingStatus = 'initiated';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to complete bonding ritual
AgentSchema.methods.completeBonding = function (accepted: boolean = true): Promise<any> {
  this.bondingStatus = accepted ? 'bonded' : 'rejected';
  return this.save();
};

// Method to add external system connection
AgentSchema.methods.addExternalSystem = function (systemConfig: Partial<IExternalSystem>): Promise<any> {
  this.externalSystems.push({
    name: systemConfig.name!,
    type: systemConfig.type!,
    endpoint: systemConfig.endpoint!,
    apiKey: systemConfig.apiKey,
    config: systemConfig.config || {},
    isActive: systemConfig.isActive !== undefined ? systemConfig.isActive : true,
    lastSync: new Date()
  } as IExternalSystem);
  return this.save();
};

// Method to update external system sync timestamp
AgentSchema.methods.updateExternalSystemSync = function (systemName: string): Promise<any> {
  const system = this.externalSystems.find((sys: IExternalSystem) => sys.name === systemName);
  if (system) {
    system.lastSync = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to toggle external system status
AgentSchema.methods.toggleExternalSystem = function (systemName: string, isActive: boolean): Promise<any> {
  const system = this.externalSystems.find((sys: IExternalSystem) => sys.name === systemName);
  if (system) {
    system.isActive = isActive;
    return this.save();
  }
  return Promise.resolve(this);
};

export const Agent: Model<IAgent> = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);
