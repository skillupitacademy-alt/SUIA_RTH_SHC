# Rate Limiting & DDoS Protection
*Phase G4: API Fortress*

## 📜 Architectural Objective
To protect the platform's API from abuse, brute-force attacks, and bot traffic by implementing tiered rate limiting on all public endpoints and adding DDoS protection at the edge.

---

## 🏗️ 1. Redis-Based Rate Limiting (Upstash)

### A. Library
- **Recommended**: `@upstash/ratelimit` — serverless-compatible, works with existing Upstash Redis.
- **Algorithm**: Sliding Window (most accurate for burst protection).

### B. Rate Limit Tiers

| Route Category | Limit | Window | Identifier |
|---|---|---|---|
| **Auth** (`/api/auth/login`, `/api/auth/signup`) | 5 requests | 1 minute | IP address |
| **Token Refresh** (`/api/auth/refresh`) | 10 requests | 1 minute | User ID |
| **Exam Submit** (`/api/quiz/submit`) | 3 requests | 1 minute | User ID |
| **Exam Start** (`/api/quiz/start`) | 5 requests | 5 minutes | User ID |
| **Admin API** (`/api/admin/*`) | 30 requests | 1 minute | User ID |
| **Analytics** (`/api/analytics/*`) | 20 requests | 1 minute | User ID |
| **General API** (all other routes) | 60 requests | 1 minute | IP + User ID |

### C. Implementation
- **Middleware Approach**: Create a `rateLimitMiddleware` function that wraps route handlers.
- **Response**: Return `429 Too Many Requests` with `Retry-After` header.
- **Bypass**: Allow bypass for health checks and internal CRON routes via a shared secret.

---

## 🛡️ 2. Brute-Force Protection

### A. Login Attempts
- **Strategy**: Progressive lockout.
  - After 5 failed logins: 15-minute cooldown.
  - After 10 failed logins: 1-hour lockdown + email notification to user.
  - After 20 failed logins: Account locked until manual reset.
- **Tracking**: Use `login_attempts` table (already exists) + Redis counter for real-time checks.

### B. Password Reset
- **Limit**: 3 reset requests per email per hour.
- **Action**: Silently accept requests after limit (don't reveal whether email exists).

---

## 🌐 3. Edge-Level DDoS Protection

### A. Vercel Firewall (WAF)
- **Action**: Enable Vercel's built-in WAF rules for:
  - SQL injection patterns
  - XSS payloads
  - Bot traffic signatures
- **Custom Rules**: Block IPs that exceed 100 requests/10 seconds.

### B. Cloudflare (Optional Layer)
- **If applicable**: Configure Cloudflare as DNS proxy with:
  - Under Attack Mode (manual toggle during surges)
  - Bot Fight Mode
  - JavaScript challenge for suspicious traffic

---

## 🔧 4. Implementation Architecture

```
Request → Vercel Edge/WAF → Rate Limit Middleware → Route Handler
                                    ↓ (if exceeded)
                              429 Too Many Requests
```

### A. Rate Limit Service
```typescript
// Pseudocode
class RateLimitService {
  static async check(identifier: string, tier: RateTier): Promise<RateLimitResult>
  static async getRemaining(identifier: string, tier: RateTier): Promise<number>
  static async reset(identifier: string, tier: RateTier): Promise<void>
}
```

### B. Response Headers
Include rate limit info in every response:
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when window resets

---

## 🛡️ Implementation Checklist
- [ ] Install `@upstash/ratelimit`
- [ ] Create `RateLimitService` with configurable tiers
- [ ] Apply rate limiting to auth routes (login, signup, refresh)
- [ ] Apply rate limiting to exam routes (start, submit)
- [ ] Apply rate limiting to admin API routes
- [ ] Implement progressive login lockout
- [ ] Add rate limit headers to all responses
- [ ] Configure Vercel WAF rules
- [ ] Add monitoring/alerting for rate limit triggers
- [ ] Create bypass mechanism for CRON/internal routes

---

## 📈 Impact
Without rate limiting, a single bad actor can crash your platform by hammering the login endpoint or exhaust your Vercel function execution quota ($$$). This phase makes the API **self-defending**.

*Document Version: 1.0*
