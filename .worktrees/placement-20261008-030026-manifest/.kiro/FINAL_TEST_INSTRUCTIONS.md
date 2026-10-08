# ✅ Final Testing Instructions

## 🎯 Issue Fixed

The user `anujoshi@gmail.com` now has the **"user"** role assigned in the database.

### What Was Wrong
- User had **empty roles array** `[]` in JWT token
- Authentication middleware requires at least one of: `'user'`, `'student'`, or admin roles
- Without a role, user was redirected back to login

### What Was Fixed
- ✅ Assigned **"user"** role to anujoshi@gmail.com in SkillUp database
- ✅ Multi-environment structure deployed (brand-specific URLs working)
- ✅ Cookies set with correct domain (`.skillupitacademy.com`)

---

## 🧪 Manual Browser Test Required

Please test the complete login flow in your browser:

### Step 1: Clear Browser Cache
**CRITICAL**: Old JWT tokens may be cached

**Option A: Use Incognito/Private Mode**
- Chrome/Edge: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`

**Option B: Clear Cookies**
1. Press `F12` (Open DevTools)
2. Go to `Application` tab
3. Expand `Cookies` → Clear cookies for:
   - `https://user.skillupitacademy.com`

### Step 2: Test SUIA Login
1. **Navigate to**: `https://user.skillupitacademy.com/login`
2. **Login with**:
   - Email: `anujoshi@gmail.com`
   - Password: `testing`
3. **Click**: "Login" button

### Expected Results ✅
After clicking login, you should:
1. ✅ Be redirected to: `https://user.skillupitacademy.com/onboarding`
2. ✅ **NOT** be redirected back to login page
3. ✅ **NOT** see RTH domain (`realtutorialhub.com`) anywhere
4. ✅ See the onboarding form

### After Completing Onboarding
After filling out and submitting the onboarding form:
1. ✅ Be redirected to: `https://user.skillupitacademy.com/dashboard`
2. ✅ See the user dashboard

---

## 🔍 Verification Steps

### Check 1: Cookie Domain
In DevTools → Application → Cookies:
- ✅ `accessToken` cookie should have domain: `.skillupitacademy.com`
- ✅ `refreshToken` cookie should have domain: `.skillupitacademy.com`
- ✅ `onboarding_state` cookie should be: `pending` (before onboarding) or `completed` (after)

### Check 2: URL After Login
- ✅ Should show: `https://user.skillupitacademy.com/onboarding`
- ❌ Should NOT show: `https://user.skillupitacademy.com/login?redirect=%2Fonboarding`
- ❌ Should NOT show: `https://user.realtutorialhub.com` (wrong brand)

### Check 3: Network Tab (Optional)
Open DevTools → Network tab and watch the login request:
1. POST to `/api/auth/login` should return `200 OK`
2. Response should set cookies
3. Browser should redirect to `/onboarding`

---

## 📊 What's Been Deployed

### 1. Multi-Environment Structure ✅
```
/opt/platform/env/
├── shared/.env                    # Infrastructure (all services)
├── brands/
│   ├── realtutorialhub.env       # RTH URLs & cookie domain
│   └── skillup.env                # SUIA URLs & cookie domain
└── services/
    ├── skillup-web.env            # SUIA web service config
    ├── realtutorialhub-web.env   # RTH web service config
    └── ... (all other services)
```

### 2. Containers Deployed ✅
All containers running with brand-specific environment:
- ✅ `skillup-web` sees SUIA URLs
- ✅ `realtutorialhub-web` sees RTH URLs
- ✅ No cross-brand URL leaking

### 3. User Role Assigned ✅
```sql
User: anujoshi@gmail.com
Role: user
Status: Assigned and verified
```

---

## 🐛 If Still Having Issues

### Issue: Still redirected to login
**Possible Cause**: Old JWT token cached in browser

**Solution**:
1. Clear ALL cookies for `.skillupitacademy.com`
2. Use incognito mode
3. Try again

### Issue: Redirected to RTH domain
**Possible Cause**: Wrong site URL

**Solution**:
1. Make sure you're visiting: `https://user.skillupitacademy.com/login`
2. NOT: `https://user.realtutorialhub.com/login`

### Issue: 502 Bad Gateway
**Possible Cause**: Nginx or containers not running

**Solution**:
```bash
ssh hostinger-quiz-platform-root
docker ps | grep quiz-platform
docker restart quiz-platform-nginx-1
```

### Issue: Empty roles array in JWT
**Possible Cause**: Old token still in use

**Solution**:
1. Clear cookies completely
2. Login fresh to get new JWT with updated roles

---

## 📝 Check Container Logs

If you want to see what's happening on the server:

```bash
ssh hostinger-quiz-platform-root

# Check SUIA web container logs
docker logs -f quiz-platform-skillup-web-1

# Look for these patterns:
# ✅ [BFF_AUTH_DEBUG] Token verified successfully {"userId":"...","roles":["user"]}
# ❌ [BFF_AUTH_DEBUG] Token verified successfully {"userId":"...","roles":[]}
```

The logs should show `"roles":["user"]` with the role included.

---

## ✅ Success Criteria

The issue is **FIXED** when:
1. ✅ User can login with `anujoshi@gmail.com` / `testing`
2. ✅ After login, redirected to `https://user.skillupitacademy.com/onboarding`
3. ✅ After onboarding, redirected to `https://user.skillupitacademy.com/dashboard`
4. ✅ No redirect to RTH domain anywhere in the flow
5. ✅ Cookies have correct domain (`.skillupitacademy.com`)

---

## 📞 Report Results

After testing, please confirm:

**✅ SUCCESS**: "Login works! Redirected to onboarding, then dashboard. No RTH URLs."

**❌ STILL FAILING**: "Still redirected to login page with ?redirect=%2Fonboarding"
- If still failing, share:
  - Browser used (Chrome/Firefox/Edge)
  - What URL you visited
  - Where it redirected you
  - Screenshot if possible

---

**Status**: ✅ Role assigned. Multi-env deployed. Ready for browser testing.

**Next**: Clear browser cache and test login at `https://user.skillupitacademy.com/login`
