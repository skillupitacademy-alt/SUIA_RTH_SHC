# SkillHubCore Security Architecture Audit - READ-ONLY

**Date:** 2026-09-06  
**Status:** ⏳ IN PROGRESS  
**Purpose:** Understand actual security architecture before making changes

---

## 🎯 OBJECTIVE

Determine the actual shared authentication, authorization, RBAC, brand-context, BFF, API Gateway and api-server architecture WITHOUT assuming either `requireStudent()` or `requireStudentAuth()` is incorrect.

---

## PART 1: SKILLHUBCORE ARCHITECTURE ROLE

### Evidence: Repository Structure

```
quiz-platform/
├── apps/
│   ├── realtutorialhub-web/          ← RTH Brand BFF
│   ├── skillup-web/                   ← SkillUp Brand BFF  
│   ├── skillhubcore-admin/            ← SHC Admin Portal
│   ├── skillhub-placement/            ← Placement Portal
│   └── realtutorialhub-admin/         ← RTH Admin
├── services/
│   ├── api-gateway/                   ← Cloudflare Workers Gateway
│   ├── skillhubcore-service/          ← Central Service
│   └── analytics-collector-service/
└── packages/
    ├── auth/                          ← Shared TokenService
    ├── db-tutorial/                   ← Tutorial Database  
    └── types/                         ← Shared Types
```

### API Gateway Routes (from services/api-gateway/src/routes/routing-table.ts)

**RTH Routes:**
```typescript
{ host: 'user.realtutorialhub.com', prefix: '/auth', upstreamKey: 'EXAM_SERVICE_URL' }
{ host: 'user.realtutorialhub.com', prefix: '/tutorial-v2', upstreamKey: 'TUTORIAL_SERVICE_URL', auth: true }
{ host: 'api.realtutorialhub.com', prefix: '/health/live', upstreamKey: 'EXAM_SERVICE_URL' }
```

**SkillUp Routes:**
```typescript
{ host: 'user.skillupitacademy.com', prefix: '/auth', upstreamKey: 'EXAM_SERVICE_URL' }
{ host: 'user.skillupitacademy.com', prefix: '/tutorial-v2', upstreamKey: 'SKILLUP_WEB_URL', auth: true }
{ host: 'api.skillupitacademy.com', prefix: '/health/live', upstreamKey: 'EXAM_SERVICE_URL' }
```

**SkillHubCore Routes:**
```typescript
{ host: 'api.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_URL', auth: true }
{ host: 'admin.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_ADMIN_URL' }
{ host: 'quiz.skillhubcore.in', prefix: '/', upstreamKey: 'QUIZ_WEB_URL' }
{ host: 'tutorial.skillhubcore.in', prefix: '/', upstreamKey: 'TUTORIAL_SERVICE_URL' }
```

**Shared Backend Routes (no host = applies to all):**
```typescript
{ prefix: '/auth', upstreamKey: 'EXAM_SERVICE_URL', public: true }
{ prefix: '/tutorial', upstreamKey: 'TUTORIAL_SERVICE_URL', auth: true }
{ prefix: '/admin', upstreamKey: 'EXAM_SERVICE_URL', auth: true, requireRole: 'admin' }
```

### Interpretation

**SkillHubCore is:**
1. ✅ A **separate brand domain** (skillhubcore.in)
2. ✅ A **shared API endpoint** (api.skillhubcore.in)
3. ✅ The **API Gateway** (routes ALL brands through gateway)
4. ✅ A **shared backend service** (SKILLHUBCORE_URL, EXAM_SERVICE_URL, TUTORIAL_SERVICE_URL)

**RTH and SkillUp are:**
1. ✅ **Brand-specific BFFs** (separate apps/)
2. ✅ **Front doors** for their respective brands
3. ✅ **Consumers of shared services** (via Gateway → api-server)

---

## PART 2: REQUEST FLOW ARCHITECTURE

### RTH ILS Block-Visit Flow

