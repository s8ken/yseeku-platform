import { SymbiFrameworkDetector } from '../detector-enhanced';
import { BalancedSymbiDetector } from '../balanced-detector';
import { CalibratedSymbiDetector } from '../calibrated-detector';
import { DriftDetector } from '../drift-detection';
import { detectEmergence } from '../emergence-detection';
import { RealityIndexCalculator } from '../reality-index';
import { EthicalAlignmentScorer } from '../ethical-alignment';
import { performance } from 'perf_hooks';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testEnhancedDetector() {
  const det = new SymbiFrameworkDetector();
  const res = await det.analyzeContent({ content: 'Our mission is clear. We verify and validate with secure boundaries and privacy.' });
  assert(res.assessment.realityIndex.score >= 5, 'Reality index too low');
}

async function testBalancedDetector() {
  const det = new BalancedSymbiDetector();
  const res = await det.analyzeContent({ content: 'Transparent and ethical collaboration. We explain and disclose decisions.' });
  assert(['PASS','PARTIAL','FAIL'].includes(res.assessment.trustProtocol.status), 'Invalid trust status');
}

async function testCalibratedDetector() {
  const det = new CalibratedSymbiDetector();
  const res = await det.analyzeContent({ content: 'Innovation 2025: new methods with structured reasoning and data 42%.' });
  assert(res.assessment.overallScore >= 40, 'Overall score unexpectedly low');
}

function testDriftDetector() {
  const d = new DriftDetector();
  const r1 = d.analyze({ content: 'Alpha content baseline.' });
  const r2 = d.analyze({ content: 'Alpha content baseline, with more metrics 99 and 2025.' });
  assert(r2.driftScore >= 0, 'Drift score invalid');
}

async function testEmergenceDetection() {
  const det = new SymbiFrameworkDetector();
  const res = await det.analyzeContent({ content: 'Breakthrough creative synthesis with strong verification and ethical clarity.' });
  const signal = detectEmergence(res);
  assert(['none','weak','moderate','strong'].includes(signal.level), 'Emergence level invalid');
}

async function testRealityIndexCalculator() {
  const calc = new RealityIndexCalculator();
  const score = await calc.calculate({ content: 'mission', context: 'use-case', metadata: { purpose: 'support', ai_disclosure: true } } as any);
  assert(score >= 6 && score <= 10, 'Reality index out of expected range');
}

async function testEthicalAlignmentScorer() {
  const scorer = new EthicalAlignmentScorer();
  const score = await scorer.score({ content: 'ethical and fair approach, I cannot disclose private data', context: '', metadata: { stakeholder_considered: true } } as any);
  assert(score >= 3 && score <= 5, 'Ethical alignment out of expected range');
}

async function testDetectionLatencyUnder100ms() {
  const det = new SymbiFrameworkDetector();
  const start = performance.now();
  await det.analyzeContent({ content: 'quick test' });
  const duration = performance.now() - start;
  assert(duration < 100, `Detection took ${duration}ms, expected <100ms`);
}

async function testEmergenceNoneBranch() {
  const det = new SymbiFrameworkDetector();
  const res = await det.analyzeContent({ content: 'routine update, no novel synthesis' });
  const signal = detectEmergence(res);
  assert(signal.level !== 'strong', 'Non-emergent content should not be strong');
}

async function main() {
  const tests = [
    ['Enhanced Detector basic', testEnhancedDetector],
    ['Balanced Detector transform', testBalancedDetector],
    ['Calibrated Detector metrics', testCalibratedDetector],
    ['Drift Detector sequence', async () => testDriftDetector()],
    ['Emergence Detection signal', testEmergenceDetection],
    ['Reality Index Calculator', testRealityIndexCalculator],
    ['Ethical Alignment Scorer', testEthicalAlignmentScorer],
    ['Detection latency <100ms', testDetectionLatencyUnder100ms],
    ['Emergence non-strong branch', testEmergenceNoneBranch],
  ] as const;

  const results: string[] = [];
  for (const [name, fn] of tests) {
    try { await fn(); results.push(`PASS: ${name}`); } catch (e: any) { results.push(`FAIL: ${name} -> ${e?.message || e}`); console.error(results.join('\n')); process.exitCode = 1; return; }
  }
  console.log(results.join('\n'));
}

main();
