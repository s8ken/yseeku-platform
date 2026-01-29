"use strict";
/**
 * LLM Provider Routes
 * Multi-provider AI integration for OpenAI, Anthropic, Together, Cohere
 * Ported and enhanced from YCQ-Sonate/backend/routes/llm.routes.js
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const rate_limiters_1 = require("../middleware/rate-limiters");
const cache_service_1 = require("../services/cache.service");
const llm_service_1 = require("../services/llm.service");
const error_utils_1 = require("../utils/error-utils");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/llm/providers
 * @desc    Get all available LLM providers
 * @access  Private
 */
router.get('/providers', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['read:all']), rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const cacheKey = 'llm:providers';
        const cached = await (0, cache_service_1.cacheGet)(cacheKey);
        const providers = cached || llm_service_1.llmService.getProviders();
        if (!cached)
            await (0, cache_service_1.cacheSet)(cacheKey, providers, 600);
        res.json({
            success: true,
            data: { providers },
        });
    }
    catch (error) {
        logger_1.default.error('Get providers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch providers',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   GET /api/llm/models/:provider
 * @desc    Get models for a specific provider
 * @access  Private
 */
router.get('/models/:provider', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['read:all']), rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const provider = String(req.params.provider);
        if (!llm_service_1.LLM_PROVIDERS[provider]) {
            res.status(404).json({
                success: false,
                message: `Provider '${provider}' not found`,
            });
            return;
        }
        const cacheKey = `llm:models:${provider}`;
        const cached = await (0, cache_service_1.cacheGet)(cacheKey);
        const models = cached || llm_service_1.llmService.getModels(provider);
        if (!cached)
            await (0, cache_service_1.cacheSet)(cacheKey, models, 600);
        res.json({
            success: true,
            data: {
                provider: llm_service_1.LLM_PROVIDERS[provider]?.name || provider,
                models,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get models error:', error);
        res.status((0, error_utils_1.getErrorMessage)(error).includes('not found') ? 404 : 500).json({
            success: false,
            message: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/llm/generate
 * @desc    Generate response from LLM
 * @access  Private
 * @body    { provider, model, messages, temperature?, maxTokens?, apiKey? }
 */
router.post('/generate', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['llm:generate']), rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const { provider, model, messages, temperature, maxTokens, apiKey } = req.body;
        // Validation
        if (!provider || !model || !messages || !Array.isArray(messages)) {
            res.status(400).json({
                success: false,
                message: 'Please provide provider, model, and messages array',
            });
            return;
        }
        // Generate response
        const response = await llm_service_1.llmService.generate({
            provider,
            model,
            messages,
            temperature,
            maxTokens,
            userId: req.userId,
            apiKey,
        });
        res.json({
            success: true,
            data: {
                response: response.content,
                usage: response.usage,
                model: response.model,
                provider: response.provider,
            },
        });
    }
    catch (error) {
        logger_1.default.error('LLM generation error:', error);
        // Handle specific error types
        if ((0, error_utils_1.getErrorMessage)(error).includes('API key not configured')) {
            res.status(401).json({
                success: false,
                message: (0, error_utils_1.getErrorMessage)(error),
                requiresApiKey: true,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to generate response',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/llm/stream
 * @desc    Stream response from LLM (Server-Sent Events)
 * @access  Private
 * @body    { provider, model, messages, temperature?, maxTokens?, apiKey? }
 */
router.post('/stream', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['llm:generate']), rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const { provider, model, messages, temperature, maxTokens, apiKey } = req.body;
        // Validation
        if (!provider || !model || !messages || !Array.isArray(messages)) {
            res.status(400).json({
                success: false,
                message: 'Please provide provider, model, and messages array',
            });
            return;
        }
        // Set headers for SSE streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        try {
            // For now, we'll simulate streaming by chunking the response
            // In a full implementation, you'd use streaming APIs from OpenAI/Anthropic
            const response = await llm_service_1.llmService.generate({
                provider,
                model,
                messages,
                temperature,
                maxTokens,
                userId: req.userId,
                apiKey,
            });
            // Send response in chunks to simulate streaming
            const content = response.content;
            const chunkSize = 50;
            const chunks = content.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [content];
            for (const chunk of chunks) {
                res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            // Send completion event
            res.write(`data: ${JSON.stringify({
                done: true,
                usage: response.usage,
                model: response.model,
                provider: response.provider
            })}\n\n`);
            res.end();
        }
        catch (streamError) {
            // Send error event
            res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
            res.end();
        }
    }
    catch (error) {
        logger_1.default.error('LLM streaming error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize stream',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/llm/code-review
 * @desc    Perform AI-powered code review
 * @access  Private
 * @body    { code, language?, reviewType?, provider?, model?, apiKey? }
 */
router.post('/code-review', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['llm:code-review']), rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const { code, language, reviewType, provider, model, apiKey } = req.body;
        // Validation
        if (!code) {
            res.status(400).json({
                success: false,
                message: 'Code content is required',
            });
            return;
        }
        // Validate reviewType
        const validReviewTypes = ['comprehensive', 'security', 'performance', 'style'];
        if (reviewType && !validReviewTypes.includes(reviewType)) {
            res.status(400).json({
                success: false,
                message: `Invalid review type. Must be one of: ${validReviewTypes.join(', ')}`,
            });
            return;
        }
        // Perform code review
        const response = await llm_service_1.llmService.performCodeReview({
            code,
            language,
            reviewType,
            provider: provider || 'openai',
            model,
            userId: req.userId,
        });
        res.json({
            success: true,
            data: {
                review: response.content,
                provider: response.provider,
                model: response.model,
                reviewType: reviewType || 'comprehensive',
                language: language || 'unknown',
                usage: response.usage,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Code review error:', error);
        // Handle API key errors
        if ((0, error_utils_1.getErrorMessage)(error).includes('API key not configured')) {
            res.status(401).json({
                success: false,
                message: (0, error_utils_1.getErrorMessage)(error),
                requiresApiKey: true,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to perform code review',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
/**
 * @route   POST /api/llm/chat
 * @desc    Simplified chat endpoint (convenience wrapper around /generate)
 * @access  Private
 * @body    { message, agentId?, provider?, model?, context? }
 */
router.post('/chat', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['llm:generate']), rate_limiters_1.llmLimiter, async (req, res) => {
    try {
        const { message, agentId, provider, model, context } = req.body;
        if (!message) {
            res.status(400).json({
                success: false,
                message: 'Message is required',
            });
            return;
        }
        // Build messages array
        const messages = [];
        // Add system prompt if agent is specified
        if (agentId) {
            // In a full implementation, fetch agent from database and use its systemPrompt
            messages.push({
                role: 'system',
                content: 'You are a helpful AI assistant.',
            });
        }
        else {
            messages.push({
                role: 'system',
                content: 'You are a helpful AI assistant.',
            });
        }
        // Add context if provided
        if (context && Array.isArray(context)) {
            messages.push(...context);
        }
        // Add user message
        messages.push({
            role: 'user',
            content: message,
        });
        // Generate response
        const response = await llm_service_1.llmService.generate({
            provider: provider || 'openai',
            model: model || 'gpt-3.5-turbo',
            messages,
            userId: req.userId,
        });
        res.json({
            success: true,
            data: {
                message: response.content,
                usage: response.usage,
                model: response.model,
                provider: response.provider,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process chat message',
            error: (0, error_utils_1.getErrorMessage)(error),
        });
    }
});
exports.default = router;
