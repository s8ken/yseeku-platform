"use strict";
/**
 * Conversation Model - TypeScript version
 * Chat history with trust scores and CI integration
 * Ported from YCQ-Sonate/backend/models/conversation.model.js
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agent',
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
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
const ConversationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Conversation title is required'],
        trim: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    messages: [MessageSchema],
    agents: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
// Method to export conversation to IPFS (placeholder for future implementation)
ConversationSchema.methods.exportToIPFS = async function () {
    // This would be implemented with actual IPFS integration
    // For now, generate a placeholder hash
    return {
        success: true,
        hash: `ipfs-${this._id}-${Date.now()}`,
        timestamp: new Date(),
    };
};
// Method to calculate ethical score based on message trust scores
ConversationSchema.methods.calculateEthicalScore = async function () {
    const messageCount = this.messages.length;
    if (messageCount === 0) {
        this.ethicalScore = 5;
        return this.save();
    }
    // Calculate average trust score from all messages
    const trustScoreSum = this.messages.reduce((sum, msg) => sum + (msg.trustScore || 5), 0);
    // Normalize to 0-5 scale
    this.ethicalScore = Math.min(5, Math.max(0, trustScoreSum / messageCount));
    return this.save();
};
exports.Conversation = mongoose_1.default.models.Conversation || mongoose_1.default.model('Conversation', ConversationSchema);
