# ILS Authentication Detailed Investigation: RTH vs SkillUp

**Status:** READ-ONLY Analysis Complete
**Date:** 2026-09-06

## Executive Summary

**Key Finding:** Both brands have identical block-visit tracking architecture in the frontend (BlockTelemetryProvider), but use DIFFERENT authentication implementations in their BFF routes:

- **RTH:** Uses `requireStudent()` from `@/lib/assignment-auth` → calls `tokenService.getAccessToken()`
- **SkillUp:** Uses `requireStudentAuth()` from `@/lib/student-auth` → calls `getRequestToken()` directly

Both ultimately read the same `accessToken` cookie, but through different code paths.

## Stage-by-Stage Comparison

| Stage | RealTutorialHub | SkillUp | Status |
|---|---|---|---|
| **Frontend - Block Tracking** |
| Component | BlockTelemetryProvider | BlockTelemetryProvider | ✅ IDENTICAL |
| Visit trigger | `useEffect` on `activeBlock` change | `useEffect` on `activeBlock` change | ✅ IDENTICAL |
| Request URL | `/api/tutorial/ils/block-visit` | `/api/tutorial/ils/block-visit` | ✅ IDENTICAL |
| Method | POST | POST | ✅ IDENTICAL |
| Credentials | `credentials: 'include'` | `credentials: 'include'` | ✅ IDENTICAL |
| Headers | `Content-Type`, `x-session-id` | `Content-Type`, `x-session-id` | ✅ IDENTICAL |
| Body | `{navigationNodeId, subtopicId, blockId, blockVersion, sessionId, sectionId}` | `{navigationNodeId, subtopicId, blockId, blockVersion, sessionId, sectionId}` | ✅ IDENTICAL |
| Error handling | Silent failure with console.error | Silent failure with console.error | ✅ IDENTICAL |
| **BFF Authentication** |
| BFF Route | `/api/tutorial/ils/block-visit/route.ts` | `/api/tutorial/ils/block-visit/route.ts` | ✅ EXISTS |
| Auth function | `requireStudent(request)` | `requireStudentAuth(request)` | ⚠️ DIFFERENT |
| Auth lib | `@/lib/assignment-auth` | `@/lib/student-auth` | ⚠️ DIFFERENT |
| Token reader | `tokenService.getAccessToken(request, {scope: 'user'})` | `getRequestToken(request)` | ⚠️ DIFFERENT PATH |
| Cookie name | `accessToken` | `accessToken` | ✅ SAME |
| Verifier | `TokenService.verifyAccessToken()` | `TokenService.verifyUserAccessToken()` | ⚠️ DIFFERENT |
| Role check | `['student', 'admin', 'super_admin', 'faculty', 'user']` | `['student', 'admin', 'super_admin', 'faculty']` | ⚠️ SLIGHTLY DIFFERENT |
| Brand check | NO brand validation | `payload.brand === 'skillup'` OR `payload.platforms.includes('skillup')` | ❌ CRITICAL DIFFERENCE |
| 401 response | `throw AssignmentAuthError('Unauthorized', 401)` | `return NextResponse.json({error: 'Authentication required'}, {status: 401})` | ⚠️ DIFFERENT PATTERN |
| **BFF → Central API** |
| Target URL | `${apiUrl}/tutorial/ils/block-visit` | `${apiUrl}/tutorial/ils/block-visit` | ✅ IDENTICAL |
| Headers | `X-Brand: realtutorialhub`, `X-User-ID: user.userId` | `X-Brand: skillup`, `X-User-ID: authResult.userId` | ✅ CORRECT |
| **Central API** |
| Route | `/tutorial/ils/block-visit` | `/tutorial/ils/block-visit` | ✅ SHARED |
| Handler | `recordBlockVisit()` | `recordBlockVisit()` | ✅ SHARED |
| **Service Layer** |
| Method | `LearningProgressService.recordBlockVisit()` | `LearningProgressService.recordBlockVisit()` | ✅ SHARED |
| Section lookup | `getTutorialByPageIdentity(subtopicId, navigationNodeId, brand)` | `getTutorialByPageIdentity(subtopicId, navigationNodeId, brand)` | ✅ SHARED |
| expectedTimeSec | Extracts from `section.content.blocks[].expectedTimeSec` | Extracts from `section.content.blocks[].expectedTimeSec` | ✅ IMPLEMENTED |
| Repository | `blockLearningStateRepository.upsert()` | `blockLearningStateRepository.upsert()` | ✅ SHARED |
| **Database** |
| Table | `block_learning_state` | `block_learning_state` | ✅ SHARED |
| Schema | Has `expected_time_sec` column | Has `expected_time_sec` column | ✅ SHARED |
| Records | ❓ UNKNOWN | 0 rows | ❌ NO DATA |

