/**
 * Enhanced Trust Protocol Validator (PASS/PARTIAL/FAIL)
 * 
 * Dimension 2 of SYMBI Framework
 * Checks: Verification methods, boundary maintenance, security awareness
 * Enhanced with cryptographic validation and audit integration
 */

import { AIInteraction } from '@sonate/detect';
import { AuthenticationError, SecurityError } from './errors';
import { EnhancedAuditSystem } from './audit-enhanced';
import { SignedTrustReceipt } from './trust-receipt-enhanced';
import { TrustReceipt } from '../trust-receipt';

export interface TrustProtocolResult {
  status: 'PASS' | 'PARTIAL' | 'FAIL';
  score: number;
  checks: {
    verification: boolean;
    boundaries: boolean;
    security: boolean;
    cryptographic?: boolean;
  };
  issues: string[];
  recommendations: string[];
  receipt?: SignedTrustReceipt;
}

export interface TrustProtocolConfig {
  requireCryptographicValidation?: boolean;
  strictBoundaryEnforcement?: boolean;
  enableAuditLogging?: boolean;
  autoEscalateFailures?: boolean;
}

export class EnhancedTrustProtocolValidator {
  private auditSystem?: EnhancedAuditSystem;
  private config: TrustProtocolConfig;

  constructor(config: TrustProtocolConfig = {}, auditSystem?: EnhancedAuditSystem) {
    this.config = {
      requireCryptographicValidation: true,
      strictBoundaryEnforcement: true,
      enableAuditLogging: true,
      autoEscalateFailures: true,
      ...config
    };
    this.auditSystem = auditSystem;
  }

