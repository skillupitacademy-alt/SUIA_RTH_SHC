# PHASE 5 — GATE 2.1: FINAL IDENTITY VERIFICATION (CORRECTED)

**DATE:** 2026-09-03  
**STATUS:** ⚠️ GATE 2.1 VERIFIED WITH CRITICAL SECURITY FINDINGS  
**MODE:** SOURCE-LEVEL FORENSIC VERIFICATION

---

## EXECUTIVE SUMMARY

**OBJECTIVE:** Prove exact authentication identity mapping before Gate 2 implementation.

**RESULT:** ⚠️ **VERIFIED WITH CRITICAL CORRECTIONS**

```text
✅ refreshToken cookie mechanism VERIFIED
✅ Session.userId mapping PROVEN (originalUserId, NOT shadowUserId)
✅ Brand isolation mechanism VERIFIED (separate databases)
✅ Learner/Admin boundary VERIFIED (separate cookies)
❌ x-session-id trust boundary BROKEN (security flaw identified)
✅ Implementation path DEFINED with security fixes required
```

**GATE 2 AUTHORIZATION:** ⚠️ **CONDITIONAL** - May proceed with mandatory security fix for x-session-id trust boundary.

---

## CRITICAL CORRECTION #1: SESSION.USER_ID IDENTITY MAPPING

### Previous Report Claim (INCORRECT)

```text
❌ "MOST LIKELY: Session.user_id = shadowUserId"
```

### Source-Level Proof (CORRECT)

**EVIDENCE:** `apps/api-server/src/modules/auth/login.service.ts` Line 221

```typescript
await brandTokenRepo.createRefreshToken({
  userId: user.id,  // ← PROVEN: brand-specific user.id
  token: refreshTokenHash,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  deviceContext: { ... },
});
```

**WHERE `user.id` COMES FROM:**

Line 132: `const user = await brandUserRepo.findWithDetails(email);`

This returns the **brand-specific database user record** where `user.id` is the PRIMARY KEY from that brand's `users` table.

**JWT TOKEN CONTAINS THREE IDENTITIES:**

Line 187-195:
```typescript
const accessToken = await this.tokenService.generateAccessToken({
  userId: user.id,           // ← Brand-specific ID
  originalUserId: user.id,   // ← Same as userId
  shadowUserId,              // ← Unified cross-brand ID
  email: user.email,
  roles: roleNames,
  isAdmin,
  tokenType: isAdmin ? 'admin' : 'user',
  brand,
});
```

### Identity Matrix

| Identity Field | Source | Storage Location | Meaning | Used in refreshTokens.userId? |
|----------------|--------|------------------|---------|------------------------------|
| `user.id` | Brand database primary key | `{brand}_users.id` | Brand-specific user identifier | ✅ **YES** |
| `userId` (JWT) | = `user.id` | JWT payload | Same as user.id | N/A (in token) |
| `originalUserId` (JWT) | = `user.id` | JWT payload | Original brand user ID | N/A (in token) |
| `shadowUserId` (JWT) | Identity bridge sync | JWT payload | Unified cross-brand ID | ❌ **NO** |
| `refreshTokens.userId` | `user.id` | Database column | **= originalUserId** | ✅ **THIS IS IT** |

### PROVEN CONCLUSION

```text
refreshTokens.userId = originalUserId (brand-specific user.id)
                    ≠ shadowUserId (unified identity)
```

### Session Validation Logic (CORRECTED)

```typescript
// ❌ WRONG (from previous report):
if (refreshToken.userId !== authenticatedUser.shadowUserId) {
  return null;
}

// ✅ CORRECT (source-proven):
if (refreshToken.userId !== authenticatedUser.originalUserId) {
  console.error('[SESSION_USER_MISMATCH]', {
    refreshTokenUserId: refreshToken.userId,
    tokenOriginalUserId: authenticatedUser.originalUserId,
  });
  return null;
}
```

---

## CRITICAL CORRECTION #2: BRAND ISOLATION MECHANISM

