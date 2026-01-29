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
exports.BrainCycle = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BrainCycleSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started', index: true },
    mode: { type: String, enum: ['advisory', 'enforced'], default: 'advisory' },
    observations: { type: [String], default: [] },
    actions: [{
            type: { type: String },
            target: { type: String },
            reason: { type: String },
            status: { type: String, enum: ['planned', 'approved', 'executed', 'failed', 'skipped', 'overridden'], default: 'planned' }
        }],
    inputContext: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    llmOutput: { type: String },
    thought: { type: String },
    metrics: {
        durationMs: { type: Number },
        error: { type: String },
        agentCount: { type: Number },
        avgTrust: { type: Number },
        alertsProcessed: { type: Number },
        actionsPlanned: { type: Number },
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { timestamps: false, collection: 'brain_cycles' });
BrainCycleSchema.index({ tenantId: 1, startedAt: -1 });
exports.BrainCycle = mongoose_1.default.model('BrainCycle', BrainCycleSchema);
