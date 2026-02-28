/**
 * LLM Service - Multi-Provider AI Integration
 * Supports OpenAI, Anthropic, Google, Together, Cohere
 * Ported and enhanced from YCQ-Sonate/backend/controllers/llm.controller.js
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { tracer } from '../observability/tracing';
import { User, IUser } from '../models/user.model';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// Message format (OpenAI-compatible)
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  model: string;
  provider: string;
}

export interface LLMGenerateOptions {
  provider: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  apiKey?: string; // Optional: use user's API key instead of system key
}

export interface LLMModel {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow?: number;
  pricing?: {
    input: number;  // per 1K tokens
    output: number; // per 1K tokens
  };
}

export interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  endpoint: string;
  requiresApiKey: boolean;
}

// Supported LLM providers and their models
export const LLM_PROVIDERS: Record<string, LLMProvider> = {
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
        name: 'Claude Sonnet 4',
        maxTokens: 8192,
        contextWindow: 200000,
        pricing: { input: 0.003, output: 0.015 }
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
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
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    requiresApiKey: true,
    models: [
      {
        id: 'gemini-3-pro-preview',
        name: 'Gemini-3-Pro-Preview',
        maxTokens: 8192,
        contextWindow: 2000000,
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: { input: 0.00035, output: 0.00105 }
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        maxTokens: 8192,
        contextWindow: 2000000,
        pricing: { input: 0.00125, output: 0.005 }
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        maxTokens: 8192,
        contextWindow: 1000000,
      },
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
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

export class LLMService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor() {
    // Initialize system-level API clients if env vars are set
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Get all available providers
   */
  getProviders(): Array<{ id: string; name: string; modelCount: number; requiresApiKey: boolean }> {
    return Object.values(LLM_PROVIDERS).map(provider => ({
      id: provider.id,
      name: provider.name,
      modelCount: provider.models.length,
      requiresApiKey: provider.requiresApiKey,
    }));
  }

  /**
   * Get models for a specific provider
   */
  getModels(providerId: string): LLMModel[] {
    const provider = LLM_PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Provider '${providerId}' not found`);
    }
    return provider.models;
  }

  /**
   * Get API key for user from database
   */
  private async getUserApiKey(userId: string, provider: string): Promise<string | undefined> {
    const user = await User.findById(userId);
    if (!user) {
      return undefined;
    }

    const apiKey = user.apiKeys.find(
      key => key.provider === provider && key.isActive
    );
    return apiKey?.key || undefined;
  }

  /**
   * Generate response from LLM
   */
  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    const { provider, model, messages, temperature = 0.7, maxTokens = 1000, userId, apiKey } = options;

    // Validate provider
    if (!LLM_PROVIDERS[provider]) {
      throw new Error(`Provider '${provider}' is not supported`);
    }

    // Get API key (user's key or system key or provided key)
    let resolvedApiKey = apiKey;
    if (!resolvedApiKey && userId) {
      resolvedApiKey = await this.getUserApiKey(userId, provider);
    }

    // Route to appropriate provider
    const span = tracer.startSpan('llm.generate', {
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
      case 'gemini':
        return await this.generateGemini(model, messages, temperature, maxTokens, resolvedApiKey);
      case 'together':
        return await this.generateTogether(model, messages, temperature, maxTokens, resolvedApiKey);
      case 'cohere':
        return await this.generateCohere(model, messages, temperature, maxTokens, resolvedApiKey);
      default:
        throw new Error(`Provider '${provider}' is not implemented`);
      }
    } finally {
      span.end();
    }
  }

  /**
   * Execute an async operation with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    retries = 3,
    backoff = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on auth errors or bad requests
        if (error.status === 401 || error.status === 403 || error.status === 400) {
          throw error;
        }

        if (i === retries) break;

        logger.warn(`LLM operation failed, retrying (${i + 1}/${retries})`, {
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
  private async generateOpenAI(
    model: string,
    messages: ChatMessage[],
    temperature: number,
    maxTokens: number,
    apiKey?: string
  ): Promise<LLMResponse> {
    // Use provided API key or system client
    const client = apiKey
      ? new OpenAI({ apiKey })
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
    } catch (error: unknown) {
      logger.error('OpenAI API Error', { error: getErrorMessage(error) });
      const msg = getErrorMessage(error);
      if (msg.toLowerCase().includes('insufficient_quota') || msg.toLowerCase().includes('billing') || msg.toLowerCase().includes('credit')) {
        throw new Error(`AI_BILLING_ERROR: The OpenAI account has insufficient quota. Please top up at platform.openai.com/billing.`);
      }
      if ((error as any)?.status === 429 || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests')) {
        throw new Error(`AI_RATE_LIMIT_ERROR: Too many requests to OpenAI. Please wait a moment before trying again.`);
      }
      throw new Error(`OpenAI API Error: ${msg}`);
    }
  }

  /**
   * Generate response from Anthropic
   */
  private async generateAnthropic(
    model: string,
    messages: ChatMessage[],
    temperature: number,
    maxTokens: number,
    apiKey?: string
  ): Promise<LLMResponse> {
    // Use provided API key or system client
    const client = apiKey
      ? new Anthropic({ apiKey })
      : this.anthropicClient;

    if (!client) {
      throw new Error('Anthropic API key not configured. Please add your API key in settings.');
    }

    // Map old model names to new ones for compatibility
    const modelMapping: Record<string, string> = {
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
            role: msg.role as 'user' | 'assistant',
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
    } catch (error: unknown) {
      logger.error('Anthropic API Error', { error: getErrorMessage(error) });
      const msg = getErrorMessage(error);
      if (msg.toLowerCase().includes('credit balance is too low') || msg.toLowerCase().includes('insufficient credits') || msg.toLowerCase().includes('billing')) {
        throw new Error(`AI_BILLING_ERROR: The Anthropic account has insufficient credits. Please top up at console.anthropic.com/settings/billing.`);
      }
      if ((error as any)?.status === 429 || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests')) {
        throw new Error(`AI_RATE_LIMIT_ERROR: Too many requests to Anthropic. Please wait a moment before trying again.`);
      }
      throw new Error(`Anthropic API Error: ${msg}`);
    }
  }

  private async generateGemini(
    model: string,
    messages: ChatMessage[],
    temperature: number,
    maxTokens: number,
    apiKey?: string
  ): Promise<LLMResponse> {
    const key = apiKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key not configured. Please add your API key in settings.');
    }

    const systemText = messages
      .filter(msg => msg.role === 'system')
      .map(msg => msg.content)
      .join('\n\n');

    const contents = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    try {
      return await this.withRetry(async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        
        // Use a longer timeout for Gemini (60s) to avoid 502s on long generations
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
          const resp = await fetch(url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
              contents,
              generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
              },
            }),
            signal: controller.signal,
          });

          if (!resp.ok) {
            const errorText = await resp.text().catch(() => 'Unknown error');
            throw new Error(`Gemini API error: ${resp.status} - ${errorText}`);
          }

          const data = await resp.json() as any;
          const text = (data.candidates?.[0]?.content?.parts || [])
            .map((p: any) => p?.text)
            .filter(Boolean)
            .join('') || '';

          return {
            content: text,
            usage: {
              promptTokens: data.usageMetadata?.promptTokenCount,
              completionTokens: data.usageMetadata?.candidatesTokenCount,
              totalTokens: data.usageMetadata?.totalTokenCount,
            },
            model,
            provider: 'gemini',
          };
        } finally {
          clearTimeout(timeoutId);
        }
      }, `gemini:${model}`);
    } catch (error: unknown) {
      logger.error('Gemini API Error', { error: getErrorMessage(error) });
      const msg = getErrorMessage(error);
      if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('billing') || msg.toLowerCase().includes('resource has been exhausted')) {
        throw new Error(`AI_BILLING_ERROR: The Google Gemini quota has been exhausted. Please check your quota at console.cloud.google.com.`);
      }
      if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('too many') || msg.includes('429')) {
        throw new Error(`AI_RATE_LIMIT_ERROR: Gemini API is rate limited. Please wait a moment before trying again.`);
      }
      throw new Error(`Gemini API Error: ${msg}`);
    }
  }

  /**
   * Generate response from Together AI
   */
  private async generateTogether(
    model: string,
    messages: ChatMessage[],
    temperature: number,
    maxTokens: number,
    apiKey?: string
  ): Promise<LLMResponse> {
    if (!apiKey && !process.env.TOGETHER_API_KEY) {
      throw new Error('Together AI API key not configured. Please add your API key in settings.');
    }

    // Together AI uses OpenAI-compatible API
    const client = new OpenAI({
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
    } catch (error: unknown) {
      logger.error('Together AI API Error', { error: getErrorMessage(error) });
      const msg = getErrorMessage(error);
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('billing') || msg.toLowerCase().includes('credit')) {
        throw new Error(`AI_BILLING_ERROR: The Together AI account has insufficient credits. Please top up at api.together.xyz/settings/billing.`);
      }
      if ((error as any)?.status === 429 || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests')) {
        throw new Error(`AI_RATE_LIMIT_ERROR: Too many requests to Together AI. Please wait a moment before trying again.`);
      }
      throw new Error(`Together AI API Error: ${msg}`);
    }
  }

  /**
   * Generate response from Cohere
   */
  private async generateCohere(
    model: string,
    messages: ChatMessage[],
    temperature: number,
    maxTokens: number,
    apiKey?: string
  ): Promise<LLMResponse> {
    const key = apiKey || process.env.COHERE_API_KEY;
    if (!key) {
      throw new Error('Cohere API key not configured. Please add your API key in settings.');
    }

    // Cohere API mapping
    // Extract the last user message as the "message" parameter
    // The rest form the "chat_history"
    const historyMessages = [...messages];
    let lastMessage = historyMessages.pop();

    if (lastMessage && lastMessage.role !== 'user') {
      // If the last message isn't from the user, push it back to history
      // and use a generic continuation prompt
      historyMessages.push(lastMessage);
      lastMessage = { role: 'user', content: 'Please continue.' };
    } else if (!lastMessage) {
      // Handle empty conversation
      lastMessage = { role: 'user', content: 'Hello' };
    }

    const currentMessage = lastMessage.content;

    const chatHistory = historyMessages.map(msg => ({
      role: msg.role === 'user' ? 'USER' : (msg.role === 'assistant' ? 'CHATBOT' : 'SYSTEM'),
      message: msg.content
    }));

    try {
      return await this.withRetry(async () => {
        const response = await fetch('https://api.cohere.ai/v1/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model,
            message: currentMessage,
            chat_history: chatHistory,
            temperature,
            max_tokens: maxTokens,
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Cohere API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json() as any;

        return {
          content: data.text || '',
          usage: {
            promptTokens: data.meta?.billed_units?.input_tokens,
            completionTokens: data.meta?.billed_units?.output_tokens,
            totalTokens: (data.meta?.billed_units?.input_tokens || 0) + (data.meta?.billed_units?.output_tokens || 0),
          },
          model,
          provider: 'cohere',
        };
      }, `cohere:${model}`);
    } catch (error: unknown) {
      logger.error('Cohere API Error', { error: getErrorMessage(error) });
      throw new Error(`Cohere API Error: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Perform code review using AI
   */
  async performCodeReview(options: {
    code: string;
    language?: string;
    reviewType?: 'comprehensive' | 'security' | 'performance' | 'style';
    provider?: string;
    model?: string;
    userId?: string;
  }): Promise<LLMResponse> {
    const {
      code,
      language = '',
      reviewType = 'comprehensive',
      provider = 'openai',
      model,
      userId,
    } = options;

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

    const messages: ChatMessage[] = [
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

// Export singleton instance
export const llmService = new LLMService();
