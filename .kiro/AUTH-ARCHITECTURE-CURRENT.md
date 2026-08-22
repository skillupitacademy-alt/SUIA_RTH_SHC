# Current Authentication & Authorization Architecture

## Overview

Both SUIA (SkillUp IT Academy) and RTH (RealTutorialHub) share the same authentication infrastructure with brand-specific contexts.

## Shared Components

### 1. Authentication Middleware (`proxy.ts`)

**Location:**
- SUIA: `apps/skillup-web/src/proxy.ts`
- RTH: `apps/realtutorialhub-web/src/proxy.ts`

Both use: `src/share-branding/middleware/authProxy.ts`

**Key Functions:**
```typescript
createAuthProxy({
  brandLoginUrl: string
})
```

**Protected Routes:**
```typescript
PROTECTED_PREFIXES = [
  '/learn/',
  '/start-learning/',
  '/api/tutorial/',      // ✅ Already protected
  '/api/ai-tutor/',
  '/remediation/',
  '/dashboard',
  '/onboarding',
  '/student',
  '/batches',
  '/faculty',
  '/api/student',
  '/api/batches',
]
```

**Authentication Flow:**
```
1. Check accessToken cookie
2. Verify JWT with TokenService.verifyUserAccessToken()
3. Extract identity claims:
   - shadowUserId
   - originalUserId
   - roles[]
4. Check required roles: student, user, admin, super_admin, faculty
5. Add user headers to request:
   - x-user-id
   - x-shadow-user-id
   - x-original-user-id
```

### 2. Brand Context

**Brand Detection:**
- Via hostname: `skillupitacademy.com` → `skillup`
- Via hostname: `realtutorialhub.com` → `realtutorialhub`
- Via hostname: `skillhubcore.in` → `skillhubcore` (admin)

**Brand Header:**
```typescript
headers.set('x-brand', brand); // 'skillup' | 'realtutorialhub' | 'skillhubcore'
headers.set('x-portal-identity', 'user'); // or 'shc-admin'
```

### 3. RBAC System (`@quiz/auth`)

**Location:** `packages/auth/src/rbac/`

**Roles:**
```typescript
ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  FACULTY: 'faculty',
}
```

**Tutorial Permissions:**
```typescript
PERMISSIONS = {
  // Learner permissions
  TUTORIAL_READ: 'tutorial.read',
  TUTORIAL_VIEW: 'tutorial.view',
  TUTORIAL_PROGRESS: 'tutorial.progress',
  TUTORIAL_ASSIGNMENTS: 'tutorial.assignments',
  
  // Authoring permissions (SkillHubCore Admin only)
  TUTORIAL_AUTHOR_CREATE: 'tutorial.author.create',
  TUTORIAL_AUTHOR_EDIT: 'tutorial.author.edit',
  TUTORIAL_AUTHOR_DELETE: 'tutorial.author.delete',
  TUTORIAL_AUTHOR_PUBLISH: 'tutorial.author.publish',
}
```

### 4. Admin Auth Helpers (`skillhubcore-admin`)

**Location:** `apps/skillhubcore-admin/src/lib/auth-helpers.ts`

**Key Functions:**
```typescript
// Authentication
authenticateRequest(request): AuthContext | AuthError
createAuthErrorResponse(error): NextResponse

// Authorization
hasPermission(user, permission): boolean
requirePermission(user, permission, action?): AuthError | null
requireSubtopicAccess(user, subtopicId): AuthError | null
requireBrandAccess(user, brandId): AuthError | null

// Tutorial-specific
requireTutorialCreatePermission(user)
requireTutorialEditPermission(user)
requireTutorialDeletePermission(user)
requireTutorialPublishPermission(user)
```

**User Context:**
```typescript
interface AuthenticatedUser {
  userId: string;          // shadowUserId
  originalUserId: string;
  shadowUserId: string;
  roles: Role[];
  isAdmin: boolean;
  email?: string;
}
```

## Current Tutorial Composer Security

### ✅ Already Implemented

1. **Admin Authentication** - All Composer API routes use `authenticateRequest()`
2. **RBAC Authorization** - Uses `requireTutorialCreatePermission()`, etc.
3. **Subtopic Access Check** - `requireSubtopicAccess(user, subtopicId)`
4. **Brand Access Check** - `requireBrandAccess(user, brandId)`

### ❌ Missing for Learner Routes

