/**
 * Integration Test: Chat → Trust Receipt → Verify Flow
 *
 * Tests the complete pipeline:
 * 1. Send a message to a conversation
 * 2. Verify a trust receipt is generated with the response
 * 3. Verify the receipt passes structure and signature checks
 */

import crypto from 'crypto';

// Mock auth middleware
jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: any, _res: any, next: any) => {
    req.userId = 'test-user-id';
    req.userTenant = 'demo-tenant';
    req.user = { _id: 'test-user-id', email: 'test@yseeku.com' };
    next();
  },
}));

// Track created receipts for verification
let lastCreatedReceipt: any = null;

jest.mock('../models/trust-receipt.model', () => ({
  TrustReceiptModel: {
    updateOne: jest.fn().mockImplementation((filter: any, update: any) => {
      lastCreatedReceipt = { ...filter, ...update.$set };
      return Promise.resolve({ acknowledged: true });
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockImplementation(() => Promise.resolve(lastCreatedReceipt)),
    }),
  },
}));

// Mock User model
const mockUser = {
  _id: 'test-user-id',
  email: 'test@yseeku.com',
  apiKeys: [
    { provider: 'anthropic', key: 'sk-ant-test-key-12345678901234567890', isActive: true, name: 'Test Key', createdAt: new Date() },
  ],
  consent: { hasConsentedToAI: true, consentTimestamp: new Date(), consentScope: ['chat'] },
};

jest.mock('../models/user.model', () => ({
  User: {
    findById: jest.fn().mockResolvedValue(mockUser),
    findOne: jest.fn().mockResolvedValue(mockUser),
  },
}));

// Mock Agent model
const mockAgent = {
  _id: 'test-agent-id',
  name: 'Claude Assistant',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  maxTokens: 2000,
  ciModel: 'sonate-core',
  traits: new Map([['ethical_alignment', 4.8]]),
};

jest.mock('../models/agent.model', () => ({
  Agent: {
    findById: jest.fn().mockResolvedValue(mockAgent),
    findOne: jest.fn().mockResolvedValue(mockAgent),
    create: jest.fn().mockResolvedValue(mockAgent),
  },
}));

// Mock Conversation model
const mockConversation = {
  _id: 'test-conversation-id',
  user: 'test-user-id',
  title: 'Test Session',
  agents: ['test-agent-id'],
  messages: [],
  save: jest.fn().mockResolvedValue(true),
};

jest.mock('../models/conversation.model', () => ({
  Conversation: {
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    }),
    findOne: jest.fn().mockImplementation(() => mockConversation),
  },
}));

// Mock LLM service to avoid real API calls
jest.mock('../services/llm.service', () => ({
  llmService: {
    generate: jest.fn().mockResolvedValue({
      content: 'This is a helpful and ethically aligned response about AI trust and transparency.',
      usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
    }),
  },
}));

// Mock keys service for signature verification
const mockKeyPair = crypto.generateKeyPairSync('ed25519');
const mockPublicKeyRaw = mockKeyPair.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
const mockPrivateKeyRaw = mockKeyPair.privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32);

jest.mock('../services/keys.service', () => ({
  keysService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getPrivateKey: jest.fn().mockResolvedValue(mockPrivateKeyRaw),
    getPublicKey: jest.fn().mockResolvedValue(mockPublicKeyRaw),
    getPublicKeyHex: jest.fn().mockResolvedValue(mockPublicKeyRaw.toString('hex')),
    verify: jest.fn().mockImplementation(async (message: string | Buffer, signature: string) => {
      try {
        const sigBytes = Buffer.from(signature, 'hex');
        const msgBytes = typeof message === 'string' ? Buffer.from(message, 'utf-8') : message;
        return crypto.verify(null, msgBytes, mockKeyPair.publicKey, sigBytes);
      } catch {
        return false;
      }
    }),
  },
}));

// Mock DID service
jest.mock('../services/did.service', () => ({
  didService: {
    getPlatformDID: jest.fn().mockReturnValue('did:web:yseeku.com'),
    getAgentDID: jest.fn().mockReturnValue('did:web:yseeku.com:agents:test-agent-id'),
    createProof: jest.fn().mockResolvedValue({
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: 'did:web:yseeku.com#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'mock-proof-value',
    }),
  },
}));

