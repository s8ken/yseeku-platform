#!/usr/bin/env node

/**
 * Version Synchronization Script
 * 
 * Ensures all packages and apps use consistent versioning
 * Usage: node scripts/version-sync.js [version]
 * If no version provided, reads from root package.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_VERSION = process.argv[2] || null;

function getRootVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  return packageJson.version;
}

function updatePackageVersion(packagePath, newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const oldVersion = packageJson.version;
    
    if (oldVersion !== newVersion) {
      packageJson.version = newVersion;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✓ Updated ${path.basename(path.dirname(packagePath))}: ${oldVersion} → ${newVersion}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error updating ${packagePath}:`, error.message);
    return false;
  }
}

function findPackageJsonFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules' && item !== '_archived') {
        const packageJsonPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          files.push(packageJsonPath);
        }
        scanDirectory(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  const targetVersion = TARGET_VERSION || getRootVersion();
  
  console.log(`🔧 Synchronizing all packages to version ${targetVersion}\n`);
  
  // Update root package.json if version was provided
  if (TARGET_VERSION) {
    const rootPackagePath = path.join(ROOT_DIR, 'package.json');
    updatePackageVersion(rootPackagePath, targetVersion);
  }
  
  // Find and update all package.json files
  const packageFiles = findPackageJsonFiles(ROOT_DIR);
  let updatedCount = 0;
  
  for (const packageFile of packageFiles) {
    if (updatePackageVersion(packageFile, targetVersion)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✅ Version synchronization complete!`);
  console.log(`📊 Updated ${updatedCount} packages to version ${targetVersion}`);
  
  if (updatedCount === 0) {
    console.log(`ℹ️  All packages already at version ${targetVersion}`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { getRootVersion, updatePackageVersion, findPackageJsonFiles };
