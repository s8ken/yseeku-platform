/**
 * Enhanced Audit System with Hash-Chain Integrity
 * Combines symbi-symphony hash-chain with YSEEKU audit logging
 * Provides tamper-evident audit trails with cryptographic verification
 */

import { createHash } from 'crypto';

import { TrustReceipt } from '../trust-receipt';

import { EnhancedCryptoManager, EnhancedKeyPair } from './crypto-enhanced';
import { HashChain, HashChainLink } from './hash-chain';

export interface AuditEvent {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: 'auth' | 'access' | 'data' | 'system' | 'security';
  action: string;
  actor: {
    id: string;
    type: 'user' | 'system' | 'service';
    tenant?: string;
    roles?: string[];
  };
  resource: {
    type: string;
    id: string;
    tenant?: string;
  };
  context: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    [key: string]: any;
  };
  result: 'success' | 'failure' | 'denied';
  reason?: string;
  metadata?: Record<string, any>;
}

export interface SignedAuditEvent extends AuditEvent {
  hash: string;
  previousHash: string;
  signature?: string;
  chainSignature?: string;
}

export interface AuditChainConfig {
  enableSigning?: boolean;
  enableChaining?: boolean;
  retentionDays?: number;
  maxChainLength?: number;
  autoVerify?: boolean;
}

export class EnhancedAuditSystem {
  private hashChain: HashChain;
  private cryptoManager: EnhancedCryptoManager;
  private events: Map<string, SignedAuditEvent> = new Map();
  private keyPair?: EnhancedKeyPair;
  private config: Required<AuditChainConfig>;
  private genesisHash: string;

  constructor(config: AuditChainConfig = {}) {
    this.config = {
      enableSigning: config.enableSigning ?? true,
      enableChaining: config.enableChaining ?? true,
      retentionDays: config.retentionDays ?? 90,
      maxChainLength: config.maxChainLength ?? 10000,
      autoVerify: config.autoVerify ?? true,
    };

    this.hashChain = new HashChain({ algorithm: 'sha256', encoding: 'hex' });
    this.cryptoManager = new EnhancedCryptoManager();
    this.genesisHash = this.hashChain.genesisHash('audit-chain');
  }

  /**
   * Initialize the audit system with key pair
   */
  async initialize(keyPair?: EnhancedKeyPair): Promise<void> {
    if (keyPair) {
      this.keyPair = keyPair;
    } else if (this.config.enableSigning) {
      // Generate new key pair for signing
      this.keyPair = this.cryptoManager.generateEnhancedKeyPair();
    }
  }

