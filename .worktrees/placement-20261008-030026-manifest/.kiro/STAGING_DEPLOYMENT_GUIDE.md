# 🧪 Staging Deployment & Validation Guide

**Purpose**: Safely test BFF + Onboarding implementation before production deployment

---

## 🎯 STAGING ENVIRONMENT REQUIREMENTS

### **1. Staging Databases**

Create separate staging databases:
```sql
-- Create staging databases (if not exist)
CREATE DATABASE rth_staging;
CREATE DATABASE skillup_staging;
```

### **2. Environment Variables**

Create `.env.staging`:
```env
NODE_ENV=staging

# Staging Database URLs
DATABASE_URL_RTH=postgresql://...rth_staging?...
DATABASE_DIRECT_URL_RTH=postgresql://...rth_staging?...
DATABASE_URL_SKILLUP=postgresql://...skillup_staging?...
DATABASE_DIRECT_URL_SKILLUP=postgresql://...skillup_staging?...

# Staging API URLs
NEXT_PUBLIC_API_URL=https://api-staging.realtutorialhub.com/api
INTERNAL_API_URL=https://api-staging.realtutorialhub.com/api

# Staging Cookie Domains
COOKIE_DOMAIN_RTH=.staging.realtutorialhub.com
COOKIE_DOMAIN_SKILLUP=.staging.skillupitacademy.com

# Copy all other secrets from .env.local
JWT_SECRET=...
JWT_REFRESH_SECRET=...
# etc.
```

---

## 📋 DEPLOYMENT STEPS

### **Step 1: Setup Staging Databases**

```bash
# 1. Copy production schema to staging (structure only, no data)
pg_dump --schema-only $DATABASE_URL_RTH > rth_schema.sql
psql $DATABASE_URL_RTH_STAGING < rth_schema.sql

pg_dump --schema-only $DATABASE_URL_SKILLUP > skillup_schema.sql
psql $DATABASE_URL_SKILLUP_STAGING < skillup_schema.sql

# 2. Create test users
psql $DATABASE_URL_RTH_STAGING << EOF
INSERT INTO users (email, password_hash, email_verified)
VALUES ('test@realtutorialhub.com', '<hashed_password>', true);
EOF

psql $DATABASE_URL_SKILLUP_STAGING << EOF
INSERT INTO users (email, password_hash, email_verified)
VALUES ('test@skillupitacademy.com', '<hashed_password>', true);
EOF
```

### **Step 2: Apply Migrations to Staging**

```bash
# RTH Staging
cd packages/db-rth
DATABASE_DIRECT_URL=$DATABASE_URL_RTH_STAGING npm run db:migrate

# SkillUp Staging
cd packages/db-skillup
DATABASE_DIRECT_URL=$DATABASE_URL_SKILLUP_STAGING npm run db:migrate
```

**Verify**:
```sql
-- Check columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('is_onboarded', 'primary_goal', 'domain');
```

### **Step 3: Deploy Code to Staging**

```bash
# Build with staging config
NODE_ENV=staging npm run build

# Deploy to staging environment
# (depends on your deployment platform)
```

---

## 🧪 RUNTIME VALIDATION CHECKLIST

### **Test 1: Service Health**

```bash
# Check services are running
curl https://api-staging.realtutorialhub.com/health
curl https://user-staging.realtutorialhub.com/health
curl https://user-staging.skillupitacademy.com/health
```

**Expected**: All return 200 OK

---

### **Test 2: Login Flow (RTH)**

**Browser Console** (on `user-staging.realtutorialhub.com`):
```javascript
// 1. Login
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@realtutorialhub.com',
    password: 'your_test_password',
    platform: 'realtutorialhub'
  })
});

const loginData = await loginRes.json();
console.log('Login Response:', loginData);

// ✅ Expected: 200, user object with onboarded: false
```

**Verify in DevTools**:
- Application → Cookies
- Check `accessToken` exists
- Check `refreshToken` exists
- Verify `httpOnly` flag is true
- Verify `secure` flag is true
- Verify `domain` is `.staging.realtutorialhub.com`

---

### **Test 3: Session Retrieval**

**Browser Console**:
```javascript
const meRes = await fetch('/api/auth/me', {
  credentials: 'include'
});

const meData = await meRes.json();
console.log('Session Data:', meData);

// ✅ Expected:
// {
//   "success": true,
//   "data": {
//     "user": {
//       "id": "...",
//       "email": "test@realtutorialhub.com",
//       "onboarded": false,
//       "role": "user"
//     }
//   }
// }
```

