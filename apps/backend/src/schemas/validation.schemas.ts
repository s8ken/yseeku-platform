/**
 * Common Validation Schemas
 * 
 * Reusable Zod schemas for request validation across routes.
 */

import { z } from 'zod';

// ============================================
// Common Field Schemas
// ============================================

/** MongoDB ObjectId pattern */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/** Email validation */
export const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();

/** Password - minimum 8 chars, at least one letter and number */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/** Non-empty string */
export const nonEmptyString = z.string().min(1, 'This field is required').trim();

/** Pagination params */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Page-based pagination */
export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nonEmptyString.min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: nonEmptyString,
});

// ============================================
// Agent Schemas
// ============================================

export const createAgentSchema = z.object({
  name: nonEmptyString.min(2, 'Agent name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  provider: z.enum(['openai', 'anthropic', 'together', 'cohere', 'google']),
  model: nonEmptyString,
  systemPrompt: z.string().max(10000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(128000).default(4096),
  isPublic: z.boolean().default(false),
  apiKeyId: z.string().optional(),
  ciModel: z.enum(['none', 'detect', 'enforce']).default('detect'),
});

export const updateAgentSchema = createAgentSchema.partial();

export const agentIdParamSchema = z.object({
  id: objectIdSchema,
});

export const banAgentSchema = z.object({
  reason: nonEmptyString.min(10, 'Ban reason must be at least 10 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  expiresAt: z.string().datetime().optional(),
});

// ============================================
// Conversation Schemas
// ============================================

export const createConversationSchema = z.object({
  title: z.string().max(200).default('New Conversation'),
  agentId: objectIdSchema.optional(),
  ciEnabled: z.boolean().default(true),
});

export const sendMessageSchema = z.object({
  content: nonEmptyString.min(1, 'Message content is required').max(100000),
  agentId: objectIdSchema.optional(),
});

export const conversationIdParamSchema = z.object({
  id: objectIdSchema,
});

// ============================================
// Experiment Schemas
// ============================================

export const createExperimentSchema = z.object({
  name: nonEmptyString.min(3, 'Experiment name must be at least 3 characters').max(100),
  description: z.string().max(1000).optional(),
  hypothesis: nonEmptyString.min(10, 'Hypothesis must be at least 10 characters'),
  type: z.enum(['ab_test', 'multivariate', 'sequential', 'bayesian']).default('ab_test'),
  variants: z
    .array(
      z.object({
        name: nonEmptyString,
        description: z.string().optional(),
        parameters: z.record(z.unknown()).default({}),
      })
    )
    .min(2, 'At least 2 variants are required'),
  targetSampleSize: z.number().int().min(10).max(1000000).default(1000),
  tags: z.array(z.string()).default([]),
});

export const experimentIdParamSchema = z.object({
  id: objectIdSchema,
});

// ============================================
// Trust Evaluation Schemas
// ============================================

export const evaluateTrustSchema = z.object({
  content: nonEmptyString.min(1, 'Content is required'),
  conversationId: objectIdSchema.optional(),
  sessionId: z.string().optional(),
  previousMessages: z
    .array(
      z.object({
        sender: z.enum(['user', 'ai', 'system']),
        content: z.string(),
      })
    )
    .optional(),
});

export const receiptHashParamSchema = z.object({
  receiptHash: z.string().min(16, 'Invalid receipt hash'),
});

// ============================================
// Override Schemas
// ============================================

export const overrideDecisionSchema = z.object({
  actionId: objectIdSchema,
  decision: z.enum(['approve', 'reject']),
  reason: nonEmptyString.min(10, 'Reason must be at least 10 characters'),
  emergency: z.boolean().default(false),
});

// ============================================
// Tenant Schemas
// ============================================

export const createTenantSchema = z.object({
  name: nonEmptyString.min(2, 'Tenant name must be at least 2 characters').max(100),
  config: z.record(z.unknown()).default({}),
});

export const updateTenantSchema = createTenantSchema.partial();

export const tenantIdParamSchema = z.object({
  id: objectIdSchema,
});

// ============================================
// Secrets Schemas
// ============================================

export const setSecretSchema = z.object({
  name: nonEmptyString.regex(/^[A-Z][A-Z0-9_]*$/, 'Secret name must be uppercase with underscores'),
  value: nonEmptyString,
});

// ============================================
// LLM Generation Schemas
// ============================================

export const generateLLMSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'together', 'cohere', 'google']),
  model: nonEmptyString,
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(128000).default(4096),
  apiKey: z.string().optional(),
});

// ============================================
// Query Filter Schemas
// ============================================

export const alertsQuerySchema = z.object({
  status: z.enum(['new', 'acknowledged', 'resolved', 'suppressed', 'all']).optional(),
  severity: z.enum(['critical', 'error', 'warning', 'info', 'all']).optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const experimentsQuerySchema = z.object({
  status: z.enum(['draft', 'running', 'paused', 'completed', 'archived', 'all']).optional(),
  ...paginationSchema.shape,
});

export const auditQuerySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ...paginationSchema.shape,
});

export default {
  // Common
  objectIdSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,
  pageSchema,
  // Auth
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  // Agents
  createAgentSchema,
  updateAgentSchema,
  agentIdParamSchema,
  banAgentSchema,
  // Conversations
  createConversationSchema,
  sendMessageSchema,
  conversationIdParamSchema,
  // Experiments
  createExperimentSchema,
  experimentIdParamSchema,
  // Trust
  evaluateTrustSchema,
  receiptHashParamSchema,
  // Overrides
  overrideDecisionSchema,
  // Tenants
  createTenantSchema,
  updateTenantSchema,
  tenantIdParamSchema,
  // Secrets
  setSecretSchema,
  // LLM
  generateLLMSchema,
  // Query filters
  alertsQuerySchema,
  experimentsQuerySchema,
  auditQuerySchema,
};

// PascalCase aliases for backwards compatibility
export const LoginSchema = loginSchema;
export const RegisterSchema = registerSchema;
export const CreateAgentSchema = createAgentSchema;
export const UpdateAgentSchema = updateAgentSchema;
export const MongoIdSchema = objectIdSchema;
export const SendMessageSchema = sendMessageSchema;
export const PaginationSchema = paginationSchema;
