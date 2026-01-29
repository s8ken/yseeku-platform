"use strict";
/**
 * Agent Model - TypeScript version
 * Ported from YCQ-Sonate/backend/models/agent.model.js
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
exports.Agent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExternalSystemSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
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
const AgentSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        of: mongoose_1.Schema.Types.Mixed,
        default: new Map([
            ['ethical_alignment', 5],
            ['creativity', 3],
            ['precision', 3],
            ['adaptability', 3]
        ]),
    },
    connectedAgents: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Agent',
        }],
    externalSystems: [ExternalSystemSchema],
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    ciModel: {
        type: String,
        enum: ['none', 'sonate-core', 'overseer', 'system-brain'],
        default: 'none',
    },
    bondingStatus: {
        type: String,
        enum: ['none', 'initiated', 'bonded', 'rejected'],
        default: 'none',
    },
    banStatus: {
        type: String,
        enum: ['active', 'banned', 'restricted', 'quarantined'],
        default: 'active',
        index: true,
    },
    banReason: {
        type: String,
    },
    banDetails: {
        bannedAt: Date,
        bannedBy: String,
        reason: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
        },
        expiresAt: Date,
        restrictions: [String],
    },
    restrictedFeatures: [{
            type: String,
        }],
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
AgentSchema.methods.addExternalSystem = function (systemConfig) {
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
AgentSchema.methods.updateExternalSystemSync = function (systemName) {
    const system = this.externalSystems.find((sys) => sys.name === systemName);
    if (system) {
        system.lastSync = new Date();
        return this.save();
    }
    return Promise.resolve(this);
};
// Method to toggle external system status
AgentSchema.methods.toggleExternalSystem = function (systemName, isActive) {
    const system = this.externalSystems.find((sys) => sys.name === systemName);
    if (system) {
        system.isActive = isActive;
        return this.save();
    }
    return Promise.resolve(this);
};
// Method to ban an agent
AgentSchema.methods.ban = function (bannedBy, reason, severity, expiresAt) {
    this.banStatus = 'banned';
    this.banReason = reason;
    this.banDetails = {
        bannedAt: new Date(),
        bannedBy,
        reason,
        severity,
        expiresAt,
    };
    return this.save();
};
// Method to restrict an agent with specific feature limitations
AgentSchema.methods.restrict = function (restrictions, reason) {
    this.banStatus = 'restricted';
    this.banReason = reason;
    this.restrictedFeatures = restrictions;
    this.banDetails = {
        bannedAt: new Date(),
        bannedBy: 'system',
        reason,
        severity: 'medium',
        restrictions,
    };
    return this.save();
};
// Method to quarantine an agent for investigation
AgentSchema.methods.quarantine = function (reason) {
    this.banStatus = 'quarantined';
    this.banReason = reason;
    this.banDetails = {
        bannedAt: new Date(),
        bannedBy: 'system',
        reason,
        severity: 'high',
    };
    return this.save();
};
// Method to unban/restore an agent
AgentSchema.methods.unban = function () {
    this.banStatus = 'active';
    this.banReason = undefined;
    this.banDetails = undefined;
    this.restrictedFeatures = [];
    return this.save();
};
// Virtual field for DID - computed from _id
const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'yseeku.com';
AgentSchema.virtual('did').get(function () {
    return `did:web:${PLATFORM_DOMAIN}:agents:${this._id}`;
});
AgentSchema.virtual('didDocument').get(function () {
    return `https://${PLATFORM_DOMAIN}/.well-known/did/agents/${this._id}/did.json`;
});
// Ensure virtuals are included in JSON output
AgentSchema.set('toJSON', { virtuals: true });
AgentSchema.set('toObject', { virtuals: true });
exports.Agent = mongoose_1.default.models.Agent || mongoose_1.default.model('Agent', AgentSchema);
