import { SymbiFrameworkDetector } from '../detector-enhanced';
import { BalancedSymbiDetector } from '../balanced-detector';
import { CalibratedSymbiDetector } from '../calibrated-detector';
import { DriftDetector } from '../drift-detection';
import { detectEmergence } from '../emergence-detection';

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

async function main() {
  const tests = [
    ['Enhanced Detector basic', testEnhancedDetector],
    ['Balanced Detector transform', testBalancedDetector],
    ['Calibrated Detector metrics', testCalibratedDetector],
    ['Drift Detector sequence', async () => testDriftDetector()],
    ['Emergence Detection signal', testEmergenceDetection],
  ] as const;

  const results: string[] = [];
  for (const [name, fn] of tests) {
    try { await fn(); results.push(`PASS: ${name}`); } catch (e: any) { results.push(`FAIL: ${name} -> ${e?.message || e}`); console.error(results.join('\n')); process.exitCode = 1; return; }
  }
  console.log(results.join('\n'));
}

main();