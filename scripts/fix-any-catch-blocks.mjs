#!/usr/bin/env node

/**
 * Codemod: Fix `catch (error: any)` patterns
 * 
 * This script transforms:
 *   catch (error: any) { ... error.message ... }
 * To:
 *   catch (error: unknown) { ... getErrorMessage(error) ... }
 * 
 * Usage: node scripts/fix-any-catch-blocks.mjs
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

  // Check if file has any catch blocks with `error: any`
  if (!content.includes('catch (error: any)') && 
      !content.includes('catch (e: any)') &&
      !content.includes('catch (trustError: any)') &&
      !content.includes('catch (llmError: any)')) {
    return { modified: false, changes: 0 };
  }

  const originalContent = content;

  // Replace all variations of catch with any type
  const patterns = [
    /catch \(error: any\)/g,
    /catch \(e: any\)/g,
    /catch \(trustError: any\)/g,
    /catch \(llmError: any\)/g,
    /catch \(err: any\)/g,
  ];

  for (const pattern of patterns) {
    content = content.replace(pattern, (match) => {
      changes++;
      return match.replace(': any)', ': unknown)');
    });
  }

  if (content !== originalContent) {
    modified = true;

    // Check if we need to add getErrorMessage import
    const needsErrorUtils = (
      content.includes('error.message') || 
      content.includes('e.message') ||
      content.includes('err.message')
    );
    
    const hasErrorUtilsImport = (
      content.includes("from '../utils/error-utils'") || 
      content.includes("from '../../utils/error-utils'")
    );

    if (needsErrorUtils && !hasErrorUtilsImport) {
      // Determine the correct import path based on file location
      const relativePath = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'utils'));
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      const importStatement = `import { getErrorMessage } from '${importPath}/error-utils';\n`;
      
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
  console.log('\n⚠️  Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. For files with error.message, replace with getErrorMessage(error)');
  console.log('   3. Run: npm run build to verify no type errors');
}

main();
