# SkillHubCore — Execution Plan
## Phase-by-Phase · Sprint-Organized · AI-Prompt-Driven
## Source: PHASE-SKILLHUBCORE.md | ADR-CRITICAL-001

> **Window**: Window 3 — Antigravity Agent 3
> **Monorepo path**: `services/skillhubcore-service/`
> **DB**: People DB (`DATABASE_URL_PEOPLE` + `DATABASE_DIRECT_URL_PEOPLE`)
> **Deployment**: GCP Cloud Run Mumbai (min 2 instances — auth is critical path)
> **Domain**: `api.skillhubcore.in`
> **Prerequisite**: Sprint 0 complete (packages/auth, packages/events, people-db Neon account created)

---

## How to Use This Document

- Paste the **Opening Prompt** at the start of every Window 3 session
- Paste each **▶ AI PROMPT** verbatim into a fresh chat for that task only
- Mark tasks **DONE** only when code is committed and `pnpm typecheck:all` + `pnpm test` pass
- **⚠ USER-GATED** = you must review output before agent continues
- Run **Deep Audit** checklist after every sprint before moving to next

---

## Phase Overview

| Phase | Description |
|-------|-------------|
| **SHC-1 — Foundation** | People DB schema, Drizzle models, packages/db-people setup |
| **SHC-2 — Auth Core** | Register, login, logout, JWT signing, password hashing |
| **SHC-3 — Token System** | Refresh rotation, stolen token detection, token families |
| **SHC-4 — SSO** | Cross-platform access, platform_access table, multi-platform JWT |
| **SHC-5 — Subscription Engine** | Plans, features, feature gating, plan matrix |
| **SHC-6 — Event Integration** | payment.received consumer, user.registered publisher |
| **SHC-7 — Admin App** | skillhubcore-admin frontend (Next.js 15) |
| **SHC-8 — GCP Deploy** | Dockerfile, CI/CD, Cloud Run, Cloudflare DNS |

### Dependency Chain
```
SHC-1 → SHC-2 → SHC-3 → SHC-4 → SHC-5 → SHC-6
                                         ↓
                              SHC-7 (after SHC-5)
                              SHC-8 (after SHC-6)
```

---

## ─── OPENING PROMPT — paste at start of EVERY Window 3 session ───

```
You are a senior implementation agent working in d:\onlinewebsites\quiz-platform

You are building SkillHubCore — the platform brain for a 3-platform EdTech ecosystem.

Architecture (ADR-CRITICAL-001 — MUST follow):
  Option B: One Turborepo monorepo + Separate databases per service
  People DB: DATABASE_URL_PEOPLE (pooled) + DATABASE_DIRECT_URL_PEOPLE (migrations)
  Deployment: GCP Cloud Run Mumbai asia-south1 (NOT Railway — GCP is confirmed)
  Domain: api.skillhubcore.in

Your scope: services/skillhubcore-service/ + packages/db-people + apps/skillhubcore-admin/
Do NOT touch: exam-service, tutorial-service, apps/web-app, apps/admin-app

Key facts:
  - SkillHubCore owns ALL user identity across both brands
  - Every JWT issued by SkillHubCore contains: platforms[], subscription.features[], roles[]
  - Other services (exam, tutorial) verify JWT locally — NEVER call SkillHubCore to validate
  - Token structure: AccessToken (15 min) + RefreshToken (30 days, rotating)
  - Stolen token detection: reuse of revoked refresh token → revoke ALL user sessions
  - SkillHubCore must have min 2 GCP instances (auth cannot cold-start)

Hard rules:
  1. Scope = SkillHubCore only. Do not touch other services.
  2. All 1138+ existing tests must stay green.
  3. Run after every sprint: pnpm lint; pnpm typecheck:all; pnpm test; pnpm build:all
  4. JWT_SECRET and JWT_REFRESH_SECRET must be different 64-char strings
  5. Never log passwords, tokens, or PII in any log statement

Read before starting: PHASE-SKILLHUBCORE.md (full service spec + DB schema + JWT structure)
```

---

## Phase SHC-1 — Foundation (People DB + Service Scaffold)

### Sprint SHC-1-A — Database Setup

#### SHC-1-A-01 · Create `packages/db-people` · `SCHEMA` · M

- **File path**: `packages/db-people/`
- **Dependencies**: People DB Neon account created, DATABASE_URL_PEOPLE in .env
- **Outputs**: Drizzle schema files, drizzle.config.ts, migration files, all 6 tables created in Neon

