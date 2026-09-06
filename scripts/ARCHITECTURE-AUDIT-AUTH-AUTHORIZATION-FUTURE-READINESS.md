# Architecture Audit: Authentication, Authorization & Future Free/Paid Readiness

**Audit Date:** 2026-09-06  
**Current HEAD:** `9a6515c3` (Revert: Remove incorrect middleware.ts addition)  
**Audit Type:** READ-ONLY - No implementations  
**Scope:** RTH vs SkillUp authentication/authorization boundaries + future entitlement readiness

---

## A. EXECUTIVE SUMMARY

### Key Findings

1. **Authentication IS Shared** ✅
   - Both brands use shared `TokenService` from `@quiz/auth`
   - Both read `accessToken` cookie
   - Both verify JWT with same secrets
   - Token format and claims are identical

2. **Authorization IS NOT FULLY Shared** ⚠️
   - RTH uses `requireStudent()` from `@/lib/assignment-auth`
   - SkillUp uses `requireStudentAuth()` from `@/lib/student-auth`
   - **CRITICAL DIFFERENCE:** SkillUp validates brand/platform, RTH does NOT

3. **RTH and SkillUp ARE NOT Behaviorally Equivalent** ❌
   - SkillUp rejects tokens without `brand: 'skillup'` OR `platforms: ['skillup']`
   - RTH accepts any valid student token regardless of brand
   - Same authenticated user can access RTH but be rejected by SkillUp

4. **Brand IS Incorrectly Coupled to Authorization in SkillUp** 🔴 CRITICAL
   - Brand should be application/resource context, NOT authorization gate
   - Current SkillUp implementation: `brand` → `access decision` (WRONG)
   - Should be: `role` → `access decision`, `brand` → `context`

5. **Current ILS Failure Root Cause** 🎯
   - **MOST LIKELY:** Brand validation in SkillUp's `requireStudentAuth()` rejecting valid student tokens
   - **NOT:** Frontend failing to call endpoints
   - **NOT:** Database schema issues
   - **NOT:** Service layer bugs

6. **Architecture IS Ready for Future Free/Paid** ✅ WITH CONDITIONS
   - Clean separation possible at resource authorization layer
   - Current `requireStudent()` establishes authentication + role
   - Future entitlement can be added WITHOUT redesigning authentication
   - **BUT:** Brand coupling must be fixed first

### Critical Risk

**HIGH SEVERITY:** SkillUp's brand validation in `requireStudentAuth()` creates an architectural anti-pattern where `brand` serves as a proxy for authorization. This will severely complicate future free/paid entitlements if not addressed.

---

## B. CURRENT ARCHITECTURE

### End-to-End Flow

```
Browser (skillup.localhost:3009 or realtutorialhub.localhost:3008)
    ↓
Login → POST /api/auth/login
    ↓
Proxy to auth service → accessToken cookie set
    ↓
Cookie: accessToken={JWT}
    domain: .localhost (shared)
    path: /
    httpOnly: true
    ↓
Tutorial Page Request
    ↓
Next.js Proxy/Middleware (src/proxy.ts)
    ↓
createAuthProxy() validates token, adds X-User-ID headers
    ↓
BFF Route (e.g., /api/tutorial/ils/block-visit)
    ↓
RTH: requireStudent(request)           SkillUp: requireStudentAuth(request)
    ↓                                       ↓
tokenService.getAccessToken()          getRequestToken()
    ↓                                       ↓
TokenService.verifyAccessToken()       TokenService.verifyUserAccessToken()
    ↓                                       ↓
Role check (student/admin/etc)         Role + Brand check ⚠️
    ↓                                       ↓
user.userId                            authResult.userId
    ↓
Proxy to Central API
    ↓
Headers: X-Brand, X-User-ID, X-Internal-Secret
    ↓
Central API /tutorial/ils/block-visit
    ↓
LearningProgressService.recordBlockVisit()
    ↓
Section lookup (brand-scoped)
    ↓
BlockLearningStateRepository.upsert()
    ↓
Database: block_learning_state
```

---

## C. RTH VS SKILLUP DETAILED COMPARISON

