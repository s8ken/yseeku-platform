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
exports.AlertModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AlertSchema = new mongoose_1.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    type: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['critical', 'error', 'warning', 'info'],
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved', 'suppressed'],
        default: 'active',
        index: true,
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    acknowledgedBy: String,
    acknowledgedAt: Date,
    resolvedBy: String,
    resolvedAt: Date,
    userId: {
        type: String,
        index: true,
    },
    agentId: {
        type: String,
        index: true,
    },
    conversationId: {
        type: String,
        index: true,
    },
    tenantId: {
        type: String,
        required: true,
        index: true,
        default: 'default',
    },
});
// Compound indexes for common queries
AlertSchema.index({ tenantId: 1, status: 1, timestamp: -1 });
AlertSchema.index({ tenantId: 1, severity: 1, status: 1 });
AlertSchema.index({ tenantId: 1, type: 1, timestamp: -1 });
exports.AlertModel = mongoose_1.default.models.Alert || mongoose_1.default.model('Alert', AlertSchema);
