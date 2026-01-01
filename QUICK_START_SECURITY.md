# Quick Start: Security Fixes (Day 1)

**Time:** 2-3 hours | **Difficulty:** Easy | **Risk:** Low (we have backups)

---

## Option 1: Automated (Recommended - 30 mins)

Run the automated script:

```bash
./scripts/security-fixes.sh
```

That's it! The script will:
- Create backup branch
- Update all vulnerable packages
- Clean reinstall dependencies
- Run audit
- Build and test

---

## Option 2: Manual (If script fails - 2 hours)

Follow the step-by-step guide in [`SECURITY_FIXES_DAY1.md`](SECURITY_FIXES_DAY1.md)

---

## What We're Fixing

✅ **axios** vulnerability (CSRF, DoS, SSRF)  
✅ **parse-duration** vulnerability (Regex DoS)  
✅ **esbuild** vulnerability (Dev server CORS)  
✅ **vite** vulnerability (Related to esbuild)

## What We're Adding

✅ Security headers middleware  
✅ Environment validation  
✅ CORS configuration

---

## Files Created/Modified

**New Files:**
- `packages/orchestrate/src/middleware/basic-security.ts` - Security headers
- `packages/core/src/config/validate-env.ts` - Environment validation
- `scripts/security-fixes.sh` - Automated fix script

**Modified Files:**
- `package.json` - Updated dependency versions
- `package-lock.json` - Locked new versions

---

## After Running Fixes

### 1. Verify No Critical Vulnerabilities
```bash
npm audit --audit-level=high
```

**Expected:** 0 high or critical vulnerabilities

### 2. Test Locally
```bash
npm run dev
```

**Expected:** App starts without errors

### 3. Commit Changes
```bash
git add .
git commit -m "security: patch high-severity vulnerabilities

- Update axios to 1.7.9+ (fixes CSRF, DoS, SSRF)
- Update parse-duration to 2.1.5+ (fixes Regex DoS)
- Update esbuild to 0.25.0+ (fixes dev CORS issue)
- Update vite to 6.4.1+
- Add basic security headers middleware
- Add environment validation"

git push origin security-hardening-day1
```

---

## Troubleshooting

### "Script permission denied"
```bash
chmod +x scripts/security-fixes.sh
./scripts/security-fixes.sh
```

### "Build fails after updates"
```bash
# Clear everything and try again
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### "Tests fail after updates"
Check if it's just a few tests. If most pass, you're fine for MVP.

### "Everything is broken"
```bash
# Rollback to backup
git checkout security-fixes-backup
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps After This

✅ Day 1: Security fixes (YOU ARE HERE)  
⬜ Day 2: Deploy to Railway.app  
⬜ Day 3: Record demo video  
⬜ Day 4: Create landing page  
⬜ Day 5: Launch!

---

## Need Help?

1. Check [`SECURITY_FIXES_DAY1.md`](SECURITY_FIXES_DAY1.md) for detailed steps
2. Look for errors in terminal output
3. Google the specific error message
4. Most issues are fixed by `rm -rf node_modules && npm install`

---

## Success Criteria

Before moving to Day 2, you should have:

- [ ] Zero high/critical vulnerabilities in `npm audit`
- [ ] All packages building successfully
- [ ] App running locally (`npm run dev` works)
- [ ] Changes committed to git

**If all checked, you're done! Move to Day 2.** 🎉
