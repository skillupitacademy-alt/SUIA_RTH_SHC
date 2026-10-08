# 🔐 Role System Explanation

## Quick Answers

### 1. Do "user" and "student" have different privileges?

**NO - They are IDENTICAL.**

The system uses **role unification** to ensure both RTH (which uses `user` role) and SkillUp (which uses `student` role) behave the same way.

### 2. User Count Clarification

**There are 2 users with "user" role:**
1. `anujoshi@gmail.com` - has **only** `user` role
2. `student@skillupitacademy.com` - has **BOTH** `user` AND `student` roles

**But they behave identically** because of role unification.

### 3. Who has the "student" role?

**Only 1 user**: `student@skillupitacademy.com`
- Email Verified: Yes ✅
- Onboarded: Yes ✅
- Has BOTH `user` and `student` roles
- After unification: behaves as `user` role only

---

## How Role Unification Works

### Code Location
`packages/auth/src/utils/canonical-roles.ts`

### Logic
```typescript
// If a user has "user" OR "student" (or both)
const hasUserOrStudent = roles.includes('user') || roles.includes('student');

if (hasUserOrStudent) {
  // Remove both roles, then add back only "user"
  roles = roles.filter(r => r !== 'user' && r !== 'student');
  roles.push('user');
}
```

### Examples

| Database Roles | After Canonicalization | Result |
|---------------|----------------------|--------|
| `["user"]` | `["user"]` | ✅ Access granted |
| `["student"]` | `["user"]` | ✅ Access granted |
| `["user", "student"]` | `["user"]` | ✅ Access granted |
| `[]` | `[]` | ❌ Access denied |

---

## Current Users in Database

### Users with Roles

| Email | Roles in DB | After Unification | Onboarded | Email Verified |
|-------|-------------|-------------------|-----------|----------------|
| `anujoshi@gmail.com` | `user` | `user` | Yes ✅ | No |
| `student@skillupitacademy.com` | `user`, `student` | `user` | Yes ✅ | Yes ✅ |

### Users without Roles (⚠️ Cannot login to protected routes)

| Email | Roles | Onboarded | Issue |
|-------|-------|-----------|-------|
| `yashicajoshi@gmail.com` | None | No | ⚠️ Will be redirected to login |
| `flow-1776616708388@test.com` | None | Yes | ⚠️ Will be redirected to login |
| `audit-*@test.com` (6 users) | None | Yes | ⚠️ Test users without roles |

---

## Authentication Middleware

### Location
`src/share-branding/middleware/authProxy.ts`

### Role Check Function
```typescript
function hasRequiredRole(payload: UserPayload): boolean {
  const roles = payload.roles; // already normalized by canonicalizeRoles()
  
  // Accept any of these roles:
  return roles.includes('student') ||   // ✅ Student role
         roles.includes('user') ||      // ✅ User role
         roles.some((role) => OVERRIDE_ROLES.includes(role)); // ✅ Admin roles
}
```

### Override Roles (Always Granted Access)
```typescript
const OVERRIDE_ROLES = ['admin', 'super_admin', 'faculty'];
```

### Access Control Flow

1. **User logs in** → JWT token created with roles from database
2. **Token sent to BFF** → Token verified, roles extracted
3. **Roles normalized** → `canonicalizeRoles(roles)` called
   - `["user", "student"]` → `["user"]`
   - `["student"]` → `["user"]`
4. **Middleware checks** → `hasRequiredRole(user)` called
   - Accepts: `user`, `student`, `admin`, `super_admin`, `faculty`
5. **Access granted** → User can access protected routes

---

## Why This Design?

### Problem
- **RTH (RealTutorialHub)** uses `user` role
- **SkillUp** uses `student` role
- Need both to behave identically without DB migration

### Solution
- Unify `user` + `student` → `user` in code
- No database changes needed
- Both brands work the same way
- Authentication logic is brand-agnostic

### Benefits
1. ✅ **No DB migration** - existing data works as-is
2. ✅ **Brand-agnostic** - same auth logic for all brands
3. ✅ **Backwards compatible** - old tokens still work
4. ✅ **Consistent behavior** - RTH and SkillUp identical

---

## Protected Routes

Users with `user` or `student` role can access:

- `/dashboard` - User dashboard
- `/onboarding` - Onboarding flow
- `/learn/` - Learning content
- `/start-learning/` - Course start
- `/student` - Student pages
- `/batches` - Batch management
- `/api/tutorial/` - Tutorial APIs
- `/api/ai-tutor/` - AI tutor APIs
- `/remediation/` - Remediation content

---

## Fixing Users Without Roles

If a user cannot access protected routes, check if they have roles:

### Check User Roles
```bash
node scripts/check-user-role-users.mjs
node scripts/check-student-role-users.mjs
```

### Assign "user" Role
```bash
node scripts/assign-role-skillup.mjs
```

This will:
1. Find the `user` role in the database
2. Assign it to the specified user
3. User can now access protected routes

---

## Summary

| Question | Answer |
|----------|--------|
| **Do user and student have different privileges?** | **NO** - They are identical after role unification |
| **How many users have "user" role?** | **2 users** (anujoshi@gmail.com, student@skillupitacademy.com) |
| **How many users have "student" role?** | **1 user** (student@skillupitacademy.com, who also has "user") |
| **Why unify roles?** | To make RTH and SkillUp behave identically without DB changes |
| **Can users with only "student" role login?** | **YES** - normalized to "user" automatically |
| **What happens to users with no roles?** | **Redirected to login** - cannot access protected routes |

---

## Next Steps

### For anujoshi@gmail.com
✅ **Role assigned** - now has `user` role  
✅ **Multi-env deployed** - brand URLs work correctly  
✅ **Cookies fixed** - domain set properly  

**Action Required**: Clear browser cookies and test login at `https://user.skillupitacademy.com/login`

### For yashicajoshi@gmail.com
⚠️ **No role assigned** - will be redirected to login  

**To Fix** (if needed):
```bash
node scripts/assign-role-skillup.mjs
# When prompted, enter: yashicajoshi@gmail.com
```

---

**Status**: ✅ Role system explained. Ready for testing.
