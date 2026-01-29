"use strict";
/**
 * User Model - TypeScript version
 * Ported from YCQ-Sonate/backend/models/user.model.js
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const ApiKeySchema = new mongoose_1.Schema({
    provider: {
        type: String,
        required: [true, 'Provider name is required'],
        enum: ['openai', 'together', 'anthropic', 'cohere', 'perplexity', 'v0', 'custom'],
    },
    key: {
        type: String,
        required: [true, 'API key is required'],
    },
    name: {
        type: String,
        required: [true, 'Key name is required'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false,
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'viewer',
    },
    apiKeys: [ApiKeySchema],
    preferences: {
        defaultModel: {
            type: String,
            default: 'gpt-3.5-turbo',
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },
        notifications: {
            type: Boolean,
            default: true,
        },
    },
    // SYMBI Consent tracking for CONSENT_ARCHITECTURE principle
    consent: {
        hasConsentedToAI: {
            type: Boolean,
            default: false,
        },
        consentTimestamp: {
            type: Date,
        },
        consentScope: {
            type: [String],
            default: [],
        },
        canWithdrawAnytime: {
            type: Boolean,
            default: true,
        },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Encrypt password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
// Generate reset password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto_1.default.randomBytes(20).toString('hex');
    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // Set expire
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
};
exports.User = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
