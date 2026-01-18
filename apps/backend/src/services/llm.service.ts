/**
 * LLM Service - Multi-Provider AI Integration
 * Supports OpenAI, Anthropic, Google, Together, Cohere
 * Ported and enhanced from YCQ-Sonate/backend/controllers/llm.controller.js
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { tracer } from '../observability/tracing';
import { User, IUser } from '../models/user.model';

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
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
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

    try {
      // Convert OpenAI format to Anthropic format
      const systemMessage = messages.find(msg => msg.role === 'system');
      const conversationMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const response = await client.messages.create({
        model,
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
    } catch (error: any) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic API Error: ${error.message}`);
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
    } catch (error: any) {
      console.error('Together AI API Error:', error);
      throw new Error(`Together AI API Error: ${error.message}`);
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