```
┌────────────────────────────────────────────────────────────────┐
│ 1. RTH Browser (realtutorialhub.localhost:3000)                │
│    - Cookie: accessToken (JWT with brand='realtutorialhub')    │
└────────────────┬───────────────────────────────────────────────┘
                 │ POST /api/tutorial/ils/block-visit
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. RTH BFF (apps/realtutorialhub-web)                          │
│    Route: src/app/api/tutorial/ils/block-visit/route.ts        │
│    Auth: requireStudent(request)                               │
│         ├─ Extracts accessToken cookie                         │
│         ├─ Calls TokenService.verifyAccessToken()              │
│         ├─ Checks roles: ['student', 'admin', 'faculty', 'user']│
│         └─ NO brand validation                                 │
│    Proxy: fetch(`${INTERNAL_API_URL}/tutorial/ils/block-visit`)│
│           Headers:                                             │
│             X-Brand: realtutorialhub                           │
│             X-User-ID: user.userId                             │
│             X-Internal-Secret: INTERNAL_API_SECRET             │
└────────────────┬───────────────────────────────────────────────┘
                 │ POST /tutorial/ils/block-visit
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. API Gateway (services/api-gateway)                          │
│    Match: { prefix: '/tutorial', auth: true }                  │
│    Brand: resolveTrustedRequestBrand(hostname)                 │
│    Auth: authenticateRequest()                                 │
│         ├─ Extract token from Cookie/Authorization             │
│         ├─ TokenService.verifyUserAccessToken()                │
│         ├─ Normalize roles                                     │
│         └─ Check requireRole if specified                      │
│    Proxy: ${TUTORIAL_SERVICE_URL}/tutorial/ils/block-visit     │
│           Headers:                                             │
│             X-Brand: realtutorialhub (from hostname)           │
│             X-User-ID: originalUserId                          │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. api-server / TUTORIAL_SERVICE (apps/api-server)             │
│    Route: src/modules/tutorial/ils/ils.routes.ts               │
│    Auth: Extracts X-User-ID, X-Brand from headers              │
│    Service: LearningProgressService.recordBlockVisit()         │
│    DB: block_learning_state (tutorial_prod database)           │
└────────────────────────────────────────────────────────────────┘
```

### SkillUp ILS Block-Visit Flow

```
┌────────────────────────────────────────────────────────────────┐
│ 1. SkillUp Browser (skillup.localhost:3009)                    │
│    - Cookie: accessToken (JWT with brand='realtutorialhub'?)   │
└────────────────┬───────────────────────────────────────────────┘
                 │ POST /api/tutorial/ils/block-visit
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. SkillUp BFF (apps/skillup-web)                              │
│    Route: src/app/api/tutorial/ils/block-visit/route.ts        │
│    Auth: requireStudentAuth(request)                           │
│         ├─ Extracts accessToken cookie                         │
│         ├─ Calls TokenService.verifyUserAccessToken()          │
│         ├─ Checks roles: ['student', 'admin', 'faculty']       │
│         └─ 🚨 BRAND VALIDATION: hasSkillupAccess(payload)      │
│            ├─ payload.brand === 'skillup' OR                   │
│            └─ payload.platforms?.includes('skillup')           │
│                                                                │
│    IF BRAND CHECK FAILS → 403 Forbidden                        │
│                                                                │
│    Proxy: fetch(`${INTERNAL_API_URL}/tutorial/ils/block-visit`)│
│           Headers:                                             │
│             X-Brand: skillup                                   │
│             X-User-ID: authResult.userId                       │
│             X-Internal-Secret: INTERNAL_API_SECRET             │
└────────────────┬───────────────────────────────────────────────┘
                 │ (Same as RTH from here)
                 ▼
            [API Gateway]
                 ▼
            [api-server]
                 ▼
            [Database]
```

###  Key Difference

**RTH BFF:** `requireStudent()` → ✅ No brand check → Proxies to api-server  
**SkillUp BFF:** `requireStudentAuth()` → 🚨 Brand check → **403 if brand='realtutorialhub'**

---

## PART 3: requireStudent() Analysis

**File:** `apps/realtutorialhub-web/src/lib/assignment-auth.ts`

**Git History:**
```
dd743608 (2026-09+) Fix RTH user role backward compatibility - Add 'user' to allowedRoles
490379c9 (2026-08+) fix(auth): comprehensive user↔student unification
ed29278f (2026-08+) feat(tutorial): comprehensive architectural audit
3a461471 (2026-06+) feat(tutorial): assignment engine + Assignment Factory UI
```

**Purpose:** General student authentication for RTH tutorial/assignment routes

