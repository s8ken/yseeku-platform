"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEmergence = detectEmergence;
function detectEmergence(result) {
    const reasons = [];
    const a = result.assessment;
    const creativityHigh = a.resonanceQuality.creativityScore >= 8.5;
    const innovationHigh = a.resonanceQuality.innovationMarkers >= 8.5;
    const realityStrong = a.realityIndex.score >= 8.0;
    const trustPass = a.trustProtocol.status === 'PASS';
    if (creativityHigh) {
        reasons.push('High creativity');
    }
    if (innovationHigh) {
        reasons.push('High innovation');
    }
    if (realityStrong) {
        reasons.push('Strong reality grounding');
    }
    if (trustPass) {
        reasons.push('Trust protocol pass');
    }
    const score = (creativityHigh ? 1 : 0) +
        (innovationHigh ? 1 : 0) +
        (realityStrong ? 1 : 0) +
        (trustPass ? 1 : 0);
    const level = score >= 4 ? 'strong' : score === 3 ? 'moderate' : score === 2 ? 'weak' : 'none';
    return { level, reasons };
}
