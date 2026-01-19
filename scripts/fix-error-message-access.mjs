#!/usr/bin/env node

/**
 * Codemod: Replace error.message with getErrorMessage(error)
 * 
 * This script transforms:
 *   error.message, e.message, err.message
 * To:
 *   getErrorMessage(error), getErrorMessage(e), getErrorMessage(err)
 * 
 * And ensures the import is present.
 * 
 * Usage: node scripts/fix-error-message-access.mjs
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../apps/backend/src');

// Directories to process
const targetDirs = ['routes', 'services', 'middleware', 'socket'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;
  let modified = false;

  // Check if file has already been fully migrated
  if (!content.includes('.message') || content.includes('getErrorMessage')) {
    // Skip if no .message patterns or already has getErrorMessage
    if (!content.includes('.message')) {
      return { modified: false, changes: 0 };
    }
  }

  const originalContent = content;

  // Common error variable names used in catch blocks
  const errorVars = ['error', 'e', 'err', 'trustError', 'llmError'];
  
  for (const varName of errorVars) {
    // Only replace within catch block context (simple heuristic)
    // Match patterns like: error.message, error?.message
    const patterns = [
      new RegExp(`\\b${varName}\\.message\\b`, 'g'),
      new RegExp(`\\b${varName}\\?\\.message\\b`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        changes += matches.length;
        content = content.replace(pattern, `getErrorMessage(${varName})`);
      }
    }
  }

  if (content !== originalContent) {
    modified = true;

    // Ensure getErrorMessage import exists
    const hasErrorUtilsImport = (
      content.includes("from '../utils/error-utils'") || 
      content.includes("from '../../utils/error-utils'") ||
      content.includes("from './error-utils'")
    );

    if (!hasErrorUtilsImport) {
      // Determine the correct import path based on file location
      const fileDir = path.dirname(filePath);
      const utilsDir = path.join(SRC_DIR, 'utils');
      let relativePath = path.relative(fileDir, utilsDir);
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      const importStatement = `import { getErrorMessage } from '${relativePath}/error-utils';\n`;
      
      // Add import after last existing import
      const lastImportMatch = content.match(/^import .+;\n/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, changes };
}

function walkDir(dir, callback) {
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

function main() {
  console.log('🔧 Replacing error.message with getErrorMessage(error)...\n');

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
        console.log(`  ✅ ${path.relative(SRC_DIR, filePath)} (${changes} replacements)`);
      }
    });
  }

  console.log('\n📊 Summary:');
  console.log(`   Files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Total replacements: ${totalChanges}`);
  console.log('\n✅ Done! Run `npm run build` to verify no type errors.');
}

main();