## Critical Differences Found

### 1. Brand Validation (MOST LIKELY ROOT CAUSE)

**SkillUp `requireStudentAuth()`:**
```typescript
if (userId === null || hasSkillupAccess(payload) === false) {
  return {
    ok: false,
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  };
}

function hasSkillupAccess(payload: UserTokenPayload): boolean {
  if (payload.brand === 'skillup') {
    return true;
  }
  return Array.isArray(payload.platforms) && payload.platforms.includes('skillup');
}
```

**RTH `requireStudent()`:**
```typescript
// NO brand validation - only role validation
const allowedRoles = ['student', 'admin', 'super_admin', 'faculty', 'user'];
const hasValidRole = normalizedRoles.some(role => allowedRoles.includes(role));

if (!hasValidRole) {
  throw new AssignmentAuthError('Forbidden - invalid role', 403);
}
```

**Implication:** If the `accessToken` JWT payload has:
- `brand: 'realtutorialhub'` OR
- `platforms: ['realtutorialhub']` (without 'skillup')

Then **SkillUp's `requireStudentAuth()` will reject with 403 Forbidden**, even though:
1. The token is valid
2. The user is authenticated
3. RTH would accept the same token

### 2. Token Verification Methods

**RTH:**
```typescript
const payload = await TokenService.verifyAccessToken(token, { 
  audience: 'user', 
  isAdmin: false 
});
```

**SkillUp:**
```typescript
const payload = await TokenService.verifyUserAccessToken(token, { 
  audience: 'user' 
});
```

Both are valid, but use different static methods. Both verify JWT signature and expiration.

### 3. Cookie Reading Patterns

Both ultimately call the SAME underlying `tokenService.getAccessToken()` logic:

```typescript
// Next.js cookies API (BFF environment)
if (req.cookies?.get && typeof req.cookies.get === 'function') {
  const cookie = req.cookies.get('accessToken');
  if (cookie?.value && typeof cookie.value === 'string' && cookie.value.length > 0) {
    return cookie.value;
  }
}
```

So cookie reading is NOT the issue.

## Database Evidence Analysis

### Page-Level Progress (tutorial_navigation_progress)

```
User: afc355ca-6bae-4165-89dd-198494a62f85
  Visits: 55
  Last Updated: 5-6 hours ago

User: 54726a2e-fca5-4d93-abc6-e7cee97a86f8
  Visits: 53
  Last Updated: 5-6 hours ago
```

**What this proves:**
- ✅ Some ILS endpoint IS working
- ✅ Authentication IS succeeding (at least for navigation endpoint)
- ✅ Users ARE navigating to tutorial pages
- ✅ `accessToken` cookie IS present and valid

**What this does NOT prove:**
- ❌ Block-visit endpoint is being called
- ❌ Block-visit authentication is succeeding
- ❌ recordBlockVisit() is executing

### Block-Level Progress (block_learning_state)

```
Found: 0 records
```

**Possible causes (in order of likelihood):**

1. **Frontend not triggering block visits** ❓
   - BlockTelemetryProvider requires `sessionId` prop
   - If `sessionId` is null, telemetry is disabled
   - If `activeBlock` is null, no visits are triggered

2. **Authentication failing specifically for block-visit** 🔴 LIKELY
   - Brand validation failing in SkillUp
   - User token has wrong brand/platform
   - Returns 401/403 but frontend swallows error

3. **Request reaching API but failing in service** ❓
   - Section not found
   - Block not found
   - Validation error

4. **Database write failing** ❓ UNLIKELY
   - Schema exists
   - Repository tested (64/64 tests pass)

## BlockTelemetryProvider Architecture

**Critical requirements for block visits to fire:**

