# 🔍 AI AUDIT CHECKLIST — Multi-Brand Authentication System

## 📋 PROJECT CONTEXT

**Monorepo Structure:**
- `apps/api-server` — Backend API
- `apps/api-gateway` — API Gateway
- `src/share-branding` — Frontend shared across brands
- `packages/auth` — Shared auth logic

**Brands:**
- realtutorialhub
- skillup

**Goal:** Validate whether authentication system is correctly unified and production-safe.

---

## 🔍 AUDIT REQUIREMENTS

### 1️⃣ COOKIE SYSTEM (CRITICAL)

**Check if cookie middleware exists in `packages/auth`**

- [ ] File exists: `packages/auth/src/middleware/cookie.ts` OR `packages/auth/src/utils/cookie.ts`
- [ ] Exports function: `buildAuthCookie()` or `setCookie()`
- [ ] Dynamic domain per brand (e.g., `.realtutorialhub.com`, `.skillup.com`)
- [ ] `httpOnly = true` (prevents XSS)
- [ ] `secure = true` (HTTPS only)
- [ ] `sameSite = "none"` (cross-site cookies)

**Verify NO direct cookie usage:**
- [ ] Search `apps/api-server` for `res.cookies.set()` or `cookie.set()`
- [ ] Ensure all cookie setting uses shared middleware
- [ ] Login route uses `buildAuthCookie()`
- [ ] Refresh route uses `buildAuthCookie()`

**Risk Level:** 🔴 HIGH  
**Failure Mode:** Cookies not sent → redirect loop

**Expected Files:**
```
packages/auth/src/middleware/cookie.ts
apps/api-server/src/routes/auth/login.ts (uses middleware)
apps/api-server/src/routes/auth/refresh.ts (uses middleware)
```

---

### 2️⃣ FRONTEND AUTH CALLS (CRITICAL)

**Scan `src/share-branding/` for API calls**

- [ ] Centralized API client exists (e.g., `lib/api-client.ts`)
- [ ] ALL API calls use: `credentials: 'include'`
- [ ] NO raw `fetch()` without credentials
- [ ] Login call uses API client
- [ ] Refresh call uses API client
- [ ] Protected route calls use API client

**Check for violations:**
```typescript
// ❌ BAD
fetch('/api/user')

// ✅ GOOD
fetch('/api/user', { credentials: 'include' })

// ✅ BEST
apiClient.get('/user')
```

**Risk Level:** 🔴 HIGH  
**Failure Mode:** Cookies not sent → 401 errors

**Expected Files:**
```
src/share-branding/lib/api-client.ts
src/share-branding/hooks/useAuth.ts (uses apiClient)
src/share-branding/components/LoginForm.tsx (uses apiClient)
```

---

### 3️⃣ ROLE NORMALIZATION (CRITICAL)

**Check if canonical role utility exists**

- [ ] File exists: `packages/auth/src/utils/canonical-roles.ts`
- [ ] Exports: `normalizeRoles()` or `getCanonicalRoles()`
- [ ] Maps: `["user", "student"] → ["user"]`
- [ ] Maps: `["admin", "instructor"] → ["admin"]`

**Verify RBAC uses canonical roles BEFORE permission checks:**
- [ ] `hasPermission()` calls `normalizeRoles()` first
- [ ] `checkAccess()` uses canonical roles
- [ ] NO direct role checks like `role === "student"`

**Check for violations:**
```typescript
// ❌ BAD
if (user.roles.includes("student")) { ... }

// ✅ GOOD
const canonical = normalizeRoles(user.roles);
if (canonical.includes("user")) { ... }

// ✅ BEST
if (hasPermission(user, "quiz:take")) { ... }
```

**Risk Level:** 🔴 HIGH  
**Failure Mode:** RBAC inconsistency across brands

**Expected Files:**
```
packages/auth/src/utils/canonical-roles.ts
packages/auth/src/rbac/permissions.ts (uses canonical)
```

---

### 4️⃣ RBAC SINGLE SOURCE OF TRUTH (CRITICAL)

