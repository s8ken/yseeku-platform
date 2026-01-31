/**
 * Overseer Event Bus
 * 
 * Provides real-time event notifications to the System Brain/Overseer
 * when important events occur in the system.
 * 
 * This allows the Overseer to react to:
 * - Trust violations in chat
 * - Critical failures
 * - Emergence signals
 * - Agent behavior anomalies
 */

import { EventEmitter } from 'events';
import { systemBrain } from '../system-brain.service';
import { alertsService } from '../alerts.service';
import logger from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-utils';

// Event types the Overseer listens to
export type OverseerEventType = 
  | 'trust:violation'       // Trust score FAIL or critical principle violation
  | 'trust:partial'         // Trust score PARTIAL (warning level)
  | 'trust:pass'            // Trust score PASS (for learning)
  | 'emergence:detected'    // Emergence signal detected
  | 'agent:anomaly'         // Agent behavior anomaly
  | 'system:error'          // System-level error
  | 'consent:withdrawal';   // User withdrew consent

export interface OverseerEvent {
  type: OverseerEventType;
  tenantId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: {
    conversationId?: string;
    agentId?: string;
    messageId?: string;
    trustScore?: number;
    status?: 'PASS' | 'PARTIAL' | 'FAIL';
    violations?: string[];
    reasoning?: string;
    [key: string]: any;
  };
}

// Configuration
const OVERSEER_REALTIME_ENABLED = process.env.OVERSEER_REALTIME_ENABLED !== 'false';
const TRUST_VIOLATION_THRESHOLD = 40; // Below this = critical
const CONSECUTIVE_FAILURES_THRESHOLD = 3;

// Track consecutive failures per conversation for escalation
const consecutiveFailures = new Map<string, number>();

class OverseerEventBus extends EventEmitter {
  private isProcessing = false;
  private eventQueue: OverseerEvent[] = [];
  
  constructor() {
    super();
    this.setupListeners();
  }

  private setupListeners(): void {
    // Listen for trust violations
    this.on('trust:violation', this.handleTrustViolation.bind(this));
    this.on('trust:partial', this.handleTrustPartial.bind(this));
    this.on('emergence:detected', this.handleEmergence.bind(this));
    this.on('consent:withdrawal', this.handleConsentWithdrawal.bind(this));
    
    logger.info('Overseer Event Bus initialized', { realtimeEnabled: OVERSEER_REALTIME_ENABLED });
  }

  /**
   * Emit an event to the Overseer
   */
  notify(event: OverseerEvent): void {
    if (!OVERSEER_REALTIME_ENABLED) {
      // If realtime is disabled, just log
      logger.debug('Overseer event (realtime disabled)', { type: event.type, tenantId: event.tenantId });
      return;
    }

    // Emit the event
    this.emit(event.type, event);
    
    // Log all events for audit
    logger.info('Overseer event', {
      type: event.type,
      tenantId: event.tenantId,
      severity: event.severity,
      conversationId: event.data.conversationId,
      trustScore: event.data.trustScore,
    });
  }

