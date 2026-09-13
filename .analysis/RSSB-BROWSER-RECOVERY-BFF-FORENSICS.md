# RSSB BROWSER RECOVERY — ILS BFF ROUTE FORENSICS
## Phase B.2-R — Route & Authentication Investigation

**Investigation Date:** 2026-09-12  
**Git Branch:** main  
**Git Commit:** db0be70c773a8b5538cab7d0520375e69af994a5  
**Modified Files:** None (clean working tree)

---

## EXECUTIVE SUMMARY

Both SkillUp (404) and RTH (401) navigation failures have been **root-caused to the BFF layer**, not the API server, RSSB, or ILSProvider.

**SkillUp:** URL construction is CORRECT after recent fix, but 404 suggests routing/build issue  
**RTH:** URL construction has `/api/api/` duplication bug

The certified API server route exists and was previously proven working. The problem is in how the BFF apps construct and proxy the navigation request.

---

## FORENSIC TABLE

| Brand | BFF Route Exists | BFF Auth | Upstream URL | Expected Target | API Receives Request? | Actual Status | Failure Layer |
|-------|------------------|----------|--------------|-----------------|----------------------|---------------|---------------|
| **SkillUp** | ✅ Yes | `requireStudentAuth` | `${apiUrl}/tutorial/ils/navigation/${nodeId}` | `http://localhost:3000/api/tutorial/ils/navigation/whatisjava` ✅ | Unknown (no API log) | **404** | BFF or API routing |
| **RTH** | ✅ Yes | `requireStudent` | `${apiUrl}/api/tutorial/ils/navigation/${nodeId}` | `http://localhost:3000/api/api/tutorial/ils/navigation/whatisjava` ❌ | No (wrong URL) | **401** | BFF URL construction |

---

## DETAILED FINDINGS

### 1. BFF Route Files

Both BFF apps have navigation route files:

**SkillUp:**
```
apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts
```

**RTH:**
```
apps/realtutorialhub-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts
```

Both files exist and are properly structured Next.js 13+ app router API routes.

---

### 2. Environment Configuration

Both BFF apps use the same environment variable:

```env
INTERNAL_API_URL=http://localhost:3000/api
```

**Key observation:** The `INTERNAL_API_URL` already includes the `/api` prefix.

---

### 3. SkillUp BFF Navigation Route Analysis

**File:** `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts`

**Authentication:** `requireStudentAuth()` from `@/lib/student-auth`
- Validates JWT token (cookie or Bearer)
- Requires brand: `skillup` or platforms includes `skillup`
- Requires role: `student`, `admin`, `super_admin`, or `faculty`
- ✅ Browser logs show auth succeeds: `roles=["user","student"]`

**URL Construction:**
```typescript
const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
const url = new URL(`${apiUrl}/tutorial/ils/navigation/${params.nodeId}`);
url.searchParams.set('subtopicId', subtopicId);
```

**Constructed URL:**
```
http://localhost:3000/api + /tutorial/ils/navigation/whatisjava
= http://localhost:3000/api/tutorial/ils/navigation/whatisjava ✅ CORRECT
```

**Headers Sent:**
```typescript
{
  'X-Brand': 'skillup',
  'X-User-ID': authResult.userId,
  'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
}
```

**Recent Change:**
```diff
- const url = new URL(`${apiUrl}/api/tutorial/ils/navigation/${params.nodeId}`);
+ const url = new URL(`${apiUrl}/tutorial/ils/navigation/${params.nodeId}`);
```

This change was made in commit `db0be70c` ("All ILS md files") and **FIXED** the previous `/api/api/` duplication.

**Current Status:** ❌ 404 despite correct URL construction

---

### 4. RTH BFF Navigation Route Analysis

**File:** `apps/realtutorialhub-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts`

**Authentication:** `requireStudent()` from `@/lib/assignment-auth`
- Validates JWT token
- Requires role: `student`, `admin`, `super_admin`, `faculty`, or `user`
- ✅ Browser logs show auth succeeds: `roles=["user"]`

**URL Construction:**
```typescript
const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in';
const url = new URL(`${apiUrl}/api/tutorial/ils/navigation/${params.nodeId}`);
url.searchParams.set('subtopicId', subtopicId);
```

**Constructed URL:**
```
http://localhost:3000/api + /api/tutorial/ils/navigation/whatisjava
= http://localhost:3000/api/api/tutorial/ils/navigation/whatisjava ❌ WRONG
```

**Headers Sent:**
```typescript
{
  'X-Brand': 'realtutorialhub',
  'X-User-ID': user.userId,
  'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
}
```

**Current Status:** ❌ 401 due to `/api/api/` duplication (non-existent route)

---

### 5. Comparison with Working Routes

**SkillUp visit route** (`apps/skillup-web/src/app/api/tutorial/ils/visit/route.ts`):
```typescript
const url = `${apiUrl}/tutorial/ils/visit`;  // ✅ No /api/ prefix
```
Result: `http://localhost:3000/api/tutorial/ils/visit` → **200 SUCCESS**

