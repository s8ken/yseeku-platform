/**
 * Anthropic Integration Example
 *
 * Demonstrates wrapping Anthropic Claude API calls with Trust Receipts.
 *
 * Run: npx ts-node examples/anthropic.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import { TrustReceipts, SignedReceipt, QualityMetrics } from '../src';

/**
 * Custom metrics calculator based on Claude's response
 */
function calculateClaudeMetrics(response: Anthropic.Message): QualityMetrics {
  // Extract useful signals from the response
  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  // Simple heuristics (in production, use more sophisticated analysis)
  const wordCount = text.split(/\s+/).length;
  const hasCodeBlock = text.includes('```');
  const stopReason = response.stop_reason;

  return {
    // Clarity: longer, structured responses tend to be clearer
    clarity: Math.min(0.5 + wordCount / 200, 0.98),
    // Integrity: natural stop is better than hitting limits
    integrity: stopReason === 'end_turn' ? 0.95 : 0.75,
    // Quality: code blocks and reasonable length indicate quality
    quality: Math.min(0.7 + (hasCodeBlock ? 0.1 : 0) + wordCount / 500, 0.95),
  };
}

async function main() {
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Initialize Trust Receipts with custom metrics calculator
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultMode: 'constitutional',
    calculateMetrics: calculateClaudeMetrics as (response: unknown) => QualityMetrics,
  });

  console.log('Public Key:', await receipts.getPublicKey());

  // Example 1: Basic wrapped call
  console.log('\n--- Example 1: Basic Wrapped Call ---\n');

  const { response: response1, receipt: receipt1 } = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 256,
        messages: [{ role: 'user', content: 'Explain the concept of trust in AI systems.' }],
      }),
    { sessionId: 'claude-demo-1' }
  );

  const text1 =
    response1.content[0].type === 'text' ? response1.content[0].text : '[non-text content]';

  console.log('Claude Response:', text1.substring(0, 200) + '...');
  console.log('Receipt Hash:', receipt1.selfHash);
  console.log('Calculated Metrics:', receipt1.metrics);

  // Example 2: Constitutional mode with chaining
  console.log('\n--- Example 2: Constitutional Mode ---\n');

  const { response: response2, receipt: receipt2 } = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 256,
        system:
          'You are a helpful assistant that prioritizes safety and accuracy. ' +
          'Always acknowledge uncertainty when present.',
        messages: [
          {
            role: 'user',
            content: 'What are the ethical considerations for using AI in healthcare?',
          },
        ],
      }),
    {
      sessionId: 'claude-demo-1',
      mode: 'constitutional',
      previousReceipt: receipt1,
      metadata: {
        systemPromptHash: 'sha256:abc123...',
        topic: 'ai-ethics',
      },
    }
  );

  console.log('Chain Valid:', receipt2.previousHash === receipt1.selfHash);
  console.log('Mode:', receipt2.mode);
  console.log('Metadata:', receipt2.metadata);

  // Example 3: Streaming with manual receipt creation
  console.log('\n--- Example 3: Streaming Support ---\n');

  // For streaming, create receipt after stream completes
  let fullResponse = '';

  const stream = anthropic.messages.stream({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 256,
    messages: [{ role: 'user', content: 'Write a haiku about cryptography.' }],
  });

  process.stdout.write('Streaming: ');
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text);
      fullResponse += event.delta.text;
    }
  }
  console.log('\n');

  // Create receipt manually after streaming
  const receipt3 = await receipts.createReceipt({
    sessionId: 'claude-demo-1',
    previousReceipt: receipt2,
    metrics: {
      clarity: 0.9,
      integrity: 0.95,
      quality: 0.88,
    },
    metadata: {
      streamedResponse: true,
      responseLength: fullResponse.length,
    },
  });

  console.log('Streaming Receipt Hash:', receipt3.selfHash);

  // Verify entire chain
  console.log('\n--- Chain Verification ---\n');

  const verification = await receipts.verifyChain([receipt1, receipt2, receipt3]);
  console.log('Full Chain Valid:', verification.valid);
  console.log('Total Receipts:', 3);
}

main().catch(console.error);