**Verify**:
- ✅ Returns 200
- ✅ User object present
- ✅ `onboarded: false` for new user
- ✅ No tokens in response body

---

### **Test 4: Onboarding Submission**

**Browser Console**:
```javascript
const onboardingRes = await fetch('/api/onboarding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    primaryGoal: 'Learn programming',
    domain: 'Technology',
    subDomain: 'Web Development',
    timeCommitment: '10-15 hours/week',
    journeyStatus: 'beginner'
  })
});

const onboardingData = await onboardingRes.json();
console.log('Onboarding Response:', onboardingData);

// ✅ Expected:
// {
//   "success": true,
//   "data": {
//     "success": true,
//     "message": "Onboarding completed successfully"
//   }
// }
```

---

### **Test 5: Database Verification**

```sql
-- Check RTH staging database
SELECT 
  id,
  email,
  is_onboarded,
  primary_goal,
  domain,
  sub_domain,
  time_commitment,
  journey_status
FROM users
WHERE email = 'test@realtutorialhub.com';

-- ✅ Expected:
-- is_onboarded = true
-- primary_goal = 'Learn programming'
-- domain = 'Technology'
-- sub_domain = 'Web Development'
-- time_commitment = '10-15 hours/week'
-- journey_status = 'beginner'
```

---

### **Test 6: Session Persistence**

**Browser**:
1. Complete onboarding (Test 4)
2. Refresh page (F5)
3. Check session again

**Browser Console**:
```javascript
const meRes = await fetch('/api/auth/me', {
  credentials: 'include'
});

const meData = await meRes.json();
console.log('After Refresh:', meData.data.user.onboarded);

// ✅ Expected: true (not false)
```

---

### **Test 7: Logout**

**Browser Console**:
```javascript
const logoutRes = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

console.log('Logout:', await logoutRes.json());

// Check session is cleared
const meRes = await fetch('/api/auth/me', {
  credentials: 'include'
});

console.log('After Logout:', meRes.status);

// ✅ Expected: 401 Unauthorized
```

---

### **Test 8: Repeat for SkillUp**

**Browser** (on `user-staging.skillupitacademy.com`):

Run Tests 2-7 with:
- Email: `test@skillupitacademy.com`
- Platform: `skillup`

**Verify**:
- ✅ Identical behavior to RTH
- ✅ Separate cookies (different domain)
- ✅ Separate database records
- ✅ No cross-brand leakage

---

### **Test 9: Failure Cases**

#### **9.1: No Cookie**
```javascript
// Clear cookies first
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Try to access protected endpoint
const res = await fetch('/api/auth/me', {
  credentials: 'include'
});

console.log('No Cookie:', res.status);
// ✅ Expected: 401
```

#### **9.2: Invalid Onboarding Payload**
```javascript
const res = await fetch('/api/onboarding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    invalid: 'data'
  })
});

console.log('Invalid Payload:', await res.json());
// ✅ Expected: 400 or validation error
```

#### **9.3: Expired Token**
```javascript
// Wait for token to expire (15 minutes)
// Or manually set expired token in cookie

const res = await fetch('/api/auth/me', {
  credentials: 'include'
});

console.log('Expired Token:', res.status);
// ✅ Expected: 401
```

---

### **Test 10: Network Layer Validation**

**Browser DevTools → Network Tab**:

1. Login
2. Check `/api/auth/login` request:
   - ✅ Method: POST
   - ✅ Status: 200
   - ✅ Response has `Set-Cookie` headers
   - ✅ Cookies are httpOnly, secure

3. Check `/api/auth/me` request:
   - ✅ Method: GET
   - ✅ Status: 200
   - ✅ Request has `Cookie` header
   - ✅ Response has user data

4. Check `/api/onboarding` request:
   - ✅ Method: POST
   - ✅ Status: 200
   - ✅ Request has `Cookie` header
   - ✅ Response has success message

---

### **Test 11: Gateway Flow Validation**

**Check Request Path**:
```
Browser
  ↓ (fetch('/api/auth/me'))
BFF (user-staging.realtutorialhub.com/api/auth/me)
  ↓ (fetch('https://api-staging.realtutorialhub.com/api/auth/me'))
API Server
  ↓ (database query)
Database
```

**Verify in Logs**:
- BFF logs show request received
- API server logs show request from BFF
- Database logs show query executed

---

## ✅ VALIDATION CHECKLIST

