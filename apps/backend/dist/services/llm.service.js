"use strict";
/**
 * LLM Service - Multi-Provider AI Integration
 * Supports OpenAI, Anthropic, Google, Together, Cohere
 * Ported and enhanced from YCQ-Sonate/backend/controllers/llm.controller.js
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmService = exports.LLMService = exports.LLM_PROVIDERS = void 0;
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const tracing_1 = require("../observability/tracing");
const user_model_1 = require("../models/user.model");
const logger_1 = require("../utils/logger");
const error_utils_1 = require("../utils/error-utils");
// Supported LLM providers and their models
exports.LLM_PROVIDERS = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        requiresApiKey: true,
        models: [
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                maxTokens: 4096,
                contextWindow: 128000,
                pricing: { input: 0.01, output: 0.03 }
            },
            {
                id: 'gpt-4',
                name: 'GPT-4',
                maxTokens: 8192,
                contextWindow: 8192,
                pricing: { input: 0.03, output: 0.06 }
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                maxTokens: 4096,
                contextWindow: 16385,
                pricing: { input: 0.0005, output: 0.0015 }
            },
        ],
        endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        requiresApiKey: true,
        models: [
            {
                id: 'claude-sonnet-4-20250514',
                name: 'Claude 3.5 Sonnet',
                maxTokens: 8192,
                contextWindow: 200000,
                pricing: { input: 0.003, output: 0.015 }
            },
            {
                id: 'claude-opus-4-20250514',
                name: 'Claude 3 Opus',
                maxTokens: 4096,
                contextWindow: 200000,
                pricing: { input: 0.015, output: 0.075 }
            },
            {
                id: 'claude-3-haiku-20240307',
                name: 'Claude 3 Haiku',
                maxTokens: 4096,
                contextWindow: 200000,
                pricing: { input: 0.00025, output: 0.00125 }
            },
        ],
        endpoint: 'https://api.anthropic.com/v1/messages'
    },
    together: {
        id: 'together',
        name: 'Together AI',
        requiresApiKey: true,
        models: [
            {
                id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
                name: 'Llama 3.1 70B Instruct',
                maxTokens: 4096,
                contextWindow: 131072,
                pricing: { input: 0.0009, output: 0.0009 }
            },
            {
                id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
                name: 'Mixtral 8x7B Instruct',
                maxTokens: 4096,
                contextWindow: 32768,
                pricing: { input: 0.0006, output: 0.0006 }
            },
        ],
        endpoint: 'https://api.together.xyz/v1/chat/completions'
    },
    cohere: {
        id: 'cohere',
        name: 'Cohere',
        requiresApiKey: true,
        models: [
            {
                id: 'command-r-plus',
                name: 'Command R+',
                maxTokens: 4000,
                contextWindow: 128000,
                pricing: { input: 0.003, output: 0.015 }
            },
            {
                id: 'command-r',
                name: 'Command R',
                maxTokens: 4000,
                contextWindow: 128000,
                pricing: { input: 0.0005, output: 0.0015 }
            },
        ],
        endpoint: 'https://api.cohere.ai/v1/chat'
    },
};
class LLMService {
    constructor() {
        this.openaiClient = null;
        this.anthropicClient = null;
        // Initialize system-level API clients if env vars are set
        if (process.env.OPENAI_API_KEY) {
            this.openaiClient = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
        }
        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropicClient = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
        }
    }
    /**
     * Get all available providers
     */
    getProviders() {
        return Object.values(exports.LLM_PROVIDERS).map(provider => ({
            id: provider.id,
            name: provider.name,
            modelCount: provider.models.length,
            requiresApiKey: provider.requiresApiKey,
        }));
    }
    /**
     * Get models for a specific provider
     */
    getModels(providerId) {
        const provider = exports.LLM_PROVIDERS[providerId];
        if (!provider) {
            throw new Error(`Provider '${providerId}' not found`);
        }
        return provider.models;
    }
    /**
     * Get API key for user from database
     */
    async getUserApiKey(userId, provider) {
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return undefined;
        }
        const apiKey = user.apiKeys.find(key => key.provider === provider && key.isActive);
        return apiKey?.key || undefined;
    }
    /**
     * Generate response from LLM
     */
    async generate(options) {
        const { provider, model, messages, temperature = 0.7, maxTokens = 1000, userId, apiKey } = options;
        // Validate provider
        if (!exports.LLM_PROVIDERS[provider]) {
            throw new Error(`Provider '${provider}' is not supported`);
        }
        // Get API key (user's key or system key or provided key)
        let resolvedApiKey = apiKey;
        if (!resolvedApiKey && userId) {
            resolvedApiKey = await this.getUserApiKey(userId, provider);
        }
        // Route to appropriate provider
        const span = tracing_1.tracer.startSpan('llm.generate', {
            attributes: {
                'llm.provider': provider,
                'llm.model': model,
                'user.id': userId || 'unknown',
            }
        });
        try {
            switch (provider) {
                case 'openai':
                    return await this.generateOpenAI(model, messages, temperature, maxTokens, resolvedApiKey);
                case 'anthropic':
                    return await this.generateAnthropic(model, messages, temperature, maxTokens, resolvedApiKey);
                case 'together':
                    return await this.generateTogether(model, messages, temperature, maxTokens, resolvedApiKey);
                case 'cohere':
                    return await this.generateCohere(model, messages, temperature, maxTokens, resolvedApiKey);
                default:
                    throw new Error(`Provider '${provider}' is not implemented`);
            }
        }
        finally {
            span.end();
        }
    }
    /**
     * Execute an async operation with retry logic
     */
    async withRetry(operation, context, retries = 3, backoff = 1000) {
        let lastError;
        for (let i = 0; i <= retries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Don't retry on auth errors or bad requests
                if (error.status === 401 || error.status === 403 || error.status === 400) {
                    throw error;
                }
                if (i === retries)
                    break;
                logger_1.logger.warn(`LLM operation failed, retrying (${i + 1}/${retries})`, {
                    context,
                    error: error.message
                });
                await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(1.5, i)));
            }
        }
        throw lastError;
    }
    /**
     * Generate response from OpenAI
     */
    async generateOpenAI(model, messages, temperature, maxTokens, apiKey) {
        // Use provided API key or system client
        const client = apiKey
            ? new openai_1.default({ apiKey })
            : this.openaiClient;
        if (!client) {
            throw new Error('OpenAI API key not configured. Please add your API key in settings.');
        }
        try {
            return await this.withRetry(async () => {
                const completion = await client.chat.completions.create({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                });
                return {
                    content: completion.choices[0].message.content || '',
                    usage: {
                        promptTokens: completion.usage?.prompt_tokens,
                        completionTokens: completion.usage?.completion_tokens,
                        totalTokens: completion.usage?.total_tokens,
                    },
                    model,
                    provider: 'openai',
                };
            }, `openai:${model}`);
        }
        catch (error) {
            logger_1.logger.error('OpenAI API Error', { error: (0, error_utils_1.getErrorMessage)(error) });
            throw new Error(`OpenAI API Error: ${(0, error_utils_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Generate response from Anthropic
     */
    async generateAnthropic(model, messages, temperature, maxTokens, apiKey) {
        // Use provided API key or system client
        const client = apiKey
            ? new sdk_1.default({ apiKey })
            : this.anthropicClient;
        if (!client) {
            throw new Error('Anthropic API key not configured. Please add your API key in settings.');
        }
        // Map old model names to new ones for compatibility
        const modelMapping = {
            'claude-3-5-sonnet-20241022': 'claude-sonnet-4-20250514',
            'claude-3-opus-20240229': 'claude-opus-4-20250514',
            'claude-3-haiku-20240307': 'claude-3-haiku-20240307',
        };
        const resolvedModel = modelMapping[model] || model;
        try {
            return await this.withRetry(async () => {
                // Convert OpenAI format to Anthropic format
                const systemMessage = messages.find(msg => msg.role === 'system');
                const conversationMessages = messages
                    .filter(msg => msg.role !== 'system')
                    .map(msg => ({
                    role: msg.role,
                    content: msg.content,
                }));
                const response = await client.messages.create({
                    model: resolvedModel,
                    max_tokens: maxTokens,
                    temperature,
                    system: systemMessage?.content || '',
                    messages: conversationMessages,
                });
                const content = response.content[0];
                const text = content.type === 'text' ? content.text : '';
                return {
                    content: text,
                    usage: {
                        inputTokens: response.usage.input_tokens,
                        outputTokens: response.usage.output_tokens,
                    },
                    model,
                    provider: 'anthropic',
                };
            }, `anthropic:${resolvedModel}`);
        }
        catch (error) {
            logger_1.logger.error('Anthropic API Error', { error: (0, error_utils_1.getErrorMessage)(error) });
            throw new Error(`Anthropic API Error: ${(0, error_utils_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Generate response from Together AI
     */
    async generateTogether(model, messages, temperature, maxTokens, apiKey) {
        if (!apiKey && !process.env.TOGETHER_API_KEY) {
            throw new Error('Together AI API key not configured. Please add your API key in settings.');
        }
        // Together AI uses OpenAI-compatible API
        const client = new openai_1.default({
            apiKey: apiKey || process.env.TOGETHER_API_KEY,
            baseURL: 'https://api.together.xyz/v1',
        });
        try {
            const completion = await client.chat.completions.create({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            });
            return {
                content: completion.choices[0].message.content || '',
                usage: {
                    promptTokens: completion.usage?.prompt_tokens,
                    completionTokens: completion.usage?.completion_tokens,
                    totalTokens: completion.usage?.total_tokens,
                },
                model,
                provider: 'together',
            };
        }
        catch (error) {
            logger_1.logger.error('Together AI API Error', { error: (0, error_utils_1.getErrorMessage)(error) });
            throw new Error(`Together AI API Error: ${(0, error_utils_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Generate response from Cohere
     */
    async generateCohere(model, messages, temperature, maxTokens, apiKey) {
        if (!apiKey && !process.env.COHERE_API_KEY) {
            throw new Error('Cohere API key not configured. Please add your API key in settings.');
        }
        // Cohere uses a different API format
        // For now, return a placeholder - full implementation would use Cohere SDK
        throw new Error('Cohere provider is not yet fully implemented. Use OpenAI or Anthropic instead.');
    }
    /**
     * Perform code review using AI
     */
    async performCodeReview(options) {
        const { code, language = '', reviewType = 'comprehensive', provider = 'openai', model, userId, } = options;
        const reviewPrompts = {
            comprehensive: `Please perform a comprehensive code review of the following ${language || 'code'}. Analyze:
1. Code quality and best practices
2. Security vulnerabilities
3. Performance optimizations
4. Bug detection
5. Maintainability and readability
6. Architecture and design patterns

Provide specific suggestions with line references where applicable.

Code:
\`\`\`${language}
${code}
\`\`\``,
            security: `Please perform a security-focused code review of the following ${language || 'code'}. Focus on:
1. Security vulnerabilities (OWASP Top 10)
2. Input validation issues
3. Authentication and authorization flaws
4. Data exposure risks
5. Injection attacks
6. Cryptographic issues

Code:
\`\`\`${language}
${code}
\`\`\``,
            performance: `Please perform a performance-focused code review of the following ${language || 'code'}. Analyze:
1. Algorithm efficiency
2. Memory usage optimization
3. Database query optimization
4. Caching opportunities
5. Bottleneck identification
6. Scalability concerns

Code:
\`\`\`${language}
${code}
\`\`\``,
            style: `Please perform a code style and maintainability review of the following ${language || 'code'}. Focus on:
1. Code formatting and consistency
2. Naming conventions
3. Code organization
4. Documentation and comments
5. Refactoring opportunities
6. Technical debt

Code:
\`\`\`${language}
${code}
\`\`\``,
        };
        const messages = [
            {
                role: 'system',
                content: 'You are an expert code reviewer with extensive experience in software development, security, and best practices. Provide detailed, actionable feedback.',
            },
            {
                role: 'user',
                content: reviewPrompts[reviewType],
            },
        ];
        const selectedModel = model || (provider === 'openai' ? 'gpt-4-turbo' : 'claude-sonnet-4-20250514');
        return this.generate({
            provider,
            model: selectedModel,
            messages,
            temperature: 0.3,
            maxTokens: 2000,
            userId,
        });
    }
}
exports.LLMService = LLMService;
// Export singleton instance
exports.llmService = new LLMService();
