# 🗺️ AUTHENTICATION ARCHITECTURE VISUAL MAP
## Current vs Target State - April 13, 2026

---

## 📍 CURRENT STATE (Phase 3.5)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                       │
│                     (httpOnly cookies only)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP Request
                                  │ Cookie: accessToken=xxx
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND APPS (Next.js)                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ RTH Web      │ RTH Quiz     │ SkillUp Web  │ SkillUp Admin│         │
│  │ RTH Admin    │ Faculty App  │ Placement    │ Core Admin   │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                                                         │
│  Each app has:                                                          │
│  ✅ proxy.ts middleware (server-side)                                   │
│  ✅ Reads accessToken from httpOnly cookie                              │
│  ✅ Verifies JWT via TokenService (@quiz/auth)                          │
│  ✅ Sets identity headers (x-user-id, x-shadow-user-id, etc.)           │
│  ✅ BFF routes (/app/api/*)                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ ❌ BYPASSES GATEWAY
                                  │ Direct API calls
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API SERVER (Cloud Run)                               │
│                    apps/api-server                                      │
│                                                                         │
│  ✅ Has own proxy.ts                                                    │
│  ✅ Re-verifies tokens                                                  │
│  ✅ Business logic modules                                              │
│  ❌ Auth logic still here (should be in SkillHubCore)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASES (Neon Postgres)                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ quiz_        │ tutorial_    │ people_      │ payment_     │         │
│  │ platform_    │ prod         │ prod         │ prod         │         │
│  │ prod         │              │              │              │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                                                         │
│  ✅ Databases separated by domain                                       │
│  ✅ No cross-DB joins                                                   │
│  🔶 Event-driven sync (partial)                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              🔶 GATEWAY EXISTS BUT NOT USED                              │
│              services/api-gateway (Cloudflare Workers)                  │
│                                                                         │
│  ✅ JWT verification at edge                                            │
│  ✅ Rate limiting (Upstash)                                             │
│  ✅ CORS handling                                                       │
│  ❌ Incomplete routing table                                            │
│  ❌ Not enforced                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│         🔶 SKILLHUBCORE SERVICE EXISTS BUT NOT FULLY USED                │
│         services/skillhubcore-service (Hono on Node.js)                 │
│                                                                         │
│  ✅ Auth routes scaffolded                                              │
│  ✅ SSO service exists                                                  │
│  ✅ Token rotation service                                              │
│  ❌ Not handling all auth operations                                    │
│  ❌ Apps still have auth logic                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 TARGET STATE (Phase 10)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                       │
│                     (httpOnly cookies only)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP Request
                                  │ Cookie: skillhubcore_accessToken=xxx
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND APPS (Next.js)                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ RTH Web      │ RTH Quiz     │ SkillUp Web  │ SkillUp Admin│         │
│  │ RTH Admin    │ Faculty App  │ Placement    │ Core Admin   │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                                                         │
│  Each app has:                                                          │
│  ✅ proxy.ts middleware (thin layer)                                    │
│  ✅ BFF routes for UI-specific aggregation                              │
│  ❌ NO auth logic (delegated to gateway)                                │
│  ❌ NO token verification (gateway does it)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ ✅ ALL REQUESTS THROUGH GATEWAY
                                  │ Authorization: Bearer xxx
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              ✅ API GATEWAY (Cloudflare Workers - Edge)                  │
│              services/api-gateway                                       │
│                                                                         │
│  ✅ JWT verification at edge (<10ms)                                    │
│  ✅ Rate limiting (Upstash Redis)                                       │
│  ✅ CORS enforcement                                                    │
│  ✅ Request ID injection                                                │
│  ✅ Identity header injection                                           │
│  ✅ Complete routing table                                              │
│  ✅ X-Gateway-Secret for service-to-service auth                        │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Routes to appropriate service
                                  │ Headers: x-user-id, x-gateway-secret
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ✅ SKILLHUBCORE SERVICE                               │
│                    services/skillhubcore-service                        │
│                    (Central Identity Provider)                          │
│                                                                         │
│  ✅ /auth/login - Login endpoint                                        │
│  ✅ /auth/register - Registration                                       │
│  ✅ /auth/refresh - Token refresh                                       │
│  ✅ /auth/logout - Logout                                               │
│  ✅ /auth/me - Session info                                             │
│  ✅ /sso/* - Cross-platform SSO                                         │
│  ✅ Token generation (all types)                                        │
│  ✅ Token rotation                                                      │
│  ✅ Password management                                                 │
│  ✅ Subscription checks                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Routes to business services
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ✅ MICROSERVICES (Cloud Run)                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ exam-service │ tutorial-    │ skillup-     │ payment-     │         │
│  │              │ service      │ service      │ service      │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                                                         │
│  Each service:                                                          │
│  ✅ Verifies X-Gateway-Secret                                           │
│  ✅ Reads identity from headers (no JWT re-verification)                │
│  ✅ Applies authorization rules (RBAC + ABAC)                           │
│  ✅ Publishes events to QStash                                          │
│  ❌ NO direct service-to-service calls                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASES (Neon Postgres)                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ exam-db      │ tutorial-db  │ people-db    │ payment-db   │         │
│  │              │              │              │              │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                                                         │
│  ✅ Databases separated by service                                      │
│  ✅ No cross-DB joins                                                   │
│  ✅ Event-driven sync (QStash)                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              ✅ EVENT BUS (QStash)                                       │
│              packages/events                                            │
│                                                                         │
│  ✅ All cross-service communication via events                          │
│  ✅ Event types defined                                                 │
│  ✅ Event consumers in all services                                     │
│  ✅ Retry logic                                                         │
│  ✅ Dead letter queue                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 AUTHENTICATION FLOW COMPARISON

### **CURRENT FLOW (Phase 3.5)**

```
1. User submits login form
   ↓
2. Frontend → api-server/api/auth/login
   ❌ Direct call (bypasses gateway)
   ↓
3. api-server verifies credentials
   ↓
4. api-server generates tokens (TokenService)
   ↓
5. api-server sets httpOnly cookies
   ↓
6. Response → Frontend
   ↓
7. Frontend stores user in auth store (in-memory)
   ↓
8. Frontend redirects to /dashboard
   ↓
9. proxy.ts reads accessToken cookie
   ↓
10. proxy.ts verifies JWT (TokenService)
    ↓
11. proxy.ts sets identity headers
    ↓
12. Request passes through
```

### **TARGET FLOW (Phase 10)**

```
1. User submits login form
   ↓
2. Frontend → Gateway → SkillHubCore/auth/login
   ✅ All requests through gateway
   ↓
3. Gateway verifies rate limit
   ↓
4. Gateway forwards to SkillHubCore
   ↓
5. SkillHubCore verifies credentials
   ↓
6. SkillHubCore generates tokens (TokenService)
   ↓
7. SkillHubCore sets httpOnly cookies
   ↓
8. Response → Gateway → Frontend
   ↓
9. Frontend stores user in auth store (in-memory)
   ↓
10. Frontend redirects to /dashboard
    ↓
11. proxy.ts reads accessToken cookie
    ↓
12. Frontend → Gateway (with cookie)
    ↓
13. Gateway verifies JWT at edge (<10ms)
    ↓
14. Gateway sets identity headers
    ↓
15. Gateway routes to appropriate service
    ↓
16. Service verifies X-Gateway-Secret
    ↓
17. Service reads identity from headers
    ↓
18. Service applies authorization rules
    ↓
19. Service processes request
```

---

## 🔐 TOKEN STRUCTURE COMPARISON

### **CURRENT TOKEN (Phase 3.5)**

```json
{
  "userId": "uuid",
  "shadowUserId": "uuid",
  "originalUserId": "uuid",
  "email": "user@example.com",
  "roles": ["student"],
  "isAdmin": false,
  "aud": "user",
  "tokenType": "user",
  "brand": "realtutorialhub",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Issues**:
- ❌ No `platforms` array (SSO not enforced)
- ❌ No `subscriptions` array
- ❌ Brand-specific tokens

### **TARGET TOKEN (Phase 10)**

```json
{
  "sub": "uuid",
  "shadowUserId": "uuid",
  "originalUserId": "uuid",
  "email": "user@example.com",
  "roles": ["student"],
  "platforms": ["realtutorialhub", "skillup"],
  "subscriptions": ["premium", "training"],
  "brand": "realtutorialhub",
  "iss": "skillhubcore.in",
  "aud": "user",
  "tokenType": "user",
  "iat": 1234567890,
  "exp": 1234568790,
  "jti": "uuid"
}
```

**Improvements**:
- ✅ `platforms` array (SSO support)
- ✅ `subscriptions` array (subscription checks)
- ✅ `iss` claim (issuer verification)
- ✅ `jti` claim (token ID for rotation)

---

## 📊 COMPONENT STATUS MATRIX

| Component | Current | Target | Gap |
|-----------|---------|--------|-----|
| **Frontend Apps** | | | |
| proxy.ts middleware | ✅ All 9 apps | ✅ All 9 apps | None |
| Token verification | ✅ In each app | ✅ Delegated to gateway | **Move to gateway** |
| Auth logic | ❌ In apps | ❌ None | **Remove from apps** |
| BFF routes | ✅ Exists | ✅ UI aggregation only | **Simplify** |
| **Gateway** | | | |
| JWT verification | ✅ Implemented | ✅ Enforced | **Enforce usage** |
| Rate limiting | ✅ Implemented | ✅ Enforced | **Enforce usage** |
| Routing table | 🔶 Partial | ✅ Complete | **Add all routes** |
| Gateway secret | ✅ Exists | ✅ Verified by all | **Add to services** |
| **SkillHubCore** | | | |
| Auth routes | ✅ Scaffolded | ✅ Handles all auth | **Move auth logic** |
| SSO service | ✅ Exists | ✅ Enforced | **Enforce SSO** |
| Token generation | 🔶 Partial | ✅ All tokens | **Centralize** |
| Token rotation | ✅ Implemented | ✅ Enforced | **Enforce** |
| **Services** | | | |
| Gateway secret check | ❌ Missing | ✅ All services | **Add checks** |
| Identity headers | ✅ Read | ✅ Read | None |
| Authorization | 🔶 RBAC only | ✅ RBAC + ABAC | **Add ABAC** |
| Event publishing | 🔶 Partial | ✅ All events | **Complete** |
| **Event Bus** | | | |
| Event types | 🔶 Partial | ✅ All defined | **Define all** |
| Event consumers | 🔶 Partial | ✅ All services | **Add consumers** |
| Retry logic | ✅ Exists | ✅ Enforced | None |
| **Databases** | | | |
| Separation | ✅ Complete | ✅ Complete | None |
| Cross-DB joins | ✅ None | ✅ None | None |
| Event sync | 🔶 Partial | ✅ Complete | **Complete sync** |

---

## 🚀 MIGRATION PATH

### **Phase 4: Gateway Integration (2-3 weeks)**

```
BEFORE:
Frontend → api-server (direct)

AFTER:
Frontend → Gateway → api-server
```

**Changes**:
1. Update all API calls to go through gateway
2. Add gateway secret verification to api-server
3. Complete routing table
4. Test end-to-end

### **Phase 6: Auth Service Extraction (3-4 weeks)**

```
BEFORE:
Frontend → Gateway → api-server/auth/login

AFTER:
Frontend → Gateway → SkillHubCore/auth/login
```

**Changes**:
1. Move auth routes to SkillHubCore
2. Remove auth logic from api-server
3. Update frontend to call SkillHubCore
4. Test auth flow

### **Phase 7: Multi-Brand SSO (2-3 weeks)**

```
BEFORE:
User logs into RTH → RTH token
User logs into SkillUp → SkillUp token (separate)

AFTER:
User logs into RTH → SkillHubCore token (platforms: [RTH, SkillUp])
User navigates to SkillUp → Same token works
```

**Changes**:
1. Implement SSO login flow
2. Token includes `platforms` array
3. Cross-platform navigation
4. Test SSO

---

## 📈 PROGRESS TRACKING

### **Current Progress**

```
Phase 0: Understanding        ████████████████████ 100%
Phase 1: Frontend + BFF       ████████████████████ 100%
Phase 2: Core Auth Flow       ████████████████████ 100%
Phase 3: Backend Auth         ███████████████████░  95%
Phase 4: Gateway Layer        ████████░░░░░░░░░░░░  40%
Phase 5: Service Architecture ████████████░░░░░░░░  60%
Phase 6: Dedicated Auth       ██████░░░░░░░░░░░░░░  30%
Phase 7: Multi-Brand SSO      ██░░░░░░░░░░░░░░░░░░  10%
Phase 8: Authorization        ██████████░░░░░░░░░░  50%
Phase 9: Database Layer       ██████████████████░░  90%
Phase 10: Full Request Flow   ████░░░░░░░░░░░░░░░░  20%
```

### **Target Progress (12-16 weeks)**

```
Phase 0: Understanding        ████████████████████ 100%
Phase 1: Frontend + BFF       ████████████████████ 100%
Phase 2: Core Auth Flow       ████████████████████ 100%
Phase 3: Backend Auth         ████████████████████ 100%
Phase 4: Gateway Layer        ████████████████████ 100%  ← 2-3 weeks
Phase 5: Service Architecture ████████████████████ 100%  ← 2-3 weeks
Phase 6: Dedicated Auth       ████████████████████ 100%  ← 3-4 weeks
Phase 7: Multi-Brand SSO      ████████████████████ 100%  ← 2-3 weeks
Phase 8: Authorization        ████████████████████ 100%  ← 3-4 weeks
Phase 9: Database Layer       ████████████████████ 100%
Phase 10: Full Request Flow   ████████████████████ 100%
```

---

**Document Version**: 1.0  
**Last Updated**: April 13, 2026  
**Next Review**: After Phase 4 completion