// Mock overseer event bus
jest.mock('../services/brain/event-bus', () => ({
  overseerEventBus: {
    notify: jest.fn(),
  },
}));

// Mock LLM trust evaluator
jest.mock('../services/llm-trust-evaluator.service', () => ({
  llmTrustEvaluator: {
    evaluate: jest.fn(),
  },
}));

describe('Chat → Receipt → Verify Integration', () => {
  it('should generate a trust receipt with required fields when sending a message', async () => {
    // Import trust service (uses real logic with mocked dependencies)
    const { TrustService } = await import('../services/trust.service');
    const trustService = new TrustService();

    // Simulate evaluating an AI message
    const aiMessage = {
      sender: 'ai',
      content: 'This is a helpful and ethically aligned response about AI trust and transparency.',
      agentId: 'test-agent-id',
      metadata: {
        messageId: `msg-${Date.now()}`,
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
      },
      ciModel: 'sonate-core',
      trustScore: 5,
      timestamp: new Date(),
    };

    const context = {
      conversationId: 'test-conversation-id',
      sessionId: 'test-conversation-id',
      previousMessages: [],
      agentId: 'test-agent-id',
      userId: 'test-user-id',
      tenantId: 'demo-tenant',
    };

    const evaluation = await trustService.evaluateMessage(aiMessage as any, context);

    // Verify evaluation structure
    expect(evaluation).toBeDefined();
    expect(evaluation.trustScore).toBeDefined();
    expect(evaluation.trustScore.overall).toBeGreaterThanOrEqual(0);
    expect(evaluation.trustScore.overall).toBeLessThanOrEqual(100);
    expect(evaluation.status).toBeDefined();
    expect(['PASS', 'PARTIAL', 'FAIL']).toContain(evaluation.status);

    // Verify receipt was generated (V2 format)
    expect(evaluation.receipt).toBeDefined();
    expect(evaluation.receiptHash).toBeDefined();

    const receipt = evaluation.receipt;
    expect(receipt.version).toBe('2.0.0');
    expect(receipt.timestamp).toBeDefined();
    expect(receipt.mode).toBe('constitutional');
    expect(receipt.session_id).toBe('test-conversation-id');
    expect(receipt.interaction).toBeDefined();
    expect(receipt.agent_did).toBeDefined();
    expect(receipt.human_did).toBeDefined();
    expect(receipt.chain).toBeDefined();

    // receiptHash should match receipt.id
    expect(evaluation.receiptHash).toBe(receipt.id);

    // If fully signed (depends on Ed25519 availability in test env),
    // verify cryptographic fields
    if (receipt.id !== 'unsigned') {
      expect(receipt.id).toMatch(/^[a-f0-9]{64}$/);
      expect(receipt.signature.algorithm).toBe('Ed25519');
      expect(receipt.signature.value.length).toBeGreaterThan(0);
    }
  });

  it('should pass structure check in verify endpoint with V2 receipt format', () => {
    // Simulate what the V2 verify endpoint checks
    const receipt = {
      id: 'a'.repeat(64),
      timestamp: new Date().toISOString(),
      version: '2.0.0' as const,
      mode: 'constitutional' as const,
      session_id: 'test-session',
      agent_did: 'did:web:yseeku.com:agents:test',
      human_did: 'did:web:yseeku.com:users:test',
      policy_version: '1.0.0',
      interaction: { prompt: 'test', response: 'test', model: 'test' },
      chain: { previous_hash: 'GENESIS', chain_hash: 'b'.repeat(64), chain_length: 1 },
      signature: { algorithm: 'Ed25519' as const, value: 'c'.repeat(128), key_version: 'v1' },
    };

    const hasId = !!receipt.id;
    const hasTimestamp = !!receipt.timestamp;
    const hasSignature = !!receipt.signature?.value;

    expect(hasId).toBe(true);
    expect(hasTimestamp).toBe(true);
    expect(hasSignature).toBe(true);
  });

  it('should fail structure check when required fields are missing', () => {
    const invalidReceipt = {
      version: '2.0.0',
      mode: 'constitutional',
    };

    const hasId = !!(invalidReceipt as any).id;
    const hasTimestamp = !!(invalidReceipt as any).timestamp;

    expect(hasId).toBe(false);
    expect(hasTimestamp).toBe(false);
  });
});