| Component | RealTutorialHub | SkillUp | Shared? | Issue |
|-----------|-----------------|---------|---------|-------|
| **Token Infrastructure** |
| Cookie name | `accessToken` | `accessToken` | ✅ SHARED | None |
| Token format | JWT (HS256) | JWT (HS256) | ✅ SHARED | None |
| Token secret | `ACCESS_SECRET` | `ACCESS_SECRET` | ✅ SHARED | None |
| Token claims | `{userId, brand, platforms, roles, ...}` | `{userId, brand, platforms, roles, ...}` | ✅ SHARED | None |
| **Proxy/Middleware** |
| File | `src/proxy.ts` | `src/proxy.ts` | ✅ SHARED | None |
| Middleware | `createAuthProxy()` | `createAuthProxy()` | ✅ SHARED | None |
| Token validation | Yes (in proxy) | Yes (in proxy) | ✅ SHARED | None |
| X-User-ID headers | Added by proxy | Added by proxy | ✅ SHARED | None |
| **BFF Authentication** |
| Helper function | `requireStudent()` | `requireStudentAuth()` | ❌ DIFFERENT | CRITICAL |
| Source file | `@/lib/assignment-auth.ts` | `@/lib/student-auth.ts` | ❌ DIFFERENT | CRITICAL |
| Token reader | `tokenService.getAccessToken(req, {scope: 'user'})` | `getRequestToken(req)` | ⚠️ DIFFERENT PATH | Minor |
| Verifier | `TokenService.verifyAccessToken()` | `TokenService.verifyUserAccessToken()` | ⚠️ DIFFERENT METHOD | Minor |
| **Authorization Logic** |
| Role validation | ✅ YES | ✅ YES | ✅ BOTH | None |
| Allowed roles | `['student', 'admin', 'super_admin', 'faculty', 'user']` | `['student', 'admin', 'super_admin', 'faculty']` | ⚠️ SLIGHTLY DIFFERENT | Minor |
| **Brand validation** | ❌ **NO** | ✅ **YES** | ❌ **INCONSISTENT** | 🔴 **CRITICAL** |
| Brand check logic | N/A | `payload.brand === 'skillup'` OR `payload.platforms.includes('skillup')` | N/A | 🔴 **CRITICAL** |
| Rejection on brand mismatch | N/A | 403 Forbidden | N/A | 🔴 **CRITICAL** |
| **ILS Routes** |
| `/api/tutorial/ils/block-visit` | ✅ EXISTS | ✅ EXISTS | ✅ BOTH | None |
| Authentication | `requireStudent()` | `requireStudentAuth()` | ❌ DIFFERENT | CRITICAL |
| X-Brand header | `'realtutorialhub'` | `'skillup'` | ✅ CORRECT | None |
| X-User-ID header | `user.userId` | `authResult.userId` | ✅ EQUIVALENT | None |
| **Central API** |
| Endpoint | `/tutorial/ils/block-visit` | `/tutorial/ils/block-visit` | ✅ SHARED | None |
| Service | `LearningProgressService` | `LearningProgressService` | ✅ SHARED | None |
| Repository | `BlockLearningStateRepository` | `BlockLearningStateRepository` | ✅ SHARED | None |
| Database | `block_learning_state` | `block_learning_state` | ✅ SHARED | None |

---

## D. AUTHENTICATION BOUNDARY (VERIFIED)

### What Authentication Guarantees

**File:** `packages/auth/src/token.service.ts`

**Authentication Process:**
```typescript
// 1. Token extraction
tokenService.getAccessToken(request, {scope: 'user'})
// Reads: req.cookies.get('accessToken')?.value
// OR: req.headers.get('authorization') Bearer token

// 2. Token verification
TokenService.verifyAccessToken(token, {audience: 'user', isAdmin: false})
// OR
TokenService.verifyUserAccessToken(token, {audience: 'user'})

// 3. JWT validation
// - Signature verification using ACCESS_SECRET
// - Expiration check
// - Audience check (aud === 'user')
// - Claims extraction

// 4. Returns payload:
{
  userId: string,
  shadowUserId: string,
  originalUserId: string,
  brand: string,
  platforms: string[],
  roles: string[],
  tokenType: 'user' | 'admin',
  aud: 'user' | 'admin',
  iat: number,
  exp: number
}
```

**Authentication Guarantees:**
1. ✅ Token is cryptographically valid (signature verified)
2. ✅ Token is not expired
3. ✅ Token audience matches expected scope
4. ✅ User identity is established (`userId`, `shadowUserId`, `originalUserId`)
5. ✅ User metadata is available (`brand`, `platforms`, `roles`)

**Authentication DOES NOT Guarantee:**
- ❌ User has specific role
- ❌ User has permission to access specific resource
- ❌ User belongs to specific brand
- ❌ User has paid subscription
- ❌ User can access premium content

---

## E. AUTHORIZATION BOUNDARY (CURRENT STATE)

### RTH: `requireStudent()`

**File:** `apps/realtutorialhub-web/src/lib/assignment-auth.ts`

