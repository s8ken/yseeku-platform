// Mock for @sonate/lab — satisfies jest module resolution in CI
// where the package dist has not been built yet.
class ConversationalMetrics {
  constructor() {}
  recordTurn() { return { alertLevel: 'green', phaseShift: 0, metrics: {} }; }
  getMetricsSummary() { return {}; }
  getTransitionLog() { return []; }
  clear() {}
  exportAuditData() { return {}; }
}

module.exports = {
  ConversationalMetrics,
};