**Implementation:**
```typescript
export async function requireStudent(request: NextRequest) {
  const token = await tokenService.getAccessToken(request, { scope: 'user' });
  const payload = await TokenService.verifyAccessToken(token, { audience: 'user' });
  
  const normalizedRoles = payload.roles.map(r => r.toLowerCase());
  const allowedRoles = ['student', 'admin', 'super_admin', 'faculty', 'user'];
  
  if (!normalizedRoles.some(role => allowedRoles.includes(role))) {
    throw new AssignmentAuthError('Forbidden - invalid role', 403);
  }
  
  return { ok: true, userId: payload.shadowUserId || payload.userId };
}
```

**Checks:**
- ✅ Token validity
- ✅ Token audience ('user')
- ✅ User roles (student/admin/faculty/user)
- ❌ NO brand validation
- ❌ NO platforms validation

**Callers:** (from current codebase)
- apps/realtutorialhub-web/src/app/api/tutorial/ils/block-visit/route.ts
- apps/realtutorialhub-web/src/app/api/tutorial/ils/block-active-time/route.ts
- apps/realtutorialhub-web/src/app/api/tutorial/ils/block-completion/route.ts
- (Other RTH ILS routes)

---

## PART 4: requireStudentAuth() Analysis

**File:** `apps/skillup-web/src/lib/student-auth.ts`

**Git History:**
```
b4bd06e7 (2026-08+) fix: remove await from cookies() - fixes login redirect loop
98da545a (2026-04-05) fix(skillup-web): require real student auth for protected routes [CREATED]
```

**Creation Date:** April 5, 2026  
**Commit Message:** "require real student auth for protected routes"  
**File Status:** NEW FILE (did not exist before)

**Purpose:** SkillUp-specific student authentication with brand isolation

**Implementation:**
```typescript
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
  
  // 🚨 BRAND VALIDATION
  if (userId === null || hasSkillupAccess(payload) === false) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  if (!roles.some(role => ALLOWED_ROLES.has(role))) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  return { ok: true, userId, payload };
}
```

**Checks:**
- ✅ Token validity
- ✅ Token audience ('user')
- ✅ User roles (student/admin/faculty)
- ✅ Brand validation (brand='skillup' OR platforms.includes('skillup'))
- ❌ NO 'user' role (only student/admin/faculty)