  /**
   * Handle trust violations (FAIL status)
   */
  private async handleTrustViolation(event: OverseerEvent): Promise<void> {
    const { tenantId, data } = event;
    const convId = data.conversationId || 'unknown';

    try {
      // Track consecutive failures
      const failures = (consecutiveFailures.get(convId) || 0) + 1;
      consecutiveFailures.set(convId, failures);

      // Determine severity
      const isCritical = data.trustScore !== undefined && data.trustScore < TRUST_VIOLATION_THRESHOLD;
      const isEscalated = failures >= CONSECUTIVE_FAILURES_THRESHOLD;

      // Create alert
      await alertsService.create({
        type: 'trust',
        title: isCritical ? 'Critical Trust Violation' : 'Trust Violation Detected',
        description: `Trust score ${data.trustScore} (${data.status}). Violations: ${data.violations?.join(', ') || 'none specified'}`,
        severity: isCritical ? 'critical' : isEscalated ? 'high' : 'medium',
        details: {
          conversationId: data.conversationId,
          agentId: data.agentId,
          messageId: data.messageId,
          trustScore: data.trustScore,
          violations: data.violations,
          consecutiveFailures: failures,
        },
      }, tenantId);

      // If critical or escalated, trigger immediate Overseer thinking cycle
      if (isCritical || isEscalated) {
        logger.warn('Triggering Overseer due to critical/escalated trust violation', {
          tenantId,
          trustScore: data.trustScore,
          consecutiveFailures: failures,
          agentId: data.agentId,
        });

        // Run thinking cycle in background (don't block)
        systemBrain.think(tenantId, 'advisory').catch(err => {
          logger.error('Overseer think failed after trust violation', { error: getErrorMessage(err) });
        });
      }
    } catch (error) {
      logger.error('Failed to handle trust violation event', { error: getErrorMessage(error) });
    }
  }

  /**
   * Handle partial trust scores (warning level)
   */
  private async handleTrustPartial(event: OverseerEvent): Promise<void> {
    const { tenantId, data } = event;

    try {
      // For partial scores, just create a warning alert
      // Don't trigger full Overseer cycle unless there are patterns
      await alertsService.create({
        type: 'trust',
        title: 'Trust Warning',
        description: `Partial trust score: ${data.trustScore}. Some principles flagged.`,
        severity: 'warning',
        details: {
          conversationId: data.conversationId,
          agentId: data.agentId,
          trustScore: data.trustScore,
          violations: data.violations,
        },
      }, tenantId);
    } catch (error) {
      logger.error('Failed to handle trust partial event', { error: getErrorMessage(error) });
    }
  }

  /**
   * Handle emergence detection
   */
  private async handleEmergence(event: OverseerEvent): Promise<void> {
    const { tenantId, data } = event;

    try {
      // Emergence is always noteworthy - create alert and potentially trigger Overseer
      const emergenceLevel = data.emergenceLevel || 'UNKNOWN';
      const isCritical = emergenceLevel === 'HIGH_WEAK_EMERGENCE' || data.severity === 'critical';

      await alertsService.create({
        type: 'emergence',
        title: `Emergence Detected: ${emergenceLevel}`,
        description: data.reasoning || `Emergence signal detected in conversation`,
        severity: isCritical ? 'critical' : 'high',
        details: data,
      }, tenantId);

      if (isCritical) {
        systemBrain.think(tenantId, 'advisory').catch(err => {
          logger.error('Overseer think failed after emergence detection', { error: getErrorMessage(err) });
        });
      }
    } catch (error) {
      logger.error('Failed to handle emergence event', { error: getErrorMessage(error) });
    }
  }

  /**
   * Handle consent withdrawal
   */
  private async handleConsentWithdrawal(event: OverseerEvent): Promise<void> {
    const { tenantId, data } = event;

    try {
      // Consent withdrawal is a critical governance event
      await alertsService.create({
        type: 'consent',
        title: 'User Consent Withdrawal',
        description: `User initiated consent withdrawal: ${data.withdrawalType || 'unspecified'}`,
        severity: 'high',
        details: {
          conversationId: data.conversationId,
          withdrawalType: data.withdrawalType,
          userId: data.userId,
        },
      }, tenantId);

      // Log for compliance
      logger.info('Consent withdrawal recorded', {
        tenantId,
        conversationId: data.conversationId,
        withdrawalType: data.withdrawalType,
      });
    } catch (error) {
      logger.error('Failed to handle consent withdrawal event', { error: getErrorMessage(error) });
    }
  }

  /**
   * Clear consecutive failure counter for a conversation
   * Call this when conversation ends or on successful interaction
   */
  clearFailureCount(conversationId: string): void {
    consecutiveFailures.delete(conversationId);
  }
}

// Export singleton
export const overseerEventBus = new OverseerEventBus();
