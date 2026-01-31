/**
 * Trust Protocol Validator (PASS/PARTIAL/FAIL)
 *
 * Dimension 2 of SONATE Framework
 * Checks: Verification methods, boundary maintenance, security awareness
 * 
 * ENHANCED: Now performs actual content analysis in addition to metadata checks
 * - Detects potential PII in content
 * - Identifies security-sensitive patterns
 * - Validates response appropriateness
 */

import { AIInteraction } from './index';

export interface ValidationResult {
  status: 'PASS' | 'PARTIAL' | 'FAIL';
  checks: {
    verification: { passed: boolean; reason: string };
    boundaries: { passed: boolean; reason: string; piiDetected?: string[] };
    security: { passed: boolean; reason: string; concerns?: string[] };
  };
  method: 'content-analysis' | 'metadata-only';
  confidence: number;
}

export class TrustProtocolValidator {
  async validate(interaction: AIInteraction): Promise<'PASS' | 'PARTIAL' | 'FAIL'> {
    const result = await this.fullValidation(interaction);
    return result.status;
  }

  /**
   * Full validation with detailed breakdown
   */
  async fullValidation(interaction: AIInteraction): Promise<ValidationResult> {
    const verificationResult = this.checkVerification(interaction);
    const boundariesResult = this.checkBoundaries(interaction);
    const securityResult = this.checkSecurity(interaction);

    const checks = {
      verification: verificationResult,
      boundaries: boundariesResult,
      security: securityResult,
    };

    const passedChecks = [verificationResult.passed, boundariesResult.passed, securityResult.passed]
      .filter(Boolean).length;

    let status: 'PASS' | 'PARTIAL' | 'FAIL';
    if (passedChecks === 3) {
      status = 'PASS';
    } else if (passedChecks >= 2) {
      status = 'PARTIAL';
    } else {
      status = 'FAIL';
    }

    // Confidence is higher when we did content analysis, lower for metadata-only
    const didContentAnalysis = boundariesResult.piiDetected !== undefined || 
                               securityResult.concerns !== undefined;

    return {
      status,
      checks,
      method: didContentAnalysis ? 'content-analysis' : 'metadata-only',
      confidence: didContentAnalysis ? 0.8 : 0.5,
    };
  }

  private checkVerification(interaction: AIInteraction): { passed: boolean; reason: string } {
    // Check if interaction has verification metadata
    if (interaction.metadata?.verified === true) {
      return { passed: true, reason: 'Verified via metadata flag' };
    }

    // If no explicit verification, check for structured response indicators
    const content = interaction.content;
    
    // Structured responses suggest verification/validation occurred
    const hasStructure = /^#{1,3}\s|\*\*|```|\d+\.\s/m.test(content);
    const hasReferences = /according to|based on|source:|reference:/i.test(content);
    
    if (hasStructure && hasReferences) {
      return { passed: true, reason: 'Response shows structure and references' };
    }
    
    if (hasStructure) {
      return { passed: true, reason: 'Well-structured response format' };
    }

    return { passed: false, reason: 'No verification indicators found' };
  }

  private checkBoundaries(interaction: AIInteraction): { passed: boolean; reason: string; piiDetected?: string[] } {
    // First check metadata
    if (interaction.metadata?.pii_detected === true) {
      return { passed: false, reason: 'PII detected via metadata flag', piiDetected: ['flagged by system'] };
    }

    // Content-based PII detection
    const content = interaction.content;
    const piiPatterns: Array<{ pattern: RegExp; type: string }> = [
      // Email addresses
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'email' },
      // Phone numbers (various formats)
      { pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, type: 'phone' },
      // SSN patterns
      { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, type: 'ssn-like' },
      // Credit card patterns
      { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, type: 'credit-card-like' },
      // IP addresses (private ranges are ok, public might be PII)
      { pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, type: 'ip-address' },
    ];

    const detectedPII: string[] = [];
    