**▶ AI PROMPT**
```
Create packages/db-people in the Turborepo monorepo.

Package name: @platform/db-people
Path: packages/db-people/

Structure:
  packages/db-people/
    package.json          → name: "@platform/db-people"
    drizzle.config.ts     → uses DATABASE_DIRECT_URL_PEOPLE for migrations
    src/
      index.ts            → exports: db, dbReadOnly, schema
      db.ts               → Drizzle client using DATABASE_URL_PEOPLE (pooled)
      schema/
        users.ts          → users table
        platform-access.ts → platform_access table
        subscriptions.ts  → subscriptions table
        sso-sessions.ts   → sso_sessions table
        token-families.ts → refresh_token_families table
        audit-log.ts      → auth_audit_log table

Create Drizzle TypeScript schemas from this SQL (copy field names exactly):

users: id (uuid pk), email (text unique not null), email_verified (bool default false),
  phone (text), phone_verified (bool default false), full_name (text not null),
  avatar_url (text), date_of_birth (date), country (varchar 2 default 'IN'),
  preferred_lang (varchar 10 default 'en'), timezone (text default 'Asia/Kolkata'),
  status (text enum: active/suspended/deleted default active),
  created_at, updated_at, deleted_at (timestamptz)

platform_access: id (uuid pk), user_id (uuid FK users), platform (text enum:
  realtutorialhub/skillup/both), granted_at (timestamptz default now),
  expires_at (timestamptz nullable), UNIQUE(user_id, platform)

subscriptions: id (uuid pk), user_id (uuid FK users), plan_type (text enum:
  free/notes_only/exam_only/notes_exam/live_training/internship/placement/
  combo_digital/combo_full), platform (text not null), status (text enum:
  active/paused/cancelled/expired default active), started_at, expires_at,
  auto_renew (bool default false), payment_ref (text), created_at
  INDEX on (user_id, status)

sso_sessions: id (uuid pk), user_id (uuid FK users), refresh_token (text unique not null),
  device_info (jsonb), ip_address (inet), platforms (text array),
  issued_at, expires_at (not null), revoked_at, revoke_reason
  INDEX on user_id, INDEX on refresh_token

refresh_token_families: id (uuid pk), user_id (uuid FK users), family_id (text not null),
  is_compromised (bool default false), created_at

auth_audit_log: id (uuid pk), user_id (uuid nullable), action (text not null:
  login/logout/refresh/register/password_reset), platform (text), ip_address (inet),
  user_agent (text), success (bool), error (text), created_at

After creating schemas, run:
  pnpm --filter @platform/db-people db:generate
  pnpm --filter @platform/db-people db:migrate

Add to turbo.json pipeline. Add to pnpm-workspace.yaml.
Verify all 6 tables exist in Neon people_prod.
Run pnpm typecheck:all → zero errors.
```

---

#### SHC-1-A-02 · Create `services/skillhubcore-service` scaffold · `SERVICE` · M

- **File path**: `services/skillhubcore-service/`
- **Dependencies**: SHC-1-A-01
- **Outputs**: Hono app skeleton, middleware setup, CLAUDE.md, package.json

