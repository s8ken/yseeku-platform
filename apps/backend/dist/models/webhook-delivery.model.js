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
exports.WebhookDeliveryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WebhookDeliverySchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    webhookConfigId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'WebhookConfig',
        required: true,
        index: true,
    },
    alertId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Alert',
        index: true,
    },
    alertType: { type: String, required: true },
    alertSeverity: { type: String, required: true },
    ruleId: String,
    ruleName: String,
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'retrying'],
        default: 'pending',
        index: true,
    },
    url: { type: String, required: true },
    method: { type: String, default: 'POST' },
    requestBody: String,
    requestHeaders: {
        type: Map,
        of: String,
        default: {},
    },
    responseStatus: Number,
    responseBody: String,
    responseTime: Number,
    attempt: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 3 },
    nextRetryAt: Date,
    error: String,
    deliveredAt: Date,
}, {
    timestamps: true,
    collection: 'webhook_deliveries',
});
// Indexes for queries
WebhookDeliverySchema.index({ tenantId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ webhookConfigId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ status: 1, nextRetryAt: 1 }); // For retry queue
WebhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 day TTL
exports.WebhookDeliveryModel = mongoose_1.default.models.WebhookDelivery || mongoose_1.default.model('WebhookDelivery', WebhookDeliverySchema);
