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
exports.PlatformApiKey = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlatformApiKeySchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    keyHash: {
        type: String,
        required: true,
        select: false, // Don't return by default
    },
    prefix: {
        type: String,
        required: true,
    },
    scopes: {
        type: [String],
        default: ['read:all'],
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired'],
        default: 'active',
    },
    lastUsed: Date,
    expiresAt: Date,
    requests24h: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
// Update timestamps on save
PlatformApiKeySchema.pre('save', function () {
    this.updatedAt = new Date();
});
exports.PlatformApiKey = mongoose_1.default.model('PlatformApiKey', PlatformApiKeySchema);
