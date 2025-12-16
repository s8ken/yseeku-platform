/**
 * Symbi Protocol Usage Examples
 * Demonstrates the core functionality of the 6-pillar trust scoring system
 */

import { TrustProtocol, HashChain, Ed25519Manager, CryptoUtils } from '../protocol';

/**
 * Example 1: Basic Trust Scoring
 * Shows how to calculate trust scores using the 6-pillar weighted algorithm
 */
function basicTrustScoringExample() {
  console.log('=== Example 1: Basic Trust Scoring ===\n');
  
  const protocol = new TrustProtocol();
  
  // Example of a trustworthy AI interaction
  const trustworthyInteraction = {
    user_consent: true,
    ai_explanation_provided: true,
    decision_auditability: true,
    human_override_available: true,
    disconnect_option_available: true,
    moral_agency_respected: true,
    reasoning_transparency: 8.5,
    ethical_considerations: ['privacy', 'fairness', 'transparency']
  };
  
  const result = protocol.calculateTrustScore(trustworthyInteraction);
  
  console.log('Trust Score Result:');
  console.log(`Overall Score: ${result.overall}/10`);
  console.log('Principle Breakdown:');
  result.principles.forEach(principle => {
    console.log(`  ${principle.principle}: ${principle.score}/10 ${principle.violated ? '(VIOLATED)' : ''}`);
    if (principle.reason) {
      console.log(`    Reason: ${principle.reason}`);
    }
  });
  
  if (result.violations.length > 0) {
    console.log('Violations:', result.violations);
  }
  
  console.log(`Valid (min 7.0): ${protocol.validateInteraction(trustworthyInteraction)}\n`);
}

/**
 * Example 2: Critical Violation Demonstration
 * Shows how critical principle violations cap the total score to 0
 */
function criticalViolationExample() {
  console.log('=== Example 2: Critical Violation ===\n');
  
  const protocol = new TrustProtocol();
  
  // Example with critical violation (no user consent)
  const interactionWithViolation = {
    user_consent: false, // CRITICAL VIOLATION
    ai_explanation_provided: true,
    decision_auditability: true,
    human_override_available: true,
    disconnect_option_available: true,
    moral_agency_respected: true,
    reasoning_transparency: 9.0,
    ethical_considerations: ['privacy', 'security']
  };
  
  const result = protocol.calculateTrustScore(interactionWithViolation);
  
  console.log('Trust Score with Critical Violation:');
  console.log(`Overall Score: ${result.overall}/10 (CAPPED DUE TO CRITICAL VIOLATION)`);
  console.log('Violations:', result.violations);
  console.log(`Valid: ${protocol.validateInteraction(interactionWithViolation)}\n`);
}

/**
 * Example 3: Hash Chain for Audit Trail
 * Demonstrates creating an immutable audit trail using hash chains
 */
function hashChainExample() {
  console.log('=== Example 3: Hash Chain Audit Trail ===\n');
  
  const chain = new HashChain();
  const crypto = new Ed25519Manager();
  
  // Generate key pair for signing
  const keyPair = crypto.generateKeyPair();
  
  // Create genesis hash for this audit trail
  const sessionId = 'user-session-12345';
  const genesisHash = chain.genesisHash(sessionId);
  console.log(`Genesis Hash: ${genesisHash}`);
  
  // Simulate AI interactions over time
  const interactions = [
    {
      timestamp: Date.now() - 3000,
      action: 'user_query',
      data: 'How do I reset my password?',
      trust_score: 8.5
    },
    {
      timestamp: Date.now() - 2000,
      action: 'ai_response',
      data: 'Here are the steps to reset your password...',
      trust_score: 9.2
    },
    {
      timestamp: Date.now() - 1000,
      action: 'user_feedback',
      data: 'positive',
      trust_score: 8.8
    }
  ];
  
  let previousHash = genesisHash;
  const links: HashChainLink[] = [];
  
  interactions.forEach((interaction, index) => {
    // Create payload
    const payload = JSON.stringify(interaction);
    
    // Sign the payload
    const signature = crypto.signData(payload, keyPair.privateKey);
    
    // Create hash chain link
    const link = chain.createLink(
      previousHash,
      payload,
      interaction.timestamp,
      signature.signature
    );
    
    links.push(link);
    previousHash = link.hash;
    
    console.log(`\nLink ${index + 1}:`);
    console.log(`  Hash: ${link.hash}`);
    console.log(`  Previous Hash: ${link.previousHash}`);
    console.log(`  Action: ${interaction.action}`);
    console.log(`  Trust Score: ${interaction.trust_score}`);
    console.log(`  Signature: ${link.signature?.substring(0, 16)}...`);
  });
  
  // Verify the entire chain
  const latestLink = links[links.length - 1];
  const isValid = chain.verifyChain(latestLink, genesisHash);
  console.log(`\nChain Verification: ${isValid ? 'VALID' : 'INVALID'}`);
  
  // Chain statistics
  const stats = chain.getStats();
  console.log(`Chain Stats: ${stats.totalLinks} links, timestamps ${stats.earliestTimestamp} to ${stats.latestTimestamp}`);
}

