/**
 * LLM Provider Routes
 * Multi-provider AI integration for OpenAI, Anthropic, Together, Cohere
 * Ported and enhanced from YCQ-Sonate/backend/routes/llm.routes.js
 */

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import { llmService, LLM_PROVIDERS } from '../services/llm.service';

const router = Router();

/**
 * @route   GET /api/llm/providers
 * @desc    Get all available LLM providers
 * @access  Private
 */
router.get('/providers', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const providers = llmService.getProviders();

    res.json({
      success: true,
      data: { providers },
    });
  } catch (error: any) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/llm/models/:provider
 * @desc    Get models for a specific provider
 * @access  Private
 */
router.get('/models/:provider', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const models = llmService.getModels(provider);

    res.json({
      success: true,
      data: {
        provider: LLM_PROVIDERS[provider]?.name || provider,
        models,
      },
    });
  } catch (error: any) {
    console.error('Get models error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/llm/generate
 * @desc    Generate response from LLM
 * @access  Private
 * @body    { provider, model, messages, temperature?, maxTokens?, apiKey? }
 */
router.post('/generate', protect, async (req: Request, res: Response): Promise<void> => {
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
    const response = await llmService.generate({
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
  } catch (error: any) {
    console.error('LLM generation error:', error);

    // Handle specific error types
    if (error.message.includes('API key not configured')) {
      res.status(401).json({
        success: false,
        message: error.message,
        requiresApiKey: true,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/llm/stream
 * @desc    Stream response from LLM (Server-Sent Events)
 * @access  Private
 * @body    { provider, model, messages, temperature?, maxTokens?, apiKey? }
 */
router.post('/stream', protect, async (req: Request, res: Response): Promise<void> => {
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
      const response = await llmService.generate({
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
    } catch (streamError: any) {
      // Send error event
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('LLM streaming error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize stream',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/llm/code-review
 * @desc    Perform AI-powered code review
 * @access  Private
 * @body    { code, language?, reviewType?, provider?, model?, apiKey? }
 */
router.post('/code-review', protect, async (req: Request, res: Response): Promise<void> => {
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
    const response = await llmService.performCodeReview({
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
  } catch (error: any) {
    console.error('Code review error:', error);

    // Handle API key errors
    if (error.message.includes('API key not configured')) {
      res.status(401).json({
        success: false,
        message: error.message,
        requiresApiKey: true,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to perform code review',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/llm/chat
 * @desc    Simplified chat endpoint (convenience wrapper around /generate)
 * @access  Private
 * @body    { message, agentId?, provider?, model?, context? }
 */
router.post('/chat', protect, async (req: Request, res: Response): Promise<void> => {
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
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system prompt if agent is specified
    if (agentId) {
      // In a full implementation, fetch agent from database and use its systemPrompt
      messages.push({
        role: 'system',
        content: 'You are a helpful AI assistant.',
      });
    } else {
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
    const response = await llmService.generate({
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
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error.message,
    });
  }
});

export default router;
