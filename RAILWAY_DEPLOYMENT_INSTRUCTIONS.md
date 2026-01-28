# Railway Deployment Instructions

## Prerequisites Completed ✅

The following automated fixes have been applied to the codebase:

1. ✅ Health check endpoint updated (returns 200 even if MongoDB is temporarily down)
2. ✅ MongoDB connection timeout increased (5s → 30s)
3. ✅ Railway configuration files updated (proper build paths)
4. ✅ Frontend health check endpoint added
5. ✅ Environment variable validation added
6. ✅ Rate limiting added to auth routes
7. ✅ ESLint dependencies installed
8. ✅ Integration and E2E test templates created

---

## Manual Steps Required

### Step 1: Setup MongoDB Atlas (10 minutes)

1. Go to https://cloud.mongodb.com
2. Sign in or create a free account
3. Create a new cluster (free tier is sufficient for testing)
4. Click "Connect" on your cluster
5. Create a database user:
   - Username: `yseeku-admin` (or your choice)
   - Password: Generate a strong password and save it
6. Whitelist all IPs for Railway access:
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
7. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `yseeku-platform`
   - Final format: `mongodb+srv://yseeku-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/yseeku-platform?retryWrites=true&w=majority`

**Save this connection string - you'll need it in Step 3**

---

### Step 2: Generate JWT Secrets (2 minutes)

Run these commands in your terminal to generate secure secrets:

```bash
# Generate JWT_SECRET (copy the output)
openssl rand -hex 64

# Generate JWT_REFRESH_SECRET (copy the output)
openssl rand -hex 64
```

**Save both secrets - you'll need them in Step 3**

---

### Step 3: Configure Railway Backend Service (5 minutes)

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Select your project
3. Click on your **backend service**
4. Click on the "Variables" tab
5. Add the following environment variables:

```bash
MONGODB_URI=mongodb+srv://yseeku-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/yseeku-platform?retryWrites=true&w=majority
JWT_SECRET=<paste-first-generated-secret-from-step-2>
JWT_REFRESH_SECRET=<paste-second-generated-secret-from-step-2>
CORS_ORIGIN=https://yseeku-web-production.up.railway.app
PORT=3001
NODE_ENV=production
```

