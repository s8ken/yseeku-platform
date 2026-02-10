#!/usr/bin/env node

/**
 * SONATE CLI
 * 
 * Command-line tools for receipt verification and export
 * 
 * Usage:
 *   sonate --help
 *   sonate-verify receipt.json
 *   sonate-export receipts.json --format splunk
 */

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('sonate')
  .description(chalk.bold('SONATE Trust Engine CLI Tools'))
  .version('1.0.0', '-v, --version')
  .addHelpCommand()
  .command('verify <receipt>', 'Verify receipt signature and chain integrity')
  .command('export <receipts>', 'Export receipts for SIEM systems')
  .on('--help', () => {
    console.log('');
    console.log(chalk.bold('Examples:'));
    console.log('');
    console.log(chalk.gray('  # Verify a receipt'));
    console.log('  $ sonate verify receipt.json');
    console.log('');
    console.log(chalk.gray('  # Verify with signature check'));
    console.log('  $ sonate verify receipt.json --public-key key.pub');
    console.log('');
    console.log(chalk.gray('  # Export to Splunk'));
    console.log('  $ sonate export receipts.json --format splunk');
    console.log('');
    console.log(chalk.gray('  # Export to CSV with filter'));
    console.log('  $ sonate export receipts.json --format csv --filter "minResonanceScore:0.8"');
    console.log('');
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
