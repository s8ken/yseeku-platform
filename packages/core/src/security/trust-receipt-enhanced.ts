/**
 * Enhanced Trust Receipt Integration
 * Combines existing YSEEKU trust receipt system with symbi-symphony security components
 * Provides cryptographic integrity, audit trails, and enterprise security features
 */

import { TrustReceipt, TrustReceiptData } from '../trust-receipt';

import { EnhancedAuditSystem, AuditEvent } from './audit-enhanced';
import { EnhancedCryptoManager, EnhancedKeyPair, SignedReceipt } from './crypto-enhanced';
import {
  AuthenticationError,
  AuthorizationError,
  CryptographicError,
  DataIntegrityError,
} from './error-taxonomy';
import { SystemSecurityError, EnhancedSecurityError } from './errors';

import { SecurityUtils } from './index';

export interface EnhancedTrustReceiptConfig {
  enableAuditTrail?: boolean;
  enableCryptographicSigning?: boolean;
  enableHashChaining?: boolean;
  enableIntegrityVerification?: boolean;
  autoVerify?: boolean;
}

export interface TrustReceiptAuditContext {
  sessionId: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EnhancedTrustReceiptResult {
  receipt: SignedReceipt;
  auditEvent?: AuditEvent;
  verification: {
    signatureValid: boolean;
    integrityValid: boolean;
    chainValid: boolean;
    timestamp: number;
  };
}

/**
 * Enhanced Trust Receipt Manager
 * Integrates cryptographic signing, audit trails, and integrity verification
 */
export class EnhancedTrustReceiptManager {
  private cryptoManager: EnhancedCryptoManager;
  private auditSystem: EnhancedAuditSystem;
  private keyPair?: EnhancedKeyPair;
  private config: Required<EnhancedTrustReceiptConfig>;
  private previousReceipt?: SignedReceipt;

  constructor(config: EnhancedTrustReceiptConfig = {}) {
    this.config = {
      enableAuditTrail: config.enableAuditTrail ?? true,
      enableCryptographicSigning: config.enableCryptographicSigning ?? true,
      enableHashChaining: config.enableHashChaining ?? true,
      enableIntegrityVerification: config.enableIntegrityVerification ?? true,
      autoVerify: config.autoVerify ?? true,
    };

    this.cryptoManager = new EnhancedCryptoManager();
    this.auditSystem = new EnhancedAuditSystem({
      enableSigning: true,
      enableChaining: true,
      autoVerify: true,
    });
  }

  /**
   * Initialize the manager with cryptographic keys
   */
  async initialize(keyPair?: EnhancedKeyPair): Promise<void> {
    try {
      if (keyPair) {
        this.keyPair = keyPair;
      } else if (this.config.enableCryptographicSigning) {
        this.keyPair = this.cryptoManager.generateEnhancedKeyPair();
      }

      // Initialize audit system
      if (this.keyPair) {
        await this.auditSystem.initialize(this.keyPair);
      }

      // Log initialization
      if (this.config.enableAuditTrail) {
        await this.auditSystem.logEvent({
          id: SecurityUtils.generateSecureId('trust-init'),
          timestamp: Date.now(),
          level: 'info',
          category: 'system',
          action: 'trust_receipt_manager_initialized',
          actor: {
            id: 'system',
            type: 'system',
          },
          resource: {
            type: 'trust_receipt_manager',
            id: 'main',
          },
          context: {
            requestId: SecurityUtils.generateSecureId('req'),
          },
          result: 'success',
          metadata: {
            config: this.config,
            hasKeyPair: Boolean(this.keyPair),
          },
        });
      }
    } catch (error) {
      throw new SystemSecurityError(
        'Failed to initialize enhanced trust receipt manager',
        {
          component: 'EnhancedTrustReceiptManager',
          operation: 'initialize',
          severity: 'critical',
          userId: undefined,
          tenantId: undefined,
        },
        {
          originalError: error instanceof Error ? error : new Error(String(error)),
          metadata: { config: this.config },
        }
      );
    }
  }

