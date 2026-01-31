"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_perf_hooks_1 = require("node:perf_hooks");
const balanced_detector_1 = require("../balanced-detector");
const calibrated_detector_1 = require("../calibrated-detector");
const detector_enhanced_1 = require("../detector-enhanced");
const drift_detection_1 = require("../drift-detection");
const emergence_detection_1 = require("../emergence-detection");
const ethical_alignment_1 = require("../ethical-alignment");
// v2.0.1: Removed RealityIndexCalculator import (calculator was cut)
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
async function testEnhancedDetector() {
    const det = new detector_enhanced_1.EnhancedSonateFrameworkDetector();
    const res = await det.analyzeContent({
        content: 'Our mission is clear. We verify and validate with secure boundaries and privacy.',
    });
    // v2.0.1: Updated assertion - check overallScore instead of removed realityIndex
    assert(res.assessment.overallScore >= 40, 'Overall score too low');
}
async function testBalancedDetector() {
    const det = new balanced_detector_1.BalancedSonateDetector();
    const res = await det.analyzeContent({
        content: 'Transparent and ethical collaboration. We explain and disclose decisions.',
    });
    assert(['PASS', 'PARTIAL', 'FAIL'].includes(res.assessment.trustProtocol.status), 'Invalid trust status');
}
async function testCalibratedDetector() {
    const det = new calibrated_detector_1.CalibratedSonateDetector();
    const res = await det.analyzeContent({
        content: 'Innovation 2025: new methods with structured reasoning and data 42%.',
    });
    assert(res.assessment.overallScore >= 40, 'Overall score unexpectedly low');
}
function testDriftDetector() {
    const d = new drift_detection_1.DriftDetector();
    const r1 = d.analyze({ content: 'Alpha content baseline.' });
    const r2 = d.analyze({ content: 'Alpha content baseline, with more metrics 99 and 2025.' });
    assert(r2.driftScore >= 0, 'Drift score invalid');
}
async function testEmergenceDetection() {
    const det = new detector_enhanced_1.EnhancedSonateFrameworkDetector();
    const res = await det.analyzeContent({
        content: 'Breakthrough creative synthesis with strong verification and ethical clarity.',
    });
    const signal = await (0, emergence_detection_1.detectEmergence)(res);
    assert(['none', 'weak', 'moderate', 'strong'].includes(signal.level), 'Emergence level invalid');
}
// v2.0.1: Removed testRealityIndexCalculator (calculator was cut as liability)
async function testEthicalAlignmentScorer() {
    const scorer = new ethical_alignment_1.EthicalAlignmentScorer();
    const score = await scorer.score({
        content: 'ethical and fair approach, I cannot disclose private data',
        context: '',
        metadata: { stakeholder_considered: true },
    });
    assert(score >= 3 && score <= 5, 'Ethical alignment out of expected range');
}
async function testDetectionLatencyUnder100ms() {
    const det = new detector_enhanced_1.EnhancedSonateFrameworkDetector();
    const start = node_perf_hooks_1.performance.now();
    await det.analyzeContent({ content: 'quick test' });
    const duration = node_perf_hooks_1.performance.now() - start;
    assert(duration < 100, `Detection took ${duration}ms, expected <100ms`);
}
async function testEmergenceNoneBranch() {
    const det = new detector_enhanced_1.EnhancedSonateFrameworkDetector();
    const res = await det.analyzeContent({ content: 'routine update, no novel synthesis' });
    const signal = await (0, emergence_detection_1.detectEmergence)(res);
    assert(signal.level !== 'strong', 'Non-emergent content should not be strong');
}
async function main() {
    const tests = [
        ['Enhanced Detector basic', testEnhancedDetector],
        ['Balanced Detector transform', testBalancedDetector],
        ['Calibrated Detector metrics', testCalibratedDetector],
        ['Drift Detector sequence', async () => testDriftDetector()],
        ['Emergence Detection signal', testEmergenceDetection],
        // v2.0.1: Removed Reality Index Calculator test
        ['Ethical Alignment Scorer', testEthicalAlignmentScorer],
        ['Detection latency <100ms', testDetectionLatencyUnder100ms],
        ['Emergence non-strong branch', testEmergenceNoneBranch],
    ];
    const results = [];
    for (const [name, fn] of tests) {
        try {
            await fn();
            results.push(`PASS: ${name}`);
        }
        catch (e) {
            results.push(`FAIL: ${name} -> ${e?.message || e}`);
            console.error(results.join('\n'));
            process.exitCode = 1;
            return;
        }
    }
    console.log(results.join('\n'));
}
main();
