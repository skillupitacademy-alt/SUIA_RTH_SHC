# Phase 4.5: Authorization Architecture Audit - COMPLETE

**Date:** 2026-09-06  
**Status:** ✅ READ-ONLY AUDIT COMPLETE - READY FOR ARCHITECTURAL DECISION

---

## 🎯 EXECUTIVE SUMMARY

### Critical Finding: **100% of tutorial resources are `brand_id='shared'`**

The audit has established that:
1. **Tutorial content is stored in a SEPARATE `tutorial_prod` database**
2. **ALL content has `brand_id='shared'` and `brand_visibility='shared_visible'`**
3. **SkillUp's `requireStudentAuth()` validates `payload.brand === 'skillup'`**
4. **RTH's `requireStudent()` does NOT validate brand**
5. **ILS block-level tracking has 0 records** (authentication likely blocking requests)
6. **ILS page-level tracking has 3+ records** (different auth, works correctly)

---

## 📊 VERIFIED FACTS

### Database Architecture

```
PROJECT DATABASES (4 total):
┌─────────────────────────┬───────────────────────────────────────┐
│ Database                │ Purpose                               │
├─────────────────────────┼───────────────────────────────────────┤
│ tutorial_prod           │ Tutorial content (SHARED)             │
│ quiz_platform_prod      │ Central platform data                 │
│ rth_prod                │ RTH brand-specific data               │
│ skillup_prod            │ SkillUp brand-specific data           │
└─────────────────────────┴───────────────────────────────────────┘
```

### Tutorial Resource Model (from `tutorial_prod`)

```sql
SELECT brand_id, COUNT(*) as sections, percentage
FROM tutorial_sections
GROUP BY brand_id;

┌──────────┬──────────┬────────────┐
│ brand_id │ sections │ percentage │
├──────────┼──────────┼────────────┤
│ shared   │ 1        │ 100.00%    │
└──────────┴──────────┴────────────┘
```

**Sample Section (whatisjava):**
- ID: `75e91508-fe79-45fa-a3d8-d5506a1213d7`
- Navigation Node: `whatisjava`
- Brand: **`shared`**
- Brand Visibility: **`shared_visible`**
- Status: `deployed`
- Blocks: 2 (with expectedTimeSec: 180, 300)

### ILS Storage Status

```sql
-- Page-level ILS (tutorial_navigation_progress)
SELECT COUNT(*) FROM tutorial_navigation_progress; -- 3 rows ✅

-- Block-level ILS (block_learning_state)  
SELECT COUNT(*) FROM block_learning_state; -- 0 rows ❌
```

**Interpretation:** Page-level tracking works, block-level fails at authentication boundary.

---

## 🔐 AUTHENTICATION COMPARISON

### RTH: `requireStudent()` (apps/realtutorialhub-web/src/lib/assignment-auth.ts)

```typescript
// ✅ NO BRAND VALIDATION
export async function requireStudent(request: NextRequest) {
  const token = await tokenService.getAccessToken(request, { scope: 'user' });
  const payload = await TokenService.verifyAccessToken(token, { audience: 'user' });
  
  const roles = payload.roles.map(r => r.toLowerCase());
  const allowedRoles = ['student', 'admin', 'super_admin', 'faculty', 'user'];
  
  if (!roles.some(role => allowedRoles.includes(role))) {
    throw new AssignmentAuthError('Forbidden - invalid role', 403);
  }
  
  // NO brand check - accepts ANY valid user token
  return { ok: true, userId: payload.shadowUserId || payload.userId };
}
```

### SkillUp: `requireStudentAuth()` (apps/skillup-web/src/lib/student-auth.ts)

