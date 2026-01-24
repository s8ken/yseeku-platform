/**
 * Security Integration Test Suite
 * Tests the ported security components from sonate-protocol
 * Verifies cryptographic integrity, audit trails, and authentication
 */

import { SecurityManager, EnhancedTrustReceiptManager } from '@sonate/core/security';
import { TrustReceipt, TrustReceiptData } from '@sonate/core/trust-receipt';
import { CIQMetrics } from '@sonate/core';

describe('Security Components Integration Tests', () => {
  let securityManager: SecurityManager;
  let trustReceiptManager: EnhancedTrustReceiptManager;

  beforeEach(async () => {
    // Initialize security manager
    securityManager = new SecurityManager();
    await securityManager.initialize();

    // Initialize trust receipt manager
    trustReceiptManager = new EnhancedTrustReceiptManager({
      enableAuditTrail: true,
      enableCryptographicSigning: true,
      enableHashChaining: true,
      enableIntegrityVerification: true,
      autoVerify: true,
    });
    await trustReceiptManager.initialize();
  });

  describe('Cryptographic Components', () => {
    test('should generate secure key pairs', async () => {
      const cryptoManager = securityManager.getCryptoManager();
      const keyPair = cryptoManager.generateEnhancedKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKeyUint8Array).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKeyUint8Array).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKeyUint8Array.length).toBe(32);
      expect(keyPair.privateKeyUint8Array.length).toBe(32);
    });

    test('should create and verify signed receipts', async () => {
      const cryptoManager = securityManager.getCryptoManager();
      const keyPair = cryptoManager.generateEnhancedKeyPair();

      // Create test trust receipt data
      const ciqMetrics: CIQMetrics = {
        clarity: 0.8,
        integrity: 0.9,
        quality: 0.85,
      };

      const receiptData: TrustReceiptData = {
        version: '1.0.0',
        session_id: 'test-session-123',
        timestamp: Date.now(),
        mode: 'constitutional',
        ciq_metrics: ciqMetrics,
      };

      // Create signed receipt
      const signedReceipt = await cryptoManager.createSignedReceipt(
        receiptData,
        keyPair.privateKeyUint8Array
      );

      expect(signedReceipt).toBeDefined();
      expect(signedReceipt.integrityHash).toBeTruthy();
      expect(signedReceipt.chainSignature).toBeDefined();

      // Verify receipt
      const verification = await cryptoManager.verifySignedReceipt(
        signedReceipt,
        keyPair.publicKeyUint8Array
      );

      expect(verification.valid).toBe(true);
      expect(verification.hash).toBe(signedReceipt.integrityHash);
    });

    test('should detect tampered receipts', async () => {
      const cryptoManager = securityManager.getCryptoManager();
      const keyPair = cryptoManager.generateEnhancedKeyPair();

      // Create and sign receipt
      const ciqMetrics: CIQMetrics = {
        clarity: 0.8,
        integrity: 0.9,
        quality: 0.85,
      };

      const receiptData: TrustReceiptData = {
        version: '1.0.0',
        session_id: 'test-session-123',
        timestamp: Date.now(),
        mode: 'constitutional',
        ciq_metrics: ciqMetrics,
      };

      const signedReceipt = await cryptoManager.createSignedReceipt(
        receiptData,
        keyPair.privateKeyUint8Array
      );

      // Tamper with the receipt
      (signedReceipt as any).integrityHash = 'tampered-hash';

      // Verify should fail
      const verification = await cryptoManager.verifySignedReceipt(
        signedReceipt,
        keyPair.publicKeyUint8Array
      );

      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('Integrity hash mismatch');
    });
  });

  describe('Hash Chain Components', () => {
    test('should create verifiable hash chains', async () => {
      const cryptoManager = securityManager.getCryptoManager();
      const keyPair = cryptoManager.generateEnhancedKeyPair();

      // Create multiple receipts to form a chain
      const receipts: any[] = [];
      let previousReceipt: any;

      for (let i = 0; i < 3; i++) {
        const ciqMetrics: CIQMetrics = {
          clarity: 0.8 + i * 0.05,
          integrity: 0.9 + i * 0.02,
          quality: 0.85 + i * 0.03,
        };

        const receiptData: TrustReceiptData = {
          version: '1.0.0',
          session_id: 'test-session-123',
          timestamp: Date.now() + i,
          mode: 'constitutional',
          ciq_metrics: ciqMetrics,
        };

        const signedReceipt = await cryptoManager.createSignedReceipt(
          receiptData,
          keyPair.privateKeyUint8Array,
          previousReceipt
        );

        receipts.push(signedReceipt);
        previousReceipt = signedReceipt;
      }

      // Verify chain integrity
      for (let i = 1; i < receipts.length; i++) {
        const verification = await cryptoManager.verifySignedReceipt(
          receipts[i],
          keyPair.publicKeyUint8Array,
          receipts[i - 1]
        );

        expect(verification.valid).toBe(true);
        expect(receipts[i].chainSignature).toBeTruthy();
      }
    });

    test('should detect broken hash chains', async () => {
      const cryptoManager = securityManager.getCryptoManager();
      const keyPair = cryptoManager.generateEnhancedKeyPair();

      // Create first receipt
      const ciqMetrics1: CIQMetrics = {
        clarity: 0.8,
        integrity: 0.9,
        quality: 0.85,
      };

      const receiptData1: TrustReceiptData = {
        version: '1.0.0',
        session_id: 'test-session-123',
        timestamp: Date.now(),
        mode: 'constitutional',
        ciq_metrics: ciqMetrics1,
      };

      const receipt1 = await cryptoManager.createSignedReceipt(
        receiptData1,
        keyPair.privateKeyUint8Array
      );

      // Create second receipt linking to first
      const ciqMetrics2: CIQMetrics = {
        clarity: 0.85,
        integrity: 0.92,
        quality: 0.88,
      };

      const receiptData2: TrustReceiptData = {
        version: '1.0.0',
        session_id: 'test-session-123',
        timestamp: Date.now() + 1,
        mode: 'constitutional',
        ciq_metrics: ciqMetrics2,
      };

      const receipt2 = await cryptoManager.createSignedReceipt(
        receiptData2,
        keyPair.privateKeyUint8Array,
        receipt1
      );

      // Tamper with the first receipt to break the chain
      (receipt1 as any).integrityHash = 'tampered-hash';

      // Verification should fail
      const verification = await cryptoManager.verifySignedReceipt(
        receipt2,
        keyPair.publicKeyUint8Array,
        receipt1
      );

      expect(verification.valid).toBe(false);
    });
  });

  describe('Audit Trail Components', () => {
    test('should create verifiable audit events', async () => {
      const auditSystem = securityManager.getAuditSystem();

      const auditEvent: AuditEvent = {
        id: 'test-audit-123',
        timestamp: Date.now(),
        level: 'info',
        category: 'auth',
        action: 'user_login',
        actor: {
          id: 'user-123',
          type: 'user',
          tenant: 'default',
        },
        resource: {
          type: 'authentication',
          id: 'auth-session-123',
          tenant: 'default',
        },
        context: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-123',
        },
        result: 'success',
      };

      const signedEvent = await auditSystem.logEvent(auditEvent);

      expect(signedEvent).toBeDefined();
      expect(signedEvent.hash).toBeTruthy();
      expect(signedEvent.previousHash).toBeTruthy();

      // Verify the event
      const verification = await auditSystem.verifyEvent(signedEvent.id);
      expect(verification.valid).toBe(true);
      expect(verification.event).toBeDefined();
    });

    test('should maintain audit chain integrity', async () => {
      const auditSystem = securityManager.getAuditSystem();

      // Create multiple audit events
      const events: AuditEvent[] = [];
      for (let i = 0; i < 3; i++) {
        events.push({
          id: `test-audit-${i}`,
          timestamp: Date.now() + i,
          level: 'info',
          category: 'auth',
          action: 'user_action',
          actor: {
            id: 'user-123',
            type: 'user',
            tenant: 'default',
          },
          resource: {
            type: 'system',
            id: `resource-${i}`,
            tenant: 'default',
          },
          context: {
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          },
          result: 'success',
        });
      }

      // Log all events
      for (const event of events) {
        await auditSystem.logEvent(event);
      }

      // Verify entire chain
      const chainVerification = auditSystem.verifyAuditChain();
      expect(chainVerification.valid).toBe(true);
      expect(chainVerification.totalEvents).toBe(3);
      expect(chainVerification.issues).toHaveLength(0);
    });

    test('should query audit events with filters', async () => {
      const auditSystem = securityManager.getAuditSystem();

      // Create events with different categories
      const event1: AuditEvent = {
        id: 'test-auth-123',
        timestamp: Date.now(),
        level: 'info',
        category: 'auth',
        action: 'user_login',
        actor: { id: 'user-123', type: 'user', tenant: 'default' },
        resource: { type: 'authentication', id: 'auth-123', tenant: 'default' },
        context: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
        result: 'success',
      };

      const event2: AuditEvent = {
        id: 'test-data-123',
        timestamp: Date.now() + 1,
        level: 'warn',
        category: 'data',
        action: 'data_access',
        actor: { id: 'user-123', type: 'user', tenant: 'default' },
        resource: { type: 'data', id: 'data-123', tenant: 'default' },
        context: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
        result: 'failure',
      };

      await auditSystem.logEvent(event1);
      await auditSystem.logEvent(event2);

      // Query by category
      const authEvents = auditSystem.queryEvents({ category: 'auth' });
      expect(authEvents).toHaveLength(1);
      expect(authEvents[0].category).toBe('auth');

      const dataEvents = auditSystem.queryEvents({ category: 'data' });
      expect(dataEvents).toHaveLength(1);
      expect(dataEvents[0].category).toBe('data');

      // Query by result
      const failedEvents = auditSystem.queryEvents({ result: 'failure' });
      expect(failedEvents).toHaveLength(1);
      expect(failedEvents[0].result).toBe('failure');
    });
  });

  describe('Trust Receipt Integration', () => {
    test('should create enhanced trust receipts with audit trail', async () => {
      const ciqMetrics: CIQMetrics = {
        clarity: 0.85,
        integrity: 0.92,
        quality: 0.88,
      };

      const receiptData: TrustReceiptData = {
        version: '1.0.0',
        session_id: 'test-session-integration',
        timestamp: Date.now(),
        mode: 'constitutional',
        ciq_metrics: ciqMetrics,
      };

      const auditContext = {
        sessionId: 'test-session-integration',
        userId: 'test-user-123',
        tenantId: 'default',
        requestId: 'test-request-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
      };

      const result = await trustReceiptManager.createEnhancedReceipt(receiptData, auditContext);

      expect(result.receipt).toBeDefined();
      expect(result.receipt.integrityHash).toBeTruthy();
      expect(result.verification.signatureValid).toBe(true);
      expect(result.verification.integrityValid).toBe(true);
      expect(result.auditEvent).toBeDefined();

      // Verify the receipt
      const verification = await trustReceiptManager.verifyEnhancedReceipt(
        result.receipt,
        auditContext
      );

      expect(verification.verification.signatureValid).toBe(true);
      expect(verification.verification.integrityValid).toBe(true);
    });

    test('should export and import trust receipts with integrity', async () => {
      // Create multiple receipts
      const receipts: any[] = [];
      for (let i = 0; i < 3; i++) {
        const ciqMetrics: CIQMetrics = {
          clarity: 0.8 + i * 0.05,
          integrity: 0.9 + i * 0.02,
          quality: 0.85 + i * 0.03,
        };

        const receiptData: TrustReceiptData = {
          version: '1.0.0',
          session_id: 'export-test-session',
          timestamp: Date.now() + i,
          mode: 'constitutional',
          ciq_metrics: ciqMetrics,
        };

        const auditContext = {
          sessionId: 'export-test-session',
          userId: 'test-user-123',
          tenantId: 'default',
        };

        const result = await trustReceiptManager.createEnhancedReceipt(receiptData, auditContext);
        receipts.push(result.receipt);
      }

      // Export receipts
      const exportResult = await trustReceiptManager.exportReceipts(receipts);

      expect(exportResult.receipts).toHaveLength(3);
      expect(exportResult.integrity.valid).toBe(true);
      expect(exportResult.integrity.verifiedCount).toBe(3);
      expect(exportResult.integrity.totalCount).toBe(3);
      expect(exportResult.integrity.issues).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle cryptographic errors gracefully', async () => {
      const cryptoManager = securityManager.getCryptoManager();

      // Try to verify with invalid key
      const invalidKey = new Uint8Array(32).fill(0);
      const invalidReceipt = {
        self_hash: 'invalid',
        integrityHash: 'invalid',
        chainSignature: 'invalid',
        signature: 'invalid',
        verify: async () => false,
      } as any;

      const verification = await cryptoManager.verifySignedReceipt(invalidReceipt, invalidKey);

      expect(verification.valid).toBe(false);
      expect(verification.reason).toBeTruthy();
    });

    test('should provide detailed error information', async () => {
      try {
        await trustReceiptManager.verifyEnhancedReceipt(
          {} as any, // Invalid receipt
          { sessionId: 'test' }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('SystemSecurityError');
        expect(error.code).toBe('SYSTEM_ERROR');
        expect(error.context).toBeDefined();
        expect(error.context.category).toBe('system');
        expect(error.context.severity).toBe('high');
      }
    });
  });

  describe('Security Manager Integration', () => {
    test('should provide comprehensive security statistics', async () => {
      const auditSystem = securityManager.getAuditSystem();

      // Create some audit events
      for (let i = 0; i < 5; i++) {
        await auditSystem.logEvent({
          id: `stats-test-${i}`,
          timestamp: Date.now() + i,
          level: i % 2 === 0 ? 'info' : 'warn',
          category: i % 3 === 0 ? 'auth' : 'data',
          action: 'test_action',
          actor: { id: 'user-123', type: 'user', tenant: 'default' },
          resource: { type: 'system', id: `resource-${i}`, tenant: 'default' },
          context: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
          result: i % 4 === 0 ? 'failure' : 'success',
        });
      }

      const stats = auditSystem.getStatistics();

      expect(stats.totalEvents).toBe(5);
      expect(stats.eventsByCategory).toBeDefined();
      expect(stats.eventsByLevel).toBeDefined();
      expect(stats.eventsByResult).toBeDefined();
      expect(stats.timeRange.earliest).toBeLessThanOrEqual(stats.timeRange.latest!);
      expect(stats.chainIntegrity.valid).toBe(true);
    });

    test('should verify security manager initialization', () => {
      expect(securityManager.isInitialized()).toBe(true);
      expect(securityManager.getCryptoManager()).toBeDefined();
      expect(securityManager.getAuditSystem()).toBeDefined();
    });
  });
});

// Export test utilities for use in other test files
export const SecurityTestUtils = {
  createMockTrustReceiptData: (overrides?: Partial<TrustReceiptData>): TrustReceiptData => ({
    version: '1.0.0',
    session_id: 'test-session-123',
    timestamp: Date.now(),
    mode: 'constitutional',
    ciq_metrics: {
      clarity: 0.8,
      integrity: 0.9,
      quality: 0.85,
    },
    ...overrides,
  }),

  createMockAuditContext: (overrides?: any) => ({
    sessionId: 'test-session-123',
    userId: 'test-user-123',
    tenantId: 'default',
    requestId: 'test-request-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    ...overrides,
  }),
};
