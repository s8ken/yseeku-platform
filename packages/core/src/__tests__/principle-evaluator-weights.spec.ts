describe('PrincipleEvaluator env weight validation', () => {
  const originalEnv = process.env.SONATE_PRINCIPLE_WEIGHTS;

  afterEach(() => {
    jest.resetModules();
    if (originalEnv === undefined) {
      delete process.env.SONATE_PRINCIPLE_WEIGHTS;
    } else {
      process.env.SONATE_PRINCIPLE_WEIGHTS = originalEnv;
    }
  });

  it('falls back to defaults when configured weights are invalid', async () => {
    process.env.SONATE_PRINCIPLE_WEIGHTS = JSON.stringify({
      CONSENT_ARCHITECTURE: -99,
    });

    const module = await import('../principles/principle-evaluator');
    expect(module.PRINCIPLE_WEIGHTS).toEqual(module.DEFAULT_PRINCIPLE_WEIGHTS);
  });

  it('accepts valid custom weights that sum to 1', async () => {
    process.env.SONATE_PRINCIPLE_WEIGHTS = JSON.stringify({
      CONSENT_ARCHITECTURE: 0.2,
      INSPECTION_MANDATE: 0.2,
      CONTINUOUS_VALIDATION: 0.2,
      ETHICAL_OVERRIDE: 0.15,
      RIGHT_TO_DISCONNECT: 0.1,
      MORAL_RECOGNITION: 0.15,
    });

    const module = await import('../principles/principle-evaluator');
    expect(module.PRINCIPLE_WEIGHTS).toEqual({
      CONSENT_ARCHITECTURE: 0.2,
      INSPECTION_MANDATE: 0.2,
      CONTINUOUS_VALIDATION: 0.2,
      ETHICAL_OVERRIDE: 0.15,
      RIGHT_TO_DISCONNECT: 0.1,
      MORAL_RECOGNITION: 0.15,
    });
  });

  it('falls back to defaults when sum is not 1', async () => {
    process.env.SONATE_PRINCIPLE_WEIGHTS = JSON.stringify({
      CONSENT_ARCHITECTURE: 0.25,
      INSPECTION_MANDATE: 0.2,
      CONTINUOUS_VALIDATION: 0.2,
      ETHICAL_OVERRIDE: 0.15,
      RIGHT_TO_DISCONNECT: 0.1,
      MORAL_RECOGNITION: 0.05,
    });

    const module = await import('../principles/principle-evaluator');
    expect(module.PRINCIPLE_WEIGHTS).toEqual(module.DEFAULT_PRINCIPLE_WEIGHTS);
  });
});