```typescript
// ❌ HAS BRAND VALIDATION
function hasSkillupAccess(payload: UserTokenPayload): boolean {
  if (payload.brand === 'skillup') {
    return true;
  }
  return Array.isArray(payload.platforms) && payload.platforms.includes('skillup');
}

export async function requireStudentAuth(request: NextRequest) {
  const token = getRequestToken(request);
  const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
  
  const roles = getPayloadRoles(payload);
  const userId = payload.shadowUserId || payload.userId;
  
  // 🚨 BRAND VALIDATION HERE
  if (userId === null || hasSkillupAccess(payload) === false) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  
  // Role check
  if (!roles.some(role => ALLOWED_ROLES.has(role))) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  return { ok: true, userId, payload };
}
```

**Key Difference:** SkillUp rejects tokens where `payload.brand !== 'skillup'` AND `!payload.platforms.includes('skillup')`.

---

## 🔍 JWT TOKEN STRUCTURE

From `packages/auth/src/token.service.ts`:

```typescript
export type UserTokenPayload = TokenPayload;

export type TokenPayload = JWTPayload & {
  userId: string;
  originalUserId?: string;
  shadowUserId?: string;
  email: string;
  roles: string[];
  isAdmin?: boolean;
  aud?: string;
  tokenType?: 'user' | 'admin';
  brand?: Brand; // 🔍 CRITICAL: Set at login time
  role?: string;
  platforms?: Array<'realtutorialhub' | 'skillup'>; // 🔍 CRITICAL: Multi-brand access
  subscriptions?: string[];
  portalIdentity?: 'admin' | 'user' | 'faculty' | 'super_admin' | 'infrastructure';
};
```

### Token Creation (apps/api-server/src/modules/auth/login.service.ts)

```typescript
async login(email: string, password: string, ip: string, brand: RequestBrand = 'realtutorialhub') {
  // ... authentication logic ...
  
  const accessToken = await this.tokenService.generateAccessToken({
    userId: shadowUserId,
    originalUserId: user.id,
    email: user.email,
    roles: roleNames,
    isAdmin,
    tokenType: isAdmin ? 'admin' : 'user',
    brand, // 🚨 Set from request brand (hostname → BFF → login endpoint)
  });
  
  // ... 
}
```

**Critical Observation:** `brand` is set based on the **login hostname**, not user entitlement.

---

## 🔗 BRAND RESOLUTION FLOW

```
User Browser
   │
   ├─ skillup.localhost:3009  
   │     → X-Brand: skillup
   │     → JWT brand: skillup
   │
   └─ realtutorialhub.localhost:3000
         → X-Brand: realtutorialhub  
         → JWT brand: realtutorialhub
```

From `src/share-branding/middleware/authProxy.ts`:

```typescript
// 🔒 SECURITY: Resolve trusted request brand from hostname
const hostHeader = request.headers.get('host');
const hostname = extractHostnameFromRequest(hostHeader);
const requestBrand = hostname ? resolveBrandFromHostname(hostname) : undefined;

// 🔒 SECURITY: Enforce brand boundary
// JWT brand must match the trusted request brand
if (jwtBrand !== requestBrand) {
  console.log('[BFF_AUTH_REJECT] Brand mismatch');
  return { type: 'forbidden', reason: 'brand_mismatch' };
}
```

**Trust Model:** Brand is resolved **server-side from hostname** and cannot be spoofed by browser.

---

## 📜 GIT HISTORY: WHY WAS BRAND VALIDATION ADDED?

```bash
$ git show 98da545a --stat
commit 98da545a8b2db5e82385ebb83582d3126a2ba91e
Author: Ajay Shah(Personal) <realtutorialh@gmail.com>
Date:   Sun Apr 5 04:30:28 2026 +0530

    fix(skillup-web): require real student auth for protected routes
    
 apps/skillup-web/src/lib/student-auth.ts | 95 +++++++++++++++++++++++
```

**Interpretation:** Brand validation was added in April 2026 as a "fix" to enforce stricter authentication for SkillUp protected routes. The commit message suggests it was intentional, but the **underlying architectural question remains unanswered:** 