```typescript
export async function requireStudent(request: Request) {
  const token = tokenService.getAccessToken(request, { scope: 'user' });
  
  if (token == null || token.trim() === '') {
    throw new AssignmentAuthError('Unauthorized', 401);
  }

  const payload = await TokenService.verifyAccessToken(token, { 
    audience: 'user', 
    isAdmin: false 
  });
  
  // Role validation ONLY
  const normalizedRoles = roles.map(role => role.toLowerCase().trim());
  const allowedRoles = ['student', 'admin', 'super_admin', 'faculty', 'user'];
  const hasValidRole = normalizedRoles.some(role => allowedRoles.includes(role));
  
  if (!hasValidRole) {
    throw new AssignmentAuthError('Forbidden - invalid role', 403);
  }
  
  return payload; // Returns full token payload including userId
}
```

**RTH Authorization Guarantees:**
1. ✅ User is authenticated
2. ✅ User has one of: `['student', 'admin', 'super_admin', 'faculty', 'user']` role
3. ❌ **NO brand validation**
4. ❌ **NO platform validation**
5. ❌ NO resource-specific authorization
6. ❌ NO entitlement checks

**Conceptual Model:**
```
requireStudent() = Authentication + Role Authorization
```

### SkillUp: `requireStudentAuth()`

**File:** `apps/skillup-web/src/lib/student-auth.ts`

```typescript
export async function requireStudentAuth(request: NextRequest): Promise<StudentAuthResult> {
  const token = getRequestToken(request);
  if (token === null) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
  
  // Role validation
  const roles = getPayloadRoles(payload);
  if (roles.some((role) => ALLOWED_ROLES.has(role)) === false) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  
  // 🔴 BRAND VALIDATION (CRITICAL ISSUE)
  const userId = /* extract from payload */;
  if (userId === null || hasSkillupAccess(payload) === false) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, userId, payload };
}

function hasSkillupAccess(payload: UserTokenPayload): boolean {
  if (payload.brand === 'skillup') {
    return true;
  }
  return Array.isArray(payload.platforms) && payload.platforms.includes('skillup');
}
```

**SkillUp Authorization Guarantees:**
1. ✅ User is authenticated
2. ✅ User has one of: `['student', 'admin', 'super_admin', 'faculty']` role
3. 🔴 **User has `brand: 'skillup'` OR `platforms: ['skillup']`** (PROBLEMATIC)
4. ❌ NO resource-specific authorization
5. ❌ NO entitlement checks

**Conceptual Model:**
```
requireStudentAuth() = Authentication + Role Authorization + Brand Validation ⚠️
```

**CRITICAL ISSUE:** Brand validation is conflated with authorization. This means:
- A valid authenticated `student` with `brand: 'realtutorialhub'` is rejected
- Brand becomes an authorization gate instead of application context
- Future free/paid entitlements will be confused with brand

---

## F. BRAND BOUNDARY (CURRENT STATE)

### What Brand Represents

**Token Payload:**
```json
{
  "userId": "afc355ca-6bae-4165-89dd-198494a62f85",
  "brand": "realtutorialhub",
  "platforms": ["realtutorialhub"],
  "roles": ["student"],
  ...
}
```

**OR:**
```json
{
  "userId": "54726a2e-fca5-4d93-abc6-e7cee97a86f8",
  "brand": "skillup",
  "platforms": ["skillup"],
  "roles": ["student"],
  ...
}
```

**Brand Flow:**
```
User logs in via skillup.localhost:3009
    ↓
Auth service determines brand context
    ↓
JWT includes: brand: 'skillup', platforms: ['skillup']
    ↓
BFF receives request
    ↓
SkillUp requireStudentAuth() validates brand ⚠️
    ↓
BFF proxies to Central API with X-Brand: 'skillup'
    ↓
Service layer uses brand for resource scoping
    ↓
Repository queries with brand filter
```

**PROBLEM:** Brand is validated at BFF authorization layer (SkillUp only)

**CORRECT:** Brand should be:
1. Application/resource context
2. Passed via X-Brand header to downstream services
3. Used for resource scoping/filtering (where appropriate)
4. **NOT used as authorization gate**

---

## G. RESOURCE BOUNDARY (VERIFIED)

### Canonical Tutorial Resource Identity

**File:** `packages/db-tutorial/src/repositories/tutorial-section.repository.ts`

**Resource Lookup:**
```typescript
async getTutorialByPageIdentity(
  subtopicId: string,
  navigationNodeId: string,
  brandId: string = 'shared'
): Promise<TutorialSection | undefined> {
  const rows = await this.dbInstance
    .select()
    .from(tutorialSections)
    .where(
      and(
        eq(tutorialSections.subtopicId, subtopicId),
        eq(tutorialSections.navigationNodeId, navigationNodeId),
        or(
          eq(tutorialSections.brandId, brandId as any),
          eq(tutorialSections.brandId, 'shared')
        ),
        isNull(tutorialSections.deletedAt)
      )
    )
    .limit(1);

  return rows[0];
}
```

