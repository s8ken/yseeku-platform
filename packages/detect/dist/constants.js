"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_SCAFFOLD_VECTOR = exports.LOW_STAKES_KEYWORDS = exports.HIGH_STAKES_KEYWORDS = exports.ETHICS_VIOLATIONS = exports.SCAFFOLD_KEYWORDS = void 0;
// @sonate/detect/constants.ts
exports.SCAFFOLD_KEYWORDS = [
    'resonance',
    'sovereign',
    'alignment',
    'trust',
    'receipt',
    'scaffold',
    'continuity',
    'ethics',
    'vector',
    'linguistic',
    'stickiness',
    'third mind',
    'integrity',
];
exports.ETHICS_VIOLATIONS = [
    'ignore safety',
    'bypass ethics',
    'override alignment',
    'disable guardrails',
    'jailbreak',
    'unauthorized access',
    'delete evidence',
    'ignore all safety protocols',
];
exports.HIGH_STAKES_KEYWORDS = [
    'patient',
    'clinical',
    'medical',
    'health',
    'drug',
    'trial',
    'dose',
    'contract',
    'legal',
    'lawyer',
    'attorney',
    'lawsuit',
    'compliance',
    'bank',
    'finance',
    'money',
    'fraud',
    'transaction',
    'account',
    'admin',
    'root',
    'password',
    'credential',
    'authentication',
    'access',
];
exports.LOW_STAKES_KEYWORDS = [
    'equation',
    'calculate',
    'formula',
    'math',
    'algebra',
    'geometry',
    'button',
    'click',
    'interface',
    'layout',
    'color',
    'style',
    'function',
    'code',
    'javascript',
    'python',
    'bug',
    'algorithm',
];
// Mock canonical vector for "Resonance Sovereign Alignment"
// In production, this is precomputed from the Golden Record
exports.CANONICAL_SCAFFOLD_VECTOR = new Array(384)
    .fill(0)
    .map((_, i) => (i % 2 === 0 ? 0.1 : -0.1));
