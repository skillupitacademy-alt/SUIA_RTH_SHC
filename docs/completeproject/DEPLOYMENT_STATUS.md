# Deployment Status - Onboarding Fix

## Current Status: 🟡 DEPLOYING

**Commit**: `26dce9d6` - "fix: use query API for all modes to avoid Drizzle table alias conflict"
**Started**: ~4 minutes ago
**Expected Completion**: ~6 minutes

## Root Cause Identified

The duplicate alias bug `from "users" "users"` was caused by:

1. Using `.select().from(this.tables.users)` where `this.tables.users` is a brand-specific table reference
2. Drizzle sees the table is named "users" and adds an alias "users", creating the duplicate

## Fix Applied

Changed `findById` and `findByEmail` to use `db.query.users.findFirst()` instead of `.select().from()`:

```typescript
// OLD (causes duplicate alias)
const results = await db.select().from(usersTable).where(...)

// NEW (no duplicate alias)
return await db.query.users.findFirst({ where: ... })
```

## Next Steps

1. ⏳ Wait for deployment to complete (~6 min)
2. ✅ Run `node test-multi-brand-onboarding.js`
3. ✅ Verify both RTH and SkillUp onboarding work
4. ✅ Confirm no `from "users" "users"` error

## Expected Result

- RTH Onboarding: ✅ 200
- SkillUp Onboarding: ✅ 200
- Both brands: ✅ WORKING
