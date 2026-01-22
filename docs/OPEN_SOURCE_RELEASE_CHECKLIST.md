# Open Source Release Checklist

**Target:** Initial community feedback release  
**Date:** January 2026  
**Status:** In Progress

---

## 🔴 Critical (Must Do Before Release)

### Security
- [x] Run `npm audit fix` to address vulnerabilities (44→25, remaining are low/moderate dev deps)
- [ ] Verify no secrets/API keys in git history
- [x] Ensure `.env` files are in `.gitignore`
- [x] Review `.env.example` has no real credentials

### Code Cleanup
- [ ] Remove or archive `_archived/` folders (4 found)
- [ ] Address critical `// TODO` comments (43 found) — convert to GitHub Issues
- [x] Fix `// Temporarily commented` code in production files (resonance-detector fixed)
- [x] Remove mock implementations from production code paths (resonance-detector now has real logic)

### Documentation
- [x] Create `QUICKSTART.md` (5-minute getting started) ✅
- [x] Verify `README.md` has accurate setup instructions ✅
- [x] Add "Known Limitations" section to README ✅
- [ ] Ensure all docs reference correct branch/version

---

## 🟡 Important (Should Do)

### Repository Hygiene
- [x] Add issue templates (bug report, feature request) ✅
- [x] Add pull request template ✅
- [ ] Create `CHANGELOG.md` with v2.0.0 notes
- [x] Add "good first issue" template ✅
- [ ] Set up GitHub Discussions for Q&A (do this in GitHub settings)

### Testing
- [x] Ensure all tests pass (`npm test`) ✅ 12/12 passing
- [x] Document test coverage (currently ~89% on @sonate/detect) ✅
- [ ] Add smoke test for quick validation

### Build & Deploy
- [x] Verify `npm run build` works cleanly ✅
- [ ] Test fresh clone + install + run flow
- [ ] Add deploy button (Vercel/Railway) if possible
- [ ] Create Docker Compose for easy local setup

---

## 🟢 Nice to Have (Can Do Later)

### Community
- [ ] Set up GitHub Sponsors
- [ ] Create Discord/Slack community
- [ ] Write announcement blog post
- [ ] Prepare demo video/GIF

### Documentation Expansion
- [ ] API reference documentation
- [ ] Architecture decision records (ADRs)
- [ ] Contribution workflow guide
- [ ] Code style guide

---

## Execution Plan

### Day 1: Security & Critical Cleanup
1. `npm audit fix`
2. Remove archive folders or move to separate branch
3. Create QUICKSTART.md

### Day 2: Documentation & Polish
1. Update README with accurate instructions
2. Add issue/PR templates
3. Test fresh installation flow

### Day 3: Final Review & Soft Launch
1. Final test of all features
2. Prepare announcement post
3. Share with first community (AI Safety, etc.)

---

## Communities to Target

1. **AI Safety** - Alignment Forum, LessWrong
2. **AI Governance** - r/MachineLearning, HackerNews
3. **TypeScript/Node.js** - r/typescript, r/node
4. **Emergence Research** - Academic mailing lists
5. **Open Source AI** - LAION, EleutherAI Discord

---

## Post-Release Monitoring

- [ ] Monitor GitHub Issues for bugs
- [ ] Respond to questions within 24 hours
- [ ] Track stars/forks/clones
- [ ] Gather feedback themes