### **Pre-Deployment**:
- [ ] Staging databases created
- [ ] Migrations applied to staging
- [ ] Test users created
- [ ] Environment variables configured

### **Deployment**:
- [ ] Code deployed to staging
- [ ] Services running
- [ ] Health checks passing

### **Functional Testing**:
- [ ] RTH login works
- [ ] RTH `/api/auth/me` works
- [ ] RTH onboarding saves
- [ ] RTH database updated
- [ ] RTH session persists
- [ ] SkillUp login works
- [ ] SkillUp `/api/auth/me` works
- [ ] SkillUp onboarding saves
- [ ] SkillUp database updated
- [ ] SkillUp session persists

### **Security Testing**:
- [ ] Cookies are httpOnly
- [ ] Cookies are secure
- [ ] Correct cookie domains
- [ ] No tokens in response bodies
- [ ] No tokens in localStorage
- [ ] 401 without authentication

### **Edge Cases**:
- [ ] No cookie → 401
- [ ] Expired token → 401
- [ ] Invalid payload → error
- [ ] Logout clears session

### **Multi-Brand**:
- [ ] RTH and SkillUp identical behavior
- [ ] No cross-brand leakage
- [ ] Independent sessions

### **Performance**:
- [ ] Response times < 200ms
- [ ] No memory leaks
- [ ] No database connection issues

---

## 📊 VALIDATION REPORT TEMPLATE

```markdown
# Staging Validation Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: Staging

## Test Results

### RTH Tests:
- [ ] Login: PASS/FAIL
- [ ] Session: PASS/FAIL
- [ ] Onboarding: PASS/FAIL
- [ ] Persistence: PASS/FAIL
- [ ] Logout: PASS/FAIL

### SkillUp Tests:
- [ ] Login: PASS/FAIL
- [ ] Session: PASS/FAIL
- [ ] Onboarding: PASS/FAIL
- [ ] Persistence: PASS/FAIL
- [ ] Logout: PASS/FAIL

### Security Tests:
- [ ] Cookies: PASS/FAIL
- [ ] Auth: PASS/FAIL
- [ ] Tokens: PASS/FAIL

### Edge Cases:
- [ ] No cookie: PASS/FAIL
- [ ] Expired token: PASS/FAIL
- [ ] Invalid payload: PASS/FAIL

## Issues Found:
[List any issues]

## Recommendation:
[ ] APPROVE for production
[ ] REJECT - needs fixes
```

---

## 🚀 PRODUCTION DEPLOYMENT (AFTER STAGING PASSES)

### **Only proceed if ALL staging tests pass**

1. **Create Production Backup**
   ```bash
   pg_dump $DATABASE_URL_RTH > rth_backup_$(date +%Y%m%d).sql
   pg_dump $DATABASE_URL_SKILLUP > skillup_backup_$(date +%Y%m%d).sql
   ```

2. **Schedule Maintenance Window**
   - Choose low-traffic period
   - Notify users if needed

3. **Apply Migrations**
   ```bash
   cd packages/db-rth && npm run db:migrate
   cd packages/db-skillup && npm run db:migrate
   ```

4. **Deploy Code**
   ```bash
   # Deploy to production
   npm run deploy:production
   ```

5. **Smoke Test**
   - Run Tests 2-8 on production
   - Monitor logs for errors
   - Check error rates

6. **Monitor**
   - Watch for 24 hours
   - Check user reports
   - Monitor database performance

---

## 🔄 ROLLBACK PLAN

### **If Issues Arise**:

1. **Revert Code**
   ```bash
   git revert <commit>
   npm run deploy:production
   ```

2. **Rollback Migrations** (if needed)
   ```sql
   -- RTH
   ALTER TABLE users DROP COLUMN is_onboarded;
   ALTER TABLE users DROP COLUMN primary_goal;
   ALTER TABLE users DROP COLUMN domain;
   ALTER TABLE users DROP COLUMN sub_domain;
   ALTER TABLE users DROP COLUMN time_commitment;
   ALTER TABLE users DROP COLUMN journey_status;
   
   -- Repeat for SkillUp
   ```

3. **Restore Backup** (last resort)
   ```bash
   psql $DATABASE_URL_RTH < rth_backup_YYYYMMDD.sql
   psql $DATABASE_URL_SKILLUP < skillup_backup_YYYYMMDD.sql
   ```

---

**Guide Version**: 1.0  
**Last Updated**: April 15, 2026  
**Status**: Ready for staging deployment