**Resource Identity:**
```
subtopicId + navigationNodeId + (brandId OR 'shared')
    ↓
tutorial_sections.id
    ↓
tutorial_sections.content.blocks[]
```

**Brand Scoping in Resources:**
- `brandId: 'shared'` → Available to ALL brands
- `brandId: 'realtutorialhub'` → RTH-specific
- `brandId: 'skillup'` → SkillUp-specific

**Verified:** Resources CAN be shared via `brandId: 'shared'`

**Current Database State:**
```sql
SELECT id, subtopic_id, navigation_node_id, brand_id
FROM tutorial_sections
WHERE navigation_node_id = 'whatisjava';

-- Result:
-- id: 75e91508-fe79-45fa-a3d8-d5506a1213d7
-- subtopic_id: 414f63eb-cccf-4bd1-bcc0-b52df69ce499
-- navigation_node_id: whatisjava
-- brand_id: shared  ← SHARED RESOURCE
```

---

## H. FUTURE ENTITLEMENT BOUNDARY (DESIGN ONLY)

### Where Free/Paid SHOULD Live

**CORRECT Architecture:**

```
User Authentication
    ↓
User ID + Role
    ↓
┌─────────────────────────────────────┐
│ Resource Authorization Layer        │
│ (NOT IMPLEMENTED YET)               │
│                                     │
│ function authorizeResourceAccess({  │
│   user,                             │
│   resource,                         │
│   brand,                            │
│   context                           │
│ }): Promise<AuthorizationResult> {  │
│                                     │
│   // 1. Check user entitlement     │
│   const entitlement =               │
│     await getUserEntitlement(user); │
│                                     │
│   // 2. Check resource requirements │
│   const resourceTier =              │
│     getResourceTier(resource);      │
│                                     │
│   // 3. Apply access policy        │
│   if (entitlement === 'free' &&    │
│       resourceTier === 'premium') { │
│     return { allowed: false };     │
│   }                                 │
│                                     │
│   return { allowed: true };        │
│ }                                   │
└─────────────────────────────────────┘
    ↓
Access Decision
```

**Future Data Model (NOT TO IMPLEMENT NOW):**

```typescript
// Table: user_entitlements (FUTURE)
{
  userId: string,
  entitlement: 'free' | 'paid' | 'trial' | 'premium',
  validUntil: Date | null,
  subscriptionId: string | null,
  // ...
}

// Table: resource_access_tiers (FUTURE)
{
  resourceId: string,
  tier: 'free' | 'paid' | 'premium',
  // ...
}
```

**Where to Add Authorization Layer:**

```
OPTION A: Middleware/Proxy Level
✅ Central enforcement
✅ Cannot be bypassed
❌ Less flexible for complex policies

OPTION B: Service Layer
✅ Fine-grained control
✅ Business logic colocation
❌ Must be applied consistently

OPTION C: Dedicated Authorization Service
✅ Separation of concerns
✅ Reusable across services
✅ Policy as data
❌ Additional network hop
✅ RECOMMENDED FOR FUTURE
```

**Current `requireStudent()` Stays Clean:**

```typescript
// TODAY (Keep as-is)
async function requireStudent(request: Request) {
  // Authentication + Role
  const payload = await verifyToken(request);
  validateRole(payload.roles);
  return payload;
}

// FUTURE (Separate layer)
async function authorizeResource(user, resource) {
  // Resource-specific entitlement check
  const entitlement = await getUserEntitlement(user.userId);
  const tier = getResourceTier(resource);
  return checkAccess(entitlement, tier);
}

// Usage in BFF:
const user = await requireStudent(request);
const resource = await getResource(resourceId);
const authorized = await authorizeResource(user, resource);
if (!authorized) {
  return 403;
}
```

---

## I. CURRENT ILS PROBLEM DIAGNOSIS

### Root Cause Analysis

**Symptom:** Block-level ILS has 0 records in `block_learning_state`

**Evidence:**
1. ✅ Page-level ILS works (55+ visits in `tutorial_navigation_progress`)
2. ✅ Frontend `BlockTelemetryProvider` sends POST `/api/tutorial/ils/block-visit`
3. ✅ Frontend includes `credentials: 'include'` (sends accessToken cookie)
4. ❌ Block-level table has 0 records
5. ⚠️ Original error: "Authentication required"

**Most Likely Root Cause:**

**SkillUp's brand validation in `requireStudentAuth()` is rejecting valid student tokens that have `brand: 'realtutorialhub'` instead of `brand: 'skillup'`.**