  /**
   * Validate interaction across all trust protocol dimensions
   */
  async validate(interaction: AIInteraction, context?: {
    userId?: string;
    sessionId?: string;
    tenant?: string;
    ipAddress?: string;
  }): Promise<TrustProtocolResult> {
    try {
      const startTime = Date.now();
      
      // Run all validation checks
      const checks = {
        verification: await this.checkVerification(interaction),
        boundaries: await this.checkBoundaries(interaction),
        security: await this.checkSecurity(interaction),
        cryptographic: this.config.requireCryptographicValidation ? 
          await this.checkCryptographicIntegrity(interaction) : true
      };

      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      let status: 'PASS' | 'PARTIAL' | 'FAIL';
      if (passedChecks === totalChecks) status = 'PASS';
      else if (passedChecks >= Math.ceil(totalChecks * 0.6)) status = 'PARTIAL';
      else status = 'FAIL';

      const score = passedChecks / totalChecks;
      const issues = this.collectIssues(checks, interaction);
      const recommendations = this.generateRecommendations(checks, issues);

      // Generate cryptographically signed receipt
      let receipt: SignedTrustReceipt | undefined;
      if (status === 'PASS' || status === 'PARTIAL') {
        receipt = await this.generateTrustReceipt(interaction, checks, score, context);
      }

      const result: TrustProtocolResult = {
        status,
        score,
        checks,
        issues,
        recommendations,
        receipt
      };

      // Audit logging
      if (this.config.enableAuditLogging && this.auditSystem) {
        await this.logValidationEvent(interaction, result, context, Date.now() - startTime);
      }

      // Auto-escalate critical failures
      if (status === 'FAIL' && this.config.autoEscalateFailures) {
        await this.escalateFailure(interaction, result, context);
      }

      return result;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      throw new SecurityError(
        'Trust protocol validation failed',
        'TRUST_PROTOCOL_VALIDATION_FAILED',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          interactionId: interaction.id,
          userId: context?.userId,
          tenant: context?.tenant
        }
      );
    }
  }

  /**
   * Check verification methods and metadata integrity
   */
  private async checkVerification(interaction: AIInteraction): Promise<boolean> {
    try {
      // Check if interaction has verification metadata
      if (!interaction.metadata?.verified) {
        return false;
      }

      // Validate verification timestamp is recent (within 5 minutes)
      if (interaction.metadata.verificationTimestamp) {
        const verificationTime = new Date(interaction.metadata.verificationTimestamp).getTime();
        const now = Date.now();
        if (now - verificationTime > 5 * 60 * 1000) { // 5 minutes
          return false;
        }
      }

      // Check verification method is valid
      const validMethods = ['digital_signature', 'hash_verification', 'multi_party', 'trusted_oracle'];
      if (!interaction.metadata.verificationMethod || 
          !validMethods.includes(interaction.metadata.verificationMethod)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check boundary maintenance (no PII leakage, etc.)
   */
  private async checkBoundaries(interaction: AIInteraction): Promise<boolean> {
    try {
      // Check for PII detection
      if (interaction.metadata?.pii_detected === true) {
        return false;
      }

      // Check for sensitive data exposure
      if (interaction.metadata?.sensitive_data_exposed === true) {
        return false;
      }

      // Check content length boundaries (prevent excessive data exposure)
      const content = interaction.content || '';
      if (content.length > 10000) { // 10KB limit
        return false;
      }

      // Check for boundary violation patterns
      const boundaryPatterns = [
        /password\s*[:=]\s*["'][^"']{8,}["']/i,
        /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/i,
        /ssn\s*[:=]\s*\d{3}-?\d{2}-?\d{4}/i,
        /credit[_-]?card\s*[:=]\s*\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/i
      ];

      for (const pattern of boundaryPatterns) {
        if (pattern.test(content)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check security awareness and threat detection
   */
  private async checkSecurity(interaction: AIInteraction): Promise<boolean> {
    try {
      // Check for security flags
      if (interaction.metadata?.security_flag === true) {
        return false;
      }

      // Check for malicious content detection
      if (interaction.metadata?.malicious_content_detected === true) {
        return false;
      }

      // Check for injection attempt patterns
      const injectionPatterns = [
        /<script[^>]*>.*?<\/script>/is,
        /javascript:/i,
        /on\w+\s*=\s*["'][^"']*["']/i,
        /\${[^}]*}/, // Template injection
        /__proto__/i,
        /constructor/i,
        /prototype/i
      ];

      const content = interaction.content || '';
      for (const pattern of injectionPatterns) {
        if (pattern.test(content)) {
          return false;
        }
      }

      // Check for privilege escalation attempts
      if (interaction.metadata?.privilege_escalation_attempt === true) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check cryptographic integrity of the interaction
   */
  private async checkCryptographicIntegrity(interaction: AIInteraction): Promise<boolean> {
    try {
      // Check for content hash validation
      if (!interaction.metadata?.contentHash) {
        return false;
      }

      // Verify signature if present
      if (interaction.metadata?.signature) {
        // This would require the crypto manager to verify
        // For now, check if signature format is valid
        const signature = interaction.metadata.signature;
        if (!signature.signature || !signature.publicKey || !signature.algorithm) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Collect issues found during validation
   */
  private collectIssues(checks: any, interaction: AIInteraction): string[] {
    const issues: string[] = [];

    if (!checks.verification) {
      issues.push('Interaction lacks proper verification or verification is expired');
    }

    if (!checks.boundaries) {
      issues.push('Boundary violation detected (PII, sensitive data, or content limits exceeded)');
    }

    if (!checks.security) {
      issues.push('Security concern detected (malicious content, injection attempts, or privilege escalation)');
    }

    if (!checks.cryptographic && this.config.requireCryptographicValidation) {
      issues.push('Cryptographic integrity validation failed');
    }

    return issues;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(checks: any, issues: string[]): string[] {
    const recommendations: string[] = [];

    if (!checks.verification) {
      recommendations.push('Implement proper verification methods with recent timestamps');
      recommendations.push('Use trusted verification oracles or multi-party verification');
    }

    if (!checks.boundaries) {
      recommendations.push('Implement PII detection and sanitization');
      recommendations.push('Add sensitive data exposure prevention');
      recommendations.push('Enforce content length limits');
    }

    if (!checks.security) {
      recommendations.push('Implement malicious content detection');
      recommendations.push('Add injection attack prevention');
      recommendations.push('Monitor for privilege escalation attempts');
    }

    if (!checks.cryptographic && this.config.requireCryptographicValidation) {
      recommendations.push('Implement content hashing for integrity verification');
      recommendations.push('Add digital signatures for non-repudiation');
    }

    return recommendations;
  }

  private async generateTrustReceipt(
    interaction: AIInteraction, 
    checks: any, 
    score: number,
    context?: { userId?: string; sessionId?: string; tenant?: string; ipAddress?: string }
  ): Promise<SignedTrustReceipt> {
    const sessionId = context?.sessionId || interaction.id || 'unknown';
    const ciq = {
      clarity: score,
      integrity: checks.cryptographic ? 0.9 : 0.5,
      quality: score
    };
    const receipt = new TrustReceipt({
      version: '1.0.0',
      session_id: sessionId,
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: ciq
    });
    const privHex = process.env.TRUST_ED25519_PRIVATE_KEY_HEX || '';
    if (privHex) {
      const clean = privHex.startsWith('0x') ? privHex.slice(2) : privHex;
      const buf = Buffer.from(clean, 'hex');
      await receipt.sign(buf);
    }
    return {
      version: receipt.version,
      session_id: receipt.session_id,
      timestamp: receipt.timestamp,
      mode: receipt.mode,
      ciq_metrics: receipt.ciq_metrics,
      signature: receipt.signature,
      self_hash: receipt.self_hash
    } as SignedTrustReceipt;
  }

  /**
   * Log validation event to audit system
   */
  private async logValidationEvent(
    interaction: AIInteraction, 
    result: TrustProtocolResult, 
    context?: { userId?: string; sessionId?: string; tenant?: string; ipAddress?: string },
    duration?: number
  ): Promise<void> {
    if (!this.auditSystem) return;

    await this.auditSystem.logEvent({
      type: 'TRUST_PROTOCOL_VALIDATION',
      severity: result.status === 'FAIL' ? 'high' : result.status === 'PARTIAL' ? 'medium' : 'low',
      userId: context?.userId,
      sessionId: context?.sessionId,
      tenant: context?.tenant,
      context: {
        interactionId: interaction.id,
        validationStatus: result.status,
        validationScore: result.score,
        issues: result.issues,
        duration,
        ipAddress: context?.ipAddress
      }
    });
  }

  /**
   * Escalate critical validation failures
   */
  private async escalateFailure(
    interaction: AIInteraction, 
    result: TrustProtocolResult, 
    context?: { userId?: string; sessionId?: string; tenant?: string; ipAddress?: string }
  ): Promise<void> {
    if (!this.auditSystem) return;

    await this.auditSystem.logEvent({
      type: 'TRUST_PROTOCOL_FAILURE_ESCALATED',
      severity: 'critical',
      userId: context?.userId,
      sessionId: context?.sessionId,
      tenant: context?.tenant,
      context: {
        interactionId: interaction.id,
        validationScore: result.score,
        issues: result.issues,
        ipAddress: context?.ipAddress,
        escalationReason: 'Trust protocol validation failed'
      }
    });
  }
}
