#!/usr/bin/env node

/**
 * sonate-export
 * 
 * Command-line tool to export receipts for SIEM systems
 * 
 * Usage:
 *   sonate-export receipts.json --format splunk
 *   sonate-export receipts.json --format datadog --output receipts-export.jsonl
 *   sonate-export receipts.json --format csv --filter "minResonanceScore:0.8"
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { TrustReceipt } from '@sonate/schemas';

const program = new Command();

/**
 * Parse filter string
 * Format: "key1:value1,key2:value2"
 */
function parseFilter(filterStr: string): Record<string, any> {
  if (!filterStr) return {};

  const filter: Record<string, any> = {};
  const pairs = filterStr.split(',');

  pairs.forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) {
      // Try to parse as number
      if (!isNaN(Number(value))) {
        filter[key] = Number(value);
      } else if (value === 'true') {
        filter[key] = true;
      } else if (value === 'false') {
        filter[key] = false;
      } else {
        filter[key] = value;
      }
    }
  });

  return filter;
}

/**
 * Format export output for display
 */
function formatExportResult(
  format: string,
  count: number,
  outputPath?: string
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('═══ SONATE Receipt Export ═══'));
  lines.push('');
  lines.push(chalk.green.bold('✓ Export successful'));
  lines.push('');
  lines.push(chalk.bold('Details:'));
  lines.push(chalk.gray('─────────'));
  lines.push(`  Format: ${chalk.cyan(format)}`);
  lines.push(`  Receipts: ${chalk.cyan(count.toString())}`);

  if (outputPath) {
    lines.push(`  Output: ${chalk.cyan(outputPath)}`);
  }

  lines.push('');
  lines.push(chalk.gray('═'.repeat(27)));
  lines.push('');

  return lines.join('\n');
}

/**
 * Export receipts in requested format
 */
function exportReceipts(receipts: TrustReceipt[], format: string): string {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(
        {
          metadata: {
            exported_at: new Date().toISOString(),
            count: receipts.length,
            format_version: '1.0.0',
          },
          receipts,
        },
        null,
        2
      );

    case 'jsonl':
    case 'ndjson':
      const lines = [
        JSON.stringify({
          metadata: {
            exported_at: new Date().toISOString(),
            count: receipts.length,
            format_version: '1.0.0',
          },
        }),
        ...receipts.map(r => JSON.stringify(r)),
      ];
      return lines.join('\n');

    case 'csv':
      const headers = [
        'receipt_id',
        'timestamp',
        'session_id',
        'agent_did',
        'mode',
        'model',
        'resonance_score',
        'truth_debt',
        'policy_violations',
        'consent_verified',
      ];

      const rows = receipts.map(r => [
        r.id,
        r.timestamp,
        r.session_id,
        r.agent_did,
        r.mode,
        r.interaction.model,
        r.telemetry?.resonance_score ?? '',
        r.telemetry?.truth_debt ?? '',
        (r.policy_state?.violations?.length ?? 0).toString(),
        r.policy_state?.consent_verified ?? false ? 'true' : 'false',
      ]);

      const escapeCsv = (val: string | number | boolean): string => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvLines = [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(',')),
      ];

      return csvLines.join('\n');

    case 'splunk':
      return receipts
        .map(r => {
          const pairs = [
            `event_type=trust_receipt`,
            `receipt_id=${r.id}`,
            `timestamp=${r.timestamp}`,
            `model=${r.interaction.model}`,
            `resonance_score=${r.telemetry?.resonance_score ?? 0}`,
            `truth_debt=${r.telemetry?.truth_debt ?? 0}`,
          ];
          return pairs.join(' ');
        })
        .join('\n');

    case 'datadog':
      return receipts
        .map(r => {
          return JSON.stringify({
            timestamp: new Date(r.timestamp).getTime(),
            host: 'sonate',
            service: 'trust-engine',
            ddsource: 'trust-receipt',
            ddtags: [`model:${r.interaction.model}`, `mode:${r.mode}`].join(','),
            message: JSON.stringify({
              receipt_id: r.id,
              resonance_score: r.telemetry?.resonance_score,
            }),
          });
        })
        .join('\n');

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Main export command
 */
async function exportCmd(filePath: string, options: any): Promise<void> {
  const spinner = ora();

  try {
    const resolvedPath = resolve(filePath);
    if (!existsSync(resolvedPath)) {
      console.error(chalk.red(`✗ File not found: ${filePath}`));
      process.exit(1);
    }

    spinner.start('Reading receipts file...');

    const fileContent = readFileSync(resolvedPath, 'utf-8');
    let receipts: any[];

    try {
      const parsed = JSON.parse(fileContent);
      receipts = Array.isArray(parsed) ? parsed : parsed.receipts || [parsed];
    } catch (err) {
      spinner.fail('Invalid JSON format');
      console.error(chalk.red(`✗ Failed to parse JSON`));
      process.exit(1);
    }

    spinner.text = 'Validating receipts...';

    // Basic validation
    if (!Array.isArray(receipts) || receipts.length === 0) {
      spinner.fail('No valid receipts found');
      console.error(chalk.red(`✗ Expected array of receipts`));
      process.exit(1);
    }

    spinner.text = 'Exporting receipts...';

    // Apply filter if provided
    let filtered = receipts;
    if (options.filter) {
      const filterObj = parseFilter(options.filter);
      filtered = receipts.filter(r => {
        if (filterObj.minResonanceScore && (r.telemetry?.resonance_score ?? 0) < filterObj.minResonanceScore) {
          return false;
        }
        if (filterObj.sessionId && r.session_id !== filterObj.sessionId) {
          return false;
        }
        return true;
      });
    }

    // Export
    const exported = exportReceipts(filtered, options.format || 'json');

    // Write to file or stdout
    if (options.output) {
      const outputPath = resolve(options.output);
      writeFileSync(outputPath, exported);
      spinner.succeed('Export complete');
      console.log(formatExportResult(options.format || 'json', filtered.length, outputPath));
    } else {
      spinner.succeed('Export complete');
      console.log('');
      console.log(exported);
      console.log('');
    }

    process.exit(0);
  } catch (err) {
    spinner.fail('Export failed');
    console.error(chalk.red(`✗ Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

/**
 * Set up CLI
 */
program
  .name('sonate-export')
  .description('Export receipts for SIEM systems and analysis')
  .version('1.0.0')
  .argument('<receipts>', 'Path to receipts JSON file')
  .option('--format <format>', 'Export format (json, jsonl, csv, splunk, datadog)', 'json')
  .option('--output <file>', 'Output file path (default: stdout)')
  .option('--filter <filter>', 'Filter receipts (e.g., "minResonanceScore:0.8,sessionId:abc")')
  .action(exportCmd);

program.parse(process.argv);