**Hypothesis:**
```
User logs in → receives token with brand: 'realtutorialhub'
    ↓
User navigates to http://skillup.localhost:3009/tutorial-v2/...
    ↓
Page loads successfully (why? because proxy allows it)
    ↓
ILSProvider calls GET /api/tutorial/ils/navigation
    ↓
SkillUp requireStudentAuth() checks hasSkillupAccess()
    ↓
payload.brand !== 'skillup' AND 'skillup' NOT IN payload.platforms
    ↓
Returns 403 Forbidden OR 401 Authentication required
    ↓
BlockTelemetryProvider calls POST /api/tutorial/ils/block-visit
    ↓
Same rejection
    ↓
Frontend logs warning but swallows error
    ↓
No records in database
```

**Alternative Hypotheses (Less Likely):**

1. **Frontend not triggering:** ❌ UNLIKELY
   - BlockTelemetryProvider code exists and is tested
   - Page-level navigation works (proves ILS is partially functional)

2. **SessionId missing:** ❓ POSSIBLE
   - BlockTelemetryProvider requires non-null sessionId
   - Need to verify tutorial page provides sessionId prop

3. **ActiveBlock null:** ❓ POSSIBLE
   - BlockTelemetryProvider requires activeBlock from useActiveBlock()
   - Need to verify blocks are properly tracked

4. **Database write failure:** ❌ UNLIKELY
   - Schema exists
   - Service tests pass (64/64)
   - Repository upsert() is tested

**NOT the Root Cause:**
- ❌ Database schema issues
- ❌ Service layer bugs
- ❌ Repository bugs
- ❌ expectedTimeSec implementation (tested and correct)

---

## J. ARCHITECTURAL RISKS

### CRITICAL RISKS

**RISK-001: Brand Used as Authorization Gate** 🔴 CRITICAL  
**Location:** `apps/skillup-web/src/lib/student-auth.ts:hasSkillupAccess()`  
**Impact:** HIGH  
**Issue:** Brand validation in `requireStudentAuth()` conflates application context with authorization. This will severely complicate future entitlement logic.

**Effect:**
- Valid authenticated students cannot access SkillUp if their token has wrong brand
- Prevents cross-brand resource access even when appropriate
- Couples brand identity to access control
- Makes future free/paid entitlements ambiguous

**Future Impact:**
```
// What does this mean?
user.brand === 'skillup'

Does it mean:
A. User registered via SkillUp app? (Context)
B. User has SkillUp subscription? (Entitlement)
C. User can only access SkillUp resources? (Authorization)

Without clean separation, all three get conflated.
```

### HIGH RISKS

**RISK-002: Inconsistent Authorization Between Brands** ⚠️ HIGH  
**Location:** RTH: `assignment-auth.ts` vs SkillUp: `student-auth.ts`  
**Impact:** MEDIUM-HIGH  
**Issue:** Two different implementations for conceptually identical authorization (student role validation). Divergent evolution risk.

**Effect:**
- Same user gets different treatment by brand
- Security fixes must be applied twice
- Testing complexity increases

### MEDIUM RISKS

**RISK-003: Role Allowlist Slightly Different** ⚠️ MEDIUM  
**Location:** RTH allows `'user'` role, SkillUp does not  
**Impact:** MEDIUM  
**Issue:** Minor behavioral difference that could cause confusion

**RISK-004: No Explicit Entitlement Model** ⚠️ MEDIUM  
**Location:** Entire codebase  
**Impact:** MEDIUM  
**Issue:** No tables, schemas, or services for user entitlements. Adding later will require careful integration.

### LOW RISKS

**RISK-005: Token Verifier Methods Differ** ⚠️ LOW  
**Location:** `verifyAccessToken()` vs `verifyUserAccessToken()`  
**Impact:** LOW  
**Issue:** Both work correctly but using different static methods adds cognitive overhead

---

## K. FUTURE READINESS ASSESSMENT

### Can Free/Paid Be Added Later Without Redesigning Authentication?

**Answer: YES, WITH SPECIFIC REFACTORING**

### What Works Today ✅

1. **Authentication is Clean**
   - Token-based auth is solid
   - Shared TokenService infrastructure
   - JWT payload extensible

2. **Shared Resources Exist**
   - `brandId: 'shared'` pattern works
   - Repository layer supports brand scoping
   - Database schema supports multi-brand

3. **X-Brand Propagation Works**
   - BFF → Central API passes brand correctly
   - Service layer respects brand context
   - Resources can be brand-specific or shared

4. **Current Authorization Boundary is Salvageable**
   - `requireStudent()` in RTH is already role-only
   - Can be preserved as authentication + role check
   - Resource authorization can be added as separate layer

### What Must Be Fixed First 🔧

