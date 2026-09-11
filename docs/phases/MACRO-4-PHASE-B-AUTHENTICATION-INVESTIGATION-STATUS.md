# MACRO 4 PHASE B — BROWSER AUTHENTICATION INVESTIGATION STATUS

**Date:** 2026-09-11  
**Status:** 🔍 **INVESTIGATION IN PROGRESS** - Need Fresh Browser Evidence  
**Phase:** Authentication flow analysis complete - Awaiting current runtime verification

---

## INVESTIGATION SUMMARY

### Routes Verified

**Both ILS routes exist and use identical authentication:**

**1. Block Active Time (Working):**
- Path: `apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts`
- Authentication: `requireStudentAuth(request)` (line 14)
- Server logs: ✅ `hasToken=true`, `Token verified successfully`

**2. Navigation Progress (Suspected failing):**
- Path: `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts`
- Authentication: `requireStudentAuth(request)` (line 19)
- Server logs: ⚠️ **NO RECENT LOGS** (earlier evidence showed 401)

### Authentication Flow Traced

**Both routes use identical pattern:**
```typescript
// 1. BFF Route Handler
export async function POST/GET(request: NextRequest) {
  // 2. Authenticate via requireStudentAuth
  const authResult = await requireStudentAuth(request);
  if (!authResult.ok) {
    return authResult.response; // 401 if no token
  }
  
  // 3. Extract token from cookies or Authorization header
  // From student-auth.ts line 22:
  const cookieToken = request.cookies.get('accessToken')?.value;
  
  // 4. Verify token
  const payload = await TokenService.verifyUserAccessToken(token);
  
  // 5. Proxy to API server with authenticated headers
  const response = await fetch(apiUrl, {
    headers: {
      'X-Brand': 'skillup',
      'X-User-ID': authResult.userId,
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET
    }
  });
}
```

