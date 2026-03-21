# PHASE-INFRA-GATEWAY: API Gateway & Event Bus
## docs/blueprints/PHASE-INFRA-GATEWAY.md

> Runtime: Hono on Cloudflare Workers
> Domain: api.realtutorialhub.com | api.skillhubcore.in
> Priority: Build first — all services route through this

---

## Part 1: What the Gateway Does

```
Every external request from any frontend app:
  student-app → api.realtutorialhub.com → Gateway → correct service
  faculty-app → api.skillupitacademy.com → Gateway → correct service

The Gateway handles:
  1. JWT verification (at edge, no DB call)
  2. Rate limiting (Upstash Ratelimit)
  3. Request routing (path-based proxy)
  4. CORS enforcement
  5. Request ID injection (X-Request-ID)
  6. Global error shape enforcement
  7. Logging (structured, to Sentry / Cloudflare Logpush)

The Gateway does NOT handle:
  → Business logic (that lives in each service)
  → Database queries
  → Heavy computation
```

---

## Part 2: Routing Table

```typescript
// services/api-gateway/src/routes/routing-table.ts

export const ROUTING_TABLE = [
  // Auth (SkillHubCore)
  { prefix: '/auth',         upstream: process.env.SKILLHUBCORE_URL, public: true },

  // Student & Faculty (People)
  { prefix: '/students',     upstream: process.env.STUDENT_FACULTY_URL, auth: true },
  { prefix: '/faculty',      upstream: process.env.STUDENT_FACULTY_URL, auth: true },
  { prefix: '/batches',      upstream: process.env.STUDENT_FACULTY_URL, auth: true },
  { prefix: '/attendance',   upstream: process.env.STUDENT_FACULTY_URL, auth: true },

  // Exam Engine
  { prefix: '/exam',         upstream: process.env.EXAM_SERVICE_URL,   auth: true },
  { prefix: '/questions',    upstream: process.env.EXAM_SERVICE_URL,   auth: true },

  // Tutorial Engine
  { prefix: '/tutorial',     upstream: process.env.TUTORIAL_SERVICE_URL, auth: true },
  { prefix: '/ai-tutor',     upstream: process.env.TUTORIAL_SERVICE_URL, auth: true },

  // Payment
  { prefix: '/payments',     upstream: process.env.PAYMENT_SERVICE_URL, auth: true },
  { prefix: '/webhooks',     upstream: process.env.PAYMENT_SERVICE_URL, public: true },
  // Webhooks are public (verified internally via gateway signature)

  // CRM
  { prefix: '/crm',          upstream: process.env.CRM_SERVICE_URL,   auth: true },
  { prefix: '/enquiries',    upstream: process.env.CRM_SERVICE_URL,   public: true },
  // /enquiries/submit is public (web form capture)

  // Notifications
  { prefix: '/notifications', upstream: process.env.NOTIFICATION_URL, auth: true },

  // Placement
  { prefix: '/placement',    upstream: process.env.PLACEMENT_URL,     auth: true },
  { prefix: '/jobs',         upstream: process.env.PLACEMENT_URL,     public: true },

  // Admin (extra permission check)
  { prefix: '/admin',        upstream: process.env.ADMIN_URL,
    auth: true, requireRole: 'admin' },
]
```

---

## Part 3: Complete Gateway Code