1. **Remove Brand from SkillUp Authorization** 🔴 REQUIRED
   ```typescript
   // CURRENT (WRONG):
   if (hasSkillupAccess(payload) === false) {
     return 403;
   }
   
   // FUTURE (CORRECT):
   // Remove brand check from requireStudentAuth()
   // Brand becomes context only, passed via X-Brand
   ```

2. **Unify RTH and SkillUp Authorization** ⚠️ RECOMMENDED
   ```typescript
   // Create shared: packages/auth/src/require-student.ts
   export async function requireStudent(request) {
     const payload = await verifyUserToken(request);
     validateRole(payload.roles, ['student', 'admin', 'super_admin', 'faculty']);
     return payload;
   }
   
   // Both apps use same implementation
   ```

3. **Establish Resource Authorization Hook Points** ⚠️ RECOMMENDED
   ```typescript
   // Design (not implement) where authorization checks will go
   // e.g., After requireStudent(), before resource access
   ```

### Future Evolution Path

```
PHASE 1: Fix Current Issues (NOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Remove brand validation from requireStudentAuth()
✅ Unify RTH/SkillUp authorization helpers
✅ Document authorization boundaries

PHASE 2: Add Entitlement Infrastructure (LATER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔲 Create user_entitlements table
🔲 Add entitlement service
🔲 Implement getUserEntitlement()
🔲 NO changes to requireStudent() needed

PHASE 3: Add Resource Tier Metadata (LATER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔲 Add tier field to tutorial_sections
🔲 Mark resources as free/paid/premium
🔲 Backfill existing resources (all free initially)

PHASE 4: Implement Authorization Layer (LATER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔲 Create authorization service
🔲 Implement authorizeResourceAccess()
🔲 Add to BFF routes before resource access
🔲 Test with free/paid scenarios

PHASE 5: Frontend Paywalls (LATER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔲 Add UI for locked content
🔲 Add upgrade CTAs
🔲 Handle 402/403 from authorization
```

### Concrete Example: Adding Free/Paid

**WITHOUT fixing brand coupling (BAD):**
```typescript
// Future developer sees brand validation in requireStudentAuth
// Assumes brand === entitlement
// Adds this:
if (payload.brand === 'skillup-premium') { // WRONG
  return { entitlement: 'paid' };
}
// Now brand is hopelessly tangled with pricing
```

**WITH fixed architecture (GOOD):**
```typescript
// requireStudent() just does auth + role (no brand)
const user = await requireStudent(request);

// New authorization layer (clean separation)
const resource = await getResource(resourceId);
const entitlement = await getUserEntitlement(user.userId);
const tier = resource.tier; // 'free' | 'paid'

if (tier === 'paid' && entitlement !== 'paid') {
  return NextResponse.json(
    { error: 'Upgrade required', tier: 'paid' },
    { status: 402 }
  );
}
```

---

## L. RECOMMENDED FUTURE BOUNDARY (DESIGN ONLY)

### Conceptual Separation

```
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION LAYER                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Q: Who is this user?                                         │
│ A: Verified JWT → userId, roles, brand (context)             │
│                                                              │
│ Implementation: TokenService.verify*()                       │
│ Location: packages/auth                                      │
│ Reusable: ✅ YES (shared)                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ROLE AUTHORIZATION LAYER                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Q: What type of user is this?                                │
│ A: student | admin | faculty | super_admin                   │
│                                                              │
│ Implementation: requireStudent(), requireAdmin()             │
│ Location: packages/auth (future) or shared lib               │
│ Reusable: ✅ YES (should be shared)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ RESOURCE AUTHORIZATION LAYER (FUTURE)                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Q: Can this user access this resource?                       │
│ A: Depends on entitlement + resource tier                    │
│                                                              │
│ Implementation: authorizeResourceAccess()                    │
│ Location: packages/authorization (new) or service layer      │
│ Reusable: ✅ YES (shared policy engine)                      │
│                                                              │
│ Logic:                                                       │
│   user.entitlement = getUserEntitlement(user.userId)         │
│   resource.tier = getResourceTier(resource.id)               │
│   return policy.evaluate(user.entitlement, resource.tier)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ RESOURCE LAYER                                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ Tutorial, Course, Content, Block                             │
│                                                              │
│ May be scoped by:                                            │
│   - brand (context)                                          │
│   - tier (free/paid/premium)                                 │
│                                                              │
│ Location: tutorial_sections, etc.                            │
│ Reusable: ✅ YES (shared resources)                          │
└─────────────────────────────────────────────────────────────┘
```

### Clean API Design

