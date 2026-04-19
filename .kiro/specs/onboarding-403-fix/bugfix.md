---
type: bugfix
status: requirements
priority: critical
created: 2026-04-18
---

# Fix Authentication 403 Error - Multi-Brand CF → BFF → API

## Problem Statement

After successful login, protected routes return **403 Forbidden** at Cloudflare Worker layer:
- ✅ Signup → 200
- ✅ Login → 200  
- ❌ Onboarding → **403 Forbidden**
- ❌ Profile → **403 Forbidden**

**Impact**: Request never reaches BFF/API server. Authentication fails at edge layer.

**Affected Routes**: `/api/onboarding`, `/api/profile`, and all protected routes requiring `auth: true`

## Root Cause Analysis

Authentication failure occurs across multiple layers. Must validate ALL:

### 1. Token Content
JWT may be missing required claims:
```json
{
  "tokenType": "user",
  "brand": "realtutorialhub" | "skillup",
  "userId": "...",
  "shadowUserId": "...",
  "originalUserId": "...",
  "aud": "user"
}
```

### 2. Token Transport
Token must reach Cloudflare via:
- `Cookie: accessToken=...` OR
- `Authorization: Bearer ...`

### 3. Brand Validation
Token brand must match request brand:
- `token.brand === requestBrand` (derived from hostname)

### 4. Secret Consistency
JWT sign secret must match verify secret across all services

### 5. HTTP Semantics
- **401** → Missing/invalid token
- **403** → Valid token but wrong access (type/brand mismatch)

## Requirements

### REQ-1: Token Generation Must Include All Required Claims
**File**: `apps/api-server/src/modules/auth/login.service.ts`

Token MUST contain:
- `tokenType: 'user'` (or 'admin' for admin users)
- `brand: 'realtutorialhub' | 'skillup'` (derived from request hostname)
- `userId`, `shadowUserId`, `originalUserId`
- `aud: 'user'` (or 'admin')
- `roles: string[]`

**Acceptance Criteria**:
- [ ] All tokens include `tokenType` field
- [ ] All tokens include `brand` field matching request origin
- [ ] Brand is derived from hostname, not user input
- [ ] Debug log shows token claims on generation

### REQ-2: Cloudflare Auth Middleware Must Extract Token from Multiple Sources
**File**: `services/api-gateway/src/middleware/auth.ts`

Must check BOTH:
1. Cookie header: `accessToken=...`
2. Authorization header: `Bearer ...`

**Acceptance Criteria**:
- [ ] Extracts token from cookie if present
- [ ] Falls back to Authorization header if cookie missing
- [ ] Returns 401 if no token found (not 403)
- [ ] Returns 401 if token verification fails (not 403)

### REQ-3: Cloudflare Auth Middleware Must Validate Token Type
**File**: `services/api-gateway/src/middleware/auth.ts`

Must validate:
- `payload.tokenType === 'user'` for user portal
- `payload.tokenType === 'admin'` for admin portal

**Acceptance Criteria**:
- [ ] Returns 403 ONLY if tokenType mismatch (valid token, wrong type)
- [ ] Returns 401 if token invalid/expired
- [ ] Debug log shows tokenType validation result

### REQ-4: Cloudflare Auth Middleware Must Validate Brand
**File**: `services/api-gateway/src/middleware/auth.ts`

Must validate:
- Request brand derived from hostname
- `payload.brand === requestBrand`

**Acceptance Criteria**:
- [ ] Brand derived from hostname (not x-brand header alone)
- [ ] Returns 403 ONLY if brand mismatch (valid token, wrong brand)
- [ ] Debug log shows brand validation result
- [ ] Handles undefined brand gracefully

### REQ-5: BFF Must Forward All Authentication Headers
**Files**: 
- `apps/realtutorialhub-web/src/app/api/onboarding/route.ts`
- `apps/skillup-web/src/app/api/onboarding/route.ts`
- `apps/realtutorialhub-web/src/app/api/profile/route.ts`
- `apps/skillup-web/src/app/api/profile/route.ts`

Must forward BOTH:
- `Cookie` header (contains `accessToken`)
- `Authorization` header (if present)

**Acceptance Criteria**:
- [ ] Cookie header forwarded to API server
- [ ] Authorization header forwarded to API server
- [ ] Trace ID propagated for debugging
- [ ] Debug log shows which headers are present

### REQ-6: Brand Resolution Must Be Consistent Across All Layers
**Files**: All services