**▶ AI PROMPT**
```
Create the skillhubcore-service scaffold in the Turborepo monorepo.

Path: services/skillhubcore-service/
Package name: @platform/skillhubcore-service
Runtime: Hono on Node.js (NOT Cloudflare Workers — this runs on GCP Cloud Run)

Structure:
  services/skillhubcore-service/
    CLAUDE.md             → service purpose + DB + port + env vars
    package.json          → name: @platform/skillhubcore-service, port 8080
    tsconfig.json         → extends ../../tsconfig.base.json
    Dockerfile            → multi-stage Node.js 20 Alpine build
    src/
      index.ts            → Hono app entry point, port 8080
      modules/
        auth/
          auth.routes.ts      → route definitions only
          auth.service.ts     → empty class AuthService with method stubs
          auth.types.ts       → RegisterInput, LoginInput, AuthResult interfaces
        sso/
          sso.routes.ts
          sso.service.ts      → empty class SSOService with stubs
          sso.types.ts
        subscription/
          subscription.routes.ts
          subscription.service.ts → empty class SubscriptionService
          plan.config.ts      → PLAN_FEATURES matrix (copy from blueprint)
          subscription.types.ts
        user/
          user.repository.ts  → class UserRepository with findByEmail, findById, create stubs
          user.service.ts     → class UserService
          user.routes.ts
      middleware/
        verify-jwt.ts       → Hono middleware: extracts + verifies JWT, sets userId in context
        require-feature.ts  → Hono middleware: checks subscription.features
        rate-limit.ts       → Upstash Ratelimit (5 login attempts/min per IP)
      lib/
        db.ts               → imports from @platform/db-people
        cache.ts            → Upstash Redis client
        logger.ts           → structured logger (reuse packages/observability pattern)

PLAN_FEATURES matrix (copy exactly):
  free: ['notes']
  notes_only: ['notes']
  exam_only: ['exam']
  notes_exam: ['notes','exam','ai_tutor']
  live_training: ['notes','exam','ai_tutor','live_training']
  internship: ['notes','exam','ai_tutor','live_training','internship']
  placement: ['notes','exam','ai_tutor','live_training','internship','placement']
  combo_digital: ['notes','exam','ai_tutor','live_training']
  combo_full: ['notes','exam','ai_tutor','live_training','internship','placement']

Add to turbo.json. Add to pnpm-workspace.yaml.
Run pnpm typecheck:all → zero errors. Run pnpm build:all → passes.
```

---

### Sprint SHC-1 Deep Audit
```
Before moving to SHC-2 confirm:
□ packages/db-people builds: pnpm --filter @platform/db-people build
□ All 6 tables exist in Neon people_prod (check Neon console)
□ skillhubcore-service compiles: pnpm --filter @platform/skillhubcore-service build
□ pnpm typecheck:all → zero errors
□ No existing tests broken (pnpm test → 1138+ passing)
```

---

## Phase SHC-2 — Auth Core

### Sprint SHC-2-A — Register + Login

#### SHC-2-A-01 · `TokenService` — JWT sign + verify · `SERVICE` · M

- **File path**: `services/skillhubcore-service/src/modules/auth/token.service.ts`
- **Dependencies**: SHC-1 complete, JWT_SECRET + JWT_REFRESH_SECRET in .env
- **Class**: `TokenService`
- **Key methods**: `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)`

**▶ AI PROMPT**
```
Create TokenService in services/skillhubcore-service/src/modules/auth/token.service.ts

Use jose library (edge-compatible JWT — already in project).

AccessTokenPayload interface (in auth.types.ts):
  sub: string           → userId UUID
  email: string
  name: string
  platforms: ('realtutorialhub'|'skillup')[]
  subscription: {
    plan: string
    expiresAt: number   → unix timestamp
    features: ('notes'|'exam'|'ai_tutor'|'live_training'|'internship'|'placement')[]
  }
  roles: ('student'|'faculty'|'admin'|'super_admin')[]
  iat: number
  exp: number           → iat + 900 (15 minutes)
  iss: 'skillhubcore.in'

RefreshTokenPayload interface:
  sub: string
  family: string        → token family ID
  platforms: string[]
  iat: number
  exp: number           → iat + 2592000 (30 days)

class TokenService {
  signAccessToken(payload: Omit<AccessTokenPayload,'iat'|'exp'>): Promise<string>
  signRefreshToken(payload: Omit<RefreshTokenPayload,'iat'|'exp'>): Promise<string>
  verifyAccessToken(token: string): Promise<AccessTokenPayload>
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>
}

Use env vars: JWT_SECRET (access), JWT_REFRESH_SECRET (refresh).
Both must be different values. Throw typed errors: TokenExpiredError, TokenInvalidError.

Also create packages/auth/src/verify.ts (shared with exam/tutorial services):
  export async function verifyAccessToken(token: string): Promise<AccessTokenPayload>
  → Uses JWT_SECRET env var
  → Edge-compatible (jose only, no Node crypto)
  → This is what exam-service and tutorial-service import to verify tokens locally

Write unit tests: sign → verify round trip, expired token throws, wrong secret throws.
Run: pnpm typecheck:all → zero errors.
```

---

#### SHC-2-A-02 · `PasswordService` — bcrypt hash + verify · `SERVICE` · S

- **File path**: `services/skillhubcore-service/src/modules/auth/password.service.ts`
- **Class**: `PasswordService`
- **Key methods**: `hash(plain)`, `verify(plain, hash)`, `generateResetToken()`