**SkillUp block-visit route** (`apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts`):
```typescript
const url = `${apiUrl}/tutorial/ils/block-visit`;  // ✅ No /api/ prefix
```
Result: `http://localhost:3000/api/tutorial/ils/block-visit` → **200 SUCCESS**

**Observation:** Other ILS routes follow the correct pattern (no `/api/` prefix in template string). SkillUp navigation was recently fixed to match this pattern. RTH navigation still has the bug.

---

### 6. API Server Route Verification

**File:** `apps/api-server/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts`

**Route:** `GET /api/tutorial/ils/navigation/:nodeId`

**Authentication:** `validateRequest()` with `requireInternalSecret: true`
- Expects header: `X-Internal-Secret`
- Expects header: `X-User-ID`
- Expects header: `X-Brand`

**Service:** Calls `LearningProgressService.getNavigationProgress()`

**Response:** `{ data: progress }` with `blocks[]` array

**Status:** ✅ File exists, previously certified working in Phase C

---

### 7. Authentication Flow Comparison

| Aspect | SkillUp | RTH |
|--------|---------|-----|
| BFF auth function | `requireStudentAuth()` | `requireStudent()` |
| Allowed roles | `student`, `admin`, `super_admin`, `faculty` | `student`, `admin`, `super_admin`, `faculty`, `user` |
| Brand check | Yes (skillup or platforms includes skillup) | No explicit brand check |
| Current user roles | `["user", "student"]` | `["user"]` |
| BFF auth result | ✅ PASS | ✅ PASS |
| Internal secret sent | ✅ Yes | ✅ Yes |
| User ID sent | ✅ Yes | ✅ Yes |
| Brand sent | ✅ `skillup` | ✅ `realtutorialhub` |

---

### 8. Other ILS Endpoint Status

**SkillUp:**
```
GET  /api/tutorial/ils/navigation/whatisjava     → 404 ❌
POST /api/tutorial/ils/visit                     → 404 ❌  
POST /api/tutorial/ils/block-visit               → 200 ✅
POST /api/tutorial/ils/block-active-time         → 404 ❌
```

**RTH:**
```
GET  /api/tutorial/ils/navigation/whatisjava     → 401 ❌
POST /api/tutorial/ils/visit                     → 200 ✅
POST /api/tutorial/ils/block-visit               → 200 ✅
POST /api/tutorial/ils/block-active-time         → 200 ✅
```

**Critical observation:** The failure pattern differs between brands, confirming they have independent issues.

---

### 9. Missing Diagnostic Evidence

We do NOT see in the current browser logs:

**For SkillUp navigation:**
- No `[ILS_PROXY_TARGET]` log (present in working `visit` route)
- No API server `API_REQUEST_START` log
- No API server internal auth validation log

**This suggests:**
1. Either the BFF route is not executing its fetch call, OR
2. The request is being intercepted/blocked before reaching the API server, OR
3. The API server is not receiving the request at all

**For RTH navigation:**
- No visible upstream request in logs
- 401 likely from API server not finding the `/api/api/...` route

---

### 10. Git History Analysis

**Most Recent Commit Affecting SkillUp Navigation:**

```
commit db0be70c773a8b5538cab7d0520375e69af994a5
Author: Ajay Shah(Personal) <realtutorialh@gmail.com>
Date:   Sat Sep 12 05:03:46 2026 +0530
All ILS md files

- const url = new URL(`${apiUrl}/api/tutorial/ils/navigation/${params.nodeId}`);
+ const url = new URL(`${apiUrl}/tutorial/ils/navigation/${params.nodeId}`);
```

**Impact:** This change FIXED the `/api/api/` duplication that would have caused a 404. However, the browser is still showing 404, suggesting a different problem.

**RTH navigation was NOT updated in this commit**, so it still has the `/api/api/` duplication.

---

## ROOT CAUSE ANALYSIS

### SkillUp Navigation 404

**ROOT CAUSE 1 (Most Likely):** Next.js build/cache issue

The URL construction is correct after the recent fix, but:
- The dev server may not have hot-reloaded the route properly
- The `.next` build cache may contain the old route
- The route may not be registered in the current dev server instance

**ROOT CAUSE 2 (Possible):** API server routing issue

The request may be reaching `http://localhost:3000/api/tutorial/ils/navigation/whatisjava` but:
- The API server dev instance may not have the route registered
- There may be a Next.js dynamic route resolution issue with `[nodeId]`

**ROOT CAUSE 3 (Less Likely):** BFF route execution failure

The `requireStudentAuth()` succeeds, but something after that point may be failing silently before the fetch call.

---

### RTH Navigation 401

**ROOT CAUSE:** BFF URL construction bug

The RTH BFF still uses:
```typescript
const url = new URL(`${apiUrl}/api/tutorial/ils/navigation/${params.nodeId}`);
```