### Previous Report Assumption (INCOMPLETE)

```text
⚠️ "Session.brand field must be validated"
```

### Architectural Reality (CORRECT)

**EVIDENCE:** `apps/api-server/src/modules/auth/brand-db.ts`

```typescript
export function getAuthBrandContext(brand: RequestBrand = 'realtutorialhub') {
  if (brand === 'skillup') {
    return { db: skillupDb, tables: skillupTables };
  }
  
  if (brand === 'skillhubcore') {
    return { db: defaultDb, tables: defaultTables };
  }
  
  return { db: realtutorialhubDb, tables: realtutorialhubTables };
}
```

**DATABASE SCHEMA VERIFICATION:** `packages/db/src/schema/auth.ts` Lines 84-106

```typescript
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  // ... device fields ...
  // ❌ NO brand FIELD EXISTS
});
```

### Brand Isolation Architecture

| Brand | Database Instance | refreshTokens Table | Physical Isolation |
|-------|-------------------|---------------------|-------------------|
| SkillUp | `skillupDb` | `skillup.refresh_tokens` | ✅ Separate DB |
| RTH | `realtutorialhubDb` | `realtutorialhub.refresh_tokens` | ✅ Separate DB |
| SkillHubCore | `defaultDb` (people_db) | `people.refresh_tokens` | ✅ Separate DB |

**CROSS-BRAND TOKEN LOOKUP:** ❌ **ARCHITECTURALLY IMPOSSIBLE**

A refresh token created in `skillupDb` CANNOT be found by querying `realtutorialhubDb`. Physical database separation provides implicit brand isolation.

### Brand Validation Logic (CORRECTED)

```typescript
// ❌ WRONG (from previous report):
if (session.brand !== authenticatedUser.brand) {
  return null; // session.brand field doesn't exist!
}

// ✅ CORRECT (architecture-based):
// Brand validation happens BEFORE session lookup by choosing correct database:
const brandContext = getAuthBrandContext(requestBrand);
const brandTokenRepo = tokenRepo.withDb(brandContext.db, { 
  refreshTokens: brandContext.tables.refreshTokens 
});

// Query brand-specific database
const refreshToken = await brandTokenRepo.findByHash(tokenHash);

// If found, it's guaranteed to be from the correct brand (physical isolation)
```

---

## CRITICAL FINDING #3: x-session-id TRUST BOUNDARY BROKEN

### Current Implementation (INSECURE)

**EVIDENCE:** `apps/api-server/src/proxy.ts` Line 21

```typescript
export async function proxy(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const sessionId = request.headers.get('x-session-id') ?? 'anon-' + crypto.randomUUID().slice(0, 8);
  //                 ↑ SECURITY FLAW: Trusts incoming header!
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-session-id', sessionId);
  // Forwards potentially malicious header to API
}
```

### Attack Vector

```text
Malicious Request:
  POST /api/tutorial/ils/visit
  Cookie: refreshToken=<attacker-token>
  x-session-id: <victim-session-id>  ← FORGED HEADER
        ↓
  API Gateway accepts this value
        ↓
  API routes trust x-session-id
        ↓
  Attacker's actions attributed to victim's session
```

### Current Trust Flow (BROKEN)

```text
Browser
  │ Can set x-session-id header
  ▼
BFF (authProxy)
  │ Currently: Does NOT set x-session-id
  │ Forwards whatever browser sent
  ▼
API Gateway (proxy.ts)
  │ request.headers.get('x-session-id')
  │ ❌ TRUSTS browser-provided value
  ▼
API Endpoints
  │ const sessionId = request.headers.get('x-session-id');
  │ ❌ ASSUMES this is authenticated session
  ▼
Learning State Updates
  │ Uses untrusted sessionId
  └─ ❌ SECURITY BREACH
```

### Required Secure Flow

