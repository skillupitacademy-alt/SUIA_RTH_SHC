# SkillHubCore — Platform Brain Blueprint
## docs/blueprints/PHASE-SKILLHUBCORE.md

> Status: Ready for implementation
> Domain: skillhubcore.in | API: api.skillhubcore.in
> Priority: HIGH — needed before any cross-platform work

---

## Purpose

SkillHubCore is the central backend that connects RealTutorialHub and
SkillUp IT Academy. It owns user identity, SSO, subscriptions, and
cross-platform routing. Every user on every platform is authenticated
through SkillHubCore.

---

## Part 1: What SkillHubCore Does

```
RealTutorialHub ──────┐
                      ├──→ SkillHubCore ←── skillhubcore.in
SkillUp IT Academy ───┘         │
                                │ owns:
                          ┌─────┴──────────────────────────┐
                          │  1. User identity (SSO)         │
                          │  2. Subscription engine          │
                          │  3. Cross-platform JWT claims    │
                          │  4. Access control per platform  │
                          │  5. Progress data sync           │
                          └────────────────────────────────┘
```

---

## Part 2: People DB Schema (SkillHubCore owns these tables)

```sql
-- ── USER IDENTITY (source of truth for userId across all platforms) ──────
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  email_verified    BOOLEAN DEFAULT false,
  phone             TEXT,
  phone_verified    BOOLEAN DEFAULT false,
  full_name         TEXT NOT NULL,
  avatar_url        TEXT,
  date_of_birth     DATE,
  country           VARCHAR(2) DEFAULT 'IN',
  preferred_lang    VARCHAR(10) DEFAULT 'en',
  timezone          TEXT DEFAULT 'Asia/Kolkata',
  status            TEXT DEFAULT 'active' CHECK (
    status IN ('active','suspended','deleted')
  ),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- ── PLATFORM ACCESS ────────────────────────────────────────────────────────
CREATE TABLE platform_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  platform    TEXT NOT NULL CHECK (platform IN ('realtutorialhub','skillup','both')),
  granted_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ,
  UNIQUE(user_id, platform)
);

-- ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  plan_type       TEXT NOT NULL CHECK (plan_type IN (
    'free',
    'notes_only',
    'exam_only',
    'notes_exam',
    'live_training',
    'internship',
    'placement',
    'combo_digital',   -- notes + exam + live
    'combo_full'       -- everything
  )),
  platform        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active','paused','cancelled','expired')
  ),
  started_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  auto_renew      BOOLEAN DEFAULT false,
  payment_ref     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);

-- ── SSO SESSIONS ───────────────────────────────────────────────────────────
CREATE TABLE sso_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  refresh_token   TEXT NOT NULL UNIQUE,
  device_info     JSONB,
  ip_address      INET,
  platforms       TEXT[],             -- which platforms this session is valid for
  issued_at       TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  revoke_reason   TEXT
);

CREATE INDEX idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX idx_sso_sessions_token ON sso_sessions(refresh_token);

-- ── REFRESH TOKEN FAMILIES (stolen token detection) ────────────────────────
CREATE TABLE refresh_token_families (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  family_id     TEXT NOT NULL,
  is_compromised BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── AUDIT LOG ──────────────────────────────────────────────────────────────
CREATE TABLE auth_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  action      TEXT NOT NULL,  -- 'login', 'logout', 'refresh', 'register', 'password_reset'
  platform    TEXT,
  ip_address  INET,
  user_agent  TEXT,
  success     BOOLEAN,
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 3: JWT Structure (Cross-Platform Claims)

```typescript
// Access Token (short-lived: 15 minutes)
interface AccessTokenPayload {
  sub: string                    // userId (UUID)
  email: string
  name: string
  platforms: Platform[]          // ['realtutorialhub'] | ['skillup'] | ['realtutorialhub','skillup']
  subscription: {
    plan: SubscriptionPlan
    expiresAt: number            // Unix timestamp
    features: Feature[]         // what this user can access
  }
  roles: Role[]                  // ['student'] | ['faculty'] | ['admin']
  iat: number
  exp: number                    // iat + 900 (15 min)
  iss: 'skillhubcore.in'
}

