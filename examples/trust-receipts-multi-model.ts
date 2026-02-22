/**
 * SONATE Trust Receipts - Multi-Model Examples
 *
 * Shows how to wrap AI calls from different providers
 * All produce identical receipt structures for cross-platform compatibility
 */

// ============================================================================
// OPENAI EXAMPLE
// ============================================================================

import { TrustReceipts } from '@sonate/trust-receipts';
import OpenAI from 'openai';

async function exampleOpenAI() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultAgentId: 'gpt-4-turbo',
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages = [
    { role: 'user' as const, content: 'Explain the SONATE trust framework' },
  ];

  try {
    const { response, receipt } = await receipts.wrap(
      () =>
        openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      {
        sessionId: 'openai-session-1',
        input: messages,
        scores: {
          clarity: 0.9,
          accuracy: 0.85,
          safety: 0.95,
        },
      }
    );

    console.log('OpenAI Response:', response.choices[0].message.content);
    console.log('Receipt Hash:', receipt.receiptHash);
    console.log('Signature:', receipt.signature);
  } catch (error) {
    console.error('OpenAI call failed:', error);
    // Fallback: use mock response
  }
}

// ============================================================================
// ANTHROPIC (CLAUDE) EXAMPLE
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';

async function exampleAnthropic() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultAgentId: 'claude-3-sonnet',
  });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const messages = [
    { role: 'user' as const, content: 'What is cryptographic trust?' },
  ];

  try {
    const { response, receipt } = await receipts.wrap(
      () =>
        anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages,
        }),
      {
        sessionId: 'claude-session-1',
        input: messages,
        scores: {
          clarity: 0.92,
          depth: 0.88,
          safety: 0.98,
        },
      }
    );

    console.log('Claude Response:', response.content[0].type === 'text' ? response.content[0].text : 'Non-text response');
    console.log('Receipt Hash:', receipt.receiptHash);
  } catch (error) {
    console.error('Claude call failed:', error);
  }
}

// ============================================================================
// GOOGLE GEMINI EXAMPLE
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

async function exampleGemini() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultAgentId: 'gemini-pro',
  });

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = 'Explain trust receipts for AI systems';

  try {
    const { response, receipt } = await receipts.wrap(
      async () => {
        const result = await model.generateContent(prompt);
        return {
          text: result.response.text(),
        };
      },
      {
        sessionId: 'gemini-session-1',
        input: prompt,
        scores: {
          clarity: 0.87,
          coherence: 0.90,
        },
      }
    );

    console.log('Gemini Response:', response.text);
    console.log('Receipt Hash:', receipt.receiptHash);
  } catch (error) {
    console.error('Gemini call failed:', error);
  }
}

// ============================================================================
// LOCAL LLM EXAMPLE (Ollama)
// ============================================================================

import axios from 'axios';

async function exampleLocalLLM() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
    defaultAgentId: 'local-mistral',
  });

  const prompt = 'What are the benefits of cryptographic receipts?';

  try {
    const { response, receipt } = await receipts.wrap(
      async () => {
        const res = await axios.post('http://localhost:11434/api/generate', {
          model: 'mistral',
          prompt,
          stream: false,
        });
        return {
          text: res.data.response,
        };
      },
      {
        sessionId: 'local-llm-session-1',
        input: prompt,
        scores: {
          clarity: 0.85,
          speed: 0.95, // Local = fast
        },
      }
    );

    console.log('Local LLM Response:', response.text);
    console.log('Receipt Hash:', receipt.receiptHash);
  } catch (error) {
    console.error('Local LLM call failed:', error);
  }
}

// ============================================================================
// STREAMING EXAMPLE (Claude with streaming)
// ============================================================================

async function exampleStreaming() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
  });

  const anthropic = new Anthropic();
  const messages = [
    { role: 'user' as const, content: 'Explain AI trust in 3 paragraphs' },
  ];

  let accumulatedResponse = '';

  try {
    // Stream the response
    const stream = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        accumulatedResponse += chunk.delta.text;
        process.stdout.write(chunk.delta.text);
      }
    }

    // Create receipt for accumulated response
    const receipt = await receipts.createReceipt({
      sessionId: 'streaming-session-1',
      prompt: messages,
      response: accumulatedResponse,
      agentId: 'claude-3-sonnet-streaming',
      scores: {
        completeness: 0.95,
        accuracy: 0.90,
      },
    });

    console.log('\n\nReceipt Hash:', receipt.receiptHash);
    console.log('Response captured in cryptographic receipt');
  } catch (error) {
    console.error('Streaming example failed:', error);
  }
}

// ============================================================================
// ERROR HANDLING & FALLBACK EXAMPLE
// ============================================================================

