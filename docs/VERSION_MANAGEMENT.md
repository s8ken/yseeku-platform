# Version Management Guide

## 🎯 Overview

YSEEKU Platform uses synchronized versioning across all packages and applications to ensure consistency and prevent dependency conflicts.

## 📋 Version Policy

### **Current Version: v1.4.0**

All packages, apps, and the root monorepo use the same version number:
- **Root package**: `1.4.0`
- **All packages**: `@sonate/*` packages use `1.4.0`
- **All apps**: Applications use `1.4.0`
- **README documentation**: References `v1.4.0`

## 🔄 Version Synchronization

### **Automated Tools**

#### **Version Sync Script**
```bash
# Check current version alignment
npm run version:check

# Update all packages to match root version
npm run version:sync

# Update all packages to specific version
npm run version:update 1.4.1
```

#### **Manual Script Execution**
```bash
# Sync to root version
node scripts/version-sync.js

# Sync to specific version
node scripts/version-sync.js 1.4.1
```

### **What Gets Updated**

The version sync script updates:
- ✅ Root `package.json`
- ✅ All `packages/*/package.json`
- ✅ All `apps/*/package.json`
- ❌ Skips `node_modules/` and `_archived/` directories

## 📦 Package Structure

```
yseeku-platform/
├── package.json                 # Root: 1.4.0
├── packages/
│   ├── core/package.json         # @sonate/core: 1.4.0
│   ├── detect/package.json       # @sonate/detect: 1.4.0
│   ├── orchestrate/package.json  # @sonate/orchestrate: 1.4.0
│   ├── lab/package.json          # @sonate/lab: 1.4.0
│   ├── persistence/package.json  # @sonate/persistence: 1.4.0
│   ├── monitoring/package.json   # @sonate/monitoring: 1.4.0
│   └── calculator/package.json    # @sonate/calculator: 1.4.0
└── apps/
    ├── web/package.json           # web: 1.4.0
    ├── backend/package.json       # backend: 1.4.0
    ├── resonate-dashboard/package.json # resonate-dashboard: 1.4.0
    └── new-demo/package.json      # @sonate/new-demo: 1.4.0
```

## 🚀 Release Process

### **Before Release**
1. **Update Version**: Use version sync script
2. **Update Documentation**: Update README and docs
3. **Run Tests**: Ensure all tests pass
4. **Build Packages**: Verify all packages build

### **Release Steps**
```bash
# 1. Update version (e.g., to 1.4.1)
npm run version:update 1.4.1

# 2. Update README version references
# Manual update of README.md version badges

# 3. Update CHANGELOG.md
# Add release notes for new version

# 4. Commit changes
git add .
git commit -m "chore: bump version to 1.4.1"

# 5. Create git tag
git tag v1.4.1

# 6. Push to remote
git push origin main --tags
```

## 🔍 Version Verification

### **Check Version Alignment**
```bash
# Quick check of all package versions
npm run version:check

# Manual verification
find . -name "package.json" -not -path "*/node_modules/*" -exec grep -H "version" {} \;
```

### **Expected Output**
All packages should show the same version:
```
./package.json: "version": "1.4.0",
./packages/core/package.json: "version": "1.4.0",
./packages/detect/package.json: "version": "1.4.0",
...
```

## ⚠️ Common Issues

### **Version Drift**
**Problem**: Packages have different versions after manual updates.

**Solution**: Always use the version sync script:
```bash
npm run version:sync
```

### **Dependency Conflicts**
**Problem**: Package dependencies reference old versions.

**Solution**: Update both package and dependency versions:
```bash
npm run version:update 1.4.1
# Then update any internal dependencies
```

### **Documentation Out of Sync**
**Problem**: README shows old version.

**Solution**: Update README version badges and references:
```bash
# Update version badges in README.md
# Update version references in documentation
```

## 🛠️ Development Guidelines

### **During Development**
- Use `npm run version:check` before committing
- Update version sync script if adding new packages
- Keep README version aligned with package versions

### **When Adding New Packages**
1. Create package with current version
2. Run version sync to ensure alignment
3. Update documentation if needed

### **When Removing Packages**
1. Remove package files
2. Update version sync script if needed
3. Update documentation

## 📊 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.4.0 | 2025-01-13 | Enterprise Symphony release |
| 1.13.0 | Previous | Pre-standardization version |

## 🔧 Troubleshooting

### **Script Fails**
```bash
# Check Node.js version
node --version  # Should be >= 20.0.0

# Check file permissions
ls -la scripts/version-sync.js

# Run with debug output
DEBUG=* node scripts/version-sync.js
```

### **Partial Updates**
If some packages don't update:
1. Check for syntax errors in package.json files
2. Verify file permissions
3. Manually update problematic packages
4. Run sync script again

### **Git Conflicts**
After version updates:
```bash
# Resolve conflicts
git add .
git commit -m "chore: resolve version conflicts"
```

---

**Remember**: Consistent versioning prevents dependency conflicts and ensures smooth deployments. Always use the version sync script!
