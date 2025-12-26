import mongoose, { Schema, Document } from 'mongoose';

const AgentSchema = new Schema({
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
      ['adaptability', 3]
    ]),
  },
  connectedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
  }],
  externalSystems: [{
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
  }],
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
AgentSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  return this.save();
};

// Method to initiate bonding ritual
AgentSchema.methods.initiateBonding = function() {
  if (this.bondingStatus === 'none') {
    this.bondingStatus = 'initiated';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to complete bonding ritual
AgentSchema.methods.completeBonding = function(accepted = true) {
  this.bondingStatus = accepted ? 'bonded' : 'rejected';
  return this.save();
};

// Method to add external system connection
AgentSchema.methods.addExternalSystem = function(systemConfig) {
  this.externalSystems.push({
    name: systemConfig.name,
    type: systemConfig.type,
    endpoint: systemConfig.endpoint,
    apiKey: systemConfig.apiKey,
    config: systemConfig.config || {},
    isActive: systemConfig.isActive !== undefined ? systemConfig.isActive : true,
    lastSync: new Date()
  });
  return this.save();
};

// Method to update external system sync timestamp
AgentSchema.methods.updateExternalSystemSync = function(systemName) {
  const system = this.externalSystems.find(sys => sys.name === systemName);
  if (system) {
    system.lastSync = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to toggle external system status
AgentSchema.methods.toggleExternalSystem = function(systemName, isActive) {
  const system = this.externalSystems.find(sys => sys.name === systemName);
  if (system) {
    system.isActive = isActive;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Agent', AgentSchema);
