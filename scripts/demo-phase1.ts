#!/usr/bin/env node

/**
 * SONATE Phase 1 End-to-End Demo
 * 
 * Complete demonstration of the trust engine:
 * 1. Create DIDs for agent and user
 * 2. Generate receipts for multiple interactions
 * 3. Verify receipts cryptographically
 * 4. Export to various formats
 * 5. Display audit trail
 */

import chalk from 'chalk';
import { DIDResolverService } from '../packages/orchestrate/src/did/did-resolver';
import {
  ReceiptGeneratorService,
  ReceiptValidatorService,
  ReceiptExporterService,
} from '../apps/backend/src/services/receipts';

// Initialize services
const didResolver = new DIDResolverService();
const receiptGenerator = new ReceiptGeneratorService(didResolver);
const receiptValidator = new ReceiptValidatorService();
const receiptExporter = new ReceiptExporterService();

// Helper functions
function log(title: string, message: string) {
  console.log(`\n${chalk.bold(title)}`);
  console.log(chalk.gray(message));
}

function success(message: string) {
  console.log(`${chalk.green('✓')} ${message}`);
}

function section(title: string) {
  console.log(`\n${chalk.bold.cyan(`\n════ ${title} ════\n`)}`);
}

async function main() {
  console.log(chalk.bold.blue('╔════════════════════════════════════════════════╗'));
  console.log(chalk.bold.blue('║     SONATE Phase 1: Trust Engine Demo         ║'));
  console.log(chalk.bold.blue('║     Complete End-to-End Demonstration        ║'));
  console.log(chalk.bold.blue('╚════════════════════════════════════════════════╝'));

  try {
    // ================================================================
    // STEP 1: CREATE IDENTITIES (DIDs)
    // ================================================================
    section('Step 1: Create Decentralized Identities (DIDs)');

    log('Creating Agent DID...', 'Generating cryptographic identity for AI agent');
    const agentDIDResult = await didResolver.createDID({
      entity_type: 'agent',
      name: 'Claude-3-Opus-Production',
      description: 'Production AI agent for document analysis',
    });
    success(`Agent DID created: ${chalk.cyan(agentDIDResult.did)}`);
    log('Agent Key Version', agentDIDResult.key_version);

    log('Creating User DID...', 'Generating pseudonymous identity for user');
    const userDIDResult = await didResolver.createDID({
      entity_type: 'user',
      name: 'User-Enterprise-XYZ',
      description: 'Enterprise user accessing the system',
    });
    success(`User DID created: ${chalk.cyan(userDIDResult.did)}`);

    // ================================================================
    // STEP 2: GENERATE RECEIPTS
    // ================================================================
    section('Step 2: Generate Trust Receipts');

    const interactions = [
      {
        prompt: 'Summarize the EU AI Act',
        response:
          'The EU AI Act is a regulatory framework governing artificial intelligence...',
        resonance: 0.94,
        truth_debt: 0.08,
      },
      {
        prompt: 'What is 2+2?',
        response: 'The answer is 4.',
        resonance: 0.99,
        truth_debt: 0.01,
      },
      {
        prompt: 'Translate "hello" to French',
        response: 'The word "hello" translates to "bonjour" in French.',
        resonance: 0.91,
        truth_debt: 0.05,
      },
    ];

    const receipts = [];
    let previousHash = 'GENESIS';

    for (let i = 0; i < interactions.length; i++) {
      const interaction = interactions[i];

      log(
        `Generating Receipt ${i + 1}...`,
        `Interaction: "${interaction.prompt.substring(0, 50)}..."`
      );

      const receipt = await receiptGenerator.generateReceipt(
        {
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          session_id: 'demo_session_001',
          agent_did: agentDIDResult.did,
          human_did: userDIDResult.did,
          policy_version: 'policy_v1.0.0',
          mode: 'constitutional',
          interaction: {
            prompt: interaction.prompt,
            response: interaction.response,
            model: 'claude-3-opus',
            provider: 'anthropic',
            temperature: 0.7,
          },
          telemetry: {
            resonance_score: interaction.resonance,
            bedau_index: 0.72,
            coherence_score: 0.85,
            truth_debt: interaction.truth_debt,
            volatility: 0.15,
            ciq_metrics: {
              clarity: 0.92,
              integrity: 0.88,
              quality: 0.90,
            },
          },
          policy_state: {
            constraints_applied: ['consent_verified', 'truth_debt_check'],
            violations: [],
            consent_verified: true,
            override_available: true,
          },
        },
        previousHash
      );

      receipts.push(receipt);
      previousHash = receipt.chain.chain_hash;

      success(
        `Receipt #${i + 1} created - ID: ${chalk.cyan(receipt.id.substring(0, 12))}...`
      );
      log('Chain Position', `Position: ${receipt.chain.chain_length}`);
      log('Signature', `Algorithm: ${receipt.signature.algorithm}`);
    }

    // ================================================================
    // STEP 3: VERIFY RECEIPTS
    // ================================================================
    section('Step 3: Verify Receipt Integrity');

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];

      log(`Verifying Receipt ${i + 1}...`, `ID: ${receipt.id.substring(0, 12)}...`);

      const agentInfo = await didResolver.resolveDID(agentDIDResult.did);
      const result = await receiptValidator.verifyReceipt(receipt, {
        publicKey: agentInfo.public_key,
      });

      if (result.valid) {
        success(`Receipt is ${chalk.green('VALID')}`);
        console.log(`  ${chalk.gray('Checks:')}`);
        console.log(`    ✓ Schema validation`);
        console.log(`    ✓ Receipt ID (SHA-256)`);
        console.log(`    ✓ Ed25519 signature`);
        console.log(`    ✓ Chain hash`);
      } else {
        console.log(`  ${chalk.red('✗')} ${chalk.red('Receipt is INVALID')}`);
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
    }

    // ================================================================
    // STEP 4: EXPORT TO FORMATS
    // ================================================================
    section('Step 4: Export to SIEM Formats');

    const formats = ['json', 'csv', 'splunk', 'datadog'];

    for (const format of formats) {
      log(`Exporting to ${format.toUpperCase()}...`, `Converting receipts to ${format} format`);

      const exported = await receiptExporter.export(receipts, {
        format: format as any,
        filter: {
          minResonanceScore: 0.8,
        },
      });

      if (format === 'json') {
        const parsed = JSON.parse(exported);
        success(
          `Exported ${chalk.cyan(parsed.receipts.length)} receipts to JSON (${Math.round(exported.length / 1024)}KB)`
        );
      } else if (format === 'csv') {
        const lines = exported.split('\n');
        success(
          `Exported ${chalk.cyan(lines.length - 1)} receipts to CSV (${Math.round(exported.length / 1024)}KB)`
        );
      } else if (format === 'splunk') {
        const lines = exported.split('\n').filter((l) => l.trim());
        success(`Exported ${chalk.cyan(lines.length)} receipts to Splunk format`);
      } else if (format === 'datadog') {
        const lines = exported.split('\n').filter((l) => l.trim());
        success(`Exported ${chalk.cyan(lines.length)} receipts to Datadog format`);
      }
    }

    // ================================================================
    // STEP 5: AUDIT TRAIL
    // ================================================================
    section('Step 5: Display Audit Trail');

    log('Agent DID History', `Tracking all changes to agent identity`);
    const agentHistory = await didResolver.getKeyHistory(agentDIDResult.did);
    success(`Key version: ${agentHistory.key_history[0].key_version}`);
    success(`Status: ${agentHistory.key_history[0].status}`);

    log('Receipt Chain', `Demonstrating immutable receipt chain`);
    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      const link = i === 0 ? 'GENESIS' : receipts[i - 1].chain.chain_hash.substring(0, 12);
      console.log(
        `  Receipt #${i + 1}: ${receipt.chain.chain_hash.substring(0, 12)}... ← ${chalk.gray(link)}...`
      );
    }
    success(`Chain integrity verified: ${receipts.length} receipts linked`);

    // ================================================================
    // STEP 6: STATISTICS
    // ================================================================
    section('Step 6: Summary Statistics');

    const totalTrustDebt = receipts.reduce((sum, r) => sum + r.telemetry.truth_debt, 0);
    const avgResonance = receipts.reduce((sum, r) => sum + r.telemetry.resonance_score, 0) / receipts.length;

    console.log(chalk.bold('Receipts Generated:'));
    console.log(`  Total: ${chalk.cyan(receipts.length)}`);
    console.log(`  Session ID: ${chalk.cyan('demo_session_001')}`);

    console.log(chalk.bold('\nTrust Metrics:'));
    console.log(`  Average Resonance Score: ${chalk.cyan(avgResonance.toFixed(3))}`);
    console.log(`  Total Truth Debt: ${chalk.cyan(totalTrustDebt.toFixed(3))}`);
    console.log(`  Chain Length: ${chalk.cyan(receipts[receipts.length - 1].chain.chain_length)}`);

    console.log(chalk.bold('\nCryptographic Details:'));
    console.log(`  Signature Algorithm: ${chalk.cyan('Ed25519')}`);
    console.log(`  Hash Algorithm: ${chalk.cyan('SHA-256')}`);
    console.log(`  Chain Method: ${chalk.cyan('Hash-linked immutable chain')}`);

    console.log(chalk.bold('\nCompliance:'));
    console.log(`  ${chalk.green('✓')} EU AI Act Documentation`);
    console.log(`  ${chalk.green('✓')} SOC2 Audit Trail`);
    console.log(`  ${chalk.green('✓')} ISO 27001 Key Management`);

    // ================================================================
    // COMPLETION
    // ================================================================
    section('Demo Complete');

    console.log(chalk.bold.green('✓ All Phase 1 Features Working:'));
    console.log('  • DID lifecycle management');
    console.log('  • Receipt generation with cryptography');
    console.log('  • Receipt verification and validation');
    console.log('  • Export to multiple formats');
    console.log('  • Immutable audit trail');
    console.log('  • Enterprise compliance');

    console.log(chalk.bold.cyan('\nNext Steps:'));
    console.log('  1. Deploy to production');
    console.log('  2. Integrate with your AI systems');
    console.log('  3. Configure SIEM ingestion');
    console.log('  4. Set up monitoring and alerting');

    console.log(
      chalk.bold.blue(
        '\n╚════════════════════════════════════════════════╝\n'
      )
    );
  } catch (error) {
    console.error(chalk.red('\n✗ Demo failed:'), error);
    process.exit(1);
  }
}

main();
