# 🚀 Deploy VPS Signup Fix - Quick Start Guide

## What This Fixes

After signup, users are redirected back to `/signup` instead of `/onboarding` because cookies have **hardcoded domains** that don't work properly with your VPS setup.

## ✅ What Was Changed

Modified `packages/auth/src/middleware/cookie.middleware.ts` to use environment variables for cookie domains instead of hardcoded values:

```typescript
// Before (hardcoded)
domain: '.realtutorialhub.com'

// After (environment-aware)
domain: process.env.COOKIE_DOMAIN_RTH || '.realtutorialhub.com'
```

## 🎯 Deployment Method: Docker-Based

Your setup uses:
- **Docker Compose** for containerization
- **Local code → Docker images** (not Git-based deployment)
- **VPS**: Hostinger at `72.61.115.49`
- **Deployment scripts**: `./infra/hostinger/scripts/`

## 📋 Step-by-Step Deployment

### Option 1: Automated PowerShell Script (RECOMMENDED)

```powershell
# From your Windows machine in the project root:

# 1. Run the deployment script
.\DEPLOY_VPS_SIGNUP_FIX.ps1

# Or dry-run first to see what it will do:
.\DEPLOY_VPS_SIGNUP_FIX.ps1 -DryRun
```

The script will:
1. ✅ Test SSH connection to VPS
2. ✅ Create backup on VPS
3. ✅ Copy updated code files to VPS
4. ✅ Verify environment variables
5. ✅ Rebuild Docker images with the fix
6. ✅ Deploy updated containers
7. ✅ Run health checks

### Option 2: Manual Deployment

If you prefer manual control:

```powershell
# 1. Load SSH key (if passphrase-protected)
.\infra\hostinger\remote-ssh\load-hostinger-key.ps1

# 2. Connect to VPS
ssh -i .\suia_rth root@72.61.115.49

# On VPS:
cd /opt/platform/apps/quiz-platform

# 3. Verify environment variables
nano /opt/platform/env/.env.production

# Ensure these are set:
COOKIE_DOMAIN_RTH=.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com
GATEWAY_URL=https://api.realtutorialhub.com
GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com
ALLOWED_ORIGINS=https://user.realtutorialhub.com,https://user.skillupitacademy.com,...

# 4. Copy the updated file from Windows to VPS
# (From Windows PowerShell)
scp -i .\suia_rth `
    .\packages\auth\src\middleware\cookie.middleware.ts `
    root@72.61.115.49:/opt/platform/apps/quiz-platform/packages/auth/src/middleware/

# 5. Rebuild and deploy (on VPS)
./infra/hostinger/scripts/deploy.sh

# This runs:
# - verify.sh (pre-flight checks)
# - build.sh (rebuild Docker images)
# - docker compose up -d --remove-orphans
# - health.sh (verify containers are healthy)
```

## 🧪 Testing After Deployment

### 1. Clear Browser Cache

**IMPORTANT**: Old cookies must be cleared!

```
Chrome/Edge:
- F12 → Application → Storage → Clear site data
- Or: Ctrl+Shift+Delete → Cookies and cached images

Firefox:
- F12 → Storage → Cookies → Delete all for your domain
```

### 2. Test Signup Flow

**RealTutorialHub:**
1. Visit: https://user.realtutorialhub.com/signup
2. Create test account
3. ✅ Should redirect to `/onboarding` (NOT back to `/signup`)
4. Complete onboarding
5. ✅ Should redirect to `/dashboard`

**SkillUp IT Academy:**
1. Visit: https://user.skillupitacademy.com/signup
2. Create test account
3. ✅ Should redirect to `/onboarding`
4. Complete onboarding
5. ✅ Should redirect to `/dashboard`

### 3. Verify Cookies in DevTools

Open DevTools (F12) → Application → Cookies

Check that these cookies exist with correct domains:

```
Name: accessToken
Value: eyJhbGc... (JWT token)
Domain: .realtutorialhub.com (or .skillupitacademy.com)
Path: /
Secure: ✓
HttpOnly: ✓
SameSite: None
```

If cookies are missing or have wrong domain, the fix isn't working.

## 🔍 Monitoring & Troubleshooting

### Check Container Logs

```bash
# SSH to VPS
ssh -i .\suia_rth root@72.61.115.49

# View all container logs
cd /opt/platform/apps/quiz-platform
docker compose -f ./infra/hostinger/compose/docker-compose.yml \
                -f ./infra/hostinger/compose/docker-compose.production.yml \
                logs -f

# View specific container
docker logs quiz-platform-realtutorialhub-web -f
docker logs quiz-platform-skillup-web -f
docker logs quiz-platform-nginx -f
```