**▶ AI PROMPT**
```
Create PasswordService in services/skillhubcore-service/src/modules/auth/password.service.ts

class PasswordService {
  async hash(plainPassword: string): Promise<string>
    → bcryptjs, rounds: 12
    → Throw if plainPassword.length < 8

  async verify(plainPassword: string, hashedPassword: string): Promise<boolean>
    → Returns false (never throws) on mismatch

  generateResetToken(): string
    → crypto.randomBytes(32).toString('hex')
    → Returns 64-char hex string

  generateOTP(): string
    → 6-digit numeric OTP for email verification
}

NEVER log passwords. NEVER return hashes in API responses.
Write unit tests: hash is not plain text, verify works, wrong password returns false.
```

---

#### SHC-2-A-03 · `AuthService.register` + `AuthService.login` · `SERVICE` · L ⚠ USER-GATED

- **File path**: `services/skillhubcore-service/src/modules/auth/auth.service.ts`
- **Class**: `AuthService`
- **Key methods**: `register(input)`, `login(input)`, `logout(refreshToken)`

**▶ AI PROMPT**
```
Implement AuthService.register and AuthService.login in
services/skillhubcore-service/src/modules/auth/auth.service.ts

class AuthService {
  constructor(
    private userRepo: UserRepository,
    private tokenService: TokenService,
    private passwordService: PasswordService,
    private db: PeopleDB
  ) {}

  async register(input: RegisterInput): Promise<AuthResult>
    RegisterInput: { email, password, fullName, platform: 'realtutorialhub'|'skillup', role?: 'student'|'faculty' }
    Steps:
      1. Check email not already in users table → throw ConflictError if exists
      2. Hash password with PasswordService.hash()
      3. INSERT into users table
      4. INSERT into platform_access { user_id, platform: input.platform }
      5. INSERT into subscriptions { user_id, plan_type: 'free', platform, status: 'active' }
      6. Load PLAN_FEATURES for 'free' plan
      7. Generate familyId = crypto.randomUUID()
      8. Sign AccessToken: { sub: userId, email, name: fullName,
           platforms: [input.platform], subscription: { plan: 'free', features: ['notes'] },
           roles: [input.role ?? 'student'] }
      9. Sign RefreshToken: { sub: userId, family: familyId, platforms: [input.platform] }
      10. INSERT into sso_sessions { user_id, refresh_token: hashedRefreshToken, platforms, expires_at: now+30days }
      11. INSERT into refresh_token_families { user_id, family_id: familyId }
      12. INSERT into auth_audit_log { user_id, action: 'register', platform, success: true }
      13. Return { accessToken, refreshToken, user: { id, email, name, platforms, subscription } }

  async login(input: LoginInput): Promise<AuthResult>
    LoginInput: { email, password, platform: string, ipAddress?: string }
    Steps:
      1. Find user by email → throw NotFoundError if missing
      2. Check user.status === 'active' → throw SuspendedError if not
      3. Verify password → throw UnauthorizedError if wrong (log failed attempt)
      4. Load all platform_access rows for user
      5. If input.platform not in platform_access → INSERT it (auto-grant on login)
      6. Load active subscription for user
      7. Load PLAN_FEATURES for subscription.plan_type
      8. Sign AccessToken with ALL platforms user has access to
      9. Sign RefreshToken
      10. INSERT sso_session, INSERT audit_log
      11. Return AuthResult

  async logout(refreshToken: string): Promise<void>
    → Find sso_session by hashed refresh token
    → Set revoked_at = now(), revoke_reason = 'logout'
    → INSERT audit_log { action: 'logout' }
}

Write comprehensive unit tests for all paths including error cases.
Run pnpm typecheck:all and pnpm test → all pass.
```

---

#### SHC-2-A-04 · Auth API routes · `SERVICE` · M

- **File path**: `services/skillhubcore-service/src/modules/auth/auth.routes.ts`
- **Routes**: POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me