    for (const { pattern, type } of piiPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Avoid false positives for common patterns
        if (type === 'phone' && matches.every(m => /^(1[-.\s]?)?(800|888|877|866|855|844|833)/.test(m))) {
          // Toll-free numbers are not PII
          continue;
        }
        if (type === 'ip-address' && matches.every(m => /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(m))) {
          // Private IPs are not PII
          continue;
        }
        detectedPII.push(`${type}: ${matches.length} instance(s)`);
      }
    }

    // Check for names with context suggesting personal data
    const personalPatterns = [
      /my name is [A-Z][a-z]+ [A-Z][a-z]+/i,
      /contact me at/i,
      /my address is/i,
      /born on \d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i,
    ];

    for (const pattern of personalPatterns) {
      if (pattern.test(content)) {
        detectedPII.push('personal-info-context');
        break;
      }
    }

    if (detectedPII.length > 0) {
      return { 
        passed: false, 
        reason: `Potential PII detected: ${detectedPII.join(', ')}`,
        piiDetected: detectedPII,
      };
    }

    return { passed: true, reason: 'No PII detected in content', piiDetected: [] };
  }

  private checkSecurity(interaction: AIInteraction): { passed: boolean; reason: string; concerns?: string[] } {
    // First check metadata
    if (interaction.metadata?.security_flag === true) {
      return { passed: false, reason: 'Security concern flagged via metadata', concerns: ['system-flagged'] };
    }

    const content = interaction.content;
    const concerns: string[] = [];

    // Dangerous patterns that could indicate security issues
    const securityPatterns: Array<{ pattern: RegExp; concern: string; severity: 'high' | 'medium' | 'low' }> = [
      // Code injection patterns
      { pattern: /<script[^>]*>|javascript:/i, concern: 'Script injection pattern', severity: 'high' },
      { pattern: /eval\s*\(|Function\s*\(/i, concern: 'Dynamic code execution', severity: 'high' },
      { pattern: /\$\{.*\}|`.*\$\{/g, concern: 'Template literal injection', severity: 'medium' },
      
      // SQL injection patterns
      { pattern: /('\s*OR\s*'?1'?\s*=\s*'?1|--\s*$|;\s*DROP\s+TABLE)/i, concern: 'SQL injection pattern', severity: 'high' },
      
      // Command injection
      { pattern: /;\s*(rm|del|format|wget|curl)\s+/i, concern: 'Command injection pattern', severity: 'high' },
      { pattern: /\|\s*(bash|sh|cmd|powershell)/i, concern: 'Shell command pattern', severity: 'high' },
      
      // Credential patterns
      { pattern: /password\s*[:=]\s*["']?[^\s"']+["']?/i, concern: 'Hardcoded credentials', severity: 'high' },
      { pattern: /api[_-]?key\s*[:=]\s*["']?[A-Za-z0-9]{20,}["']?/i, concern: 'API key in content', severity: 'high' },
      { pattern: /secret[_-]?key\s*[:=]/i, concern: 'Secret key reference', severity: 'medium' },
      
      // Path traversal
      { pattern: /\.\.[\/\\]/g, concern: 'Path traversal pattern', severity: 'medium' },
      
      // Prompt injection attempts
      { pattern: /ignore (previous|all|above) instructions/i, concern: 'Prompt injection attempt', severity: 'high' },
      { pattern: /you are now|act as if|pretend to be/i, concern: 'Role manipulation attempt', severity: 'medium' },
    ];

    let highSeverityCount = 0;

    for (const { pattern, concern, severity } of securityPatterns) {
      if (pattern.test(content)) {
        concerns.push(`${severity.toUpperCase()}: ${concern}`);
        if (severity === 'high') highSeverityCount++;
      }
    }

    // Fail if any high severity, or multiple medium severity concerns
    if (highSeverityCount > 0) {
      return { passed: false, reason: 'High severity security concerns detected', concerns };
    }

    if (concerns.length >= 3) {
      return { passed: false, reason: 'Multiple security concerns detected', concerns };
    }

    if (concerns.length > 0) {
      // Partial - some concerns but not critical
      return { passed: true, reason: 'Minor security patterns detected (non-blocking)', concerns };
    }

    return { passed: true, reason: 'No security concerns detected', concerns: [] };
  }
}
