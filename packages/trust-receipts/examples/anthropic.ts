/**
 * Anthropic Integration Example
 *
 * Demonstrates wrapping Anthropic Claude API calls with Trust Receipts.
 *
 * Run: npx ts-node examples/anthropic.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import { TrustReceipts, Scores } from '../src';

/**
 * Custom scores calculator based on Claude's response
 */
function calculateClaudeScores(prompt: unknown, response: unknown): Scores {
  const text = typeof response === 'string' ? response : '';

  // Simple heuristics (in production, use more sophisticated analysis)
  const wordCount = text.split(/\s+/).length;
  const hasCodeBlock = text.includes('```');

  return {
    // Clarity: longer, structured responses tend to be clearer
    clarity: Math.min(0.5 + wordCount / 200, 0.98),
    // Quality: code blocks and reasonable length indicate quality
    quality: Math.min(0.7 + (hasCodeBlock ? 0.1 : 0) + wordCount / 500, 0.95),
  };
}

async function main() {
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Initialize Trust Receipts with custom scores calculator
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultAgentId: 'claude-3-sonnet',
    calculateScores: calculateClaudeScores,
  });

  console.log('Public Key:', await receipts.getPublicKey());

  // Example 1: Basic wrapped call
  console.log('\n--- Example 1: Basic Wrapped Call ---\n');

  const messages1 = [{ role: 'user' as const, content: 'Explain the concept of trust in AI systems.' }];

  const { response: response1, receipt: receipt1 } = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 256,
        messages: messages1,
      }),
    {
      sessionId: 'claude-demo-1',
      input: messages1,
    }
  );

  const text1 =
    response1.content[0].type === 'text' ? response1.content[0].text : '[non-text content]';

  console.log('Claude Response:', text1.substring(0, 200) + '...');
  console.log('Receipt Hash:', receipt1.receiptHash);
  console.log('Prompt Hash:', receipt1.promptHash);
  console.log('Response Hash:', receipt1.responseHash);
  console.log('Calculated Scores:', receipt1.scores);

  // Example 2: Chained conversation with metadata
  console.log('\n--- Example 2: Chained Conversation ---\n');

  const messages2 = [
    { role: 'user' as const, content: 'What are the ethical considerations for using AI in healthcare?' },
  ];

  const { response: response2, receipt: receipt2 } = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 256,
        system:
          'You are a helpful assistant that prioritizes safety and accuracy. ' +
          'Always acknowledge uncertainty when present.',
        messages: messages2,
      }),
    {
      sessionId: 'claude-demo-1',
      input: messages2,
      previousReceipt: receipt1,
      metadata: {
        topic: 'ai-ethics',
        hasSystemPrompt: true,
      },
    }
  );

  console.log('Chain Valid:', receipt2.prevReceiptHash === receipt1.receiptHash);
  console.log('Agent ID:', receipt2.agentId);
  console.log('Metadata:', receipt2.metadata);

  // Example 3: Streaming with manual receipt creation
  console.log('\n--- Example 3: Streaming Support ---\n');

  // For streaming, create receipt after stream completes
  const streamPrompt = [{ role: 'user' as const, content: 'Write a haiku about cryptography.' }];
  let fullResponse = '';

  const stream = anthropic.messages.stream({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 256,
    messages: streamPrompt,
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
    prompt: streamPrompt,
    response: fullResponse,
    previousReceipt: receipt2,
    scores: {
      creativity: 0.9,
      brevity: 0.95,
    },
    metadata: {
      streamedResponse: true,
      responseLength: fullResponse.length,
    },
  });

  console.log('Streaming Receipt Hash:', receipt3.receiptHash);

  // Verify entire chain
  console.log('\n--- Chain Verification ---\n');

  const verification = await receipts.verifyChain([receipt1, receipt2, receipt3]);
  console.log('Full Chain Valid:', verification.valid);
  console.log('Total Receipts:', 3);

  if (verification.errors.length > 0) {
    console.log('Errors:', verification.errors);
  }
}

main().catch(console.error);