1. **Tutorial Delivery API** - Does NOT verify authentication
2. **Brand Authorization** - Does NOT check user brand vs tutorial brand
3. **Anonymous Access** - Currently allows unauthenticated requests
4. **API Layer Protection** - Only page-level protection exists

## Required Changes for Security Fix

### Layer 1: Page-Level Protection (✅ ALREADY EXISTS)

```typescript
// apps/skillup-web/src/proxy.ts
// apps/realtutorialhub-web/src/proxy.ts

PROTECTED_PREFIXES includes '/api/tutorial/' 
// ✅ Routes already require authentication
```

### Layer 2: Tutorial Delivery API Protection (❌ MISSING)

**Current:**
```typescript
// No authentication check
GET /api/tutorial/sections/:subtopicId
  ↓
TutorialDeliveryService
  ↓
Return TutorialDocument
```

**Required:**
```typescript
GET /api/tutorial/sections/:subtopicId
  ↓
authenticateRequest() // Extract user from accessToken
  ↓
extractBrandFromRequest() // Get brand from x-brand header
  ↓
getTutorial(subtopicId, brandId)
  ↓
verifyBrandAuthorization(user.brand, tutorial.brandId)
  ↓
Return TutorialDocument (if authorized)
```

### Layer 3: Service-Level Authorization (❌ MISSING)

**Required in TutorialDeliveryService:**
```typescript
interface DeliveryContext {
  userId: string;
  brand: 'skillup' | 'realtutorialhub';
  roles: Role[];
}

async getTutorialBySubtopic(
  subtopicId: string,
  context: DeliveryContext
): Promise<TutorialSection> {
  // 1. Fetch tutorial
  const tutorial = await repository.getTutorialBySubtopic(subtopicId);
  
  // 2. Check brand authorization
  if (!canAccessTutorial(context.brand, tutorial.brandId)) {
    throw new BrandAuthorizationError();
  }
  
  // 3. Return content
  return tutorial;
}

function canAccessTutorial(
  userBrand: string,
  tutorialBrand: string
): boolean {
  // shared → accessible by all authenticated users
  if (tutorialBrand === 'shared') return true;
  
  // brand-specific → only matching brand
  return userBrand === tutorialBrand;
}
```

## Brand Values in System

**Tutorial Composer uses:**
```typescript
type TutorialSidebarBrandId = 'shared' | 'skillup' | 'realtutorialhub';
```

**User brand context uses:**
```typescript
'skillup' | 'realtutorialhub'
// Note: No 'shared' brand for users
```

**Authorization mapping:**
```
User Brand: skillup
  ├─ Tutorial Brand: skillup → ✅ ALLOW
  ├─ Tutorial Brand: shared → ✅ ALLOW
  └─ Tutorial Brand: realtutorialhub → ❌ DENY (403)

User Brand: realtutorialhub
  ├─ Tutorial Brand: realtutorialhub → ✅ ALLOW
  ├─ Tutorial Brand: shared → ✅ ALLOW
  └─ Tutorial Brand: skillup → ❌ DENY (403)

No Authentication
  └─ Any tutorial → ❌ DENY (401)
```

## API Endpoints to Secure

### SUIA Routes
```
apps/skillup-web/src/app/api/tutorial/sections/[subtopicId]/route.ts
```

### RTH Routes
```
apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts
```

### Centralized API Server Routes
```
apps/api-server/src/app/api/tutorial/sections/[subtopicId]/route.ts
```

## Implementation Checklist

- [ ] Add authentication to Tutorial Delivery API endpoints
- [ ] Extract brand from `x-brand` header in API routes
- [ ] Add `DeliveryContext` parameter to TutorialDeliveryService methods
- [ ] Implement `canAccessTutorial()` brand authorization logic
- [ ] Return 401 for unauthenticated requests
- [ ] Return 403 for cross-brand access attempts
- [ ] Update E2E tests to verify security (TEST 12-17)
- [ ] Document brand authorization in API specs

## Notes

1. **DO NOT** change the Composer authentication - it's already correct
2. **DO NOT** create new authentication infrastructure - use existing
3. **DO** leverage existing `x-brand` header from middleware
4. **DO** use existing RBAC permissions for authorization logic
5. **VERIFY** brand string values match across all layers

## References

- Authentication: `src/share-branding/middleware/authProxy.ts`
- RBAC: `packages/auth/src/rbac/`
- Admin Auth: `apps/skillhubcore-admin/src/lib/auth-helpers.ts`
- Token Service: `packages/auth/src/token.service.ts`