```typescript
// services/api-gateway/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { jwtVerify } from 'jose'

const app = new Hono()
const redis = new Redis({ url: env.UPSTASH_REDIS_URL, token: env.UPSTASH_REDIS_TOKEN })

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'gateway:rl'
})

// ── GLOBAL MIDDLEWARE ──────────────────────────────────────────────────────
app.use('*', cors({
  origin: [
    'https://realtutorialhub.com',
    'https://notes.realtutorialhub.com',
    'https://quiz.realtutorialhub.com',
    'https://skillupitacademy.com',
    'https://admin.realtutorialhub.com',
    'http://localhost:3000', // dev only
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  credentials: true,
}))

// Request ID injection
app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') ?? crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-ID', requestId)
  await next()
})

// Rate limiting
app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const { success, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    return c.json({
      error: 'Too many requests',
      requestId: c.get('requestId'),
      retryAfter: Math.ceil((reset - Date.now()) / 1000)
    }, 429)
  }

  c.header('X-RateLimit-Remaining', String(remaining))
  await next()
})

// JWT verification for protected routes
async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret)
  return payload as JWTPayload
}

// ── PROXY FUNCTION ─────────────────────────────────────────────────────────
async function proxyRequest(
  c: Context,
  upstream: string,
  requireRole?: string
): Promise<Response> {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  // JWT verification
  if (token) {
    try {
      const payload = await verifyJWT(token)
      c.set('userId', payload.sub)
      c.set('userPayload', payload)

      // Role check for admin routes
      if (requireRole && !payload.roles?.includes(requireRole)) {
        return c.json({ error: 'Insufficient permissions', requestId: c.get('requestId') }, 403)
      }
    } catch {
      return c.json({ error: 'Invalid or expired token', requestId: c.get('requestId') }, 401)
    }
  }

  // Forward request to upstream service
  const url = new URL(c.req.url)
  const upstreamUrl = `${upstream}${url.pathname}${url.search}`

  const headers = new Headers(c.req.raw.headers)
  headers.set('X-Request-ID', c.get('requestId'))
  headers.set('X-Gateway-Secret', env.INTERNAL_GATEWAY_SECRET)
  if (c.get('userId')) headers.set('X-User-ID', c.get('userId'))
  headers.delete('CF-Connecting-IP')  // Don't forward Cloudflare internal headers

  return fetch(upstreamUrl, {
    method: c.req.method,
    headers,
    body: c.req.raw.body,
  })
}

// ── ROUTE REGISTRATION ──────────────────────────────────────────────────────
for (const route of ROUTING_TABLE) {
  app.all(`${route.prefix}/*`, async (c) => {
    if (!route.public) {
      const authHeader = c.req.header('Authorization')
      if (!authHeader) {
        return c.json({ error: 'Authentication required', requestId: c.get('requestId') }, 401)
      }
    }
    return proxyRequest(c, route.upstream, route.requireRole)
  })
}

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/healthz', (c) => c.json({ status: 'ok', ts: Date.now() }))

export default app
```

---

## Part 4: QStash Event Bus (packages/events)

```typescript
// packages/events/src/publisher.ts
import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

export type PlatformEvent =
  | 'student.enrolled'
  | 'student.created'
  | 'exam.completed'
  | 'payment.received'
  | 'payment.overdue'
  | 'tutorial.subtopic_completed'
  | 'batch.session_completed'
  | 'batch.subtopics_covered'
  | 'attendance.marked'
  | 'admission.completed'
  | 'project.submitted'
  | 'certificate.issued'
  | 'placement.offer_accepted'
  | 'content.generation_requested'
  | 'content.approved_and_published'

export interface EventEnvelope<T = unknown> {
  type: PlatformEvent
  payload: T
  publishedAt: string
  publishedBy: string  // service name
  correlationId: string
}

export async function publishEvent<T>(
  type: PlatformEvent,
  payload: T,
  options?: {
    delay?: number      // seconds
    retries?: number    // default: 3
    callbackUrl?: string
  }
): Promise<void> {
  const envelope: EventEnvelope<T> = {
    type,
    payload,
    publishedAt: new Date().toISOString(),
    publishedBy: process.env.SERVICE_NAME!,
    correlationId: crypto.randomUUID()
  }

  // Route event to all interested consumers
  const consumers = EVENT_CONSUMER_MAP[type] ?? []

  await Promise.all(consumers.map(consumerUrl =>
    qstash.publishJSON({
      url: consumerUrl,
      body: envelope,
      retries: options?.retries ?? 3,
      delay: options?.delay,
      ...(options?.callbackUrl ? { callback: options.callbackUrl } : {})
    })
  ))
}

// packages/events/src/consumer.ts
import { verifySignature } from '@upstash/qstash/nextjs'

export function createQStashHandler<T>(
  handler: (envelope: EventEnvelope<T>) => Promise<void>
) {
  return async (req: Request): Promise<Response> => {
    // Verify QStash signature
    const isValid = await verifySignature(req, process.env.QSTASH_CURRENT_SIGNING_KEY!)
    if (!isValid) return new Response('Invalid signature', { status: 401 })

    const envelope: EventEnvelope<T> = await req.json()
    await handler(envelope)
    return new Response('OK', { status: 200 })
  }
}
```

---

## Part 5: Event Consumer Map

```typescript
// packages/events/src/consumer-map.ts
// Each event → list of HTTP endpoints that should receive it

export const EVENT_CONSUMER_MAP: Record<PlatformEvent, string[]> = {
  'student.enrolled': [
    `${TUTORIAL_SERVICE}/api/workers/student-enrolled`,
    `${PAYMENT_SERVICE}/api/workers/student-enrolled`,
    `${NOTIFICATION_SERVICE}/api/workers/student-enrolled`,
  ],
  'exam.completed': [
    `${TUTORIAL_SERVICE}/api/workers/exam-completed`,
    `${NOTIFICATION_SERVICE}/api/workers/exam-completed`,
    `${STUDENT_FACULTY_SERVICE}/api/workers/exam-completed`,
    `${PLACEMENT_SERVICE}/api/workers/exam-completed`,
  ],
  'payment.received': [
    `${STUDENT_FACULTY_SERVICE}/api/workers/payment-received`,
    `${NOTIFICATION_SERVICE}/api/workers/payment-received`,
    `${CRM_SERVICE}/api/workers/payment-received`,
  ],
  'certificate.issued': [
    `${PLACEMENT_SERVICE}/api/workers/certificate-issued`,
    `${NOTIFICATION_SERVICE}/api/workers/certificate-issued`,
  ],
  'content.approved_and_published': [
    `${TUTORIAL_SERVICE}/api/workers/index-content-vector`,
  ],
  // ... all other events
}
```

---

## Part 6: Cloudflare Workers Config

```toml
# services/api-gateway/wrangler.toml
name = "platform-api-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.routes]]
pattern = "api.realtutorialhub.com/*"
zone_name = "realtutorialhub.com"

[[env.production.routes]]
pattern = "api.skillhubcore.in/*"
zone_name = "skillhubcore.in"
```

---

## Part 7: Verification

```
□ JWT verified at edge — no service receives unverified request
□ Rate limiting: 100 req/min per IP enforced
□ CORS: only allowed origins can call API
□ X-Request-ID propagated to all downstream services
□ Admin routes require role: 'admin' in JWT claims
□ Webhook routes bypass JWT (verified by gateway secret)
□ QStash event published to all consumers for each event type
□ QStash signature verified in every consumer handler
□ Health check: GET /healthz returns 200
□ Cold start: < 50ms (Cloudflare Workers edge runtime)
```

---

*Phase: INFRA-GATEWAY | Status: Ready*