**Important Notes:**
- Replace `MONGODB_URI` with your actual connection string from Step 1
- Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with the secrets from Step 2
- Update `CORS_ORIGIN` with your actual Railway frontend URL (you'll get this after deploying frontend)
- If you don't know your frontend URL yet, use a placeholder and update it later

6. Click "Save" or the variables will auto-save

7. **IMPORTANT:** In the backend service settings:
   - Go to "Settings" tab
   - Scroll to "Root Directory"
   - Make sure it's set to `/` (repository root) or leave it empty
   - If it's set to `apps/backend`, change it to `/`

---

### Step 4: Deploy Backend Service (5 minutes)

1. In Railway, click on your backend service
2. Click "Deploy" or trigger a new deployment
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Check the deployment logs for any errors
5. Once deployed, copy the backend URL (e.g., `https://yseeku-backend-production.up.railway.app`)
6. Test the health endpoint:
   ```bash
   curl https://your-backend-url.railway.app/health
   ```
   You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-28T...",
     "environment": "production",
     "uptime": 123.45,
     "mongodb": "connected",
     "memory": {
       "used": 50,
       "total": 100
     }
   }
   ```

**If deployment fails:**
- Check the logs for error messages
- Verify all environment variables are set correctly
- Verify MongoDB connection string is correct
- Verify Root Directory is set to `/`

---

### Step 5: Configure Railway Frontend Service (3 minutes)

1. Go back to your Railway dashboard
2. Click on your **frontend service**
3. Click on the "Variables" tab
4. Add the following environment variables:

```bash
NEXT_PUBLIC_BACKEND_URL=https://yseeku-backend-production.up.railway.app
PORT=5000
NODE_ENV=production
```

**Important Notes:**
- Replace `NEXT_PUBLIC_BACKEND_URL` with your actual backend URL from Step 4
- Make sure the URL does NOT have a trailing slash

5. **IMPORTANT:** In the frontend service settings:
   - Go to "Settings" tab
   - Scroll to "Root Directory"
   - Make sure it's set to `/` (repository root) or leave it empty
   - If it's set to `apps/web`, change it to `/`

---

### Step 6: Update Backend CORS_ORIGIN (2 minutes)

Now that you have your frontend URL:

1. Go back to your **backend service** in Railway
2. Click on the "Variables" tab
3. Update the `CORS_ORIGIN` variable with your actual frontend URL:
   ```bash
   CORS_ORIGIN=https://your-actual-frontend-url.railway.app
   ```
4. Save the changes
5. The backend will automatically redeploy with the new CORS settings

---

### Step 7: Deploy Frontend Service (5 minutes)

1. In Railway, click on your frontend service
2. Click "Deploy" or trigger a new deployment
3. Wait for the deployment to complete (usually 3-7 minutes)
4. Check the deployment logs for any errors
5. Once deployed, copy the frontend URL
6. Open the frontend URL in your browser

**You should see the SONATE login page!**

---

### Step 8: Test the Application (5 minutes)

1. **Test Health Endpoints:**
   ```bash
   # Backend health
   curl https://your-backend-url.railway.app/health
   
   # Frontend health
   curl https://your-frontend-url.railway.app/api/health
   ```

2. **Test Registration:**
   - Open your frontend URL in a browser
   - Try to register a new account
   - Fill in: Name, Email, Password
   - Click "Register" or "Sign Up"
   - You should be redirected to the dashboard

3. **Test Login:**
   - If registration worked, logout
   - Try to login with your credentials
   - You should be redirected to the dashboard

4. **Test Dashboard:**
   - After login, you should see the dashboard
   - Check if the page loads without errors
   - Open browser console (F12) and check for any errors

---

## Troubleshooting

### Backend Health Check Fails

**Symptoms:** Backend deployment shows as unhealthy, keeps restarting

**Solutions:**
1. Check MongoDB connection:
   - Verify `MONGODB_URI` is correct
   - Verify MongoDB Atlas allows connections from 0.0.0.0/0
   - Test connection string locally: `mongosh "your-connection-string"`

2. Check environment variables:
   - Verify `JWT_SECRET` is at least 32 characters
   - Verify `JWT_REFRESH_SECRET` is set
   - Verify all required variables are set

3. Check logs:
   - Look for "MongoDB connection failed" errors
   - Look for "Environment validation failed" errors

### Frontend Can't Reach Backend

**Symptoms:** Login fails, API calls fail, CORS errors in browser console

**Solutions:**
1. Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly in frontend
2. Verify `CORS_ORIGIN` includes your frontend URL in backend
3. Check if backend is actually running and healthy
4. Test backend health endpoint directly

### Login Fails

**Symptoms:** "Invalid credentials" or "Login failed" errors

**Solutions:**
1. Try registering a new account first
2. Check backend logs for authentication errors
3. Verify JWT secrets are set correctly
4. Check if MongoDB is connected (backend health endpoint)

### Build Fails

**Symptoms:** Deployment fails during build phase

**Solutions:**
1. Verify Root Directory is set to `/` (not `apps/backend` or `apps/web`)
2. Check build logs for specific error messages
3. Verify all dependencies are in package.json
4. Try building locally first: `npm run build:backend` or `npm run build`

---

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | `<64-char-hex-string>` |
| `JWT_REFRESH_SECRET` | Refresh token secret (64+ chars) | `<64-char-hex-string>` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://frontend.railway.app` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `https://backend.railway.app` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |

---

## Success Criteria

After completing all steps, you should have:

- ✅ Backend deployed and healthy on Railway
- ✅ Frontend deployed and accessible on Railway
- ✅ MongoDB connected and accessible
- ✅ Health checks passing (backend and frontend)
- ✅ User registration working
- ✅ User login working
- ✅ Dashboard accessible after login
- ✅ No CORS errors in browser console
- ✅ No errors in Railway logs

---

## Next Steps After Deployment

1. **Test all features:**
   - Create agents
   - Test LLM integration (add API keys in settings)
   - Test trust receipts
   - Test dashboard features

2. **Setup monitoring:**
   - Configure alerts in Railway
   - Setup error tracking (Sentry)
   - Monitor MongoDB Atlas metrics

3. **Security hardening:**
   - Rotate JWT secrets regularly
   - Setup backup strategy for MongoDB
   - Configure rate limiting thresholds
   - Review CORS settings

4. **Performance optimization:**
   - Monitor response times
   - Optimize database queries
   - Configure caching if needed

---

## Support

If you encounter issues not covered in this guide:

1. Check Railway logs for detailed error messages
2. Check MongoDB Atlas logs
3. Review the comprehensive guide: `COMPREHENSIVE_CODE_REVIEW_AND_ACTION_PLAN.md`
4. Create a GitHub issue with:
   - Error messages from logs
   - Steps to reproduce
   - Environment variable configuration (without secrets)

---

**Deployment should take approximately 30-40 minutes total.**

Good luck! 🚀