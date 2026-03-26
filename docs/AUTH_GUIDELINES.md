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

### 2. Never add client-side auth guards (AuthGuard, session checks)
```typescript
// ❌ BAD — adds "Verifying session..." delay, creates race conditions
const session = await apiClient.auth.getSession(); // GET /auth/me from browser

// ✅ GOOD — proxy.ts checks cookie server-side before page renders
// No spinner, no extra network call, no race condition
```

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
| `AuthGuard` component | proxy.ts already guards routes server-side |
| `middleware.ts` | Next.js 16 uses proxy.ts natively |
| Client-side `document.cookie` | Conflicts with httpOnly cookies from server |
| GET `/auth/me` on page load | Adds delay; user is already verified by proxy.ts |
| Issuer checks | quiz-api-server is the sole auth authority |
