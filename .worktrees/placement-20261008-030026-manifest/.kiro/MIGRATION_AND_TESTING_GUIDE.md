# Migration and Testing Guide

**Quick reference for applying migrations and testing the BFF + Onboarding implementation**

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### Step 1: Apply Database Migrations

**Important**: Run these commands from the project root directory.

#### For RTH Database:
```bash
cd packages/db-rth
npm run db:migrate
cd ../..
```

#### For SkillUp Database:
```bash
cd packages/db-skillup
npm run db:migrate
cd ../..
```

**Expected Output**: 
- Migration files will be applied
- New columns added to `users` table
- Existing users will have `is_onboarded = false` by default

---

### Step 2: Verify Environment Variables

Check your `.env.local` file has these variables:

```env
# Database URLs
DATABASE_DIRECT_URL_RTH=postgresql://...
DATABASE_URL_RTH=postgresql://...
DATABASE_DIRECT_URL_SKILLUP=postgresql://...
DATABASE_URL_SKILLUP=postgresql://...

# API Server URL (for BFF to call backend)
API_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# JWT Secrets (should already exist)
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

---

### Step 3: Restart All Services

```bash
# Stop all running dev servers (Ctrl+C)
# Then restart:
npm run dev
```

Or if using Turbo:
```bash
turbo dev
```

---

## 🧪 TESTING GUIDE

### Test 1: Login and Session State

#### RTH Login:
1. Navigate to RTH login page
2. Login with: `ajayshah@gmail.com / testing`
3. Open DevTools → Application → Cookies
4. Verify cookies exist:
   - `accessToken` (httpOnly, secure)
   - `refreshToken` (httpOnly, secure)

#### SkillUp Login:
1. Navigate to SkillUp login page
2. Login with: `student@skillupitacademy.com / testing`
3. Verify same cookie structure

**Expected**: Login works, cookies set, redirect to dashboard or onboarding

---

### Test 2: `/api/auth/me` Endpoint

#### Using Browser DevTools:
```javascript
// Open Console and run:
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "isVerified": true,
      "onboarded": false,  // ← Should be false for new users
      "role": "user",
      "isAdmin": false
    }
  }
}
```

---

### Test 3: Onboarding Submission

#### Using Browser DevTools:
```javascript
// Submit onboarding data:
fetch('/api/onboarding', {
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
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Onboarding completed successfully"
  }
}
```

---

### Test 4: Verify Onboarding Persisted

#### Check `/api/auth/me` again:
```javascript
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected**: `onboarded: true` (changed from false)

---

### Test 5: Session Persistence

1. Complete onboarding
2. Refresh the page (F5)
3. Verify:
   - Still logged in
   - Onboarding screen NOT shown
   - Dashboard loads correctly

---

### Test 6: Database Verification

#### Check RTH Database:
```sql
SELECT id, email, is_onboarded, primary_goal, domain 
FROM users 
WHERE email = 'ajayshah@gmail.com';
```

#### Check SkillUp Database:
```sql
SELECT id, email, is_onboarded, primary_goal, domain 
FROM users 
WHERE email = 'student@skillupitacademy.com';
```

**Expected**: 
- `is_onboarded = true` after completing onboarding
- Onboarding fields populated with submitted data

---

## 🐛 TROUBLESHOOTING

### Issue: Migration fails

**Solution**:
```bash
# Check database connection
cd packages/db-rth
npm run db:studio  # Opens Drizzle Studio

# If migration already applied, it will skip
# If error, check DATABASE_DIRECT_URL_RTH is correct
```

---

### Issue: `/api/auth/me` returns 401

**Possible Causes**:
1. Not logged in (no cookies)
2. Token expired
3. API_SERVER_URL not configured

**Solution**:
```bash
# Check cookies exist in DevTools
# Try logging in again
# Verify .env.local has API_SERVER_URL
```

---

### Issue: `/api/onboarding` returns 500

**Possible Causes**:
1. Migration not applied
2. Database connection issue
3. Invalid request body

**Solution**:
```bash
# Check migration applied:
cd packages/db-rth
npm run db:studio
# Verify 'users' table has 'is_onboarded' column

# Check API server logs for error details
```

---

### Issue: Onboarding shows again after refresh

**Possible Causes**:
1. Database not updated
2. Frontend caching issue
3. `/api/auth/me` not called

**Solution**:
```bash
# Check database:
# SELECT is_onboarded FROM users WHERE email = '...';

# Clear browser cache
# Hard refresh (Ctrl+Shift+R)

# Check Network tab for /api/auth/me call
```

---

## 📊 VERIFICATION CHECKLIST

Before marking as complete, verify:

- [ ] Migrations applied to both databases
- [ ] RTH login works
- [ ] SkillUp login works
- [ ] `/api/auth/me` returns user data
- [ ] `/api/onboarding` accepts and saves data
- [ ] `is_onboarded` updates in database
- [ ] Session persists after refresh
- [ ] Onboarding not shown after completion
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## 🎯 SUCCESS CRITERIA

✅ **Login Flow**: Users can log in to both brands  
✅ **Session State**: `/api/auth/me` returns correct user data  
✅ **Onboarding**: Users can submit onboarding preferences  
✅ **Persistence**: Onboarding state saved to DB  
✅ **Redirect**: Users redirected correctly after onboarding  
✅ **Reload**: Session and onboarding state persist after page refresh  

---

## 📞 NEXT STEPS AFTER TESTING

If all tests pass:
1. ✅ Mark implementation as complete
2. ✅ Merge to main branch (if applicable)
3. ✅ Deploy to staging/production
4. ✅ Monitor logs for any issues

If tests fail:
1. 🐛 Check troubleshooting section
2. 🐛 Review server logs
3. 🐛 Verify database state
4. 🐛 Report specific error messages

---

**Guide Version**: 1.0  
**Last Updated**: April 15, 2026  
**Status**: Ready for testing
