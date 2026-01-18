// Comprehensive mock for @sonate/detect package
const ResonanceClient = jest.fn().mockImplementation(() => ({
  healthCheck: jest.fn().mockResolvedValue(true),
  generateReceipt: jest.fn().mockResolvedValue({
    symbi_dimensions: {
      trust_protocol: 'test-protocol',
      resonance_score: 0.85,
    },
  }),
}));

const SymbiFrameworkDetector = jest.fn().mockImplementation(() => ({
  detectFramework: jest.fn().mockResolvedValue('express'),
  validateFramework: jest.fn().mockResolvedValue(true),
}));

module.exports = {
  ResonanceClient,
  SymbiFrameworkDetector,
  // Add any other exports from @sonate/detect as needed
};