# Git Repository Setup

## Repository Information

**New Canonical Repository**: `github.com/s8ken/yseeku-platform`

This is the unified monorepo that replaces:
- `github.com/s8ken/symbi-resonate` → Use @sonate/detect + @sonate/lab
- `github.com/s8ken/symbi-symphony` → Use @sonate/orchestrate

## Setup Commands

### 1. Create GitHub Repository

Go to https://github.com/new and create:
- **Repository name**: `yseeku-platform`
- **Description**: "SONATE Platform - Enterprise AI Trust Framework (TypeScript monorepo)"
- **Visibility**: Public (or Private if preferred)
- **Initialize**: Do NOT initialize (we already have code)

### 2. Push to GitHub

```bash
cd /home/user/yseeku-platform

# Already done:
# git init
# git add -A
# git commit -m "Initial commit..."

# Add remote (replace YOUR_USERNAME if different)
git remote add origin https://github.com/s8ken/yseeku-platform.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3. Repository Settings (on GitHub)

#### Branch Protection
- Protect `main` branch
- Require pull request reviews
- Require status checks (CI/CD when set up)

#### Topics/Tags
Add these topics to make it discoverable:
- `typescript`
- `monorepo`
- `turborepo`
- `ai-governance`
- `constitutional-ai`
- `trust-framework`
- `w3c-did`
- `verifiable-credentials`

#### About Section
```
SONATE Platform - Enterprise AI You Can Trust. 
Unified TypeScript monorepo for constitutional AI governance.
Includes real-time detection, research experimentation, and production orchestration.
```

#### Links
- **Homepage**: https://yseeku.com
- **Documentation**: https://gammatria.com

## Repository Structure

```
github.com/s8ken/yseeku-platform
├── packages/
│   ├── core/           @sonate/core
│   ├── detect/         @sonate/detect
│   ├── lab/            @sonate/lab
│   └── orchestrate/    @sonate/orchestrate
├── apps/
│   ├── web/            React dashboard
│   └── backend/        Express API
├── docs/               Documentation
├── MIGRATION_STATUS.md Migration progress
└── README.md           Main documentation
```

## NPM Package Publishing

When ready to publish to npm:

```bash
# Login to npm
npm login

# Create @sonate organization (if not exists)
npm org create sonate

# Publish packages (from each package directory)
cd packages/core
npm publish --access public

cd ../detect
npm publish --access public

cd ../lab
npm publish --access public

cd ../orchestrate
npm publish --access public
```

## Deprecation of Old Repos

### symbi-resonate
Add this to the top of README.md:

```markdown
# ⚠️ DEPRECATED - Repository Moved

This repository has been consolidated into **yseeku-platform**.

**New Location**: https://github.com/s8ken/yseeku-platform

## Migration Guide

### Old Packages
- `symbi-resonate` (detection) → `@sonate/detect`
- `symbi-resonate` (lab) → `@sonate/lab`

### Installation
```bash
npm install @sonate/detect @sonate/lab
```

### Import Changes
```typescript
// OLD
import { SymbiFrameworkDetector } from 'symbi-resonate';

// NEW
import { SymbiFrameworkDetector } from '@sonate/detect';
```

This repository will be archived on [DATE].
```

### symbi-symphony
Add this to the top of README.md:

```markdown
# ⚠️ DEPRECATED - Repository Moved

This repository has been consolidated into **yseeku-platform**.

**New Location**: https://github.com/s8ken/yseeku-platform

## Migration Guide

### Old Package
- `@yseeku/trust-protocol` → `@sonate/core`
- `symbi-symphony` → `@sonate/orchestrate`

### Installation
```bash
npm install @sonate/core @sonate/orchestrate
```

### Import Changes
```typescript
// OLD
import { TrustProtocol } from '@yseeku/trust-protocol';

// NEW
import { TrustProtocol } from '@sonate/core';
```

This repository will be archived on [DATE].
```

### symbi-vault
Update README.md:

```markdown
# SYMBI Vault - Content Moved

This repository's content has been reorganized:

## New Locations

### Research & Documentation
**All whitepapers, schemas, and academic resources** → https://gammatria.com

### Partner Materials
**Pricing sheets, partnership decks, SOWs** → https://yseeku.com/resources

### Implementation Code
**All implementation code** → https://github.com/s8ken/yseeku-platform

## Why the Change?

We've implemented the Trinity Architecture:
- **SYMBI.WORLD**: Philosophy & community
- **GAMMATRIA.COM**: Research & specifications
- **YSEEKU.COM**: Commercial platform (SONATE)

This ensures clear separation between academic research and commercial implementation.
```

## Next Steps

1. **Create GitHub repo**: `yseeku-platform`
2. **Push code**: `git push -u origin main`
3. **Update old repos**: Add deprecation notices
4. **Archive old repos**: (After 30-day grace period)
5. **Publish to npm**: When packages are stable

## Commands Summary

```bash
# Push to new repo
cd /home/user/yseeku-platform
git remote add origin https://github.com/s8ken/yseeku-platform.git
git push -u origin main

# Future commits
git add .
git commit -m "Your commit message"
git push
```
