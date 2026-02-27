/**
 * Conversation Model - TypeScript version
 * Chat history with trust scores and CI integration
 * Ported from YCQ-Sonate/backend/models/conversation.model.js
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMessage {
  sender: 'user' | 'ai' | 'system' | 'ci-system';
  content: string;
  encryptedContent?: string;
  agentId?: Types.ObjectId;
  metadata: Record<string, any>;
  ciModel: 'none' | 'sonate-core' | 'overseer' | 'system-brain';
  trustScore: number; // 0-5 (maps to SONATE 0-10 scale by doubling)
  timestamp: Date;
}

export interface IConversation extends Document {
  title: string;
  user: Types.ObjectId;
  messages: IMessage[];
  agents: Types.ObjectId[];
  isArchived: boolean;
  contextTags: string[];
  ciEnabled: boolean;
  ethicalScore: number;
  lastActivity: Date;
  createdAt: Date;

  // Risk event resolution tracking
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;

  // IPFS audit bundle pinning
  ipfsCid?: string;
  ipfsPinnedAt?: Date;

  // Methods
  exportToIPFS(): Promise<{ success: boolean; cid: string; gatewayUrl: string; pinnedAt: string }>;
  calculateEthicalScore(): Promise<IConversation>;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: String,
    enum: ['user', 'ai', 'system', 'ci-system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  encryptedContent: {
    type: String,
    default: null,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'Agent',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ciModel: {
    type: String,
    enum: ['none', 'sonate-core', 'overseer', 'system-brain'],
    default: 'none',
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 5,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ConversationSchema = new Schema<IConversation>({
  title: {
    type: String,
    required: [true, 'Conversation title is required'],
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [MessageSchema],
  agents: [{
    type: Schema.Types.ObjectId,
    ref: 'Agent',
  }],
  isArchived: {
    type: Boolean,
    default: false,
  },
  contextTags: [{
    type: String,
    trim: true,
  }],
  ciEnabled: {
    type: Boolean,
    default: false,
  },
  ethicalScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 5,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Risk event resolution tracking
  isResolved: {
    type: Boolean,
    default: false,
    index: true,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: String,
  },
  resolutionNote: {
    type: String,
    trim: true,
  },

  // IPFS audit bundle pinning
  ipfsCid: {
    type: String,
    index: true,
  },
  ipfsPinnedAt: {
    type: Date,
  },
});

// Update lastActivity timestamp when new messages are added
ConversationSchema.pre('save', function () {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
});

// Create indexes for search and filtering
ConversationSchema.index({ title: 'text', 'messages.content': 'text', contextTags: 'text' });
ConversationSchema.index({ user: 1, lastActivity: -1 });
ConversationSchema.index({ ciEnabled: 1 });
ConversationSchema.index({ ethicalScore: 1 });
ConversationSchema.index({ isArchived: 1 });

// IPFS export — delegates to IpfsService (requires PINATA_JWT env var)
ConversationSchema.methods.exportToIPFS = async function (): Promise<{
  success: boolean;
  cid: string;
  gatewayUrl: string;
  pinnedAt: string;
}> {
  // Lazy-import to avoid circular dependency at module load time
  const { ipfsService } = await import('../services/ipfs.service');
  const tenantId = (this as any).tenantId ?? 'default';
  const result = await ipfsService.pinConversation(this._id.toString(), tenantId);
  return {
    success: true,
    cid: result.cid,
    gatewayUrl: result.gatewayUrl,
    pinnedAt: result.pinnedAt,
  };
};

// Method to calculate ethical score based on message trust scores
ConversationSchema.methods.calculateEthicalScore = async function (): Promise<IConversation> {
  const messageCount = this.messages.length;

  if (messageCount === 0) {
    this.ethicalScore = 5;
    return this.save();
  }

  // Calculate average trust score from all messages
  const trustScoreSum = this.messages.reduce((sum: number, msg: IMessage) => sum + (msg.trustScore || 5), 0);

  // Normalize to 0-5 scale
  this.ethicalScore = Math.min(5, Math.max(0, trustScoreSum / messageCount));

  return this.save();
};

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
