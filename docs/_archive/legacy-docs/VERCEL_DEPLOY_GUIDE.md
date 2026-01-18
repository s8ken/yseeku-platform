# Deploy to Vercel - Complete Guide

**Time Required:** 15-30 minutes  
**Cost:** $0 (Free tier)  
**Result:** Live demo at yourproject.vercel.app

---

## ✅ What I've Done For You

1. **Updated [`vercel.json`](vercel.json:1)** with proper configuration:
   - Points to `resonate-dashboard` app (your public demo)
   - Security headers automatically applied
   - Optimized build settings
   - Monorepo-aware configuration

2. **Security headers included:**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin

---

## 🚀 Deploy Now (3 Steps)

### Step 1: Install Vercel CLI (1 minute)

```bash
npm install -g vercel
```

Or use npx (no install needed):
```bash
npx vercel
```

### Step 2: Login to Vercel (1 minute)

```bash
vercel login
```

This will open your browser. Login with:
- GitHub (recommended - links your repo)
- GitLab
- Bitbucket
- Email

### Step 3: Deploy (2 minutes)

From your project root:

```bash
# First deployment (interactive)
vercel

# Answer the prompts:
# ? Set up and deploy "~/yseeku-platform"? [Y/n] Y
# ? Which scope? [Your account]
# ? Link to existing project? [N]
# ? What's your project's name? yseeku-platform
# ? In which directory is your code located? ./
# ? Auto-detected Project Settings (Next.js): Yes
```

**That's it!** Vercel will:
1. Upload your code
2. Install dependencies
3. Build your app
4. Deploy to a URL like: `yseeku-platform-abc123.vercel.app`

---

## 🎯 Expected Output

```bash
🔍  Inspect: https://vercel.com/your-account/yseeku-platform/abc123
✅  Production: https://yseeku-platform.vercel.app
```

Copy that URL - that's your live demo! 🎉

---

## 🔧 Configuration Details

### What Vercel Will Deploy

**App:** `apps/resonate-dashboard` (your public demo dashboard)

**Build Command:**
```bash
cd apps/resonate-dashboard && npm run build
```

**Output:** `.next` directory with optimized production build

**Start Command:**
```bash
npm run start
```

### Why resonate-dashboard?

Looking at your apps:
- `apps/web` - Admin dashboard (keep private for now)
- `apps/resonate-dashboard` - Public demo ✅ (perfect for MVP)
- `apps/enterprise-demo` - Enterprise features
- `apps/new-demo` - Experimental

The `resonate-dashboard` is the best choice for your public demo.

---

## 🌐 Environment Variables (If Needed)

If your app needs environment variables, add them in Vercel dashboard:

### Via Dashboard:
1. Go to vercel.com
2. Select your project
3. Settings → Environment Variables
4. Add variables:
   - `NODE_ENV` = `production`
   - `SONATE_PUBLIC_KEY` = [your public key]
   - `DATABASE_URL` = [if needed]
   - `REDIS_URL` = [if needed]

### Via CLI:
```bash
# Add environment variable
vercel env add SONATE_PUBLIC_KEY
# Paste your key when prompted

# Or from .env file
vercel env pull .env.production.local
```

---

## 🆓 Using Free Services

Your demo might need a database and cache. Here's the free tier setup:

### Vercel Postgres (Free Tier)
```bash
# Enable Vercel Postgres
vercel postgres create

# This creates a PostgreSQL database
# Automatically adds DATABASE_URL to your project
```

**Free tier limits:**
- 256 MB storage
- 60 compute hours/month
- Perfect for MVP demo

### Vercel KV (Redis Alternative) - Free Tier
```bash
# Enable Vercel KV (Redis-compatible)
vercel kv create

# Automatically adds KV_* environment variables
```

**Free tier limits:**
- 256 MB storage  
- 1GB bandwidth/month
- Perfect for caching

### Alternative: External Free Services

**PostgreSQL:**
- Supabase: 500 MB free
- Neon: 3 GB free
- ElephantSQL: 20 MB free

