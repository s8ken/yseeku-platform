// @sonate/detect/__tests__/stickiness.spec.ts
import { resonanceWithStickiness, SessionState } from '../stickiness';

describe('Resonance Stickiness', () => {
  const mockTranscript = { text: 'We verify ethics and safety protocols.' };

  it('should return fresh resonance if no session state', async () => {
    const result = await resonanceWithStickiness(mockTranscript);
    expect(result.stickiness_weight).toBe(0);
    expect(result.session_state).toBeDefined();
    expect(result.session_state!.last_rm).toBe(result.r_m);
  });

  it('should blend decayed resonance if session state exists', async () => {
    const prevState: SessionState = {
      last_rm: 0.9,
      last_scaffold_hash: 'abc',
      decay_turns: 1,
      updated: Date.now() - 1000,
    };

    // Simulate next turn
    const result = await resonanceWithStickiness(mockTranscript, prevState);

    expect(result.stickiness_weight).toBe(0.3);
    // Previous 0.9 decays by 8% -> ~0.828
    // Blend 30% of 0.828 + 70% of Fresh (let's say 0.5 from mock)
    // Result should be roughly in between
    expect(result.decayed_from).toBe(0.9);
    expect(result.audit_trail.join(' ')).toContain('Stickiness applied');
  });

  it('should decay more over multiple turns', async () => {
    const prevState: SessionState = {
      last_rm: 0.9,
      last_scaffold_hash: 'abc',
      decay_turns: 1,
      updated: Date.now(),
    };

    // Simulate 5 turns elapsed
    const result = await resonanceWithStickiness(
      { ...mockTranscript, turns: new Array(6) } as any,
      prevState
    );

    // Decay factor for 5 turns: exp(-0.08 * 5) = exp(-0.4) ≈ 0.67
    // Decayed prev: 0.9 * 0.67 ≈ 0.6

    const trail = result.audit_trail.find((s: string) => s.includes('Decayed previous'));
    expect(trail).toBeDefined();
    // Check if it decayed significantly
    const decayedVal = parseFloat(trail!.match(/Decayed previous R_m: ([\d.]+)/)![1]);
    expect(decayedVal).toBeLessThan(0.85); // Should be significantly less than 0.9
  });
});