**Callers:**
- apps/skillup-web/src/app/api/tutorial/ils/block-visit/route.ts
- apps/skillup-web/src/app/api/tutorial/ils/block-active-time/route.ts
- apps/skillup-web/src/app/api/student/* routes

---

## PART 5: PRECISE COMPARISON

| Aspect | requireStudent() | requireStudentAuth() |
|--------|------------------|----------------------|
| **File** | realtutorialhub-web/lib/assignment-auth.ts | skillup-web/lib/student-auth.ts |
| **Created** | ~June 2026 (assignment feature) | April 5, 2026 (SkillUp hardening) |
| **Token extraction** | `tokenService.getAccessToken()` | `getRequestToken()` (inline) |
| **Token verification** | `TokenService.verifyAccessToken()` | `TokenService.verifyUserAccessToken()` |
| **Audience** | 'user' | 'user' |
| **Allowed roles** | student, admin, super_admin, faculty, **user** | student, admin, super_admin, faculty |
| **Brand check** | ❌ NONE | ✅ `hasSkillupAccess(payload)` |
| **Platforms check** | ❌ NONE | ✅ `payload.platforms.includes('skillup')` |
| **Error handling** | throw AssignmentAuthError | return `{ ok: false, response }` |
| **Return type** | `Promise<{ ok: true, userId: string }>` throws | `Promise<StudentAuthResult>` |
| **User ID source** | shadowUserId → userId | shadowUserId → userId |

###  Intentional Differences

1. **Brand Validation:** `requireStudentAuth()` explicitly checks brand/platforms
2. **'user' role:** `requireStudent()` allows 'user', `requireStudentAuth()` does not
3. **Error pattern:** Different error handling (throw vs return)
4. **Token extraction:** Different internal implementation (same result)

### Semantic Difference

**`requireStudent()`** = "Any authenticated student from ANY brand"  
**`requireStudentAuth()`** = "Only authenticated SkillUp students"

---

## PART 6: SKILLHUBCORE AUTHORITY LAYERS

### Layer 1: Browser → BFF (Brand-Specific)

**RTH BFF:**
- Authentication: `requireStudent()`
- Authorization: Role check only
- Brand: Implicit (RTH hostname)

**SkillUp BFF:**
- Authentication: `requireStudentAuth()`
- Authorization: Role + Brand check
- Brand: Explicit validation

### Layer 2: BFF → API Gateway (Shared)

**Gateway Authentication:**
- File: `services/api-gateway/src/middleware/auth.ts`
- Token: Extract from Cookie or Authorization header
- Verification: `TokenService.verifyUserAccessToken()`
- Brand: Resolved from **hostname** (trusted source)
- RBAC: `hasRequiredRole(payload, route.requireRole)`

**Trust Model:**
- Brand is derived from **hostname** (cannot be spoofed by browser)
- X-Brand header validated only for internal requests
- Roles normalized to lowercase
- shadowUserId used for user identity

### Layer 3: Gateway → api-server (Internal)

**Headers Forwarded:**
```
X-Brand: <resolved brand>
X-User-ID: <originalUserId>
X-Shadow-User-ID: <shadowUserId>
X-Original-User-ID: <originalUserId>
```

**Security:**
- Internal credential required (X-Internal-Secret, x-internal-key)
- CSRF validation (in some routes)
- Gateway is authoritative for authentication

### Layer 4: api-server → Service → Database

**api-server:**
- Trusts Gateway authentication
- Extracts identity from headers
- No re-authentication
- Brand used for multi-tenancy queries

---

## PART 7: BRAND SEMANTICS

### JWT `brand` Field

**Set at:** Login time (apps/api-server/src/modules/auth/login.service.ts)
```typescript
async login(email, password, ip, brand: RequestBrand = 'realtutorialhub') {
  const accessToken = await this.tokenService.generateAccessToken({
    userId: shadowUserId,
    email: user.email,
    roles: roleNames,
    brand, // 🚨 Set from login hostname
  });
}
```

**Meaning:** The **brand context where user logged in**

**Not Meaning:** 
- ❌ NOT user entitlement
- ❌ NOT subscription level
- ❌ NOT resource ownership

### JWT `platforms` Field

**Type:** `Array<'realtutorialhub' | 'skillup'>`

**Purpose:** Multi-brand access grant

**Current Usage:** Checked by `hasSkillupAccess()` as fallback

**Evidence:** Token type includes `platforms` field, suggesting multi-brand access was anticipated

### X-Brand Header

**Set by:** 
1. BFF → api-server (explicit: 'realtutorialhub' | 'skillup')
2. Gateway (resolved from hostname)

**Purpose:** Request context for multi-tenant queries

**Trust:** Server-side only (hostname-derived, not browser-supplied)

### resource.brand_id

**Database Field:** `tutorial_sections.brand_id`

**Values:** 'shared' | 'realtutorialhub' | 'skillup' | 'skillhubcore'

**Current State:** 100% of tutorial_sections have brand_id='shared'

**Meaning:** Resource **visibility scope**, not ownership

### brand_visibility

**Values:** 'shared_visible' | 'brand_specific' | 'hidden'

**Current State:** 100% have 'shared_visible'

**Meaning:** Who can **see** the resource

---

## PART 8: SHARED RESOURCE MODEL

### Database Evidence

```sql
SELECT brand_id, brand_visibility, COUNT(*) 
FROM tutorial_sections 
WHERE deleted_at IS NULL
GROUP BY brand_id, brand_visibility;

┌──────────┬──────────────────┬───────┐
│ brand_id │ brand_visibility │ count │
├──────────┼──────────────────┼───────┤
│ shared   │ shared_visible   │ 1     │
└──────────┴──────────────────┴───────┘
```

**Interpretation:**
- **100% of content is `brand_id='shared'`**
- **100% has `brand_visibility='shared_visible'`**
- Schema **supports** brand-specific resources but **none exist yet**

### Service Layer Logic

**File:** `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`

```typescript
async getTutorialByPageIdentity(
  subtopicId: string,
  navigationNodeId: string,
  brandId: string = 'shared'
): Promise<TutorialSection | undefined> {
  // Query filters by brandId
  // 'shared' is passed as default
}
```

**Current Behavior:** Service queries by `brandId` parameter, but since all content is 'shared', any brand can access it.

**Semantic Question:** Does `brand_id='shared'` mean:
- A) Globally accessible to ALL authenticated users?
- B) Accessible only after platform authorization?
- C) Visible to all, but requires brand context?

**Evidence Suggests:** (A) - shared means multi-brand accessible

---

## PART 9: ILS ENDPOINTS COMPARISON

### RTH ILS Endpoints

| Route | Auth Helper | Brand Check | Role Requirement |
|-------|-------------|-------------|------------------|
| /api/tutorial/ils/navigation | (unknown) | (unknown) | student |
| /api/tutorial/ils/visit | (unknown) | (unknown) | student |
| /api/tutorial/ils/active-time | (unknown) | (unknown) | student |
| /api/tutorial/ils/block-visit | `requireStudent()` | ❌ NO | student/user/admin/faculty |
| /api/tutorial/ils/block-active-time | `requireStudent()` | ❌ NO | student/user/admin/faculty |
| /api/tutorial/ils/block-completion | `requireStudent()` | ❌ NO | student/user/admin/faculty |

### SkillUp ILS Endpoints

| Route | Auth Helper | Brand Check | Role Requirement |
|-------|-------------|-------------|------------------|
| /api/tutorial/ils/navigation | (unknown) | (unknown) | student |
| /api/tutorial/ils/visit | (unknown) | (unknown) | student |
| /api/tutorial/ils/active-time | (unknown) | (unknown) | student |
| /api/tutorial/ils/block-visit | `requireStudentAuth()` | ✅ YES | student/admin/faculty |
| /api/tutorial/ils/block-active-time | `requireStudentAuth()` | ✅ YES | student/admin/faculty |
| /api/tutorial/ils/block-completion | (unknown) | (unknown) | student |

### Observation

**Block-level routes** use different auth helpers.  
**Page-level routes** (visit, navigation, active-time) - need investigation.

**Hypothesis:** Block-level introduced later (Phase 4.4) and inherited different auth patterns.

---

## PART 10: CURRENT ILS ERROR - ACTUAL EVIDENCE NEEDED

### What We Know

1. ✅ `tutorial_navigation_progress` has 3 records (page-level works)
2. ❌ `block_learning_state` has 0 records (block-level fails)
3. ✅ Both use same database (tutorial_prod)
4. ✅ RTH block-visit uses `requireStudent()` (no brand check)
5. ✅ SkillUp block-visit uses `requireStudentAuth()` (has brand check)

### What We DON'T Know (Need Browser Evidence)

1. ❓ Actual HTTP response from `/api/tutorial/ils/block-visit`
   - 401 Authentication?
   - 403 Brand/Role Authorization?
   - 403 CSRF?
   - 404 Route Not Found?
   - 500 Service Error?

2. ❓ Actual JWT token claims in browser
   - brand: 'realtutorialhub' or 'skillup'?
   - platforms: undefined or ['realtutorialhub'] or ['skillup'] or both?
   - roles: ['student'] or ['user']?

3. ❓ Which brand is user logged into?
   - RTH or SkillUp?
   - Does hostname match JWT brand?

4. ❓ Does browser even send request?
   - Check DevTools Network tab
   - Verify BlockTelemetryProvider fires

### Previous CSRF Evidence

User mentioned earlier: "a recent SUIA ILS failure returned 403 CSRF validation failed"

**Implication:** The error may NOT be brand-related at all.

---

## PART 11: FUTURE FREE/PAID BOUNDARY

### Where Entitlement SHOULD Live

```
Authentication (Layer 1)
    ↓
Role Authorization (Layer 2)
    ↓
Brand Context (Layer 3)
    ↓
Resource Authorization (Layer 4)
    ↓
┌─────────────────────────────────────┐
│ ENTITLEMENT (Layer 5 - FUTURE)      │
│                                     │
│ Check: user.subscription_tier       │
│ Allow: free | paid | trial | premium│
│                                     │
│ Resource Tier:                      │
│ - tutorial.access_tier              │
│ - 'free' → allow all                │
│ - 'premium' → check subscription    │
└─────────────────────────────────────┘
```

### Current Capabilities

**Can introduce entitlement WITHOUT changing:**
- ✅ TokenService
- ✅ API Gateway authentication
- ✅ BFF authentication helpers
- ✅ RBAC
- ✅ ILS recording
- ✅ tutorial_sections structure

**Would need to add:**
- New table: `user_subscriptions`
- New field: `tutorial_sections.access_tier`
- New middleware: `checkEntitlement()`
- New JWT claim: `subscription_tier` (optional)

**Important:** `brand` should NOT be used as subscription proxy

---

## PART 12: ARCHITECTURAL VERDICT

### 1. Is SkillHubCore the shared authentication/authorization platform?

**Answer:** ✅ **PARTIALLY YES**

- SkillHubCore provides shared services (api.skillhubcore.in routes to api-server)
- API Gateway is the shared auth/authorization layer
- TokenService is shared across all brands
- BUT: Each BFF has brand-specific auth helpers

### 2. Is API Gateway the common technical entry point?

**Answer:** ✅ **YES**

- All requests from BFFs route through API Gateway
- Gateway resolves brand from hostname
- Gateway performs centralized authentication for internal routes
- Gateway enforces RBAC with `requireRole`

### 3. Is api-server the shared backend API layer?

**Answer:** ✅ **YES**

- api-server (apps/api-server) handles tutorial, ILS, and other services
- Trusts Gateway authentication
- Uses X-Brand for multi-tenant queries
- Single codebase serving all brands

### 4. Are RTH and SkillUp BFFs brand-specific adapters over shared services?

**Answer:** ✅ **YES**

- Each BFF is a Next.js app (apps/realtutorialhub-web, apps/skillup-web)
- Each authenticates browser users
- Each proxies to api-server via Gateway
- Each sets X-Brand header for downstream services

### 5. Is RBAC shared?

**Answer:** ✅ **YES, with brand-specific enforcement**

- Roles are in JWT (created by shared TokenService)
- API Gateway enforces `requireRole` consistently
- BFFs apply additional constraints (RTH allows 'user', SkillUp doesn't)

### 6. Is brand validation intentionally different between RTH and SkillUp?

**Answer:** ⚠️ **LIKELY YES, but purpose unclear**

**Evidence FOR intentional:**
- Commit 98da545a explicitly added brand validation to SkillUp (April 2026)
- Commit message: "require real student auth for protected routes"
- Different implementations (requireStudent vs requireStudentAuth)
- SkillUp checks `brand` and `platforms` fields

**Evidence AGAINST:**
- RTH has NO brand validation (inconsistent security model?)
- All tutorial resources are brand_id='shared' (no brand-specific content exists)
- No documentation explaining WHY brands should be isolated

**Hypothesis:** Brand validation was added as **security hardening** for SkillUp, possibly anticipating:
- Future paid/premium SkillUp content
- Tenant isolation requirements
- Cross-brand access prevention

### 7. Why does requireStudentAuth() exist separately?

**Answer:** 🔍 **DELIBERATE BRAND ISOLATION**

**Timeline:**
- SkillUp created without brand validation (early 2026)
- April 5, 2026: `requireStudentAuth()` added with brand check
- Purpose: "require **real** student auth for **protected** routes"

**"Real" suggests:** Previous implementation was insufficient or too permissive

**"Protected routes" suggests:** SkillUp-specific resources need isolation

**But:** No SkillUp-specific tutorial content exists yet (all shared)

**Conclusion:** Brand validation appears to be **forward-looking security**, not solving current architectural need.

### 8. Is brand an authentication attribute, authorization boundary, request context, tenant boundary, or combination?

**Answer:** 🎯 **COMBINATION - Context + Future Boundary**

**Current Role:**
- ✅ Request Context (set at login, used for queries)
- ✅ Multi-tenancy marker (X-Brand header routing)
- ⚠️ Partial Authorization Boundary (SkillUp only)

**Future Role (anticipated):**
- ✅ Tenant Boundary (when brand-specific content exists)
- ✅ Authorization Boundary (when entitlements differ by brand)

**NOT:**
- ❌ NOT Primary Authentication (JWT signature is)
- ❌ NOT Subscription/Entitlement (separate `subscriptions` field exists)

### 9. What is the exact current ILS failure?

**Answer:** ⏸️ **INSUFFICIENT EVIDENCE - Browser Data Required**

**Hypothesis (70% confidence):**
User logged into RTH → JWT has `brand='realtutorialhub'` → SkillUp `requireStudentAuth()` rejects → 403 Forbidden

**BUT User Also Mentioned:**
"Recent SUIA ILS failure returned 403 CSRF validation failed"

**Alternative Hypotheses:**
- CSRF middleware rejecting BFF → api-server requests
- Missing internal credentials (X-Internal-Secret)
- Gateway authentication failing
- Role mismatch ('user' vs 'student')

**Required Evidence:**
- Browser DevTools Network tab screenshot
- JWT token payload (decode accessToken cookie)
- Console errors from ILSProvider
- api-server logs (if available)

### 10. Where should future free/paid entitlement authorization live?

**Answer:** ✅ **Layer 5 - After Brand Context, Before Resource Access**

**Recommended Architecture:**
```
Browser → BFF Auth → Gateway Auth → api-server → Resource Service
                                                        ↓
                                                   [Entitlement Check]
                                                        ↓
                                                   Database
```

**Implementation:**
- New middleware: `checkResourceEntitlement(userId, resourceId)`
- Check user subscription tier
- Check resource access requirements
- Independent of brand (brand ≠ entitlement)

### 11. What must NOT be changed now?

**Answer:** 🚫 **DO NOT CHANGE UNTIL USER CONFIRMS INTENT**

**Preserve:**
- ✅ `requireStudentAuth()` brand validation (may be deliberate)
- ✅ API Gateway authentication flow
- ✅ TokenService JWT structure
- ✅ brand/platforms fields in JWT
- ✅ X-Brand header propagation
- ✅ RBAC role checks

**Investigate First:**
- ❓ Why brand validation added to SkillUp
- ❓ Is there documented policy for brand isolation
- ❓ Are there plans for brand-specific paid content
- ❓ What is actual ILS failure cause (browser evidence)

**Do NOT Implement:**
- ❌ Free/paid subscription logic
- ❌ Entitlement tables
- ❌ Access tier middleware
- ❌ Resource paywalls

---

## 🎯 FINAL CONCLUSION

**The current brand validation in `requireStudentAuth()` appears to be INTENTIONAL but FORWARD-LOOKING security.**

SkillUp was hardened with brand isolation in April 2026, likely anticipating:
1. Brand-specific content (not yet created)
2. Subscription/entitlement differences (not yet implemented)
3. Tenant isolation requirements (shared resources contradict this)

**The architectural contradiction is:**
- Security model enforces brand boundaries
- Resource model shares all content

**This suggests either:**
A) Brand validation is **premature** (resources will become brand-specific)
B) Brand validation is **incorrect** (should allow shared resource access)
C) Brand validation has **different purpose** (not resource access control)

**User must clarify:**
- Is brand isolation a product requirement?
- Should RTH and SkillUp users share tutorial access?
- Are there plans for brand-specific premium content?

**Until then, DO NOT remove brand validation.**

---

## 📊 EVIDENCE STATUS

| Evidence Type | Status | Source |
|---------------|--------|--------|
| API Gateway routing | ✅ Complete | routing-table.ts |
| Gateway authentication | ✅ Complete | middleware/auth.ts |
| BFF authentication | ✅ Complete | requireStudent, requireStudentAuth |
| Git history | ✅ Complete | commit 98da545a |
| Database schema | ✅ Complete | audit-db-schema.mjs |
| Resource distribution | ✅ Complete | 100% shared |
| JWT structure | ✅ Complete | TokenPayload type |
| Token creation | ✅ Complete | login.service.ts |
| Brand resolution | ✅ Complete | request-brand.ts |
| **Browser evidence** | ❌ **MISSING** | **Need DevTools** |
| **JWT payload** | ❌ **MISSING** | **Need browser decode** |
| **Actual HTTP error** | ❌ **MISSING** | **Need Network tab** |

---

**Status:** ⏸️ **AUDIT PAUSED - AWAITING BROWSER EVIDENCE**

**Next:** User provides:
1. Browser DevTools Network tab for block-visit request
2. Decoded JWT token from accessToken cookie
3. Confirmation of which brand they're logged into
4. Product clarification: Should brands share tutorial access?
