const { TrustProtocol, TRUST_PRINCIPLES, ProtocolUtils } = require('../protocol/dist/index.js');

console.log('🚀 Symbi Trust Protocol Example\n');

// Initialize the trust protocol
const trustProtocol = new TrustProtocol();

// Example 1: High-trust interaction (all principles satisfied)
console.log('Example 1: High-Trust Interaction');
console.log('=====================================');

const highTrustInteraction = {
  user_consent: true, // ✅ Consent given
  ai_explanation_provided: true, // ✅ AI explanation provided
  decision_auditability: true, // ✅ Decision auditability available
  reasoning_transparency: 9, // ✅ High reasoning transparency (0-10)
  human_override_available: true, // ✅ Human override available
  disconnect_option_available: true, // ✅ Disconnect option available
  ethical_considerations: ['privacy_protection', 'fairness', 'transparency'] // ✅ Ethical considerations documented
};

const highTrustScore = trustProtocol.calculateTrustScore(highTrustInteraction);
console.log(`Trust Score: ${highTrustScore.overall}/10`);
console.log(`Principle Scores:`);
highTrustScore.principles.forEach((score) => {
  const principle = trustProtocol.principles.find(p => p.name === score.principle);
  console.log(`  ${score.principle}: ${score.score}/10 (${Math.round((principle?.weight || 0) * 100)}%)`);
});
console.log(`Violations: ${highTrustScore.violations.length > 0 ? highTrustScore.violations.join(', ') : 'None'}`);
console.log(`Timestamp: ${new Date(highTrustScore.timestamp).toISOString()}\n`);

// Example 2: Low-trust interaction (some principles violated)
console.log('Example 2: Low-Trust Interaction');
console.log('====================================');

const lowTrustInteraction = {
  user_consent: false, // ❌ Consent not given
  ai_explanation_provided: true, // ✅ AI explanation provided
  decision_auditability: false, // ⚠️ Decision auditability missing
  reasoning_transparency: 3, // ⚠️ Low reasoning transparency
  human_override_available: false, // ⚠️ Human override not available
  disconnect_option_available: true, // ✅ Disconnect option available
  ethical_considerations: [] // ⚠️ No ethical considerations documented
};

const lowTrustScore = trustProtocol.calculateTrustScore(lowTrustInteraction);
console.log(`Trust Score: ${lowTrustScore.overall}/10`);
console.log(`Principle Scores:`);
lowTrustScore.principles.forEach((score) => {
  const principle = trustProtocol.principles.find(p => p.name === score.principle);
  console.log(`  ${score.principle}: ${score.score}/10 (${Math.round((principle?.weight || 0) * 100)}%)`);
});
console.log(`Violations: ${lowTrustScore.violations.length > 0 ? lowTrustScore.violations.join(', ') : 'None'}`);
console.log(`Timestamp: ${new Date(lowTrustScore.timestamp).toISOString()}\n`);

// Example 3: Critical violation (consent architecture violated)
console.log('Example 3: Critical Violation (Score = 0)');
console.log('==========================================');

const criticalViolationInteraction = {
  user_consent: false, // ❌ CRITICAL: Consent not given
  ai_explanation_provided: true, // ✅ AI explanation provided
  decision_auditability: true, // ✅ Decision auditability available
  reasoning_transparency: 8, // ✅ High reasoning transparency
  human_override_available: true, // ✅ Human override available
  disconnect_option_available: true, // ✅ Disconnect option available
  ethical_considerations: ['privacy_protection', 'fairness'] // ✅ Ethical considerations documented
};

const criticalScore = trustProtocol.calculateTrustScore(criticalViolationInteraction);
console.log(`Trust Score: ${criticalScore.overall}/10 (CAPPED AT 0 due to critical violation)`);
console.log(`Principle Scores:`);
criticalScore.principles.forEach((score) => {
  const principle = trustProtocol.principles.find(p => p.name === score.principle);
  console.log(`  ${score.principle}: ${score.score}/10 (${Math.round((principle?.weight || 0) * 100)}%)`);
});
console.log(`Violations: ${criticalScore.violations.join(', ')}`);
console.log(`Timestamp: ${new Date(criticalScore.timestamp).toISOString()}\n`);

// Example 4: Protocol utilities
console.log('Example 4: Protocol Utilities');
console.log('=============================');

const protocolId = ProtocolUtils.generateProtocolId('demo');
console.log(`Generated Protocol ID: ${protocolId}`);

const timestamp = Date.now();
const formattedTimestamp = ProtocolUtils.formatTimestamp(timestamp);
console.log(`Formatted Timestamp: ${formattedTimestamp}`);

const age = ProtocolUtils.calculateAge(timestamp - 86400000); // 1 day ago
console.log(`Protocol Age: ${Math.floor(age / 1000 / 60 / 60)} hours`);

const weights = [0.25, 0.20, 0.20, 0.15, 0.10, 0.10]; // 6-pillar weights
const weightsValid = ProtocolUtils.validatePrincipleWeights(weights);
console.log(`Principle Weights Valid: ${weightsValid}`);

console.log('\n✅ Protocol examples completed successfully!');
console.log('The Symbi Trust Protocol is ready for integration with Sonate.');