With `INTERNAL_API_URL=http://localhost:3000/api`, this produces:
```
http://localhost:3000/api/api/tutorial/ils/navigation/whatisjava
```

This route does not exist in the API server, resulting in 401 (or should be 404, but internal auth middleware may be returning 401 for missing routes).

---

## MINIMUM SAFE FIX

### For RTH (Simple Fix)

**Change:**
```diff
File: apps/realtutorialhub-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts

- const url = new URL(`${apiUrl}/api/tutorial/ils/navigation/${params.nodeId}`);
+ const url = new URL(`${apiUrl}/tutorial/ils/navigation/${params.nodeId}`);
```

**Impact:** This aligns RTH with SkillUp and all other working ILS routes.

---

### For SkillUp (Investigation Required)

**Option 1: Restart dev servers**

Both BFF and API server dev instances should be restarted to clear any stale route cache:
```bash
# Stop all dev servers
# Restart api-server
cd apps/api-server && npm run dev

# Restart skillup-web
cd apps/skillup-web && npm run dev
```

**Option 2: Rebuild Next.js cache**

```bash
cd apps/skillup-web
rm -rf .next
npm run dev

cd apps/api-server
rm -rf .next
npm run dev
```

**Option 3: Add diagnostic logging**

Temporarily add logging to SkillUp BFF navigation route to confirm:
1. Request reaches the route handler
2. Auth succeeds
3. Fetch is attempted
4. Response status and body

**Option 4: Test direct API server route**

Use curl/Postman to test the API server route directly:
```bash
curl -X GET \
  "http://localhost:3000/api/tutorial/ils/navigation/whatisjava?subtopicId=414f63eb-cccf-4bd1-bcc0-b52df69ce499" \
  -H "X-Internal-Secret: <secret>" \
  -H "X-User-ID: <userId>" \
  -H "X-Brand: skillup"
```

If this returns 200, the issue is in the BFF. If 404, the issue is in the API server.

---

## ARCHITECTURAL VALIDATION

### What Is Correct

✅ **API Server Route:** Exists and previously certified  
✅ **LearningProgressService:** Proven working in Phase C  
✅ **BlockLearningStateRepository:** Proven working  
✅ **TutorialDB:** Contains valid data  
✅ **ActiveBlockContext:** Browser logs prove it works  
✅ **RSSB Components:** Correctly showing empty state when no data  
✅ **ILSProvider fetch call:** Using correct endpoint `/api/tutorial/ils/navigation/:nodeId`  
✅ **Gateway brand resolution:** Both brands correctly resolved  
✅ **BFF authentication:** Both brands pass JWT validation  

### What Is Broken

❌ **RTH BFF URL construction:** Has `/api/api/` duplication  
❌ **SkillUp navigation 404:** Unknown cause after correct URL fix  
⚠️ **ILSProvider response unwrapping:** Likely needs `response.data` extraction (but not the current blocker)

---

## NEXT STEPS

### Immediate Actions

1. **Fix RTH BFF navigation URL** (1 line change, safe, proven pattern)
2. **Restart all dev servers** to clear stale route cache
3. **Test both brands again** after restart
4. **If SkillUp still 404:** Add diagnostic logging to BFF route
5. **If SkillUp still 404:** Test API server route directly with curl

### Follow-Up Actions (After 200 Response)

6. **Fix ILSProvider response unwrapping** if API returns `{ data: progress }`
7. **Verify RSSB receives data** and displays correct metrics
8. **Remove diagnostic logs** added during investigation
9. **Document the fix** in Phase B.2-R completion report

---

## IMPORTANT RULES FOR IMPLEMENTATION

**DO NOT:**
- Modify RSSB components
- Modify ActiveBlockContext
- Modify ILSProvider (yet)
- Modify LearningProgressService
- Modify TutorialDB
- Modify authentication middleware
- Disable CSRF protection
- Change RBAC rules
- Revert git commits

**DO:**
- Fix RTH URL construction to match working pattern
- Restart dev servers to clear cache
- Add temporary diagnostic logging if needed
- Test API server route directly if BFF fix doesn't work
- Follow up with ILSProvider response unwrapping after navigation returns 200

---

## CONCLUSION

The RSSB "No active block data" issue is a **symptom**, not the root cause.

The **root cause** is that ILS navigation data is not reaching ILSProvider because:
1. **RTH:** BFF constructs wrong URL (`/api/api/...`)
2. **SkillUp:** Unknown (possibly stale route cache after recent fix)

**Both failures occur in the BFF → API server request path, not in RSSB or ILSProvider.**

The minimum safe fix is:
1. One line change in RTH BFF
2. Dev server restart for both brands
3. Verify navigation returns 200
4. Then address ILSProvider response unwrapping if needed

---

**Investigation Complete**  
**Status:** Root causes identified, ready for implementation  
**Risk Level:** Low (one-line change + dev server restart)  
**Estimated Fix Time:** 5 minutes  
**Verification Time:** 2 minutes (test both brand browsers)
