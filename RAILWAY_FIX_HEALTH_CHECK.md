# Railway Deployment - Fix Health Check Failure

**Status:** Build succeeded ✅ but health check failing ❌  
**Issue:** App needs environment variables to start  
**Fix Time:** 5 minutes

---

## 🔍 What's Happening

From the logs:
- ✅ Build completed successfully (took 39s)
- ✅ Docker image created
- ❌ Health check failing: "service unavailable"
- **Reason:** App can't start without required environment variables

---

## ✅ FIX: Add Environment Variables in Railway

### Step 1: Go to Railway Dashboard
https://railway.com/project/12dd0d78-42bf-4afd-991b-7cd956c28cbd

### Step 2: Click on your service (not the PostgreSQL database)

### Step 3: Go to "Variables" tab

### Step 4: Add These Variables

**Required:**
```
NODE_ENV=production
CSRF_SECRET=generate-random-string-here-minimum-32-chars
JWT_SECRET=another-random-string-minimum-32-chars
ADMIN_EMAIL=demo@yseeku.com
ADMIN_PASSWORD=DemoPassword123!
```

**Note:** DATABASE_URL should already be there from PostgreSQL

**Generate secrets:**
```bash
# Run these locally to generate secure secrets
openssl rand -base64 32
openssl rand -base64 32
```

### Step 5: Click "Redeploy"

The app should start successfully now!

---

## 📝 All Required Environment Variables

Based on your `apps/web/.env`:

| Variable | Value | Purpose |
|----------|-------|---------|
| NODE_ENV | production | Environment mode |
| DATABASE_URL | (auto from Railway) | PostgreSQL connection |
| CSRF_SECRET | (generate 32+ chars) | CSRF protection |
| JWT_SECRET | (generate 32+ chars) | JWT auth |
| ADMIN_EMAIL | demo@yseeku.com | Demo login |
| ADMIN_PASSWORD | DemoPassword123! | Demo login |

**Optional but recommended:**
```
NEXTAUTH_SECRET=(same as JWT_SECRET)
NEXTAUTH_URL=https://your-app.railway.app
REDIS_URL=(if you add Redis later)
```

---

## 🚀 After Variables Are Set

1. Click "Redeploy" in Railway
2. Wait 2-3 minutes
3. Health check should pass
4. Click "Generate Domain" to get your URL
5. Visit your live app!

---

## ⚠️ If Health Check Still Fails

**Check app logs in Railway:**
- Look for database connection errors
- Look for missing environment variable errors
- Look for port binding issues

**Common issues:**
- DATABASE_URL format wrong
- Secrets not long enough
- Database not ready yet (wait 1 minute, redeploy)

---

## 🎯 Expected Result

Once environment variables are set:
- Health check will pass ✅
- App will start on Railway's assigned port
- You'll get a URL like: yseeku-platform-production.up.railway.app
- Full admin dashboard will be live!

---

**Do this now: Add the 6 environment variables in Railway dashboard, then click "Redeploy"**