// Refresh Token (long-lived: 30 days)
interface RefreshTokenPayload {
  sub: string
  family: string                 // token family ID for rotation
  platforms: Platform[]
  iat: number
  exp: number                    // iat + 2592000 (30 days)
}

type Platform = 'realtutorialhub' | 'skillup'
type Role = 'student' | 'faculty' | 'admin' | 'super_admin'
type Feature = 'notes' | 'exam' | 'ai_tutor' | 'live_training' | 'internship' | 'placement'

// Feature matrix per plan:
const PLAN_FEATURES: Record<SubscriptionPlan, Feature[]> = {
  free:           ['notes'],
  notes_only:     ['notes'],
  exam_only:      ['exam'],
  notes_exam:     ['notes', 'exam', 'ai_tutor'],
  live_training:  ['notes', 'exam', 'ai_tutor', 'live_training'],
  internship:     ['notes', 'exam', 'ai_tutor', 'live_training', 'internship'],
  placement:      ['notes', 'exam', 'ai_tutor', 'live_training', 'internship', 'placement'],
  combo_digital:  ['notes', 'exam', 'ai_tutor', 'live_training'],
  combo_full:     ['notes', 'exam', 'ai_tutor', 'live_training', 'internship', 'placement'],
}
```

---

## Part 4: Service Structure

```
services/skillhubcore-service/
├── CLAUDE.md
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.service.ts          → register, login, logout, refresh
│   │   │   ├── token.service.ts         → sign, verify, rotate, revoke
│   │   │   ├── password.service.ts      → hash, reset, recover
│   │   │   └── auth.routes.ts
│   │   ├── sso/
│   │   │   ├── sso.service.ts           → cross-platform token issuance
│   │   │   ├── platform-access.service.ts → grant/revoke platform access
│   │   │   └── sso.routes.ts
│   │   ├── subscription/
│   │   │   ├── subscription.service.ts  → create, upgrade, cancel, check features
│   │   │   ├── plan.config.ts           → PLAN_FEATURES matrix
│   │   │   └── subscription.routes.ts
│   │   ├── user/
│   │   │   ├── user.repository.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.routes.ts
│   │   └── events/
│   │       ├── handlers/
│   │       │   └── payment-received.handler.ts → upgrades subscription on payment
│   │       └── publishers/
│   │           └── user-registered.publisher.ts
│   ├── middleware/
│   │   ├── verify-jwt.ts          → validates access token (used by all other services)
│   │   ├── require-feature.ts     → checks subscription.features contains required feature
│   │   └── rate-limit.ts          → Upstash Ratelimit
│   └── lib/
│       ├── db.ts                  → People DB client
│       ├── cache.ts               → Redis (session cache, token blacklist)
│       └── logger.ts
└── package.json
```

---

## Part 5: SSO Flow (How Cross-Platform Login Works)

```
STEP 1: User registers at realtutorialhub.com
  → POST api.skillhubcore.in/auth/register
  → Creates user in People DB
  → Creates platform_access { platform: 'realtutorialhub' }
  → Creates subscription { plan: 'free', platform: 'realtutorialhub' }
  → Returns access token (15 min) + refresh token (30 days)
  → Access token payload: { platforms: ['realtutorialhub'], roles: ['student'], ... }

STEP 2: User logs into skillupitacademy.com (same email)
  → POST api.skillhubcore.in/auth/login
  → Verifies credentials against People DB
  → Checks platform_access: 'skillup' not in table yet
  → Creates platform_access { platform: 'skillup' }
  → Returns new access token: { platforms: ['realtutorialhub', 'skillup'], ... }