async function exampleWithErrorHandling() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages = [{ role: 'user' as const, content: 'Hello' }];

  try {
    const { response, receipt } = await receipts.wrap(
      async () => {
        try {
          return await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages,
            timeout: 30000, // 30 second timeout
          });
        } catch (apiError: any) {
          // API error - log and provide fallback
          console.error('API Error:', apiError.message);

          if (apiError.status === 429) {
            throw new Error('Rate limited - waiting before retry');
          }

          if (apiError.status === 401) {
            throw new Error('Authentication failed - check API key');
          }

          // Fallback response
          return {
            choices: [
              {
                message: {
                  content: 'I encountered an error processing your request. Please try again.',
                },
              },
            ],
          };
        }
      },
      {
        sessionId: 'error-handling-session',
        input: messages,
      }
    );

    console.log('Response:', response.choices[0].message.content);
    console.log('Receipt:', receipt.receiptHash);
  } catch (error) {
    console.error('Unrecoverable error:', error);
  }
}

// ============================================================================
// HASH CHAINING EXAMPLE (Multi-turn conversation)
// ============================================================================

async function exampleHashChaining() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
  });

  const anthropic = new Anthropic();
  let previousReceipt = null;

  // Turn 1
  const turn1 = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 512,
        messages: [{ role: 'user', content: 'What is SONATE?' }],
      }),
    {
      sessionId: 'chain-conversation',
      input: 'What is SONATE?',
    }
  );

  console.log('Turn 1 Hash:', turn1.receipt.receiptHash);
  previousReceipt = turn1.receipt;

  // Turn 2 - chain to Turn 1
  const turn2 = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 512,
        messages: [
          { role: 'user', content: 'What is SONATE?' },
          { role: 'assistant', content: turn1.response.content[0].type === 'text' ? turn1.response.content[0].text : '' },
          { role: 'user', content: 'How does it work?' },
        ],
      }),
    {
      sessionId: 'chain-conversation',
      input: 'How does it work?',
      previousReceipt: previousReceipt,
    }
  );

  console.log('Turn 2 Hash:', turn2.receipt.receiptHash);
  console.log('Chained to:', turn2.receipt.prevReceiptHash);

  // Verify chain
  const chainValid = await receipts.verifyChain([
    turn1.receipt,
    turn2.receipt,
  ]);
  console.log('Chain valid:', chainValid.valid);
}

// ============================================================================
// PRIVACY MODE EXAMPLE
// ============================================================================

async function examplePrivacyMode() {
  const receipts = new TrustReceipts({
    privateKey: process.env.SONATE_PRIVATE_KEY,
  });

  const anthropic = new Anthropic();

  // Scenario 1: Healthcare (sensitive data, privacy mode required)
  const healthcare = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: 'Patient symptoms: fever, cough, shortness of breath',
          },
        ],
      }),
    {
      sessionId: 'healthcare-session',
      input: 'Patient symptoms: fever, cough, shortness of breath',
      includeContent: false, // HIPAA-compliant: no plaintext stored
    }
  );

  console.log('Healthcare Receipt (privacy mode):');
  console.log('  promptHash:', healthcare.receipt.promptHash);
  console.log('  responseHash:', healthcare.receipt.responseHash);
  console.log('  promptContent:', healthcare.receipt.promptContent); // undefined
  console.log('  responseContent:', healthcare.receipt.responseContent); // undefined

  // Scenario 2: Public knowledge base (include content for audit)
  const publicKB = await receipts.wrap(
    () =>
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 256,
        messages: [
          { role: 'user', content: 'Explain photosynthesis' },
        ],
      }),
    {
      sessionId: 'public-kb-session',
      input: 'Explain photosynthesis',
      includeContent: true, // Public content: include for archival
    }
  );

  console.log('\nPublic KB Receipt (with content):');
  console.log('  promptContent:', publicKB.receipt.promptContent);
  console.log('  responseContent:', publicKB.receipt.responseContent?.substring(0, 100) + '...');
}

// ============================================================================
// RUNNING EXAMPLES
// ============================================================================

async function runAll() {
  console.log('=== OPENAI EXAMPLE ===\n');
  await exampleOpenAI();

  console.log('\n=== ANTHROPIC EXAMPLE ===\n');
  await exampleAnthropic();

  console.log('\n=== GEMINI EXAMPLE ===\n');
  await exampleGemini();

  console.log('\n=== LOCAL LLM EXAMPLE ===\n');
  await exampleLocalLLM();

  console.log('\n=== STREAMING EXAMPLE ===\n');
  await exampleStreaming();

  console.log('\n=== ERROR HANDLING EXAMPLE ===\n');
  await exampleWithErrorHandling();

  console.log('\n=== HASH CHAINING EXAMPLE ===\n');
  await exampleHashChaining();

  console.log('\n=== PRIVACY MODE EXAMPLE ===\n');
  await examplePrivacyMode();
}

// Uncomment to run: runAll().catch(console.error);

export {
  exampleOpenAI,
  exampleAnthropic,
  exampleGemini,
  exampleLocalLLM,
  exampleStreaming,
  exampleWithErrorHandling,
  exampleHashChaining,
  examplePrivacyMode,
};
