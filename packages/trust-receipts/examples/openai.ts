/**
 * OpenAI Integration Example
 *
 * Demonstrates wrapping OpenAI API calls with Trust Receipts.
 *
 * Run: npx ts-node examples/openai.ts
 */

import OpenAI from 'openai';
import { TrustReceipts, SignedReceipt, Scores } from '../src';

/**
 * Example scores calculator for GPT responses
 *
 * IMPORTANT: This is a placeholder demonstrating the API pattern.
 * In production, implement domain-specific scoring logic such as:
 *
 * - LLM-as-judge evaluation for quality/accuracy
 * - Task-specific success metrics (code passes tests, query returns results)
 * - Human feedback signals (thumbs up/down, ratings)
 * - Retrieval accuracy for RAG applications
 *
 * Scores are user-defined attestations that get cryptographically bound
 * to the receipt - their meaning is determined by your application.
 */
function calculateGptScores(prompt: unknown, response: unknown): Scores {
  // Placeholder: In production, replace with meaningful metrics
  const text = typeof response === 'string' ? response : '';
  const wordCount = text.split(/\s+/).length;

  return {
    // Example: track response length (your app might not need this)
    responseLength: Math.min(wordCount / 100, 1),
    // Example: track structure (your app might use LLM-as-judge instead)
    hasStructure: text.includes('\n') ? 0.9 : 0.5,
  };
}

async function main() {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize Trust Receipts
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultAgentId: 'gpt-4',
    calculateScores: calculateGptScores,
  });

  console.log('Public Key:', await receipts.getPublicKey());

  // Keep track of receipts for chaining
  let previousReceipt: SignedReceipt | undefined;

  // Example 1: Basic wrapped call
  console.log('\n--- Example 1: Basic Wrapped Call ---\n');

  const messages1 = [{ role: 'user' as const, content: 'What is 2 + 2?' }];

  const { response: response1, receipt: receipt1 } = await receipts.wrap(
    () =>
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages1,
        max_tokens: 100,
      }),
    {
      sessionId: 'demo-session-1',
      input: messages1,
    }
  );

  console.log('AI Response:', response1.choices[0].message.content);
  console.log('Receipt Hash:', receipt1.receiptHash);
  console.log('Prompt Hash:', receipt1.promptHash);
  console.log('Response Hash:', receipt1.responseHash);
  console.log('Signature:', receipt1.signature.substring(0, 32) + '...');

  previousReceipt = receipt1;

  // Example 2: Chained call (links to previous receipt)
  console.log('\n--- Example 2: Chained Call ---\n');

  const messages2 = [{ role: 'user' as const, content: 'What is the capital of France?' }];

  const { response: response2, receipt: receipt2 } = await receipts.wrap(
    () =>
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages2,
        max_tokens: 100,
      }),
    {
      sessionId: 'demo-session-1',
      input: messages2,
      previousReceipt,
      metadata: { questionType: 'geography' },
    }
  );

  console.log('AI Response:', response2.choices[0].message.content);
  console.log('Receipt Hash:', receipt2.receiptHash);
  console.log('Previous Hash:', receipt2.prevReceiptHash);
  console.log('Chain Valid:', receipt2.prevReceiptHash === receipt1.receiptHash);

  // Example 3: Verify the chain
  console.log('\n--- Example 3: Chain Verification ---\n');

  const chainResult = await receipts.verifyChain([receipt1, receipt2]);
  console.log('Chain Valid:', chainResult.valid);
  if (chainResult.errors.length > 0) {
    console.log('Errors:', chainResult.errors);
  }

  // Example 4: Custom scores
  console.log('\n--- Example 4: Custom Scores ---\n');

  const messages3 = [{ role: 'user' as const, content: 'Explain quantum computing.' }];

  const { receipt: receipt3 } = await receipts.wrap(
    () =>
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages3,
        max_tokens: 200,
      }),
    {
      sessionId: 'demo-session-1',
      input: messages3,
      previousReceipt: receipt2,
      scores: {
        clarity: 0.95,
        accuracy: 0.98,
        completeness: 0.92,
      },
    }
  );

  console.log('Custom Scores:', receipt3.scores);

  // Export receipts for storage
  console.log('\n--- Receipt JSON (for storage) ---\n');
  console.log(JSON.stringify(receipt1, null, 2));
}

main().catch(console.error);
