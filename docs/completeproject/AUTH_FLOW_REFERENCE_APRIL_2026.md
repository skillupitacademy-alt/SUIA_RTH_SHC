# Authentication Flow Reference - April 4, 2026

**Purpose**: Complete authentication and authorization flows for all three platforms  
**Date**: April 4, 2026  
**Status**: Reference Documentation

---

## Overview

This document provides the complete request-response authentication flows for:
1. SkillUp IT Academy
2. Real Tutorial Hub (RTH)
3. SkillHubCore (Shared Services)

Based on verified implementation in `.kiro` folder documentation.

---

## Table of Contents

1. [SkillUp IT Academy Flow](#skillup-it-academy-flow)
2. [Real Tutorial Hub Flow](#real-tutorial-hub-flow)
3. [SkillHubCore Flow](#skillhubcore-flow)
4. [Direct Access to SkillHubCore](#direct-access-to-skillhubcore)
5. [Key Components](#key-components)

---

## SkillUp IT Academy Flow

### Phase 1: User Login on SkillUp Portal

```
Client: user.skillupitacademy.com/login
   ↓
1. User enters credentials (email, password)
   ↓
2. Frontend sends login request:
   POST https://api.skillupitacademy.com/auth/login
   Headers: {
     'x-portal-identity': 'user',        // ✅ FIXED (not hostname-derived)
     'x-brand': 'skillup',
     'Content-Type': 'application/json'
   }
   Body: { email, password }
   ↓
3. SkillUp API Gateway (Cloudflare Worker) routes to:
   → SkillUp Auth Service (GCP Cloud Run)
   ↓
4. SkillUp Auth Service:
   a. Queries skillup_prod database
   b. Validates password hash
   c. Syncs user to people_prod (Identity Bridge)
      - Creates/updates shadow user
      - Links: externalId=skillup_user_id, externalBrand='skillup'
   d. Generates JWT token:
      {
        sub: skillup_user_id,
        shadowUserId: people_prod_user_id,    // ✅ REQUIRED
        originalUserId: skillup_user_id,      // ✅ REQUIRED
        email: user@example.com,
        brand: 'skillup',                     // ✅ REQUIRED
        platforms: ['skillup'],
        roles: ['student'],
        exp: 15min
      }
   ↓
5. Response to client:
   Status: 200 OK
   Set-Cookie: 
     - accessToken=jwt-token; Domain=.skillupitacademy.com; HttpOnly; Secure
     - refreshToken=refresh-token; Domain=.skillupitacademy.com; HttpOnly; Secure
   Body: {
     user: { id, email, name },
     accessToken: 'jwt-token',
     shadowUserId: 'people-prod-uuid'
   }
```

### Phase 2: Accessing SkillUp User Portal

```
Client: user.skillupitacademy.com/dashboard
   ↓
1. Browser sends request with cookies:
   GET https://user.skillupitacademy.com/dashboard
   Cookie: accessToken=jwt-token
   ↓
2. Next.js Middleware (apps/skillup-web/src/proxy.ts):
   a. Reads accessToken cookie
   b. Validates JWT token
   c. Validates identity bridge claims:
      if (shadowUserId === undefined || originalUserId === undefined) {
        return 401 Unauthorized  // ✅ STRICT ENFORCEMENT
      }
   d. Sets request headers:
      headers.set('x-user-id', shadowUserId)
      headers.set('x-shadow-user-id', shadowUserId)
      headers.set('x-original-user-id', originalUserId)
      headers.set('x-brand', 'skillup')
```

### Phase 3: Cross-Domain Access to Shared Services

```
User clicks "Take Quiz" on SkillUp portal
   ↓
1. Frontend redirects with token:
   window.location.href = 
     'https://quiz.skillhubcore.in/auth/callback?token=jwt-token&brand=skillup'
   ↓
2. SkillHub validates token and creates session
   ↓
3. Sets SkillHub cookies for .skillhubcore.in domain
   ↓
4. User can now access all SkillHub services
```

---

## Real Tutorial Hub Flow

### Phase 1: User Login on RTH Portal

```
Client: user.realtutorialhub.com/login
   ↓
1. User enters credentials (email, password)
   ↓
2. Frontend sends login request:
   POST https://api.realtutorialhub.com/auth/login
   Headers: {
     'x-portal-identity': 'user',        // ✅ FIXED (not hostname-derived)
     'x-brand': 'realtutorialhub',
     'Content-Type': 'application/json'
   }
   Body: { email, password }
   ↓
3. RTH API Gateway (Cloudflare Worker) routes to:
   → RTH Auth Service (GCP Cloud Run)
   ↓
4. RTH Auth Service:
   a. Queries rth_prod database
   b. Validates password hash
   c. Syncs user to people_prod (Identity Bridge)
      - Creates/updates shadow user
      - Links: externalId=rth_user_id, externalBrand='rth'
   d. Generates JWT token:
      {
        sub: rth_user_id,
        shadowUserId: people_prod_user_id,        // ✅ REQUIRED
        originalUserId: rth_user_id,              // ✅ REQUIRED
        email: user@example.com,
        brand: 'realtutorialhub',                 // ✅ REQUIRED
        platforms: ['realtutorialhub'],
        roles: ['student'],
        exp: 15min
      }
   ↓
5. Response to client:
   Status: 200 OK
   Set-Cookie: 
     - accessToken=jwt-token; Domain=.realtutorialhub.com; HttpOnly; Secure
     - refreshToken=refresh-token; Domain=.realtutorialhub.com; HttpOnly; Secure
   Body: {
     user: { id, email, name },
     accessToken: 'jwt-token',
     shadowUserId: 'people-prod-uuid'
   }
```

### Phase 2: Accessing RTH User Portal

```
Client: user.realtutorialhub.com/dashboard
   ↓
1. Browser sends request with cookies:
   GET https://user.realtutorialhub.com/dashboard
   Cookie: accessToken=jwt-token
   ↓
2. Next.js Middleware (apps/realtutorialhub-web/src/proxy.ts):
   a. Reads accessToken cookie
   b. Validates JWT token
   c. Validates identity bridge claims:
      if (shadowUserId === undefined || originalUserId === undefined) {
        return 401 Unauthorized  // ✅ STRICT ENFORCEMENT
      }
   d. Sets request headers:
      headers.set('x-user-id', shadowUserId)
      headers.set('x-shadow-user-id', shadowUserId)
      headers.set('x-original-user-id', originalUserId)
      headers.set('x-brand', 'realtutorialhub')
```

### Phase 3: Cross-Domain Access to Shared Services

```
User clicks "Take Quiz" on RTH portal
   ↓
1. Frontend redirects with token:
   window.location.href = 
     'https://quiz.skillhubcore.in/auth/callback?token=jwt-token&brand=realtutorialhub'
   ↓
2. SkillHub validates token and creates session
   ↓
3. Sets SkillHub cookies for .skillhubcore.in domain
   ↓
4. User can now access all SkillHub services
```

---

## SkillHubCore Flow

### Phase 1: Receiving Brand User Token

```
User arrives from RTH or SkillUp with brand token
   ↓
1. Callback endpoint receives token:
   GET https://quiz.skillhubcore.in/auth/callback?token=brand-jwt&brand=realtutorialhub
   (or brand=skillup)
   ↓
2. SkillHub service validates token:
   POST https://api.skillhubcore.in/auth/validate
   Headers: {
     'Authorization': 'Bearer brand-jwt',
     'x-brand': 'realtutorialhub' (or 'skillup')
   }
```

### Phase 2: Token Validation & Session Creation

```
SkillHub Auth Validator Service
   ↓
1. Validate brand JWT:
   a. Verify JWT signature using brand-specific public key
   b. Check token expiration
   c. Extract payload with shadowUserId, originalUserId, brand
   ↓
2. Verify shadow user in people_prod:
   a. Query people_prod.users WHERE id = shadowUserId
   b. Verify platform access
   ↓
3. Generate SkillHub session token:
   {
     shadowUserId: people_prod_user_id,
     brand: 'realtutorialhub' | 'skillup',
     originalUserId: brand_user_id,
     roles: ['student'],
     platforms: ['realtutorialhub'] | ['skillup'],
     exp: 15min
   }
   ↓
4. Set SkillHub cookies:
   Set-Cookie:
     - skillhubcore_accessToken=skillhub-jwt; Domain=.skillhubcore.in
     - skillhubcore_refreshToken=refresh-token; Domain=.skillhubcore.in
```

### Phase 3: Accessing SkillHub Services

```
All SkillHub services share same authentication:
- quiz.skillhubcore.in
- tutorial.skillhubcore.in
- placement.skillhubcore.in
   ↓
1. Browser sends request with SkillHub cookies:
   GET https://quiz.skillhubcore.in/my-exams
   Cookie: skillhubcore_accessToken=skillhub-jwt
   ↓
2. Middleware validates token and checks identity bridge claims
   ↓
3. All database operations use shadowUserId
```

### Phase 4: Database Operations

```
All SkillHub services use shadowUserId:

Quiz Service:
   const exam = await db.exams.create({
     userId: authUser.shadowUserId,  // ✅ Shadow user ID
     brand: authUser.brand,
     status: 'in_progress'
   })

Tutorial Service:
   const progress = await db.tutorialProgress.upsert({
     userId: authUser.shadowUserId,  // ✅ Shadow user ID
     brand: authUser.brand,
     progress: req.body.progress
   })
```

---

## Direct Access to SkillHubCore

### ❌ NO - Direct Access Not Allowed

**Users CANNOT directly access SkillHubCore.in without first authenticating through their brand portal.**

### Why Direct Access is Blocked

#### 1. No Direct Login on SkillHubCore
```
❌ User tries: https://quiz.skillhubcore.in/login
   ↓
   NO LOGIN PAGE EXISTS
   ↓
   SkillHub services have NO authentication endpoints
   ↓
   User must authenticate on brand portal first
```

#### 2. Token Validation Requires Brand Context
```
❌ User tries: https://quiz.skillhubcore.in/dashboard
   ↓
   No skillhubcore_accessToken cookie
   ↓
   Middleware checks for token:
   if (!token) {
     return 401 Unauthorized  // ✅ BLOCKED
   }
```

#### 3. Identity Bridge Requires Brand User
```
SkillHub services REQUIRE:
- shadowUserId (from people_prod)
- originalUserId (from rth_prod or skillup_prod)
- brand ('realtutorialhub' or 'skillup')

These can ONLY come from brand authentication
```

### The ONLY Way to Access SkillHubCore

```
Step 1: User MUST authenticate on brand portal
   ↓
   RTH: https://user.realtutorialhub.com/login
   OR
   SkillUp: https://user.skillupitacademy.com/login
   ↓
Step 2: Brand auth validates credentials
   ↓
Step 3: Brand auth creates shadow user in people_prod
   ↓
Step 4: Brand auth generates JWT with identity bridge claims
   ↓
Step 5: User redirected to SkillHub with brand token
   ↓
Step 6: SkillHub validates brand token
   ↓
Step 7: SkillHub creates session
   ↓
Step 8: NOW user can access SkillHub services
```

### What Happens if Someone Tries Direct Access?

#### Scenario 1: No Cookie
```
User navigates to: https://quiz.skillhubcore.in/dashboard
   ↓
No skillhubcore_accessToken cookie
   ↓
Result: ❌ BLOCKED - 401 Unauthorized or redirect to brand login
```

#### Scenario 2: Invalid/Expired Token
```
User has old/invalid cookie
   ↓
Middleware validates token
   ↓
Result: ❌ BLOCKED - 401 Unauthorized
```

#### Scenario 3: Missing Identity Bridge Claims
```
Token without shadowUserId/originalUserId
   ↓
Middleware checks:
if (shadowUserId === undefined || originalUserId === undefined) {
  return 401 Unauthorized
}
   ↓
Result: ❌ BLOCKED - Invalid token structure
```

---

## Key Components

### Token Structure (ENFORCED)

```typescript
{
  sub: string,                    // User ID
  shadowUserId: string,           // ✅ REQUIRED - people_prod ID
  originalUserId: string,         // ✅ REQUIRED - brand DB ID
  email: string,
  brand: 'realtutorialhub' | 'skillup',  // ✅ REQUIRED
  platforms: ['realtutorialhub'] | ['skillup'],
  roles: ['student' | 'faculty' | 'admin' | 'super_admin'],
  exp: number
}
```

### Cookie Domains

**Brand Cookies:**
- RTH: `.realtutorialhub.com` (works on user.*, admin.*)
- SkillUp: `.skillupitacademy.com` (works on user.*, admin.*, faculty.*)

**Shared Services:**
- SkillHub: `.skillhubcore.in` (works on quiz.*, tutorial.*, placement.*)

### Identity Headers (Forwarded)

```typescript
headers.set('x-user-id', shadowUserId)
headers.set('x-shadow-user-id', shadowUserId)        // PRIMARY
headers.set('x-original-user-id', originalUserId)    // BRAND-SPECIFIC
headers.set('x-brand', 'realtutorialhub' | 'skillup')
```

### Middleware Enforcement

```typescript
// Identity bridge enforcement
if (shadowUserId === undefined || originalUserId === undefined) {
  return 401 Unauthorized  // ✅ STRICT - NO FALLBACKS
}

// Platform isolation
if (!authUser.platforms.includes(platform)) {
  return 403 Forbidden  // ✅ CROSS-BRAND PREVENTION
}

// Role-based access
if (!authUser.roles.some(r => allowedRoles.includes(r))) {
  return 403 Forbidden  // ✅ RBAC
}
```

### Security Features

- ✅ Identity bridge claims REQUIRED (no fallbacks)
- ✅ Platform isolation (cross-brand access prevented)
- ✅ Role-based access control (RBAC)
- ✅ Proper cookie scoping (domain-specific)
- ✅ CORS configured (x-brand header allowed)
- ✅ No hostname-derived portal identity (fixed per app)
- ✅ Super admins have controlled cross-brand access

---

## Summary

### SkillUp IT Academy
1. ✅ Login on `user.skillupitacademy.com`
2. ✅ Credentials validated against `skillup_prod`
3. ✅ Shadow user created in `people_prod`
4. ✅ JWT with identity bridge claims
5. ✅ Cookies for `.skillupitacademy.com`
6. ✅ Cross-domain to SkillHub with token
7. ✅ All operations use `shadowUserId`

### Real Tutorial Hub
1. ✅ Login on `user.realtutorialhub.com`
2. ✅ Credentials validated against `rth_prod`
3. ✅ Shadow user created in `people_prod`
4. ✅ JWT with identity bridge claims
5. ✅ Cookies for `.realtutorialhub.com`
6. ✅ Cross-domain to SkillHub with token
7. ✅ All operations use `shadowUserId`

### SkillHubCore
1. ❌ NO direct access allowed
2. ✅ Receives brand token from RTH or SkillUp
3. ✅ Validates brand JWT
4. ✅ Creates session with shadow user context
5. ✅ Cookies for `.skillhubcore.in`
6. ✅ All services share same authentication
7. ✅ All operations use `shadowUserId`

**SkillHub is a SHARED SERVICE layer, not a standalone platform.**

---

**Last Updated**: April 4, 2026  
**Status**: Reference Documentation  
**Source**: Conversation with AI on April 4, 2026