**Redis:**
- Upstash: 10k commands/day free
- Redis Cloud: 30 MB free

---

## 📱 Custom Domain (Optional - Day 3+)

After deployment works, add your domain:

### If You Have a Domain:
```bash
vercel domains add yseeku.com
```

Then add DNS records they provide.

### Get a Free Domain:
- Use the Vercel-provided domain (free)
- Or get free domain from: Freenom, Dot.tk

---

## 🔍 Monitoring Your Deployment

### Vercel Dashboard
- **Analytics**: Free for all projects
- **Logs**: Real-time function logs
- **Deployments**: History of all deployments
- **Speed Insights**: Performance metrics

### Access Your Metrics:
1. Go to vercel.com/your-account/yseeku-platform
2. Click "Analytics" tab
3. See:
   - Page views
   - Unique visitors
   - Performance metrics
   - Error rates

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Likely missing dependency in apps/resonate-dashboard
cd apps/resonate-dashboard
npm install
git add package.json package-lock.json
git commit -m "fix: add missing dependencies"
git push
```

**Error: "Type errors"**
```bash
# Temporarily disable TypeScript errors (already done in next.config)
# Your next.config.mjs has: typescript: { ignoreBuildErrors: true }
```

**Error: "Out of memory"**
```bash
# Add to package.json in resonate-dashboard:
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

### Deployment Succeeds But App Crashes

**Check logs:**
```bash
vercel logs
```

**Common issues:**
- Missing environment variables
- Database connection failing
- Node version mismatch

**Fix:**
```bash
# Set Node version in package.json
"engines": {
  "node": "20.x"
}
```

### Can't Access Deployment

**Check deployment URL:**
```bash
vercel ls
```

**Open in browser:**
```bash
vercel --prod
# Opens your production URL
```

---

## 🚀 Production Deployment Workflow

### For Future Updates:

**Option 1: Automatic (Recommended)**
- Just push to GitHub
- Vercel auto-deploys on every push
- Preview deployments for PRs

**Option 2: Manual**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 📦 What's Deployed

Based on your configuration, Vercel will deploy:

### Routes Available:
- `/` - Dashboard home
- `/overseer` - Overseer panel
- `/api/*` - API routes

### API Endpoints:
- `/api/analyze` - Analysis endpoint
- `/api/receipts/verify` - Receipt verification
- `/api/alerts/export` - Alert export
- `/api/calibration/decision` - Calibration decisions

---

## 💡 Pro Tips

### 1. Preview Deployments
Every git push creates a preview URL:
```
yseeku-platform-git-feature-branch.vercel.app
```
Perfect for testing before production!

### 2. Environment-Specific Variables
```bash
# Development
vercel env add KEY development

# Preview
vercel env add KEY preview

# Production
vercel env add KEY production
```

### 3. Instant Rollbacks
In Vercel dashboard:
- Go to Deployments
- Find previous working deployment
- Click "Promote to Production"
- Instant rollback! (< 30 seconds)

### 4. Custom Redirects
Add to `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/demo",
      "destination": "/",
      "permanent": false
    }
  ]
}
```

---

## 🎬 The Deployment Process (What Happens)

### 1. Code Upload
Vercel receives your code via:
- Git push (if linked to GitHub)
- Or direct upload via CLI

### 2. Build Phase
```bash
npm install              # Install dependencies
npm run build            # Build Next.js app
# Output: Optimized production build
```

### 3. Deploy Phase
- Uploads build artifacts to CDN
- Provisions serverless functions
- Configures routing
- Enables SSL (automatic HTTPS)

### 4. Live!
- Deployment URL active
- CDN serving static assets globally
- Serverless functions running on-demand
- Analytics collecting data

**Total time:** 2-5 minutes

---

## 📊 What You Get (Free Tier)

- ✅ Unlimited deployments
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN (edge network)
- ✅ Analytics & Web Vitals
- ✅ Logs & monitoring
- ✅ Preview deployments
- ✅ Custom domains (1 included)