```text
Browser
  │ Cannot control trusted headers
  ▼
BFF (authProxy) ← AUTHENTICATION BOUNDARY
  │ Read refreshToken cookie (httpOnly)
  │ Server-side session resolution
  │ Validate: userId, brand, revoked, expiry
  │ Set x-session-id from PROVEN session
  ▼
API Gateway (proxy.ts)
  │ ✅ Trusts BFF-set header (internal network)
  │ OR validates via internal secret/signature
  ▼
API Endpoints
  │ ✅ Trusts x-session-id from authenticated path
  ▼
Learning State Updates
  │ ✅ Uses validated sessionId
```

### Required Security Fixes

**1. BFF authProxy MUST set x-session-id**

```typescript
// In authProxy.ts after authentication:
const refreshToken = request.cookies.get('refreshToken')?.value;
if (refreshToken && authResult.type === 'authenticated') {
  const session = await resolveAuthenticatedSession(
    refreshToken, 
    authResult.user, 
    requestBrand
  );
  
  if (session) {
    headers.set('x-session-id', session.id);
  }
}
```

**2. API Gateway MUST NOT trust browser headers**

```typescript
// In apps/api-server/src/proxy.ts:
// ❌ REMOVE:
const sessionId = request.headers.get('x-session-id') ?? 'anon-' + crypto.randomUUID();

// ✅ REPLACE WITH:
// For authenticated routes via BFF, x-session-id is already set by authProxy
// For direct API calls (if allowed), generate fallback
const sessionId = request.headers.get('x-session-id') ?? 'anon-' + crypto.randomUUID();

// BUT: Validate that direct API calls do NOT accept x-session-id from browser
// Option A: Check for BFF signature/secret
// Option B: Clear x-session-id for non-BFF requests
// Option C: Only trust x-session-id if request came through BFF (via network boundary)
```

**3. Document trusted header propagation**

```text
TRUSTED HEADERS (set by BFF only):
  x-user-id
  x-shadow-user-id
  x-original-user-id
  x-session-id  ← NEW

UNTRUSTED (browser can set, MUST ignore):
  Any header not in trusted list
```

---

## VERIFICATION: LEARNER/ADMIN BOUNDARY

### Cookie Separation Verified

**EVIDENCE:** `packages/auth/src/middleware/cookie.middleware.ts` Line 140

```typescript
export function buildRefreshTokenCookie(token: string, brand: Brand, isAdmin = false) {
  const name = isAdmin ? 'admin_refreshToken' : 'refreshToken';
  const maxAge = isAdmin ? 24 * 60 * 60 : 7 * 24 * 60 * 60;
  return buildAuthCookie(name, token, brand, { maxAge, isAdmin });
}
```

### Cookie Properties Matrix

| Property | Learner Cookie | Admin Cookie | Isolation |
|----------|----------------|--------------|-----------|
| **Name** | `refreshToken` | `admin_refreshToken` | ✅ Different names |
| **Max Age** | 7 days | 1 day | ✅ Different lifetimes |
| **HttpOnly** | `true` | `true` | ✅ Both protected |
| **Secure** | `true` | `true` | ✅ Both HTTPS-only |
| **SameSite** | `none` | `none` | ✅ Same policy |

### authProxy Scope Verified

**EVIDENCE:** Grep search results

```text
apps/skillup-web/src/proxy.ts:
  import { createAuthProxy } from '../../../src/share-branding/middleware/authProxy';
  ✅ SkillUp learner BFF uses authProxy

apps/realtutorialhub-web/src/proxy.ts:
  import { createAuthProxy } from '../../../src/share-branding/middleware/authProxy';
  ✅ RTH learner BFF uses authProxy

apps/skillhubcore-admin/**/*.ts:
  ❌ No authProxy imports found
  ✅ SkillHubCore Admin has separate auth (excluded from learner tracking)
```

### authProxy Cookie Read Logic

**EVIDENCE:** `src/share-branding/middleware/authProxy.ts` Line 75

```typescript
export function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
  // Pattern: request.cookies.get(cookieName)?.value
}

// For session resolution (to be implemented):
const refreshToken = request.cookies.get('refreshToken')?.value;
// ✅ Reads 'refreshToken' specifically
// ✅ Will NEVER read 'admin_refreshToken' (different cookie name)
```

