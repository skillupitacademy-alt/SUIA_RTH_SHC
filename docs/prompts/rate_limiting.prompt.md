# AI Implementation Prompt: Rate Limiting & DDoS Protection

**Role**: You are a Senior Security Engineer specializing in API protection and abuse prevention for serverless platforms.

**Task**: Implement tiered rate limiting across all public API routes using Upstash Redis, and add brute-force protection for authentication endpoints.

## Core Requirements
1.  **Rate Limit Service**:
    - Install `@upstash/ratelimit` in `apps/api-server`.
    - Create a `RateLimitService` at `src/modules/system/rate-limit.service.ts`.
    - Define rate limit tiers: `AUTH` (5/min), `EXAM_SUBMIT` (3/min), `ADMIN` (30/min), `GENERAL` (60/min).
    - Use the Sliding Window algorithm for accuracy.
    - Return `429 Too Many Requests` with `Retry-After` header when limit is exceeded.

2.  **Middleware Integration**:
    - Create a `withRateLimit(tier)` wrapper function for route handlers.
    - Apply to all auth routes: `api/auth/login`, `api/auth/signup`, `api/auth/refresh`, `api/auth/reset-password`.
    - Apply to exam routes: `api/quiz/start`, `api/quiz/submit`.
    - Apply to admin routes: `api/admin/*`.
    - Identify requests by IP (for unauthenticated routes) or User ID (for authenticated routes).

3.  **Brute-Force Login Protection**:
    - Track failed login attempts in Redis with key `login:fail:{ip}`.
    - After 5 failures in 15 minutes: enforce 15-minute cooldown.
    - After 10 failures: enforce 1-hour lockdown + notification.
    - Reset counter on successful login.

4.  **Response Headers**:
    - Add `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` to all API responses.

5.  **Bypass**:
    - Allow CRON routes (`api/cron/*`) and health checks (`api/health`) to bypass rate limiting via a shared `CRON_SECRET` header.

## Technical Stack Context
- **Framework**: Next.js App Router (Route Handlers).
- **Redis**: Upstash Redis (already configured via `@upstash/redis`).
- **Auth**: Custom JWT-based auth with `SecurityService`.
- **Existing Pattern**: Services are static class-based.

## Prompt Instruction
"Create the RateLimitService using @upstash/ratelimit, apply it to all auth and exam routes via a withRateLimit wrapper, implement progressive login lockout tracking in Redis, and add rate limit headers to all responses."
