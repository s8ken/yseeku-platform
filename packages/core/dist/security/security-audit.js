"use strict";
/**
 * Security Audit Tool
 *
 * Comprehensive cryptographic implementation security analysis
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditor = void 0;
exports.runSecurityAudit = runSecurityAudit;
const crypto = __importStar(require("crypto"));
const hash_chain_1 = require("../utils/hash-chain");
const signatures_1 = require("../utils/signatures");
class SecurityAuditor {
    constructor() {
        this.findings = [];
    }
    /**
     * Perform comprehensive security audit
     */
    async audit() {
        this.findings = [];
        // Cryptographic implementation audit
        await this.auditCryptographicImplementations();
        // Key management audit
        await this.auditKeyManagement();
        // Data protection audit
        await this.auditDataProtection();
        // Implementation security audit
        await this.auditImplementationSecurity();
        return this.generateReport();
    }
    async auditCryptographicImplementations() {
        // Test Ed25519 implementation
        await this.testEd25519Implementation();
        // Test hash chain implementation
        await this.testHashChainImplementation();
        // Test randomness quality
        await this.testRandomnessQuality();
        // Test algorithm usage
        await this.testAlgorithmUsage();
    }
    async testEd25519Implementation() {
        try {
            // Generate test key pair
            const keyPair = await (0, signatures_1.generateKeyPair)();
            // Test signing and verification
            const testPayload = 'test-payload-for-security-audit';
            const signature = await (0, signatures_1.signPayload)(testPayload, keyPair.privateKey);
            const isValid = await (0, signatures_1.verifySignature)(signature, testPayload, keyPair.publicKey);
            if (!isValid) {
                this.addFinding({
                    severity: 'critical',
                    category: 'cryptography',
                    title: 'Ed25519 Signature Verification Failed',
                    description: 'Generated signature could not be verified with corresponding public key',
                    recommendation: 'Review Ed25519 implementation and ensure proper key handling',
                    references: ['https://tools.ietf.org/html/rfc8032'],
                });
            }
            // Test key pair generation
            const keyPair2 = await (0, signatures_1.generateKeyPair)();
            if (Buffer.compare(keyPair.privateKey, keyPair2.privateKey) === 0) {
                this.addFinding({
                    severity: 'high',
                    category: 'cryptography',
                    title: 'Weak Randomness in Key Generation',
                    description: 'Generated private keys are identical, indicating weak randomness',
                    recommendation: 'Use cryptographically secure random number generator',
                    references: ['https://csrc.nist.gov/publications/fips/fips186-4/final/'],
                });
            }
            // Test key format validation
            if (keyPair.privateKey.length !== 32 || keyPair.publicKey.length !== 32) {
                this.addFinding({
                    severity: 'high',
                    category: 'cryptography',
                    title: 'Invalid Key Format',
                    description: `Ed25519 keys must be 32 bytes, got private: ${keyPair.privateKey.length}, public: ${keyPair.publicKey.length}`,
                    recommendation: 'Ensure proper key format validation and handling',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'critical',
                category: 'cryptography',
                title: 'Ed25519 Implementation Error',
                description: `Error in Ed25519 operations: ${error?.message || error}`,
                recommendation: 'Review Ed25519 library integration and error handling',
            });
        }
    }
    async testHashChainImplementation() {
        try {
            // Test hash chain integrity
            const sessionId = 'test-session';
            const genesis = (0, hash_chain_1.hashChain)('previous', 'payload1', 1234567890, 'signature1');
            const next = (0, hash_chain_1.hashChain)(genesis, 'payload2', 1234567891, 'signature2');
            // Verify hash chain calculation
            const expectedNext = crypto
                .createHash('sha256')
                .update(`${genesis}payload21234567891signature2`)
                .digest('hex');
            if (next !== expectedNext) {
                this.addFinding({
                    severity: 'critical',
                    category: 'cryptography',
                    title: 'Hash Chain Calculation Error',
                    description: 'Hash chain calculation does not match expected result',
                    recommendation: 'Review hash chain implementation and ensure proper concatenation',
                });
            }
            // Test hash chain verification
            const receipts = [
                { self_hash: genesis, previous_hash: 'previous' },
                { self_hash: next, previous_hash: genesis },
            ];
            const isValid = (0, hash_chain_1.verifyHashChain)(receipts);
            if (!isValid) {
                this.addFinding({
                    severity: 'high',
                    category: 'cryptography',
                    title: 'Hash Chain Verification Failed',
                    description: 'Hash chain verification returned false for valid chain',
                    recommendation: 'Review hash chain verification logic',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'critical',
                category: 'cryptography',
                title: 'Hash Chain Implementation Error',
                description: `Error in hash chain operations: ${error?.message || error}`,
                recommendation: 'Review hash chain implementation and error handling',
            });
        }
    }
    async testRandomnessQuality() {
        try {
            // Test Node.js crypto randomness
            const randomBytes1 = crypto.randomBytes(32);
            const randomBytes2 = crypto.randomBytes(32);
            if (randomBytes1.equals(randomBytes2)) {
                this.addFinding({
                    severity: 'critical',
                    category: 'cryptography',
                    title: 'Cryptographically Weak Randomness',
                    description: 'crypto.randomBytes generated identical values',
                    recommendation: 'Use proper CSPRNG and check system entropy sources',
                });
            }
            // Test randomness distribution (basic chi-square test)
            const samples = Array.from({ length: 1000 }, () => crypto.randomBytes(1)[0]);
            const expected = samples.length / 256; // Expected count per byte value
            const chiSquare = samples.reduce((sum, byte) => {
                const count = samples.filter((b) => b === byte).length;
                return sum + Math.pow(count - expected, 2) / expected;
            }, 0);
            // Chi-square with 255 degrees of freedom, critical value ~293 at p=0.05
            if (chiSquare > 293) {
                this.addFinding({
                    severity: 'medium',
                    category: 'cryptography',
                    title: 'Randomness Distribution Anomaly',
                    description: `Chi-square test indicates non-uniform distribution: ${chiSquare.toFixed(2)}`,
                    recommendation: 'Investigate randomness source and consider alternative CSPRNG',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'high',
                category: 'cryptography',
                title: 'Randomness Testing Error',
                description: `Error in randomness testing: ${error?.message || error}`,
                recommendation: 'Review randomness testing implementation',
            });
        }
    }
    async testAlgorithmUsage() {
        // Check for deprecated algorithms
        const deprecatedAlgorithms = ['md5', 'sha1', 'des', 'rc4'];
        // This would require code analysis - for now, check if we're using proper algorithms
        const hashAlgorithms = ['sha256', 'sha512'];
        const signatureAlgorithms = ['ed25519'];
        // Verify we're using secure hash algorithms
        try {
            const testString = 'security-audit-test';
            const hash = crypto.createHash('sha256').update(testString).digest('hex');
            if (!hash || hash.length !== 64) {
                this.addFinding({
                    severity: 'high',
                    category: 'cryptography',
                    title: 'Hash Algorithm Issue',
                    description: 'SHA-256 hash generation failed or produced invalid result',
                    recommendation: 'Verify hash algorithm implementation',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'high',
                category: 'cryptography',
                title: 'Hash Algorithm Error',
                description: `Error in hash algorithm: ${error?.message || error}`,
                recommendation: 'Review hash algorithm implementation',
            });
        }
    }
    async auditKeyManagement() {
        // Test key storage security
        await this.testKeyStorageSecurity();
        // Test key rotation procedures
        await this.testKeyRotation();
        // Test key access controls
        await this.testKeyAccessControls();
    }
    async testKeyStorageSecurity() {
        // Check for hardcoded keys (this would require code scanning)
        this.addFinding({
            severity: 'medium',
            category: 'key-management',
            title: 'Key Storage Security Review Required',
            description: 'Manual review needed to ensure no hardcoded keys in source code',
            recommendation: 'Use environment variables or secure key management systems',
        });
        // Test key serialization
        try {
            const keyPair = await (0, signatures_1.generateKeyPair)();
            const privateKeyHex = Buffer.from(keyPair.privateKey).toString('hex');
            const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');
            if (privateKeyHex.length !== 64 || publicKeyHex.length !== 64) {
                this.addFinding({
                    severity: 'high',
                    category: 'key-management',
                    title: 'Key Serialization Issue',
                    description: 'Key serialization produces unexpected hex length',
                    recommendation: 'Verify key serialization and deserialization logic',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'high',
                category: 'key-management',
                title: 'Key Serialization Error',
                description: `Error in key serialization: ${error instanceof Error ? error.message : String(error)}`,
                recommendation: 'Review key serialization implementation',
            });
        }
    }
    async testKeyRotation() {
        this.addFinding({
            severity: 'medium',
            category: 'key-management',
            title: 'Key Rotation Procedure Review',
            description: 'Ensure key rotation procedures are implemented and tested',
            recommendation: 'Implement automated key rotation with proper verification',
        });
    }
    async testKeyAccessControls() {
        this.addFinding({
            severity: 'medium',
            category: 'key-management',
            title: 'Key Access Controls Review',
            description: 'Verify proper access controls for private key operations',
            recommendation: 'Implement principle of least privilege for key access',
        });
    }
    async auditDataProtection() {
        // Test data encryption
        await this.testDataEncryption();
        // Test data integrity
        await this.testDataIntegrity();
        // Test data sanitization
        await this.testDataSanitization();
    }
    async testDataEncryption() {
        try {
            // Test encryption/decryption
            const algorithm = 'aes-256-gcm';
            const key = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            const plaintext = 'test-data-for-encryption';
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            if (decrypted !== plaintext) {
                this.addFinding({
                    severity: 'high',
                    category: 'data-protection',
                    title: 'Encryption/Decryption Mismatch',
                    description: 'Decrypted data does not match original plaintext',
                    recommendation: 'Review encryption implementation and key management',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'high',
                category: 'data-protection',
                title: 'Encryption Implementation Error',
                description: `Error in encryption operations: ${error?.message || error}`,
                recommendation: 'Review encryption implementation and error handling',
            });
        }
    }
    async testDataIntegrity() {
        try {
            const data = 'test-data-for-integrity-check';
            const hash1 = crypto.createHash('sha256').update(data).digest('hex');
            const hash2 = crypto.createHash('sha256').update(data).digest('hex');
            if (hash1 !== hash2) {
                this.addFinding({
                    severity: 'critical',
                    category: 'data-protection',
                    title: 'Data Integrity Check Failed',
                    description: 'Hash values differ for identical data',
                    recommendation: 'Review hash implementation and ensure consistency',
                });
            }
        }
        catch (error) {
            this.addFinding({
                severity: 'high',
                category: 'data-protection',
                title: 'Data Integrity Error',
                description: `Error in integrity checking: ${error?.message || error}`,
                recommendation: 'Review data integrity implementation',
            });
        }
    }
    async testDataSanitization() {
        this.addFinding({
            severity: 'medium',
            category: 'data-protection',
            title: 'Data Sanitization Review',
            description: 'Ensure proper input sanitization and validation',
            recommendation: 'Implement comprehensive input validation and sanitization',
        });
    }
    async auditImplementationSecurity() {
        // Test error handling
        await this.testErrorHandling();
        // Test timing attacks
        await this.testTimingAttacks();
        // Test side-channel attacks
        await this.testSideChannelAttacks();
    }
    async testErrorHandling() {
        try {
            // Test with invalid inputs
            await (0, signatures_1.signPayload)('', new Uint8Array(32));
            this.addFinding({
                severity: 'medium',
                category: 'implementation',
                title: 'Input Validation Review',
                description: 'Review input validation for cryptographic operations',
                recommendation: 'Implement proper input validation and error handling',
            });
        }
        catch (error) {
            // Expected to fail, but should handle gracefully
        }
    }
    async testTimingAttacks() {
        this.addFinding({
            severity: 'medium',
            category: 'implementation',
            title: 'Timing Attack Protection Review',
            description: 'Review implementation for timing attack vulnerabilities',
            recommendation: 'Use constant-time operations for sensitive comparisons',
        });
    }
    async testSideChannelAttacks() {
        this.addFinding({
            severity: 'medium',
            category: 'implementation',
            title: 'Side-Channel Attack Protection Review',
            description: 'Review implementation for side-channel attack vulnerabilities',
            recommendation: 'Implement proper memory cleanup and constant-time operations',
        });
    }
    addFinding(finding) {
        this.findings.push(finding);
    }
    generateReport() {
        const summary = {
            critical: this.findings.filter((f) => f.severity === 'critical').length,
            high: this.findings.filter((f) => f.severity === 'high').length,
            medium: this.findings.filter((f) => f.severity === 'medium').length,
            low: this.findings.filter((f) => f.severity === 'low').length,
            info: this.findings.filter((f) => f.severity === 'info').length,
        };
        // Calculate overall score
        const score = this.calculateScore(summary);
        const grade = this.calculateGrade(score);
        const recommendations = this.generateRecommendations(summary);
        return {
            timestamp: Date.now(),
            overallScore: score,
            grade,
            findings: this.findings,
            summary,
            recommendations,
        };
    }
    calculateScore(summary) {
        let score = 100;
        score -= summary.critical * 25;
        score -= summary.high * 15;
        score -= summary.medium * 10;
        score -= summary.low * 5;
        score -= Number(summary.info);
        return Math.max(0, Math.min(100, score));
    }
    calculateGrade(score) {
        if (score >= 95) {
            return 'A+';
        }
        if (score >= 90) {
            return 'A';
        }
        if (score >= 80) {
            return 'B';
        }
        if (score >= 70) {
            return 'C';
        }
        if (score >= 60) {
            return 'D';
        }
        return 'F';
    }
    generateRecommendations(summary) {
        const recommendations = [];
        if (summary.critical > 0) {
            recommendations.push('Address all critical security findings immediately');
        }
        if (summary.high > 2) {
            recommendations.push('Prioritize high-severity security improvements');
        }
        if (summary.medium > 5) {
            recommendations.push('Plan medium-severity security enhancements');
        }
        if (summary.critical === 0 && summary.high === 0) {
            recommendations.push('Security posture is good - continue monitoring');
        }
        return recommendations;
    }
}
exports.SecurityAuditor = SecurityAuditor;
/**
 * Run security audit
 */
async function runSecurityAudit() {
    const auditor = new SecurityAuditor();
    return await auditor.audit();
}
