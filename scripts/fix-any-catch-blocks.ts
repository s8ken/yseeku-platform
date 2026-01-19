#!/usr/bin/env node

/**
 * Codemod: Fix `catch (error: any)` patterns
 * 
 * This script transforms:
 *   catch (error: any) { ... error.message ... }
 * To:
 *   catch (error: unknown) { ... getErrorMessage(error) ... }
 * 
 * Usage: npx ts-node scripts/fix-any-catch-blocks.ts
 * 
 * After running, manually verify the changes and ensure the getErrorMessage
 * import is added to files that need it.
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../apps/backend/src');

// Files to process
const targetDirs = ['routes', 'services', 'middleware', 'socket'];

// Import statement to add
const IMPORT_STATEMENT = "import { getErrorMessage } from '../utils/error-utils';";
const LOGGER_IMPORT = "import { logger } from '../utils/logger';";

function processFile(filePath: string): { modified: boolean; changes: number } {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  let modified = false;

  // Check if file has any catch blocks with `error: any`
  if (!content.includes('catch (error: any)') && !content.includes('catch (e: any)')) {
    return { modified: false, changes: 0 };
  }

  const originalContent = content;

  // Replace catch (error: any) with catch (error: unknown)
  content = content.replace(/catch \(error: any\)/g, () => {
    changes++;
    return 'catch (error: unknown)';
  });

  // Replace catch (e: any) with catch (e: unknown)
  content = content.replace(/catch \(e: any\)/g, () => {
    changes++;
    return 'catch (e: unknown)';
  });

  // Replace error.message with getErrorMessage(error)
  // Only within catch blocks (simple heuristic)
  content = content.replace(/error\.message/g, 'getErrorMessage(error)');
  content = content.replace(/e\.message/g, 'getErrorMessage(e)');

  // Replace console.error with logger.error (keep the message format flexible)
  content = content.replace(
    /console\.error\(([^)]+)\)/g,
    (match, args) => {
      // Try to convert to structured logging
      if (args.includes(',')) {
        const parts = args.split(',').map((s: string) => s.trim());
        const message = parts[0].replace(/['"`:]/g, '').trim();
        return `logger.error('${message}', { error: getErrorMessage(error) })`;
      }
      return `logger.error(${args})`;
    }
  );

  if (content !== originalContent) {
    modified = true;

    // Check if we need to add imports
    if (!content.includes('getErrorMessage')) {
      // No import needed if no getErrorMessage usage
    } else if (!content.includes("from '../utils/error-utils'") && !content.includes("from '../../utils/error-utils'")) {
      // Add import at the top after existing imports
      const importMatch = content.match(/^(import .*\n)+/m);
      if (importMatch) {
        const lastImportEnd = (importMatch.index ?? 0) + importMatch[0].length;
        content = content.slice(0, lastImportEnd) + IMPORT_STATEMENT + '\n' + content.slice(lastImportEnd);
      }
    }

    // Check if we need logger import
    if (content.includes('logger.error') && !content.includes("from '../utils/logger'") && !content.includes("from '../../utils/logger'")) {
      const importMatch = content.match(/^(import .*\n)+/m);
      if (importMatch) {
        const lastImportEnd = (importMatch.index ?? 0) + importMatch[0].length;
        content = content.slice(0, lastImportEnd) + LOGGER_IMPORT + '\n' + content.slice(lastImportEnd);
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, changes };
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      callback(filePath);
    }
  }
}

function main(): void {
  console.log('🔧 Fixing `catch (error: any)` patterns...\n');

  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalChanges = 0;

  for (const dir of targetDirs) {
    const fullPath = path.join(SRC_DIR, dir);
    walkDir(fullPath, (filePath) => {
      totalFiles++;
      const { modified, changes } = processFile(filePath);
      if (modified) {
        modifiedFiles++;
        totalChanges += changes;
        console.log(`  ✅ ${path.relative(SRC_DIR, filePath)} (${changes} changes)`);
      }
    });
  }

  console.log('\n📊 Summary:');
  console.log(`   Files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Total changes: ${totalChanges}`);
  console.log('\n⚠️  Please review changes and manually verify imports are correct.');
  console.log('   Some files may need manual adjustment for nested paths or special cases.');
}

main();
