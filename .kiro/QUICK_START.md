# 🚀 Quick Start: BFF + Onboarding

**TL;DR**: Run migrations, restart services, test endpoints.

---

## ⚡ 3-Step Deployment

### 1️⃣ Apply Migrations
```bash
cd packages/db-rth && npm run db:migrate && cd ../..
cd packages/db-skillup && npm run db:migrate && cd ../..
```

### 2️⃣ Restart Services
```bash
npm run dev
```

### 3️⃣ Test
```bash
# Login to RTH: ajayshah@gmail.com / testing
# Login to SkillUp: student@skillupitacademy.com / testing
# Check /api/auth/me returns user data
# Submit onboarding form
# Verify redirect to dashboard
```

---

## 🧪 Quick Test (Browser Console)

```javascript
// 1. Check session
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

// 2. Submit onboarding
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
}).then(r => r.json()).then(console.log)

// 3. Verify onboarded
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Onboarded:', d.data.user.onboarded))
```

---

## ✅ Success Checklist

- [ ] Migrations applied (no errors)
- [ ] Services restarted
- [ ] Login works (both brands)
- [ ] `/api/auth/me` returns user
- [ ] `/api/onboarding` saves data
- [ ] Refresh keeps session
- [ ] Onboarding not shown again

---

## 🐛 Quick Troubleshooting

**Migration fails?**
```bash
# Check DB connection
cd packages/db-rth
npm run db:studio
```

**401 errors?**
- Login again
- Check cookies in DevTools
- Verify API_SERVER_URL in .env.local

**500 errors?**
- Check server logs
- Verify migration applied
- Check database has new columns

---

## 📚 Full Documentation

- `IMPLEMENTATION_COMPLETE_SUMMARY.md` - Overview
- `BFF_ONBOARDING_IMPLEMENTATION_STATUS.md` - Details
- `MIGRATION_AND_TESTING_GUIDE.md` - Step-by-step

---

## 🎯 What Was Built

✅ `/api/auth/me` - Get user session  
✅ `/api/onboarding` - Save preferences  
✅ DB fields - Store onboarding data  
✅ Migrations - Update schema  
✅ Repository methods - DB operations  

**Pattern**: UI → BFF → API → DB  
**Security**: httpOnly cookies, JWT verification  
**Source of Truth**: Database only  

---

**Status**: ✅ Ready for testing  
**Time to Deploy**: ~5 minutes  
**Breaking Changes**: None