STEP 3: Any platform validates JWT without DB call
  → verify(token, JWT_SECRET)
  → Check token.platforms includes 'realtutorialhub'
  → Check token.subscription.features includes required feature
  → If valid: proceed. No DB call needed.
  → If expired: POST api.skillhubcore.in/auth/refresh with refresh token

STEP 4: Token refresh (rotation)
  → Verify refresh token family not compromised
  → Issue new access token (15 min) + new refresh token (30 days)
  → Invalidate old refresh token
  → If old refresh token reused after invalidation:
    → Mark family as compromised
    → Revoke ALL sessions for this user (stolen token protection)
```

---

## Part 6: API Routes

```
POST /auth/register          → create account
POST /auth/login             → email + password login
POST /auth/logout            → revoke refresh token
POST /auth/refresh           → rotate refresh token, issue new access token
POST /auth/forgot-password   → send reset email
POST /auth/reset-password    → apply new password with reset token
POST /auth/verify-email      → verify email with OTP
GET  /auth/me                → current user profile (from token)

GET  /sso/platforms          → which platforms user has access to
POST /sso/grant-platform     → grant access to additional platform
GET  /sso/validate           → validate access token (used by other services)

GET  /subscriptions/current  → current plan + features + expiry
POST /subscriptions/upgrade  → change plan (triggers payment)
POST /subscriptions/cancel   → cancel subscription

GET  /users/profile          → user profile
PUT  /users/profile          → update profile
PUT  /users/password         → change password
```

---

## Part 7: How Other Services Use SkillHubCore

```typescript
// In exam-service, tutorial-service, skillup-service middleware:

import { verifyAccessToken } from '@platform/auth'

async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const payload = await verifyAccessToken(token)
  // payload.platforms → which platforms this user has access to
  // payload.subscription.features → what they can do
  // payload.roles → student, faculty, admin

  // Check platform access:
  if (!payload.platforms.includes('realtutorialhub')) {
    return c.json({ error: 'Platform access denied' }, 403)
  }

  // Check feature access:
  if (!payload.subscription.features.includes('exam')) {
    return c.json({ error: 'Upgrade required' }, 402)
  }

  c.set('userId', payload.sub)
  c.set('userPayload', payload)
  await next()
}

// NOTE: verifyAccessToken uses Jose (edge-compatible JWT verification)
// It NEVER calls SkillHubCore API to validate — token is self-contained
// Only token refresh calls SkillHubCore API
```

---

## Part 8: Deployment

```
Platform:  Railway (always-on — auth cannot cold-start)
Domain:    api.skillhubcore.in → Cloudflare DNS → Railway
Port:      8080
Min instances: 2 (high availability — auth is critical path)

Environment variables:
  DATABASE_PEOPLE_URL=          → Neon People DB (pooled)
  DATABASE_PEOPLE_DIRECT_URL=   → Neon People DB (direct, for migrations)
  JWT_SECRET=                   → 64-char random string
  JWT_REFRESH_SECRET=           → different 64-char random string
  REDIS_URL=                    → Upstash Redis
  RESEND_API_KEY=               → for password reset emails
  ALLOWED_ORIGINS=realtutorialhub.com,skillupitacademy.com
```

---

## Part 9: Verification Checklist

```
□ POST /auth/register creates user + platform_access + subscription
□ POST /auth/login returns valid JWT with correct claims
□ JWT contains platforms[], subscription.features[], roles[]
□ Token verified by exam-service without calling SkillHubCore API
□ Refresh token rotation works (new token issued, old invalidated)
□ Stolen token detection: reuse of revoked token revokes all sessions
□ Feature access check: free user cannot access 'exam' feature
□ Cross-platform: login at skillup with realtutorialhub account works
□ pnpm typecheck:all → zero errors
□ Rate limiting: 5 login attempts per IP per minute
```

---

*Phase: SkillHubCore v1 | Priority: HIGH | Status: Ready*
