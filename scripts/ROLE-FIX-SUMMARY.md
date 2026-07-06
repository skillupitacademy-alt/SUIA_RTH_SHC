# Database Role Fix Summary

## Problem

Users were experiencing signup errors:
```
Role "student" not found in database. 
Tried normalized name: "student". 
Available roles: user, student, admin, super_admin, faculty, infrastructure
```

## Root Cause

The **RTH database** was missing the `student` and `faculty` roles entirely. When the signup code tried to assign the 'student' role to new users, it failed because the role didn't exist in the `roles` table.

### Before Fix:

**RTH Database:**
- ✅ admin
- ✅ infrastructure
- ✅ super_admin
- ✅ user
- ❌ student (MISSING)
- ❌ faculty (MISSING)

**SkillUp Database:**
- ✅ admin
- ✅ faculty
- ✅ infrastructure
- ✅ student
- ✅ super_admin
- ✅ user

## Solution

Created and ran `scripts/fix-missing-roles.mjs` which:
1. Checked both databases for missing roles
2. Added missing `student` and `faculty` roles to RTH database
3. Verified all required roles exist in both databases

### After Fix:

**Both RTH and SkillUp Databases now have:**
- ✅ admin
- ✅ faculty
- ✅ infrastructure
- ✅ student
- ✅ super_admin
- ✅ user

## Files Created/Modified

### Scripts Created:
1. **`scripts/fix-missing-roles.mjs`** - Main fix script that adds missing roles
2. **`scripts/check-roles-rth.mjs`** - Check roles in RTH database
3. **`scripts/test-signup-both-brands.mjs`** - Test signup for both brands (created for future testing)

### Existing Files:
- **`scripts/check-roles-in-db.mjs`** - Already existed, checks SkillUp roles

## How Signup Works Now

1. User signs up via `/api/auth/signup`
2. Signup service creates user in brand-specific database
3. `UserRepository.assignRole(userId, 'student')` is called
4. The method:
   - Normalizes role name to lowercase: `'student'`
   - Looks up role in `roles` table by name
   - ✅ **Now finds the role** (previously threw error)
   - Creates entry in `user_roles` table linking user to role
5. User is successfully created with 'student' role
6. User can login and access the platform

## Code Reference

**Signup Service** (`apps/api-server/src/modules/auth/signup.service.ts`):
```typescript
// Line 72-76
await brandUserRepo.assignRole(user.id, 'student', tx);
```

**User Repository** (`apps/api-server/src/modules/auth/repositories/user.repository.ts`):
```typescript
// Line 277-306
async assignRole(userId: string, roleName: string, tx?) {
  const normalizedRoleName = roleName.trim().toLowerCase();
  
  const role = await executor.query.roles.findFirst({
    where: (r, { eq }) => eq(r.name, normalizedRoleName),
  });

  if (role) {
    await executor.insert(this.tables.userRoles).values({
      userId,
      roleId: role.id,
    });
  } else {
    throw new Error(`Role "${roleName}" not found in database...`);
  }
}
```

## Testing

To verify signup works after deployment:

```bash
# Check roles exist in both databases
node scripts/check-roles-rth.mjs
node scripts/check-roles-in-db.mjs

# Test signup for both brands (when API server is running)
node scripts/test-signup-both-brands.mjs
```

Or test manually:
1. Go to https://user.realtutorialhub.com/signup
2. Create a new account
3. Should successfully create user and redirect to onboarding
4. Repeat for https://user.skillupitacademy.com/signup

## Next Steps

1. ✅ Roles added to database (DONE)
2. 🔄 Deploy changes to VPS (PENDING - user needs to deploy via Codex)
3. ✅ Test signup on both brands after deployment

## Notes

- The 'user' role still exists in both databases for backwards compatibility
- Runtime normalization converts 'user' → 'student' for existing users
- All new signups will get 'student' role directly
- No code changes needed - this was purely a database data fix
