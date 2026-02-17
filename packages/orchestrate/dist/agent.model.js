"use strict";
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
exports.TrustDeclaration = exports.Agent = exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Mock User schema
const UserSchema = new mongoose_1.Schema({
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
exports.UserModel = mongoose_1.default.model('User', UserSchema);
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
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        enum: ['openai', 'together', 'anthropic', 'gemini', 'cohere', 'custom', 'perplexity', 'v0'],
    },
    model: {
        type: String,
        required: [true, 'LLM model is required'],
    },
    apiKeyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        of: mongoose_1.default.Schema.Types.Mixed,
        default: new Map([
            ['ethical_alignment', 5],
            ['creativity', 3],
            ['precision', 3],
            ['adaptability', 3],
        ]),
    },
    connectedAgents: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
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
                type: mongoose_1.default.Schema.Types.Mixed,
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
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
    ciModel: {
        type: String,
        enum: ['none', 'sonate-core', 'overseer'],
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
AgentSchema.methods.addExternalSystem = function (systemConfig) {
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
exports.Agent = mongoose_1.default.model('Agent', AgentSchema);
// Trust Declaration Schema
const TrustDeclarationSchema = new mongoose_1.Schema({
    agent_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Agent', required: true },
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
        credentialSubject: mongoose_1.default.Schema.Types.Mixed,
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
            changes: mongoose_1.default.Schema.Types.Mixed,
            notes: String,
        },
    ],
    tenantId: { type: String, index: true },
});
exports.TrustDeclaration = mongoose_1.default.model('TrustDeclaration', TrustDeclarationSchema);
exports.default = exports.Agent;
