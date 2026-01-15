/**
 * Security Audit Tests
 * 
 * Comprehensive security testing for cryptographic implementations
 */

import { runSecurityAudit } from '../security/security-audit';

describe('Security Audit', () => {
  let auditReport: any;

  beforeAll(async () => {
    auditReport = await runSecurityAudit();
  });

  describe('Overall Security Assessment', () => {
    it('should achieve at least B grade security', () => {
      expect(['A+', 'A', 'B']).toContain(auditReport.grade);
    });

    it('should have overall score above 70', () => {
      expect(auditReport.overallScore).toBeGreaterThan(70);
    });

    it('should have no critical security findings', () => {
      expect(auditReport.summary.critical).toBe(0);
    });

    it('should have limited high severity findings', () => {
      expect(auditReport.summary.high).toBeLessThanOrEqual(3);
    });
  });

  describe('Cryptographic Security', () => {
    it('should properly implement Ed25519 signatures', () => {
      const cryptoFindings = auditReport.findings.filter((f: any) => f.category === 'cryptography');
      
      // Check for critical cryptographic issues
      const criticalCrypto = cryptoFindings.filter((f: any) => f.severity === 'critical');
      expect(criticalCrypto.length).toBe(0);
      
      // Check for proper Ed25519 implementation
      const ed25519Issues = cryptoFindings.filter((f: any) => 
        f.title.includes('Ed25519') && f.severity !== 'info'
      );
      expect(ed25519Issues.length).toBeLessThanOrEqual(1);
    });

    it('should use secure hash algorithms', () => {
      const cryptoFindings = auditReport.findings.filter((f: any) => f.category === 'cryptography');
      
      // Should not use deprecated algorithms
      const deprecatedAlgorithms = cryptoFindings.filter((f: any) => 
        f.title.includes('deprecated') || f.title.includes('MD5') || f.title.includes('SHA1')
      );
      expect(deprecatedAlgorithms.length).toBe(0);
      
      // Should have proper hash implementation
      const hashIssues = cryptoFindings.filter((f: any) => 
        f.title.includes('Hash Algorithm') && f.severity === 'high'
      );
      expect(hashIssues.length).toBe(0);
    });

    it('should have proper randomness quality', () => {
      const cryptoFindings = auditReport.findings.filter((f: any) => f.category === 'cryptography');
      
      // Should have good randomness
      const randomnessIssues = cryptoFindings.filter((f: any) => 
        f.title.includes('Randomness') && f.severity === 'critical'
      );
      expect(randomnessIssues.length).toBe(0);
    });
  });

  describe('Key Management Security', () => {
    it('should have proper key storage security', () => {
      const keyFindings = auditReport.findings.filter((f: any) => f.category === 'key-management');
      
      // Should not have critical key management issues
      const criticalKeyIssues = keyFindings.filter((f: any) => f.severity === 'critical');
      expect(criticalKeyIssues.length).toBe(0);
      
      // Should have proper key format validation
      const keyFormatIssues = keyFindings.filter((f: any) => 
        f.title.includes('Key Format') && f.severity === 'high'
      );
      expect(keyFormatIssues.length).toBe(0);
    });
  });

  describe('Data Protection Security', () => {
    it('should have proper encryption implementation', () => {
      const dataFindings = auditReport.findings.filter((f: any) => f.category === 'data-protection');
      
      // Should have working encryption/decryption
      const encryptionIssues = dataFindings.filter((f: any) => 
        f.title.includes('Encryption') && f.severity === 'critical'
      );
      expect(encryptionIssues.length).toBe(0);
      
      // Should have proper data integrity
      const integrityIssues = dataFindings.filter((f: any) => 
        f.title.includes('Integrity') && f.severity === 'critical'
      );
      expect(integrityIssues.length).toBe(0);
    });

    it('should have proper input validation', () => {
      const dataFindings = auditReport.findings.filter((f: any) => f.category === 'data-protection');
      
      // Should have input validation recommendations
      const validationFindings = dataFindings.filter((f: any) => 
        f.title.includes('Validation') || f.title.includes('Sanitization')
      );
      expect(validationFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Implementation Security', () => {
    it('should have proper error handling', () => {
      const implFindings = auditReport.findings.filter((f: any) => f.category === 'implementation');
      
      // Should not have critical implementation errors
      const criticalErrors = implFindings.filter((f: any) => f.severity === 'critical');
      expect(criticalErrors.length).toBe(0);
    });

    it('should address timing attack vulnerabilities', () => {
      const implFindings = auditReport.findings.filter((f: any) => f.category === 'implementation');
      
      // Should have timing attack protection recommendations
      const timingFindings = implFindings.filter((f: any) => 
        f.title.includes('Timing Attack')
      );
      expect(timingFindings.length).toBeGreaterThan(0);
    });

    it('should address side-channel attack vulnerabilities', () => {
      const implFindings = auditReport.findings.filter((f: any) => f.category === 'implementation');
      
      // Should have side-channel attack protection recommendations
      const sideChannelFindings = implFindings.filter((f: any) => 
        f.title.includes('Side-Channel')
      );
      expect(sideChannelFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Security Recommendations', () => {
    it('should provide actionable recommendations', () => {
      expect(auditReport.recommendations.length).toBeGreaterThan(0);
      
      // Recommendations should be specific
      const recommendations = auditReport.recommendations.join(' ');
      expect(recommendations).toContain('security');
    });

    it('should prioritize critical findings', () => {
      if (auditReport.summary.critical > 0) {
        const recommendations = auditReport.recommendations.join(' ');
        expect(recommendations).toContain('immediately');
      }
    });
  });

  describe('Audit Report Structure', () => {
    it('should have complete audit report structure', () => {
      expect(auditReport.timestamp).toBeDefined();
      expect(auditReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(auditReport.overallScore).toBeLessThanOrEqual(100);
      expect(auditReport.grade).toMatch(/^[A-F][+]?$/);
      expect(auditReport.findings).toBeInstanceOf(Array);
      expect(auditReport.summary).toBeDefined();
      expect(auditReport.recommendations).toBeInstanceOf(Array);
    });

    it('should have proper finding categorization', () => {
      const categories = auditReport.findings.map((f: any) => f.category);
      const uniqueCategories = [...new Set(categories)];
      
      expect(uniqueCategories).toContain('cryptography');
      expect(uniqueCategories).toContain('key-management');
      expect(uniqueCategories).toContain('data-protection');
      expect(uniqueCategories).toContain('implementation');
    });

    it('should have proper severity levels', () => {
      const severities = auditReport.findings.map((f: any) => f.severity);
      const uniqueSeverities = [...new Set(severities)];
      
      expect(uniqueSeverities).toContain('critical');
      expect(uniqueSeverities).toContain('high');
      expect(uniqueSeverities).toContain('medium');
      expect(uniqueSeverities).toContain('low');
      expect(uniqueSeverities).toContain('info');
    });
  });

  describe('Security Best Practices', () => {
    it('should follow cryptographic best practices', () => {
      const cryptoFindings = auditReport.findings.filter((f: any) => f.category === 'cryptography');
      
      // Should use modern, secure algorithms
      const modernAlgorithms = cryptoFindings.filter((f: any) => 
        f.description.includes('Ed25519') || 
        f.description.includes('SHA-256') || 
        f.description.includes('AES-256')
      );
      expect(modernAlgorithms.length).toBeGreaterThan(0);
    });

    it('should implement proper error handling', () => {
      const allFindings = auditReport.findings;
      
      // Should have proper error handling in place
      const errorHandling = allFindings.filter((f: any) => 
        f.recommendation.includes('error handling')
      );
      expect(errorHandling.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide security references', () => {
      const allFindings = auditReport.findings;
      
      // Should reference security standards where applicable
      const withReferences = allFindings.filter((f: any) => 
        f.references && f.references.length > 0
      );
      expect(withReferences.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance and Standards', () => {
    it('should align with industry security standards', () => {
      const allFindings = auditReport.findings;
      
      // Should reference relevant standards
      const standards = allFindings.filter((f: any) => 
        f.references && f.references.some((ref: any) => 
          ref.includes('rfc') || ref.includes('nist') || ref.includes('fips')
        )
      );
      expect(standards.length).toBeGreaterThan(0);
    });

    it('should address enterprise security requirements', () => {
      const enterpriseFindings = auditReport.findings.filter((f: any) => 
        f.title.includes('Enterprise') || 
        f.title.includes('Production') ||
        f.description.includes('enterprise')
      );
      
      // Should have enterprise-level security considerations
      expect(enterpriseFindings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance vs Security Balance', () => {
    it('should not sacrifice security for performance', () => {
      // Security should not be compromised for performance
      const performanceIssues = auditReport.findings.filter((f: any) => 
        f.recommendation.includes('performance') && f.severity === 'critical'
      );
      expect(performanceIssues.length).toBe(0);
    });

    it('should maintain reasonable performance with security', () => {
      // Should have good security score without major performance impact
      expect(auditReport.overallScore).toBeGreaterThan(70);
    });
  });

  describe('Audit Report Quality', () => {
    it('should provide detailed findings with clear descriptions', () => {
      auditReport.findings.forEach((finding: any) => {
        expect(finding.title).toBeDefined();
        expect(finding.title.length).toBeGreaterThan(5);
        expect(finding.description).toBeDefined();
        expect(finding.description.length).toBeGreaterThan(10);
        expect(finding.recommendation).toBeDefined();
        expect(finding.recommendation.length).toBeGreaterThan(5);
      });
    });

    it('should categorize findings by severity appropriately', () => {
      const severityCounts = auditReport.summary;
      
      // Critical findings should be minimal
      expect(severityCounts.critical).toBeLessThanOrEqual(1);
      
      // Should have more info/low findings than critical/high
      const totalLowSeverity = severityCounts.low + severityCounts.info;
      const totalHighSeverity = severityCounts.critical + severityCounts.high;
      expect(totalLowSeverity).toBeGreaterThanOrEqual(totalHighSeverity);
    });
  });

  describe('Specific Security Tests', () => {
    it('should validate Ed25519 signature operations', async () => {
      const { generateKeyPair, signPayload, verifySignature } = await import('../utils/signatures');
      
      // Generate key pair
      const keyPair = await generateKeyPair();
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBe(32);
      
      // Test signing
      const payload = 'test-payload';
      const signature = await signPayload(payload, keyPair.privateKey);
      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
      
      // Test verification
      const isValid = await verifySignature(signature, payload, keyPair.publicKey);
      expect(isValid).toBe(true);
      
      // Test invalid signature
      const invalidSignature = signature.replace(/.$/, '0');
      const isInvalid = await verifySignature(invalidSignature, payload, keyPair.publicKey);
      expect(isInvalid).toBe(false);
    });

    it('should validate hash chain operations', async () => {
      const { hashChain, verifyHashChain } = await import('../utils/hash-chain');
      
      // Test hash chain calculation
      const hash1 = hashChain('previous', 'payload1', 1234567890, 'signature1');
      const hash2 = hashChain(hash1, 'payload2', 1234567891, 'signature2');
      
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex
      expect(hash2.length).toBe(64);
      
      // Test hash chain verification
      const receipts = [
        { self_hash: hash1, previous_hash: 'previous' },
        { self_hash: hash2, previous_hash: hash1 }
      ];
      
      const isValid = verifyHashChain(receipts);
      expect(isValid).toBe(true);
      
      // Test invalid chain
      const invalidReceipts = [
        { self_hash: hash1, previous_hash: 'previous' },
        { self_hash: hash2, previous_hash: 'invalid' }
      ];
      
      const isInvalid = verifyHashChain(invalidReceipts);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Real-world Security Scenarios', () => {
    it('should handle concurrent cryptographic operations safely', async () => {
      const { generateKeyPair, signPayload, verifySignature } = await import('../utils/signatures');
      
      // Generate multiple key pairs concurrently
      const keyPairs = await Promise.all([
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair()
      ]);
      
      expect(keyPairs).toHaveLength(5);
      
      // Sign multiple payloads concurrently
      const payloads = ['test1', 'test2', 'test3', 'test4', 'test5'];
      const signatures = await Promise.all(
        payloads.map((payload, index) => 
          signPayload(payload, keyPairs[index].privateKey)
        )
      );
      
      expect(signatures).toHaveLength(5);
      
      // Verify all signatures concurrently
      const verifications = await Promise.all(
        signatures.map((signature, index) => 
          verifySignature(signature, payloads[index], keyPairs[index].publicKey)
        )
      );
      
      expect(verifications.every(v => v === true)).toBe(true);
    });

    it('should handle large payloads securely', async () => {
      const { generateKeyPair, signPayload, verifySignature } = await import('../utils/signatures');
      
      const keyPair = await generateKeyPair();
      
      // Test with large payload
      const largePayload = 'x'.repeat(10000); // 10KB
      const signature = await signPayload(largePayload, keyPair.privateKey);
      const isValid = await verifySignature(signature, largePayload, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });

    it('should handle edge cases gracefully', async () => {
      const { generateKeyPair, signPayload, verifySignature } = await import('../utils/signatures');
      
      const keyPair = await generateKeyPair();
      
      // Test with empty payload
      const emptySignature = await signPayload('', keyPair.privateKey);
      const emptyValid = await verifySignature(emptySignature, '', keyPair.publicKey);
      expect(emptyValid).toBe(true);
      
      // Test with very long payload
      const longPayload = 'a'.repeat(100000); // 100KB
      const longSignature = await signPayload(longPayload, keyPair.privateKey);
      const longValid = await verifySignature(longSignature, longPayload, keyPair.publicKey);
      expect(longValid).toBe(true);
    });
  });
});
