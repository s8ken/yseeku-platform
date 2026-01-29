"use strict";
/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for request validation across routes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.SendMessageSchema = exports.MongoIdSchema = exports.UpdateAgentSchema = exports.CreateAgentSchema = exports.RegisterSchema = exports.LoginSchema = exports.auditQuerySchema = exports.experimentsQuerySchema = exports.alertsQuerySchema = exports.generateLLMSchema = exports.setSecretSchema = exports.tenantIdParamSchema = exports.updateTenantSchema = exports.createTenantSchema = exports.overrideDecisionSchema = exports.receiptHashParamSchema = exports.evaluateTrustSchema = exports.experimentIdParamSchema = exports.createExperimentSchema = exports.conversationIdParamSchema = exports.sendMessageSchema = exports.createConversationSchema = exports.banAgentSchema = exports.agentIdParamSchema = exports.updateAgentSchema = exports.createAgentSchema = exports.refreshTokenSchema = exports.registerSchema = exports.loginSchema = exports.pageSchema = exports.paginationSchema = exports.nonEmptyString = exports.passwordSchema = exports.emailSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
// ============================================
// Common Field Schemas
// ============================================
/** MongoDB ObjectId pattern */
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
/** Email validation */
exports.emailSchema = zod_1.z.string().email('Invalid email format').toLowerCase().trim();
/** Password - minimum 8 chars, at least one letter and number */
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
/** Non-empty string */
exports.nonEmptyString = zod_1.z.string().min(1, 'This field is required').trim();
/** Pagination params */
exports.paginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
/** Page-based pagination */
exports.pageSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// ============================================
// Auth Schemas
// ============================================
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.registerSchema = zod_1.z.object({
    name: exports.nonEmptyString.min(2, 'Name must be at least 2 characters'),
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: exports.nonEmptyString,
});
// ============================================
// Agent Schemas
// ============================================
exports.createAgentSchema = zod_1.z.object({
    name: exports.nonEmptyString.min(2, 'Agent name must be at least 2 characters').max(100),
    description: zod_1.z.string().max(500).optional(),
    provider: zod_1.z.enum(['openai', 'anthropic', 'together', 'cohere', 'google']),
    model: exports.nonEmptyString,
    systemPrompt: zod_1.z.string().max(10000).optional(),
    temperature: zod_1.z.number().min(0).max(2).default(0.7),
    maxTokens: zod_1.z.number().int().min(1).max(128000).default(4096),
    isPublic: zod_1.z.boolean().default(false),
    apiKeyId: zod_1.z.string().optional(),
    ciModel: zod_1.z.enum(['none', 'detect', 'enforce']).default('detect'),
});
exports.updateAgentSchema = exports.createAgentSchema.partial();
exports.agentIdParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
exports.banAgentSchema = zod_1.z.object({
    reason: exports.nonEmptyString.min(10, 'Ban reason must be at least 10 characters'),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    expiresAt: zod_1.z.string().datetime().optional(),
});
// ============================================
// Conversation Schemas
// ============================================
exports.createConversationSchema = zod_1.z.object({
    title: zod_1.z.string().max(200).default('New Conversation'),
    agentId: exports.objectIdSchema.optional(),
    ciEnabled: zod_1.z.boolean().default(true),
});
exports.sendMessageSchema = zod_1.z.object({
    content: exports.nonEmptyString.min(1, 'Message content is required').max(100000),
    agentId: exports.objectIdSchema.optional(),
});
exports.conversationIdParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
// ============================================
// Experiment Schemas
// ============================================
exports.createExperimentSchema = zod_1.z.object({
    name: exports.nonEmptyString.min(3, 'Experiment name must be at least 3 characters').max(100),
    description: zod_1.z.string().max(1000).optional(),
    hypothesis: exports.nonEmptyString.min(10, 'Hypothesis must be at least 10 characters'),
    type: zod_1.z.enum(['ab_test', 'multivariate', 'sequential', 'bayesian']).default('ab_test'),
    variants: zod_1.z
        .array(zod_1.z.object({
        name: exports.nonEmptyString,
        description: zod_1.z.string().optional(),
        parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
    }))
        .min(2, 'At least 2 variants are required'),
    targetSampleSize: zod_1.z.number().int().min(10).max(1000000).default(1000),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.experimentIdParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
// ============================================
// Trust Evaluation Schemas
// ============================================
exports.evaluateTrustSchema = zod_1.z.object({
    content: exports.nonEmptyString.min(1, 'Content is required'),
    conversationId: exports.objectIdSchema.optional(),
    sessionId: zod_1.z.string().optional(),
    previousMessages: zod_1.z
        .array(zod_1.z.object({
        sender: zod_1.z.enum(['user', 'ai', 'system']),
        content: zod_1.z.string(),
    }))
        .optional(),
});
exports.receiptHashParamSchema = zod_1.z.object({
    receiptHash: zod_1.z.string().min(16, 'Invalid receipt hash'),
});
// ============================================
// Override Schemas
// ============================================
exports.overrideDecisionSchema = zod_1.z.object({
    actionId: exports.objectIdSchema,
    decision: zod_1.z.enum(['approve', 'reject']),
    reason: exports.nonEmptyString.min(10, 'Reason must be at least 10 characters'),
    emergency: zod_1.z.boolean().default(false),
});
// ============================================
// Tenant Schemas
// ============================================
exports.createTenantSchema = zod_1.z.object({
    name: exports.nonEmptyString.min(2, 'Tenant name must be at least 2 characters').max(100),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
});
exports.updateTenantSchema = exports.createTenantSchema.partial();
exports.tenantIdParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
// ============================================
// Secrets Schemas
// ============================================
exports.setSecretSchema = zod_1.z.object({
    name: exports.nonEmptyString.regex(/^[A-Z][A-Z0-9_]*$/, 'Secret name must be uppercase with underscores'),
    value: exports.nonEmptyString,
});
// ============================================
// LLM Generation Schemas
// ============================================
exports.generateLLMSchema = zod_1.z.object({
    provider: zod_1.z.enum(['openai', 'anthropic', 'together', 'cohere', 'google']),
    model: exports.nonEmptyString,
    messages: zod_1.z
        .array(zod_1.z.object({
        role: zod_1.z.enum(['system', 'user', 'assistant']),
        content: zod_1.z.string(),
    }))
        .min(1, 'At least one message is required'),
    temperature: zod_1.z.number().min(0).max(2).default(0.7),
    maxTokens: zod_1.z.number().int().min(1).max(128000).default(4096),
    apiKey: zod_1.z.string().optional(),
});
// ============================================
// Query Filter Schemas
// ============================================
exports.alertsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['new', 'acknowledged', 'resolved', 'suppressed', 'all']).optional(),
    severity: zod_1.z.enum(['critical', 'error', 'warning', 'info', 'all']).optional(),
    search: zod_1.z.string().optional(),
    ...exports.paginationSchema.shape,
});
exports.experimentsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'running', 'paused', 'completed', 'archived', 'all']).optional(),
    ...exports.paginationSchema.shape,
});
exports.auditQuerySchema = zod_1.z.object({
    action: zod_1.z.string().optional(),
    resource: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    ...exports.paginationSchema.shape,
});
exports.default = {
    // Common
    objectIdSchema: exports.objectIdSchema,
    emailSchema: exports.emailSchema,
    passwordSchema: exports.passwordSchema,
    paginationSchema: exports.paginationSchema,
    pageSchema: exports.pageSchema,
    // Auth
    loginSchema: exports.loginSchema,
    registerSchema: exports.registerSchema,
    refreshTokenSchema: exports.refreshTokenSchema,
    // Agents
    createAgentSchema: exports.createAgentSchema,
    updateAgentSchema: exports.updateAgentSchema,
    agentIdParamSchema: exports.agentIdParamSchema,
    banAgentSchema: exports.banAgentSchema,
    // Conversations
    createConversationSchema: exports.createConversationSchema,
    sendMessageSchema: exports.sendMessageSchema,
    conversationIdParamSchema: exports.conversationIdParamSchema,
    // Experiments
    createExperimentSchema: exports.createExperimentSchema,
    experimentIdParamSchema: exports.experimentIdParamSchema,
    // Trust
    evaluateTrustSchema: exports.evaluateTrustSchema,
    receiptHashParamSchema: exports.receiptHashParamSchema,
    // Overrides
    overrideDecisionSchema: exports.overrideDecisionSchema,
    // Tenants
    createTenantSchema: exports.createTenantSchema,
    updateTenantSchema: exports.updateTenantSchema,
    tenantIdParamSchema: exports.tenantIdParamSchema,
    // Secrets
    setSecretSchema: exports.setSecretSchema,
    // LLM
    generateLLMSchema: exports.generateLLMSchema,
    // Query filters
    alertsQuerySchema: exports.alertsQuerySchema,
    experimentsQuerySchema: exports.experimentsQuerySchema,
    auditQuerySchema: exports.auditQuerySchema,
};
// PascalCase aliases for backwards compatibility
exports.LoginSchema = exports.loginSchema;
exports.RegisterSchema = exports.registerSchema;
exports.CreateAgentSchema = exports.createAgentSchema;
exports.UpdateAgentSchema = exports.updateAgentSchema;
exports.MongoIdSchema = exports.objectIdSchema;
exports.SendMessageSchema = exports.sendMessageSchema;
exports.PaginationSchema = exports.paginationSchema;