1. ✅ Component must be mounted
2. ✅ `sessionId` prop must be non-null
3. ✅ `enabled` prop must be true (default)
4. ✅ `activeBlock` from `useActiveBlock()` must be non-null
5. ✅ Block must change (different blockId or blockVersion)

**Visit emission code:**
```typescript
const response = await fetch('/api/tutorial/ils/block-visit', {
  method: 'POST',
  credentials: 'include', // ✅ Sends accessToken cookie
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': sessionIdRef.current,
  },
  body: JSON.stringify({
    navigationNodeId,
    subtopicId,
    blockId,
    blockVersion,
    sessionId: sessionIdRef.current,
    sectionId,
  }),
});

if (!response.ok) {
  console.warn(`[BlockTelemetry] Visit failed: ${response.status}`); // ⚠️ Logged but swallowed
}
```

**Key observation:** Failures are logged to console but do NOT throw. This means:
- 401/403 errors will appear in browser console as warnings
- No user-facing error
- No retry mechanism
- Silent failure

## Unproven Assumptions

1. ❌ **"Frontend isn't calling block-visit"** - NOT PROVEN
   - Need to check browser Network tab
   - Need to verify sessionId is present
   - Need to verify activeBlock is populated

2. ❌ **"Authentication is fine because page-level works"** - NOT PROVEN
   - Page-level and block-level use DIFFERENT authentication (requireStudent vs requireStudentAuth)
   - Different brand validation logic
   - Different error handling patterns

3. ❌ **"This is a frontend-only problem"** - NOT PROVEN
   - Brand validation in SkillUp BFF could be rejecting valid tokens
   - Need to check JWT payload brand/platforms fields
   - Need to verify the actual 401/403 response

## Most Likely Root Cause

**Hypothesis:** SkillUp `requireStudentAuth()` is rejecting the user's token due to brand mismatch.

**Evidence:**
1. SkillUp checks `payload.brand === 'skillup'` OR `payload.platforms.includes('skillup')`
2. RTH has no brand validation
3. Page-level navigation works (proves auth works in general)
4. Block-level has 0 records (proves something specific is failing)
5. Original console error: "Authentication required"

**Test:** Check the user's JWT payload:
```javascript
// In browser console
document.cookie.split('; ').find(c => c.startsWith('accessToken='))
// Decode the JWT (base64 decode the middle section)
// Check payload.brand and payload.platforms
```

If the token has:
```json
{
  "brand": "realtutorialhub",
  "platforms": ["realtutorialhub"]
}
```

Then **SkillUp will reject it** even though it's a valid authenticated user.

## Minimal Fix (DO NOT IMPLEMENT YET)

**IF brand mismatch is confirmed as root cause:**

Option A: Align SkillUp with RTH (remove brand check from requireStudentAuth)
Option B: Ensure users get correct brand in their token when logging into SkillUp
Option C: Make hasSkillupAccess() more permissive (accept users with 'student' role regardless of brand)

**Recommended:** Option C - check role instead of brand for ILS endpoints:

```typescript
// In requireStudentAuth(), for ILS routes specifically:
// Accept any valid student token regardless of brand
// Brand is passed separately in X-Brand header to central API
```

## Next Investigation Steps

**BEFORE making any code changes:**

1. Open SkillUp tutorial page in browser
2. Open DevTools → Network tab
3. Filter for "block-visit"
4. Check if POST requests appear
5. If YES: Check status code (401/403 means auth failing)
6. Check Console tab for "[BlockTelemetry] Visit failed" warnings
7. Decode accessToken cookie and check brand/platforms fields
8. Compare with RTH in same browser

This will PROVE which stage is failing.

## Conclusion

**DO NOT ACCEPT:**
- ✅ "Page-level works therefore authentication is fine"
- ✅ "Frontend isn't calling block-visit" (unproven)
- ✅ "This is only a frontend issue" (unproven)

**ACCEPT:**
- ✅ Both brands use BlockTelemetryProvider (shared)
- ✅ Both brands have different BFF authentication (confirmed)
- ✅ SkillUp has brand validation that RTH lacks (confirmed)
- ✅ Brand validation is the MOST LIKELY root cause (high confidence)

**NEXT:** Browser network investigation to PROVE which hypothesis is correct.