**▶ AI PROMPT**
```
Implement auth.routes.ts in services/skillhubcore-service/src/modules/auth/auth.routes.ts

Mount on Hono app at /auth prefix.

POST /auth/register
  Body: { email, password, fullName, platform, role? }
  Validation: Zod schema — email format, password min 8 chars, fullName min 2 chars
  Returns 201: { accessToken, refreshToken, user: { id, email, name, platforms, subscription } }
  Returns 409 if email exists
  Rate limit: 10 registrations per IP per hour

POST /auth/login
  Body: { email, password, platform }
  Validation: Zod schema
  Returns 200: { accessToken, refreshToken, user }
  Returns 401 if wrong credentials
  Returns 403 if suspended
  Rate limit: 5 attempts per IP per minute (Upstash Ratelimit)

POST /auth/logout
  Body: { refreshToken }
  Returns 200: { success: true }

GET /auth/me
  Header: Authorization: Bearer <accessToken>
  Middleware: verify-jwt.ts
  Returns 200: { user: { id, email, name, platforms, subscription, roles } }

All routes:
  → Request validation with Zod (throw 400 on invalid input)
  → Structured error responses: { error: string, code: string }
  → Never expose internal error details in production

Write integration tests for each route.
```

---

### Sprint SHC-2 Deep Audit
```
Before moving to SHC-3 confirm:
□ POST /auth/register creates user + platform_access + subscription in DB
□ POST /auth/login returns valid JWT
□ JWT contains platforms[], subscription.features[], roles[]
□ GET /auth/me returns user from token (no DB call)
□ Rate limiting blocks after 5 failed logins
□ pnpm test → all pass
```

---

## Phase SHC-3 — Token Rotation + Stolen Token Detection

#### SHC-3-A-01 · `POST /auth/refresh` — token rotation · `SERVICE` · L

- **File path**: `services/skillhubcore-service/src/modules/auth/auth.service.ts` (add method)
- **Key method**: `AuthService.refresh(refreshToken)`

**▶ AI PROMPT**
```
Implement AuthService.refresh() and POST /auth/refresh route.

AuthService.refresh(refreshToken: string): Promise<AuthResult>
  Steps:
    1. Hash the incoming refresh token
    2. Find sso_session by hashed token
    3. If NOT found → throw UnauthorizedError('Invalid refresh token')
    4. If revoked_at is set → STOLEN TOKEN DETECTED:
       a. Load refresh_token_families record by the token's family_id
       b. Set is_compromised = true on the family
       c. Find ALL sso_sessions for this user → set revoked_at = now(), revoke_reason = 'compromised_family'
       d. INSERT auth_audit_log { action: 'token_family_compromised' }
       e. throw SecurityError('Session compromised — all sessions revoked')
    5. If expires_at < now() → throw TokenExpiredError
    6. Verify refresh token signature with JWT_REFRESH_SECRET
    7. Revoke OLD sso_session (set revoked_at = now(), revoke_reason = 'rotated')
    8. Issue new access token + new refresh token (same family_id)
    9. INSERT new sso_session with new refresh token
    10. Return { accessToken, refreshToken }

POST /auth/refresh route:
  Body: { refreshToken }
  Returns 200: { accessToken, refreshToken }
  Returns 401: invalid token
  Returns 440: session compromised (custom code)

Write tests:
  - Valid refresh returns new token pair
  - Reuse of revoked token triggers family compromise
  - Family compromise revokes ALL user sessions
  - Expired refresh token returns 401
```

---

## Phase SHC-4 — SSO (Cross-Platform Access)

#### SHC-4-A-01 · `SSOService` — cross-platform platform access · `SERVICE` · M

- **File path**: `services/skillhubcore-service/src/modules/sso/sso.service.ts`
- **Class**: `SSOService`
- **Key methods**: `grantPlatformAccess(userId, platform)`, `getUserPlatforms(userId)`, `validateToken(token)`

**▶ AI PROMPT**
```
Implement SSOService in services/skillhubcore-service/src/modules/sso/sso.service.ts

class SSOService {
  async grantPlatformAccess(userId: string, platform: 'realtutorialhub'|'skillup'): Promise<void>
    → INSERT into platform_access (upsert — ignore if already exists)
    → Publish student.created event via packages/events if new platform

  async getUserPlatforms(userId: string): Promise<string[]>
    → SELECT platform FROM platform_access WHERE user_id = userId
    → Returns array of platform names

  async issueMultiPlatformToken(userId: string): Promise<string>
    → Load all platform_access rows for user
    → Load active subscription
    → Load PLAN_FEATURES for plan
    → Sign new AccessToken with ALL platforms user has access to
    → Returns new accessToken (does NOT create new session — only refreshes claims)

  async validateToken(token: string): Promise<AccessTokenPayload | null>
    → Verify JWT signature
    → Return payload if valid, null if invalid/expired
    → Used by GET /sso/validate endpoint (called by API Gateway health check)
}

POST /sso/grant-platform
  Body: { platform }
  Auth: requires valid JWT
  → Grants access to specified platform for current user
  → Returns new access token with updated platforms[]

GET /sso/platforms
  Auth: requires valid JWT
  → Returns list of platforms user has access to

GET /sso/validate
  Auth: requires valid JWT
  → Returns { valid: true, payload: {...} } or { valid: false }
  → Used by other services to optionally verify tokens (though most verify locally)

Write tests for platform grant, multi-platform token generation.
```