### Check Health Status

```bash
# On VPS
cd /opt/platform/apps/quiz-platform
./infra/hostinger/scripts/health.sh
```

### Verify Environment Variables

```bash
# On VPS
grep COOKIE_DOMAIN /opt/platform/env/.env.production
```

Should show:
```
COOKIE_DOMAIN_RTH=.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com
```

## 🐛 Common Issues & Solutions

### Issue 1: Still Redirecting to Signup

**Cause**: Environment variables not set or containers using old image

**Solution**:
```bash
# On VPS
cd /opt/platform/apps/quiz-platform

# Verify env vars
cat /opt/platform/env/.env.production | grep COOKIE_DOMAIN

# Force rebuild without cache
docker compose -f ./infra/hostinger/compose/docker-compose.yml \
                -f ./infra/hostinger/compose/docker-compose.production.yml \
                build --no-cache

# Redeploy
./infra/hostinger/scripts/deploy.sh
```

### Issue 2: Cookies Not Visible in Browser

**Cause**: 
- Browser cache not cleared
- HTTPS/SSL certificate issues
- CORS/Domain mismatch

**Solution**:
1. Clear ALL browser data (not just cache)
2. Check certificate:
   ```bash
   curl -I https://user.realtutorialhub.com
   # Should show: HTTP/2 200
   ```
3. Check response headers for `Set-Cookie`:
   ```bash
   curl -v https://user.realtutorialhub.com/api/auth/signup \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"Test@123","name":"Test"}'
   # Should see: Set-Cookie: accessToken=...; Domain=.realtutorialhub.com
   ```

### Issue 3: Container Build Fails

**Cause**: Docker build context or dependency issues

**Solution**:
```bash
# Check Docker space
docker system df

# Clean up old images/containers
docker system prune -a

# Retry build
cd /opt/platform/apps/quiz-platform
./infra/hostinger/scripts/build.sh
```

## 🔄 Rollback Plan

If the fix causes issues:

```bash
# On VPS
cd /opt/platform/backups/

# Find latest backup
ls -lt | head

# Restore previous state
cd /opt/platform/backups/pre-signup-fix-YYYY-MM-DD_HH-mm-ss

# Restore environment file
cp .env.production.bak /opt/platform/env/.env.production

# Get previous git commit
PREV_COMMIT=$(cat git-commit.txt)
echo "Previous commit: $PREV_COMMIT"

# Note: Since you don't use git pull, you'll need to manually
# restore the previous cookie.middleware.ts file or
# revert the changes manually
```

## 📊 Deployment Checklist

- [ ] SSH access to VPS verified
- [ ] Code changes synced to VPS
- [ ] Environment variables verified (`COOKIE_DOMAIN_RTH`, `COOKIE_DOMAIN_SKILLUP`)
- [ ] Docker images rebuilt with updated code
- [ ] Containers deployed and healthy
- [ ] Health checks passing
- [ ] Browser cache cleared
- [ ] Signup flow tested for RTH
- [ ] Signup flow tested for SUIA
- [ ] Cookies verified in DevTools
- [ ] Production monitoring active

## 📞 Support & Documentation

- **Detailed Troubleshooting**: `VPS_SIGNUP_FIX.md`
- **Architecture Overview**: `VPS_DEPLOYMENT_SUMMARY.md`
- **Hostinger Setup**: `infra/hostinger/README.md`
- **Docker Compose**: `infra/hostinger/compose/README.md`
- **Deployment Scripts**: `infra/hostinger/scripts/README.md`

## 🎯 Expected Timeline

- **SSH Connection**: 10 seconds
- **Backup Creation**: 30 seconds
- **Code Sync**: 1 minute
- **Docker Image Rebuild**: 5-10 minutes
- **Container Deployment**: 2-3 minutes
- **Health Checks**: 1 minute

**Total**: ~15-20 minutes

## ✅ Success Criteria

✅ Users can complete signup without redirect loop  
✅ Users are redirected to `/onboarding` after signup  
✅ Users can complete onboarding flow  
✅ Users land on `/dashboard` after onboarding  
✅ Cookies are set with correct domain in browser  
✅ No errors in container logs  
✅ All health checks passing  

---

**Ready to deploy?**

```powershell
.\DEPLOY_VPS_SIGNUP_FIX.ps1
```

Good luck! 🚀