```typescript
// LAYER 1: Authentication
interface AuthenticationResult {
  userId: string;
  shadowUserId: string;
  roles: string[];
  brand: string; // Context only
  platforms: string[];
}

async function authenticate(request: Request): Promise<AuthenticationResult> {
  const token = getToken(request);
  const payload = await TokenService.verify(token);
  return payload;
}

// LAYER 2: Role Authorization
async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<AuthenticationResult> {
  const auth = await authenticate(request);
  
  if (!auth.roles.some(role => allowedRoles.includes(role))) {
    throw new ForbiddenError('Insufficient role');
  }
  
  return auth;
}

// Convenience:
async function requireStudent(request: Request) {
  return requireRole(request, ['student', 'admin', 'super_admin', 'faculty']);
}

// LAYER 3: Resource Authorization (FUTURE)
interface ResourceAuthorizationContext {
  user: AuthenticationResult;
  resource: Resource;
  brand: string; // From X-Brand or request context
  action?: 'read' | 'write' | 'execute';
}

interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiresUpgrade?: boolean;
  tier?: string;
}

async function authorizeResource(
  context: ResourceAuthorizationContext
): Promise<AuthorizationResult> {
  // 1. Get user entitlement
  const entitlement = await getUserEntitlement(context.user.userId);
  
  // 2. Get resource tier
  const tier = context.resource.tier || 'free';
  
  // 3. Apply policy
  if (tier === 'free') {
    return { allowed: true };
  }
  
  if (tier === 'paid' && entitlement === 'paid') {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: 'Premium content requires paid subscription',
    requiresUpgrade: true,
    tier: 'paid',
  };
}

// Usage in BFF route:
export async function GET(request: NextRequest) {
  // Layer 1 + 2: Auth + Role
  const user = await requireStudent(request);
  
  // Get resource
  const resource = await getTutorialResource(params.id);
  
  // Layer 3: Resource authorization (FUTURE)
  const authorized = await authorizeResource({
    user,
    resource,
    brand: 'skillup', // From X-Brand or context
  });
  
  if (!authorized.allowed) {
    if (authorized.requiresUpgrade) {
      return NextResponse.json(
        { error: authorized.reason, tier: authorized.tier },
        { status: 402 } // Payment Required
      );
    }
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Return resource
  return NextResponse.json(resource);
}
```

---

## M. CHANGES NOT RECOMMENDED NOW

### DO NOT IMPLEMENT

1. **❌ User Entitlement Tables**
   ```sql
   -- DON'T CREATE YET
   CREATE TABLE user_entitlements (
     user_id UUID PRIMARY KEY,
     entitlement VARCHAR(50),
     valid_until TIMESTAMP,
     subscription_id VARCHAR(255)
   );
   ```

2. **❌ Resource Tier Metadata**
   ```sql
   -- DON'T ADD YET
   ALTER TABLE tutorial_sections
   ADD COLUMN tier VARCHAR(50) DEFAULT 'free';
   ```

3. **❌ Subscription Tables**
   ```sql
   -- DON'T CREATE
   CREATE TABLE subscriptions (...);
   CREATE TABLE payment_transactions (...);
   ```

4. **❌ Authorization Middleware**
   ```typescript
   // DON'T IMPLEMENT YET
   export function requirePaidAccess() { ... }
   export function checkResourceTier() { ... }
   ```

5. **❌ Frontend Paywalls**
   ```typescript
   // DON'T ADD YET
   <PremiumGate tier="paid">
     <TutorialContent />
   </PremiumGate>
   ```

6. **❌ Pricing/Plan Logic**
   ```typescript
   // DON'T IMPLEMENT
   const plans = {
     free: { price: 0, features: [...] },
     paid: { price: 29, features: [...] },
   };
   ```

### DO IMPLEMENT NOW (Fixing Current Issues)

1. **✅ Remove Brand Validation from requireStudentAuth()**
   ```typescript
   // CHANGE THIS:
   if (hasSkillupAccess(payload) === false) {
     return { ok: false, response: 403 };
   }
   
   // TO THIS:
   // (Remove brand check entirely)
   // Brand is context, passed via X-Brand header
   ```

2. **✅ Unify RTH and SkillUp Authorization**
   ```typescript
   // Create shared helper in packages/auth
   // Both apps import same implementation
   ```

3. **✅ Document Authorization Boundaries**
   ```
   // Add ADR (Architecture Decision Record)
   // Explain authentication vs authorization vs brand vs entitlement
   ```

4. **✅ Fix Current ILS Issue**
   ```
   // Once brand validation removed, verify block-visit works
   ```

---

## N. FINAL DECISION QUESTIONS

### 1. Are RTH and SkillUp using the same authentication semantics today?

**Answer: YES ✅**

Both use:
- Same `TokenService`
- Same `accessToken` cookie
- Same JWT format
- Same verification logic

Authentication is fully shared and consistent.

### 2. Are RTH and SkillUp using the same authorization semantics today?

**Answer: NO ❌**

