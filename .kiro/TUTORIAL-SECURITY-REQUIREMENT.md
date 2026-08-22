# CRITICAL: Tutorial Engine Security Architecture

**Status:** MANDATORY SECURITY FIX REQUIRED  
**Priority:** HIGH  
**Type:** Security Architecture Correction

## Problem Statement

The Tutorial Engine currently exposes tutorial content at public URLs without authentication:

```
❌ CURRENT (INSECURE)
https://user.skillupitacademy.com/tutorial-v2/...
https://user.realtutorialhub.com/tutorial-v2/...
    ↓
No authentication required
    ↓
TutorialDocument delivered to anonymous users
```

This violates the existing authentication architecture where all learner portal routes require `accessToken` validation via `proxy.ts`.

## Required Security Model

### Three-Layer Protection

```
Layer 1: Next.js Route Protection (proxy.ts)
    ↓
Layer 2: Tutorial API Authorization
    ↓
Layer 3: Delivery Service Authorization
```

All three layers MUST enforce:

> **No TutorialDocument may be delivered to an unauthenticated browser.**

### Required Flow

```
Browser Request
    ↓
proxy.ts Authentication Guard
    ↓
accessToken present?
    │
    ├─ NO → 401/redirect to login (NO TUTORIAL CONTENT)
    │
    └─ YES
        ↓
    Verify JWT + identity claims
        ↓
    Extract brand context (skillup/realtutorialhub)
        ↓
    Tutorial API request
        ↓
    Brand Authorization Check
        ↓
    user.brand matches tutorial.brandId?
        │
        ├─ NO → 403 (NO TUTORIAL CONTENT)
        │
        └─ YES → Deliver TutorialDocument
```

## Brand Authorization Rules

### `brandId = "shared"`
- SUIA authenticated user → ✅ ALLOW
- RTH authenticated user → ✅ ALLOW  
- Anonymous user → ❌ DENY

### `brandId = "skillup"`
- SUIA authenticated user → ✅ ALLOW
- RTH authenticated user → ❌ DENY (403)
- Anonymous user → ❌ DENY (401)

### `brandId = "realtutorialhub"`
- RTH authenticated user → ✅ ALLOW
- SUIA authenticated user → ❌ DENY (403)
- Anonymous user → ❌ DENY (401)

## Architecture Requirements

### Do NOT Solve Only in Frontend

Protection must exist at:
1. **Page level** - Next.js route behind authentication middleware
2. **API level** - Tutorial API endpoints require authentication
3. **Service level** - Delivery service validates authorization

### Existing Infrastructure to Leverage

The authentication architecture already provides:
- `proxy.ts` page-level authentication guard
- `accessToken` JWT validation
- Identity bridge claims (`shadowUserId`, `originalUserId`)
- Brand context (`x-brand` header)
- `authenticateRequest()` helper

## Implementation Tasks

### Phase 1: Authentication Enforcement

- [ ] Verify SUIA tutorial routes are behind authentication middleware
- [ ] Verify RTH tutorial routes are behind authentication middleware
- [ ] Add authentication check to Tutorial Delivery API endpoints
- [ ] Update TutorialDeliveryService to require authenticated context

### Phase 2: Brand Authorization

- [ ] Extract brand from authenticated user context
- [ ] Extract brandId from tutorial metadata
- [ ] Implement brand authorization logic:
  - `shared` → allow any authenticated user
  - `skillup` → allow only SUIA users
  - `realtutorialhub` → allow only RTH users
- [ ] Return 403 for brand mismatch

### Phase 3: E2E Security Tests

- [ ] **TEST 12** - Anonymous access denied (401/redirect)
- [ ] **TEST 13** - SUIA user accesses SUIA tutorial (200)
- [ ] **TEST 14** - RTH user accesses RTH tutorial (200)
- [ ] **TEST 15** - Cross-brand denial (403)
  - RTH user → SUIA-only tutorial → 403
  - SUIA user → RTH-only tutorial → 403
- [ ] **TEST 16** - Shared tutorial authorization
  - SUIA authenticated → 200
  - RTH authenticated → 200
  - Anonymous → 401
- [ ] **TEST 17** - Direct API bypass prevention
  - Anonymous direct API call → 401/403

### Phase 4: Documentation & Communication

- [ ] Update API documentation to reflect authentication requirements
- [ ] Update frontend code comments to clarify "protected tutorial route" not "public URL"
- [ ] Add security note to Tutorial Composer UI
- [ ] Update E2E test documentation

## Critical Rules

1. **No TutorialDocument may be delivered to an unauthenticated browser** - This applies to:
   - Next.js pages
   - API routes
   - Delivery service
   - Cache responses
   - SSR/RSC
   - Direct URLs

2. **Do not make routes "hard to find" - make them cryptographically protected**
   - Security through obscurity is NOT sufficient
   - Authentication MUST be enforced

3. **Composer and learner access remain separate**
   - SkillHubCore Admin → Tutorial Composer (authenticated admin)
   - SUIA/RTH → Tutorial Learner Routes (authenticated students)
   - No anonymous access to either

## References

- Existing authentication: `proxy.ts` in SUIA and RTH apps
- Identity bridge: `shadowUserId`, `originalUserId` claims
- Tutorial Composer: `(subtopicId, brandId)` identity model
- Brand context: Already established in request middleware

---

**Next Action:** Implement Phase 1 authentication enforcement before any further feature work.
