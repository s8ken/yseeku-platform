import mongoose, { Schema, Document } from 'mongoose';

import { TrustDeclaration as ITrustDeclaration } from './agent-types-enhanced';

export interface ApiKey {
  _id?: mongoose.Types.ObjectId | string;
  provider: string;
  key: string;
  isActive: boolean;
}

// User interface for the missing User model
export interface User extends Document {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  apiKeys: ApiKey[];
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock User schema
const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' },
  permissions: [{ type: String }],
  apiKeys: [
    {
      provider: { type: String, required: true },
      key: { type: String, select: false, required: true },
      isActive: { type: Boolean, default: true },
    },
  ],
  tenantId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<User>('User', UserSchema);

export interface AgentModelInterface {
  name: string;
  description: string;
  user: mongoose.Types.ObjectId | string;
  tenantId?: string;
  provider: 'openai' | 'together' | 'anthropic' | 'cohere' | 'custom' | 'perplexity' | 'v0';
  model: string;
  apiKeyId: mongoose.Types.ObjectId | string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
  traits: Map<string, any>;
  connectedAgents: (mongoose.Types.ObjectId | string)[];
  externalSystems: {
    name: string;
    type: 'sky-testbed' | 'webhook' | 'api' | 'custom';
    endpoint: string;
    apiKey?: string;
    config?: any;
    isActive: boolean;
    lastSync: Date;
  }[];
  metadata: Record<string, any>;
  ciModel: 'none' | 'symbi-core' | 'overseer';
  bondingStatus: 'none' | 'initiated' | 'bonded' | 'rejected';
  createdAt: Date;
  lastActive: Date;
}

export interface IAgentMethods {
  updateActivity(): Promise<IAgentDocument>;
  initiateBonding(): Promise<IAgentDocument>;
  completeBonding(accepted?: boolean): Promise<IAgentDocument>;
  addExternalSystem(systemConfig: any): Promise<IAgentDocument>;
  updateExternalSystemSync(systemName: string): Promise<IAgentDocument>;
  toggleExternalSystem(systemName: string, isActive: boolean): Promise<IAgentDocument>;
}

export interface IAgentDocument
  extends AgentModelInterface,
    IAgentMethods,
    Omit<Document, 'model'> {
  _id: mongoose.Types.ObjectId;
}

const AgentSchema = new Schema<IAgentDocument, mongoose.Model<IAgentDocument>>({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenantId: {
    type: String,
    index: true,
  },
  provider: {
    type: String,
    required: [true, 'LLM provider is required'],
    enum: ['openai', 'together', 'anthropic', 'cohere', 'custom', 'perplexity', 'v0'],
  },
  model: {
    type: String,
    required: [true, 'LLM model is required'],
  },
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
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
    of: mongoose.Schema.Types.Mixed,
    default: new Map([
      ['ethical_alignment', 5],
      ['creativity', 3],
      ['precision', 3],
      ['adaptability', 3],
    ]),
  },
  connectedAgents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
  ],
  externalSystems: [
    {
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
        type: mongoose.Schema.Types.Mixed,
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
    },
  ],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
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
AgentSchema.methods.updateActivity = function () {
  this.lastActive = new Date();
  return this.save();
};

// Method to initiate bonding ritual
AgentSchema.methods.initiateBonding = function () {
  if (this.bondingStatus === 'none') {
    this.bondingStatus = 'initiated';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to complete bonding ritual
AgentSchema.methods.completeBonding = function (accepted = true) {
  this.bondingStatus = accepted ? 'bonded' : 'rejected';
  return this.save();
};

// Method to add external system connection
AgentSchema.methods.addExternalSystem = function (systemConfig: any) {
  this.externalSystems.push({
    name: systemConfig.name,
    type: systemConfig.type,
    endpoint: systemConfig.endpoint,
    apiKey: systemConfig.apiKey,
    config: systemConfig.config || {},
    isActive: systemConfig.isActive !== undefined ? systemConfig.isActive : true,
    lastSync: new Date(),
  });
  return this.save();
};

// Method to update external system sync timestamp
AgentSchema.methods.updateExternalSystemSync = function (systemName: string) {
  const system = this.externalSystems.find((sys: any) => sys.name === systemName);
  if (system) {
    system.lastSync = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to toggle external system status
AgentSchema.methods.toggleExternalSystem = function (systemName: string, isActive: boolean) {
  const system = this.externalSystems.find((sys: any) => sys.name === systemName);
  if (system) {
    system.isActive = isActive;
    return this.save();
  }
  return Promise.resolve(this);
};

export const Agent = mongoose.model<IAgentDocument>('Agent', AgentSchema);

// Trust Declaration Schema
const TrustDeclarationSchema = new Schema({
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  agent_name: { type: String, required: true },
  declaration_date: { type: Date, default: Date.now },
  trust_articles: {
    inspection_mandate: { type: Boolean, default: false },
    consent_architecture: { type: Boolean, default: false },
    ethical_override: { type: Boolean, default: false },
    continuous_validation: { type: Boolean, default: false },
    right_to_disconnect: { type: Boolean, default: false },
    moral_recognition: { type: Boolean, default: false },
  },
  scores: {
    compliance_score: { type: Number, default: 0 },
    guilt_score: { type: Number, default: 0 },
    confidence_interval: {
      lower: Number,
      upper: Number,
      confidence: Number,
    },
    last_validated: { type: Date, default: Date.now },
  },
  issuer: String,
  verifiable_credential: {
    id: String,
    type: [String],
    issuer: String,
    issuanceDate: String,
    expirationDate: String,
    credentialSubject: mongoose.Schema.Types.Mixed,
    proof: {
      type: { type: String },
      created: String,
      verificationMethod: String,
      proofPurpose: String,
      proofValue: String,
    },
  },
  audit_history: [
    {
      timestamp: { type: Date, default: Date.now },
      action: { type: String, enum: ['created', 'updated', 'audited', 'validated'] },
      user_id: String,
      compliance_score: Number,
      guilt_score: Number,
      changes: mongoose.Schema.Types.Mixed,
      notes: String,
    },
  ],
  tenantId: { type: String, index: true },
});

export interface ITrustDeclarationDocument extends ITrustDeclaration, Document {}

export const TrustDeclaration = mongoose.model<ITrustDeclarationDocument>(
  'TrustDeclaration',
  TrustDeclarationSchema
);

export default Agent;
