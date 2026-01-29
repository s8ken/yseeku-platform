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
exports.TrustReceiptModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TrustReceiptSchema = new mongoose_1.Schema({
    self_hash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    session_id: {
        type: String,
        required: true,
        index: true,
    },
    version: {
        type: String,
        default: '1.0.0',
    },
    timestamp: {
        type: Number,
        required: true,
    },
    mode: {
        type: String,
        default: 'constitutional',
    },
    ciq_metrics: {
        clarity: Number,
        integrity: Number,
        quality: Number,
    },
    previous_hash: String,
    signature: String,
    session_nonce: String,
    tenant_id: {
        type: String,
        index: true,
    },
    // DID-related fields
    issuer: {
        type: String,
        index: true,
    },
    subject: {
        type: String,
        index: true,
    },
    agent_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Agent',
        index: true,
    },
    proof: {
        type: {
            type: String,
        },
        created: String,
        verificationMethod: String,
        proofPurpose: String,
        proofValue: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Index for DID-based queries
TrustReceiptSchema.index({ issuer: 1, subject: 1 });
exports.TrustReceiptModel = mongoose_1.default.model('TrustReceipt', TrustReceiptSchema);