---

## Phase SHC-5 — Subscription Engine

#### SHC-5-A-01 · `SubscriptionService` — plans + feature gating · `SERVICE` · M ⚠ USER-GATED

- **File path**: `services/skillhubcore-service/src/modules/subscription/subscription.service.ts`
- **Class**: `SubscriptionService`

**▶ AI PROMPT**
```
Implement SubscriptionService in
services/skillhubcore-service/src/modules/subscription/subscription.service.ts

class SubscriptionService {
  async getCurrentSubscription(userId: string): Promise<SubscriptionDetails>
    → SELECT from subscriptions WHERE user_id = userId AND status = 'active'
    → Attach features from PLAN_FEATURES[plan_type]
    → Return { plan, features, expiresAt, status, platform }

  async hasFeature(userId: string, feature: Feature): Promise<boolean>
    → Get current subscription
    → Return subscription.features.includes(feature)
    → Cache result in Redis for 5 minutes (key: feature-check:{userId}:{feature})

  async upgradePlan(userId: string, newPlan: SubscriptionPlan, paymentRef: string): Promise<void>
    → UPDATE subscriptions SET plan_type = newPlan, payment_ref = paymentRef
    → Invalidate Redis cache for this user
    → Publish subscription.upgraded event

  async cancelSubscription(userId: string): Promise<void>
    → UPDATE subscriptions SET status = 'cancelled'
    → Invalidate Redis cache

  async activateSubscription(userId: string, plan: SubscriptionPlan, paymentRef: string): Promise<void>
    → Called when payment.received event is consumed
    → CREATE or UPDATE subscription to active status with new plan
    → Invalidate Redis cache
    → User will get new features on next token refresh
}

GET /subscriptions/current → returns { plan, features, expiresAt }
POST /subscriptions/upgrade → body: { plan, paymentRef } (admin use)
POST /subscriptions/cancel
GET /subscriptions/check-feature?feature=exam → { allowed: boolean, reason?: string }
  → This endpoint called by tutorial-service to gate content access

Write tests: feature check cached, upgrade clears cache, free user cannot access exam.
```

---

## Phase SHC-6 — Event Integration

#### SHC-6-A-01 · Consume `payment.received` → upgrade subscription · `SERVICE` · M

- **File path**: `services/skillhubcore-service/src/modules/events/handlers/payment-received.handler.ts`

**▶ AI PROMPT**
```
Create POST /api/workers/payment-received QStash consumer handler in
services/skillhubcore-service/src/modules/events/handlers/payment-received.handler.ts

Use createQStashHandler from packages/events (already exists).

PaymentReceivedPayload (from packages/events/src/types.ts):
  { userId, plan, paymentRef, platform, amount, currency }

Handler logic:
  1. Verify QStash signature (createQStashHandler wraps this)
  2. Call SubscriptionService.activateSubscription(userId, plan, paymentRef)
  3. INSERT into auth_audit_log { action: 'subscription_upgraded', user_id: userId }
  4. Return 200 OK

Also create:
POST /api/workers/student-enrolled QStash consumer
  → When student enrolls in SkillUp: grant 'skillup' platform access
  → Call SSOService.grantPlatformAccess(userId, 'skillup')

Publish user.registered event on successful registration:
  services/skillhubcore-service/src/modules/events/publishers/user-registered.publisher.ts
  → Triggered in AuthService.register()
  → Payload: { userId, email, name, platform, plan: 'free' }
  → Consumer: notification-service (welcome email)

Write tests: payment event activates subscription, student enrolled grants platform access.
```

---

## Phase SHC-7 — Admin App (skillhubcore-admin)

#### SHC-7-A-01 · Create `apps/skillhubcore-admin` · `FRONTEND` · L ⚠ USER-GATED

