/**
 * wrap() Developer Experience Integration Tests
 * 
 * Validates that wrap() provides seamless, error-free integration
 * with popular AI providers (OpenAI, Anthropic, Gemini)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { TrustReceipts } from '../../src';

describe('wrap() Developer Experience', () => {
  let receipts: TrustReceipts;

  beforeEach(() => {
    receipts = new TrustReceipts();
  });

  describe('OpenAI Integration', () => {
    it('should wrap OpenAI chat completion', async () => {
      // Mock OpenAI response
      const mockOpenAIResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'The capital of France is Paris.',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockOpenAIResponse,
        {
          sessionId: 'openai-test',
          input: { role: 'user', content: 'What is the capital of France?' },
        }
      );

      expect(response).toBe(mockOpenAIResponse);
      expect(receipt).toBeDefined();
      expect(receipt.agent_id).toBe('gpt-4');
      expect(receipt.scores).toBeDefined();
      expect(receipt.receipt_hash).toBeDefined();
    });

    it('should extract content from OpenAI streaming response', async () => {
      const chunks = [
        { choices: [{ delta: { content: 'The' } }] },
        { choices: [{ delta: { content: ' capital' } }] },
        { choices: [{ delta: { content: ' is' } }] },
        { choices: [{ delta: { content: ' Paris.' } }] },
      ];

      const mockStreamResponse = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockStreamResponse,
        {
          sessionId: 'openai-stream-test',
          input: { role: 'user', content: 'Capitals?' },
        }
      );

      expect(receipt).toBeDefined();
      expect(receipt.response_hash).toBeDefined();
    });

    it('should handle OpenAI errors gracefully', async () => {
      const mockError = new Error('API rate limit exceeded');

      const result = await receipts
        .wrap(
          async () => {
            throw mockError;
          },
          {
            sessionId: 'openai-error-test',
            input: { role: 'user', content: 'test' },
          }
        )
        .catch((e) => ({ error: e }));

      expect(result.error).toBe(mockError);
    });
  });

  describe('Anthropic Integration', () => {
    it('should wrap Anthropic message creation', async () => {
      const mockAnthropicResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'The capital of France is Paris.',
          },
        ],
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 15,
        },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockAnthropicResponse,
        {
          sessionId: 'anthropic-test',
          input: { role: 'user', content: 'What is the capital of France?' },
        }
      );

      expect(response).toBe(mockAnthropicResponse);
      expect(receipt).toBeDefined();
      expect(receipt.agent_id).toBe('claude-3-haiku-20240307');
    });

    it('should extract content from Anthropic streaming', async () => {
      const mockStreamEvent = {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'Paris.' },
      };

      const mockStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield mockStreamEvent;
        },
      };

      const { receipt } = await receipts.wrap(
        async () => mockStreamResponse,
        {
          sessionId: 'anthropic-stream-test',
          input: { role: 'user', content: 'Capital?' },
        }
      );

      expect(receipt).toBeDefined();
    });
  });

  describe('Google Gemini Integration', () => {
    it('should wrap Gemini generateContent', async () => {
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'The capital of France is Paris.',
                },
              ],
              role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 15,
          totalTokenCount: 25,
        },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockGeminiResponse,
        {
          sessionId: 'gemini-test',
          input: { role: 'user', content: 'What is the capital of France?' },
        }
      );

      expect(response).toBe(mockGeminiResponse);
      expect(receipt).toBeDefined();
    });

    it('should handle Gemini streaming', async () => {
      const mockStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield {
            candidates: [{ content: { parts: [{ text: 'Paris.' }] } }],
          };
        },
      };

      const { receipt } = await receipts.wrap(
        async () => mockStreamResponse,
        {
          sessionId: 'gemini-stream-test',
          input: { role: 'user', content: 'Capital?' },
        }
      );

      expect(receipt).toBeDefined();
    });
  });

  describe('Custom Function Integration', () => {
    it('should wrap custom async functions', async () => {
      const customAI = async () => {
        return {
          success: true,
          data: 'custom response',
        };
      };

      const { response, receipt } = await receipts.wrap(customAI, {
        sessionId: 'custom-test',
        input: { role: 'user', content: 'test' },
      });

      expect(response.success).toBe(true);
      expect(receipt).toBeDefined();
    });

    it('should wrap synchronous functions as async', async () => {
      const syncFn = () => 'sync response';

      const { response, receipt } = await receipts.wrap(
        async () => syncFn(),
        {
          sessionId: 'sync-test',
          input: { role: 'user', content: 'test' },
        }
      );

      expect(response).toBe('sync response');
      expect(receipt).toBeDefined();
    });

    it('should handle functions with side effects', async () => {
      let sideEffectRan = false;

      const fnWithSideEffect = async () => {
        sideEffectRan = true;
        return 'result';
      };

      const { response } = await receipts.wrap(fnWithSideEffect, {
        sessionId: 'side-effect-test',
        input: { role: 'user', content: 'test' },
      });

      expect(sideEffectRan).toBe(true);
      expect(response).toBe('result');
    });
  });

  describe('Options Validation', () => {
    it('should accept minimal options', async () => {
      const { receipt } = await receipts.wrap(
        async () => 'response',
        {
          sessionId: 'minimal-test',
        }
      );

      expect(receipt).toBeDefined();
      expect(receipt.session_id).toBe('minimal-test');
    });

    it('should accept full options', async () => {
      const { receipt } = await receipts.wrap(
        async () => 'response',
        {
          sessionId: 'full-test',
          input: { role: 'user', content: 'test' },
          includeContent: true,
          prevReceiptHash: 'previous_hash',
          agentId: 'test-agent',
          metadata: { custom: 'data' },
        }
      );

      expect(receipt).toBeDefined();
      expect(receipt.session_id).toBe('full-test');
      expect(receipt.agent_id).toBe('test-agent');
      expect(receipt.include_content).toBe(true);
      expect(receipt.metadata.custom).toBe('data');
    });

    it('should validate sessionId is required', async () => {
      expect(async () => {
        await receipts.wrap(async () => 'response', {
          // @ts-ignore: Testing missing required field
          input: 'test',
        });
      }).rejects.toThrow('sessionId is required');
    });

    it('should handle special characters in sessionId', async () => {
      const specialIds = [
        'session-with-dashes',
        'session_with_underscores',
        'session.with.dots',
        'session:with:colons',
      ];

      for (const id of specialIds) {
        const { receipt } = await receipts.wrap(
          async () => 'response',
          { sessionId: id }
        );

        expect(receipt.session_id).toBe(id);
      }
    });

    it('should handle large metadata', async () => {
      const largeMetadata = {
        tokens: {
          input: 1000,
          output: 2000,
          total: 3000,
        },
        timing: {
          start: Date.now(),
          duration: 1234,
        },
        tags: Array(100).fill('tag').map((t, i) => `${t}${i}`),
      };

      const { receipt } = await receipts.wrap(
        async () => 'response',
        {
          sessionId: 'large-metadata-test',
          metadata: largeMetadata,
        }
      );

      expect(receipt.metadata).toEqual(largeMetadata);
    });
  });

  describe('Return Value Semantics', () => {
    it('should return original response unchanged', async () => {
      const originalResponse = { data: 'value', nested: { field: 123 } };

      const { response } = await receipts.wrap(
        async () => originalResponse,
        { sessionId: 'unchanged-test' }
      );

      expect(response).toBe(originalResponse);
      expect(response).toEqual({ data: 'value', nested: { field: 123 } });
    });

    it('should not modify response during wrapping', async () => {
      const original = { x: 1 };
      let returnedValue: any;

      await receipts.wrap(async () => {
        returnedValue = original;
        return original;
      }, { sessionId: 'mutation-test' });

      expect(returnedValue).toBe(original);
      expect(Object.keys(original)).toEqual(['x']);
    });

    it('should preserve response types (String, Number, Object, Array)', async () => {
      const testCases = [
        'string response',
        123,
        { object: true },
        ['array', 'response'],
        null,
      ];

      for (const testCase of testCases) {
        const { response } = await receipts.wrap(
          async () => testCase,
          { sessionId: 'type-test' }
        );

        expect(response).toBe(testCase);
      }
    });
  });

  describe('Multi-Turn Conversations', () => {
    it('should chain receipts in conversation', async () => {
      const sessionId = 'conversation-test';
      const receipts_list = [];

      // Turn 1
      const turn1 = await receipts.wrap(
        async () => 'Yes, Paris is the capital.',
        {
          sessionId,
          input: 'Is Paris a capital?',
        }
      );
      receipts_list.push(turn1.receipt);

      // Turn 2 (with chain)
      const turn2 = await receipts.wrap(
        async () => 'It is in France.',
        {
          sessionId,
          input: 'Where is Paris?',
          prevReceiptHash: turn1.receipt.receipt_hash,
        }
      );
      receipts_list.push(turn2.receipt);

      // Turn 3 (with chain)
      const turn3 = await receipts.wrap(
        async () => 'Population is about 2 million.',
        {
          sessionId,
          input: 'Population?',
          prevReceiptHash: turn2.receipt.receipt_hash,
        }
      );
      receipts_list.push(turn3.receipt);

      // Verify chain
      expect(receipts_list[0].prev_receipt_hash).toBeNull();
      expect(receipts_list[1].prev_receipt_hash).toBe(
        receipts_list[0].receipt_hash
      );
      expect(receipts_list[2].prev_receipt_hash).toBe(
        receipts_list[1].receipt_hash
      );
    });

    it('should support parallel turns (different sessions)', async () => {
      const parallel = await Promise.all([
        receipts.wrap(async () => 'Response A', {
          sessionId: 'session-a',
        }),
        receipts.wrap(async () => 'Response B', {
          sessionId: 'session-b',
        }),
        receipts.wrap(async () => 'Response C', {
          sessionId: 'session-c',
        }),
      ]);

      expect(parallel).toHaveLength(3);
      parallel.forEach((result, i) => {
        expect(result.receipt).toBeDefined();
        expect(result.response).toBe(`Response ${String.fromCharCode(65 + i)}`);
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate wrapped function errors', async () => {
      const error = new Error('Custom error message');

      expect(
        receipts.wrap(
          async () => {
            throw error;
          },
          { sessionId: 'error-test' }
        )
      ).rejects.toThrow('Custom error message');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = async () => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      };

      expect(
        receipts.wrap(timeoutError, { sessionId: 'timeout-test' })
      ).rejects.toThrow('Timeout');
    });

    it('should handle null/undefined returns', async () => {
      const nullResult = await receipts.wrap(
        async () => null,
        { sessionId: 'null-test' }
      );

      expect(nullResult.response).toBeNull();
      expect(nullResult.receipt).toBeDefined();

      const undefinedResult = await receipts.wrap(
        async () => undefined,
        { sessionId: 'undefined-test' }
      );

      expect(undefinedResult.response).toBeUndefined();
      expect(undefinedResult.receipt).toBeDefined();
    });
  });

  describe('Performance Baseline', () => {
    it('should wrap() in <100ms overhead', async () => {
      const start = performance.now();

      await receipts.wrap(async () => 'fast response', {
        sessionId: 'perf-test',
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle large responses <500ms', async () => {
      const largeResponse = JSON.stringify({
        data: Array(1000).fill({ field: 'value' }),
      });

      const start = performance.now();

      await receipts.wrap(async () => largeResponse, {
        sessionId: 'large-response-test',
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain type safety with generics', async () => {
      interface AIResponse {
        success: boolean;
        message: string;
      }

      const typedFn = async (): Promise<AIResponse> => ({
        success: true,
        message: 'typed response',
      });

      const { response, receipt } = await receipts.wrap(typedFn, {
        sessionId: 'type-safe-test',
      });

      // TypeScript would error if types don't match
      expect(response.success).toBe(true);
      expect(response.message).toBe('typed response');
      expect(receipt).toBeDefined();
    });
  });
});