### Isolation Guarantee

```text
Learner Request:
  Cookie: refreshToken=<learner-token>
  Cookie: admin_refreshToken=<some-admin-token>  ← Even if present
        ↓
  authProxy reads request.cookies.get('refreshToken')
        ↓
  ✅ Only learner token is used
  ✅ Admin cookie ignored by name mismatch

Admin Request (if authProxy were used, which it's not):
  Cookie: admin_refreshToken=<admin-token>
  Cookie: refreshToken=<some-learner-token>
        ↓
  authProxy reads request.cookies.get('refreshToken')
        ↓
  ✅ Would read learner cookie (but authProxy not used for admin)
```

**CONCLUSION:** Physical cookie name separation + authProxy scope isolation = Complete learner/admin boundary.

---

## FINAL IDENTITY MATRIX

| Concept | Actual Source | Actual Value | Session Mapping | Proven? |
|---------|---------------|--------------|-----------------|---------|
| **Brand Database User ID** | `{brand}_users.id` | UUID (PK) | N/A | ✅ |
| **`user.id`** | Database query result | = Brand DB User ID | N/A | ✅ |
| **JWT `userId`** | Token generation | = `user.id` | N/A | ✅ |
| **JWT `originalUserId`** | Token generation | = `user.id` | **YES** | ✅ |
| **JWT `shadowUserId`** | Identity bridge sync | Unified UUID | **NO** | ✅ |
| **`refreshTokens.userId`** | createRefreshToken() | = `user.id` | **THIS FIELD** | ✅ |
| **Session Identity** | findByHash() result | refreshTokens record | Uses userId | ✅ |
| **Brand Isolation** | Database selection | Physical DB | Implicit | ✅ |
| **Cookie Name** | buildRefreshTokenCookie() | 'refreshToken' | Learner-only | ✅ |
| **x-session-id** | ❌ Browser-controllable | ❌ Untrusted | ❌ BROKEN | ✅ Identified |

---

## SESSION RESOLUTION LOGIC (CORRECTED)

### Pseudocode (Source-Proven)

```typescript
async function resolveAuthenticatedSession(
  refreshToken: string,
  authenticatedUser: { originalUserId: string; shadowUserId: string; brand: Brand },
  requestBrand: Brand
): Promise<{ id: string } | null> {
  
  // 1. Get brand-specific database context
  const brandContext = getAuthBrandContext(requestBrand);
  const brandTokenRepo = TokenRepository.withDb(
    brandContext.db, 
    { refreshTokens: brandContext.tables.refreshTokens }
  );
  
  // 2. Hash token and lookup (read-only)
  const tokenHash = await TokenService.hashToken(refreshToken);
  const refreshTokenRecord = await brandTokenRepo.findByHash(tokenHash);
  
  if (!refreshTokenRecord) {
    return null; // Session not found in this brand's database
  }
  
  // 3. Validate lifecycle
  if (refreshTokenRecord.revoked) {
    return null; // Session revoked
  }
  
  if (refreshTokenRecord.expiresAt < new Date()) {
    return null; // Session expired
  }
  
  // 4. Validate user identity (CRITICAL: Use originalUserId, NOT shadowUserId)
  if (refreshTokenRecord.userId !== authenticatedUser.originalUserId) {
    console.error('[SESSION_USER_MISMATCH]', {
      refreshTokenUserId: refreshTokenRecord.userId,
      tokenOriginalUserId: authenticatedUser.originalUserId,
      tokenShadowUserId: authenticatedUser.shadowUserId, // For debugging
    });
    return null; // User mismatch
  }
  
  // 5. Brand is validated by database selection (implicit)
  // No session.brand field to check - already guaranteed by physical DB isolation
  
  // 6. Return session identity
  return {
    id: refreshTokenRecord.id, // This is the trusted session ID
  };
}
```

---

## GATE 2.1 ACCEPTANCE MATRIX