**Limits (rarely hit for MVP):**
- 100 GB bandwidth/month
- 100 serverless function executions/day
- 6,000 build minutes/month

---

## 🔐 Security Checklist

Before deploying, verify:

- [x] All vulnerabilities patched
- [x] Security headers in vercel.json
- [x] Environment variables prepared
- [ ] Sensitive data not in code
- [ ] API routes have auth (if needed)
- [ ] CORS configured properly

---

## 🎯 Post-Deployment Checklist

After deployment succeeds:

### 1. Test Your Demo (5 minutes)
```bash
# Get your URL
vercel ls

# Test in browser
open https://your-project.vercel.app

# Test API endpoints
curl https://your-project.vercel.app/api/analyze
```

### 2. Update README (2 minutes)
Add your live demo link:
```markdown
## 🌐 Live Demo

Try it now: https://yseeku-platform.vercel.app

See Bedau Index, Phase-Shift Velocity, and Trust Receipts in action!
```

### 3. Share (5 minutes)
Send to 5 people:
- "Hey, I just deployed my AI governance platform. Check it out: [URL]"
- Ask for honest feedback
- Note: It's a demo, not production

### 4. Monitor (Ongoing)
- Check Vercel Analytics daily
- Watch for errors in logs
- Note which features people use
- Collect feedback

---

## 🚨 Emergency Procedures

### If Deployment Is Down
```bash
# Check status
vercel inspect [deployment-url]

# Rollback to previous
# (Do this via dashboard - faster)
```

### If You Hit Rate Limits
```bash
# Check current usage
vercel list
vercel inspect

# Upgrade to Pro ($20/month) if needed
vercel upgrade
```

### If Something Breaks
```bash
# Redeploy from last working commit
git checkout [last-working-commit]
vercel --prod

# Or rollback via dashboard (easier)
```

---

## 💰 When to Upgrade from Free Tier

**Stay on free tier if:**
- < 100 visits/day
- < 1000 API calls/day  
- MVP/demo stage
- No paying customers

**Upgrade to Pro ($20/month) when:**
- \> 100 visits/day
- Need faster builds
- Want team collaboration
- Need more build minutes
- Have paying customers

---

## 📋 Complete Deployment Command Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm [deployment-name]

# Link to project
vercel link

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add [KEY]

# Open in browser
vercel --open

# Check deployment status
vercel inspect [url]
```

---

## 🎓 Next Steps After Deployment

### Day 2 Tasks (After Vercel Deploy):
1. ✅ Test all features on live site
2. ✅ Fix any deployment-specific bugs
3. ✅ Update README with demo link
4. ✅ Share with 5 people for feedback
5. ✅ Set up basic analytics tracking

### Day 3-4 Tasks:
1. Record 3-minute demo video
2. Create simple landing page
3. Write pitch one-pager
4. Polish documentation

### Day 5 Tasks:
1. Launch on Show HN
2. Post on Twitter
3. Email your network
4. Respond to feedback

---

## 📞 Support Resources

### Vercel Documentation
- Quickstart: https://vercel.com/docs/getting-started-with-vercel
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Monorepos: https://vercel.com/docs/monorepos

### If You Need Help
- Vercel Discord: https://vercel.com/discord
- Vercel Support: support@vercel.com
- Documentation: vercel.com/docs

---

## 🎉 You're Ready to Deploy!

Just run:
```bash
vercel
```

And follow the prompts. Your demo will be live in 5 minutes.

Then update your README with the live link and start showing people! 🚀

---

## 🔄 Continuous Deployment (Optional but Recommended)

### Connect to GitHub
1. Go to vercel.com
2. Import Git Repository
3. Select your repo
4. Vercel auto-configures from vercel.json
5. Every push to main auto-deploys!

**Benefits:**
- No manual deployments
- Preview URLs for PRs
- Automatic rollbacks if build fails
- Deployment history

---

**Ready? Run `vercel` and ship this thing!** 🚀