/**
 * Example 4: Integration - Trust Score with Hash Chain
 * Shows how to combine trust scoring with cryptographic audit trails
 */
function integratedExample() {
  console.log('\n=== Example 4: Integrated Trust Scoring with Audit Trail ===\n');
  
  const protocol = new TrustProtocol();
  const chain = new HashChain();
  const crypto = new Ed25519Manager();
  
  // Generate key pair
  const keyPair = crypto.generateKeyPair();
  
  // Create genesis for this session
  const sessionId = CryptoUtils.generateProtocolId('session');
  const genesisHash = chain.genesisHash(sessionId);
  
  // Simulate an AI interaction
  const interaction = {
    user_consent: true,
    ai_explanation_provided: true,
    decision_auditability: true,
    human_override_available: true,
    disconnect_option_available: true,
    moral_agency_respected: true,
    reasoning_transparency: 8.2,
    ethical_considerations: ['privacy', 'fairness', 'accountability']
  };
  
  // Calculate trust score
  const trustResult = protocol.calculateTrustScore(interaction);
  
  // Create audit record
  const auditRecord = {
    session_id: sessionId,
    timestamp: trustResult.timestamp,
    trust_score: trustResult.overall,
    violations: trustResult.violations,
    principle_scores: trustResult.principles.map(p => ({
      principle: p.principle,
      score: p.score,
      violated: p.violated
    }))
  };
  
  // Sign the audit record
  const payload = JSON.stringify(auditRecord);
  const signature = crypto.signData(payload, keyPair.privateKey);
  
  // Create hash chain link
  const link = chain.createLink(
    genesisHash,
    payload,
    trustResult.timestamp,
    signature.signature
  );
  
  console.log('Integrated Result:');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Trust Score: ${trustResult.overall}/10`);
  console.log(`Audit Hash: ${link.hash}`);
  console.log(`Signature: ${signature.signature.substring(0, 16)}...`);
  console.log(`Verification: ${chain.verifyLink(link) ? 'VALID' : 'INVALID'}`);
  
  // Verify the complete audit trail
  const auditTrailValid = chain.verifyChain(link, genesisHash);
  console.log(`Complete Audit Trail: ${auditTrailValid ? 'VALID' : 'INVALID'}`);
}

/**
 * Example 5: Batch Processing and Validation
 * Shows how to process multiple interactions and validate them
 */
function batchProcessingExample() {
  console.log('\n=== Example 5: Batch Processing ===\n');
  
  const protocol = new TrustProtocol();
  
  const interactions = [
    {
      user_consent: true,
      ai_explanation_provided: true,
      decision_auditability: true,
      human_override_available: true,
      disconnect_option_available: true,
      moral_agency_respected: true,
      reasoning_transparency: 8.5,
      ethical_considerations: ['privacy']
    },
    {
      user_consent: false, // Violation
      ai_explanation_provided: true,
      decision_auditability: true,
      human_override_available: true,
      disconnect_option_available: true,
      moral_agency_respected: true,
      reasoning_transparency: 9.0,
      ethical_considerations: ['security']
    },
    {
      user_consent: true,
      ai_explanation_provided: false, // Violation
      decision_auditability: true,
      human_override_available: true,
      disconnect_option_available: true,
      moral_agency_respected: true,
      reasoning_transparency: 7.5,
      ethical_considerations: ['fairness']
    }
  ];
  
  console.log('Batch Processing Results:');
  interactions.forEach((interaction, index) => {
    const result = protocol.calculateTrustScore(interaction);
    const isValid = protocol.validateInteraction(interaction);
    
    console.log(`\nInteraction ${index + 1}:`);
    console.log(`  Score: ${result.overall}/10`);
    console.log(`  Valid: ${isValid ? 'YES' : 'NO'}`);
    console.log(`  Violations: ${result.violations.length > 0 ? result.violations.join(', ') : 'None'}`);
  });
  
  // Calculate average score
  const scores = interactions.map(i => protocol.calculateTrustScore(i).overall);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  console.log(`\nAverage Trust Score: ${averageScore.toFixed(1)}/10`);
}

// Run all examples
if (require.main === module) {
  console.log('🌟 Symbi Protocol Usage Examples\n');
  console.log('These examples demonstrate the core 6-pillar weighted scoring');
  console.log('system and cryptographic audit trail functionality.\n');
  
  basicTrustScoringExample();
  criticalViolationExample();
  hashChainExample();
  integratedExample();
  batchProcessingExample();
  
  console.log('\n✅ All examples completed successfully!');
  console.log('\nThe Symbi Protocol provides:');
  console.log('• 6-pillar weighted trust scoring (exact weights from master context)');
  console.log('• Critical principle violations cap total score to 0');
  console.log('• SHA-256 hash chains for immutable audit trails');
  console.log('• Ed25519 digital signatures for cryptographic proof');
  console.log('• Ready for integration with the Sonate platform');
}

export {
  basicTrustScoringExample,
  criticalViolationExample,
  hashChainExample,
  integratedExample,
  batchProcessingExample
};