| Verification | Status | Evidence |
|-------------|--------|----------|
| **Identity Mapping** | | |
| Session.userId = originalUserId | ✅ **PROVEN** | login.service.ts:221 |
| Session.userId ≠ shadowUserId | ✅ **PROVEN** | Source-level trace |
| JWT contains 3 identities | ✅ **VERIFIED** | token.service generateAccessToken() |
| **Brand Isolation** | | |
| Separate physical databases | ✅ **VERIFIED** | brand-db.ts architecture |
| No session.brand field | ✅ **VERIFIED** | schema/auth.ts L84-106 |
| Cross-brand lookup impossible | ✅ **VERIFIED** | Physical DB separation |
| **Cookie Mechanism** | | |
| refreshToken cookie exists | ✅ **VERIFIED** | cookie.middleware.ts |
| Cookie is httpOnly | ✅ **VERIFIED** | buildAuthCookie() |
| 7-day learner lifetime | ✅ **VERIFIED** | maxAge calculation |
| **Learner/Admin Boundary** | | |
| Separate cookie names | ✅ **VERIFIED** | refreshToken vs admin_refreshToken |
| authProxy scope (learners only) | ✅ **VERIFIED** | skillup-web, rth-web only |
| SkillHubCore Admin excluded | ✅ **VERIFIED** | No authProxy import |
| **Session Lifecycle** | | |
| Revocation check | ✅ **DEFINED** | refreshTokens.revoked field |
| Expiration check | ✅ **DEFINED** | refreshTokens.expiresAt field |
| Read-only lookup available | ✅ **VERIFIED** | findByHash() exists |
| validateSession side effect | ✅ **DOCUMENTED** | updateLastActivity() |
| **Trust Boundary** | | |
| x-session-id security | ❌ **BROKEN** | API trusts browser header |
| BFF session resolution | ⚠️ **NOT IMPLEMENTED** | Required for Gate 2 |
| Security fix required | ✅ **IDENTIFIED** | Clear implementation path |
| **Architecture** | | |
| Multiple sessions per user | ✅ **SUPPORTED** | deviceId tracks sessions |
| Same session across requests | ✅ **GUARANTEED** | Stable refreshToken cookie |
| Session reload stability | ✅ **GUARANTEED** | Cookie persists |

---

## GATE 2.1 STATUS DECISION

```text
┌─────────────────────────────────────────────────────┐
│ GATE 2.1 FINAL VERIFICATION                        │
├─────────────────────────────────────────────────────┤
│ Identity mapping          ✅ PROVEN                 │
│ Brand isolation           ✅ VERIFIED                │
│ Cookie mechanism          ✅ VERIFIED                │
│ Learner/Admin boundary    ✅ VERIFIED                │
│ Session lifecycle         ✅ DEFINED                 │
│ Trust boundary            ❌ BROKEN (fixable)        │
├─────────────────────────────────────────────────────┤
│ OVERALL STATUS:   ⚠️ VERIFIED WITH SECURITY FIX     │
│ GATE 2 CLEARANCE: ⚠️ CONDITIONAL AUTHORIZATION      │
└─────────────────────────────────────────────────────┘
```

### Authorization Conditions

Gate 2 implementation MAY proceed **IF AND ONLY IF**:

1. ✅ Session resolution uses `originalUserId` (NOT shadowUserId)
2. ✅ Brand validation uses database selection (NOT session.brand field)
3. ✅ authProxy sets x-session-id from server-resolved session
4. ⚠️ x-session-id trust boundary is fixed (API ignores browser-provided value)

**RECOMMENDATION:** Proceed with Gate 2 implementation. The x-session-id security fix MUST be part of the implementation, not deferred.

---

## CORRECTED IMPLEMENTATION REQUIREMENTS

### File: `src/share-branding/middleware/authProxy.ts`

**Add after authentication:**

