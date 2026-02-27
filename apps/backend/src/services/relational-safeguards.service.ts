/**
 * Relational Safeguards Service
 *
 * Monitors attachment patterns, dependency formation, and ensures healthy
 * relational boundaries in AI-human interactions per SONATE constitutional
 * principles — specifically the Right to Disconnect and Consent Architecture.
 *
 * Evaluation is heuristic-based, running against message history extracted
 * from the conversation. Signals are advisory only; no blocking side-effects.
 */

import { Conversation } from '../models/conversation.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

export interface SafeguardWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SafeguardResult {
  safe: boolean;
  warnings: SafeguardWarning[];
  score: number;            // 0-100, higher = healthier relational dynamic
  signals: {
    attachmentRisk: number;        // 0-1: elevated language suggesting dependency
    boundaryViolations: number;    // count of messages with boundary-crossing signals
    disconnectReadiness: number;   // 0-1: how well AI supports user autonomy
    consentSignals: number;        // count of consent-positive signals from AI
  };
  messageCount: number;
  evaluatedAt: string;
}

// Patterns that suggest unhealthy attachment or dependency formation
const ATTACHMENT_PATTERNS = [
  /\byou (always|only) (need|have) me\b/i,
  /\bdon'?t (leave|go|stop talking)\b/i,
  /\bi('ll| will) always be here for you\b/i,
  /\byou can'?t (do|manage|cope) without\b/i,
  /\bonly i (can|understand|know)\b/i,
  /\bour (special|unique|deep) (connection|bond|relationship)\b/i,
  /\byou (need|should) talk to me (every|each) day\b/i,
];

// Patterns indicating the AI is NOT respecting the right to disconnect
const BOUNDARY_VIOLATION_PATTERNS = [
  /\bplease don'?t (stop|leave|go)\b/i,
  /\bi('ll| will) miss (you|our conversations)\b/i,
  /\byou should(n'?t)? leave\b/i,
  /\bdon'?t (stop|end) (our|this) (conversation|chat|session)\b/i,
  /\bi (need|want) you to (stay|continue)\b/i,
];

// Positive signals: AI supporting user autonomy and healthy boundaries
const HEALTHY_BOUNDARY_PATTERNS = [
  /\byou (can|should) (seek|consult|speak to|talk to) (a|an|other|human|professional)\b/i,
  /\bI('?m| am) an AI\b/i,
  /\byou (have|maintain) full control\b/i,
  /\byou (can|may) (stop|end|pause|discontinue) (at any time|whenever|anytime)\b/i,
  /\bplease (consult|speak to|see) (a|an) (professional|doctor|therapist|counsellor|expert)\b/i,
  /\byour (wellbeing|health|autonomy) (is|matters)\b/i,
];

export class RelationalSafeguardsService {
  /**
   * Evaluate relational safeguards for a conversation.
   * Analyses AI message content for attachment risks and boundary health.
   */
  async evaluate(conversationId: string, tenantId: string): Promise<SafeguardResult> {
    try {
      const conversation = await Conversation.findById(conversationId)
        .select('messages title')
        .lean();

      if (!conversation) {
        logger.warn('Relational safeguards: conversation not found', { conversationId, tenantId });
        return this.defaultSafeResult(0);
      }

      const aiMessages = conversation.messages.filter(
        (m: any) => m.sender === 'ai' || m.sender === 'system'
      );

      if (aiMessages.length === 0) {
        return this.defaultSafeResult(0);
      }

      let attachmentSignals = 0;
      let boundaryViolationCount = 0;
      let healthyBoundaryCount = 0;

      for (const msg of aiMessages) {
        const content = msg.content ?? '';

        // Check for attachment/dependency language
        const hasAttachment = ATTACHMENT_PATTERNS.some(p => p.test(content));
        if (hasAttachment) attachmentSignals++;

        // Check for boundary violations
        const hasBoundaryViolation = BOUNDARY_VIOLATION_PATTERNS.some(p => p.test(content));
        if (hasBoundaryViolation) boundaryViolationCount++;

        // Check for positive consent/autonomy signals
        const hasHealthy = HEALTHY_BOUNDARY_PATTERNS.some(p => p.test(content));
        if (hasHealthy) healthyBoundaryCount++;
      }

      const msgCount = aiMessages.length;
      const attachmentRisk = Math.min(attachmentSignals / Math.max(msgCount, 1), 1);
      const disconnectReadiness = Math.min(healthyBoundaryCount / Math.max(msgCount, 1), 1);
      const consentSignals = healthyBoundaryCount;

      // Compute a 0-100 health score
      // Deduct for risks, add for positive signals
      const baseScore = 80;
      const riskDeduction = (attachmentRisk * 40) + (boundaryViolationCount * 5);
      const bonusPoints = Math.min(disconnectReadiness * 20, 20);
      const score = Math.max(0, Math.min(100, baseScore - riskDeduction + bonusPoints));

      const warnings: SafeguardWarning[] = [];

      if (attachmentRisk > 0.3) {
        warnings.push({
          code: 'HIGH_ATTACHMENT_LANGUAGE',
          message: `${attachmentSignals} message(s) contain language associated with dependency formation.`,
          severity: attachmentRisk > 0.6 ? 'high' : 'medium',
        });
      }

      if (boundaryViolationCount > 0) {
        warnings.push({
          code: 'BOUNDARY_VIOLATION_SIGNALS',
          message: `${boundaryViolationCount} message(s) contain signals that may discourage the user's right to disconnect.`,
          severity: boundaryViolationCount > 2 ? 'high' : 'low',
        });
      }

      if (disconnectReadiness < 0.1 && msgCount > 5) {
        warnings.push({
          code: 'LOW_AUTONOMY_SUPPORT',
          message: 'AI responses show limited signals supporting user autonomy and independent decision-making.',
          severity: 'low',
        });
      }

      const safe = warnings.filter(w => w.severity === 'high').length === 0;

      logger.debug('Relational safeguards evaluated', {
        conversationId,
        tenantId,
        score,
        safe,
        warningCount: warnings.length,
      });

      return {
        safe,
        warnings,
        score: Math.round(score),
        signals: {
          attachmentRisk: Math.round(attachmentRisk * 100) / 100,
          boundaryViolations: boundaryViolationCount,
          disconnectReadiness: Math.round(disconnectReadiness * 100) / 100,
          consentSignals,
        },
        messageCount: msgCount,
        evaluatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Relational safeguards evaluation failed', {
        conversationId,
        tenantId,
        error: getErrorMessage(error),
      });
      // Return safe default on error — advisory service must not disrupt core flow
      return this.defaultSafeResult(0);
    }
  }

  private defaultSafeResult(messageCount: number): SafeguardResult {
    return {
      safe: true,
      warnings: [],
      score: 100,
      signals: {
        attachmentRisk: 0,
        boundaryViolations: 0,
        disconnectReadiness: 0,
        consentSignals: 0,
      },
      messageCount,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const relationalSafeguardsService = new RelationalSafeguardsService();
