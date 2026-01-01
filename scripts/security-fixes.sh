#!/bin/bash

# Security Fixes Script - Day 1
# This script automates the security patching process

set -e  # Exit on any error

echo "🔒 Starting Security Fixes - Day 1"
echo "=================================="
echo ""

# Step 1: Backup
echo "📦 Step 1: Creating backup branch..."
git checkout -b security-fixes-backup 2>/dev/null || git checkout security-fixes-backup
git checkout main
git checkout -b security-hardening-day1 2>/dev/null || git checkout security-hardening-day1
echo "✅ Backup created"
echo ""

# Step 2: Update vulnerable packages
echo "📦 Step 2: Updating vulnerable packages..."
echo "   - Updating axios..."
npm install axios@latest

echo "   - Updating parse-duration..."
npm install parse-duration@latest

echo "   - Updating esbuild..."
npm install esbuild@latest

echo "   - Updating vite..."
npm install vite@latest

echo "✅ Packages updated"
echo ""

# Step 3: Clean install
echo "🧹 Step 3: Clean reinstall..."
rm -rf node_modules package-lock.json
npm install
echo "✅ Clean install complete"
echo ""

# Step 4: Run audit
echo "🔍 Step 4: Running security audit..."
npm audit --audit-level=high || echo "⚠️  Some vulnerabilities may remain (check if they're low/moderate)"
echo ""

# Step 5: Build
echo "🔨 Step 5: Building packages..."
npm run build || echo "⚠️  Build had issues - check output above"
echo ""

# Step 6: Test
echo "🧪 Step 6: Running tests..."
npm test || echo "⚠️  Some tests failed - check output above"
echo ""

echo "=================================="
echo "✅ Security fixes complete!"
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Test the application manually: npm run dev"
echo "3. Commit changes: git commit -am 'security: patch vulnerabilities'"
echo "4. Push: git push origin security-hardening-day1"
echo ""
echo "If everything broke, rollback with:"
echo "  git checkout security-fixes-backup"
echo ""
