/**
 * OpenAI Integration Example
 *
 * Demonstrates wrapping OpenAI API calls with Trust Receipts.
 *
 * Run: npx ts-node examples/openai.ts
 */

import OpenAI from 'openai';
import { TrustReceipts, SignedReceipt } from '../src';

async function main() {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize Trust Receipts
  // In production, use a persistent private key from environment
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultMode: 'constitutional',
  });

  console.log('Public Key:', await receipts.getPublicKey());

  // Keep track of receipts for chaining
  let previousReceipt: SignedReceipt | undefined;

  // Example 1: Basic wrapped call
  console.log('\n--- Example 1: Basic Wrapped Call ---\n');

  const { response: response1, receipt: receipt1 } = await receipts.wrap(
    () =>
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'What is 2 + 2?' }],
        max_tokens: 100,
      }),
    { sessionId: 'demo-session-1' }
  );

  console.log('AI Response:', response1.choices[0].message.content);
  console.log('Receipt Hash:', receipt1.selfHash);
  console.log('Signature:', receipt1.signature.substring(0, 32) + '...');

  previousReceipt = receipt1;

  // Example 2: Chained call (links to previous receipt)
  console.log('\n--- Example 2: Chained Call ---\n');

  const { response: response2, receipt: receipt2 } = await receipts.wrap(
    () =>
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'What is the capital of France?' }],
        max_tokens: 100,
      }),
    {
      sessionId: 'demo-session-1',
      previousReceipt,
      metadata: { questionType: 'geography' },
    }
  );

  console.log('AI Response:', response2.choices[0].message.content);
  console.log('Receipt Hash:', receipt2.selfHash);
  console.log('Previous Hash:', receipt2.previousHash);
  console.log('Chain Valid:', receipt2.previousHash === receipt1.selfHash);

  // Example 3: Verify the chain
  console.log('\n--- Example 3: Chain Verification ---\n');

  const chainResult = await receipts.verifyChain([receipt1, receipt2]);
  console.log('Chain Valid:', chainResult.valid);
  if (chainResult.errors.length > 0) {
    console.log('Errors:', chainResult.errors);
  }

  // Example 4: Custom metrics
  console.log('\n--- Example 4: Custom Metrics ---\n');

  const { receipt: receipt3 } = await receipts.wrap(
    () =>
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Explain quantum computing.' }],
        max_tokens: 200,
      }),
    {
      sessionId: 'demo-session-1',
      previousReceipt: receipt2,
      metrics: {
        clarity: 0.95,
        integrity: 0.98,
        quality: 0.92,
      },
    }
  );

  console.log('Custom Metrics:', receipt3.metrics);

  // Export receipts for storage
  console.log('\n--- Receipt JSON (for storage) ---\n');
  console.log(JSON.stringify(receipt1, null, 2));
}

main().catch(console.error);
