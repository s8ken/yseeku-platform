#!/usr/bin/env node

/**
 * sonate-verify
 * 
 * Command-line tool to verify SONATE Trust Receipts
 * 
 * Usage:
 *   sonate-verify receipt.json
 *   sonate-verify receipt.json --public-key key.pub
 *   sonate-verify receipt.json --previous-hash abc123...
 *   sonate-verify receipt.json --detailed
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { receiptValidator, TrustReceipt } from '@sonate/schemas';
import { verifySignature } from '@sonate/core';
import { createHash } from 'crypto';

const program = new Command();

/**
 * Verify receipt ID (SHA-256 hash)
 */
function verifyReceiptId(receipt: TrustReceipt): boolean {
  const { signature: sig, id, ...receiptWithoutId } = receipt;
  const canonical = JSON.stringify(receiptWithoutId, Object.keys(receiptWithoutId).sort());
  const expectedId = createHash('sha256').update(canonical).digest('hex');
  return receipt.id === expectedId;
}

/**
 * Verify chain hash
 */
function verifyChainHash(receipt: TrustReceipt): boolean {
  const { signature: sig, id, ...receiptWithoutSignature } = receipt;
  const canonical = JSON.stringify(receiptWithoutSignature, Object.keys(receiptWithoutSignature).sort());
  const chainContent = canonical + receipt.chain.previous_hash;
  const expectedChainHash = createHash('sha256').update(chainContent).digest('hex');
  return receipt.chain.chain_hash === expectedChainHash;
}

/**
 * Format verification result for display
 */
function formatResult(
  valid: boolean,
  checks: Record<string, boolean>,
  errors: string[],
  warnings: string[],
  detailed: boolean = false
): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold('═══ SONATE Receipt Verification ═══'));
  lines.push('');

  // Status
  if (valid) {
    lines.push(chalk.green.bold('✓ RECEIPT VALID'));
  } else {
    lines.push(chalk.red.bold('✗ RECEIPT INVALID'));
  }
  lines.push('');

  // Checks
  lines.push(chalk.bold('Verification Checks:'));
  lines.push(chalk.gray('────────────────────'));

  for (const [check, passed] of Object.entries(checks)) {
    const icon = passed ? chalk.green('✓') : chalk.red('✗');
    const label = check
      .replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    lines.push(`${icon} ${label}`);
  }
  lines.push('');

  // Errors
  if (errors.length > 0) {
    lines.push(chalk.red.bold('Errors:'));
    lines.push(chalk.gray('────────'));
    errors.forEach(err => {
      lines.push(`  ${chalk.red('•')} ${err}`);
    });
    lines.push('');
  }

  // Warnings
  if (warnings.length > 0) {
    lines.push(chalk.yellow.bold('Warnings:'));
    lines.push(chalk.gray('──────────'));
    warnings.forEach(warn => {
      lines.push(`  ${chalk.yellow('•')} ${warn}`);
    });
    lines.push('');
  }

  // Detailed info
  if (detailed) {
    lines.push(chalk.bold('Receipt Details:'));
    lines.push(chalk.gray('─────────────────'));
    // Receipt will be passed separately in detailed output
  }

  lines.push(chalk.gray('═'.repeat(35)));
  lines.push('');

  return lines.join('\n');
}

/**
 * Main verify command
 */
async function verify(filePath: string, options: any): Promise<void> {
  const spinner = ora();

  try {
    // Validate file exists
    const resolvedPath = resolve(filePath);
    if (!existsSync(resolvedPath)) {
      console.error(chalk.red(`✗ File not found: ${filePath}`));
      process.exit(1);
    }

    spinner.start('Reading receipt file...');

    // Read file
    const fileContent = readFileSync(resolvedPath, 'utf-8');
    let receipt: any;

    try {
      receipt = JSON.parse(fileContent);
    } catch (err) {
      spinner.fail('Invalid JSON format');
      console.error(chalk.red(`✗ Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }

    spinner.text = 'Validating receipt schema...';

    // Validate schema
    const schemaResult = receiptValidator.validateJSON(receipt);
    if (!schemaResult.checks.schema_valid) {
      spinner.fail('Schema validation failed');
      console.log(formatResult(false, schemaResult.checks, schemaResult.errors, schemaResult.warnings, options.detailed));
      process.exit(1);
    }

    const typedReceipt = receipt as TrustReceipt;

    spinner.text = 'Verifying receipt ID...';
    const idValid = verifyReceiptId(typedReceipt);
    const checks: Record<string, boolean> = {
      schema_valid: schemaResult.checks.schema_valid,
      receipt_id_valid: idValid,
      chain_hash_valid: false,
      signature_present: false,
    };

    if (!idValid) {
      spinner.fail('Receipt ID verification failed');
      console.log(
        formatResult(false, checks, ['Receipt ID does not match content hash'], [], options.detailed)
      );
      process.exit(1);
    }

    spinner.text = 'Verifying chain integrity...';
    const chainValid = verifyChainHash(typedReceipt);
    checks.chain_hash_valid = chainValid;

    if (!chainValid) {
      spinner.fail('Chain hash verification failed');
      console.log(
        formatResult(false, checks, ['Chain hash does not match expected value'], [], options.detailed)
      );
      process.exit(1);
    }

    // Check previous chain hash if provided
    let warnings: string[] = [];
    if (options.previousHash && typedReceipt.chain.previous_hash !== options.previousHash) {
      warnings.push(`Previous hash mismatch (expected ${options.previousHash})`);
    }

    // Check signature if public key provided
    if (options.publicKey) {
      spinner.text = 'Verifying signature...';

      try {
        const { signature: sig, ...receiptWithoutSignature } = typedReceipt;
        const canonical = JSON.stringify(receiptWithoutSignature, Object.keys(receiptWithoutSignature).sort());
        const isValid = await verifySignature(canonical, sig.value, options.publicKey);
        checks.signature_present = isValid;

        if (!isValid) {
          spinner.fail('Signature verification failed');
          console.log(
            formatResult(false, checks, ['Signature verification failed'], warnings, options.detailed)
          );
          process.exit(1);
        }
      } catch (err) {
        spinner.warn('Could not verify signature');
        warnings.push(`Signature verification skipped: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      warnings.push('Public key not provided - signature verification skipped');
    }

    spinner.succeed('Receipt verification complete');

    // Display result
    const allValid = Object.values(checks).every(v => v);
    console.log(formatResult(allValid, checks, [], warnings, options.detailed));

    // Detailed output if requested
    if (options.detailed) {
      console.log(chalk.bold('Full Receipt Details:'));
      console.log(chalk.gray('─────────────────────'));
      console.log(JSON.stringify(typedReceipt, null, 2));
      console.log('');
    }

    // Exit with appropriate code
    process.exit(allValid ? 0 : 1);
  } catch (err) {
    spinner.fail('Verification failed');
    console.error(chalk.red(`✗ Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

/**
 * Set up CLI
 */
program
  .name('sonate-verify')
  .description('Verify SONATE Trust Receipt signatures and chain integrity')
  .version('1.0.0')
  .argument('<receipt>', 'Path to receipt JSON file')
  .option('--public-key <key>', 'Public key for signature verification (base64)')
  .option('--previous-hash <hash>', 'Previous chain hash for continuity check')
  .option('--detailed', 'Show detailed receipt information')
  .action(verify);

program.parse(process.argv);
