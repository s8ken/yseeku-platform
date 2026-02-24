# Quick Deploy to Fly.io

## Option 1: Trigger GitHub Actions Workflow (Recommended)

No local setup needed - runs in GitHub cloud:

**Via GitHub Web**:
1. Go to: https://github.com/s8ken/yseeku-platform/actions
2. Click "Deploy Backend to Fly.io" workflow (left sidebar)
3. Click "Run workflow" button
4. Select branch: `main`
5. Click green "Run workflow" button
6. Wait ~5-10 minutes for deployment

**Check Status**:
- Green checkmark = Deployed successfully ✅
- Red X = Deployment failed ❌
- View logs by clicking the workflow run

---

## Option 2: Install flyctl Locally & Deploy Manually

```bash
# 1. Install flyctl
# macOS:
brew install flyctl

# Windows (via Chocolatey):
choco install flyctl

# Linux:
curl -L https://fly.io/install.sh | sh

# 2. Authenticate with Fly.io
flyctl auth login
# Follow prompts to authenticate

# 3. Deploy backend
cd c:\Users\Stephen\yseeku-platform
flyctl deploy -a yseeku-backend --remote-only

# 4. Monitor deployment
flyctl status -a yseeku-backend
flyctl logs -a yseeku-backend

# 5. Verify health
curl https://yseeku-backend.fly.dev/health
```

---

## Option 3: Deploy via GitHub CLI (If Installed)

```bash
# Check if GitHub CLI is available
gh --version

# Trigger workflow (if available)
gh workflow run fly-deploy.yml --ref main
```

---

## What Gets Deployed

**These 4 critical commits will be deployed**:

1. **24b30b7** (Feb 15, 18:25) - Dashboard KPI optimization
   - 90% faster dashboard loads
   - MongoDB aggregation instead of full scans
   - Redis caching for responses

2. **ba09a10** (Feb 15, 18:08) - Fix 502 error on first message
   - Eager initialization of keysService at startup
   - 5s timeout safeguard
   - Critical for demo/user experience

3. **d289393** (Feb 15, 11:52) - Dependency updates
   - Security patches via dependabot

4. **be02583** (Feb 15, 01:59) - Demo readiness improvements
   - Receipt persistence fixes
   - Proof page updates
   - Calculator consistency

---

## Verification After Deploy

```bash
# 1. Check health endpoint
curl https://yseeku-backend.fly.dev/health

# 2. Expected response (200 OK):
{
  "status": "ok",
  "timestamp": "2026-02-15T18:30:00Z"
}

# 3. Test the 502 fix (send first message)
# Go to: https://yseeku-platform-web.vercel.app/dashboard/chat
# Type a message - should NOT see 502 error

# 4. Test KPI optimization (dashboard load)
# Go to: https://yseeku-platform-web.vercel.app/dashboard
# Should load in <500ms (was 3-5s before)

# 5. Check Fly.io deployment status
https://fly.io/dashboard/apps/yseeku-backend
```

---

## Deployment Status Tracking

**Check Recent Deployments**:
```
Fly.io Dashboard: https://fly.io/dashboard/apps/yseeku-backend
- Look for: New deployment with timestamp Feb 15
- Status: Should show "Healthy" with green checkmark
```

**Or via CLI**:
```bash
flyctl releases -a yseeku-backend --limit 5
```

---

## If Something Goes Wrong

**Rollback to Previous Version**:
```bash
flyctl scale count -a yseeku-backend 0
# Wait 30 seconds
flyctl scale count -a yseeku-backend 1
```

**Or revert to previous release**:
```bash
flyctl releases -a yseeku-backend
# Copy the previous release ID, then:
flyctl releases rollback <RELEASE_ID> -a yseeku-backend
```

---

## TL;DR - Fastest Option

1. Go to: https://github.com/s8ken/yseeku-platform/actions
2. Click "Deploy Backend to Fly.io"
3. Click "Run workflow" → select `main` → Run
4. Wait 5-10 minutes
5. Verify at: https://yseeku-backend.fly.dev/health

Done! ✅
