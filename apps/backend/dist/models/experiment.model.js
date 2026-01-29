"use strict";
/**
 * Experiment Model
 * A/B testing experiments for platform optimization and trust protocol tuning
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
exports.Experiment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VariantSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    parameters: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    sampleSize: {
        type: Number,
        default: 0,
    },
    successCount: {
        type: Number,
        default: 0,
    },
    failureCount: {
        type: Number,
        default: 0,
    },
    avgScore: {
        type: Number,
        default: 0,
    },
    sumScores: {
        type: Number,
        default: 0,
    },
    sumSquaredScores: {
        type: Number,
        default: 0,
    },
});
const ExperimentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    hypothesis: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'running', 'paused', 'completed', 'archived'],
        default: 'draft',
        index: true,
    },
    type: {
        type: String,
        enum: ['ab_test', 'multivariate', 'sequential', 'bayesian'],
        default: 'ab_test',
    },
    variants: {
        type: [VariantSchema],
        required: true,
        validate: {
            validator: function (v) {
                return v.length >= 2;
            },
            message: 'Experiment must have at least 2 variants (control + treatment)',
        },
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    pausedAt: {
        type: Date,
    },
    targetSampleSize: {
        type: Number,
        required: true,
        min: 100,
        default: 1000,
    },
    currentSampleSize: {
        type: Number,
        default: 0,
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    metrics: {
        pValue: { type: Number },
        effectSize: { type: Number },
        confidenceInterval: {
            lower: { type: Number },
            upper: { type: Number },
        },
        significant: { type: Boolean, default: false },
        minimumDetectableEffect: { type: Number },
    },
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    notes: {
        type: String,
        default: '',
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    collection: 'experiments',
});
// Compound indexes for common queries
ExperimentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
ExperimentSchema.index({ tenantId: 1, createdBy: 1, createdAt: -1 });
ExperimentSchema.index({ tenantId: 1, tags: 1 });
// Update progress when sample size changes
ExperimentSchema.pre('save', function () {
    if (this.targetSampleSize > 0) {
        this.progress = Math.min(100, Math.round((this.currentSampleSize / this.targetSampleSize) * 100));
    }
});
exports.Experiment = mongoose_1.default.model('Experiment', ExperimentSchema);
