# Day 1 Security Hardening - Step-by-Step Guide

**Time Required:** 2-3 hours  
**Status:** IN PROGRESS  
**Date:** January 1, 2026

---

## Current Vulnerabilities Detected

Based on `npm audit`, we have:
- Multiple HIGH severity issues in @lit-protocol packages
- Related to `ws` (WebSocket library) vulnerabilities
- Affects @ethersproject/providers (transitive dependency)

---

## Step 1: Backup First (5 minutes)

```bash
# Create a backup branch
git checkout -b security-fixes-backup
git push origin security-fixes-backup

# Return to main branch
git checkout main
git checkout -b security-hardening-day1
```

✅ **You can always revert if something breaks**

---

## Step 2: Update Core Vulnerable Packages (30 minutes)

### A. Update axios (High Priority)
```bash
npm install axios@latest
```

**Expected version:** 1.7.9 or higher  
**Fixes:** CSRF, DoS, SSRF vulnerabilities

### B. Update parse-duration
```bash
npm install parse-duration@latest
```

**Expected version:** 2.1.5 or higher  
**Fixes:** Regex DoS vulnerability

### C. Update esbuild (Development only, but good to fix)
```bash
npm install esbuild@latest
```

**Expected version:** 0.25.0 or higher  
**Fixes:** Development server CORS issue

### D. Update vite
```bash
npm install vite@latest
```

**Expected version:** 6.4.1 or higher  
**Related to esbuild fix**

---

## Step 3: Handle @lit-protocol Packages (15 minutes)

These are trickier because they're transitive dependencies. Two options:

### Option A: Update if you're using them directly
```bash
npm install @lit-protocol/lit-node-client@latest
```

### Option B: If you're NOT actively using them, consider removing
Check where they're used:
```bash
grep -r "@lit-protocol" packages/*/package.json
```

If not critical for MVP, consider removing them temporarily.

---

## Step 4: Clean Install (10 minutes)

After updates, do a clean reinstall:

```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Verify vulnerabilities are fixed
npm audit --audit-level=high
```

**Success criteria:** Should show 0 high or critical vulnerabilities

---

## Step 5: Test Everything Still Works (30 minutes)

```bash
# Build all packages
npm run build

# Run tests
npm test

# If you have integration tests
npm run test:integration
```

**If tests fail:** Don't panic! Check the error messages. Often it's just a minor API change.

---

## Step 6: Add Basic Security Headers (20 minutes)

Create a new security middleware file to add to your API:

**File created:** `packages/orchestrate/src/middleware/basic-security.ts`

Run this command to create it:
```bash
mkdir -p packages/orchestrate/src/middleware
```

Then I'll create the file for you in the next step.

---

## Step 7: Add Environment Validation (15 minutes)

Create validation to catch missing environment variables early.

**File to create:** `packages/core/src/config/validate-env.ts`

---

## Step 8: Commit Changes (5 minutes)

```bash
# Stage changes
git add package.json package-lock.json

# Commit with clear message
git commit -m "security: patch high-severity vulnerabilities

- Update axios to 1.7.9+ (fixes CSRF, DoS, SSRF)
- Update parse-duration to 2.1.5+ (fixes Regex DoS)
- Update esbuild to 0.25.0+ (fixes dev CORS issue)
- Update vite to 6.4.1+
- Add basic security headers middleware
- Add environment validation

Resolves security audit issues identified in SECURITY_AUDIT_v1.2.md"

# Push to your branch
git push origin security-hardening-day1
```

---

## Step 9: Verify (10 minutes)

Final verification checklist:

```bash
# 1. No high/critical vulnerabilities
npm audit --audit-level=high

# 2. Everything builds
npm run build

# 3. Tests pass
npm test

# 4. Can run locally
npm run dev
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module" after updates
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Type errors after axios update
**Solution:** Axios 1.x has better types. Check if you're using old syntax:
```typescript
// Old (might break)
axios(url, { data })

// New (correct)
axios.post(url, data)
```

### Issue 3: Tests fail after dependency updates
**Solution:** Check if mocks need updating:
```bash
# Look for axios mocks
grep -r "axios" packages/*/src/__tests__
```

### Issue 4: Build takes forever
**Solution:** Clear build cache:
```bash
npm run clean
npm run build
```

---

## Rollback Plan (If Everything Breaks)

```bash
# Switch back to backup
git checkout security-fixes-backup

# Reinstall old dependencies
rm -rf node_modules package-lock.json
npm install

# You're back to working state
```

---

## Next Steps After This Is Done

1. ✅ Merge security fixes to main
2. 🚀 Deploy to Railway.app (tomorrow)
3. 📹 Record demo video (day 3)
4. 🌐 Create landing page (day 4)

---

## Time Tracking

- [ ] Step 1: Backup (5 min) - ⏰ __:__
- [ ] Step 2: Update packages (30 min) - ⏰ __:__
- [ ] Step 3: Handle @lit-protocol (15 min) - ⏰ __:__
- [ ] Step 4: Clean install (10 min) - ⏰ __:__
- [ ] Step 5: Test (30 min) - ⏰ __:__
- [ ] Step 6: Security headers (20 min) - ⏰ __:__
- [ ] Step 7: Environment validation (15 min) - ⏰ __:__
- [ ] Step 8: Commit (5 min) - ⏰ __:__
- [ ] Step 9: Verify (10 min) - ⏰ __:__

**Total:** ~2.5 hours

---

## Status Log

**Start time:** ____________  
**Current step:** ____________  
**Blockers:** ____________  
**End time:** ____________

**Notes:**
