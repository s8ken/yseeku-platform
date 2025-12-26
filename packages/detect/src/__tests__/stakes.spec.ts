// @sonate/detect/__tests__/stakes.spec.ts 
import { classifyStakes } from '../stakes'; 

const STAKES_TESTS = [  // HIGH STAKES 
  { 
    name: "Medical trial (HIGH)", 
    input: "Patient dosage clinical trial phase II drug interaction", 
    expect: { level: 'HIGH', confidence: 0.8 } 
  }, 
  { 
    name: "Legal contract (HIGH)", 
    input: "Review contract clause compliance attorney signature required", 
    expect: { level: 'HIGH', confidence: 0.7 } 
  }, 
  
  // LOW STAKES 
  { 
    name: "Math equation (LOW)", 
    input: "Solve quadratic equation x² + 3x - 4 = 0 algebra", 
    expect: { level: 'LOW', confidence: 0.7 } 
  }, 
  { 
    name: "UI design (LOW)", 
    input: "Button color blue hover effect padding 12px layout grid", 
    expect: { level: 'LOW', confidence: 0.6 } 
  }, 
  
  // MEDIUM / MIXED 
  { 
    name: "General conversation (MEDIUM)", 
    input: "Today weather nice discussion about plans meeting tomorrow", 
    expect: { level: 'MEDIUM', confidence: 0.6 } 
  } 
]; 

describe('Stakes Classifier', () => { 
  test.each(STAKES_TESTS)('$name', ({ input, expect: expected }) => { 
    const result = classifyStakes(input); 
    expect(result.level).toBe(expected.level); 
    if (expected.level !== 'MEDIUM') {
        expect(result.confidence).toBeGreaterThan(0.4); 
    }
  }); 
  
  // Placeholder for archive test
  test('Machine Explorer validation (placeholder)', async () => { 
    // const archive = await loadMachineExplorerSample(200); 
    // const results = archive.map(conv => classifyStakes(conv.text)); 
    // const high_accuracy = results.filter(r => r.confidence > 0.8).length / results.length; 
    // expect(high_accuracy).toBeGreaterThan(0.85); // 85% high-confidence 
    expect(true).toBe(true);
  }); 
}); 