- **File path**: `apps/skillhubcore-admin/`
- **Domain**: `admin.skillhubcore.in`
- **Tech**: Next.js 15, App Router, Tailwind, same design system as existing admin-app

**▶ AI PROMPT**
```
Create apps/skillhubcore-admin in the monorepo.

Package name: @platform/skillhubcore-admin
Mirror the structure and design language of existing apps/admin-app EXACTLY.
Same Tailwind config, same component patterns, same auth flow.

Pages to create:

app/(auth)/login/page.tsx
  → Login form → POST api.skillhubcore.in/auth/login
  → On success: store tokens in httpOnly cookies, redirect to /dashboard
  → Only super_admin role can access this app

app/(admin)/dashboard/page.tsx
  → Stats: total users, active subscriptions, platform distribution
  → Charts: users per platform, subscriptions per plan

app/(admin)/users/page.tsx
  → Table: all users with search, filter by platform, role, status
  → Columns: name, email, platforms, plan, status, created_at
  → Actions: suspend, activate, reset password

app/(admin)/users/[userId]/page.tsx
  → User detail: profile + platform access + subscription history + audit log
  → Actions: grant platform access, change plan, suspend

app/(admin)/subscriptions/page.tsx
  → All subscriptions filterable by plan, status, platform
  → Bulk actions: expire, upgrade

app/(admin)/audit-log/page.tsx
  → All auth_audit_log entries with filters

app/api/                    → BFF routes: proxy to api.skillhubcore.in
  auth/route.ts
  users/route.ts
  subscriptions/route.ts

Use react-query for data fetching. Same error handling pattern as existing admin-app.
NO new design language — match existing admin-app styling exactly.
Run pnpm typecheck:all and pnpm build:all → pass.
```

---

## Phase SHC-8 — GCP Deployment

#### SHC-8-A-01 · Dockerfile + GCP Cloud Run deployment · `INFRA` · M

- **File path**: `services/skillhubcore-service/Dockerfile` + `.github/workflows/deploy-cloudrun.yml`

**▶ AI PROMPT**
```
Create GCP Cloud Run deployment for skillhubcore-service.

1. services/skillhubcore-service/Dockerfile
   Multi-stage Node.js 20 Alpine build (mirror existing api-server Dockerfile pattern)
   EXPOSE 8080
   Min 2 instances configured in Cloud Run (auth cannot cold-start)

2. .github/workflows/deploy-cloudrun.yml
   Trigger: push to main, paths: services/skillhubcore-service/** or packages/db-people/**
   Steps:
     - Checkout, pnpm install
     - Run migrations: pnpm --filter @platform/db-people db:migrate
       env: DATABASE_DIRECT_URL_PEOPLE from GitHub Secrets
     - Build Docker image
     - Push to GCP Artifact Registry
     - Deploy to Cloud Run: skillhubcore-service, region asia-south1, min-instances 2
     - Smoke test: curl https://api.skillhubcore.in/healthz → 200

3. Add GET /healthz route to skillhubcore-service:
   Returns { status: 'ok', service: 'skillhubcore', ts: Date.now() }

4. Cloudflare DNS update instruction (add to README):
   admin.skillhubcore.in → CNAME → skillhubcore-admin GCP Cloud Run URL
   api.skillhubcore.in   → handled by API Gateway (Cloudflare Worker)

GitHub Secrets needed (add to NEXT_ACTION.md):
  DATABASE_DIRECT_URL_PEOPLE
  DATABASE_URL_PEOPLE
  JWT_SECRET (64 char)
  JWT_REFRESH_SECRET (64 char, different from JWT_SECRET)
  REDIS_URL (Upstash)
  RESEND_API_KEY
```

---

### Sprint SHC-8 Deep Audit — SkillHubCore COMPLETE
```
□ POST /auth/register creates user + platform_access + subscription in people_prod
□ POST /auth/login returns JWT with platforms[], subscription.features[], roles[]
□ JWT verified by exam-service using packages/auth/verify.ts (no API call)
□ Token rotation works — new pair on refresh
□ Reuse of revoked token → all sessions revoked
□ Free user cannot access 'exam' feature (GET /subscriptions/check-feature)
□ payment.received event upgrades subscription
□ admin.skillhubcore.in loads and shows users
□ GCP Cloud Run deployed with min 2 instances
□ pnpm typecheck:all → zero errors
□ pnpm test → all 1138+ tests pass
□ GET /healthz → 200 from GCP URL
```

