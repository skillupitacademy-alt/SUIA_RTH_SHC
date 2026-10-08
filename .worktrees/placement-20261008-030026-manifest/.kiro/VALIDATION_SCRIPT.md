# 🧪 Validation Script

**Copy-paste these commands to validate the implementation**

---

## 📋 PRE-DEPLOYMENT VALIDATION

### 1. Check TypeScript Compilation

```bash
# Check all modified files compile
cd quiz-platform
npx tsc --noEmit apps/api-server/src/app/api/auth/me/route.ts
npx tsc --noEmit apps/api-server/src/app/api/onboarding/route.ts
npx tsc --noEmit apps/skillup-web/src/app/api/auth/me/route.ts
npx tsc --noEmit apps/realtutorialhub-web/src/app/api/auth/me/route.ts
```

**Expected**: No errors

---

### 2. Verify Migrations Generated

```bash
# Check RTH migration
ls -la packages/db-rth/migrations/0001_unusual_dexter_bennett.sql

# Check SkillUp migration
ls -la packages/db-skillup/migrations/0001_ambiguous_nighthawk.sql
```

**Expected**: Both files exist

---

### 3. Verify Schema Changes

```bash
# Check RTH schema
grep -n "is_onboarded" packages/db-rth/src/schema/users.ts

# Check SkillUp schema
grep -n "is_onboarded" packages/db-skillup/src/schema/users.ts
```

**Expected**: Both show the new field

---

## 🚀 DEPLOYMENT STEPS

### 1. Apply Migrations

```bash
# RTH Database
cd packages/db-rth
npm run db:migrate
cd ../..

# SkillUp Database
cd packages/db-skillup
npm run db:migrate
cd ../..
```

**Expected**: "Migration applied successfully"

---

### 2. Restart Services

```bash
# Stop all services (Ctrl+C)
# Then restart
npm run dev
```

**Expected**: All services start without errors

---

## 🧪 POST-DEPLOYMENT VALIDATION

### Test 1: Check Endpoints Exist

```bash
# Check if routes are accessible (after services start)
curl -I http://localhost:3000/api/auth/me
curl -I http://localhost:3001/api/auth/me
```

**Expected**: 401 (not 404) - means endpoint exists but needs auth

---

### Test 2: Login and Get Session (RTH)

**Browser Console**:
```javascript
// 1. Login
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'ajayshah@gmail.com',
    password: 'testing',
    platform: 'realtutorialhub'
  })
}).then(r => r.json()).then(console.log)

// 2. Check session
await fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected**:
- Login returns user with `onboarded: false`
- `/api/auth/me` returns same user

---

### Test 3: Submit Onboarding

**Browser Console**:
```javascript
await fetch('/api/onboarding', {
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
}).then(r => r.json()).then(console.log)
```

**Expected**: `{ success: true, message: "Onboarding completed successfully" }`

---

### Test 4: Verify Onboarding Persisted

**Browser Console**:
```javascript
await fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Onboarded:', d.data.user.onboarded))
```

**Expected**: `Onboarded: true`

---

### Test 5: Verify Database Updated

**Database Query (RTH)**:
```sql
SELECT 
  id, 
  email, 
  is_onboarded, 
  primary_goal, 
  domain, 
  sub_domain 
FROM users 
WHERE email = 'ajayshah@gmail.com';
```

**Expected**:
- `is_onboarded = true`
- `primary_goal = 'Learn programming'`
- `domain = 'Technology'`
- `sub_domain = 'Web Development'`

---

### Test 6: Session Persistence

**Steps**:
1. Complete onboarding
2. Refresh page (F5)
3. Check `/api/auth/me` again

**Browser Console**:
```javascript
await fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Still logged in, `onboarded: true`

---

### Test 7: Repeat for SkillUp

**Browser Console** (on SkillUp domain):
```javascript
// 1. Login
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'student@skillupitacademy.com',
    password: 'testing',
    platform: 'skillup'
  })
}).then(r => r.json()).then(console.log)

// 2. Check session
await fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

// 3. Submit onboarding
await fetch('/api/onboarding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    primaryGoal: 'Career advancement',
    domain: 'IT',
    subDomain: 'Cloud Computing',
    timeCommitment: '5-10 hours/week',
    journeyStatus: 'intermediate'
  })
}).then(r => r.json()).then(console.log)

// 4. Verify
await fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Onboarded:', d.data.user.onboarded))
```

**Expected**: Same behavior as RTH

---

## ✅ VALIDATION CHECKLIST

### Pre-Deployment:
- [ ] TypeScript compiles without errors
- [ ] Migrations generated
- [ ] Schema changes present

### Deployment:
- [ ] RTH migration applied
- [ ] SkillUp migration applied
- [ ] Services restarted

### Post-Deployment:
- [ ] Endpoints exist (not 404)
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

### Security:
- [ ] No tokens in response bodies
- [ ] Cookies are httpOnly
- [ ] Cookies are secure
- [ ] No 401 errors after login
- [ ] No CORS errors

### Architecture:
- [ ] No direct API calls from UI
- [ ] All calls go through BFF
- [ ] DB is single source of truth
- [ ] No duplicate state

---

## 🐛 TROUBLESHOOTING

### Issue: Migration fails

```bash
# Check database connection
cd packages/db-rth
npm run db:studio

# If already applied, will show in migrations table
# If error, check .env.local DATABASE_DIRECT_URL_RTH
```

---

### Issue: 401 on `/api/auth/me`

**Check**:
1. Are you logged in?
2. Do cookies exist in DevTools?
3. Is API_SERVER_URL correct in .env.local?

**Fix**:
```javascript
// Login again
await fetch('/api/auth/login', { /* ... */ })
```

---

### Issue: 500 on `/api/onboarding`

**Check**:
1. Migration applied?
2. Database has new columns?
3. Server logs for error?

**Fix**:
```bash
# Verify migration
cd packages/db-rth
npm run db:studio
# Check 'users' table has 'is_onboarded' column
```

---

### Issue: Onboarding shows again after refresh

**Check**:
1. Database updated?
2. `/api/auth/me` called on page load?
3. Frontend caching?

**Fix**:
```sql
-- Check database
SELECT is_onboarded FROM users WHERE email = '...';

-- Should be true
```

---

## 🎯 SUCCESS CRITERIA

All tests must pass:
- ✅ Login works (both brands)
- ✅ Session retrieval works
- ✅ Onboarding submission works
- ✅ Database updates correctly
- ✅ Session persists after refresh
- ✅ No security issues
- ✅ No architecture violations

---

## 📊 EXPECTED RESULTS SUMMARY

| Test | Expected Result |
|------|----------------|
| Login | 200, user returned |
| `/api/auth/me` | 200, user with `onboarded: false` |
| Submit onboarding | 200, success message |
| `/api/auth/me` again | 200, user with `onboarded: true` |
| Database query | `is_onboarded = true` |
| Page refresh | Still logged in |
| Repeat for SkillUp | Identical behavior |

---

**Validation Script Version**: 1.0  
**Last Updated**: April 15, 2026  
**Status**: Ready to execute