  /**
   * Create enhanced trust receipt with cryptographic integrity
   */
  async createEnhancedReceipt(
    receiptData: TrustReceiptData,
    auditContext: TrustReceiptAuditContext
  ): Promise<EnhancedTrustReceiptResult> {
    try {
      // Validate configuration
      if (this.config.enableCryptographicSigning && !this.keyPair) {
        throw new CryptographicError('Cryptographic signing enabled but no key pair available', {
          component: 'EnhancedTrustReceiptManager',
          operation: 'createEnhancedReceipt',
          severity: 'critical',
          userId: auditContext.userId,
          tenantId: auditContext.tenantId,
          requestId: auditContext.requestId,
        });
      }

      // Create enhanced receipt with cryptographic signing
      const signedReceipt = await this.cryptoManager.createSignedReceipt(
        receiptData,
        this.keyPair!.privateKeyUint8Array,
        this.previousReceipt
      );

      // Auto-verify if enabled
      let verification = {
        signatureValid: false,
        integrityValid: false,
        chainValid: false,
        timestamp: Date.now(),
      };

      if (this.config.autoVerify && this.keyPair) {
        const verificationResult = await this.cryptoManager.verifySignedReceipt(
          signedReceipt,
          this.keyPair.publicKeyUint8Array,
          this.previousReceipt
        );

        if (!verificationResult.valid) {
          throw new DataIntegrityError(
            `Receipt verification failed: ${verificationResult.reason}`,
            {
              component: 'EnhancedTrustReceiptManager',
              operation: 'createEnhancedReceipt',
              severity: 'high',
              userId: auditContext.userId,
              tenantId: auditContext.tenantId,
              requestId: auditContext.requestId,
            },
            {
              expectedHash: signedReceipt.integrityHash,
              actualHash: verificationResult.hash,
              dataType: 'trust_receipt',
            }
          );
        }

        verification = {
          signatureValid: true,
          integrityValid: true,
          chainValid: Boolean(signedReceipt.chainSignature),
          timestamp: verificationResult.timestamp,
        };
      }

      // Create audit event
      let auditEvent: AuditEvent | undefined;
      if (this.config.enableAuditTrail) {
        auditEvent = await this.auditSystem.logEvent({
          id: SecurityUtils.generateSecureId('trust-receipt'),
          timestamp: Date.now(),
          level: 'info',
          category: 'data',
          action: 'trust_receipt_created',
          actor: {
            id: auditContext.userId || 'system',
            type: auditContext.userId ? 'user' : 'system',
            tenant: auditContext.tenantId,
          },
          resource: {
            type: 'trust_receipt',
            id: signedReceipt.self_hash,
            tenant: auditContext.tenantId,
          },
          context: {
            ip: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            sessionId: auditContext.sessionId,
            requestId: auditContext.requestId,
          },
          result: 'success',
          metadata: {
            receiptVersion: signedReceipt.version,
            sessionId: signedReceipt.session_id,
            mode: signedReceipt.mode,
            hasChainSignature: Boolean(signedReceipt.chainSignature),
            verification: verification,
          },
        });
      }

      // Update previous receipt for chaining
      if (this.config.enableHashChaining) {
        this.previousReceipt = signedReceipt;
      }

      return {
        receipt: signedReceipt,
        auditEvent,
        verification,
      };
    } catch (error) {
      // Log error to audit system
      if (this.config.enableAuditTrail) {
        try {
          await this.auditSystem.logEvent({
            id: SecurityUtils.generateSecureId('trust-error'),
            timestamp: Date.now(),
            level: 'error',
            category: 'data',
            action: 'trust_receipt_creation_failed',
            actor: {
              id: auditContext.userId || 'system',
              type: auditContext.userId ? 'user' : 'system',
              tenant: auditContext.tenantId,
            },
            resource: {
              type: 'trust_receipt_manager',
              id: 'main',
              tenant: auditContext.tenantId,
            },
            context: {
              ip: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
              sessionId: auditContext.sessionId,
              requestId: auditContext.requestId,
            },
            result: 'failure',
            reason: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              receiptData: receiptData,
              config: this.config,
            },
          });
        } catch (auditError) {
          console.error('Failed to log trust receipt error to audit system:', auditError);
        }
      }

      // Re-throw with enhanced context
      if (error instanceof EnhancedSecurityError) {
        throw error;
      }

      throw new SystemSecurityError(
        'Failed to create enhanced trust receipt',
        {
          component: 'EnhancedTrustReceiptManager',
          operation: 'createEnhancedReceipt',
          severity: 'high',
          userId: auditContext.userId,
          tenantId: auditContext.tenantId,
          requestId: auditContext.requestId,
        },
        {
          originalError: error instanceof Error ? error : new Error(String(error)),
          metadata: {
            receiptData,
            config: this.config,
          },
        }
      );
    }
  }

