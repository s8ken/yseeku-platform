// Comprehensive mock for @sonate/detect package
const ResonanceClient = jest.fn().mockImplementation(() => ({
  healthCheck: jest.fn().mockResolvedValue(true),
  generateReceipt: jest.fn().mockResolvedValue({
    sonate_dimensions: {
      trust_protocol: 'test-protocol',
      resonance_score: 0.85,
    },
  }),
}));

const SonateFrameworkDetector = jest.fn().mockImplementation(() => ({
  detectFramework: jest.fn().mockResolvedValue('express'),
  validateFramework: jest.fn().mockResolvedValue(true),
  detect: jest.fn().mockResolvedValue({
    trust_protocol: 'PASS',
    ethical_alignment: 4.5,
    resonance_quality: 'ADVANCED',
    timestamp: Date.now(),
    receipt_hash: 'a'.repeat(64),
  }),
}));

const TrustProtocolValidator = jest.fn().mockImplementation(() => ({
  validate: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
  validateReceipt: jest.fn().mockResolvedValue(true),
}));

const EthicalAlignmentScorer = jest.fn().mockImplementation(() => ({
  score: jest.fn().mockResolvedValue({ overall: 0.85, dimensions: {} }),
  evaluate: jest.fn().mockResolvedValue(0.85),
}));

const ResonanceQualityMeasurer = jest.fn().mockImplementation(() => ({
  measure: jest.fn().mockResolvedValue({ quality: 0.8, coherence: 0.9 }),
  evaluate: jest.fn().mockResolvedValue(0.8),
}));

const DriftDetector = jest.fn().mockImplementation(() => ({
  detect: jest.fn().mockResolvedValue({ drifted: false, magnitude: 0 }),
  analyze: jest.fn().mockResolvedValue({ drift: 0 }),
}));

const isLLMAvailable = jest.fn().mockReturnValue(true);
const getLLMStatus = jest.fn().mockReturnValue({ available: true, provider: 'anthropic' });

module.exports = {
  ResonanceClient,
  SonateFrameworkDetector,
  TrustProtocolValidator,
  EthicalAlignmentScorer,
  ResonanceQualityMeasurer,
  DriftDetector,
  isLLMAvailable,
  getLLMStatus,
};