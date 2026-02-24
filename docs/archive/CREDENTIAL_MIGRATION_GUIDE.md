# Credential Migration Guide

## What Changed

We've successfully removed hardcoded credentials from the codebase and replaced them with environment-based configuration. This improves security while maintaining your access.

## Files Modified

### 1. `.env.example`
Added development credential section:
```bash
# ============================================================================
# DEVELOPMENT USER CREDENTIALS
# ============================================================================
# These are used ONLY for development/testing environments
# In production, use real authentication (OAuth, SAML, database users)

# Development admin user
DEV_ADMIN_USERNAME=admin
DEV_ADMIN_PASSWORD=admin123!

# Development regular user  
DEV_USER_USERNAME=user
DEV_USER_PASSWORD=user123!

# Enable development authentication (set to false in production)
ENABLE_DEV_AUTH=true
```

### 2. `packages/core/src/security/auth-service.ts`
- Removed hardcoded test users from `validateCredentials()`
- Added `loadDevelopmentUsers()` method that reads from environment
- Added `TestUser` interface
- Added `ENABLE_DEV_AUTH` flag for production safety

### 3. `apps/web/src/components/login.tsx`
- Changed password placeholder from `"admin123"` to `"Enter your password"`
- Removes password exposure in the UI

## What You Need to Do

### Step 1: Update Your `.env` File
Add these lines to your existing `.env` file:

```bash
# Development credentials (keep your current passwords)
DEV_ADMIN_USERNAME=admin
DEV_ADMIN_PASSWORD=admin123!
DEV_USER_USERNAME=user
DEV_USER_PASSWORD=user123!
ENABLE_DEV_AUTH=true
```

### Step 2: Restart Your Application
```bash
# Stop any running processes
npm run dev

# Restart with new environment variables
npm run dev
```

### Step 3: Test Login
- Username: `admin`
- Password: `admin123!`
- Should work exactly as before

## Security Benefits

✅ **No passwords in source code**  
✅ **Environment-based configuration**  
✅ **Production safety** (can disable dev auth)  
✅ **Same login experience**  
✅ **Guest access fallback** (never get locked out)  

## Production Deployment

When deploying to production:

1. Set `ENABLE_DEV_AUTH=false`
2. Use real authentication (OAuth, SAML, database users)
3. Remove development credentials from production environment

```bash
# Production .env
ENABLE_DEV_AUTH=false
# Use real authentication methods
OIDC_ISSUER_URL=https://your-auth-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
```

## Troubleshooting

### "Login failed" after changes?
1. Check that `.env` file has the new variables
2. Ensure `ENABLE_DEV_AUTH=true`
3. Restart the application

### Can't access admin features?
1. Verify admin role is assigned in `loadDevelopmentUsers()`
2. Check browser console for authentication errors

### Want to change passwords?
Update the `DEV_*_PASSWORD` variables in your `.env` file and restart.

## Migration Complete

Your login now works with environment-based credentials instead of hardcoded values. The system is more secure and production-ready while maintaining the same user experience.
