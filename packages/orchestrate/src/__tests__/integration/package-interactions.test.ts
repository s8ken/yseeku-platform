import { AgentOrchestrator } from '../../agent-orchestrator';
import { initializeAuditLogger, getAuditLogger, InMemoryAuditStorage } from '../../security/audit';
import { SymbiFrameworkDetector, AIInteraction } from '@sonate/detect';
import { saveTrustReceipt } from '@sonate/persistence';
import { TrustReceipt } from '@sonate/core';

describe('Package Integration Tests', () => {
  let orchestrator: AgentOrchestrator;
  let detector: SymbiFrameworkDetector;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    detector = new SymbiFrameworkDetector();
    initializeAuditLogger(new InMemoryAuditStorage());
  });

  test('should integrate orchestrate with detect and persistence', async () => {
    // Register agent via orchestrate
    const agent = await orchestrator.registerAgent({
      id: 'integration-agent',
      name: 'Integration Test Agent',
      capabilities: ['trust-detection'],
      metadata: {},
    });

    expect(agent.did).toBeDefined();

    // Simulate trust detection using detect package
    const interaction: AIInteraction = {
      content: 'Test AI interaction content',
      context: 'integration test',
      metadata: { session_id: 'test-session', agent_id: agent.id },
    };

    const detectionResult = await detector.detect(interaction);
    expect(detectionResult.reality_index).toBeDefined();

    // Create and store receipt using persistence
    const receipt = new TrustReceipt({
      version: '1.0.0',
      session_id: 'test-session',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: {
        clarity: 0.8,
        integrity: 0.9,
        quality: detectionResult.reality_index / 10,
      },
    });

    const saved = await saveTrustReceipt(receipt);
    expect(saved).toBe(true);

    // Verify audit logging
    const audit = getAuditLogger();
    const events = await audit.query({ limit: 10 });
    expect(events.length).toBeGreaterThan(0);
  });

  test('end-to-end workflow: agent registration → trust detection → audit logging', async () => {
    // Step 1: Agent registration
    const agent = await orchestrator.registerAgent({
      id: 'e2e-agent',
      name: 'E2E Test Agent',
      capabilities: ['analysis', 'reporting'],
      metadata: { purpose: 'e2e-testing' },
    });

    expect(agent.status).toBe('active');

    // Step 2: Trust detection
    const interaction: AIInteraction = {
      content: 'This is a test interaction for end-to-end workflow validation',
      context: 'e2e-test-workflow',
      metadata: {
        session_id: 'e2e-session',
        agent_id: agent.id,
        workflow: 'e2e-test'
      },
    };

    const detectionResult = await detector.detect(interaction);
    expect(detectionResult.reality_index).toBeGreaterThanOrEqual(0);
    expect(detectionResult.reality_index).toBeLessThanOrEqual(10);

    // Step 3: Create and store receipt
    const receipt = new TrustReceipt({
      version: '1.0.0',
      session_id: 'e2e-session',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: {
        clarity: 0.7,
        integrity: 0.8,
        quality: detectionResult.reality_index / 10,
      },
      symbi_trust_receipt: {
        id: detectionResult.receipt_hash,
        timestamp: new Date().toISOString(),
        telemetry: {
          resonance_score: detectionResult.reality_index / 10,
          resonance_quality: detectionResult.resonance_quality,
          reality_index: detectionResult.reality_index,
        },
        scaffold_proof: {
          detected_vectors: ['trust', 'integrity'],
          ethics_verified: detectionResult.trust_protocol === 'PASS',
        },
        signature: 'test-signature',
      },
    });

    const saved = await saveTrustReceipt(receipt);
    expect(saved).toBe(true);

    // Step 4: Verify audit logging captured the workflow
    const audit = getAuditLogger();
    const auditEvents = await audit.query({ limit: 20 });

    // Should have events for agent registration and audit logging
    expect(auditEvents.length).toBeGreaterThan(0);

    // Verify agent is still active
    const retrievedAgent = orchestrator.getAgent(agent.id);
    expect(retrievedAgent?.status).toBe('active');
  });
});