  /**
   * Verify enhanced trust receipt
   */
  async verifyEnhancedReceipt(
    receipt: SignedReceipt,
    auditContext: TrustReceiptAuditContext,
    previousReceipt?: SignedReceipt
  ): Promise<EnhancedTrustReceiptResult> {
    try {
      if (!this.keyPair) {
        throw new CryptographicError('No key pair available for verification', {
          component: 'EnhancedTrustReceiptManager',
          operation: 'verifyEnhancedReceipt',
          severity: 'critical',
          userId: auditContext.userId,
          tenantId: auditContext.tenantId,
          requestId: auditContext.requestId,
        });
      }

      // Verify receipt
      const verificationResult = await this.cryptoManager.verifySignedReceipt(
        receipt,
        this.keyPair.publicKeyUint8Array,
        previousReceipt
      );

      if (!verificationResult.valid) {
        throw new DataIntegrityError(
          `Trust receipt verification failed: ${verificationResult.reason}`,
          {
            component: 'EnhancedTrustReceiptManager',
            operation: 'verifyEnhancedReceipt',
            severity: 'high',
            userId: auditContext.userId,
            tenantId: auditContext.tenantId,
            requestId: auditContext.requestId,
          },
          {
            expectedHash: receipt.integrityHash,
            actualHash: verificationResult.hash,
            dataType: 'trust_receipt',
          }
        );
      }

      const verification = {
        signatureValid: true,
        integrityValid: true,
        chainValid: Boolean(receipt.chainSignature),
        timestamp: verificationResult.timestamp,
      };

      // Log verification success
      let auditEvent: AuditEvent | undefined;
      if (this.config.enableAuditTrail) {
        auditEvent = await this.auditSystem.logEvent({
          id: SecurityUtils.generateSecureId('trust-verify'),
          timestamp: Date.now(),
          level: 'info',
          category: 'data',
          action: 'trust_receipt_verified',
          actor: {
            id: auditContext.userId || 'system',
            type: auditContext.userId ? 'user' : 'system',
            tenant: auditContext.tenantId,
          },
          resource: {
            type: 'trust_receipt',
            id: receipt.self_hash,
            tenant: auditContext.tenantId,
          },
          context: {
            ip: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            sessionId: auditContext.sessionId,
            requestId: auditContext.requestId,
          },
          result: 'success',
          metadata: {
            receiptVersion: receipt.version,
            sessionId: receipt.session_id,
            mode: receipt.mode,
            verification: verification,
          },
        });
      }

      return {
        receipt,
        auditEvent,
        verification,
      };
    } catch (error) {
      // Log verification failure
      if (this.config.enableAuditTrail) {
        try {
          await this.auditSystem.logEvent({
            id: SecurityUtils.generateSecureId('trust-verify-fail'),
            timestamp: Date.now(),
            level: 'error',
            category: 'data',
            action: 'trust_receipt_verification_failed',
            actor: {
              id: auditContext.userId || 'system',
              type: auditContext.userId ? 'user' : 'system',
              tenant: auditContext.tenantId,
            },
            resource: {
              type: 'trust_receipt',
              id: receipt.self_hash,
              tenant: auditContext.tenantId,
            },
            context: {
              ip: auditContext.ipAddress,
              userAgent: auditContext.userAgent,
              sessionId: auditContext.sessionId,
              requestId: auditContext.requestId,
            },
            result: 'failure',
            reason: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
              receipt: receipt.toJSON(),
              config: this.config,
            },
          });
        } catch (auditError) {
          console.error('Failed to log verification failure to audit system:', auditError);
        }
      }

      throw error;
    }
  }

  /**
   * Get audit trail for trust receipts
   */
  async getAuditTrail(filters?: {
    sessionId?: string;
    userId?: string;
    tenantId?: string;
    timeRange?: { start: number; end: number };
  }): Promise<{
    events: any[];
    total: number;
    integrity: {
      valid: boolean;
      issues: string[];
    };
  }> {
    try {
      const queryFilters = {
        category: 'data',
        actorId: filters?.userId,
        tenant: filters?.tenantId,
        timeRange: filters?.timeRange,
      };

      const events = this.auditSystem.queryEvents(queryFilters);
      const integrity = this.auditSystem.verifyAuditChain();

      return {
        events,
        total: events.length,
        integrity,
      };
    } catch (error) {
      throw new SystemSecurityError(
        'Failed to retrieve trust receipt audit trail',
        {
          component: 'EnhancedTrustReceiptManager',
          operation: 'getAuditTrail',
          severity: 'medium',
          userId: filters?.userId,
          tenantId: filters?.tenantId,
        },
        {
          originalError: error instanceof Error ? error : new Error(String(error)),
          metadata: { filters },
        }
      );
    }
  }

  /**
   * Export trust receipts with integrity verification
   */
  async exportReceipts(receipts: SignedReceipt[]): Promise<{
    receipts: SignedReceipt[];
    exportTimestamp: number;
    integrity: {
      valid: boolean;
      issues: string[];
      verifiedCount: number;
      totalCount: number;
    };
  }> {
    try {
      if (!this.keyPair) {
        throw new CryptographicError('No key pair available for export verification', {
          component: 'EnhancedTrustReceiptManager',
          operation: 'exportReceipts',
          severity: 'critical',
        });
      }

      const issues: string[] = [];
      let verifiedCount = 0;

      // Verify each receipt
      for (const receipt of receipts) {
        try {
          const verificationResult = await this.cryptoManager.verifySignedReceipt(
            receipt,
            this.keyPair.publicKeyUint8Array
          );

          if (!verificationResult.valid) {
            issues.push(
              `Receipt ${receipt.self_hash} verification failed: ${verificationResult.reason}`
            );
          } else {
            verifiedCount++;
          }
        } catch (error) {
          issues.push(
            `Receipt ${receipt.self_hash} verification error: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      return {
        receipts,
        exportTimestamp: Date.now(),
        integrity: {
          valid: issues.length === 0,
          issues,
          verifiedCount,
          totalCount: receipts.length,
        },
      };
    } catch (error) {
      throw new SystemSecurityError(
        'Failed to export trust receipts',
        {
          component: 'EnhancedTrustReceiptManager',
          operation: 'exportReceipts',
          severity: 'high',
        },
        {
          originalError: error instanceof Error ? error : new Error(String(error)),
          metadata: { receiptCount: receipts.length },
        }
      );
    }
  }
}

// Export missing types for compatibility
export interface SignedTrustReceipt extends SignedReceipt {
  trustReceipt: TrustReceiptData;
  auditEvent?: AuditEvent;
}