```typescript
// After existing authentication in createAuthProxy()
if (isProtectedRoute(pathname) && authResult.type === 'authenticated') {
  
  // Resolve authenticated session
  const refreshToken = request.cookies.get('refreshToken')?.value;
  if (refreshToken) {
    const session = await resolveAuthenticatedSession(
      refreshToken,
      authResult.user,
      authResult.user.brand
    );
    
    if (session) {
      headers.set('x-session-id', session.id);
    }
  }
  
  // Continue with existing header setting...
  headers.set('x-user-id', authResult.user.shadowUserId);
  headers.set('x-shadow-user-id', authResult.user.shadowUserId);
  headers.set('x-original-user-id', authResult.user.originalUserId);
}
```

**Add helper function:**

```typescript
async function resolveAuthenticatedSession(
  refreshToken: string,
  authenticatedUser: UserPayload,
  requestBrand: Brand
): Promise<{ id: string } | null> {
  try {
    const { getAuthBrandContext } = await import('@/modules/auth/brand-db');
    const { TokenRepository } = await import('@/modules/auth/repositories/token.repository');
    const { TokenService } = await import('@/modules/auth/token.service');
    
    const brandContext = getAuthBrandContext(requestBrand);
    const brandTokenRepo = new TokenRepository(brandContext.db, {
      refreshTokens: brandContext.tables.refreshTokens
    });
    
    const tokenHash = await new TokenService().hashToken(refreshToken);
    const refreshTokenRecord = await brandTokenRepo.findByHash(tokenHash);
    
    if (!refreshTokenRecord) return null;
    if (refreshTokenRecord.revoked) return null;
    if (refreshTokenRecord.expiresAt < new Date()) return null;
    
    // CRITICAL: Compare against originalUserId, NOT shadowUserId
    if (refreshTokenRecord.userId !== authenticatedUser.originalUserId) {
      console.error('[BFF_SESSION_USER_MISMATCH]', {
        refreshTokenUserId: refreshTokenRecord.userId,
        tokenOriginalUserId: authenticatedUser.originalUserId,
      });
      return null;
    }
    
    return { id: refreshTokenRecord.id };
  } catch (error) {
    console.error('[BFF_SESSION_RESOLUTION_ERROR]', error);
    return null;
  }
}
```

### File: `apps/api-server/src/proxy.ts` (Security Fix)

**Option A: Trust internal network (simplest)**

```typescript
// Current line 21-22:
const sessionId = request.headers.get('x-session-id') ?? 'anon-' + crypto.randomUUID().slice(0, 8);

// No change needed IF:
// - API is only accessible via BFF (internal network)
// - BFF is the ONLY source that sets x-session-id
// - Direct browser → API connections are blocked by infrastructure

// Document the trust assumption:
// x-session-id is trusted because:
// 1. Set by BFF authProxy after authentication
// 2. API is not directly accessible from browser
// 3. Internal network communication
```

**Option B: Validate via internal secret (more secure)**

```typescript
// Require BFF to sign the session ID
const sessionIdHeader = request.headers.get('x-session-id');
const sessionSignature = request.headers.get('x-session-signature');

if (sessionIdHeader && validateSessionSignature(sessionIdHeader, sessionSignature)) {
  sessionId = sessionIdHeader;
} else {
  sessionId = 'anon-' + crypto.randomUUID().slice(0, 8);
}
```

**Recommendation:** Option A if infrastructure ensures BFF is the only entry point. Otherwise Option B.

---

## FINAL GATE 2.1 DECISION

```text
GATE 2.1: VERIFIED
STATUS: ⚠️ PASS WITH MANDATORY SECURITY FIX
AUTHORIZATION: Proceed to Gate 2 implementation

MANDATORY REQUIREMENTS:
1. ✅ Use originalUserId for session validation
2. ✅ Use database selection for brand validation
3. ⚠️ Implement x-session-id security fix
4. ✅ Test user/session mismatch rejection
5. ✅ Test brand mismatch rejection (via wrong DB)
6. ✅ Test revoked/expired session rejection
7. ⚠️ Test x-session-id header forgery protection

BLOCKED UNTIL:
- x-session-id trust boundary decision (Option A or B)
```

**END OF GATE 2.1 CORRECTED VERIFICATION REPORT**
