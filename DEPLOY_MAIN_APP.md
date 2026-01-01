# Deploy Main Admin Dashboard - Best Demo Option

**App:** `apps/web` (the full admin dashboard)  
**Why:** Most comprehensive, impressive, feature-complete  
**URL:** Currently running at http://localhost:5000  
**Goal:** Get this live for demos

---

## 🎯 The Problem with Vercel

**Issue:** Monorepo with local packages fails to build on Vercel
- `@sonate/core`, `@sonate/detect`, etc. as `file:` dependencies
- Vercel struggles with workspace dependencies
- Build fails when compiling packages

**Solution:** Two options below

---

## ✅ OPTION 1: Railway.app (RECOMMENDED - 30 minutes)

**Why Railway:**
- ✅ Handles monorepos perfectly
- ✅ Supports workspace dependencies
- ✅ Free tier sufficient for MVP
- ✅ PostgreSQL included (free)
- ✅ Redis available (free)
- ✅ One-command deploy

### Step-by-Step:

**1. Install Railway CLI (if not already)**
```bash
npm install -g @railway/cli
```

**2. Login**
```bash
railway login
```

**3. Initialize Project**
```bash
railway init
```

**4. Add PostgreSQL**
```bash
railway add --database postgres
```

**5. Add Redis (optional)**
```bash
railway add --database redis
```

**6. Create railway.json config**
I'll create this for you below.

**7. Deploy**
```bash
railway up
```

**That's it!** Railway handles the monorepo automatically.

---

## 📝 Railway Configuration

**File:** `railway.json` (I'll create this)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build",
    "watchPatterns": [
      "apps/web/**",
      "packages/**"
    ]
  },
  "deploy": {
    "startCommand": "cd apps/web && npm run start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**File:** `apps/web/.env.example`
```bash
DATABASE_URL=postgresql://user:password@host:port/db
REDIS_URL=redis://host:port
NEXTAUTH_SECRET=generate-this-with-openssl
NEXTAUTH_URL=https://your-app.railway.app
NODE_ENV=production
```

---

## ⚡ OPTION 2: Fix Vercel (More Work - 2 hours)

**Strategy:** Pre-build packages, deploy only the app

**1. Update vercel.json:**
```json
{
  "buildCommand": "npm run build:packages && cd apps/web && npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": "apps/web/.next",
  "framework": null
}
```

**2. Add build:packages script to root package.json:**
```json
{
  "scripts": {
    "build:packages": "turbo run build --filter=@sonate/core --filter=@sonate/detect --filter=@sonate/lab --filter=@sonate/orchestrate --filter=@sonate/persistence"
  }
}
```

**3. Update apps/web/package.json to use published packages** (if you publish to npm)

**OR:**

**Bundle packages into the app** (copy dist folders)

**This is complex and error-prone for MVP.**

---

## 🏆 RECOMMENDATION: Railway.app

**For MVP launch:**
- Railway is faster (30 mins vs 2 hours)
- More reliable for monorepos
- Free tier is generous
- Easy to switch to Vercel later if needed

**For Production Later:**
- Can always migrate to Vercel after MVP validation
- Or stay on Railway (it scales well)
- Or use dedicated hosting

**Don't let deployment complexity delay your launch.**

---

## 🚀 Quick Railway Deploy (Do This Now)

**Commands:**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login (opens browser)
railway login

# 3. Create project
railway init

# 4. Add database
railway add

# 5. Deploy
railway up

# 6. Get your URL
railway domain
```

**Time:** 30 minutes  
**Cost:** $0 (free tier)  
**Result:** Your full admin dashboard live

---

## 📦 What Gets Deployed

**Your Full App:**
- Complete admin dashboard
- All DETECT, LAB, ORCHESTRATE modules
- Agent monitoring, Bedau Index calculator
- Trust receipts, Audit logs
- Multi-tenant support
- All the features you just tested locally

**Demo Experience:**
- Users see the real platform
- Can explore all features
- Professional enterprise UI
- Much better than static HTML

---

## 🎯 Mock Demo Mode (For Public Access)

**Add to your app:** Demo mode with pre-populated data

**File:** `apps/web/src/app/demo/page.tsx`
```typescript
// Auto-login as demo user
// Show pre-populated agents, experiments, receipts
// Read-only mode
// Banner: "Demo Mode - Exploring with sample data"
```

**This way:**
- Anyone can see the full app
- No login required for demo
- Safe (read-only, mock data)
- Impressive (real UI, real features)

**Add this after Railway deployment.**

---

## ✅ My Recommendation

**Do this RIGHT NOW (today):**

1. Deploy to Railway (30 mins)
   ```bash
   railway login
   railway init
   railway up
   ```

2. Add demo mode (1 hour)
   - Auto-login for /demo route
   - Pre-populated mock data
   - Read-only access

3. Update https://demo.yseeku.com landing page
   - Main CTA: "Try Full Platform Demo" → Railway URL
   - Secondary: "View Documentation"
   - Tertiary: "Star on GitHub"

**Total time:** 90 minutes  
**Total cost:** $0  
**Impact:** Massive (real app vs static demos)

---

## 📊 Comparison

| Option | Time | Cost | Impression | Accuracy |
|--------|------|------|------------|----------|
| Static HTML demos | 0 (done) | $0 | 6/10 | 95% (fixed) |
| **Railway deployment** | 30 mins | $0 | **10/10** | 100% |
| Vercel (after fixes) | 2 hours | $0 | 10/10 | 100% |

**Winner:** Railway for speed to launch

---

**Want me to create the Railway config files and help you deploy?**
