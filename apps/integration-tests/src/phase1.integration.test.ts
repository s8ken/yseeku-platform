/**
 * SONATE Phase 1 Integration Tests
 * 
 * Tests the complete flow:
 * 1. Receipt generation with cryptography
 * 2. DID lifecycle (create, rotate, revoke)
 * 3. Receipt verification
 * 4. Export to multiple formats
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  ReceiptGeneratorService,
  ReceiptValidatorService,
  ReceiptExporterService,
} from '../apps/backend/src/services/receipts';
import { DIDResolverService } from '../packages/orchestrate/src/did/did-resolver';
import { generateKeyPair, sign, verify } from '../packages/core/src/crypto';

describe('SONATE Phase 1 Integration Tests', () => {
  let didResolver: DIDResolverService;
  let receiptGenerator: ReceiptGeneratorService;
  let receiptValidator: ReceiptValidatorService;
  let receiptExporter: ReceiptExporterService;

  let agentDID: string;
  let userDID: string;
  let agentPrivateKey: string;
  let agentPublicKey: string;

  beforeAll(async () => {
    // Initialize services
    didResolver = new DIDResolverService();
    receiptGenerator = new ReceiptGeneratorService(didResolver);
    receiptValidator = new ReceiptValidatorService();
    receiptExporter = new ReceiptExporterService();

    // Create DIDs for testing
    const agentDIDResult = await didResolver.createDID({
      entity_type: 'agent',
      name: 'Test-Agent',
      description: 'Test agent for integration tests',
    });
    agentDID = agentDIDResult.did;
    agentPublicKey = agentDIDResult.public_key;
    agentPrivateKey = agentDIDResult.private_key;

    const userDIDResult = await didResolver.createDID({
      entity_type: 'user',
      name: 'Test-User',
      description: 'Test user for integration tests',
    });
    userDID = userDIDResult.did;
  });

  describe('DID Lifecycle', () => {
    it('should create a DID with public and private keys', async () => {
      expect(agentDID).toMatch(/^did:sonate:[a-zA-Z0-9]{40}$/);
      expect(agentPublicKey).toBeDefined();
      expect(agentPrivateKey).toBeDefined();
    });

    it('should resolve DID to current public key', async () => {
      const resolved = await didResolver.resolveDID(agentDID);
      expect(resolved).toBeDefined();
      expect(resolved.public_key).toBe(agentPublicKey);
      expect(resolved.status).toBe('active');
    });

    it('should rotate DID key', async () => {
      const { public_key: newPublicKey, private_key: newPrivateKey } =
        await generateKeyPair();

      const rotated = await didResolver.rotateKey(agentDID, newPublicKey);

      expect(rotated.key_version).toBe('2');
      expect(rotated.status).toBe('active');

      const resolved = await didResolver.resolveDID(agentDID);
      expect(resolved.key_version).toBe('2');
      expect(resolved.public_key).toBe(newPublicKey);
    });

    it('should maintain key history after rotation', async () => {
      const history = await didResolver.getKeyHistory(agentDID);

      expect(history.key_history.length).toBeGreaterThan(0);
      expect(history.key_history[0].status).toBe('active');
      if (history.key_history.length > 1) {
        expect(history.key_history[1].status).toBe('rotated');
      }
    });

    it('should revoke a DID', async () => {
      // Create a temporary DID to revoke
      const tmpDIDResult = await didResolver.createDID({
        entity_type: 'agent',
        name: 'Temp-Agent-To-Revoke',
      });

      const revoked = await didResolver.revokeDID(tmpDIDResult.did, {
        reason: 'testing_revocation',
      });

      expect(revoked.status).toBe('revoked');
      expect(revoked.revocation_reason).toBe('testing_revocation');

      // Verify it's marked as revoked
      const resolved = await didResolver.resolveDID(tmpDIDResult.did);
      expect(resolved.status).toBe('revoked');
    });
  });

  describe('Receipt Generation & Cryptography', () => {
    it('should generate a receipt with valid SHA-256 ID', async () => {
      const receipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_session_001',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Test prompt',
          response: 'Test response',
          model: 'test-model',
        },
      });

      expect(receipt).toBeDefined();
      expect(receipt.id).toMatch(/^[a-f0-9]{64}$/);
      expect(receipt.version).toBe('2.0.0');
      expect(receipt.signature).toBeDefined();
      expect(receipt.signature.algorithm).toBe('Ed25519');
    });

    it('should create hash chain with GENESIS for first receipt', async () => {
      const receipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_session_chain_001',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Test',
          response: 'Test',
          model: 'test-model',
        },
      });

      expect(receipt.chain).toBeDefined();
      expect(receipt.chain.previous_hash).toBe('GENESIS');
      expect(receipt.chain.chain_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(receipt.chain.chain_length).toBe(1);
    });

    it('should link receipts in a chain', async () => {
      const receipt1 = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_session_chain_002',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'First',
          response: 'First',
          model: 'test-model',
        },
      });

      const receipt2 = await receiptGenerator.generateReceipt(
        {
          timestamp: new Date().toISOString(),
          session_id: 'test_session_chain_002',
          agent_did: agentDID,
          human_did: userDID,
          policy_version: 'policy_v1.0.0',
          mode: 'constitutional',
          interaction: {
            prompt: 'Second',
            response: 'Second',
            model: 'test-model',
          },
        },
        receipt1.chain.chain_hash
      );

      expect(receipt2.chain.previous_hash).toBe(receipt1.chain.chain_hash);
      expect(receipt2.chain.chain_length).toBe(2);
    });

    it('should include telemetry in receipt', async () => {
      const receipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_session_telemetry',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Test',
          response: 'Test',
          model: 'test-model',
        },
        telemetry: {
          resonance_score: 0.85,
          bedau_index: 0.73,
          coherence_score: 0.82,
          truth_debt: 0.15,
          volatility: 0.22,
        },
      });

      expect(receipt.telemetry).toBeDefined();
      expect(receipt.telemetry.resonance_score).toBe(0.85);
      expect(receipt.telemetry.truth_debt).toBe(0.15);
    });

    it('should include policy state in receipt', async () => {
      const receipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_session_policy',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Test',
          response: 'Test',
          model: 'test-model',
        },
        policy_state: {
          constraints_applied: ['consent_verified', 'truth_debt_check'],
          violations: [],
          consent_verified: true,
          override_available: false,
        },
      });

      expect(receipt.policy_state).toBeDefined();
      expect(receipt.policy_state.constraints_applied).toContain(
        'consent_verified'
      );
      expect(receipt.policy_state.consent_verified).toBe(true);
    });
  });

  describe('Receipt Verification', () => {
    let testReceipt: any;

    beforeAll(async () => {
      testReceipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_verification_session',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Verify me',
          response: 'Verified',
          model: 'test-model',
        },
      });
    });

    it('should verify schema validation', async () => {
      const result = await receiptValidator.verifyReceipt(testReceipt);

      expect(result.valid).toBe(true);
      expect(result.checks.schema_valid).toBe(true);
    });

    it('should verify receipt ID matches hash', async () => {
      const result = await receiptValidator.verifyReceipt(testReceipt);

      expect(result.checks.receipt_id_valid).toBe(true);
    });

    it('should verify signature with public key', async () => {
      const agentInfo = await didResolver.resolveDID(agentDID);
      const result = await receiptValidator.verifyReceipt(testReceipt, {
        publicKey: agentInfo.public_key,
      });

      expect(result.checks.signature_valid).toBe(true);
    });

    it('should verify chain integrity', async () => {
      const result = await receiptValidator.verifyReceipt(testReceipt);

      expect(result.checks.chain_hash_valid).toBe(true);
    });

    it('should fail verification for tampered receipt', async () => {
      const tamperedReceipt = { ...testReceipt };
      tamperedReceipt.interaction.response = 'MODIFIED';

      const result = await receiptValidator.verifyReceipt(tamperedReceipt);

      expect(result.valid).toBe(false);
      expect(result.checks.receipt_id_valid).toBe(false);
    });

    it('should verify chain continuity with previous hash', async () => {
      const receipt1 = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'test_continuity_001',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'First',
          response: 'First',
          model: 'test-model',
        },
      });

      const receipt2 = await receiptGenerator.generateReceipt(
        {
          timestamp: new Date().toISOString(),
          session_id: 'test_continuity_001',
          agent_did: agentDID,
          human_did: userDID,
          policy_version: 'policy_v1.0.0',
          mode: 'constitutional',
          interaction: {
            prompt: 'Second',
            response: 'Second',
            model: 'test-model',
          },
        },
        receipt1.chain.chain_hash
      );

      const result = await receiptValidator.verifyReceipt(receipt2, {
        previousHash: receipt1.chain.chain_hash,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Receipt Export Formats', () => {
    let testReceipts: any[];

    beforeAll(async () => {
      testReceipts = [];
      for (let i = 0; i < 3; i++) {
        const receipt = await receiptGenerator.generateReceipt({
          timestamp: new Date().toISOString(),
          session_id: `test_export_session_${i}`,
          agent_did: agentDID,
          human_did: userDID,
          policy_version: 'policy_v1.0.0',
          mode: 'constitutional',
          interaction: {
            prompt: `Prompt ${i}`,
            response: `Response ${i}`,
            model: 'test-model',
          },
          telemetry: {
            resonance_score: 0.7 + i * 0.05,
            bedau_index: 0.7,
            coherence_score: 0.8,
            truth_debt: 0.1 + i * 0.02,
            volatility: 0.2,
          },
        });
        testReceipts.push(receipt);
      }
    });

    it('should export to JSON format', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'json',
      });

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.format).toBe('json');
      expect(parsed.receipts).toHaveLength(3);
    });

    it('should export to JSONL format', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'jsonl',
      });

      const lines = result.trim().split('\n');
      expect(lines).toHaveLength(4); // metadata + 3 receipts
      expect(() => JSON.parse(lines[0])).not.toThrow();
    });

    it('should export to CSV format', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'csv',
      });

      const lines = result.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toContain('Receipt ID');
      expect(lines[1]).toContain(testReceipts[0].id);
    });

    it('should export to Splunk format', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'splunk',
      });

      expect(result).toContain('timestamp=');
      expect(result).toContain('session_id=');
      expect(result).toContain('resonance_score=');
    });

    it('should export to Datadog format', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'datadog',
      });

      const lines = result.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);
      lines.forEach(line => {
        const parsed = JSON.parse(line);
        expect(parsed.host).toBe('sonate');
        expect(parsed.service).toBe('trust-engine');
      });
    });

    it('should export to Elastic format', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'elastic',
      });

      const lines = result.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);
      lines.forEach(line => {
        expect(() => JSON.parse(line)).not.toThrow();
      });
    });

    it('should filter receipts by resonance score', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'json',
        filter: {
          minResonanceScore: 0.75,
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.receipts.length).toBeLessThan(testReceipts.length);
      parsed.receipts.forEach(receipt: any) => {
        expect(receipt.telemetry.resonance_score).toBeGreaterThanOrEqual(0.75);
      });
    });

    it('should filter receipts by truth debt', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'json',
        filter: {
          maxTruthDebt: 0.12,
        },
      });

      const parsed = JSON.parse(result);
      parsed.receipts.forEach(receipt: any) => {
        expect(receipt.telemetry.truth_debt).toBeLessThanOrEqual(0.12);
      });
    });

    it('should filter receipts by session ID', async () => {
      const result = await receiptExporter.export(testReceipts, {
        format: 'json',
        filter: {
          sessionId: 'test_export_session_0',
        },
      });

      const parsed = JSON.parse(result);
      expect(parsed.receipts).toHaveLength(1);
      expect(parsed.receipts[0].session_id).toBe('test_export_session_0');
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full flow: create DIDs → generate receipt → verify → export', async () => {
      // 1. Create DIDs
      const agentResult = await didResolver.createDID({
        entity_type: 'agent',
        name: 'E2E-Test-Agent',
      });
      const userResult = await didResolver.createDID({
        entity_type: 'user',
        name: 'E2E-Test-User',
      });

      // 2. Generate receipt
      const receipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'e2e_test_session',
        agent_did: agentResult.did,
        human_did: userResult.did,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'E2E test prompt',
          response: 'E2E test response',
          model: 'test-model',
        },
        telemetry: {
          resonance_score: 0.92,
          bedau_index: 0.7,
          coherence_score: 0.85,
          truth_debt: 0.08,
          volatility: 0.15,
        },
      });

      // 3. Verify receipt
      const agentInfo = await didResolver.resolveDID(agentResult.did);
      const verifyResult = await receiptValidator.verifyReceipt(receipt, {
        publicKey: agentInfo.public_key,
      });
      expect(verifyResult.valid).toBe(true);

      // 4. Export receipt
      const exportResult = await receiptExporter.export([receipt], {
        format: 'json',
      });
      expect(exportResult).toBeDefined();

      const parsed = JSON.parse(exportResult);
      expect(parsed.receipts[0].id).toBe(receipt.id);
    });
  });

  describe('Performance', () => {
    it('should generate receipt in under 100ms', async () => {
      const start = Date.now();

      await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'perf_test_gen',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Perf test',
          response: 'Perf test',
          model: 'test-model',
        },
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should verify receipt in under 50ms', async () => {
      const receipt = await receiptGenerator.generateReceipt({
        timestamp: new Date().toISOString(),
        session_id: 'perf_test_verify',
        agent_did: agentDID,
        human_did: userDID,
        policy_version: 'policy_v1.0.0',
        mode: 'constitutional',
        interaction: {
          prompt: 'Perf test',
          response: 'Perf test',
          model: 'test-model',
        },
      });

      const start = Date.now();
      await receiptValidator.verifyReceipt(receipt);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should export 100 receipts in under 1 second', async () => {
      const receipts = [];
      for (let i = 0; i < 100; i++) {
        const receipt = await receiptGenerator.generateReceipt({
          timestamp: new Date().toISOString(),
          session_id: `perf_test_export_${i}`,
          agent_did: agentDID,
          human_did: userDID,
          policy_version: 'policy_v1.0.0',
          mode: 'constitutional',
          interaction: {
            prompt: `Perf ${i}`,
            response: `Perf ${i}`,
            model: 'test-model',
          },
        });
        receipts.push(receipt);
      }

      const start = Date.now();
      await receiptExporter.export(receipts, { format: 'json' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
