# Gap G4: Rate Limiting & DDoS Protection
## docs/blueprints/GAP-G4-RATE-LIMITING.md

> Priority: CRITICAL — auth routes exposed, Vercel quota at risk
> Applies to: All services, especially exam-service and auth routes

---

## Part 1: Rate Limit Targets Per Route

```
Route                          Limit              Window    Action on exceed
───────────────────────────────────────────────────────────────────────────
POST /auth/login               5 requests         1 min     Block IP + 429
POST /auth/register            3 requests         1 min     Block IP + 429
POST /auth/forgot-password     3 requests         5 min     Block IP + 429
POST /auth/refresh             20 requests        1 min     Block + log
POST /exam/start               1 request          5 min     409 (already started)
POST /exam/submit              1 request          5 min     Idempotency check
POST /ai-tutor/chat            30 requests        1 hour    429 + queue
GET  /api/* (general)          100 requests       1 min     429
POST /admin/*                  60 requests        1 min     429 + Sentry alert
Global per IP                  1000 requests      1 min     Cloudflare block
```

---

## Part 2: Implementation (Upstash Ratelimit)

```typescript
// packages/auth/src/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// Sliding window algorithm (more accurate than fixed window)
export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'rl:auth',
    analytics: true  // track in Upstash console
  }),
  examStart: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, '5 m'),
    prefix: 'rl:exam:start'
  }),
  aiTutor: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    prefix: 'rl:ai-tutor'
  }),
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:general'
  }),
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:admin'
  })
}

// Helper: get identifier (user-aware when authenticated, IP-based for auth routes)
export function getRateLimitId(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] ?? 'unknown'
  return `ip:${ip}`
}
```

---

## Part 3: Middleware Integration

```typescript
// In Next.js middleware.ts (applied at edge — zero cold start)
import { rateLimiters, getRateLimitId } from '@platform/auth/rate-limit'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Select correct limiter based on route
  let limiter = rateLimiters.general
  if (pathname.startsWith('/api/auth')) limiter = rateLimiters.auth
  if (pathname.startsWith('/api/admin')) limiter = rateLimiters.admin

  const identifier = getRateLimitId(req)
  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset)
      }
    })
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  return response
}
```

---

## Part 4: Hono Middleware (for backend services)

```typescript
// services/*/src/middleware/rate-limit.ts

import { rateLimiters, getRateLimitId } from '@platform/auth/rate-limit'
import type { MiddlewareHandler } from 'hono'

export function withRateLimit(limiterName: keyof typeof rateLimiters): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get('userId')  // set by auth middleware
    const identifier = getRateLimitId(c.req.raw, userId)
    const limiter = rateLimiters[limiterName]

    const { success, reset, remaining } = await limiter.limit(identifier)

    if (!success) {
      return c.json({
        error: 'Too many requests',
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      }, 429)
    }

    c.header('X-RateLimit-Remaining', String(remaining))
    await next()
  }
}

// Usage in routes:
app.post('/auth/login', withRateLimit('auth'), loginHandler)
app.post('/exam/start', withAuth, withRateLimit('examStart'), startExamHandler)
```

---

## Part 5: Cloudflare WAF Rules (DDoS layer)

```
Rule 1: Block > 1000 req/min per IP at Cloudflare edge
  → Expression: (http.request.uri.path contains "/api/" and
                 cf.threat_score > 5)
  → Action: Challenge

Rule 2: Rate limit /api/auth/* globally
  → 100 req/min from same IP
  → Action: Block for 10 minutes

Rule 3: Bot detection for exam endpoints
  → Expression: http.request.uri.path matches "^/api/exam/"
  → Check: cf.bot_management.score < 30
  → Action: Challenge (CAPTCHA)

Rule 4: Country blocking (if needed)
  → Block known VPN/proxy ASNs during exam windows
  → Admin-configurable via Edge Config (Vercel) or KV (Cloudflare)
```

---

## Part 6: Verification

```
□ Login blocked after 5 attempts from same IP
□ 429 response includes Retry-After header
□ Upstash analytics show rate limit events
□ Exam start allows only 1 concurrent active exam per user
□ AI Tutor respects 30 msg/hour limit
□ Admin panel alerts on 3+ consecutive rate limit violations (Sentry)
□ Rate limit keys use user ID when authenticated (not IP)
□ Cloudflare WAF rules active and logging
```

---

*Gap: G4 | Priority: CRITICAL | Status: Ready*
