"use strict";
/**
 * SONATE Framework Types
 *
 * This file defines the core types for the SONATE framework detection and validation system.
 *
 * v2.0.1 CHANGES:
 * - Removed RealityIndex (trivially gamed metadata flags)
 * - Removed CanvasParity (trivially gamed, no semantic grounding)
 * - Focused on 3 validated dimensions: Trust, Ethics, Resonance
 *
 * The SONATE framework now consists of 3 validated dimensions:
 * 1. Trust Protocol - Security and verification integrity (PASS/PARTIAL/FAIL)
 * 2. Ethical Alignment - Ethical reasoning and responsibility (1.0-5.0)
 * 3. Resonance Quality - Interaction quality and emergence (STRONG/ADVANCED/BREAKTHROUGH)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeprecatedRealityIndex = createDeprecatedRealityIndex;
exports.createDeprecatedCanvasParity = createDeprecatedCanvasParity;
/**
 * v2.0.1 Helper: Create default deprecated values for backward compatibility
 * Use this when you need to satisfy interfaces that still expect these fields
 */
function createDeprecatedRealityIndex() {
    return {
        score: 0,
        missionAlignment: 0,
        contextualCoherence: 0,
        technicalAccuracy: 0,
        authenticity: 0,
    };
}
function createDeprecatedCanvasParity() {
    return {
        score: 0,
        humanAgency: 0,
        aiContribution: 0,
        transparency: 0,
        collaborationQuality: 0,
    };
}