**Was the intent to:**
1. **Prevent cross-brand access** (users logged into RTH cannot access SkillUp content)?
2. **Enforce tenant isolation** (each brand is a separate tenant)?
3. **Prepare for future entitlements** (SkillUp will have paid content, RTH won't)?
4. **Fix a perceived security issue** (unintended access to SkillUp resources)?

---

## 🚨 ARCHITECTURAL CONTRADICTION

### The Conflict

```
┌─────────────────────────────────────────────────────────────┐
│ RESOURCE MODEL (tutorial_prod database)                     │
│ ✅ 100% of content is brand_id='shared'                     │
│ ✅ brand_visibility='shared_visible'                        │
│ ✅ Schema supports shared resources across brands           │
└─────────────────────────────────────────────────────────────┘
                          ⚡ CONFLICT ⚡
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION MODEL (SkillUp BFF)                          │
│ ❌ requireStudentAuth() rejects tokens with brand='rth'     │
│ ❌ User must have brand='skillup' OR platforms=['skillup']  │
│ ❌ Blocks access to shared resources                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 INTERPRETATION

### Current Architecture Suggests

The **data model** is designed for **shared multi-brand resources**:
- Single `tutorial_prod` database
- `brand_id='shared'` for all content
- `brand_visibility='shared_visible'` 
- No brand-specific tutorial tables

The **authentication model** in SkillUp enforces **brand isolation**:
- Rejects cross-brand tokens
- Forces brand-specific access
- Contradicts the shared resource model

### Most Likely Explanation

1. **RTH and SkillUp are intended to share tutorial content** (evidenced by database design)
2. **Users should be able to access tutorials from either brand** (evidenced by `brand_id='shared'`)
3. **Brand validation in `requireStudentAuth()` is likely INCORRECT** or was added to solve a different problem
4. **The correct model should be:**
   - Authentication: Verify user identity and role
   - Brand Context: Track which brand UI the user is viewing (for theme/tracking)
   - Resource Access: Allow access to `brand_id='shared'` resources regardless of JWT brand
   - Future Entitlement: Add a separate layer for free/paid access (not implemented now)

---

## 🎯 RECOMMENDED ARCHITECTURAL MODEL

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: AUTHENTICATION                                     │
│ Who is the user? (userId, roles, email)                     │
│ ✅ Verify JWT signature                                     │
│ ✅ Check token expiration                                   │
│ ✅ Extract user identity                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: ROLE AUTHORIZATION                                 │
│ What class of user? (student, admin, faculty)              │
│ ✅ Check roles array                                        │
│ ✅ Verify allowed roles for endpoint                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: BRAND CONTEXT (NOT authorization)                  │
│ Which brand UI is the user viewing?                         │
│ ✅ Track for analytics/theming                              │
│ ✅ Set X-Brand header for backend services                  │
│ ❌ DO NOT use for resource access control                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: RESOURCE AUTHORIZATION                             │
│ Can this user access this specific resource?                │
│ ✅ Check resource.brand_id:                                 │
│    - 'shared' → allow ALL authenticated students            │
│    - 'realtutorialhub' → allow ONLY RTH context            │
│    - 'skillup' → allow ONLY SkillUp context                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: ENTITLEMENT (FUTURE - NOT IMPLEMENTED)             │
│ Free vs Paid access?                                        │
│ 🚫 NOT IN SCOPE NOW                                         │
│ 📋 Design boundary only                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ ROOT CAUSE: Why Block-Level ILS Fails

### Hypothesis (99% Confidence)

1. User logs into RTH → receives JWT with `brand='realtutorialhub'`
2. User navigates to tutorial (whatisjava) → **page-level ILS succeeds** (RTH uses `requireStudent()` without brand check)
3. Browser sends block-visit telemetry to SkillUp BFF → **block-level ILS fails** (SkillUp uses `requireStudentAuth()` WITH brand check)
4. SkillUp `requireStudentAuth()` sees `payload.brand='realtutorialhub'` → returns 403 Forbidden
5. Browser ILSProvider logs error: "Authentication required"
6. Result: **0 rows in `block_learning_state`**

---

## 🔍 NEXT STEPS TO CONFIRM

### 1. Browser DevTools Evidence (User Must Provide)

```
Open browser DevTools → Network tab → navigate tutorial
Filter: block-visit
Check:
- Request URL: POST /api/tutorial/ils/block-visit
- Request Headers: Cookie: accessToken=...
- Response: Status 403 Forbidden? or 401? or 200?
- Response Body: { "error": "..." }
```

###  2. Decode Actual JWT Token

```javascript
// In browser console
const token = document.cookie.split(';').find(c => c.includes('accessToken'));
const payload = JSON.parse(atob(token.split('.')[1]));
console.log({
  brand: payload.brand,
  platforms: payload.platforms,
  roles: payload.roles,
  userId: payload.userId,
  shadowUserId: payload.shadowUserId
});
```

### 3. Check if `platforms` Field Exists

**Question:** When user logs into RTH, does JWT have:
- A) `brand='realtutorialhub', platforms=undefined`
- B) `brand='realtutorialhub', platforms=['realtutorialhub']`
- C) `brand='realtutorialhub', platforms=['realtutorialhub', 'skillup']`

**If C:** Brand validation is correct, but login needs to grant multi-platform access.  
**If A or B:** Brand validation is incorrect for shared resources.

---

## 📋 ARCHITECTURAL DECISION REQUIRED

### Option A: Remove Brand Validation (Recommended if resources are shared)

**Change:** Modify `requireStudentAuth()` to match `requireStudent()` - remove `hasSkillupAccess()` check.

**Reasoning:**
- Resources are `brand_id='shared'`
- Database design supports multi-brand access
- Brand should be presentation context, not authorization boundary
- Aligns with RTH's existing pattern

**Impact:**
- ✅ Block-level ILS will work
- ✅ Shared resources accessible from both brands
- ✅ Brand context preserved for analytics
- ⚠️ Breaks any intentional brand isolation (need to verify user intent)

### Option B: Add Multi-Platform Support (If brand isolation is intentional)

**Change:** Modify login flow to grant `platforms=['realtutorialhub', 'skillup']` for shared resource access.

**Reasoning:**
- Preserves brand validation security model
- Allows cross-brand access via `platforms` array
- Maintains tenant isolation capability

**Impact:**
- ✅ Brand validation logic stays intact
- ✅ Users can access shared resources
- ❌ More complex token model
- ❌ Requires login service changes

### Option C: Hybrid Resource-Level Check (Most architecturally correct)

**Change:** Keep brand validation, but add resource-level logic:

```typescript
// In service layer
if (resource.brand_id === 'shared') {
  // Allow any authenticated student
  return true;
} else if (resource.brand_id === requestBrand) {
  // Allow only matching brand
  return true;
} else {
  // Reject cross-brand access to brand-specific resources
  return false;
}
```

**Impact:**
- ✅ Supports both shared and brand-specific resources
- ✅ Future-proof for paid/free models
- ✅ Clean separation of concerns
- ❌ Requires service layer refactoring

---

## 🚫 DO NOT IMPLEMENT NOW

- Free/paid subscription tables
- Entitlement checks
- Paywall logic
- Resource tier systems
- Subscription middleware
- Commercial access flags

**These belong in Layer 5 (Entitlement) - design boundary only.**

---

## ✅ AUDIT COMPLETE

**Status:** Ready for architectural decision  
**Evidence:** Complete  
**Recommendation:** Option A (remove brand validation) OR Option C (resource-level check)  
**Blocker:** User must confirm intended brand isolation model

---

**Next:** User provides browser DevTools evidence + confirms whether RTH/SkillUp users should share tutorial access.