Brand MUST be derived from hostname consistently:
```typescript
function resolveBrand(hostname: string): 'realtutorialhub' | 'skillup' {
  return hostname.includes('skillup') ? 'skillup' : 'realtutorialhub';
}
```

**Acceptance Criteria**:
- [ ] Login service uses hostname-based brand
- [ ] Cloudflare Worker uses hostname-based brand
- [ ] API server uses hostname-based brand
- [ ] No reliance on user-provided brand parameter

### REQ-7: Debug Logging Must Be Added to All Auth Layers
**Files**: All authentication-related files

Must log:
- Token extraction (cookie vs header)
- Token validation result
- TokenType validation
- Brand validation
- Final auth decision

**Acceptance Criteria**:
- [ ] Cloudflare Worker logs auth decisions
- [ ] BFF logs header forwarding
- [ ] Login service logs token generation
- [ ] All logs include trace ID for correlation

### REQ-8: Token Extraction Must Be Consistent Across All Layers
**Files**: 
- `services/api-gateway/src/middleware/auth.ts` (Cloudflare Worker)
- `apps/api-server/src/modules/auth/*` (API Server)

Cloudflare Worker and API server MUST extract token using SAME logic:
1. First check cookie: `accessToken`
2. Then check `Authorization` header

**Why Critical**: If CF uses cookie but API uses header → SAME request behaves differently → impossible-to-debug auth bugs

**Acceptance Criteria**:
- [ ] CF and API use identical extraction logic
- [ ] No mismatch between CF and API token sources
- [ ] Debug logs confirm token source used (cookie vs header)
- [ ] Both layers check cookie FIRST, then Authorization header

### REQ-9: End-to-End Test Must Pass
**File**: `tmp/test-onboarding-e2e.js`

Test flow:
1. Signup → 200
2. Login → 200
3. Onboarding → 200 (currently fails with 403)
4. Profile → 200 (currently fails with 403)

**Acceptance Criteria**:
- [ ] Test passes for `user.realtutorialhub.com`
- [ ] Test passes for `user.skillupitacademy.com`
- [ ] No 403 errors in entire flow
- [ ] All requests complete successfully

## Technical Constraints

1. **No Breaking Changes**: Existing authenticated users must continue working
2. **Multi-Brand Isolation**: Brand validation must prevent cross-brand access
3. **Security**: Token validation must remain strict (no loosening of checks)
4. **Performance**: No additional database queries in hot path
5. **Observability**: All auth decisions must be logged with trace ID

## Success Metrics

- ✅ Onboarding completion rate: 0% → 100%
- ✅ 403 errors on protected routes: 100% → 0%
- ✅ End-to-end test pass rate: 0% → 100%
- ✅ Auth decision visibility: 0% → 100% (via logs)

## Out of Scope

- Refresh token rotation
- Cross-domain cookie hardening
- Session hijacking detection (already implemented)
- Rate limiting improvements

## Dependencies

- Cloudflare Worker deployment access
- GCP Cloud Run deployment access
- Access to Cloudflare logs: `npx wrangler tail --env production`
- Access to Cloud Run logs: `gcloud run services logs read quiz-api-server --region asia-southeast1`

## Rollback Plan

If issues occur:
1. Revert Cloudflare Worker deployment
2. Revert API server deployment
3. Revert BFF deployments
4. Verify previous version works with existing sessions

## Testing Strategy

### Unit Tests
- Token generation includes all required claims
- Token extraction from multiple sources
- Brand resolution from hostname

### Integration Tests
- Cloudflare → BFF → API auth flow
- Multi-brand isolation
- Token type validation

### E2E Tests
- Full signup → login → onboarding → profile flow
- Both brands (realtutorialhub, skillup)
- Cookie-based and header-based auth

## Implementation Notes

### Critical Principles
1. **Auth failure is NEVER a UI issue** - It's always a cross-layer contract failure
2. **403 vs 401 semantics matter** - Use correct status codes
3. **Brand must be server-derived** - Never trust client input
4. **Debug visibility is mandatory** - All auth decisions must be logged

### Common Pitfalls to Avoid
- ❌ Only checking cookie OR authorization header (check BOTH)
- ❌ Returning 403 for invalid tokens (should be 401)
- ❌ Using x-brand header from client (derive from hostname)
- ❌ Missing tokenType in JWT payload
- ❌ Brand mismatch due to inconsistent resolution logic

## References

- JWT RFC: https://datatracker.ietf.org/doc/html/rfc7519
- HTTP Status Codes: https://httpwg.org/specs/rfc9110.html#status.codes
- Cloudflare Workers Auth: https://developers.cloudflare.com/workers/examples/auth-with-headers/
