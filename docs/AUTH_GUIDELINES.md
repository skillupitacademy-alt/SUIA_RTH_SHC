# Authentication Architecture Guidelines

> **Purpose**: Prevent auth-related issues from recurring. Follow these rules when modifying login flows, session management, or gateway routing.

---

## Architecture Overview

```
Browser → Cloudflare Worker Gateway → Cloud Run (quiz-api-server)
           (routes API traffic)        (handles everything: auth, data, CORS)
```

- **`proxy.ts`** (Next.js server-side) = the ONLY auth guard. Runs before page render.
- **`quiz-api-server`** = sole auth authority. Issues httpOnly cookies, verifies tokens.
- **Gateway** = transparent proxy. Routes traffic, does NOT manage sessions.

---

## Rules

### 1. Never create client-side cookies for auth
```typescript
// ❌ BAD — creates scope conflicts with httpOnly cookies
document.cookie = `accessToken=${token}; domain=.realtutorialhub.com`;

// ✅ GOOD — server sets httpOnly cookies via Set-Cookie header
await fetch('/auth/login', { credentials: 'include' });
```

### 2. Do not add redundant client-side auth guards to user portals
```typescript
// ❌ BAD — adds "Verifying session..." delay, creates race conditions
const session = await apiClient.auth.getSession(); // GET /auth/me from browser

// ✅ GOOD — proxy.ts checks cookie server-side before page renders
// No spinner, no extra network call, no race condition
```

Admin portals are the intentional exception. They may use a thin client-side guard only to revalidate an already authenticated admin session, show a session-expired or access-denied modal, and coordinate lock-screen behavior. That guard must not become a second source of truth for authorization. Server-side `proxy.ts` and API RBAC remain authoritative.

### 3. Store user in auth store BEFORE redirecting after login
```typescript
// ❌ BAD — redirect fires before store is updated
router.replace('/dashboard');

// ✅ GOOD — store user first, then redirect
if (payload?.user) {
  authLogin({ id: payload.user.id, name: payload.user.name, ... });
}
router.replace('/dashboard');
```

### 4. Gateway route table must match FetchClient URL patterns
```
FetchClient sends: /api/auth/me (baseUrl includes /api)
Login page sends:  /auth/login  (uses getApiBase() which strips /api)
```
The gateway strips `/api` prefix before matching routes. If you add new routes, ensure they work with **both** URL patterns.

### 5. Gateway JWT_SECRET must match quiz-api-server JWT_SECRET
Both read from the same GCP secret. If you change the secret:
1. Update GCP secret
2. Redeploy quiz-api-server (reads from GCP)
3. Update Cloudflare Worker secret: `echo "<secret>" | npx wrangler secret put JWT_SECRET --env production`
4. Redeploy gateway: `npx wrangler deploy --env production`

### 6. Gateway auth middleware must NOT enforce issuer claims
```typescript
// ❌ BAD — quiz-api-server tokens don't have an issuer
jwt.verify(token, secret, { issuer: 'legacy.example.com' });

// ✅ GOOD — verify token without issuer requirement
jwt.verify(token, secret);
```

### 7. Always deploy gateway with `--env production`
```bash
# ❌ BAD — deploys without env vars, causes 500 errors
npx wrangler deploy

# ✅ GOOD
npx wrangler deploy --env production
```

---

## Auth Flow (Correct)

```
1. User submits login form
   POST /auth/login → gateway → quiz-api-server
   Response: 200 + Set-Cookie (httpOnly accessToken, refreshToken)
   Login page stores user in zustand auth store

2. router.replace('/dashboard')
   proxy.ts reads accessToken cookie server-side
   Verifies JWT via TokenService
   Sets x-user-id header → page renders immediately (no spinner)

3. Dashboard renders
   API calls go through gateway with cookies
   No client-side session check needed
```

## What NOT to Add

| Don't Add | Why |
|-----------|-----|
| User-portal `AuthGuard` component | proxy.ts already guards routes server-side |
| `middleware.ts` | Next.js 16 uses proxy.ts natively |
| Client-side `document.cookie` | Conflicts with httpOnly cookies from server |
| GET `/auth/me` on page load | Adds delay; user is already verified by proxy.ts |
| Issuer checks | quiz-api-server is the sole auth authority |



BROWSER          LOGIN PAGE          GATEWAY           API SERVER         DB
   │                  │                 │                   │              │
   │  submit form     │                 │                   │              │
   ├─────────────────►│                 │                   │              │
   │                  │ POST /auth/login│                   │              │
   │                  │ credentials:include                 │              │
   │                  │ x-portal-identity: user             │              │
   │                  │ body: { email, password, platform } │              │
   │                  ├────────────────►│                   │              │
   │                  │                 │ forward to Cloud  │              │
   │                  │                 ├──────────────────►│              │
   │                  │                 │                   │ findUser()   │
   │                  │                 │                   ├─────────────►│
   │                  │                 │                   │ verifyPwd()  │
   │                  │                 │                   │ generateTokens()
   │                  │                 │◄──────────────────┤              │
   │                  │◄────────────────┤                   │              │
   │  Set-Cookie: accessToken (httpOnly, secure, sameSite=none, maxAge=15min)
   │  Set-Cookie: refreshToken (httpOnly, secure, maxAge=7days)
   │  Body: { user, accessToken, refreshToken }
   │                  │                 │                   │              │
   │  cookie stored   │ authLogin(user) │                   │              │
   │  by browser      │ zustand store   │                   │              │
   │                  │ router.replace('/dashboard')        │              │
   ├◄─────────────────┤                 │                   │              │
   │ navigate to /dashboard             │                   │              │
   ├─────────────────►│proxy.ts runs    │                   │              │
   │                  │ getAccessToken()→ reads cookie      │              │
   │                  │ TokenService.verifyUserAccessToken()│              │
   │                  │ if valid → sets x-user-id header    │              │
   │                  │ NextResponse.next() → page renders  │              │


