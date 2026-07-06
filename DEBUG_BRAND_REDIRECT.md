# 🔍 Brand Redirect Issue - Diagnosis

## Problem
After logging in at `https://user.skillupitacademy.com/login` with `anujoshi@gmail.com`, the user is redirected to:
```
https://user.realtutorialhub.com/login?redirect=%2Fonboarding
```

This is the **WRONG BRAND** - should stay on SUIA, not redirect to RTH.

## Test Results

### ✅ Login API Works Correctly
- User: `anujoshi@gmail.com`
- Platform: `skillup`
- Cookies set with domain: `.skillupitacademy.com` ✅
- Login response: Success ✅

### ✅ Cookie Forwarding Works
- Nginx forwards Cookie header ✅
- Container receives cookies with `hasToken:true` ✅
- Token verification succeeds ✅

### ❌ Wrong Brand Redirect
- After login, redirects to RTH instead of SUIA ❌
- URL: `https://user.realtutorialhub.com/login?redirect=%2Fonboarding`

## Possible Root Causes

### 1. User Account Brand Mismatch
**Hypothesis**: The user `anujoshi@gmail.com` might be registered in the database under the RTH brand, not SUIA brand.

**Why this matters**:
- Users table might have a `brand` or `platform` column
- When fetching user profile, it returns brand="realtutorialhub"
- System redirects to the user's "home" brand

**How to check**:
```sql
SELECT email, brand, platform FROM users WHERE email = 'anujoshi@gmail.com';
```

### 2. Session/Profile API Returns Wrong Brand
**Hypothesis**: The `/api/profile` endpoint is returning brand information that conflicts with where the user logged in.

**Flow**:
1. User logs in at `user.skillupitacademy.com` ✅
2. Cookies are set for `.skillupitacademy.com` ✅
3. Page tries to fetch profile
4. Profile API returns `brand: "realtutorialhub"` ❌
5. Client-side JS redirects to RTH brand URL

### 3. Middleware Brand Resolution Issue
**Hypothesis**: The middleware or auth validation is incorrectly resolving the brand from cookies or headers.

**Check**: `src/share-branding/middleware/authProxy.ts`
- Does it check cookie domain?
- Does it resolve brand from hostname?

### 4. Onboarding Page Brand Check
**Hypothesis**: The onboarding page checks the user's brand and redirects if it doesn't match.

**Check**: `apps/skillup-web/src/app/onboarding/page.tsx`
- Does it validate brand?
- Does it redirect to a different brand URL?

## What We Know

### From Login Test:
```json
{
  "email": "anujoshi@gmail.com",
  "id": "79d07429-fda1-4507-a9ba-af0e1b003e7f",
  "onboarded": false
}
```

### From Cookie Test:
```
✅ Cookies: accessToken, refreshToken, csrfToken, onboarding_state
✅ Domain: .skillupitacademy.com
✅ Container receives: hasToken:true
✅ Token verified: userId=a74f2bdb
```

## Next Steps to Debug

### 1. Check User's Brand in Database
```bash
# SSH to VPS
ssh hostinger-quiz-platform-root

# Check user in database (if you have DB access)
# Look for brand/platform field
```

### 2. Add Debug Logging to Onboarding Page
Check what brand resolution logic is happening in:
- `apps/skillup-web/src/app/onboarding/page.tsx`
- `src/share-branding/auth/serverAuthState.ts`

### 3. Check if User Profile API Returns Brand
Test:
```bash
curl -H "Cookie: accessToken=xxx" \
     https://user.skillupitacademy.com/api/profile
```

Look for a `brand` or `platform` field in the response.

### 4. Check Middleware Brand Resolution
Look at container logs when accessing `/onboarding`:
```bash
docker logs quiz-platform-skillup-web-1 --tail 50 -f
```

Look for any brand resolution logs.

## Most Likely Cause

**The user account is registered under RTH brand in the database, not SUIA brand.**

This would explain:
- Login works at SUIA (authentication succeeds)
- Cookies are set correctly for SUIA domain
- But then system redirects to RTH (user's "home" brand)

## Solution Depends on Cause

### If User Brand is Wrong:
Update user's brand in database:
```sql
UPDATE users 
SET brand = 'skillup' 
WHERE email = 'anujoshi@gmail.com';
```

### If It's a Code Issue:
Need to fix the brand resolution logic to respect where the user logged in, not just their account brand.

### If It's Multi-Brand Support:
Users might be able to access both brands with same account. In that case, system should remember which brand they logged into and not redirect them.

---

**Status**: Needs further investigation of user database record and profile API response.