  /**
   * Log an audit event with cryptographic integrity
   */
  async logEvent(event: AuditEvent): Promise<SignedAuditEvent> {
    try {
      // Get previous event for chaining
      const previousEvent = this.getLatestEvent();
      const previousHash = previousEvent?.hash || this.genesisHash;

      // Create event payload
      const eventPayload = this.serializeEvent(event);

      // Create hash chain link
      const chainLink = this.hashChain.createLink(
        previousHash,
        eventPayload,
        event.timestamp,
        this.config.enableSigning ? 'audit-signature' : undefined
      );

      // Create signed audit event
      const signedEvent: SignedAuditEvent = {
        ...event,
        hash: chainLink.hash,
        previousHash: chainLink.previousHash,
        signature: this.config.enableSigning ? await this.signEvent(event, chainLink) : undefined,
        chainSignature:
          this.config.enableChaining && previousEvent
            ? await this.signChain(chainLink.hash, previousEvent)
            : undefined,
      };

      // Store the event
      this.events.set(signedEvent.id, signedEvent);

      // Auto-verify if enabled
      if (this.config.autoVerify) {
        const verification = await this.verifyEvent(signedEvent.id);
        if (!verification.valid) {
          throw new Error(`Audit event verification failed: ${verification.reason}`);
        }
      }

      return signedEvent;
    } catch (error) {
      throw new Error(
        `Failed to log audit event: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify an audit event's integrity
   */
  async verifyEvent(eventId: string): Promise<{
    valid: boolean;
    reason?: string;
    event?: SignedAuditEvent;
    chainValid?: boolean;
    signatureValid?: boolean;
  }> {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        return { valid: false, reason: 'Event not found' };
      }

      // Verify hash integrity
      const calculatedHash = this.calculateEventHash(event);
      if (calculatedHash !== event.hash) {
        return { valid: false, reason: 'Hash mismatch', event };
      }

      // Verify signature if present
      let signatureValid = true;
      if (this.config.enableSigning && event.signature && this.keyPair) {
        signatureValid = await this.verifyEventSignature(event);
        if (!signatureValid) {
          return { valid: false, reason: 'Signature verification failed', event };
        }
      }

      // Verify chain integrity
      let chainValid = true;
      if (this.config.enableChaining) {
        chainValid = this.verifyEventChain(event);
        if (!chainValid) {
          return { valid: false, reason: 'Chain verification failed', event };
        }
      }

      return {
        valid: true,
        event,
        chainValid,
        signatureValid,
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify the entire audit chain
   */
  verifyAuditChain(): {
    valid: boolean;
    brokenAt?: string;
    totalEvents: number;
    issues: string[];
  } {
    const events = Array.from(this.events.values()).sort((a, b) => a.timestamp - b.timestamp);
    const issues: string[] = [];

    if (events.length === 0) {
      return { valid: true, totalEvents: 0, issues };
    }

    // Verify genesis link
    const firstEvent = events[0];
    if (firstEvent.previousHash !== this.genesisHash) {
      issues.push(`First event does not link to genesis hash`);
      return { valid: false, brokenAt: firstEvent.id, totalEvents: events.length, issues };
    }

    // Verify chain continuity
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];

      if (current.previousHash !== previous.hash) {
        issues.push(`Chain broken at event ${current.id}: previous hash mismatch`);
        return { valid: false, brokenAt: current.id, totalEvents: events.length, issues };
      }

      // Verify individual event integrity
      const calculatedHash = this.calculateEventHash(current);
      if (calculatedHash !== current.hash) {
        issues.push(`Hash mismatch for event ${current.id}`);
        return { valid: false, brokenAt: current.id, totalEvents: events.length, issues };
      }
    }

    return { valid: true, totalEvents: events.length, issues };
  }

  /**
   * Get audit statistics
   */
  getStatistics(): {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsByLevel: Record<string, number>;
    eventsByResult: Record<string, number>;
    timeRange: {
      earliest: number | null;
      latest: number | null;
    };
    chainIntegrity: {
      valid: boolean;
      issues: string[];
    };
  } {
    const events = Array.from(this.events.values());

    const stats = {
      totalEvents: events.length,
      eventsByCategory: {} as Record<string, number>,
      eventsByLevel: {} as Record<string, number>,
      eventsByResult: {} as Record<string, number>,
      timeRange: {
        earliest: events.length > 0 ? Math.min(...events.map((e) => e.timestamp)) : null,
        latest: events.length > 0 ? Math.max(...events.map((e) => e.timestamp)) : null,
      },
      chainIntegrity: this.verifyAuditChain(),
    };

    // Count by category
    events.forEach((event) => {
      stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;
      stats.eventsByLevel[event.level] = (stats.eventsByLevel[event.level] || 0) + 1;
      stats.eventsByResult[event.result] = (stats.eventsByResult[event.result] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export audit trail with integrity verification
   */
  exportAuditTrail(): {
    events: SignedAuditEvent[];
    genesisHash: string;
    statistics: ReturnType<EnhancedAuditSystem['getStatistics']>;
    exportTimestamp: number;
    integrity: {
      valid: boolean;
      issues: string[];
    };
  } {
    const events = Array.from(this.events.values()).sort((a, b) => a.timestamp - b.timestamp);
    const chainIntegrity = this.verifyAuditChain();

    return {
      events,
      genesisHash: this.genesisHash,
      statistics: this.getStatistics(),
      exportTimestamp: Date.now(),
      integrity: {
        valid: chainIntegrity.valid,
        issues: chainIntegrity.issues,
      },
    };
  }

  /**
   * Import audit trail with verification
   */
  async importAuditTrail(trail: {
    events: SignedAuditEvent[];
    genesisHash: string;
    exportTimestamp: number;
  }): Promise<{
    success: boolean;
    imported: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let imported = 0;

    try {
      // Verify genesis hash matches
      if (trail.genesisHash !== this.genesisHash) {
        issues.push('Genesis hash mismatch - cannot import incompatible trail');
        return { success: false, imported: 0, issues };
      }

      // Import events with verification
      for (const event of trail.events) {
        try {
          // Verify event before importing
          const calculatedHash = this.calculateEventHash(event);
          if (calculatedHash !== event.hash) {
            issues.push(`Event ${event.id} hash mismatch - skipping`);
            continue;
          }

          this.events.set(event.id, event);
          imported++;
        } catch (error) {
          issues.push(
            `Failed to import event ${event.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      return {
        success: issues.length === 0,
        imported,
        issues,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        issues: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): SignedAuditEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get latest event
   */
  getLatestEvent(): SignedAuditEvent | undefined {
    const events = Array.from(this.events.values());
    if (events.length === 0) {return undefined;}

    return events.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  /**
   * Query events with filtering
   */
  queryEvents(
    filters: {
      category?: string;
      level?: string;
      actorId?: string;
      resourceType?: string;
      result?: string;
      timeRange?: { start: number; end: number };
      tenant?: string;
    } = {}
  ): SignedAuditEvent[] {
    const events = Array.from(this.events.values());

    return events
      .filter((event) => {
        if (filters.category && event.category !== filters.category) {return false;}
        if (filters.level && event.level !== filters.level) {return false;}
        if (filters.actorId && event.actor.id !== filters.actorId) {return false;}
        if (filters.resourceType && event.resource.type !== filters.resourceType) {return false;}
        if (filters.result && event.result !== filters.result) {return false;}
        if (filters.tenant && event.actor.tenant !== filters.tenant) {return false;}
        if (filters.timeRange) {
          if (event.timestamp < filters.timeRange.start || event.timestamp > filters.timeRange.end)
            {return false;}
        }
        return true;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Serialize event for hashing
   */
  private serializeEvent(event: AuditEvent): string {
    return JSON.stringify(
      {
        id: event.id,
        timestamp: event.timestamp,
        level: event.level,
        category: event.category,
        action: event.action,
        actor: event.actor,
        resource: event.resource,
        context: event.context,
        result: event.result,
        reason: event.reason,
        metadata: event.metadata,
      },
      Object.keys(event).sort()
    ); // Sort keys for consistent serialization
  }

  /**
   * Calculate event hash
   */
  private calculateEventHash(event: SignedAuditEvent): string {
    const serialized = this.serializeEvent(event);
    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Sign event
   */
  private async signEvent(event: AuditEvent, chainLink: any): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized for signing');
    }

    const dataToSign = this.serializeEvent(event) + chainLink.hash;
    const signature = await ed25519.sign(
      Buffer.from(dataToSign, 'utf8'),
      this.keyPair.privateKeyUint8Array
    );

    return Buffer.from(signature).toString('hex');
  }

  /**
   * Sign chain link
   */
  private async signChain(currentHash: string, previousEvent: SignedAuditEvent): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized for signing');
    }

    const chainData = JSON.stringify({
      currentHash,
      previousHash: previousEvent.hash,
      previousTimestamp: previousEvent.timestamp,
    });

    const signature = await ed25519.sign(
      Buffer.from(chainData, 'utf8'),
      this.keyPair.privateKeyUint8Array
    );

    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verify event signature
   */
  private async verifyEventSignature(event: SignedAuditEvent): Promise<boolean> {
    if (!this.keyPair || !event.signature) {
      return false;
    }

    try {
      const dataToVerify = this.serializeEvent(event) + event.hash;
      const signature = Buffer.from(event.signature, 'hex');

      return await ed25519.verify(
        signature,
        Buffer.from(dataToVerify, 'utf8'),
        this.keyPair.publicKeyUint8Array
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify event chain integrity
   */
  private verifyEventChain(event: SignedAuditEvent): boolean {
    if (event.previousHash === this.genesisHash) {
      return true; // Genesis event
    }

    const previousEvent = this.events.get(event.previousHash);
    if (!previousEvent) {
      return false;
    }

    return event.previousHash === previousEvent.hash;
  }
}