Key Code Facts (exact variable names and files)
Step 1 — Login Fetch (

apps/realtutorialhub-quiz/src/app/(public)/login/page.tsx
)

typescript
// endpoint built from:
const LOGIN_ENDPOINT = `${getApiBase()}/auth/login`;
// Note: getApiBase() does NOT include /api prefix — gateway handles routing
fetch(LOGIN_ENDPOINT, {
  method: 'POST',
  credentials: 'include',          // ← CRITICAL: tells browser to accept Set-Cookie
  headers: {
    'Content-Type': 'application/json',
    'x-portal-identity': 'user',   // ← portal type header
  },
  body: JSON.stringify({
    email, password,
    platform: 'realtutorialhub',   // ← brand tag sent to API
  }),
});
Step 2 — API Server Sets Cookies (

apps/api-server/src/app/api/auth/login/route.ts
)

typescript
// Resolves brand from hostname (not from body)
const brand = resolveRequestBrand(req.nextUrl.hostname);
// Cookie name differs by role:
const accessTokenCookieName = isAdmin ? 'admin_accessToken' : 'accessToken';
const refreshCookieName     = isAdmin ? 'admin_refreshToken' : 'refreshToken';
// Cookie domain is dynamic — scoped to apex domain
const cookieDomain = resolveCookieDomain(process.env.COOKIE_DOMAIN, req.nextUrl.hostname);
response.cookies.set('accessToken', accessToken, {
  httpOnly: true,    // ← JS cannot read it — security
  secure: true,      // ← HTTPS only
  sameSite: 'none',  // ← cross-origin (gateway ≠ app domain)
  maxAge: 15 * 60,   // ← 15 minutes
  path: '/',
  domain: cookieDomain,  // ← e.g. .realtutorialhub.com
});
response.cookies.set('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60,  // ← 7 days
  path: '/',
  domain: cookieDomain,
});
Step 3 — Store User BEFORE Redirect (

login/page.tsx
)

typescript
// Must happen BEFORE router.replace() — eliminates race condition
if (payload?.user) {
  authLogin({               // ← zustand auth store
    id: payload.user.id,
    name: payload.user.name ?? '',
    email: payload.user.email,
    isAdmin: payload.user.isAdmin ?? false,
    role: payload.user.role ?? 'user',
    onboarded: payload.user.onboarded ?? false,
  });
}
router.replace(safeRedirect);  // ← /dashboard or ?redirect= param
Step 4 — Auth Store (

packages/ui/src/store/auth-store.ts
)

typescript
// Persisted in localStorage under key: 'quiz-platform-auth'
// Shape:
AuthUser {
  id, name, email, isAdmin, role, onboarded
}
// Actions: login(), logout(), lock(), unlock(), completeOnboarding()
// NOT used for auth guard — proxy.ts does that
// Used for: displaying user name, role checks in UI, logout button
Step 5 — proxy.ts Guards Dashboard (

apps/realtutorialhub-quiz/src/proxy.ts
)

typescript
// Reads cookie — never from JS (httpOnly cookie invisible to JS)
function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
}
// Verifies token server-side
const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
// If valid: inject x-user-id header, pass request through
response.headers.set('x-user-id', user.sub);
return NextResponse.next({ request: { headers } });
// If invalid: redirect to /login?redirect=/dashboard
return NextResponse.redirect(getLoginUrl(request, redirectPath));
// Protected routes:
['/dashboard', '/exam/', '/reports/', '/quiz/', '/profile/', '/onboarding/']
Step 6 — Dashboard consumes x-user-id (any dashboard page)

typescript
// Dashboard server components can read:
const userId = request.headers.get('x-user-id');
// No /auth/me call needed — user is already verified by proxy.ts
For SkillUp — What to Copy Exactly
Item	RTH Value	SkillUp Value
Cookie name	accessToken	accessToken (same — same API server)
platform in body	'realtutorialhub'	'skillup'
x-portal-identity header	'user'	'user'
Auth store name	'quiz-platform-auth'	'skillup-auth'
localStorage key	'quiz-platform-auth'	'skillup-auth'
Protected routes in proxy.ts	/dashboard/, /exam/ etc.	/student/, /batches/ etc.
Login redirect after success	/dashboard	/student
proxy.ts cookie read	accessToken	accessToken (same cookie name)
The only differences for SkillUp:

platform: 'skillup' in login body
Different PROTECTED_PREFIXES in proxy.ts (/student, /batches, /faculty)
Different auth store name (skillup-auth)
Different login redirect (/student not /dashboard)

createAuthStore({ name: 'skillup-auth' })
 in apps/skillup-web/src/store/auth-store.ts
Everything else — cookie flags, httpOnly, sameSite, maxAge, the API endpoint, credentials:include — is identical. Copy the RTH pattern exactly and only change those 5 things.

 
