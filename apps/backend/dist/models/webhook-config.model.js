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
exports.WebhookConfigModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AlertRuleSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    condition: {
        type: { type: String, required: true },
        metric: String,
        operator: String,
        value: mongoose_1.Schema.Types.Mixed,
        pattern: String,
        expression: String,
    },
    cooldownMinutes: { type: Number, default: 5 },
    lastTriggeredAt: Date,
}, { _id: false });
const WebhookConfigSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: String,
    channel: {
        type: String,
        enum: ['webhook', 'slack', 'discord', 'pagerduty', 'email'],
        default: 'webhook',
    },
    // Endpoint
    url: {
        type: String,
        required: true,
    },
    secret: String,
    headers: {
        type: Map,
        of: String,
        default: {},
    },
    // Enabled flag
    enabled: {
        type: Boolean,
        default: true,
    },
    // Filtering
    alertTypes: {
        type: [String],
        default: [],
    },
    eventTypes: {
        type: [String],
        default: [],
    },
    severities: {
        type: [String],
        default: [],
    },
    severityFilter: {
        type: [String],
        enum: ['info', 'warning', 'error', 'critical'],
        default: [],
    },
    // Multiple channels
    channels: {
        type: [String],
        enum: ['webhook', 'slack', 'discord', 'pagerduty', 'email'],
        default: [],
    },
    // Rules
    rules: {
        type: [AlertRuleSchema],
        default: [],
    },
    // Status
    status: {
        type: String,
        enum: ['active', 'paused', 'failed'],
        default: 'active',
    },
    lastSuccess: Date,
    lastFailure: Date,
    failureCount: { type: Number, default: 0 },
    consecutiveFailures: { type: Number, default: 0 },
    // Rate limiting
    maxPerMinute: { type: Number, default: 60 },
    sentThisMinute: { type: Number, default: 0 },
    minuteResetAt: { type: Date, default: Date.now },
    rateLimiting: {
        windowMs: { type: Number, default: 60000 },
        maxRequests: { type: Number, default: 100 },
    },
    // Retry configuration
    retryConfig: {
        maxRetries: { type: Number, default: 3 },
        initialDelayMs: { type: Number, default: 1000 },
        maxDelayMs: { type: Number, default: 30000 },
        backoffMultiplier: { type: Number, default: 2 },
    },
    // Metadata
    createdBy: { type: String, required: true },
}, {
    timestamps: true,
    collection: 'webhook_configs',
});
// Indexes
WebhookConfigSchema.index({ tenantId: 1, status: 1 });
WebhookConfigSchema.index({ tenantId: 1, name: 1 }, { unique: true });
exports.WebhookConfigModel = mongoose_1.default.models.WebhookConfig || mongoose_1.default.model('WebhookConfig', WebhookConfigSchema);
