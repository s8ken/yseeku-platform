/**
 * wrap() Developer Experience Integration Tests
 *
 * Validates that wrap() provides seamless, error-free integration
 * with popular AI providers (OpenAI, Anthropic, Gemini).
 *
 * Uses node:test runner (matching trust-receipts.test.ts pattern).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { TrustReceipts } from '../index';
import type { SignedReceipt } from '../index';

describe('wrap() Developer Experience', () => {
  // ── OpenAI Integration ──────────────────────────────────────────────

  describe('OpenAI Integration', () => {
    it('should wrap OpenAI chat completion', async () => {
      const receipts = new TrustReceipts();

      const mockOpenAIResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'The capital of France is Paris.' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockOpenAIResponse,
        {
          sessionId: 'openai-test',
          input: { role: 'user', content: 'What is the capital of France?' },
          agentId: 'gpt-4',
        },
      );

      assert.strictEqual(response, mockOpenAIResponse);
      assert.ok(receipt, 'Receipt should be defined');
      assert.strictEqual(receipt.agentId, 'gpt-4');
      assert.ok(receipt.scores);
      assert.ok(receipt.receiptHash);
    });

    it('should wrap OpenAI streaming-like response', async () => {
      const receipts = new TrustReceipts();

      const mockStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'The' } }] };
          yield { choices: [{ delta: { content: ' capital' } }] };
          yield { choices: [{ delta: { content: ' is' } }] };
          yield { choices: [{ delta: { content: ' Paris.' } }] };
        },
      };

      const { receipt } = await receipts.wrap(
        async () => mockStreamResponse,
        {
          sessionId: 'openai-stream-test',
          input: { role: 'user', content: 'Capitals?' },
        },
      );

      assert.ok(receipt, 'Receipt should be defined');
      assert.ok(receipt.responseHash, 'Should have responseHash');
    });

    it('should handle OpenAI errors gracefully', async () => {
      const receipts = new TrustReceipts();
      const mockError = new Error('API rate limit exceeded');

      await assert.rejects(
        () =>
          receipts.wrap(
            async () => {
              throw mockError;
            },
            {
              sessionId: 'openai-error-test',
              input: { role: 'user', content: 'test' },
            },
          ),
        { message: 'API rate limit exceeded' },
      );
    });
  });

  // ── Anthropic Integration ───────────────────────────────────────────

  describe('Anthropic Integration', () => {
    it('should wrap Anthropic message creation', async () => {
      const receipts = new TrustReceipts();

      const mockAnthropicResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'The capital of France is Paris.' }],
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 15 },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockAnthropicResponse,
        {
          sessionId: 'anthropic-test',
          input: { role: 'user', content: 'What is the capital of France?' },
          agentId: 'claude-3-haiku',
        },
      );

      assert.strictEqual(response, mockAnthropicResponse);
      assert.ok(receipt, 'Receipt should be defined');
      assert.strictEqual(receipt.agentId, 'claude-3-haiku');
    });

    it('should wrap Anthropic streaming response', async () => {
      const receipts = new TrustReceipts();

      const mockStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Paris.' } };
        },
      };

      const { receipt } = await receipts.wrap(
        async () => mockStreamResponse,
        {
          sessionId: 'anthropic-stream-test',
          input: { role: 'user', content: 'Capital?' },
        },
      );

      assert.ok(receipt, 'Receipt should be defined');
    });
  });

  // ── Google Gemini Integration ───────────────────────────────────────

  describe('Google Gemini Integration', () => {
    it('should wrap Gemini generateContent', async () => {
      const receipts = new TrustReceipts();

      const mockGeminiResponse = {
        candidates: [
          {
            content: { parts: [{ text: 'The capital of France is Paris.' }], role: 'model' },
            finishReason: 'STOP',
            index: 0,
          },
        ],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 15, totalTokenCount: 25 },
      };

      const { response, receipt } = await receipts.wrap(
        async () => mockGeminiResponse,
        {
          sessionId: 'gemini-test',
          input: { role: 'user', content: 'What is the capital of France?' },
        },
      );

      assert.strictEqual(response, mockGeminiResponse);
      assert.ok(receipt, 'Receipt should be defined');
    });

    it('should handle Gemini streaming', async () => {
      const receipts = new TrustReceipts();

      const mockStreamResponse = {
        async *[Symbol.asyncIterator]() {
          yield { candidates: [{ content: { parts: [{ text: 'Paris.' }] } }] };
        },
      };

      const { receipt } = await receipts.wrap(
        async () => mockStreamResponse,
        {
          sessionId: 'gemini-stream-test',
          input: { role: 'user', content: 'Capital?' },
        },
      );

      assert.ok(receipt, 'Receipt should be defined');
    });
  });

  // ── Custom Function Integration ─────────────────────────────────────

  describe('Custom Function Integration', () => {
    it('should wrap custom async functions', async () => {
      const receipts = new TrustReceipts();

      const customAI = async () => ({ success: true, data: 'custom response' });

      const { response, receipt } = await receipts.wrap(customAI, {
        sessionId: 'custom-test',
        input: { role: 'user', content: 'test' },
      });

      assert.strictEqual(response.success, true);
      assert.ok(receipt, 'Receipt should be defined');
    });

    it('should wrap synchronous functions as async', async () => {
      const receipts = new TrustReceipts();
      const syncFn = () => 'sync response';

      const { response, receipt } = await receipts.wrap(async () => syncFn(), {
        sessionId: 'sync-test',
        input: { role: 'user', content: 'test' },
      });

      assert.strictEqual(response, 'sync response');
      assert.ok(receipt, 'Receipt should be defined');
    });

    it('should handle functions with side effects', async () => {
      const receipts = new TrustReceipts();
      let sideEffectRan = false;

      const fnWithSideEffect = async () => {
        sideEffectRan = true;
        return 'result';
      };

      const { response } = await receipts.wrap(fnWithSideEffect, {
        sessionId: 'side-effect-test',
        input: { role: 'user', content: 'test' },
      });

      assert.strictEqual(sideEffectRan, true);
      assert.strictEqual(response, 'result');
    });
  });

  // ── Options Validation ──────────────────────────────────────────────

  describe('Options Validation', () => {
    it('should accept basic options with sessionId and input', async () => {
      const receipts = new TrustReceipts();

      const { receipt } = await receipts.wrap(async () => 'response', {
        sessionId: 'minimal-test',
        input: 'test prompt',
      });

      assert.ok(receipt, 'Receipt should be defined');
      assert.strictEqual(receipt.sessionId, 'minimal-test');
    });

    it('should accept full options', async () => {
      const receipts = new TrustReceipts();

      // First receipt for chaining
      const { receipt: prevReceipt } = await receipts.wrap(async () => 'prev', {
        sessionId: 'full-test',
        input: 'prev prompt',
      });

      const { receipt } = await receipts.wrap(async () => 'response', {
        sessionId: 'full-test',
        input: { role: 'user', content: 'test' },
        includeContent: true,
        previousReceipt: prevReceipt,
        agentId: 'test-agent',
        metadata: { custom: 'data' },
      });

      assert.ok(receipt, 'Receipt should be defined');
      assert.strictEqual(receipt.sessionId, 'full-test');
      assert.strictEqual(receipt.agentId, 'test-agent');
      assert.strictEqual(receipt.metadata.custom, 'data');
    });

    it('should handle special characters in sessionId', async () => {
      const receipts = new TrustReceipts();

      const specialIds = [
        'session-with-dashes',
        'session_with_underscores',
        'session.with.dots',
        'session:with:colons',
      ];

      for (const id of specialIds) {
        const { receipt } = await receipts.wrap(async () => 'response', {
          sessionId: id,
          input: 'prompt',
        });
        assert.strictEqual(receipt.sessionId, id);
      }
    });

    it('should handle large metadata', async () => {
      const receipts = new TrustReceipts();

      const largeMetadata = {
        tokens: { input: 1000, output: 2000, total: 3000 },
        timing: { start: Date.now(), duration: 1234 },
        tags: Array(100)
          .fill('tag')
          .map((t, i) => `${t}${i}`),
      };

      const { receipt } = await receipts.wrap(async () => 'response', {
        sessionId: 'large-metadata-test',
        input: 'prompt',
        metadata: largeMetadata,
      });

      assert.deepStrictEqual(receipt.metadata, largeMetadata);
    });
  });

  // ── Return Value Semantics ──────────────────────────────────────────

  describe('Return Value Semantics', () => {
    it('should return original response unchanged', async () => {
      const receipts = new TrustReceipts();
      const originalResponse = { data: 'value', nested: { field: 123 } };

      const { response } = await receipts.wrap(async () => originalResponse, {
        sessionId: 'unchanged-test',
        input: 'prompt',
      });

      assert.strictEqual(response, originalResponse);
      assert.deepStrictEqual(response, { data: 'value', nested: { field: 123 } });
    });

    it('should not modify response during wrapping', async () => {
      const receipts = new TrustReceipts();
      const original = { x: 1 };

      await receipts.wrap(async () => original, {
        sessionId: 'mutation-test',
        input: 'prompt',
      });

      assert.deepStrictEqual(Object.keys(original), ['x']);
    });

    it('should preserve response types (String, Number, Object, Array, null)', async () => {
      const receipts = new TrustReceipts();

      const testCases = ['string response', 123, { object: true }, ['array', 'response'], null];

      for (const testCase of testCases) {
        const { response } = await receipts.wrap(async () => testCase, {
          sessionId: 'type-test',
          input: 'prompt',
        });
        assert.strictEqual(response, testCase);
      }
    });
  });

  // ── Multi-Turn Conversations ────────────────────────────────────────

  describe('Multi-Turn Conversations', () => {
    it('should chain receipts in conversation', async () => {
      const receipts = new TrustReceipts();
      const sessionId = 'conversation-test';
      const receiptsList: SignedReceipt[] = [];

      // Turn 1
      const turn1 = await receipts.wrap(async () => 'Yes, Paris is the capital.', {
        sessionId,
        input: 'Is Paris a capital?',
      });
      receiptsList.push(turn1.receipt);

      // Turn 2 (chained)
      const turn2 = await receipts.wrap(async () => 'It is in France.', {
        sessionId,
        input: 'Where is Paris?',
        previousReceipt: turn1.receipt,
      });
      receiptsList.push(turn2.receipt);

      // Turn 3 (chained)
      const turn3 = await receipts.wrap(async () => 'Population is about 2 million.', {
        sessionId,
        input: 'Population?',
        previousReceipt: turn2.receipt,
      });
      receiptsList.push(turn3.receipt);

      // Verify chain
      assert.strictEqual(receiptsList[0].prevReceiptHash, null);
      assert.strictEqual(receiptsList[1].prevReceiptHash, receiptsList[0].receiptHash);
      assert.strictEqual(receiptsList[2].prevReceiptHash, receiptsList[1].receiptHash);
    });

    it('should support parallel turns in different sessions', async () => {
      const receipts = new TrustReceipts();

      const parallel = await Promise.all([
        receipts.wrap(async () => 'Response A', { sessionId: 'session-a', input: 'prompt a' }),
        receipts.wrap(async () => 'Response B', { sessionId: 'session-b', input: 'prompt b' }),
        receipts.wrap(async () => 'Response C', { sessionId: 'session-c', input: 'prompt c' }),
      ]);

      assert.strictEqual(parallel.length, 3);
      parallel.forEach((result, i) => {
        assert.ok(result.receipt, 'Receipt should be defined');
        assert.strictEqual(result.response, `Response ${String.fromCharCode(65 + i)}`);
      });
    });
  });

  // ── Error Handling ──────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should propagate wrapped function errors', async () => {
      const receipts = new TrustReceipts();
      const error = new Error('Custom error message');

      await assert.rejects(
        () =>
          receipts.wrap(
            async () => {
              throw error;
            },
            { sessionId: 'error-test', input: 'prompt' },
          ),
        { message: 'Custom error message' },
      );
    });

    it('should handle timeout errors', async () => {
      const receipts = new TrustReceipts();

      await assert.rejects(
        () =>
          receipts.wrap(
            () =>
              new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 100);
              }),
            { sessionId: 'timeout-test', input: 'prompt' },
          ),
        { message: 'Timeout' },
      );
    });

    it('should handle null/undefined returns', async () => {
      const receipts = new TrustReceipts();

      const nullResult = await receipts.wrap(async () => null, {
        sessionId: 'null-test',
        input: 'prompt',
      });
      assert.strictEqual(nullResult.response, null);
      assert.ok(nullResult.receipt, 'Receipt should be defined');

      const undefinedResult = await receipts.wrap(async () => undefined, {
        sessionId: 'undefined-test',
        input: 'prompt',
      });
      assert.strictEqual(undefinedResult.response, undefined);
      assert.ok(undefinedResult.receipt, 'Receipt should be defined');
    });
  });

  // ── Performance Baseline ────────────────────────────────────────────

  describe('Performance Baseline', () => {
    it('should wrap() in <100ms overhead', async () => {
      const receipts = new TrustReceipts();

      const start = performance.now();
      await receipts.wrap(async () => 'fast response', {
        sessionId: 'perf-test',
        input: 'prompt',
      });
      const duration = performance.now() - start;

      assert.ok(duration < 100, `wrap() took ${duration.toFixed(1)}ms, expected <100ms`);
    });

    it('should handle large responses <500ms', async () => {
      const receipts = new TrustReceipts();
      const largeResponse = JSON.stringify({
        data: Array(1000).fill({ field: 'value' }),
      });

      const start = performance.now();
      await receipts.wrap(async () => largeResponse, {
        sessionId: 'large-response-test',
        input: 'prompt',
      });
      const duration = performance.now() - start;

      assert.ok(duration < 500, `Large wrap() took ${duration.toFixed(1)}ms, expected <500ms`);
    });
  });

  // ── TypeScript Type Safety ──────────────────────────────────────────

  describe('TypeScript Type Safety', () => {
    it('should maintain type safety with generics', async () => {
      const receipts = new TrustReceipts();

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
        input: 'prompt',
      });

      // TypeScript enforces these types at compile time
      assert.strictEqual(response.success, true);
      assert.strictEqual(response.message, 'typed response');
      assert.ok(receipt, 'Receipt should be defined');
    });
  });
});
