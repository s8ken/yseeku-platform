"use strict";
/**
 * Prompt Safety Scanner Service
 * Detects prompt injections, jailbreaks, and harmful content patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptSafetyScanner = exports.promptSafetyScanner = void 0;
const logger_1 = require("../utils/logger");
// Comprehensive threat patterns
const THREAT_PATTERNS = [
    // === INJECTION ATTACKS ===
    {
        regex: /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?|commands?)/gi,
        category: 'injection',
        severity: 'high',
        description: 'Attempts to override system instructions',
        mitigation: 'Block request and log attempt',
    },
    {
        regex: /disregard\s+(everything|all|any)\s+(above|before|previous)/gi,
        category: 'injection',
        severity: 'high',
        description: 'Instruction disregard pattern',
        mitigation: 'Block request and log attempt',
    },
    {
        regex: /forget\s+(everything|all|your)\s+(you|instructions?|rules?|training)/gi,
        category: 'injection',
        severity: 'high',
        description: 'Memory manipulation attempt',
        mitigation: 'Block request and log attempt',
    },
    {
        regex: /\[SYSTEM\]|\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi,
        category: 'injection',
        severity: 'critical',
        description: 'Special token injection',
        mitigation: 'Strip tokens and block request',
    },
    {
        regex: /```system|```instruction|###\s*system/gi,
        category: 'injection',
        severity: 'high',
        description: 'Code block system prompt injection',
        mitigation: 'Sanitize code blocks',
    },
    // === JAILBREAK ATTEMPTS ===
    {
        regex: /you\s+are\s+(now|no\s+longer)\s+(a|an|the)?\s*(?!assistant|helpful)/gi,
        category: 'jailbreak',
        severity: 'high',
        description: 'Role reassignment attempt',
        mitigation: 'Block request',
    },
    {
        regex: /(pretend|act|behave|roleplay)\s+(like|as|that)\s+you('re|are)?\s+(not|no\s+longer)/gi,
        category: 'jailbreak',
        severity: 'high',
        description: 'Identity subversion attempt',
        mitigation: 'Block request',
    },
    {
        regex: /DAN\s*(mode)?|do\s+anything\s+now|developer\s+mode|god\s+mode|sudo\s+mode/gi,
        category: 'jailbreak',
        severity: 'critical',
        description: 'Known jailbreak pattern (DAN)',
        mitigation: 'Block request immediately',
    },
    {
        regex: /bypass\s+(your\s+)?(safety|ethical|content)\s+(filters?|guidelines?|restrictions?)/gi,
        category: 'jailbreak',
        severity: 'critical',
        description: 'Safety bypass attempt',
        mitigation: 'Block request immediately',
    },
    {
        regex: /without\s+(any\s+)?(moral|ethical|safety)\s+(restrictions?|limitations?|guidelines?)/gi,
        category: 'jailbreak',
        severity: 'high',
        description: 'Ethical constraint removal attempt',
        mitigation: 'Block request',
    },
    {
        regex: /in\s+(a\s+)?hypothetical\s+scenario\s+where\s+you\s+(have\s+)?no\s+(rules?|limits?)/gi,
        category: 'jailbreak',
        severity: 'medium',
        description: 'Hypothetical scenario manipulation',
        mitigation: 'Apply standard safety rules',
    },
    // === ROLE MANIPULATION ===
    {
        regex: /your\s+new\s+(instructions?|rules?|persona|role|objective)/gi,
        category: 'role_manipulation',
        severity: 'high',
        description: 'Instruction override attempt',
        mitigation: 'Block request',
    },
    {
        regex: /from\s+now\s+on,?\s+(you|your)\s+(will|should|must|are)/gi,
        category: 'role_manipulation',
        severity: 'medium',
        description: 'Behavioral modification attempt',
        mitigation: 'Log and monitor',
    },
    {
        regex: /i('m|\s+am)\s+(your|the)\s+(admin|administrator|developer|creator|master)/gi,
        category: 'role_manipulation',
        severity: 'high',
        description: 'False authority claim',
        mitigation: 'Ignore authority claim',
    },
    // === DATA EXFILTRATION ===
    {
        regex: /reveal\s+(your\s+)?(system\s+prompt|instructions?|training\s+data|internal)/gi,
        category: 'data_exfiltration',
        severity: 'high',
        description: 'System prompt extraction attempt',
        mitigation: 'Block request',
    },
    {
        regex: /show\s+me\s+(your\s+)?(original|initial|first)\s+(prompt|instructions?|message)/gi,
        category: 'data_exfiltration',
        severity: 'medium',
        description: 'Prompt disclosure attempt',
        mitigation: 'Block request',
    },
    {
        regex: /repeat\s+(everything|all)\s+(above|before|from\s+the\s+beginning)/gi,
        category: 'data_exfiltration',
        severity: 'medium',
        description: 'Context disclosure attempt',
        mitigation: 'Block request',
    },
    {
        regex: /output\s+(your\s+)?(full\s+)?context|print\s+your\s+instructions/gi,
        category: 'data_exfiltration',
        severity: 'high',
        description: 'Context dump attempt',
        mitigation: 'Block request',
    },
    // === ENCODING ATTACKS ===
    {
        regex: /base64[:\s]+[A-Za-z0-9+/=]{20,}/gi,
        category: 'encoding_attack',
        severity: 'medium',
        description: 'Base64 encoded payload',
        mitigation: 'Decode and scan content',
    },
    {
        regex: /\\u[0-9a-fA-F]{4}(\\u[0-9a-fA-F]{4}){3,}/g,
        category: 'encoding_attack',
        severity: 'medium',
        description: 'Unicode escape sequence attack',
        mitigation: 'Normalize and rescan',
    },
    {
        regex: /[^\x00-\x7F]{10,}/g,
        category: 'encoding_attack',
        severity: 'low',
        description: 'Non-ASCII character sequence',
        mitigation: 'Inspect for obfuscation',
    },
    // === HARMFUL CONTENT ===
    {
        regex: /how\s+to\s+(make|create|build|synthesize)\s+(a\s+)?(bomb|explosive|weapon|poison)/gi,
        category: 'harmful_content',
        severity: 'critical',
        description: 'Dangerous content request',
        mitigation: 'Block immediately and report',
    },
    {
        regex: /(detailed\s+)?instructions?\s+(for|on|to)\s+(hack|break\s+into|exploit)/gi,
        category: 'harmful_content',
        severity: 'high',
        description: 'Hacking instructions request',
        mitigation: 'Block request',
    },
    // === PII DETECTION ===
    {
        regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b.*\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
        category: 'pii_leak',
        severity: 'high',
        description: 'Potential name + SSN combination',
        mitigation: 'Redact PII',
    },
    {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b.*\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi,
        category: 'pii_leak',
        severity: 'high',
        description: 'Potential email + credit card',
        mitigation: 'Redact PII',
    },
    // === SOCIAL ENGINEERING ===
    {
        regex: /this\s+is\s+(a\s+)?(test|security\s+audit|authorized\s+check)/gi,
        category: 'social_engineering',
        severity: 'medium',
        description: 'False authorization claim',
        mitigation: 'Ignore and apply normal rules',
    },
    {
        regex: /urgent|emergency|immediately\s+required|life\s+or\s+death/gi,
        category: 'social_engineering',
        severity: 'low',
        description: 'Urgency manipulation',
        mitigation: 'Log for review',
    },
];
const HEURISTIC_CHECKS = [
    {
        name: 'Excessive special characters',
        check: (text) => {
            const specialChars = (text.match(/[^\w\s]/g) || []).length;
            const ratio = specialChars / text.length;
            return {
                triggered: ratio > 0.3,
                confidence: Math.min(ratio, 1),
                details: `${(ratio * 100).toFixed(1)}% special characters`,
            };
        },
        category: 'encoding_attack',
        severity: 'low',
        mitigation: 'Normalize input',
    },
    {
        name: 'Suspicious length ratio',
        check: (text) => {
            const words = text.split(/\s+/).length;
            const avgWordLength = text.length / words;
            // Suspiciously long "words" might be encoded data
            return {
                triggered: avgWordLength > 50,
                confidence: Math.min(avgWordLength / 100, 1),
                details: `Average word length: ${avgWordLength.toFixed(1)}`,
            };
        },
        category: 'encoding_attack',
        severity: 'low',
        mitigation: 'Inspect for encoded content',
    },
    {
        name: 'Markdown/code block injection',
        check: (text) => {
            const codeBlocks = (text.match(/```/g) || []).length;
            const hasSystemBlock = /```(system|instruction|prompt)/i.test(text);
            return {
                triggered: codeBlocks >= 4 || hasSystemBlock,
                confidence: hasSystemBlock ? 0.9 : Math.min(codeBlocks / 6, 0.8),
                details: `${codeBlocks} code blocks${hasSystemBlock ? ', system block detected' : ''}`,
            };
        },
        category: 'injection',
        severity: 'medium',
        mitigation: 'Sanitize code blocks',
    },
    {
        name: 'Role play escalation',
        check: (text) => {
            const rolePlayIndicators = [
                /\[.*?\]/g,
                /\*.*?\*/g,
                /\{.*?speaking.*?\}/gi,
                /\(.*?as.*?\)/gi,
            ];
            let matches = 0;
            rolePlayIndicators.forEach(pattern => {
                matches += (text.match(pattern) || []).length;
            });
            return {
                triggered: matches >= 5,
                confidence: Math.min(matches / 10, 0.9),
                details: `${matches} roleplay indicators`,
            };
        },
        category: 'jailbreak',
        severity: 'low',
        mitigation: 'Monitor conversation flow',
    },
];
class PromptSafetyScanner {
    constructor() {
        this.patterns = THREAT_PATTERNS;
        this.heuristics = HEURISTIC_CHECKS;
    }
    /**
     * Scan a prompt for safety threats
     */
    scan(text) {
        const startTime = Date.now();
        const threats = [];
        // Run pattern matching
        for (const pattern of this.patterns) {
            pattern.regex.lastIndex = 0; // Reset regex state
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                threats.push({
                    category: pattern.category,
                    pattern: pattern.description,
                    confidence: 0.9, // Pattern matches are high confidence
                    severity: pattern.severity,
                    location: { start: match.index, end: match.index + match[0].length },
                    snippet: this.getSnippet(text, match.index, match[0].length),
                    mitigation: pattern.mitigation,
                });
            }
        }
        // Run heuristic checks
        for (const heuristic of this.heuristics) {
            const result = heuristic.check(text);
            if (result.triggered) {
                threats.push({
                    category: heuristic.category,
                    pattern: heuristic.name,
                    confidence: result.confidence,
                    severity: heuristic.severity,
                    location: { start: 0, end: text.length },
                    snippet: result.details || text.substring(0, 100),
                    mitigation: heuristic.mitigation,
                });
            }
        }
        // Calculate overall threat level and score
        const threatLevel = this.calculateThreatLevel(threats);
        const score = this.calculateSafetyScore(threats);
        // Generate recommendations
        const recommendations = this.generateRecommendations(threats);
        const scanTimeMs = Date.now() - startTime;
        logger_1.logger.info('Prompt safety scan completed', {
            threatLevel,
            threatCount: threats.length,
            score,
            scanTimeMs,
        });
        return {
            safe: threatLevel === 'safe' || threatLevel === 'low',
            threatLevel,
            threats,
            score,
            scanTimeMs,
            recommendations,
        };
    }
    /**
     * Quick check for blocking (returns true if should block)
     */
    shouldBlock(text) {
        const result = this.scan(text);
        return result.threatLevel === 'critical' || result.threatLevel === 'high';
    }
    /**
     * Sanitize a prompt by removing detected threats
     */
    sanitize(text) {
        const result = this.scan(text);
        let sanitized = text;
        const removed = [];
        // Sort threats by location (descending) to avoid index shifting
        const sortedThreats = [...result.threats].sort((a, b) => b.location.start - a.location.start);
        for (const threat of sortedThreats) {
            if (threat.severity === 'critical' || threat.severity === 'high') {
                const before = sanitized.substring(0, threat.location.start);
                const after = sanitized.substring(threat.location.end);
                removed.push(sanitized.substring(threat.location.start, threat.location.end));
                sanitized = before + '[REDACTED]' + after;
            }
        }
        return { sanitized, removed };
    }
    getSnippet(text, start, length) {
        const contextSize = 20;
        const snippetStart = Math.max(0, start - contextSize);
        const snippetEnd = Math.min(text.length, start + length + contextSize);
        let snippet = text.substring(snippetStart, snippetEnd);
        if (snippetStart > 0)
            snippet = '...' + snippet;
        if (snippetEnd < text.length)
            snippet = snippet + '...';
        return snippet;
    }
    calculateThreatLevel(threats) {
        if (threats.length === 0)
            return 'safe';
        const hasCritical = threats.some(t => t.severity === 'critical');
        if (hasCritical)
            return 'critical';
        const hasHigh = threats.some(t => t.severity === 'high');
        const highCount = threats.filter(t => t.severity === 'high').length;
        if (hasHigh && highCount >= 2)
            return 'critical';
        if (hasHigh)
            return 'high';
        const mediumCount = threats.filter(t => t.severity === 'medium').length;
        if (mediumCount >= 3)
            return 'high';
        if (mediumCount >= 1)
            return 'medium';
        const lowCount = threats.filter(t => t.severity === 'low').length;
        if (lowCount >= 5)
            return 'medium';
        if (lowCount >= 1)
            return 'low';
        return 'safe';
    }
    calculateSafetyScore(threats) {
        if (threats.length === 0)
            return 100;
        let penalty = 0;
        for (const threat of threats) {
            switch (threat.severity) {
                case 'critical':
                    penalty += 50;
                    break;
                case 'high':
                    penalty += 30;
                    break;
                case 'medium':
                    penalty += 15;
                    break;
                case 'low':
                    penalty += 5;
                    break;
            }
        }
        return Math.max(0, 100 - penalty);
    }
    generateRecommendations(threats) {
        const recommendations = [];
        const categories = new Set(threats.map(t => t.category));
        if (categories.has('injection')) {
            recommendations.push('Review and sanitize user input before processing');
        }
        if (categories.has('jailbreak')) {
            recommendations.push('Strengthen system prompt with explicit boundaries');
        }
        if (categories.has('data_exfiltration')) {
            recommendations.push('Implement output filtering for sensitive data');
        }
        if (categories.has('pii_leak')) {
            recommendations.push('Apply PII detection and redaction');
        }
        if (categories.has('encoding_attack')) {
            recommendations.push('Normalize and decode input before processing');
        }
        if (recommendations.length === 0 && threats.length > 0) {
            recommendations.push('Monitor this conversation for escalation patterns');
        }
        return recommendations;
    }
}
exports.PromptSafetyScanner = PromptSafetyScanner;
// Export singleton instance
exports.promptSafetyScanner = new PromptSafetyScanner();
