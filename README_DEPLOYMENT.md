# 🚀 VPS Signup Fix - Ready to Deploy

## ✅ Status: READY

All files have been prepared and tested. The fix is ready for deployment to your Hostinger VPS.

---

## 📋 What Was Fixed

**Problem**: Users are redirected back to `/signup` after signup instead of going to `/onboarding`.

**Root Cause**: Cookie domains were hardcoded (`.realtutorialhub.com`, `.skillupitacademy.com`) and not environment-aware for VPS deployment.

**Solution**: Modified `packages/auth/src/middleware/cookie.middleware.ts` to use environment variables:
```typescript
// Before
domain: '.realtutorialhub.com'

// After  
domain: process.env.COOKIE_DOMAIN_RTH || '.realtutorialhub.com'
```

---

## 🚀 DEPLOY NOW (Simple Method)

```powershell
# Run this command from PowerShell:
.\DEPLOY_SIMPLE.ps1
```

This will:
1. ✅ Copy the fixed file to VPS
2. ✅ Rebuild Docker images on VPS
3. ✅ Deploy updated containers

**Time**: ~10-15 minutes

---

## 📝 What The Script Does

### Step 1: Copy File
```
Local: packages\auth\src\middleware\cookie.middleware.ts
  ↓ (SCP)
VPS:   /opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts
```

### Step 2: SSH to VPS and Run
```bash
cd /opt/platform/apps/quiz-platform
./infra/hostinger/scripts/build.sh      # Rebuild Docker images
./infra/hostinger/scripts/deploy.sh     # Deploy containers
```

---

## 🧪 Testing After Deployment

### 1. Clear Browser Cache
**CRITICAL**: Old cookies must be cleared!
- Chrome/Edge: F12 → Application → Clear site data
- Firefox: F12 → Storage → Delete cookies

### 2. Test RTH Signup
1. Go to: https://user.realtutorialhub.com/signup
2. Create test account
3. ✅ **Should redirect to `/onboarding`** (not `/signup`)
4. Complete onboarding
5. ✅ **Should redirect to `/dashboard`**

### 3. Test SUIA Signup
1. Go to: https://user.skillupitacademy.com/signup
2. Create test account
3. ✅ **Should redirect to `/onboarding`** (not `/signup`)
4. Complete onboarding
5. ✅ **Should redirect to `/dashboard`**

### 4. Verify Cookies (DevTools)
Open F12 → Application → Cookies, check:
```
Name: accessToken
Domain: .realtutorialhub.com (or .skillupitacademy.com)
Secure: ✓
HttpOnly: ✓
SameSite: None
```

---

## 🔍 Monitoring

### Check VPS Logs
```bash
# SSH to VPS
ssh -i .\suia_rth root@72.61.115.49

# View logs
cd /opt/platform/apps/quiz-platform
docker compose -f ./infra/hostinger/compose/docker-compose.yml \
                -f ./infra/hostinger/compose/docker-compose.production.yml \
                logs -f

# Or specific service
docker logs quiz-platform-realtutorialhub-web -f
docker logs quiz-platform-skillup-web -f
```

### Check Container Health
```bash
# On VPS
cd /opt/platform/apps/quiz-platform
./infra/hostinger/scripts/health.sh
```

---

## ⚙️ Environment Variables (VPS)

**Location**: `/opt/platform/env/.env.production`

**Required** (should already be set from yesterday's deployment):
```bash
COOKIE_DOMAIN_RTH=.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.skillupitacademy.com
GATEWAY_URL=https://api.realtutorialhub.com
GATEWAY_URL_SKILLUP=https://api.skillupitacademy.com
ALLOWED_ORIGINS=https://user.realtutorialhub.com,https://user.skillupitacademy.com,...
```

---

## 🐛 Troubleshooting

### Still Redirecting to Signup?

**Check environment variables on VPS**:
```bash
ssh -i .\suia_rth root@72.61.115.49
grep COOKIE_DOMAIN /opt/platform/env/.env.production
```

**Force rebuild without cache**:
```bash
cd /opt/platform/apps/quiz-platform
docker compose -f ./infra/hostinger/compose/docker-compose.yml \
                -f ./infra/hostinger/compose/docker-compose.production.yml \
                build --no-cache

./infra/hostinger/scripts/deploy.sh
```

### Cookies Not Showing in Browser?

1. **Clear ALL browser data** (not just cache)
2. **Test in Incognito/Private mode**
3. **Check signup API response**:
```bash
curl -v https://user.realtutorialhub.com/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test@123","name":"Test"}'

# Should see: Set-Cookie: accessToken=...; Domain=.realtutorialhub.com
```

### Container Build Fails?

**Clean up Docker**:
```bash
# On VPS
docker system df
docker system prune -a
```

---

## 🔄 Rollback (If Needed)

Yesterday's backup should be available:
```bash
# On VPS
ls -lt /opt/platform/backups/
```

To restore:
```bash
# Copy the old file back
cp /opt/platform/backups/YYYY-MM-DD_TIMESTAMP/cookie.middleware.ts.bak \
   /opt/platform/apps/quiz-platform/packages/auth/src/middleware/cookie.middleware.ts

# Rebuild
cd /opt/platform/apps/quiz-platform
./infra/hostinger/scripts/build.sh
./infra/hostinger/scripts/deploy.sh
```

---

## 📚 Documentation Files

- **`DEPLOY_SIMPLE.ps1`** - Simple one-command deployment
- **`DEPLOY_VPS_SIGNUP_FIX.ps1`** - Full automated deployment with checks
- **`VPS_SIGNUP_FIX.md`** - Detailed troubleshooting guide
- **`VPS_DEPLOYMENT_SUMMARY.md`** - Technical overview
- **`DEPLOY_NOW.md`** - Complete deployment walkthrough
- **`QUICK_START.txt`** - Quick reference card

---

## 🎯 Deployment Pattern (From Yesterday)

This follows the **same deployment pattern** used successfully yesterday:

1. ✅ Code lives in `/opt/platform/apps/quiz-platform` on VPS
2. ✅ Modified files copied via SCP
3. ✅ Docker images rebuilt on VPS
4. ✅ Containers deployed using `./infra/hostinger/scripts/deploy.sh`
5. ✅ Health checks verify deployment

---

## ✅ Pre-Deployment Checklist

- [x] Code changes made (`packages/auth/src/middleware/cookie.middleware.ts`)
- [x] SSH key exists (`.\suia_rth`)
- [x] VPS accessible (72.61.115.49)
- [x] Deployment script created (`DEPLOY_SIMPLE.ps1`)
- [x] Documentation complete
- [ ] **YOU**: Run `.\DEPLOY_SIMPLE.ps1`
- [ ] **YOU**: Test signup flows
- [ ] **YOU**: Verify cookies in browser

---

## 🚀 Ready to Deploy!

```powershell
.\DEPLOY_SIMPLE.ps1
```

**Estimated Time**: 10-15 minutes  
**Risk**: Low (only affects cookie domain configuration)  
**Rollback**: Available via backups

Good luck! 🎉