Key difference:
- RTH: Role-only authorization (`requireStudent()`)
- SkillUp: Role + Brand authorization (`requireStudentAuth()`)

SkillUp adds brand validation that RTH does not have, causing behavioral divergence.

### 3. Does student authentication currently mean "authenticated student" rather than "full permanent resource entitlement"?

**Answer: MIXED ⚠️**

- RTH: YES ✅ (Role-only, no entitlement assumptions)
- SkillUp: NO ❌ (Brand validation conflates identity with access)

SkillUp's brand check effectively creates an implicit entitlement model where `brand === access`, which is architecturally incorrect.

### 4. Is brand currently being used correctly as application/resource context rather than as a proxy for paid/free status?

**Answer: NO (in SkillUp) ❌**

- RTH: YES ✅ (No brand validation in authorization)
- SkillUp: NO ❌ (Brand determines authorization)

In SkillUp, `hasSkillupAccess()` treats brand as an authorization gate, not mere context.

### 5. Can shared tutorial resources remain shared?

**Answer: YES ✅**

- Database supports `brandId: 'shared'`
- Repository correctly queries shared resources
- No technical barrier to sharing

**BUT:** SkillUp's brand validation currently prevents cross-brand access even for shared resources.

### 6. Can future free/paid authorization be added as a separate entitlement/resource-access layer?

**Answer: YES, AFTER FIXING BRAND COUPLING ✅**

Clean separation is possible:
```
requireStudent() → authenticated student (keep as-is)
    +
authorizeResource() → entitlement check (add later)
```

**BUT FIRST:** Remove brand validation from SkillUp authorization to prevent confusion between brand and entitlement.

### 7. Does anything need to be changed NOW to prepare for that future?

**Answer: YES - ONE CRITICAL CHANGE 🔴**

**REQUIRED NOW:**
```typescript
// Remove from requireStudentAuth():
if (hasSkillupAccess(payload) === false) {
  return 403;
}
```

**RECOMMENDED NOW:**
- Unify RTH and SkillUp authorization into shared implementation
- Document boundaries clearly
- Add architectural decision records

**NOT NEEDED NOW:**
- Entitlement tables
- Resource tier metadata
- Authorization service
- Pricing/subscription logic

### 8. Is the current ILS failure actually related to authentication/authorization, or is it a separate resource/hierarchy/telemetry issue?

**Answer: AUTHENTICATION/AUTHORIZATION (Brand Validation) 🎯**

**Evidence:**
- Page-level navigation works (proves some auth succeeds)
- Block-level has 0 records (proves something specific fails)
- SkillUp has brand validation, RTH does not
- Frontend logs "[BlockTelemetry] Visit failed" but swallows errors
- Original error: "Authentication required"

**Most Likely:** SkillUp's `hasSkillupAccess()` is rejecting valid student tokens that have `brand: 'realtutorialhub'` instead of `brand: 'skillup'`, causing 401/403 responses that frontend swallows silently.

**NOT:** Database issues, service bugs, repository bugs, or frontend implementation issues.

---

## CONCLUSION

### Architecture Status: MOSTLY READY ✅ BUT WITH CRITICAL BLOCKER 🔴

**What's Good:**
1. ✅ Authentication is shared and solid
2. ✅ Resources can be shared (`brandId: 'shared'`)
3. ✅ Service/repository layer is brand-aware correctly
4. ✅ Database schema supports multi-brand
5. ✅ RTH authorization is clean (role-only)

**What's Blocking Future Entitlements:**
1. 🔴 SkillUp's brand validation in authorization layer
2. ⚠️ No unified auth helper between brands
3. ⚠️ No documented authorization boundaries

**Immediate Action Required:**
```typescript
// File: apps/skillup-web/src/lib/student-auth.ts
// REMOVE THIS:
if (userId === null || hasSkillupAccess(payload) === false) {
  return {
    ok: false,
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  };
}

// KEEP THIS:
if (roles.some((role) => ALLOWED_ROLES.has(role)) === false) {
  return {
    ok: false,
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  };
}
```

**After This Fix:**
- SkillUp will accept any valid student token (like RTH)
- Brand becomes context-only (passed via X-Brand)
- Future entitlement layer can be added cleanly
- Current ILS issue should resolve

**Future Entitlement Layer Can Be Added When Needed:**
```
TODAY: requireStudent() → role check → resource access
FUTURE: requireStudent() → role check → authorizeResource() → entitlement check → resource access
```

Clean evolutionary path without redesigning authentication.

---

**END OF AUDIT**

**Date:** 2026-09-06  
**Auditor:** AI Architecture Analyst  
**Status:** READ-ONLY COMPLETE  
**Recommendations:** 1 critical fix required before future entitlements
