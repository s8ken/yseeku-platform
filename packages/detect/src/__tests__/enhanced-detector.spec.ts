import { EnhancedSymbiFrameworkDetector } from '../detector-enhanced';

describe('EnhancedSymbiFrameworkDetector', () => {
  test('analyzeContent produces assessment and insights', async () => {
    const det = new EnhancedSymbiFrameworkDetector();
    const res = await det.analyzeContent({ content: 'Creative synthesis with secure verification and ethical clarity.' });
    expect(res.assessment.id).toBeTruthy();
    expect(typeof res.assessment.overallScore).toBe('number');
    expect(res.insights.strengths.length + res.insights.weaknesses.length + res.insights.recommendations.length).toBeGreaterThan(0);
  });
});