**Ensure RBAC logic exists ONLY in `packages/auth`**

- [ ] `hasPermission()` defined in `packages/auth`
- [ ] `checkAccess()` defined in `packages/auth`
- [ ] Permission definitions in `packages/auth`

**Verify NO duplicate RBAC logic in:**
- [ ] `apps/api-server` (should import from `packages/auth`)
- [ ] `src/share-branding` (should import from `packages/auth`)
- [ ] `apps/api-gateway` (should import from `packages/auth`)

**Check for violations:**
```typescript
// ❌ BAD (in api-server)
function hasPermission(user, permission) { ... }

// ✅ GOOD (in api-server)
import { hasPermission } from '@repo/auth';
```

**Risk Level:** 🟡 MEDIUM  
**Failure Mode:** Logic drift between services

**Expected Files:**
```
packages/auth/src/rbac/permissions.ts (source of truth)
apps/api-server/src/middleware/rbac.ts (imports from auth)
```

---

### 5️⃣ BRAND ISOLATION (CRITICAL)

**Verify brand extraction:**
- [ ] Brand extracted from hostname OR header
- [ ] Function: `getBrandFromHostname()` or `extractBrand()`
- [ ] Validates: `token.brand === request.brand`

**Ensure NO fallback to default brand:**
- [ ] Brand mismatch throws error
- [ ] NO `brand = brand || "default"`
- [ ] NO silent brand switching

**Check for violations:**
```typescript
// ❌ BAD
const brand = getBrand() || "realtutorialhub";

// ✅ GOOD
const brand = getBrand();
if (!brand) throw new Error("Brand required");
if (token.brand !== brand) throw new Error("Brand mismatch");
```

**Risk Level:** 🔴 HIGH  
**Failure Mode:** Cross-brand data leakage

**Expected Files:**
```
packages/auth/src/utils/brand.ts
apps/api-server/src/middleware/brand.ts
apps/api-gateway/src/middleware/brand.ts
```

---

### 6️⃣ GATEWAY VALIDATION (CRITICAL)

**Ensure gateway validates tokens:**
- [ ] Gateway validates JWT signature
- [ ] Gateway checks token expiration
- [ ] Gateway forwards roles to backend
- [ ] Gateway forwards brand via `X-Brand` header

**Verify NO route bypasses auth:**
- [ ] Public routes explicitly marked
- [ ] All other routes require auth
- [ ] NO wildcard bypass rules

**Expected Files:**
```
apps/api-gateway/src/middleware/auth.ts
apps/api-gateway/src/middleware/jwt.ts
apps/api-gateway/src/routes/index.ts (auth enforcement)
```

**Risk Level:** 🔴 HIGH  
**Failure Mode:** Unauthorized access

---

### 7️⃣ SESSION + TOKEN FLOW (CRITICAL)

**Ensure dual-token system:**
- [ ] `accessToken` (short-lived, 15min)
- [ ] `refreshToken` (long-lived, 7 days)
- [ ] Refresh endpoint exists: `/auth/refresh`

**Verify cookies used (not localStorage):**
- [ ] Tokens stored in httpOnly cookies
- [ ] NO `localStorage.setItem("token")`
- [ ] NO `sessionStorage.setItem("token")`

**Check for violations:**
```typescript
// ❌ BAD
localStorage.setItem("accessToken", token);

// ✅ GOOD
// Token automatically sent via cookie
```

**Risk Level:** 🔴 HIGH  
**Failure Mode:** XSS vulnerability

**Expected Files:**
```
apps/api-server/src/routes/auth/refresh.ts
src/share-branding/hooks/useAuth.ts (auto-refresh)
```

---

### 8️⃣ DUPLICATION CHECK (IMPORTANT)

**Ensure NO brand-specific logic duplication:**
- [ ] ONLY data differs (domains, config)
- [ ] Logic is shared and reused
- [ ] Brand config centralized

**Check for violations:**
```typescript
// ❌ BAD
if (brand === "realtutorialhub") {
  // custom login logic
} else if (brand === "skillup") {
  // duplicate login logic
}

// ✅ GOOD
const config = getBrandConfig(brand);
// shared login logic uses config
```

