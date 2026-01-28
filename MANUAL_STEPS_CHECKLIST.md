# Manual Steps Checklist - Railway Deployment

**Estimated Time:** 40 minutes  
**Difficulty:** Easy (step-by-step instructions provided)

---

## ✅ Pre-Deployment Checklist

Before you begin, make sure you have:

- [ ] GitHub account with access to s8ken/yseeku-platform
- [ ] Railway account (https://railway.app)
- [ ] MongoDB Atlas account (https://cloud.mongodb.com) - free tier is fine
- [ ] Terminal access for running commands
- [ ] Browser for testing

---

## 📋 Step-by-Step Checklist

### Step 1: Review and Merge Pull Request ⏱️ 5 minutes

- [ ] Go to https://github.com/s8ken/yseeku-platform/pull/71
- [ ] Review the changes (11 files changed)
- [ ] Check that all automated tests pass
- [ ] Click "Merge pull request"
- [ ] Confirm merge
- [ ] Delete the branch (optional but recommended)

**Verification:** Pull request shows as "Merged" with purple badge

---

### Step 2: Setup MongoDB Atlas ⏱️ 10 minutes

#### 2.1 Create Cluster
- [ ] Go to https://cloud.mongodb.com
- [ ] Sign in or create account
- [ ] Click "Build a Database"
- [ ] Select "FREE" tier (M0 Sandbox)
- [ ] Choose cloud provider (AWS recommended)
- [ ] Choose region (closest to your Railway region)
- [ ] Click "Create Cluster"
- [ ] Wait for cluster to be created (~3 minutes)

#### 2.2 Create Database User
- [ ] Click "Database Access" in left sidebar
- [ ] Click "Add New Database User"
- [ ] Choose "Password" authentication
- [ ] Username: `yseeku-admin` (or your choice)
- [ ] Click "Autogenerate Secure Password"
- [ ] **IMPORTANT:** Copy and save the password somewhere safe
- [ ] Database User Privileges: "Read and write to any database"
- [ ] Click "Add User"

#### 2.3 Whitelist IP Addresses
- [ ] Click "Network Access" in left sidebar
- [ ] Click "Add IP Address"
- [ ] Click "Allow Access from Anywhere"
- [ ] Confirm IP Address: `0.0.0.0/0`
- [ ] Click "Confirm"
- [ ] Wait for status to change to "Active"

#### 2.4 Get Connection String
- [ ] Click "Database" in left sidebar
- [ ] Click "Connect" button on your cluster
- [ ] Choose "Connect your application"
- [ ] Driver: Node.js
- [ ] Version: 5.5 or later
- [ ] Copy the connection string
- [ ] Replace `<password>` with your database user password
- [ ] Replace `<dbname>` with `yseeku-platform`
- [ ] **SAVE THIS CONNECTION STRING** - you'll need it in Step 4

**Example:**
```
mongodb+srv://yseeku-admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/yseeku-platform?retryWrites=true&w=majority
```

**Verification:** Connection string is saved and password is replaced

---

### Step 3: Generate JWT Secrets ⏱️ 2 minutes

#### 3.1 Generate JWT_SECRET
- [ ] Open terminal
- [ ] Run: `openssl rand -hex 64`
- [ ] Copy the output (should be 128 characters)
- [ ] **SAVE THIS** as JWT_SECRET

#### 3.2 Generate JWT_REFRESH_SECRET
- [ ] Run: `openssl rand -hex 64`
- [ ] Copy the output (should be 128 characters)
- [ ] **SAVE THIS** as JWT_REFRESH_SECRET

**Verification:** You have two different 128-character hex strings saved

---

### Step 4: Configure Railway Backend Service ⏱️ 5 minutes

#### 4.1 Navigate to Backend Service
- [ ] Go to https://railway.app/dashboard
- [ ] Select your project
- [ ] Click on your **backend service** (not frontend)

#### 4.2 Set Environment Variables
- [ ] Click "Variables" tab
- [ ] Click "New Variable" for each of the following:

**Variable 1:**
- [ ] Name: `MONGODB_URI`
- [ ] Value: `<paste-your-connection-string-from-step-2>`

**Variable 2:**
- [ ] Name: `JWT_SECRET`
- [ ] Value: `<paste-first-secret-from-step-3>`

**Variable 3:**
- [ ] Name: `JWT_REFRESH_SECRET`
- [ ] Value: `<paste-second-secret-from-step-3>`

**Variable 4:**
- [ ] Name: `CORS_ORIGIN`
- [ ] Value: `https://yseeku-web-production.up.railway.app` (update with your actual frontend URL later)

**Variable 5:**
- [ ] Name: `PORT`
- [ ] Value: `3001`

**Variable 6:**
- [ ] Name: `NODE_ENV`
- [ ] Value: `production`

#### 4.3 Verify Root Directory Setting
- [ ] Click "Settings" tab
- [ ] Scroll to "Root Directory"
- [ ] Verify it's set to `/` or empty
- [ ] If it says `apps/backend`, change it to `/`
- [ ] Click "Save" if you made changes

**Verification:** All 6 environment variables are set and Root Directory is `/`

---

### Step 5: Deploy Backend Service ⏱️ 5 minutes

#### 5.1 Trigger Deployment
- [ ] In Railway backend service, click "Deployments" tab
- [ ] Click "Deploy" button (or it may auto-deploy after variable changes)
- [ ] Wait for deployment to complete (usually 2-5 minutes)
- [ ] Watch the logs for any errors

#### 5.2 Get Backend URL
- [ ] Click "Settings" tab
- [ ] Find "Domains" section
- [ ] Copy the Railway-provided domain (e.g., `backend-production-xxxx.up.railway.app`)
- [ ] **SAVE THIS URL** - you'll need it in Step 6

#### 5.3 Test Health Endpoint
- [ ] Open terminal
- [ ] Run: `curl https://your-backend-url.railway.app/health`
- [ ] You should see JSON response with `"status": "ok"`

**Example response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T12:34:56.789Z",
  "environment": "production",
  "uptime": 123.45,
  "mongodb": "connected",
  "memory": {
    "used": 50,
    "total": 100
  }
}
```

**Verification:** Health endpoint returns 200 OK with JSON response

---

### Step 6: Configure Railway Frontend Service ⏱️ 3 minutes

#### 6.1 Navigate to Frontend Service
- [ ] Go back to Railway dashboard
- [ ] Click on your **frontend service** (not backend)

#### 6.2 Set Environment Variables
- [ ] Click "Variables" tab
- [ ] Click "New Variable" for each of the following:

**Variable 1:**
- [ ] Name: `NEXT_PUBLIC_BACKEND_URL`
- [ ] Value: `<paste-backend-url-from-step-5>` (NO trailing slash)

**Variable 2:**
- [ ] Name: `PORT`
- [ ] Value: `5000`

**Variable 3:**
- [ ] Name: `NODE_ENV`
- [ ] Value: `production`

#### 6.3 Verify Root Directory Setting
- [ ] Click "Settings" tab
- [ ] Scroll to "Root Directory"
- [ ] Verify it's set to `/` or empty
- [ ] If it says `apps/web`, change it to `/`
- [ ] Click "Save" if you made changes

**Verification:** All 3 environment variables are set and Root Directory is `/`

---

### Step 7: Update Backend CORS_ORIGIN ⏱️ 2 minutes

**Note:** You need to do this after frontend is deployed to get the actual URL

- [ ] Deploy frontend first (Step 8)
- [ ] Get the frontend URL
- [ ] Come back to backend service
- [ ] Click "Variables" tab
- [ ] Find `CORS_ORIGIN` variable
- [ ] Update value to your actual frontend URL
- [ ] Backend will automatically redeploy

**Verification:** CORS_ORIGIN matches your frontend URL

---

### Step 8: Deploy Frontend Service ⏱️ 5 minutes

#### 8.1 Trigger Deployment
- [ ] In Railway frontend service, click "Deployments" tab
- [ ] Click "Deploy" button (or it may auto-deploy)
- [ ] Wait for deployment to complete (usually 3-7 minutes)
- [ ] Watch the logs for any errors

#### 8.2 Get Frontend URL
- [ ] Click "Settings" tab
- [ ] Find "Domains" section
- [ ] Copy the Railway-provided domain
- [ ] **SAVE THIS URL**

#### 8.3 Open Frontend in Browser
- [ ] Open the frontend URL in your browser
- [ ] You should see the SONATE login page

**Verification:** Login page loads without errors

---

### Step 9: Test the Application ⏱️ 5 minutes

#### 9.1 Test Health Endpoints
- [ ] Backend health: `curl https://your-backend-url/health`
- [ ] Frontend health: `curl https://your-frontend-url/api/health`
- [ ] Both should return 200 OK

#### 9.2 Test Registration
- [ ] Open frontend URL in browser
- [ ] Click "Register" or "Sign Up" (if available)
- [ ] Fill in:
  - Name: `Test User`
  - Email: `test@example.com`
  - Password: `Test123!@#`
- [ ] Click "Register"
- [ ] You should be redirected to dashboard

#### 9.3 Test Login
- [ ] Logout (if you were logged in)
- [ ] Go back to login page
- [ ] Enter your credentials
- [ ] Click "Sign In"
- [ ] You should be redirected to dashboard

#### 9.4 Check Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Check for any errors (red text)
- [ ] Check Network tab for failed requests

#### 9.5 Verify No CORS Errors
- [ ] In browser console, look for CORS-related errors
- [ ] Should see no "Access-Control-Allow-Origin" errors
- [ ] All API calls should succeed (200 status)

**Verification:** Registration, login, and dashboard all work without errors

---

## 🎉 Success Criteria

You've successfully deployed when ALL of these are true:

- [ ] Backend health check returns 200 OK
- [ ] Frontend health check returns 200 OK
- [ ] MongoDB shows as "connected" in backend health
- [ ] Can register a new account
- [ ] Can login with credentials
- [ ] Dashboard loads after login
- [ ] No CORS errors in browser console
- [ ] No errors in Railway logs
- [ ] No service restart loops

---

## 🐛 Troubleshooting Quick Reference

### Backend Won't Deploy
- Check MongoDB connection string is correct
- Verify all environment variables are set
- Check Root Directory is `/`
- Review Railway logs for specific errors

### Frontend Can't Reach Backend
- Verify NEXT_PUBLIC_BACKEND_URL is correct
- Verify CORS_ORIGIN includes frontend URL
- Check backend is actually running
- Test backend health endpoint

### Login Fails
- Try registering a new account first
- Check backend logs for errors
- Verify JWT secrets are set
- Check MongoDB is connected

### CORS Errors
- Update CORS_ORIGIN in backend
- Make sure it matches frontend URL exactly
- Redeploy backend after changing CORS_ORIGIN

---

## 📞 Need Help?

If you're stuck:

1. **Check the logs:**
   - Railway dashboard → Service → Deployments → Click on deployment → View logs

2. **Review documentation:**
   - `RAILWAY_DEPLOYMENT_INSTRUCTIONS.md` - Detailed instructions
   - `COMPREHENSIVE_CODE_REVIEW_AND_ACTION_PLAN.md` - Complete technical guide

3. **Common issues:**
   - Most issues are environment variable typos
   - Check for trailing slashes in URLs
   - Verify MongoDB connection string has password replaced

---

## ⏱️ Time Tracking

Use this to track your progress:

- [ ] Step 1: Review PR - Started: _____ Completed: _____
- [ ] Step 2: MongoDB Atlas - Started: _____ Completed: _____
- [ ] Step 3: JWT Secrets - Started: _____ Completed: _____
- [ ] Step 4: Backend Config - Started: _____ Completed: _____
- [ ] Step 5: Backend Deploy - Started: _____ Completed: _____
- [ ] Step 6: Frontend Config - Started: _____ Completed: _____
- [ ] Step 7: Update CORS - Started: _____ Completed: _____
- [ ] Step 8: Frontend Deploy - Started: _____ Completed: _____
- [ ] Step 9: Testing - Started: _____ Completed: _____

**Total Time:** _____ minutes

---

## 🎯 What's Next?

After successful deployment:

1. **Add your Anthropic API key:**
   - Login to dashboard
   - Go to Settings
   - Add your Anthropic API key
   - Test LLM integration

2. **Explore features:**
   - Create agents
   - Test trust receipts
   - Try the dashboard features

3. **Setup monitoring:**
   - Configure Railway alerts
   - Monitor MongoDB metrics
   - Setup error tracking

4. **Security:**
   - Rotate JWT secrets regularly
   - Setup MongoDB backups
   - Review rate limiting settings

---

**You're ready to deploy! Follow the checklist step by step. Good luck! 🚀**