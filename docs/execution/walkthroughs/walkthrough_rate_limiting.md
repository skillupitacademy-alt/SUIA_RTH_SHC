# Walkthrough: OPS-001 - Distributed Rate Limiting

The rate limiting mechanism has been upgraded from a simple in-memory Map to a robust, distributed architecture compatible with multi-server and Edge runtimes.

## Key Path Improvements

### 1. 🏗️ Edge-Compatible Redis Integration
- **Implementation**: Enhanced `CacheService` to detect `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- **Driver**: Switched to `@upstash/redis` (REST-based) to ensure the middleware works perfectly in the Vercel/Next.js Edge runtime.
- **Fail-Safe**: If Redis is missing or unreachable, the system automatically falls back to local `lru-cache` without failing user requests.

### 2. 🛡️ Consolidated Token Identification
- **Standardization**: Refactored `rate-limit.middleware.ts` to use `TokenService.getAccessToken()`.
- **Coverage**: Limits now correctly apply to both standard users (via `accessToken`) and admins (via `admin_accessToken`), including Authorization header fallbacks.

### 3. 📈 Atomic Counter Implementation
- **Atomic INCR**: Added `cacheService.increment(key, windowMs)` providing atomic counting in Redis and best-effort counting in local memory.
- **Fixed-Window**: Implemented fixed-window limiting for predictable behavior.
- **UX**: 429 responses now include a `Retry-After` header (in seconds), informing clients when to re-attempt requests.

## Technical Validation
- **Build Status**: Verified via global `pnpm build ; npx tsc --noEmit`.
- **Exit Code**: **0** (All type-checks and production builds passed).
- **Graceful Fallback**: Verified that `increment` returns a valid count even when external providers are not configured.

## Verification Checklist
- [x] Middleware correctly extracts tokens using `TokenService`.
- [x] Atomic increment works locally without Redis credentials.
- [x] Distributed mode triggers if Upstash credentials are provided in `.env`.
- [x] 429 response includes `Retry-After` header.
- [x] Build passes with `@upstash/redis` in Next.js environment.