**Client-side fetch (ILSProvider.tsx line 262):**
```typescript
const response = await fetch(url, {
  method: 'GET',
  credentials: 'include', // ✅ Cookies included
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Middleware Layer Identified

**Additional authentication layer exists:**
- File: `src/share-branding/middleware/authProxy.ts`
- Logging: `[BFF_AUTH_DEBUG]` (seen in earlier server logs)
- Runs BEFORE route handlers
- Also checks `accessToken` cookie

---

## CRITICAL TIMING ISSUE

### Earlier Evidence (Before Cache Clear)

**User reported:**
```
GET /api/tutorial/ils/navigation/whatisjava?... → 401
[BFF_AUTH_DEBUG] hasToken=false, tokenLength=0
```

### Current Server Status (After Cache Clear + Restart)

**Recent logs show:**
- ✅ block-active-time: `hasToken=true`, authentication working
- ⚠️ navigation: **NO RECENT REQUESTS IN LOGS**

**This means:**
1. Earlier 401 was observed BEFORE .next cache clear + server restart
2. Current running server has NOT received a fresh navigation request
3. Cannot confirm if issue persists with current code

---

## HYPOTHESES

### Hypothesis A: Stale Compilation (RESOLVED?)
**Theory:** Old Next.js bundle executed old ILSProvider code  
**Status:** ✅ **FIXED** - Cache cleared, server restarted  
**Evidence Needed:** Fresh browser test with current build

### Hypothesis B: Timing/Race Condition
**Theory:** ILSProvider mounts before cookie is fully available  
**Status:** ⚠️ **POSSIBLE** but no evidence yet  
**Would cause:** First navigation request fails, subsequent retry succeeds  
**Evidence Needed:** Browser console logs showing request timing

### Hypothesis C: Route Not Compiling
**Theory:** Navigation route.ts has syntax/import error  
**Status:** ❌ **UNLIKELY** - Code reviewed, looks correct  
**Evidence:** TypeScript compiles without errors

### Hypothesis D: Client-Side Hydration Issue
**Theory:** ILSProvider runs during SSR without cookies  
**Status:** ⚠️ **POSSIBLE** - ILSProvider uses useEffect (client-only)  
**Evidence Needed:** Check if fetchProgress runs server-side

---

## REQUIRED: FRESH BROWSER TEST

**Cannot proceed without current runtime evidence.**

### Test Steps Required

**1. Open Browser DevTools**
- Console tab (for errors)
- Network tab (for requests)

**2. Navigate to Tutorial**
```
http://skillup.localhost:3009/tutorial-v2/full-stack-development/backend-development/java/what-is-java-12efacf1/whatisjava
```

**3. Monitor Network Tab**
**Look for:**
```
GET /api/tutorial/ils/navigation/whatisjava?subtopicId=...
```

**Record:**
- HTTP Status: 200 / 401 / other?
- Request Headers: Cookie present?
- Response: JSON with blocks[] or error?

**4. Check Console**
**Look for:**
```
[ILSProvider] activeBlock changed effect
[ILSProvider] updateActiveBlockProgress called
[ILSProvider] Block matching result
```

**5. Check Server Terminal**
**Look for:**
```
[BFF_AUTH_DEBUG] {"pathname":"/api/tutorial/ils/navigation/whatisjava",...}
```

**Record:**
- hasToken: true/false?
- Token verified successfully?
- GET /api/tutorial/ils/navigation/... STATUS?

---

## COMPARISON: Working vs Failing

### Block Active Time (Working) ✅

**Browser:**
```
POST /api/tutorial/ils/block-active-time
Cookies: accessToken=eyJhbGci...
```

**Server:**
```
[BFF_AUTH_DEBUG] hasToken=true, tokenLength=499
[BFF_AUTH_DEBUG] Token verified successfully
POST /api/tutorial/ils/block-active-time 200
```

### Navigation Progress (Status Unknown) ⚠️

**Expected if working:**
```
GET /api/tutorial/ils/navigation/whatisjava?subtopicId=...
Cookies: accessToken=eyJhbGci...
```

**Expected server:**
```
[BFF_AUTH_DEBUG] hasToken=true, tokenLength=499
[BFF_AUTH_DEBUG] Token verified successfully
GET /api/tutorial/ils/navigation/whatisjava 200
```

**If still failing:**
```
GET /api/tutorial/ils/navigation/whatisjava?subtopicId=...
Cookies: (missing or not sent?)
```

**Server:**
```
[BFF_AUTH_DEBUG] hasToken=false, tokenLength=0
[BFF_AUTH_DEBUG] No token found
GET /api/tutorial/ils/navigation/whatisjava 401
```

---

## NEXT ACTIONS

### Cannot Proceed Without:

1. ✅ Fresh browser test with current code
2. ✅ Network tab screenshot/log showing navigation request
3. ✅ Server terminal output showing authentication status
4. ✅ Browser console showing ILSProvider logs

### If Navigation Returns 200 with blocks[]

**Then:**
- Issue was resolved by cache clear + restart
- Verify `activeBlockProgress` resolves in RSSB
- Proceed to Phase C (cleanup)
- Consider Macro 4 complete

### If Navigation Still Returns 401

**Then investigate:**
1. Compare request headers (block-active-time vs navigation)
2. Check cookie domain/path
3. Check middleware matcher (does it apply to navigation?)
4. Check timing (does cookie exist when request fires?)
5. Add temporary logging to navigation route
6. Consider SSR vs CSR timing

### If Navigation Returns 200 but NO blocks[]

**Then investigate:**
- API server response structure
- BFF proxy behavior
- Response mapping

---

## FILES EXAMINED

**Authentication:**
- ✅ `apps/skillup-web/src/lib/student-auth.ts` - requireStudentAuth implementation
- ✅ `src/share-branding/middleware/authProxy.ts` - Middleware layer

**Routes:**
- ✅ `apps/skillup-web/src/app/api/tutorial/ils/navigation/[nodeId]/route.ts` - Navigation endpoint
- ✅ `apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts` - Telemetry endpoint (working)

**Client:**
- ✅ `packages/ui/src/tutorial/runtime/ILSProvider.tsx` - Client fetch with credentials: 'include'

**Test:**
- ✅ `packages/ui/src/tutorial/runtime/__tests__/ILSProvider.test.tsx` - Updated to blocks[] (21/21 pass)

---

## PHASE B STATUS

**Investigation:** ✅ COMPLETE  
**Code Review:** ✅ COMPLETE  
**Authentication Flow:** ✅ TRACED  
**Both Routes:** ✅ VERIFIED IDENTICAL  
**Fresh Browser Test:** ⏳ **REQUIRED**  
**Root Cause:** ⏳ **PENDING EVIDENCE**  
**Fix Applied:** ❌ **BLOCKED** (need current runtime proof of issue)

---

## IMPORTANT NOTES

1. **Earlier 401 evidence predates cache clear + restart**
2. **Cannot assume issue persists without fresh test**
3. **Both routes use identical authentication pattern**
4. **ILSProvider correctly uses credentials: 'include'**
5. **Test fixtures fixed (21/21 pass) - separate from browser issue**
6. **Strict blockId + blockVersion matching preserved**

---

**Phase A:** ✅ COMPLETE (21/21 tests pass)  
**Phase B:** ⏳ **BLOCKED ON FRESH BROWSER EVIDENCE**  
**Phase C:** ⏳ NOT STARTED

**CRITICAL:** Need user to test tutorial page in browser with DevTools open and report:
- Network tab: navigation request status
- Server terminal: authentication logs
- Console: ILSProvider debug output