**Risk Level:** 🟡 MEDIUM  
**Failure Mode:** Logic drift between brands

**Expected Files:**
```
packages/auth/src/config/brands.ts (data only)
packages/auth/src/services/auth.ts (shared logic)
```

---

### 9️⃣ SECURITY TEST COVERAGE (IMPORTANT)

**Verify test scripts exist:**
- [ ] `scripts/security-tests/test-cookie-domain.js`
- [ ] `scripts/security-tests/test-cookie-flow.js`
- [ ] `scripts/security-tests/validate-rbac-parity.js`
- [ ] `scripts/security-tests/audit-auth-system.js`

**Ensure they target LIVE endpoints:**
- [ ] Tests use actual API URLs
- [ ] Tests verify cookie domain
- [ ] Tests verify credentials sent
- [ ] Tests verify RBAC consistency

**Expected Files:**
```
scripts/security-tests/audit-auth-system.js
scripts/security-tests/test-cookie-domain.js
scripts/security-tests/validate-rbac-parity.js
```

---

### 🔟 FAILURE MODES (CRITICAL)

**Identify where login → redirect loop can still happen:**

- [ ] **Missing credentials:** Frontend fetch without `credentials: 'include'`
- [ ] **Cookie domain mismatch:** Cookie set for wrong domain
- [ ] **Cookie not sent:** `sameSite` or `secure` misconfigured
- [ ] **SSR cookie loss:** Server-side rendering doesn't forward cookies
- [ ] **Brand mismatch:** Token brand ≠ request brand
- [ ] **Token expired:** No auto-refresh logic
- [ ] **Gateway strips cookies:** Proxy doesn't forward cookies

**For each failure mode, verify:**
- [ ] Detection mechanism exists
- [ ] Error logging in place
- [ ] User-friendly error message
- [ ] Recovery path defined

---

## 📊 OUTPUT FORMAT

For each section above, mark:
- ✅ **PASS** — Fully implemented and verified
- ❌ **FAIL** — Missing or broken
- ⚠️ **PARTIAL** — Exists but incomplete

### Example Output:

```
1️⃣ COOKIE SYSTEM
   ✅ PASS — Cookie middleware exists
   ✅ PASS — httpOnly, secure, sameSite configured
   ❌ FAIL — Direct cookie usage in apps/api-server/src/routes/legacy.ts:42
   
   Risk Level: HIGH
   Files to Fix:
   - apps/api-server/src/routes/legacy.ts:42
     Replace: res.cookies.set("token", token)
     With: buildAuthCookie(res, token, brand)
```

---

## 🎯 FINAL VERDICT

After completing all checks:

**PRODUCTION READY** ✅
- All critical checks pass
- ≤2 warnings
- No high-risk failures

**NEEDS REVIEW** ⚠️
- 1-2 critical failures
- 3-5 warnings
- Clear fix path

**NOT PRODUCTION READY** 🚨
- ≥3 critical failures
- Architectural issues
- Requires redesign

---

## 🚀 NEXT STEPS

1. **Run automated audit:**
   ```bash
   node scripts/security-tests/audit-auth-system.js
   ```

2. **Fix critical issues first:**
   - Cookie middleware
   - API client credentials
   - Canonical roles

3. **Address warnings:**
   - RBAC duplication
   - Brand isolation edge cases

4. **Add CI enforcement:**
   - Fail build on critical issues
   - Block PR merge on failures

5. **Document findings:**
   - Update DEPLOYMENT-READY.md
   - Add to DEPLOY-CHECKLIST.md

---

## 📝 AUDIT NOTES

**Date:** _____________  
**Auditor:** _____________  
**Verdict:** _____________  

**Critical Issues Found:**
1. 
2. 
3. 

**Warnings:**
1. 
2. 
3. 

**Recommended Actions:**
1. 
2. 
3. 

**Sign-off Required:** [ ] Tech Lead [ ] Security [ ] DevOps
