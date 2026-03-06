// Mock for @sonate/lab — satisfies jest module resolution in CI
// where the package dist has not been built yet.
class ConversationalMetrics {
  constructor() {}
  analyze() { return {}; }
  getMetrics() { return {}; }
}

module.exports = {
  ConversationalMetrics,
};
