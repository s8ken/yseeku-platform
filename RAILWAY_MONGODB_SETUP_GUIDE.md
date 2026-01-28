# Railway MongoDB Setup Guide

## Overview
This guide will walk you through adding MongoDB to your Railway project and connecting it to your yseeku-platform backend.

---

## ✅ What's Already Done

1. **Backend code updated** to support Railway's `MONGODB_URL` environment variable
2. **Configuration committed** to branch `fix/railway-deployment-and-auth-improvements`
3. **Code pushed** to GitHub

---

## 🚀 Step-by-Step Instructions

### Step 1: Add MongoDB Service to Railway

1. **Go to your Railway project:**
   - Navigate to https://railway.app/project
   - Select your `yseeku-platform` project

2. **Add MongoDB:**
   - Click the **"New"** button in the top-right corner
   - Select **"Database"**
   - Choose **"MongoDB"**
   - Railway will create a new MongoDB service

3. **Wait for MongoDB to initialize:**
   - The MongoDB service will take 30-60 seconds to start
   - You'll see a status indicator change from "Building" to "Ready"

### Step 2: Verify Automatic Configuration

Railway will **automatically** create the following:

1. **Environment Variables:**
   - `MONGODB_URL` - MongoDB connection string (this is what your backend now uses!)
   - `MONGO_HOST` - Database hostname
   - `MONGO_PORT` - Database port
   - `MONGO_USER` - Database user
   - `MONGO_PASSWORD` - Database password
   - `MONGO_DATABASE` - Database name

2. **Private Networking:**
   - MongoDB will have a private URL like: `mongo.railway.internal`
   - Your backend can connect to it privately for better performance

### Step 3: Configure Your Backend Service

1. **Go to your Backend service** (yseeku-platform-backend)
2. **Click on the "Variables" tab**
3. **Verify these variables exist:**
   - ✅ `MONGODB_URL` (automatically added by Railway)
   - ✅ `JWT_SECRET` (you may need to add this)
   - ✅ `NODE_ENV` (set to `production`)

4. **Add Missing Variables (if needed):**
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this
   NODE_ENV=production
   ```

### Step 4: Trigger a New Deployment

After adding MongoDB, your backend should **automatically redeploy**. If not:

1. Go to your Backend service
2. Click **"Redeploy"** button
3. Wait for deployment to complete (2-3 minutes)

### Step 5: Verify the Connection

1. **Check the Backend Logs:**
   - Go to your Backend service
   - Click on the "Logs" tab
   - Look for: `"MongoDB connected"` message

2. **Test the Health Endpoint:**
   - Visit: `https://thriving-vitality-production.up.railway.app/health`
   - You should see: `{"status": "ok", "database": "connected"}`

3. **Test the API:**
   - Visit: `https://thriving-vitality-production.up.railway.app/api/v1/health`
   - Should return health status with database information

---

## 🎯 What This Fixes

After completing these steps, your backend will have:

✅ **Working MongoDB Connection**
✅ **Persistent Data Storage**
✅ **Authentication System Working** (JWT tokens stored in DB)
✅ **User Registration/Login Functional**
✅ **LLM Service Ready** (if properly configured)

---

## 🔧 Troubleshooting

### Issue: "MongoDB connection failed"

**Solution:**
1. Check that MongoDB service is "Ready" (not "Building")
2. Verify `MONGODB_URL` is set in Backend Variables
3. Check Backend logs for specific error messages
4. Try redeploying the Backend service

### Issue: "Cannot find module"

**Solution:**
1. This is a build error - check the Build logs
2. Make sure all dependencies are in `package.json`
3. Try a fresh deploy by clicking "Redeploy"

### Issue: "Health check fails"

**Solution:**
1. Your health check is configured to always return 200 now (from our earlier fix)
2. This should allow deployment even if DB is momentarily down
3. MongoDB will reconnect automatically

---

## 📋 Next Steps After MongoDB Setup

1. **Add Frontend Service** (if not already added)
2. **Configure Frontend Environment Variables:**
   - `NEXT_PUBLIC_API_URL=https://thriving-vitality-production.up.railway.app`
3. **Test Full Authentication Flow:**
   - Register a new user
   - Login with the user
   - Verify JWT token works
4. **Configure LLM Service** (add OpenAI API key if needed)
5. **Deploy Frontend** to Railway

---

## 🔄 Workflow for Future Deployments

Now that MongoDB is set up, any code changes will:

1. **Push to GitHub** → Automatic Railway deployment
2. **Backend** connects to MongoDB automatically
3. **Frontend** talks to Backend via API
4. **All data** persists across deployments

---

## 💡 Pro Tips

- **Use Railway's Private Networking:** Connect services via `.railway.internal` URLs for better performance
- **Monitor MongoDB Usage:** Check Railway dashboard for database size and connection count
- **Backups:** Railway automatically backs up MongoDB (on paid plans)
- **Scaling:** Upgrade MongoDB plan if you need more storage or connections

---

## 📞 Need Help?

If you encounter issues:

1. Check **Railway Logs** for error messages
2. Review **Build Logs** for compilation errors
3. Verify **Environment Variables** are set correctly
4. Check **GitHub Actions** (if CI is enabled)

---

## ✅ Checklist Before Starting

- [ ] Have Railway account access
- [ ] Have GitHub repository access
- [ ] Have `fix/railway-deployment-and-auth-improvements` branch merged to main (optional, but recommended)
- [ ] Ready to add MongoDB service

---

**You're ready to go!** Follow the steps above to get MongoDB running in Railway.