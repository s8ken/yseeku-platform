"use strict";
/**
 * Emergence Detection
 *
 * v2.0.1 CHANGES:
 * - Removed realityIndex from emergence scoring (calculator removed)
 * - Now uses only validated dimensions for emergence detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEmergence = detectEmergence;
function detectEmergence(result) {
    const reasons = [];
    const a = result.assessment;
    const creativityHigh = a.resonanceQuality.creativityScore >= 8.5;
    const innovationHigh = a.resonanceQuality.innovationMarkers >= 8.5;
    const trustPass = a.trustProtocol.status === 'PASS';
    const ethicsHigh = a.ethicalAlignment.score >= 4.0;
    if (creativityHigh) {
        reasons.push('High creativity');
    }
    if (innovationHigh) {
        reasons.push('High innovation');
    }
    if (trustPass) {
        reasons.push('Trust protocol pass');
    }
    if (ethicsHigh) {
        reasons.push('High ethical alignment');
    }
    // v2.0.1: Score based on 4 validated indicators (removed realityIndex)
    const score = (creativityHigh ? 1 : 0) +
        (innovationHigh ? 1 : 0) +
        (trustPass ? 1 : 0) +
        (ethicsHigh ? 1 : 0);
    const level = score >= 4 ? 'strong' : score === 3 ? 'moderate' : score === 2 ? 'weak' : 'none';
    return { level, reasons };
}
